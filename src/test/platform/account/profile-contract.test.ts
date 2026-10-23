import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  createPlatformAvatarReference,
  getPlatformAvatarFileId,
  isPlatformAvatarReference,
} from "../../../../packages/contracts/src/account-profile";
import { SupabaseAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";

function createProviderUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    aud: "authenticated",
    role: "authenticated",
    email: "user@example.test",
    email_confirmed_at: "2026-10-01T00:00:00.000Z",
    phone: "",
    confirmation_sent_at: "",
    confirmed_at: "2026-10-01T00:00:00.000Z",
    last_sign_in_at: "2026-10-10T00:00:00.000Z",
    app_metadata: {},
    user_metadata: { full_name: "Old name", display_setting: "preserved" },
    identities: [],
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-10-01T00:00:00.000Z",
    is_anonymous: false,
    ...overrides,
  };
}

function createAdapter(user: User) {
  const auth = {
    onAuthStateChange: vi.fn(),
    getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    updateUser: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      data: { user: { ...user, user_metadata: data, updated_at: "2026-10-11T00:00:00.000Z" } },
      error: null,
    })),
  };
  const client = { auth } as unknown as SupabaseClient;
  return { adapter: new SupabaseAuthAdapter({ supabaseClient: client }), auth };
}

describe("PlatformUser profile contract", () => {
  it("encodes only opaque UUID references to private Files assets", () => {
    const reference = createPlatformAvatarReference("6a7876f0-1e8f-49e4-b843-147c350c96cc");

    expect(isPlatformAvatarReference(reference)).toBe(true);
    expect(getPlatformAvatarFileId(reference)).toBe("6a7876f0-1e8f-49e4-b843-147c350c96cc");
    expect(isPlatformAvatarReference("https://cdn.example.test/avatar.png")).toBe(false);
    expect(getPlatformAvatarFileId("https://cdn.example.test/avatar.png")).toBeNull();
  });

  it("updates only the authenticated user's canonical profile metadata", async () => {
    const { adapter, auth } = createAdapter(createProviderUser());

    const result = await adapter.updateProfile({
      fullName: "  Ada Lovelace  ",
      expectedUserUpdatedAt: "2026-10-01T00:00:00.000Z",
      mutationId: "mutation-1",
    });

    expect(result).toMatchObject({ success: true, data: { id: "user-1", fullName: "Ada Lovelace" } });
    expect(auth.updateUser).toHaveBeenCalledWith({
      data: { full_name: "Ada Lovelace", display_setting: "preserved" },
    });
  });

  it("rejects external avatar URLs and stale profile versions", async () => {
    const { adapter, auth } = createAdapter(createProviderUser());

    expect(await adapter.updateProfile({
      avatarUrl: "https://cdn.example.test/avatar.png",
      mutationId: "mutation-2",
    })).toMatchObject({ success: false, error: { code: "AUTH_VALIDATION_ERROR" } });
    expect(await adapter.updateProfile({
      fullName: "New name",
      expectedUserUpdatedAt: "2025-01-01T00:00:00.000Z",
      mutationId: "mutation-3",
    })).toMatchObject({ success: false, error: { code: "AUTH_VERSION_CONFLICT" } });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
});
