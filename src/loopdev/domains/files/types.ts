import type { EntityRef, EntityScope, PlatformPermissions } from "@/loopdev/domains/platform";

export type FileStatus = "queued" | "uploading" | "processing" | "pending" | "ready" | "failed" | "archived" | "deleted" | "expired";
export type UploadSessionStatus = "pending" | "completed" | "failed" | "cancelled";
export type FileCategory = "identity" | "contracts" | "proposals" | "billing" | "communications" | "other";
export type FileSource = "upload" | "conversation" | "manager" | "generated" | "temporary";

export interface FileRelation extends EntityRef {
  label?: string;
}

export interface FileVersion {
  id: string;
  fileId: string;
  version: number;
  fileName: string;
  mimeType: string;
  byteSize: number;
  checksum?: string | null;
  storageKey: string | null;
  createdById: string | null;
  createdAt: string;
}

export interface FileRecord {
  id: string;
  scope: EntityScope;
  relation: FileRelation;
  fileName: string;
  mimeType: string;
  byteSize: number;
  status: FileStatus;
  category: FileCategory;
  source: FileSource;
  sourceMetadata?: {
    conversationId?: string;
    messageId?: string;
  };
  currentVersion: number;
  versions: FileVersion[];
  uploadedById: string | null;
  createdAt: string;
  updatedAt: string;
  permissions: PlatformPermissions;
  archivedAt?: string | null;
  deletedAt?: string | null;
  tags?: string[];
}

export interface UploadSession {
  id: string;
  scope: EntityScope;
  fileId: string | null;
  fileName: string;
  mimeType: string;
  byteSize: number;
  status: UploadSessionStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface CreateFileMetadataInput {
  scope: EntityScope;
  relation: FileRelation;
  fileName: string;
  mimeType: string;
  byteSize: number;
  category?: FileCategory;
  source?: FileSource;
  sourceMetadata?: {
    conversationId?: string;
    messageId?: string;
  };
  uploadedById?: string | null;
  file?: File;
  checksum?: string | null;
  tags?: string[];
}

export interface FileListParams {
  scope: EntityScope;
  relation?: FileRelation;
}

export interface UpdateFileMetadataInput {
  id: string;
  expectedVersion: number;
  fileName?: string;
  category?: FileCategory;
  source?: FileSource;
  relation?: FileRelation;
}

export interface ReplaceFileVersionInput {
  id: string;
  expectedVersion: number;
  fileName?: string;
  mimeType?: string;
  byteSize?: number;
  checksum?: string | null;
  file?: File;
  tags?: string[];
}

export interface FilePreviewSource {
  url: string | null;
  mimeType: string;
  revoke?: () => void;
}

export interface FileValidationOptions {
  acceptedTypes?: readonly string[];
  maxSizeBytes?: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface FilesAdapter {
  list(params: FileListParams): Promise<FileRecord[]>;
  createMetadata(input: CreateFileMetadataInput): Promise<FileRecord>;
  remove(id: string, expectedVersion: number): Promise<FileRecord>;
  updateMetadata(input: UpdateFileMetadataInput): Promise<FileRecord>;
  archive(id: string, expectedVersion: number): Promise<FileRecord>;
  restore(id: string, expectedVersion: number): Promise<FileRecord>;
  replaceVersion(input: ReplaceFileVersionInput): Promise<FileRecord>;
  relate(id: string, relation: FileRelation, expectedVersion: number): Promise<FileRecord>;
  unrelate(id: string, expectedVersion: number): Promise<FileRecord>;
  getPreviewSource(id: string): Promise<FilePreviewSource | null>;
}
