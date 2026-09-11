import type {
  CreateGlobalNoteInput,
  GlobalNoteRecord,
  GlobalNotesAdapter,
  NoteAttachment,
  NoteRelationRef,
  WorkspaceUser,
} from "../types";

const users: WorkspaceUser[] = [
  { id: "local-development-user", displayName: "Alex Morgan", email: "alex@example.test", organizationId: "local-development-organization" },
  { id: "agent-maya", displayName: "Maya Chen", email: "maya@example.test", organizationId: "local-development-organization" },
  { id: "agent-jordan", displayName: "Jordan Lee", email: "jordan@example.test", organizationId: "local-development-organization" },
];

const notes: GlobalNoteRecord[] = [];
const organizationId = "local-development-organization";

function matchesRelation(note: GlobalNoteRecord, relation?: NoteRelationRef): boolean {
  return !relation || note.relations.some((item) => item.type === relation.type && item.id === relation.id);
}

export const localNotesAdapter: GlobalNotesAdapter = {
  async list(relation) {
    return notes.filter((note) => note.organizationId === organizationId && matchesRelation(note, relation)).map((note) => ({ ...note, relations: [...note.relations], attachments: [...note.attachments] }));
  },
  async create(input) {
    if (input.organizationId !== organizationId) throw new Error("Notes can only be created in the active organization.");
    const now = new Date().toISOString();
    const record: GlobalNoteRecord = {
      id: `local-note-${Date.now()}-${notes.length + 1}`,
      organizationId: input.organizationId,
      authorId: input.authorId,
      authorName: input.authorName,
      title: input.title?.trim() ?? "",
      mode: input.mode,
      visibility: input.visibility,
      relations: input.relations,
      content: input.content,
      plainTextPreview: input.plainTextPreview,
      mentions: input.mentions ?? [],
      attachments: input.attachments ?? [],
      createdAt: now,
      updatedAt: now,
      permissions: { canEdit: true, canDelete: true },
    };
    notes.unshift(record);
    return record;
  },
  async update(noteId, input) {
    const index = notes.findIndex((note) => note.id === noteId);
    if (index < 0) throw new Error("Note not found.");
    notes[index] = { ...notes[index], ...input, updatedAt: new Date().toISOString() };
    return notes[index];
  },
  async uploadAttachment(file) {
    const allowed = ["image/", "application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument"];
    if (!allowed.some((prefix) => file.type.startsWith(prefix))) throw new Error("This file type is not supported.");
    if (file.size > 10 * 1024 * 1024) throw new Error("Attachments must be 10 MB or smaller.");
    const attachment: NoteAttachment = {
      id: `local-attachment-${Date.now()}`,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      url: URL.createObjectURL(file),
      status: "uploaded",
    };
    return attachment;
  },
  async listWorkspaceUsers(requestedOrganizationId) {
    return users.filter((user) => user.organizationId === requestedOrganizationId);
  },
};
