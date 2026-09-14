import type {
  ChangeNoteVisibilityInput,
  CreateNoteInput,
  DeleteNoteInput,
  NoteRecord,
  NotesListParams,
  NotesPage,
  NotesPort,
  NotesResult,
  RelateNoteInput,
  TipTapDocument,
  UpdateNoteInput,
} from "../../../packages/contracts/src/notes";

const mobileScope = { organizationId: "local-development-organization", workspaceId: null };
const records = new Map<string, NoteRecord>();
let sequence = 1;

function now() {
  return new Date().toISOString();
}

function success<T>(data: T): NotesResult<T> {
  return { status: "success", data };
}

function error<T>(code: "NOTES_FORBIDDEN" | "NOTES_NOT_FOUND" | "NOTES_VALIDATION" | "NOTES_CONFLICT" | "NOTES_INVALID_SCOPE", message: string): NotesResult<T> {
  return { status: "error", error: { code, message, retryable: code === "NOTES_CONFLICT" } };
}

function plainDocument(text: string): TipTapDocument {
  return { type: "doc", content: [{ type: "paragraph", content: text ? [{ type: "text", text }] : [] }] };
}

function ensureRelationScope(input: CreateNoteInput | RelateNoteInput) {
  const relation = "relations" in input ? input.relations[0] : input.relation;
  return relation && relation.scope.organizationId === mobileScope.organizationId ? relation : null;
}

function findNote(noteId: string) {
  return records.get(noteId);
}

export const mobileNotesAdapter: NotesPort = {
  async listNotes(params: NotesListParams) {
    if (params.scope.organizationId !== mobileScope.organizationId) return error("NOTES_INVALID_SCOPE", "The active organization does not match the mobile scope.");
    const items = [...records.values()]
      .filter((note) => note.status !== "deleted")
      .filter((note) => !params.relation || note.relations.some((relation) => relation.type === params.relation?.type && relation.id === params.relation.id))
      .filter((note) => !params.visibility || note.visibility === params.visibility)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    const limit = Math.max(1, Math.min(params.limit ?? 25, 100));
    const offset = params.cursor ? Number.parseInt(params.cursor, 10) || 0 : 0;
    const page: NotesPage = { items: items.slice(offset, offset + limit), nextCursor: offset + limit < items.length ? String(offset + limit) : null };
    return success(page);
  },

  async createNote(input: CreateNoteInput) {
    const relation = ensureRelationScope(input);
    if (!relation) return error("NOTES_INVALID_SCOPE", "The note relation is outside the mobile organization.");
    if (!input.plainTextPreview.trim()) return error("NOTES_VALIDATION", "Note content is required.");
    const timestamp = now();
    const note: NoteRecord = {
      id: `mobile-note-${sequence++}`,
      scope: input.scope,
      authorId: input.authorId,
      mode: input.mode,
      content: input.content,
      plainTextPreview: input.plainTextPreview.trim(),
      mentions: input.mentions ?? [],
      visibility: input.visibility,
      relations: input.relations,
      version: 1,
      status: "active",
      permissions: { canRead: true, canEdit: true, canDelete: true, canChangeVisibility: true },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    records.set(note.id, note);
    return success(note);
  },

  async updateNote(noteId: string, input: UpdateNoteInput) {
    const current = findNote(noteId);
    if (!current) return error("NOTES_NOT_FOUND", "Note not found.");
    if (current.version !== input.expectedVersion) return error("NOTES_CONFLICT", "This note changed before it could be updated.");
    const next: NoteRecord = {
      ...current,
      mode: input.mode ?? current.mode,
      content: input.content ?? current.content,
      plainTextPreview: input.plainTextPreview?.trim() ?? current.plainTextPreview,
      mentions: input.mentions ?? current.mentions,
      visibility: input.visibility ?? current.visibility,
      relations: input.relations ?? current.relations,
      version: current.version + 1,
      updatedAt: now(),
    };
    if (!next.plainTextPreview) return error("NOTES_VALIDATION", "Note content is required.");
    records.set(noteId, next);
    return success(next);
  },

  async deleteNote(noteId: string, input: DeleteNoteInput) {
    const current = findNote(noteId);
    if (!current) return error("NOTES_NOT_FOUND", "Note not found.");
    if (current.version !== input.expectedVersion) return error("NOTES_CONFLICT", "This note changed before it could be deleted.");
    const deleted = { ...current, status: "deleted" as const, version: current.version + 1, updatedAt: now() };
    records.set(noteId, deleted);
    return success(deleted);
  },

  async applyVisibilityAndPermissions(noteId: string, input: ChangeNoteVisibilityInput) {
    return this.updateNote(noteId, { visibility: input.visibility, expectedVersion: input.expectedVersion, idempotencyKey: input.idempotencyKey });
  },

  async relateToContact(noteId: string, input: RelateNoteInput) {
    if (input.relation.scope.organizationId !== mobileScope.organizationId) return error("NOTES_INVALID_SCOPE", "The relation is outside the mobile organization.");
    return this.updateNote(noteId, { relations: [input.relation], expectedVersion: input.expectedVersion, idempotencyKey: input.idempotencyKey });
  },
};

export function seedMobileNote(note: NoteRecord) {
  records.set(note.id, note);
}
