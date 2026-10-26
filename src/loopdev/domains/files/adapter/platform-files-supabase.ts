import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PlatformFilePreviewInput,
  PlatformFilePreview,
  PlatformFileReference,
  PlatformFileLibraryInput,
  PlatformFileScope,
  PlatformFileUploadInput,
  PlatformFileUploadState,
  PlatformFilesError,
  PlatformFilesPort,
  PlatformFilesResult,
} from "@contracts/platform-files";
import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";

const BUCKET = "platform-files";
const STATUS_ATTEMPTS = 4;

type UploadResponse =
  | { state: "upload"; uploadId: string; path: string; token: string }
  | { state: "processing"; uploadId: string; retryAfterMs: number }
  | { state: "ready"; file: PlatformFileReference };

function failure<T>(
  code: PlatformFilesError["code"],
  message: string,
  retryable = false,
): PlatformFilesResult<T> {
  return { success: false, error: { code, message, retryable } };
}

function isFileReference(value: unknown): value is PlatformFileReference {
  if (typeof value !== "object" || value === null) return false;
  const file = value as Record<string, unknown>;
  return typeof file.id === "string"
    && typeof file.organizationId === "string"
    && typeof file.fileName === "string"
    && typeof file.mimeType === "string"
    && typeof file.byteSize === "number"
    && file.status === "ready";
}

function isUploadState(value: unknown): value is PlatformFileUploadState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Record<string, unknown>;
  return (state.status === "ready" && isFileReference(state.file))
    || (state.status === "processing"
      && typeof state.uploadId === "string"
      && typeof state.retryAfterMs === "number");
}

function isPreview(value: unknown): value is PlatformFilePreview {
  if (typeof value !== "object" || value === null) return false;
  const preview = value as Record<string, unknown>;
  return typeof preview.url === "string"
    && typeof preview.mimeType === "string"
    && typeof preview.expiresAt === "string"
    && (preview.rendition === "original" || preview.rendition === "large" || preview.rendition === "thumbnail");
}

function validScope(scope: PlatformFileScope): PlatformFilesError | null {
  if (scope.workspaceId) {
    return {
      code: "FILE_OPERATION_UNSUPPORTED",
      message: "Product media uploads are scoped to the organization.",
      retryable: false,
    };
  }
  return null;
}

async function errorFromInvocation(error: unknown): Promise<PlatformFilesError> {
  const fallback: PlatformFilesError = {
    code: "FILE_UPLOAD_FAILED",
    message: error instanceof Error ? error.message : "The Files operation failed.",
    retryable: true,
  };
  if (typeof error !== "object" || error === null || !("context" in error)) return fallback;
  const context = (error as { context?: unknown }).context;
  if (!(context instanceof Response)) return fallback;
  try {
    const payload = await context.clone().json() as {
      error?: { code?: unknown; message?: unknown; retryable?: unknown };
    };
    const details = payload.error;
    if (
      details
      && typeof details.code === "string"
      && typeof details.message === "string"
      && typeof details.retryable === "boolean"
    ) {
      const codes = new Set<PlatformFilesError["code"]>([
        "FILE_VALIDATION_ERROR",
        "FILE_FORBIDDEN",
        "FILE_NOT_FOUND",
        "FILE_UPLOAD_FAILED",
        "FILE_PROCESSING_FAILED",
        "FILE_PREVIEW_FAILED",
        "FILE_CONFLICT",
        "FILE_OPERATION_UNSUPPORTED",
      ]);
      if (codes.has(details.code as PlatformFilesError["code"])) {
        return {
          code: details.code as PlatformFilesError["code"],
          message: details.message,
          retryable: details.retryable,
        };
      }
    }
  } catch {
    return fallback;
  }
  return fallback;
}

async function invoke<T>(
  client: SupabaseClient,
  body: Record<string, unknown>,
): Promise<PlatformFilesResult<T>> {
  const { data, error } = await client.functions.invoke("platform-files", { body });
  if (error) return { success: false, error: await errorFromInvocation(error) };
  if (typeof data !== "object" || data === null || !("data" in data)) {
    return failure("FILE_UPLOAD_FAILED", "The Files service returned an invalid response.", true);
  }
  return { success: true, data: (data as { data: T }).data };
}

