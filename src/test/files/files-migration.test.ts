import { describe, expect, it } from "vitest";
import {
  fileToNoteAttachment,
  noteAttachmentToFileMetadata,
} from "@/loopdev/domains/files";
import { checksumForFile } from "@/loopdev/domains/files";
import { cleanupLocalPreviews, getLocalPreview, putLocalPreview } from "@/loopdev/domains/files";

const scope = { organizationId: "org-1", workspaceId: "workspace-1" };

describe("attachment migration bridges", () => {
  it("recovers active previews and removes orphaned previews", async () => {
    await putLocalPreview("active", new File(["active"], "active.txt"));
    await putLocalPreview("orphan", new File(["orphan"], "orphan.txt"));
    await cleanupLocalPreviews(new Set(["active"]));
    expect(await getLocalPreview("active")).not.toBeNull();
    expect(await getLocalPreview("orphan")).toBeNull();
  });
  it("produces a stable SHA-256 checksum for a file", async () => {
    const checksum = await checksumForFile(new File(["same content"], "brief.txt", { type: "text/plain" }));
    expect(checksum).toMatch(/^[a-f0-9]{64}$/);
  });
  it("maps a note attachment to a Files Platform relation", () => {
    const result = noteAttachmentToFileMetadata({
      id: "note-attachment-1",
      name: "brief.pdf",
      mimeType: "application/pdf",
      size: 2048,
      url: "blob:brief",
      status: "uploaded",
    }, scope, "note-1");

    expect(result).toMatchObject({
      fileName: "brief.pdf",
      mimeType: "application/pdf",
      byteSize: 2048,
      relation: { entityType: "note", entityId: "note-1", scope },
    });
  });

  it("keeps the legacy NoteAttachment shape when mapping back", () => {
    const result = fileToNoteAttachment({
      id: "file-1",
      scope,
      relation: { entityType: "task", entityId: "task-1", scope },
      fileName: "screenshot.png",
      mimeType: "image/png",
      byteSize: 512,
      status: "ready",
      category: "other",
      source: "upload",
      currentVersion: 1,
      versions: [],
      uploadedById: "user-1",
      createdAt: "2026-09-12T00:00:00.000Z",
      updatedAt: "2026-09-12T00:00:00.000Z",
      permissions: { canRead: true, canEdit: true, canDelete: true, canAssign: false, canModerate: false },
    }, "blob:screenshot");

    expect(result).toEqual({
      id: "file-1",
      name: "screenshot.png",
      mimeType: "image/png",
      size: 512,
      url: "blob:screenshot",
      status: "uploaded",
    });
  });
});
