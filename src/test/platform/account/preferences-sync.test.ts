import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  UserPreferencesSyncAdapter,
  type UserPreferencesQueueStorage,
} from "../../../../packages/contracts/src/user-preferences-sync";
import {
  isUserPreferenceLanguage,
  type UserPreferenceLanguage,
  type UserPreferences,
} from "../../../../packages/contracts/src/user-preferences";

const ownerId = "00000000-0000-4000-8000-000000000011";
const otherId = "00000000-0000-4000-8000-000000000012";
const mutationId = "00000000-0000-4000-8000-000000000101";
const queueKey = `loopdev:user-preferences:queue:${ownerId}`;
const cacheKey = `loopdev:user-preferences:cache:${ownerId}`;

function preferences(
  userId = ownerId,
  version = 0,
  language: UserPreferenceLanguage = "en",
): UserPreferences {
  return {
    userId,
    language,
    timeZone: "UTC",
    personalNotifications: {
      channels: { inApp: true, email: true, push: true, sound: false },
      types: { info: true, success: true, warning: true, error: true },
    },
    version,
    updatedAt: "2026-10-12T10:00:00.000Z",
  };
}

function setup() {
  const values = new Map<string, string>();
  let activeUserId: string | null = ownerId;
  const storage: UserPreferencesQueueStorage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    removeItem: async (key) => { values.delete(key); },
  };
  const rpc = vi.fn(async (name: string, args?: Record<string, unknown>): Promise<{ data: unknown; error: unknown }> => {
    if (name === "get_user_preferences") {
      const language = isUserPreferenceLanguage(args?.p_initial_language)
        ? args.p_initial_language
        : "en";
      return { data: { success: true, preferences: preferences(activeUserId ?? ownerId, 0, language) }, error: null };
    }
    return {
      data: { success: true, preferences: { ...preferences(activeUserId ?? ownerId, 1), language: "es" } },
      error: null,
    };
  });
  const getUser = vi.fn(async () => ({
    data: { user: activeUserId ? { id: activeUserId } : null },
    error: null,
  }));
  const getSession = vi.fn(async () => ({
    data: { session: activeUserId ? { user: { id: activeUserId } } : null },
    error: null,
  }));
  const client = { auth: { getUser, getSession }, rpc };
  const adapter = new UserPreferencesSyncAdapter(
    client,
    storage,
    () => new Date("2026-10-12T10:00:00.000Z"),
    () => mutationId,
  );
  return {
    adapter,
    rpc,
    values,
    setActiveUser(id: string | null) { activeUserId = id; },
    setUserLookupError(error: unknown) { getUser.mockRejectedValue(error); },
  };
}