async function checksumForBlob(blob: Blob): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("This browser cannot securely identify the uploaded image.");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createSupabasePlatformFilesPort(client: SupabaseClient | null): PlatformFilesPort {
  const getUploadStatus: PlatformFilesPort["getUploadStatus"] = async (input) => {
    const scopeError = validScope(input.scope);
    if (scopeError) return { success: false, error: scopeError };
    if (!client) return failure("FILE_FORBIDDEN", "An authenticated Supabase session is required.");
    const result = await invoke<unknown>(client, {
      action: "status",
      organizationId: input.scope.organizationId,
      uploadId: input.uploadId,
    });
    if (result.success === false) return result;
    if (!isUploadState(result.data)) {
      return failure("FILE_UPLOAD_FAILED", "The Files service returned an invalid upload status.", true);
    }
    return { success: true, data: result.data };
  };

  return {
    async listLibrary(input: PlatformFileLibraryInput) {
      const scopeError = validScope(input.scope);
      if (scopeError) return { success: false, error: scopeError };
      if (!client) return failure("FILE_FORBIDDEN", "An authenticated Supabase session is required.");
      const result = await invoke<unknown>(client, {
        action: "list",
        organizationId: input.scope.organizationId,
        purpose: input.purpose,
        fileIds: input.fileIds,
      });
      if (result.success === false) return result;
      if (!Array.isArray(result.data) || !result.data.every(isFileReference)) {
        return failure("FILE_UPLOAD_FAILED", "The Files service returned an invalid library response.", true);
      }
      return { success: true, data: result.data };
    },

    async upload(input: PlatformFileUploadInput) {
      const scopeError = validScope(input.scope);
      if (scopeError) return { success: false, error: scopeError };
      if (input.purpose !== "product_media" || input.resource.entityType !== "catalog_item") {
        return failure("FILE_OPERATION_UNSUPPORTED", "This provider supports product media files only.");
      }
      if (!client) return failure("FILE_FORBIDDEN", "An authenticated Supabase session is required.");

      let checksum: string;
      try {
        checksum = await checksumForBlob(input.content);
      } catch (error) {
        return failure("FILE_UPLOAD_FAILED", error instanceof Error ? error.message : "Image hashing failed.");
      }
      if (input.idempotencyKey !== checksum) {
        return failure("FILE_CONFLICT", "The idempotency key must match the image content checksum.");
      }

      const begun = await invoke<UploadResponse>(client, {
        action: "begin",
        organizationId: input.scope.organizationId,
        productId: input.resource.entityId,
        fileName: input.fileName,
        mimeType: input.mimeType,
        byteSize: input.content.size,
        checksum,
      });
      if (begun.success === false) return begun;
      if (begun.data.state === "ready") {
        return { success: true, data: { status: "ready", file: begun.data.file } };
      }
      if (begun.data.state === "processing") {
        return {
          success: true,
          data: {
            status: "processing",
            uploadId: begun.data.uploadId,
            retryAfterMs: begun.data.retryAfterMs,
          },
        };
      }
      if (begun.data.state !== "upload") {
        return failure("FILE_UPLOAD_FAILED", "The Files service returned an invalid upload session.", true);
      }

      const { error: uploadError } = await client.storage.from(BUCKET).uploadToSignedUrl(
        begun.data.path,
        begun.data.token,
        input.content,
        { contentType: input.mimeType, upsert: false },
      );
      let state: PlatformFileUploadState = {
        status: "processing",
        uploadId: begun.data.uploadId,
        retryAfterMs: uploadError ? 250 : 0,
      };
      for (let attempt = 0; attempt < STATUS_ATTEMPTS; attempt += 1) {
        if (state.status === "processing") await delay(state.retryAfterMs);
        const result = await getUploadStatus({ uploadId: begun.data.uploadId, scope: input.scope });
        if (result.success === false) return result;
        state = result.data;
        if (state.status === "ready") return { success: true, data: state };
      }
      if (uploadError) {
        return failure("FILE_UPLOAD_FAILED", uploadError.message, true);
      }
      return { success: true, data: state };
    },

    getUploadStatus,

    async getPreviewSource(input: PlatformFilePreviewInput) {
      const scopeError = validScope(input.scope);
      if (scopeError) return { success: false, error: scopeError };
      if (!client) return failure("FILE_FORBIDDEN", "An authenticated Supabase session is required.");
      const result = await invoke<unknown>(client, {
        action: "preview",
        organizationId: input.scope.organizationId,
        productId: input.resource.entityId,
        fileId: input.fileId,
        rendition: input.rendition,
      });
      if (result.success === false) return result;
      if (!isPreview(result.data)) {
        return failure("FILE_PREVIEW_FAILED", "The Files service returned an invalid preview.", true);
      }
      return { success: true, data: result.data };
    },
  };
}

export const supabasePlatformFilesPort = createSupabasePlatformFilesPort(defaultWebAuthAdapter.getClient());
export { createSupabasePlatformFilesPort };
