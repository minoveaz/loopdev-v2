export const USER_PREFERENCE_LANGUAGES = ["en", "es", "fr", "de", "ar", "he"] as const;
export type UserPreferenceLanguage = (typeof USER_PREFERENCE_LANGUAGES)[number];

export const USER_PREFERENCE_NOTIFICATION_CHANNELS = ["inApp", "email", "push", "sound"] as const;
export type UserPreferenceNotificationChannel = (typeof USER_PREFERENCE_NOTIFICATION_CHANNELS)[number];

export const USER_PREFERENCE_NOTIFICATION_TYPES = ["info", "success", "warning", "error"] as const;
export type UserPreferenceNotificationType = (typeof USER_PREFERENCE_NOTIFICATION_TYPES)[number];

export const USER_PREFERENCE_OPERATIONS = [
  "read_preferences",
  "change_language",
  "change_timezone",
  "change_appearance",
  "change_personal_notifications",
] as const;

export type UserPreferenceOperation = (typeof USER_PREFERENCE_OPERATIONS)[number];
export type DeviceAppearance = "light" | "dark" | "system";
export type PreferencesSyncState = "synced" | "pending_sync" | "conflict" | "forbidden" | "offline" | "error";
export type PreferencesMutationState = "draft" | "queued" | "sending" | "accepted" | "rejected" | "failed_retryable" | "failed_terminal";
export type UserPreferencesErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "PREFERENCES_VALIDATION_ERROR"
  | "PREFERENCES_VERSION_CONFLICT"
  | "PREFERENCES_IDEMPOTENCY_CONFLICT"
  | "PREFERENCES_NETWORK_ERROR";

export interface PersonalNotificationPreferences {
  channels: Record<UserPreferenceNotificationChannel, boolean>;
  types: Record<UserPreferenceNotificationType, boolean>;
}

export interface UserPreferences {
  userId: string;
  language: UserPreferenceLanguage;
  timeZone: string;
  personalNotifications: PersonalNotificationPreferences;
  version: number;
  updatedAt: string;
}

export interface UserPreferencesPatch {
  language?: UserPreferenceLanguage;
  timeZone?: string;
  personalNotifications?: {
    channels?: Partial<PersonalNotificationPreferences["channels"]>;
    types?: Partial<PersonalNotificationPreferences["types"]>;
  };
}

export interface PatchUserPreferencesInput {
  patch: UserPreferencesPatch;
  expectedVersion: number;
  mutationId: string;
}

export type UserPreferencesValidationResult =
  | { success: true; data: UserPreferencesPatch }
  | { success: false; error: { code: "PREFERENCES_VALIDATION_ERROR"; message: string } };

export function isUserPreferenceLanguage(value: unknown): value is UserPreferenceLanguage {
  return typeof value === "string" && USER_PREFERENCE_LANGUAGES.some((language) => language === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function validateBooleanPatch<T extends object>(
  value: unknown,
  allowedKeys: readonly string[],
): value is Partial<T> {
  return isRecord(value)
    && Object.keys(value).length > 0
    && hasOnlyKeys(value, allowedKeys)
    && Object.values(value).every((entry) => typeof entry === "boolean");
}

export function validateUserPreferencesPatch(value: unknown): UserPreferencesValidationResult {
  if (!isRecord(value) || !hasOnlyKeys(value, ["language", "timeZone", "personalNotifications"])) {
    return { success: false, error: { code: "PREFERENCES_VALIDATION_ERROR", message: "The preference update contains unsupported fields." } };
  }

  const patch: UserPreferencesPatch = {};
  if ("language" in value) {
    if (!isUserPreferenceLanguage(value.language)) {
      return { success: false, error: { code: "PREFERENCES_VALIDATION_ERROR", message: "Choose a supported language." } };
    }
    patch.language = value.language;
  }
  if ("timeZone" in value) {
    if (!isTimeZone(value.timeZone)) {
      return { success: false, error: { code: "PREFERENCES_VALIDATION_ERROR", message: "Choose a valid time zone." } };
    }
    patch.timeZone = value.timeZone.trim();
  }
  if ("personalNotifications" in value) {
    const notifications = value.personalNotifications;
    if (!isRecord(notifications) || !hasOnlyKeys(notifications, ["channels", "types"])) {
      return { success: false, error: { code: "PREFERENCES_VALIDATION_ERROR", message: "The notification preference update is invalid." } };
    }
    const channels = notifications.channels;
    const types = notifications.types;
    if (
      channels === undefined && types === undefined
      || channels !== undefined && !validateBooleanPatch<PersonalNotificationPreferences["channels"]>(channels, USER_PREFERENCE_NOTIFICATION_CHANNELS)
      || types !== undefined && !validateBooleanPatch<PersonalNotificationPreferences["types"]>(types, USER_PREFERENCE_NOTIFICATION_TYPES)
    ) {
      return { success: false, error: { code: "PREFERENCES_VALIDATION_ERROR", message: "Choose valid notification preferences." } };
    }
    patch.personalNotifications = {
      ...(channels === undefined ? {} : { channels }),
      ...(types === undefined ? {} : { types }),
    };
  }

  if (Object.keys(patch).length === 0) {
    return { success: false, error: { code: "PREFERENCES_VALIDATION_ERROR", message: "Change at least one preference." } };
  }
  return { success: true, data: patch };
}

export function mergeUserPreferencesPatch(
  current: UserPreferences,
  patch: UserPreferencesPatch,
): Omit<UserPreferences, "version" | "updatedAt"> {
  return {
    userId: current.userId,
    language: patch.language ?? current.language,
    timeZone: patch.timeZone ?? current.timeZone,
    personalNotifications: {
      channels: { ...current.personalNotifications.channels, ...patch.personalNotifications?.channels },
      types: { ...current.personalNotifications.types, ...patch.personalNotifications?.types },
    },
  };
}
