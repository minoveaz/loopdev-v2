export const PLATFORM_FILE_PREVIEW_TTL_SECONDS = 300;
export const PRODUCT_MEDIA_MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const PRODUCT_MEDIA_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const PRODUCT_MEDIA_RENDITIONS = [
  { id: "large", maxEdgePixels: 1600 },
  { id: "thumbnail", maxEdgePixels: 400 },
] as const;

export type ProductMediaRendition = "original" | (typeof PRODUCT_MEDIA_RENDITIONS)[number]["id"];

export const platformFilesContract = {
  id: "platform.files",
  version: "1.1.0",
  previewTtlSeconds: PLATFORM_FILE_PREVIEW_TTL_SECONDS,
  productMedia: {
    allowedTypes: PRODUCT_MEDIA_ALLOWED_TYPES,
    maxUploadBytes: PRODUCT_MEDIA_MAX_UPLOAD_BYTES,
    validateContentSignature: true,
    decodeBeforeAccepting: true,
    retainOriginal: true,
    preserveAspectRatio: true,
    upscale: false,
    renditions: PRODUCT_MEDIA_RENDITIONS,
    renditionEncoding: "platform-policy",
    assignmentOwner: "consumer",
    retentionOwner: "platform-files",
    orphanRecoveryOwner: "platform-files",
    detachDeletesFile: false,
  },
} as const;

export type PlatformFilePurpose = "general" | "product_media";

export interface PlatformFileScope {
  organizationId: string;
  workspaceId?: string | null;
}

export interface PlatformFileResource {
  entityType: string;
  entityId: string;
}

export interface PlatformFileReference {
  id: string;
  organizationId: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  status: "ready";
}

export interface PlatformFileUploadInput {
  scope: PlatformFileScope;
  resource: PlatformFileResource;
  purpose: PlatformFilePurpose;
  fileName: string;
  mimeType: string;
  content: Blob;
  idempotencyKey: string;
}

export interface PlatformFileLibraryInput {
  scope: PlatformFileScope;
  purpose: "product_media";
  fileIds?: string[];
}

export type PlatformFileUploadState =
  | { status: "processing"; uploadId: string; retryAfterMs: number }
  | { status: "ready"; file: PlatformFileReference };

export interface PlatformFilePreviewInput {
  fileId: string;
  scope: PlatformFileScope;
  resource: PlatformFileResource;
  rendition: ProductMediaRendition;
}

export interface PlatformFilePreview {
  url: string;
  mimeType: string;
  expiresAt: string;
  rendition: ProductMediaRendition;
}

export type PlatformFilesErrorCode =
  | "FILE_VALIDATION_ERROR"
  | "FILE_FORBIDDEN"
  | "FILE_NOT_FOUND"
  | "FILE_UPLOAD_FAILED"
  | "FILE_PROCESSING_FAILED"
  | "FILE_PREVIEW_FAILED"
  | "FILE_CONFLICT"
  | "FILE_OPERATION_UNSUPPORTED";

export interface PlatformFilesError {
  code: PlatformFilesErrorCode;
  message: string;
  retryable: boolean;
}

export type PlatformFilesResult<T> =
  | { success: true; data: T }
  | { success: false; error: PlatformFilesError };

export interface PlatformFilesPort {
  listLibrary(input: PlatformFileLibraryInput): Promise<PlatformFilesResult<PlatformFileReference[]>>;
  upload(input: PlatformFileUploadInput): Promise<PlatformFilesResult<PlatformFileUploadState>>;
  getUploadStatus(input: {
    uploadId: string;
    scope: PlatformFileScope;
  }): Promise<PlatformFilesResult<PlatformFileUploadState>>;
  getPreviewSource(input: PlatformFilePreviewInput): Promise<PlatformFilesResult<PlatformFilePreview>>;
}
