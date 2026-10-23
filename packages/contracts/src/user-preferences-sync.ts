import {
  USER_PREFERENCE_LANGUAGES,
  USER_PREFERENCE_NOTIFICATION_CHANNELS,
  USER_PREFERENCE_NOTIFICATION_TYPES,
  mergeUserPreferencesPatch,
  validateUserPreferencesPatch,
  type PatchUserPreferencesInput,
  type UserPreferences,
  type UserPreferencesErrorCode,
  type UserPreferenceLanguage,
  type UserPreferencesPatch,
} from "./user-preferences";

export interface UserPreferencesQueueRecord {
  userId: string;
  expectedVersion: number;
  mutationId: string;
  patch: UserPreferencesPatch;
  createdAt: string;
  state: "queued" | "failed_retryable";
}

export interface UserPreferencesQueueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export type UserPreferencesSyncResult =
  | { success: true; state: "synced"; preferences: UserPreferences }
  | { success: true; state: "offline"; preferences: UserPreferences; message: string }
  | { success: true; state: "pending_sync"; preferences?: UserPreferences; mutationId: string; message?: string }
  | {
    success: false;
    state: "conflict";
    latest: UserPreferences;
    attemptedPatch: UserPreferencesPatch;
    error: { code: "PREFERENCES_VERSION_CONFLICT"; message: string };
  }
  | { success: false; state: "forbidden" | "error"; error: { code: UserPreferencesErrorCode; message: string } };

interface PreferencesRpcResult {
  success?: boolean;
  preferences?: UserPreferences;
  state?: "conflict";
  latest?: UserPreferences;
  error?: { code?: UserPreferencesErrorCode; message?: string };
}

const queueKey = (userId: string) => `loopdev:user-preferences:queue:${userId}`;
const cacheKey = (userId: string) => `loopdev:user-preferences:cache:${userId}`;

export interface UserPreferencesProviderClient {
  auth: {
    getUser(): Promise<{
      data: { user: { id: string } | null };
      error: unknown;
    }>;
    getSession(): Promise<{
      data: { session: { user: { id: string } } | null };
      error: unknown;
    }>;
  };
  rpc(
    functionName: string,
    args?: Record<string, unknown>,
  ): Promise<{ data: unknown; error: unknown }>;
}

function isQueueRecord(value: unknown, userId: string): value is UserPreferencesQueueRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<UserPreferencesQueueRecord>;
  return record.userId === userId
    && typeof record.expectedVersion === "number"
    && typeof record.mutationId === "string"
    && typeof record.createdAt === "string"
    && (record.state === "queued" || record.state === "failed_retryable")
    && validateUserPreferencesPatch(record.patch).success;
}

function isPreferences(value: unknown, userId: string): value is UserPreferences {
  if (!value || typeof value !== "object") return false;
  const preferences = value as Partial<UserPreferences>;
  if (
    preferences.userId !== userId
    || !Number.isSafeInteger(preferences.version)
    || (preferences.version ?? -1) < 0
    || typeof preferences.updatedAt !== "string"
    || !Number.isFinite(Date.parse(preferences.updatedAt))
    || !preferences.personalNotifications
  ) return false;

  const channels = preferences.personalNotifications.channels;
  const types = preferences.personalNotifications.types;
  return validateUserPreferencesPatch({
    language: preferences.language,
    timeZone: preferences.timeZone,
    personalNotifications: preferences.personalNotifications,
  }).success
    && !!channels
    && USER_PREFERENCE_NOTIFICATION_CHANNELS.every((key) => typeof channels[key] === "boolean")
    && Object.keys(channels).length === USER_PREFERENCE_NOTIFICATION_CHANNELS.length
    && !!types
    && USER_PREFERENCE_NOTIFICATION_TYPES.every((key) => typeof types[key] === "boolean")
    && Object.keys(types).length === USER_PREFERENCE_NOTIFICATION_TYPES.length
    && USER_PREFERENCE_LANGUAGES.includes(preferences.language as typeof USER_PREFERENCE_LANGUAGES[number]);
}

