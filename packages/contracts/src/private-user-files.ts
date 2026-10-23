import { createPlatformAvatarReference, getPlatformAvatarFileId } from "./account-profile";

export const PROFILE_AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_AVATAR_PREVIEW_TTL_SECONDS = 300;

const PROFILE_AVATAR_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type PrivateUserFileErrorCode =
  | "FILE_VALIDATION_ERROR"
  | "FILE_SESSION_EXPIRED"
  | "FILE_NOT_FOUND"
  | "FILE_UPLOAD_FAILED"
  | "FILE_PREVIEW_FAILED"
  | "FILE_DELETE_FAILED"
  | "FILE_CLEANUP_FAILED"
  | "FILE_OPERATION_UNSUPPORTED";

export interface PrivateUserFileError {
  code: PrivateUserFileErrorCode;
  message: string;
}

export type PrivateUserFileResult<T> =
  | { success: true; data: T }
  | { success: false; error: PrivateUserFileError };

export interface UploadProfileAvatarInput {
  fileName: string;
  mediaType: string;
  content: Blob;
}

export interface PrivateUserFileAsset {
  id: string;
  reference: string;
  fileName: string;
  mediaType: string;
  byteSize: number;
}

export interface PrivateUserFilePreview {
  url: string;
  expiresAt: string;
}

export interface PrivateUserFilesPort {
  uploadProfileAvatar(input: UploadProfileAvatarInput): Promise<PrivateUserFileResult<PrivateUserFileAsset>>;
  getProfileAvatarPreview(reference: string): Promise<PrivateUserFileResult<PrivateUserFilePreview>>;
  deleteProfileAvatar(reference: string): Promise<PrivateUserFileResult<void>>;
  discardProfileAvatar(reference: string): Promise<PrivateUserFileResult<void>>;
}

export async function validateProfileAvatarUpload(
  input: UploadProfileAvatarInput,
): Promise<string | null> {
  const fileName = input.fileName.trim();
  const mediaType = input.mediaType.trim().toLowerCase();
  if (
    !fileName ||
    fileName.length > 120 ||
    /[\\/\u0000-\u001f\u007f]/.test(fileName)
  ) {
    return "Choose an image with a valid file name.";
  }
  if (!Number.isFinite(input.content.size) || input.content.size <= 0 || input.content.size > PROFILE_AVATAR_MAX_BYTES) {
    return "Avatar images must be between 1 byte and 5 MB.";
  }
  if (!PROFILE_AVATAR_MEDIA_TYPES.has(mediaType)) {
    return "Avatar images must be JPEG, PNG, or WebP.";
  }

  const header = new Uint8Array(await input.content.slice(0, 12).arrayBuffer());
  const isJpeg = mediaType === "image/jpeg" && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng =
    mediaType === "image/png" &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => header[index] === byte);
  const isWebp =
    mediaType === "image/webp" &&
    String.fromCharCode(...header.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...header.slice(8, 12)) === "WEBP";
  return isJpeg || isPng || isWebp ? null : "The selected file content does not match its image type.";
}

export function privateUserFileFailure<T>(
  code: PrivateUserFileErrorCode,
  message: string,
): PrivateUserFileResult<T> {
  return { success: false, error: { code, message } };
}

export function privateUserFileSuccess<T>(data: T): PrivateUserFileResult<T> {
  return { success: true, data };
}

export { createPlatformAvatarReference, getPlatformAvatarFileId };
