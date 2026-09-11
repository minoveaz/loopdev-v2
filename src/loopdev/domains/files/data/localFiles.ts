/** Storage key reserved for file metadata; binary content never enters this store. */
export const FILES_LOCAL_STORAGE_KEY = "loopdev.files.v1";

import type { EntityScope, PlatformPermissions } from "@/loopdev/domains/platform";
import type { FileRecord, FileVersion } from "../types";

const demoScope: EntityScope = {
  organizationId: "local-development-organization",
  workspaceId: "local-workspace",
  brandId: null,
};

const demoPermissions: PlatformPermissions = {
  canRead: true,
  canEdit: true,
  canDelete: true,
  canAssign: false,
  canModerate: false,
};

const demoFiles: Array<Pick<FileRecord, "fileName" | "mimeType" | "byteSize" | "category" | "source">> = [
  { fileName: "passport-maria-garcia.pdf", mimeType: "application/pdf", byteSize: 524288, category: "identity", source: "manager" },
  { fileName: "service-agreement-2026.pdf", mimeType: "application/pdf", byteSize: 294912, category: "contracts", source: "upload" },
  { fileName: "implementation-proposal.pdf", mimeType: "application/pdf", byteSize: 418816, category: "proposals", source: "manager" },
  { fileName: "invoice-april-2026.pdf", mimeType: "application/pdf", byteSize: 184320, category: "billing", source: "upload" },
  { fileName: "requirements-shared-in-chat.pdf", mimeType: "application/pdf", byteSize: 245760, category: "communications", source: "conversation" },
  { fileName: "company-profile.txt", mimeType: "text/plain", byteSize: 4096, category: "other", source: "upload" },
];

function createDemoFile(
  file: typeof demoFiles[number],
  index: number,
): FileRecord {
  const id = `demo-file-${file.category}`;
  const createdAt = new Date(Date.now() - (index + 1) * 86400000).toISOString();
  const version: FileVersion = {
    id: `${id}-v1`,
    fileId: id,
    version: 1,
    fileName: file.fileName,
    mimeType: file.mimeType,
    byteSize: file.byteSize,
    checksum: null,
    storageKey: null,
    createdById: "local-development-user",
    createdAt,
  };
  return {
    id,
    scope: demoScope,
    relation: {
      entityType: "contact",
      entityId: "crm_cust_1",
      scope: demoScope,
      label: "Maria Garcia",
    },
    fileName: file.fileName,
    mimeType: file.mimeType,
    byteSize: file.byteSize,
    status: "ready",
    category: file.category,
    source: file.source,
    sourceMetadata: file.source === "conversation"
      ? { conversationId: "conversation-demo-1", messageId: "message-demo-1" }
      : undefined,
    currentVersion: 1,
    versions: [version],
    uploadedById: "local-development-user",
    createdAt,
    updatedAt: createdAt,
    permissions: demoPermissions,
  };
}

export const localFilesDemoSeed = demoFiles.map(createDemoFile);