function providerError(error: unknown): { code: UserPreferencesErrorCode; message: string } {
  const details = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const message = typeof details.message === "string" ? details.message : "Preferences request failed.";
  const status = typeof details.status === "number" ? details.status : 0;
  const code: UserPreferencesErrorCode = status === 401
    ? "UNAUTHENTICATED"
    : status === 403
      ? "FORBIDDEN"
    : message.toLowerCase().includes("fetch")
      ? "PREFERENCES_NETWORK_ERROR"
      : "PREFERENCES_NETWORK_ERROR";
  return { code, message };
}

function rpcError(value: PreferencesRpcResult): { code: UserPreferencesErrorCode; message: string } {
  const code = value.error?.code;
  const allowed: UserPreferencesErrorCode[] = [
    "UNAUTHENTICATED",
    "FORBIDDEN",
    "PREFERENCES_VALIDATION_ERROR",
    "PREFERENCES_VERSION_CONFLICT",
    "PREFERENCES_IDEMPOTENCY_CONFLICT",
    "PREFERENCES_NETWORK_ERROR",
  ];
  return {
    code: code && allowed.includes(code) ? code : "PREFERENCES_NETWORK_ERROR",
    message: value.error?.message ?? "Preferences request failed.",
  };
}

export class UserPreferencesSyncAdapter {
  constructor(
    private readonly client: UserPreferencesProviderClient,
    private readonly storage: UserPreferencesQueueStorage,
    private readonly now: () => Date = () => new Date(),
    private readonly createMutationId: () => string = () => crypto.randomUUID(),
  ) {}

  async read(initialLanguage: UserPreferenceLanguage = "en"): Promise<UserPreferencesSyncResult> {
    let userId: string | null;
    try {
      userId = await this.sessionUserId();
    } catch (error) {
      return this.failureFromProvider(error);
    }
    if (!userId) return this.failure("UNAUTHENTICATED", "Sign in to read account preferences.");
    const { data, error } = await this.client.rpc("get_user_preferences", {
      p_initial_language: initialLanguage,
    });
    if (error) {
      const mapped = providerError(error);
      if (mapped.code === "PREFERENCES_NETWORK_ERROR") {
        const cached = await this.readCache(userId);
        if (cached) {
          return {
            success: true,
            state: "offline",
            preferences: cached,
            message: "Showing the last confirmed preferences while offline.",
          };
        }
      }
      return this.failure(mapped.code, mapped.message);
    }
    const result = data as PreferencesRpcResult;
    if (!result.success || !result.preferences) {
      const mapped = rpcError(result);
      if (mapped.code === "PREFERENCES_NETWORK_ERROR") {
        const cached = await this.readCache(userId);
        if (cached) {
          return {
            success: true,
            state: "offline",
            preferences: cached,
            message: "Showing the last confirmed preferences while offline.",
          };
        }
      }
      return this.failure(mapped.code, mapped.message);
    }
    if (!isPreferences(result.preferences, userId)) {
      return this.failure("PREFERENCES_VALIDATION_ERROR", "The server returned invalid account preferences.");
    }
    await this.writeCache(result.preferences);
    return { success: true, state: "synced", preferences: result.preferences };
  }

  async patch(input: PatchUserPreferencesInput): Promise<UserPreferencesSyncResult> {
    const mutationId = input.mutationId || this.createMutationId();
    const validation = validateUserPreferencesPatch(input.patch);
    if (validation.success === false) {
      return this.failure("PREFERENCES_VALIDATION_ERROR", validation.error.message);
    }
    if (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 0) {
      return this.failure("PREFERENCES_VALIDATION_ERROR", "The preference version is invalid.");
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mutationId)) {
      return this.failure("PREFERENCES_VALIDATION_ERROR", "The preference mutation ID is invalid.");
    }
    const userId = await this.sessionUserId();
    if (!userId) return this.failure("UNAUTHENTICATED", "Sign in to change account preferences.");

