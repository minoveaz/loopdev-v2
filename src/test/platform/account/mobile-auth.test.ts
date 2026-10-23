import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";
import {
  mobileAuthAdapter,
  mobileTenantContextAdapter,
} from "../../../../apps/mobile/adapters/auth";
import {
  createMobileAuthStorage,
  MobileAuthStorageError,
} from "../../../../apps/mobile/adapters/mobile-auth-storage-core";

const clientMock = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUser: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  mfa: {
    listFactors: vi.fn(),
    getAuthenticatorAssuranceLevel: vi.fn(),
    enroll: vi.fn(),
    challengeAndVerify: vi.fn(),
    unenroll: vi.fn(),
  },
  from: vi.fn(),
  membershipRows: [] as unknown[],
  permissionRows: [] as unknown[],
  membershipError: null as unknown,
  permissionError: null as unknown,
  queries: [] as TableQuery[],
}));

vi.mock("../../../../apps/mobile/adapters/supabase", () => ({
  mobileSupabaseClient: {
    auth: {
      getSession: clientMock.getSession,
      getUser: clientMock.getUser,
      signInWithPassword: clientMock.signInWithPassword,
      signOut: clientMock.signOut,
      resetPasswordForEmail: clientMock.resetPasswordForEmail,
      updateUser: clientMock.updateUser,
      mfa: clientMock.mfa,
    },
    from: clientMock.from,
  },
}));

type QueryResult = { data: unknown[]; error: unknown };

class TableQuery implements PromiseLike<QueryResult> {
  readonly filters: Array<[string, unknown]> = [];

  constructor(private readonly result: QueryResult) {}

  select(): this {
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push([column, value]);
    return this;
  }