describe("UserPreferencesSyncAdapter", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("sends the current app language as the server's first-read initialization hint", async () => {
    const { adapter, rpc } = setup();

    const result = await adapter.read("es");

    expect(rpc).toHaveBeenCalledWith("get_user_preferences", { p_initial_language: "es" });
    expect(result).toMatchObject({ success: true, preferences: { language: "es" } });
  });

  it("persists a user-scoped mutation before sending and removes it after server acceptance", async () => {
    const { adapter, rpc, values } = setup();

    const result = await adapter.patch({
      patch: { language: "es" },
      expectedVersion: 0,
      mutationId,
    });

    expect(result).toMatchObject({ success: true, state: "synced", preferences: { language: "es", version: 1 } });
    expect(rpc).toHaveBeenCalledWith("patch_user_preferences", {
      expected_user_id: ownerId,
      expected_version: 0,
      p_mutation_id: mutationId,
      preference_patch: { language: "es" },
    });
    expect(values.has(queueKey)).toBe(false);
    expect(values.has(cacheKey)).toBe(true);
  });

  it("retains pending work after a network failure and retries it only for the original user", async () => {
    const { adapter, rpc, values, setActiveUser } = setup();
    rpc.mockImplementation(async (name: string, _args?: Record<string, unknown>) => {
      if (name === "patch_user_preferences") {
        return { data: null, error: { message: "Failed to fetch" } };
      }
      return { data: { success: true, preferences: preferences() }, error: null };
    });

    const pending = await adapter.patch({
      patch: { language: "es" },
      expectedVersion: 0,
      mutationId,
    });
    expect(pending).toMatchObject({ success: true, state: "pending_sync", preferences: { language: "es" } });
    expect(values.has(queueKey)).toBe(true);

    setActiveUser(otherId);
    expect(await adapter.retryPending()).toBeNull();
    expect(rpc).toHaveBeenCalledTimes(2);

    setActiveUser(ownerId);
    rpc.mockImplementation(async (name: string, _args?: Record<string, unknown>) => name === "patch_user_preferences"
      ? { data: { success: true, preferences: preferences(ownerId, 1) }, error: null }
      : { data: { success: true, preferences: preferences() }, error: null });
    const synced = await adapter.retryPending();
    expect(synced).toMatchObject({ success: true, state: "synced", preferences: { version: 1 } });
    expect(rpc).toHaveBeenLastCalledWith("patch_user_preferences", {
      expected_user_id: ownerId,
      expected_version: 0,
      p_mutation_id: mutationId,
      preference_patch: { language: "es" },
    });
    expect(values.has(queueKey)).toBe(false);
    expect(values.has(cacheKey)).toBe(true);
  });

  it("returns the latest server record for a same-field conflict and stops replaying it", async () => {
    const { adapter, rpc, values } = setup();
    rpc.mockImplementation(async (name: string, _args?: Record<string, unknown>) => name === "patch_user_preferences"
      ? {
        data: {
          success: false,
          state: "conflict",
          latest: preferences(ownerId, 2),
          error: { code: "PREFERENCES_VERSION_CONFLICT", message: "Changed elsewhere." },
        },
        error: null,
      }
      : { data: { success: true, preferences: preferences() }, error: null });

    const result = await adapter.patch({
      patch: { language: "es" },
      expectedVersion: 1,
      mutationId,
    });

    expect(result).toMatchObject({
      success: false,
      state: "conflict",
      latest: { version: 2 },
      attemptedPatch: { language: "es" },
      error: { code: "PREFERENCES_VERSION_CONFLICT" },
    });
    expect(values.has(queueKey)).toBe(false);
    expect(values.has(cacheKey)).toBe(true);
  });

  it("rejects malformed recovered data rather than replaying it", async () => {
    const { adapter, values } = setup();
    values.set(queueKey, JSON.stringify({
      userId: otherId,
      expectedVersion: 0,
      mutationId,
      patch: { language: "es" },
      createdAt: "2026-10-12T10:00:00.000Z",
      state: "queued",
    }));

    await expect(adapter.pendingForCurrentUser()).rejects.toThrow("invalid and was discarded");
    expect(values.size).toBe(0);
  });

  it("rejects unsupported changes before making a provider request", async () => {
    const { adapter, rpc } = setup();

    const result = await adapter.patch({
      patch: { language: "xx" as "en" },
      expectedVersion: 0,
      mutationId,
    });

    expect(result).toMatchObject({
      success: false,
      state: "error",
      error: { code: "PREFERENCES_VALIDATION_ERROR" },
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not sync if the user has signed out", async () => {
    const { adapter, setActiveUser, rpc } = setup();
    setActiveUser(null);

    const result = await adapter.patch({
      patch: { language: "es" },
      expectedVersion: 0,
      mutationId,
    });

    expect(result).toMatchObject({
      success: false,
      state: "forbidden",
      error: { code: "UNAUTHENTICATED" },
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("can queue an offline change using the locally restored Auth session", async () => {
    const { adapter, rpc, values, setUserLookupError } = setup();
    const offlineError = Object.assign(new Error("Failed to fetch"), { status: 0 });
    rpc.mockImplementation(async () => ({ data: null, error: offlineError }));
    setUserLookupError(offlineError);

    const result = await adapter.patch({
      patch: { language: "es" },
      expectedVersion: 0,
      mutationId,
    });

    expect(result).toMatchObject({ success: true, state: "pending_sync", mutationId });
    expect(values.size).toBe(1);
  });

  it("uses only the same user's last server-confirmed preferences for offline reads", async () => {
    const { adapter, rpc, values } = setup();
    await adapter.read();
    rpc.mockResolvedValue({ data: null, error: new Error("Failed to fetch") });

    const result = await adapter.read();

    expect(result).toMatchObject({
      success: true,
      state: "offline",
      preferences: { userId: ownerId, language: "en" },
    });
    expect(values.has(cacheKey)).toBe(true);
  });
});