    const queued = await this.readQueue(userId);
    if (queued) {
      if (queued.state === "failed_retryable") {
        return this.failure("PREFERENCES_NETWORK_ERROR", "Retry or discard the pending preference change before editing it.");
      }
      const nextPatch = { ...queued.patch, ...validation.data };
      if (validation.data.personalNotifications) {
        const prior = queued.patch.personalNotifications;
        nextPatch.personalNotifications = {
          ...prior,
          ...validation.data.personalNotifications,
          channels: {
            ...prior?.channels,
            ...validation.data.personalNotifications.channels,
          },
          types: {
            ...prior?.types,
            ...validation.data.personalNotifications.types,
          },
        };
      }
      queued.patch = nextPatch;
      await this.writeQueue(queued);
      return this.pendingResult(userId, queued);
    }

    const record: UserPreferencesQueueRecord = {
      userId,
      expectedVersion: input.expectedVersion,
      mutationId,
      patch: validation.data,
      createdAt: this.now().toISOString(),
      state: "queued",
    };
    return this.sendOrQueue(record);
  }

  async retryPending(initialLanguage: UserPreferenceLanguage = "en"): Promise<UserPreferencesSyncResult | null> {
    const userId = await this.sessionUserId();
    if (!userId) return this.failure("UNAUTHENTICATED", "Sign in to synchronize account preferences.");
    const record = await this.readQueue(userId);
    if (!record) return null;
    let verifiedUserId: string | null;
    try {
      verifiedUserId = await this.authenticatedUserId();
    } catch (error) {
      return this.pendingResult(userId, record, providerError(error).message, initialLanguage);
    }
    if (verifiedUserId !== userId) {
      return this.failure("UNAUTHENTICATED", "Pending preferences can only sync after signing in as their original user.");
    }
    record.state = "queued";
    await this.writeQueue(record);
    return this.sendOrQueue(record, initialLanguage);
  }

  async pendingForCurrentUser(): Promise<UserPreferencesQueueRecord | null> {
    const userId = await this.sessionUserId();
    return userId ? this.readQueue(userId) : null;
  }

  async discardPending(): Promise<void> {
    const userId = await this.sessionUserId();
    if (userId) await this.storage.removeItem(queueKey(userId));
  }

  private async sendOrQueue(
    record: UserPreferencesQueueRecord,
    initialLanguage: UserPreferenceLanguage = "en",
  ): Promise<UserPreferencesSyncResult> {
    const currentUserId = await this.sessionUserId();
    if (currentUserId !== record.userId) {
      return this.failure("UNAUTHENTICATED", "Pending preferences can only sync after signing in as their original user.");
    }
    await this.writeQueue(record);
    const { data, error } = await this.client.rpc("patch_user_preferences", {
      expected_user_id: record.userId,
      expected_version: record.expectedVersion,
      p_mutation_id: record.mutationId,
      preference_patch: record.patch,
    });
    if (error) {
      const mapped = providerError(error);
      record.state = "failed_retryable";
      await this.writeQueue(record);
      return this.pendingResult(record.userId, record, mapped.message, initialLanguage);
    }
    const result = data as PreferencesRpcResult;
    if (result.success && result.preferences) {
      if (!isPreferences(result.preferences, record.userId)) {
        record.state = "failed_retryable";
        await this.writeQueue(record);
        return this.pendingResult(record.userId, record, "The server returned invalid account preferences.");
      }
      await this.writeCache(result.preferences);
      await this.storage.removeItem(queueKey(record.userId));
      return { success: true, state: "synced", preferences: result.preferences };
    }
    const mapped = rpcError(result);
    if (result.state === "conflict" && result.latest) {
      if (!isPreferences(result.latest, record.userId)) {
        return this.failure("PREFERENCES_VALIDATION_ERROR", "The server returned invalid account preferences.");
      }
      await this.writeCache(result.latest);
      await this.storage.removeItem(queueKey(record.userId));
      return {
        success: false,
        state: "conflict",
        latest: result.latest,
        attemptedPatch: record.patch,
        error: {
          code: "PREFERENCES_VERSION_CONFLICT",
          message: mapped.message,
        },
      };
    }
    if (mapped.code === "UNAUTHENTICATED" || mapped.code === "FORBIDDEN") {
      await this.storage.removeItem(queueKey(record.userId));
      return this.failure(mapped.code, mapped.message);
    }
    if (mapped.code === "PREFERENCES_VALIDATION_ERROR" || mapped.code === "PREFERENCES_IDEMPOTENCY_CONFLICT") {
      await this.storage.removeItem(queueKey(record.userId));
      return this.failure(mapped.code, mapped.message);
    }
    record.state = "failed_retryable";
    await this.writeQueue(record);
    return this.pendingResult(record.userId, record, mapped.message);
  }

  private async pendingResult(
    userId: string,
    record: UserPreferencesQueueRecord,
    message = "Preference changes are waiting for synchronization.",
    initialLanguage: UserPreferenceLanguage = "en",
  ): Promise<UserPreferencesSyncResult> {
    const { data, error } = await this.client.rpc("get_user_preferences", {
      p_initial_language: initialLanguage,
    });
    if (error) {
      const cached = await this.readCache(userId);
      if (cached) {
        return {
          success: true,
          state: "pending_sync",
          preferences: {
            ...mergeUserPreferencesPatch(cached, record.patch),
            version: cached.version,
            updatedAt: cached.updatedAt,
          },
          mutationId: record.mutationId,
          message,
        };
      }
      return { success: true, state: "pending_sync", mutationId: record.mutationId, message };
    }
    const result = data as PreferencesRpcResult;
    if (!result.success || !result.preferences || !isPreferences(result.preferences, userId)) {
      const cached = await this.readCache(userId);
      if (cached) {
        return {
          success: true,
          state: "pending_sync",
          preferences: {
            ...mergeUserPreferencesPatch(cached, record.patch),
            version: cached.version,
            updatedAt: cached.updatedAt,
          },
          mutationId: record.mutationId,
          message,
        };
      }
      return { success: true, state: "pending_sync", mutationId: record.mutationId, message };
    }
    await this.writeCache(result.preferences);
    return {
      success: true,
      state: "pending_sync",
      preferences: {
        ...mergeUserPreferencesPatch(result.preferences, record.patch),
        version: result.preferences.version,
        updatedAt: result.preferences.updatedAt,
      },
      mutationId: record.mutationId,
      message,
    };
  }

  private async authenticatedUserId(): Promise<string | null> {
    const { data, error } = await this.client.auth.getUser();
    if (error) throw error;
    return data.user?.id ?? null;
  }

  private async sessionUserId(): Promise<string | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    return data.session?.user.id ?? null;
  }

  private async readQueue(userId: string): Promise<UserPreferencesQueueRecord | null> {
    const key = queueKey(userId);
    const raw = await this.storage.getItem(key);
    if (!raw) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      await this.storage.removeItem(key);
      throw new Error("The saved preference change could not be recovered safely.");
    }
    if (!isQueueRecord(parsed, userId)) {
      await this.storage.removeItem(key);
      throw new Error("The saved preference change is invalid and was discarded.");
    }
    return parsed;
  }

  private async writeQueue(record: UserPreferencesQueueRecord): Promise<void> {
    await this.storage.setItem(queueKey(record.userId), JSON.stringify(record));
  }

  private async readCache(userId: string): Promise<UserPreferences | null> {
    const key = cacheKey(userId);
    const raw = await this.storage.getItem(key);
    if (!raw) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      await this.storage.removeItem(key);
      throw new Error("The saved account preferences could not be recovered safely.");
    }
    if (!isPreferences(parsed, userId)) {
      await this.storage.removeItem(key);
      throw new Error("The saved account preferences are invalid and were discarded.");
    }
    return parsed;
  }

  private async writeCache(preferences: UserPreferences): Promise<void> {
    await this.storage.setItem(cacheKey(preferences.userId), JSON.stringify(preferences));
  }

  private failure(code: UserPreferencesErrorCode, message: string): UserPreferencesSyncResult {
    return {
      success: false,
      state: code === "FORBIDDEN" || code === "UNAUTHENTICATED" ? "forbidden" : "error",
      error: { code, message },
    };
  }

  private failureFromProvider(error: unknown): UserPreferencesSyncResult {
    const mapped = providerError(error);
    return this.failure(mapped.code, mapped.message);
  }

  private failureFromRpc(result: PreferencesRpcResult): UserPreferencesSyncResult {
    const mapped = rpcError(result);
    return this.failure(mapped.code, mapped.message);
  }
}
