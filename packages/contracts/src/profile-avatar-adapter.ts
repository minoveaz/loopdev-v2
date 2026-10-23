import type { AuthErrorCode, AuthPort, AuthResult, PlatformUser } from "./auth-port";
import type { UpdatePlatformProfileInput } from "./account-profile";
import { getPlatformAvatarFileId } from "./account-profile";
import type {
  PrivateUserFileError,
  PrivateUserFilePreview,
  PrivateUserFileResult,
  PrivateUserFilesPort,
  UploadProfileAvatarInput,
} from "./private-user-files";
import { privateUserFileFailure } from "./private-user-files";

export interface UpdateProfileAvatarInput extends UploadProfileAvatarInput {
  mutationId: string;
  expectedUserUpdatedAt?: string;
  previousAvatarReference?: string | null;
}

export interface RemoveProfileAvatarInput {
  mutationId: string;
  expectedUserUpdatedAt?: string;
  previousAvatarReference: string;
}

export interface ProfileAvatarCleanup {
  previousAvatar: PrivateUserFileResult<void> | null;
}

export type ProfileAvatarOperationResult =
  | { success: true; data: { user: PlatformUser; cleanup: ProfileAvatarCleanup } }
  | {
      success: false;
      error:
        | PrivateUserFileError
        | {
            code: "AUTH_UPDATE_FAILED";
            authErrorCode: AuthErrorCode;
            message: string;
            cleanupError?: PrivateUserFileError;
          };
    };

export interface ProfileAvatarAdapter {
  updateAvatar(input: UpdateProfileAvatarInput): Promise<ProfileAvatarOperationResult>;
  removeAvatar(input: RemoveProfileAvatarInput): Promise<ProfileAvatarOperationResult>;
  getPreview(reference: string): Promise<PrivateUserFileResult<PrivateUserFilePreview>>;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

function profileUpdate(input: {
  avatarUrl: string | null;
  mutationId: string;
  expectedUserUpdatedAt?: string;
}): UpdatePlatformProfileInput {
  return {
    avatarUrl: input.avatarUrl,
    mutationId: input.mutationId,
    ...(input.expectedUserUpdatedAt ? { expectedUserUpdatedAt: input.expectedUserUpdatedAt } : {}),
  };
}

export function createProfileAvatarAdapter(
  auth: Pick<AuthPort, "updateProfile">,
  files: Pick<
    PrivateUserFilesPort,
    "uploadProfileAvatar" | "getProfileAvatarPreview" | "deleteProfileAvatar" | "discardProfileAvatar"
  >,
): ProfileAvatarAdapter {
  async function updateCanonicalProfile(input: UpdatePlatformProfileInput): Promise<AuthResult<PlatformUser>> {
    try {
      return await auth.updateProfile(input);
    } catch (cause) {
      return {
        success: false,
        error: { code: "AUTH_NETWORK_ERROR", message: errorMessage(cause, "The profile update could not be confirmed.") },
      };
    }
  }

  async function deleteAvatar(reference: string): Promise<PrivateUserFileResult<void>> {
    try {
      return await files.deleteProfileAvatar(reference);
    } catch (cause) {
      return privateUserFileFailure(
        "FILE_DELETE_FAILED",
        errorMessage(cause, "The avatar cleanup could not be confirmed."),
      );
    }
  }

  async function cleanupPreviousAvatar(reference: string | null | undefined): Promise<PrivateUserFileResult<void> | null> {
    if (!reference || !getPlatformAvatarFileId(reference)) return null;
    return deleteAvatar(reference);
  }

  return {
    getPreview(reference) {
      return files.getProfileAvatarPreview(reference);
    },

    async updateAvatar(input) {
      const uploaded = await files.uploadProfileAvatar(input);
      if (uploaded.success === false) {
        return { success: false, error: uploaded.error };
      }

      const updated = await updateCanonicalProfile(profileUpdate({
        avatarUrl: uploaded.data.reference,
        mutationId: input.mutationId,
        expectedUserUpdatedAt: input.expectedUserUpdatedAt,
      }));
      if (updated.success === false) {
        let cleanup: PrivateUserFileResult<void>;
        try {
          cleanup = await files.discardProfileAvatar(uploaded.data.reference);
        } catch (cause) {
          cleanup = privateUserFileFailure(
            "FILE_CLEANUP_FAILED",
            errorMessage(cause, "The orphaned avatar could not be cleaned up."),
          );
        }
        return {
          success: false,
          error: {
            code: "AUTH_UPDATE_FAILED",
            authErrorCode: updated.error.code,
            message: updated.error.message,
            ...(cleanup.success === false ? { cleanupError: cleanup.error } : {}),
          },
        };
      }

      return {
        success: true,
        data: {
          user: updated.data,
          cleanup: { previousAvatar: await cleanupPreviousAvatar(input.previousAvatarReference) },
        },
      };
    },

    async removeAvatar(input) {
      const updated = await updateCanonicalProfile(profileUpdate({
        avatarUrl: null,
        mutationId: input.mutationId,
        expectedUserUpdatedAt: input.expectedUserUpdatedAt,
      }));
      if (updated.success === false) {
        return {
          success: false,
          error: {
            code: "AUTH_UPDATE_FAILED",
            authErrorCode: updated.error.code,
            message: updated.error.message,
          },
        };
      }

      return {
        success: true,
        data: {
          user: updated.data,
          cleanup: { previousAvatar: await cleanupPreviousAvatar(input.previousAvatarReference) },
        },
      };
    },
  };
}
