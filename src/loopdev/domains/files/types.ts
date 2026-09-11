import type { EntityRef, EntityScope, PlatformPermissions } from "@/loopdev/domains/platform";

export type FileStatus = "pending" | "ready" | "failed" | "deleted";
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
}

export interface FileListParams {
  scope: EntityScope;
  relation?: FileRelation;
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
}