  in(column: string, values: readonly string[]): this {
    this.filters.push([column, values]);
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

function createSession(userId = "user-1"): Session {
  return {
    access_token: "access-token",
    refresh_token: "refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: 1_800_000_000,
    user: {
      id: userId,
      app_metadata: { role: "owner" },
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-10-11T10:00:00.000Z",
      updated_at: "2026-10-11T10:00:00.000Z",
      email: "user@example.test",
    },
  } as Session;
}

function activeAgentMembership() {
  return {
    organization_id: "org-1",
    role: "agent",
    status: "active",
    organizations: {
      id: "org-1",
      name: "Example Org",
      slug: "example-org",
      created_at: "2026-10-01T10:00:00.000Z",
      is_active: true,
    },
  };
}

function setQueryResponses(): void {
  clientMock.queries = [];
  clientMock.from.mockImplementation((table: string) => {
    const result =
      table === "organization_memberships"
        ? { data: clientMock.membershipRows, error: clientMock.membershipError }
        : { data: clientMock.permissionRows, error: clientMock.permissionError };
    const query = new TableQuery(result);
    clientMock.queries.push(query);
    return query;
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  clientMock.membershipRows = [activeAgentMembership()];
  clientMock.permissionRows = [{ role: "agent", permission_key: "crm.read" }];
  clientMock.membershipError = null;
  clientMock.permissionError = null;
  clientMock.getSession.mockResolvedValue({ data: { session: null }, error: null });
  clientMock.getUser.mockResolvedValue({ data: { user: createSession().user }, error: null });
  clientMock.signInWithPassword.mockResolvedValue({ data: { session: createSession() }, error: null });
  clientMock.signOut.mockResolvedValue({ error: null });
  clientMock.resetPasswordForEmail.mockResolvedValue({ error: null });
  clientMock.updateUser.mockResolvedValue({ error: null });
  clientMock.mfa.listFactors.mockResolvedValue({ data: { all: [] }, error: null });
  clientMock.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
    data: { currentLevel: "aal1", nextLevel: "aal1" },
    error: null,
  });
  clientMock.mfa.enroll.mockResolvedValue({
    data: { id: "factor-1", type: "totp", totp: { qr_code: "qr", secret: "secret", uri: "otpauth://totp/test" } },
    error: null,
  });
  clientMock.mfa.challengeAndVerify.mockResolvedValue({ data: {}, error: null });
  clientMock.mfa.unenroll.mockImplementation(async ({ factorId }: { factorId: string }) => ({
    data: { id: factorId },
    error: null,
  }));
  setQueryResponses();
});

afterEach(async () => {
  clientMock.signOut.mockResolvedValue({ error: null });
  await mobileAuthAdapter.signOut();
});

describe("mobile authentication storage", () => {
  it("uses native secure storage and does not fall back to an in-memory store", async () => {
    const secureStore = {
      getItemAsync: vi.fn().mockResolvedValue("stored-token"),
      setItemAsync: vi.fn().mockResolvedValue(undefined),
      deleteItemAsync: vi.fn().mockResolvedValue(undefined),
    };
    const browserStorage = vi.fn(() => {
      throw new Error("Browser storage must not be used on native.");
    });
    const storage = createMobileAuthStorage("ios", secureStore, browserStorage);

    await storage.setItem("auth-key", "token");
    expect(await storage.getItem("auth-key")).toBe("stored-token");
    await storage.removeItem("auth-key");
    expect(secureStore.setItemAsync).toHaveBeenCalledWith("auth-key", "token");
    expect(secureStore.getItemAsync).toHaveBeenCalledWith("auth-key");
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith("auth-key");
    expect(browserStorage).not.toHaveBeenCalled();
  });

  it("surfaces native secure-storage failures", async () => {
    const secureStore = {
      getItemAsync: vi.fn().mockResolvedValue(null),
      setItemAsync: vi.fn().mockRejectedValue(new Error("Keychain unavailable")),
      deleteItemAsync: vi.fn().mockResolvedValue(undefined),
    };
    const storage = createMobileAuthStorage("ios", secureStore, () => {
      throw new Error("Browser storage must not be used on native.");
    });

    await expect(storage.setItem("auth-key", "token")).rejects.toBeInstanceOf(MobileAuthStorageError);
  });

  it("uses browser storage only for the Expo Web target", async () => {
    const secureStore = {
      getItemAsync: vi.fn().mockResolvedValue(null),
      setItemAsync: vi.fn().mockResolvedValue(undefined),
      deleteItemAsync: vi.fn().mockResolvedValue(undefined),
    };
    const browserStore = {
      getItem: vi.fn().mockReturnValue("web-token"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    const storage = createMobileAuthStorage("web", secureStore, () => browserStore);

    expect(await storage.getItem("auth-key")).toBe("web-token");
    await storage.setItem("auth-key", "next-token");
    await storage.removeItem("auth-key");
    expect(browserStore.setItem).toHaveBeenCalledWith("auth-key", "next-token");
    expect(browserStore.removeItem).toHaveBeenCalledWith("auth-key");
    expect(secureStore.getItemAsync).not.toHaveBeenCalled();
  });
});

describe("mobile AuthPort", () => {
  it("uses active server memberships and role permissions instead of promoting every user to admin", async () => {
    const result = await mobileAuthAdapter.signInWithPassword({
      email: "user@example.test",
      password: "password",
    });

    expect(result.success).toBe(true);
    expect(mobileTenantContextAdapter.getTenantContext()).toMatchObject({
      activeOrganizationId: "org-1",
      userRole: "agent",
      permissions: ["crm.read"],
      isSuperAdmin: false,
    });
    expect(clientMock.queries[0].filters).toEqual([
      ["user_id", "user-1"],
      ["status", "active"],
      ["organizations.is_active", true],
    ]);
  });

  it("does not infer organization ownership from the Auth user role claim", async () => {
    clientMock.membershipRows = [];
    setQueryResponses();

    const result = await mobileAuthAdapter.signInWithPassword({
      email: "user@example.test",
      password: "password",
    });

    expect(result.success).toBe(true);
    expect(mobileTenantContextAdapter.getTenantContext()).toBeNull();
  });

  it("rejects unknown server membership roles instead of assigning a permissive fallback", async () => {
    clientMock.membershipRows = [{ ...activeAgentMembership(), role: "unexpected" }];
    setQueryResponses();

    const result = await mobileAuthAdapter.signInWithPassword({
      email: "user@example.test",
      password: "password",
    });

    expect(result).toMatchObject({ success: false, error: { code: "AUTH_NETWORK_ERROR" } });
    expect(mobileTenantContextAdapter.getTenantContext()).toBeNull();
  });

  it("returns provider-confirmed password recovery results and surfaces provider errors", async () => {
    const success = await mobileAuthAdapter.requestPasswordReset({ email: "user@example.test" });
    expect(success).toMatchObject({
      success: true,
      data: { sent: true, deliveryChannel: "provider" },
    });
    expect(clientMock.resetPasswordForEmail).toHaveBeenCalledWith("user@example.test");

    clientMock.resetPasswordForEmail.mockResolvedValue({ error: new Error("Mail provider unavailable") });
    const failure = await mobileAuthAdapter.requestPasswordReset({ email: "user@example.test" });
    expect(failure).toMatchObject({
      success: false,
      error: { code: "AUTH_EMAIL_SERVICE_UNAVAILABLE", message: "Mail provider unavailable" },
    });
  });

  it("updates passwords through the provider and surfaces update failures", async () => {
    expect(await mobileAuthAdapter.updatePassword({ newPassword: "a-strong-password" })).toEqual({
      success: true,
      data: undefined,
    });
    expect(clientMock.updateUser).toHaveBeenCalledWith({ password: "a-strong-password" });

    clientMock.updateUser.mockResolvedValue({ error: { code: "weak_password", message: "Password is too weak." } });
    expect(await mobileAuthAdapter.updatePassword({ newPassword: "another-strong-password" })).toMatchObject({
      success: false,
      error: { code: "AUTH_WEAK_PASSWORD", message: "Password is too weak." },
    });
    expect(await mobileAuthAdapter.updatePassword({ newPassword: "123" })).toMatchObject({
      success: false,
      error: { code: "AUTH_WEAK_PASSWORD", message: "Password must be at least 6 characters." },
    });
  });

  it("returns authenticated, provider-confirmed Security status without exposing non-TOTP factors", async () => {
    await mobileAuthAdapter.signInWithPassword({ email: "user@example.test", password: "password" });
    clientMock.mfa.listFactors.mockResolvedValue({
      data: {
        all: [
          { id: "totp-1", factor_type: "totp", status: "verified", friendly_name: "Authenticator", created_at: "2026-10-01", updated_at: "2026-10-02" },
          { id: "phone-1", factor_type: "phone", status: "verified", friendly_name: "Phone", created_at: "2026-10-01", updated_at: "2026-10-02" },
        ],
      },
      error: null,
    });
    clientMock.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: "aal2", nextLevel: "aal2" },
      error: null,
    });
    clientMock.getUser.mockResolvedValue({
      data: { user: { ...createSession().user, email_confirmed_at: "2026-10-01", new_email: "next@example.test" } },
      error: null,
    });

    expect(await mobileAuthAdapter.getSecurityStatus()).toMatchObject({
      success: true,
      data: {
        userId: "user-1",
        email: "user@example.test",
        emailVerified: true,
        pendingEmailChange: "next@example.test",
        currentAssuranceLevel: "aal2",
        nextAssuranceLevel: "aal2",
        mfaFactors: [{ id: "totp-1", type: "totp", status: "verified", friendlyName: "Authenticator" }],
        signOutOtherSessionsAvailable: true,
      },
    });
  });

  it("requests email changes for the authenticated user and keeps confirmation pending", async () => {
    await mobileAuthAdapter.signInWithPassword({ email: "user@example.test", password: "password" });
    const user = createSession().user;
    clientMock.getUser.mockResolvedValue({ data: { user }, error: null });
    clientMock.updateUser.mockResolvedValue({
      data: { user: { ...user, new_email: "next@example.test" } },
      error: null,
    });

    expect(await mobileAuthAdapter.requestEmailChange({ newEmail: " next@example.test " })).toMatchObject({
      success: true,
      data: {
        currentEmail: "user@example.test",
        newEmail: "next@example.test",
        status: "pending_confirmation",
      },
    });
    expect(clientMock.updateUser).toHaveBeenCalledWith({ email: "next@example.test" });

    expect(await mobileAuthAdapter.requestEmailChange({ newEmail: "invalid-email" })).toMatchObject({
      success: false,
      error: { code: "AUTH_VALIDATION_ERROR" },
    });
  });

  it("enrolls, verifies and removes only the authenticated user's TOTP factor", async () => {
    await mobileAuthAdapter.signInWithPassword({ email: "user@example.test", password: "password" });
    const user = createSession().user;
    clientMock.getUser.mockResolvedValue({ data: { user }, error: null });
    clientMock.mfa.listFactors.mockResolvedValue({
      data: { all: [{ id: "totp-1", factor_type: "totp", status: "unverified" }] },
      error: null,
    });
    clientMock.getSession.mockResolvedValue({ data: { session: createSession() }, error: null });

    expect(await mobileAuthAdapter.beginTotpEnrollment({ friendlyName: "Personal authenticator" })).toMatchObject({
      success: true,
      data: { factorId: "factor-1", qrCode: "qr", secret: "secret", uri: "otpauth://totp/test" },
    });
    expect(clientMock.mfa.enroll).toHaveBeenCalledWith({
      factorType: "totp",
      friendlyName: "Personal authenticator",
    });
    expect(await mobileAuthAdapter.verifyTotp({ factorId: "totp-1", code: "123456" })).toEqual({
      success: true,
      data: undefined,
    });
    expect(clientMock.mfa.challengeAndVerify).toHaveBeenCalledWith({ factorId: "totp-1", code: "123456" });
    expect(await mobileAuthAdapter.removeTotpFactor({ factorId: "totp-1" })).toEqual({
      success: true,
      data: undefined,
    });
    expect(clientMock.mfa.unenroll).toHaveBeenCalledWith({ factorId: "totp-1" });
  });

  it("maps provider step-up requirements and rejects factors outside the active account", async () => {
    await mobileAuthAdapter.signInWithPassword({ email: "user@example.test", password: "password" });
    clientMock.mfa.listFactors.mockResolvedValue({
      data: { all: [{ id: "factor-other-user", factor_type: "totp", status: "verified" }] },
      error: null,
    });

    expect(await mobileAuthAdapter.verifyTotp({ factorId: "unknown-factor", code: "123456" })).toMatchObject({
      success: false,
      error: { code: "AUTH_MFA_FACTOR_NOT_FOUND" },
    });

    clientMock.mfa.unenroll.mockResolvedValue({
      data: null,
      error: { code: "insufficient_aal", message: "Additional authentication required." },
    });
    expect(await mobileAuthAdapter.removeTotpFactor({ factorId: "factor-other-user" })).toMatchObject({
      success: false,
      error: { code: "AUTH_REAUTH_REQUIRED" },
    });
  });

  it("updates canonical profile metadata and rejects external avatar URLs", async () => {
    await mobileAuthAdapter.signInWithPassword({ email: "user@example.test", password: "password" });
    const providerUser = createSession().user;
    clientMock.getUser.mockResolvedValue({ data: { user: providerUser }, error: null });
    clientMock.updateUser.mockResolvedValue({
      data: {
        user: {
          ...providerUser,
          user_metadata: { ...providerUser.user_metadata, full_name: "Ada Lovelace" },
          updated_at: "2026-10-11T12:00:00.000Z",
        },
      },
      error: null,
    });

    expect(await mobileAuthAdapter.updateProfile({
      fullName: "Ada Lovelace",
      mutationId: "profile-mutation-1",
    })).toMatchObject({
      success: true,
      data: { id: "user-1", fullName: "Ada Lovelace" },
    });
    expect(clientMock.updateUser).toHaveBeenCalledWith({
      data: { full_name: "Ada Lovelace" },
    });

    expect(await mobileAuthAdapter.updateProfile({
      avatarUrl: "https://cdn.example.test/avatar.png",
      mutationId: "profile-mutation-2",
    })).toMatchObject({
      success: false,
      error: { code: "AUTH_VALIDATION_ERROR" },
    });
  });

  it("does not report sign-out success when the provider rejects the request", async () => {
    await mobileAuthAdapter.signInWithPassword({ email: "user@example.test", password: "password" });
    clientMock.signOut.mockResolvedValue({ error: new Error("Remote sign-out failed") });

    expect(await mobileAuthAdapter.signOut()).toMatchObject({
      success: false,
      error: { code: "AUTH_NETWORK_ERROR", message: "Remote sign-out failed" },
    });
    expect(mobileTenantContextAdapter.getTenantContext()).not.toBeNull();
  });

  it("signs out other sessions through the provider without ending the current session", async () => {
    await mobileAuthAdapter.signInWithPassword({ email: "user@example.test", password: "password" });

    expect(await mobileAuthAdapter.signOutOtherSessions()).toEqual({
      success: true,
      data: undefined,
    });
    expect(clientMock.signOut).toHaveBeenCalledWith({ scope: "others" });
    expect(mobileTenantContextAdapter.getTenantContext()).not.toBeNull();
  });

  it("does not report other sessions signed out when the provider rejects the request", async () => {
    await mobileAuthAdapter.signInWithPassword({ email: "user@example.test", password: "password" });
    clientMock.signOut.mockResolvedValue({ error: new Error("Remote sign-out failed") });

    expect(await mobileAuthAdapter.signOutOtherSessions()).toMatchObject({
      success: false,
      error: { code: "AUTH_NETWORK_ERROR", message: "Remote sign-out failed" },
    });
    expect(mobileTenantContextAdapter.getTenantContext()).not.toBeNull();
  });

  it("surfaces session restoration errors instead of treating them as signed-out", async () => {
    clientMock.getSession.mockResolvedValue({
      data: { session: null },
      error: new Error("Secure session could not be restored"),
    });

    await expect(mobileAuthAdapter.getSession()).rejects.toThrow("Unable to restore the authentication session");
  });

  it("clears the previous tenant context when restored membership lookup fails for a new user", async () => {
    await mobileAuthAdapter.signInWithPassword({
      email: "user@example.test",
      password: "password",
    });
    clientMock.getSession.mockResolvedValue({
      data: { session: createSession("user-2") },
      error: null,
    });
    clientMock.membershipError = new Error("Membership service unavailable");
    setQueryResponses();

    await expect(mobileAuthAdapter.getSession()).rejects.toThrow("Membership service unavailable");
    expect(mobileTenantContextAdapter.getTenantContext()).toBeNull();
  });

  it("clears the previous tenant context when sign-in succeeds but membership lookup fails", async () => {
    await mobileAuthAdapter.signInWithPassword({
      email: "user@example.test",
      password: "password",
    });
    clientMock.signInWithPassword.mockResolvedValue({
      data: { session: createSession("user-2") },
      error: null,
    });
    clientMock.membershipError = new Error("Membership service unavailable");
    setQueryResponses();

    const result = await mobileAuthAdapter.signInWithPassword({
      email: "second-user@example.test",
      password: "password",
    });

    expect(result).toMatchObject({ success: false, error: { code: "AUTH_NETWORK_ERROR" } });
    expect(mobileTenantContextAdapter.getTenantContext()).toBeNull();
  });
});
