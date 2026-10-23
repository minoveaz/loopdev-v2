export const PLATFORM_AVATAR_REFERENCE_PREFIX = "loopdev-file://";

const FILE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface UpdatePlatformProfileInput {
  fullName?: string;
  avatarUrl?: string | null;
  expectedUserUpdatedAt?: string;
  mutationId: string;
}

export function isPlatformAvatarReference(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith(PLATFORM_AVATAR_REFERENCE_PREFIX) &&
    FILE_ID_PATTERN.test(value.slice(PLATFORM_AVATAR_REFERENCE_PREFIX.length))
  );
}

export function createPlatformAvatarReference(fileId: string): string {
  if (!FILE_ID_PATTERN.test(fileId)) {
    throw new Error("A valid private Files asset ID is required.");
  }
  return `${PLATFORM_AVATAR_REFERENCE_PREFIX}${fileId}`;
}

export function getPlatformAvatarFileId(value: string | null | undefined): string | null {
  return isPlatformAvatarReference(value)
    ? value.slice(PLATFORM_AVATAR_REFERENCE_PREFIX.length)
    : null;
}
