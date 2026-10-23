import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { SupabaseAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    aud: "authenticated",
    role: "authenticated",
    email: "user@example.test",
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-10T00:00:00.000Z",
    is_anonymous: false,
    ...overrides,
  } as User;
}

function createAdapter(user = createUser()) {
  const auth = {
    onAuthStateChange: vi.fn(),
    getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: "active-token", user } }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    mfa: {
      listFactors: vi.fn().mockResolvedValue({ data: { all: [] }, error: null }),
      getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
        data: { currentLevel: "aal1", nextLevel: "aal1" },
        error: null,
      }),
      enroll: vi.fn().mockResolvedValue({
        data: { id: "factor-1", type: "totp", totp: { qr_code: "qr", secret: "secret", uri: "otpauth://totp/test" } },
        error: null,
      }),
      challengeAndVerify: vi.fn().mockResolvedValue({ data: {}, error: null }),
      unenroll: vi.fn().mockImplementation(async ({ factorId }: { factorId: string }) => ({ data: { id: factorId }, error: null })),
    },
  };
  const client = { auth } as unknown as SupabaseClient;
  return { adapter: new SupabaseAuthAdapter({ supabaseClient: client }), auth };
}

describe("Auth security contract", () => {
  it("returns only authenticated-user security state and TOTP factors", async () => {
    const { adapter, auth } = createAdapter(createUser({
      email_confirmed_at: "2026-10-01T00:00:00.000Z",
      new_email: "next@example.test",
    }));
    auth.mfa.listFactors.mockResolvedValue({
      data: {
        all: [
          { id: "totp-1", factor_type: "totp", status: "verified", friendly_name: "Authenticator" },
          { id: "phone-1", factor_type: "phone", status: "verified", friendly_name: "Phone" },
        ],
      },
      error: null,
    });
    auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: "aal2", nextLevel: "aal2" },
      error: null,
    });

    expect(await adapter.getSecurityStatus()).toMatchObject({
      success: true,
      data: {
        userId: "user-1",
        email: "user@example.test",
        emailVerified: true,
        pendingEmailChange: "next@example.test",
        mfaFactors: [{ id: "totp-1", type: "totp", status: "verified", friendlyName: "Authenticator" }],
        currentAssuranceLevel: "aal2",
        nextAssuranceLevel: "aal2",
        signOutOtherSessionsAvailable: true,
      },
    });
  });

  it("requests email change for the active subject without prematurely changing its address", async () => {
    const user = createUser({ new_email: "next@example.test" });
    const { adapter, auth } = createAdapter(user);
    auth.updateUser.mockResolvedValue({ data: { user }, error: null });

    expect(await adapter.requestEmailChange({ newEmail: " next@example.test " })).toMatchObject({
      success: true,
      data: {
        currentEmail: "user@example.test",
        newEmail: "next@example.test",
        status: "pending_confirmation",
      },
    });
    expect(auth.updateUser).toHaveBeenCalledWith({ email: "next@example.test" });
    expect(await adapter.requestEmailChange({ newEmail: "invalid-email" })).toMatchObject({
      success: false,
      error: { code: "AUTH_VALIDATION_ERROR" },
    });
  });

  it("enrolls TOTP and verifies only a factor belonging to the authenticated user", async () => {
    const { adapter, auth } = createAdapter();
    auth.mfa.listFactors.mockResolvedValue({
      data: { all: [{ id: "totp-1", factor_type: "totp", status: "unverified" }] },
      error: null,
    });

    expect(await adapter.beginTotpEnrollment({ friendlyName: "Authenticator" })).toMatchObject({
      success: true,
      data: { factorId: "factor-1", qrCode: "qr", secret: "secret", uri: "otpauth://totp/test" },
    });
    expect(auth.mfa.enroll).toHaveBeenCalledWith({ factorType: "totp", friendlyName: "Authenticator" });

    expect(await adapter.verifyTotp({ factorId: "missing", code: "123456" })).toMatchObject({
      success: false,
      error: { code: "AUTH_MFA_FACTOR_NOT_FOUND" },
    });
    expect(auth.mfa.challengeAndVerify).not.toHaveBeenCalled();

    expect(await adapter.verifyTotp({ factorId: "totp-1", code: "123456" })).toEqual({
      success: true,
      data: undefined,
    });
    expect(auth.mfa.challengeAndVerify).toHaveBeenCalledWith({ factorId: "totp-1", code: "123456" });
  });

  it("surfaces provider step-up requirements when removing TOTP", async () => {
    const { adapter, auth } = createAdapter();
    auth.mfa.listFactors.mockResolvedValue({
      data: { all: [{ id: "totp-1", factor_type: "totp", status: "verified" }] },
      error: null,
    });
    auth.mfa.unenroll.mockResolvedValue({
      data: null,
      error: { code: "insufficient_aal", message: "Additional authentication required." },
    });

    expect(await adapter.removeTotpFactor({ factorId: "totp-1" })).toMatchObject({
      success: false,
      error: { code: "AUTH_REAUTH_REQUIRED" },
    });
  });

  it("changes passwords only for an authenticated subject and maps provider step-up errors", async () => {
    const { adapter, auth } = createAdapter();
    auth.updateUser.mockResolvedValue({
      data: { user: null },
      error: { code: "insufficient_aal", message: "Additional authentication required." },
    });

    expect(await adapter.updatePassword({ newPassword: "a-strong-password" })).toMatchObject({
      success: false,
      error: { code: "AUTH_REAUTH_REQUIRED" },
    });
    expect(auth.getUser).toHaveBeenCalledOnce();
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "a-strong-password" });
  });

  it("uses only provider-scoped sign-out-other-sessions and leaves the active session intact", async () => {
    const { adapter, auth } = createAdapter();

    expect(await adapter.signOutOtherSessions()).toEqual({ success: true, data: undefined });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "others" });
    expect(auth.signOut).not.toHaveBeenCalledWith({});
  });
});
