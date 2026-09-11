import type { AttachmentRecord } from "@/loopdev/domains/platform";
import type { NoteAttachment } from "@/loopdev/domains/notes";
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

export function noteAttachmentToFileMetadata(attachment: NoteAttachment, scope: CreateFileMetadataInput["scope"], noteId: string): CreateFileMetadataInput {
  return {
    scope,
    relation: { entityType: "note", entityId: noteId, scope },
    fileName: attachment.name,
    mimeType: attachment.mimeType,
    byteSize: attachment.size,
    category: "other",
    source: "upload",
  };
}

export function fileToNoteAttachment(file: FileRecord, url: string): NoteAttachment {
  return {
    id: file.id,
    name: file.fileName,
    mimeType: file.mimeType,
    size: file.byteSize,
    url,
    status: file.status === "failed" ? "error" : file.status === "ready" ? "uploaded" : "uploading",
  };
}
