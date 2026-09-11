import type { AttachmentRecord } from "@/loopdev/domains/platform";
import type { CreateFileMetadataInput, FileRecord } from "../types";

export function attachmentToFileMetadata(attachment: AttachmentRecord): CreateFileMetadataInput {
  return {
    scope: attachment.scope,
    relation: attachment.relation,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    byteSize: attachment.byteSize,
    category: "other",
    source: "upload",
    uploadedById: attachment.uploadedById,
  };
}

export function fileToAttachmentMetadata(file: FileRecord, relation: AttachmentRecord["relation"]): Pick<AttachmentRecord, "fileName" | "mimeType" | "byteSize" | "storageKey" | "uploadedById" | "attachmentStatus"> & { relation: AttachmentRecord["relation"] } {
  return {
    relation,
    fileName: file.fileName,
    mimeType: file.mimeType,
    byteSize: file.byteSize,
    storageKey: file.versions[file.versions.length - 1]?.storageKey ?? null,
    uploadedById: file.uploadedById ?? "",
    attachmentStatus: file.status === "deleted" ? "deleted" : file.status === "failed" ? "failed" : file.status === "ready" ? "ready" : "pending",
  };
}
