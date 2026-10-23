import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createPlatformAvatarReference,
  getPlatformAvatarFileId,
  privateUserFileFailure,
  privateUserFileSuccess,
  PROFILE_AVATAR_PREVIEW_TTL_SECONDS,
  validateProfileAvatarUpload,
  type PrivateUserFileAsset,
  type PrivateUserFileErrorCode,
  type PrivateUserFilesPort,
} from "./private-user-files";

const STORAGE_BUCKET = "platform-files";

export type PrivateUserFilesSupabaseClient = SupabaseClient;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

export function createSupabasePrivateUserFilesAdapter(
  client: SupabaseClient | null,
): PrivateUserFilesPort {
  async function currentUserId(): Promise<{ userId: string | null; message: string | null }> {
    if (!client) return { userId: null, message: "Private avatar Files are not configured." };
    try {
      const { data, error } = await client.auth.getSession();
      if (error) return { userId: null, message: error.message };
      if (!data.session?.user.id) return { userId: null, message: "An active authenticated session is required." };
      return { userId: data.session.user.id, message: null };
    } catch (cause) {
      return { userId: null, message: errorMessage(cause, "Unable to verify the authenticated session.") };
    }
  }

  async function markUploadFailed(sessionId: string, userId: string): Promise<string | null> {
    if (!client) return "Supabase is not configured.";
    try {
      const { data, error } = await client
        .from("platform_file_upload_sessions")
        .update({ status: "failed" })
        .eq("id", sessionId)
        .eq("owner_user_id", userId)
        .select("id")
        .maybeSingle();
      return error?.message ?? (!data ? "Upload session was unavailable for cleanup." : null);
    } catch (cause) {
      return errorMessage(cause, "Unable to mark the avatar upload session as failed.");
    }
  }

  async function removeUploadedObject(storagePath: string): Promise<string | null> {
    if (!client) return "Supabase is not configured.";
    try {
      const { error } = await client.storage.from(STORAGE_BUCKET).remove([storagePath]);
      return error?.message ?? null;
    } catch (cause) {
      return errorMessage(cause, "Unable to remove the incomplete avatar object.");
    }
  }

  return {
    async uploadProfileAvatar(input) {
      if (!client) {
        return privateUserFileFailure("FILE_OPERATION_UNSUPPORTED", "Private avatar Files are not configured.");
      }
      let validationError: string | null;
      try {
        validationError = await validateProfileAvatarUpload(input);
      } catch (cause) {
        return privateUserFileFailure(
          "FILE_VALIDATION_ERROR",
          errorMessage(cause, "Unable to validate the selected avatar."),
        );
      }
      if (validationError) {
        return privateUserFileFailure("FILE_VALIDATION_ERROR", validationError);
      }
      const identity = await currentUserId();
      if (!identity.userId) {
        return privateUserFileFailure(
          "FILE_SESSION_EXPIRED",
          identity.message ?? "An authenticated session is required to upload an avatar.",
        );
      }
      const userId = identity.userId;

      const fileName = input.fileName.trim();
      const mediaType = input.mediaType.trim().toLowerCase();
      let sessionId: string | null = null;
      let storagePath: string | null = null;
      let fileId: string | null = null;
      let metadataCreated = false;
      let objectUploaded = false;

      try {
        const { data: uploadSession, error: sessionError } = await client
          .from("platform_file_upload_sessions")
          .insert({
            owner_user_id: userId,
            file_name: fileName,
            mime_type: mediaType,
            byte_size: input.content.size,
            status: "pending",
            created_by: userId,
          })
          .select("id")
          .single();
        if (sessionError || !uploadSession) {
          return privateUserFileFailure(
            "FILE_UPLOAD_FAILED",
            sessionError?.message ?? "Unable to create the private avatar upload session.",
          );
        }
        sessionId = uploadSession.id;
        const createdFileId = uploadSession.id;
        const createdStoragePath = `users/${userId}/avatars/${createdFileId}`;
        fileId = createdFileId;
        storagePath = createdStoragePath;

        const { data: pathSession, error: pathError } = await client
          .from("platform_file_upload_sessions")
          .update({ storage_path: createdStoragePath })
          .eq("id", uploadSession.id)
          .eq("owner_user_id", userId)
          .eq("status", "pending")
          .select("id")
          .single();
        if (pathError || !pathSession) throw pathError ?? new Error("Upload session is no longer available.");

        const { error: uploadError } = await client.storage.from(STORAGE_BUCKET).upload(createdStoragePath, input.content, {
          contentType: mediaType,
          upsert: false,
        });
        if (uploadError) throw uploadError;
        objectUploaded = true;

        const { error: fileError } = await client.from("platform_files").insert({
          id: createdFileId,
          organization_id: null,
          owner_user_id: userId,
          name: fileName,
          category: "other",
          source: "upload",
          media_type: mediaType,
          size: input.content.size,
          relation_type: "profile_avatar",
          relation_id: userId,
          storage_path: createdStoragePath,
          current_version: 1,
          uploaded_by: userId,
        });
        if (fileError) throw fileError;
        metadataCreated = true;

        const { error: versionError } = await client.from("platform_file_versions").insert({
          file_id: createdFileId,
          organization_id: null,
          owner_user_id: userId,
          version: 1,
          file_name: fileName,
          mime_type: mediaType,
          byte_size: input.content.size,
          storage_path: createdStoragePath,
          created_by: userId,
        });
        if (versionError) throw versionError;

        const { data: completedSession, error: completionError } = await client
          .from("platform_file_upload_sessions")
          .update({ file_id: createdFileId, status: "completed", completed_at: new Date().toISOString() })
          .eq("id", uploadSession.id)
          .eq("owner_user_id", userId)
          .select("id")
          .single();
        if (completionError || !completedSession) throw completionError ?? new Error("Upload session is no longer available.");

        const asset: PrivateUserFileAsset = {
          id: createdFileId,
          reference: createPlatformAvatarReference(createdFileId),
          fileName,
          mediaType,
          byteSize: input.content.size,
        };
        return privateUserFileSuccess(asset);
      } catch (cause) {
        const cleanupErrors: string[] = [];
        if (metadataCreated && fileId) {
          try {
            const { error } = await client.from("platform_files").delete().eq("id", fileId).eq("owner_user_id", userId);
            if (error) cleanupErrors.push(error.message);
          } catch (cleanupCause) {
            cleanupErrors.push(errorMessage(cleanupCause, "Unable to remove incomplete avatar metadata."));
          }
        }
        if (objectUploaded && storagePath) {
          const cleanupError = await removeUploadedObject(storagePath);
          if (cleanupError) cleanupErrors.push(cleanupError);
        }
        if (sessionId) {
          const cleanupError = await markUploadFailed(sessionId, userId);
          if (cleanupError) cleanupErrors.push(cleanupError);
        }
        const code: PrivateUserFileErrorCode = cleanupErrors.length ? "FILE_CLEANUP_FAILED" : "FILE_UPLOAD_FAILED";
        const message = errorMessage(cause, "Unable to upload the private avatar.");
        return privateUserFileFailure(
          code,
          cleanupErrors.length
            ? `${message} Cleanup also failed: ${cleanupErrors.join("; ")}`
            : message,
        );
      }
    },

    async getProfileAvatarPreview(reference) {
      if (!client) {
        return privateUserFileFailure("FILE_OPERATION_UNSUPPORTED", "Private avatar Files are not configured.");
      }
      const fileId = getPlatformAvatarFileId(reference);
      if (!fileId) return privateUserFileFailure("FILE_NOT_FOUND", "The private avatar was not found.");
      const identity = await currentUserId();
      if (!identity.userId) {
        return privateUserFileFailure(
          "FILE_SESSION_EXPIRED",
          identity.message ?? "An authenticated session is required to view an avatar.",
        );
      }
      const userId = identity.userId;

      try {
        const { data: file, error } = await client
          .from("platform_files")
          .select("storage_path")
          .eq("id", fileId)
          .eq("owner_user_id", userId)
          .eq("relation_type", "profile_avatar")
          .eq("relation_id", userId)
          .eq("status", "active")
          .maybeSingle();
        if (error) return privateUserFileFailure("FILE_PREVIEW_FAILED", error.message);
        if (!file?.storage_path) return privateUserFileFailure("FILE_NOT_FOUND", "The private avatar was not found.");

        const { data: signed, error: signedError } = await client.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(file.storage_path, PROFILE_AVATAR_PREVIEW_TTL_SECONDS);
        if (signedError || !signed?.signedUrl) {
          return privateUserFileFailure(
            "FILE_PREVIEW_FAILED",
            signedError?.message ?? "Unable to create a temporary private avatar URL.",
          );
        }
        return privateUserFileSuccess({
          url: signed.signedUrl,
          expiresAt: new Date(Date.now() + PROFILE_AVATAR_PREVIEW_TTL_SECONDS * 1000).toISOString(),
        });
      } catch (cause) {
        return privateUserFileFailure("FILE_PREVIEW_FAILED", errorMessage(cause, "Unable to create a temporary private avatar URL."));
      }
    },

    async deleteProfileAvatar(reference) {
      if (!client) {
        return privateUserFileFailure("FILE_OPERATION_UNSUPPORTED", "Private avatar Files are not configured.");
      }
      const fileId = getPlatformAvatarFileId(reference);
      if (!fileId) return privateUserFileFailure("FILE_NOT_FOUND", "The private avatar was not found.");
      const identity = await currentUserId();
      if (!identity.userId) {
        return privateUserFileFailure(
          "FILE_SESSION_EXPIRED",
          identity.message ?? "An authenticated session is required to delete an avatar.",
        );
      }
      const userId = identity.userId;

      try {
        const now = new Date().toISOString();
        const { data, error } = await client
          .from("platform_files")
          .update({ status: "deleted", deleted_at: now, updated_at: now })
          .eq("id", fileId)
          .eq("owner_user_id", userId)
          .eq("relation_type", "profile_avatar")
          .eq("relation_id", userId)
          .eq("status", "active")
          .select("id")
          .maybeSingle();
        if (error) return privateUserFileFailure("FILE_DELETE_FAILED", error.message);
        if (!data) return privateUserFileFailure("FILE_NOT_FOUND", "The private avatar was not found.");
        return privateUserFileSuccess(undefined);
      } catch (cause) {
        return privateUserFileFailure("FILE_DELETE_FAILED", errorMessage(cause, "Unable to delete the private avatar."));
      }
    },

    async discardProfileAvatar(reference) {
      if (!client) {
        return privateUserFileFailure("FILE_OPERATION_UNSUPPORTED", "Private avatar Files are not configured.");
      }
      const fileId = getPlatformAvatarFileId(reference);
      if (!fileId) return privateUserFileFailure("FILE_NOT_FOUND", "The private avatar was not found.");
      const identity = await currentUserId();
      if (!identity.userId) {
        return privateUserFileFailure(
          "FILE_SESSION_EXPIRED",
          identity.message ?? "An authenticated session is required to clean up an avatar.",
        );
      }
      const userId = identity.userId;

      try {
        const { data: file, error: readError } = await client
          .from("platform_files")
          .select("storage_path")
          .eq("id", fileId)
          .eq("owner_user_id", userId)
          .eq("relation_type", "profile_avatar")
          .eq("relation_id", userId)
          .eq("status", "active")
          .maybeSingle();
        if (readError) return privateUserFileFailure("FILE_CLEANUP_FAILED", readError.message);
        if (!file) return privateUserFileFailure("FILE_NOT_FOUND", "The private avatar was not found.");

        if (file.storage_path) {
          const cleanupError = await removeUploadedObject(file.storage_path);
          if (cleanupError) return privateUserFileFailure("FILE_CLEANUP_FAILED", cleanupError);
        }

        const now = new Date().toISOString();
        const { data, error } = await client
          .from("platform_files")
          .update({ status: "deleted", deleted_at: now, updated_at: now })
          .eq("id", fileId)
          .eq("owner_user_id", userId)
          .eq("relation_type", "profile_avatar")
          .eq("relation_id", userId)
          .eq("status", "active")
          .select("id")
          .maybeSingle();
        if (error) return privateUserFileFailure("FILE_CLEANUP_FAILED", error.message);
        if (!data) return privateUserFileFailure("FILE_CLEANUP_FAILED", "Avatar metadata cleanup could not be confirmed.");
        return privateUserFileSuccess(undefined);
      } catch (cause) {
        return privateUserFileFailure(
          "FILE_CLEANUP_FAILED",
          errorMessage(cause, "The orphaned avatar could not be cleaned up."),
        );
      }
    },
  };
}
