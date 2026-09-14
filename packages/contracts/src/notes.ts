export type NoteMode = "quick" | "rich";
export type NoteVisibility = "private" | "team" | "organization";
export type NoteStatus = "draft" | "pending" | "active" | "conflict" | "deleted";
export type NoteRelationType = "contact" | "customer" | "lead" | "opportunity" | "conversation" | "task";

export type TipTapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: TipTapMark[];
  content?: TipTapNode[];
};

export type TipTapDocument = {
  type: "doc";
  content: TipTapNode[];
};

export interface NoteScope {
  organizationId: string;
  workspaceId?: string | null;
}

export interface NoteRelationRef {
  type: NoteRelationType;
  id: string;
  label: string;
  scope: NoteScope;
}

export interface NoteMention {
  userId: string;
  displayName: string;
}

export interface NotePermissions {
  canRead: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canChangeVisibility: boolean;
}

export interface NoteRecord {
  id: string;
  scope: NoteScope;
  authorId: string;
  authorName?: string;
  mode: NoteMode;
  content: TipTapDocument;
  plainTextPreview: string;
  mentions: NoteMention[];
  visibility: NoteVisibility;
  relations: NoteRelationRef[];
  version: number;
  status: NoteStatus;
  permissions: NotePermissions;
  createdAt: string;
  updatedAt: string;
}

export interface NotesListParams {
  scope: NoteScope;
  relation?: Pick<NoteRelationRef, "type" | "id">;
  cursor?: string | null;
  limit?: number;
  visibility?: NoteVisibility;
}

export interface CreateNoteInput {
  scope: NoteScope;
  authorId: string;
  mode: NoteMode;
  content: TipTapDocument;
  plainTextPreview: string;
  mentions?: NoteMention[];
  visibility: NoteVisibility;
  relations: NoteRelationRef[];
  idempotencyKey: string;
}

export interface UpdateNoteInput {
  mode?: NoteMode;
  content?: TipTapDocument;
  plainTextPreview?: string;
  mentions?: NoteMention[];
  visibility?: NoteVisibility;
  relations?: NoteRelationRef[];
  expectedVersion: number;
  idempotencyKey: string;
}

export interface DeleteNoteInput {
  expectedVersion: number;
  idempotencyKey: string;
}

export interface ChangeNoteVisibilityInput {
  visibility: NoteVisibility;
  expectedVersion: number;
  idempotencyKey: string;
}

export interface RelateNoteInput {
  relation: NoteRelationRef;
  expectedVersion: number;
  idempotencyKey: string;
}

export interface NotesPage {
  items: NoteRecord[];
  nextCursor: string | null;
}

export type NotesErrorCode =
  | "NOTES_FORBIDDEN"
  | "NOTES_NOT_FOUND"
  | "NOTES_VALIDATION"
  | "NOTES_INVALID_SCOPE"
  | "NOTES_CONFLICT"
  | "NOTES_IDEMPOTENCY_REPLAY"
  | "NOTES_OFFLINE_PENDING"
  | "NOTES_NETWORK"
  | "NOTES_RATE_LIMITED";

export interface NotesError {
  code: NotesErrorCode;
  message: string;
  retryable: boolean;
  traceId?: string;
  currentVersion?: number;
  serverRecord?: NoteRecord;
}

export type NotesResult<T> =
  | { status: "success"; data: T }
  | { status: "pending"; data: T; mutationId: string }
  | { status: "error"; error: NotesError };

export interface NotesPort {
  listNotes(params: NotesListParams): Promise<NotesResult<NotesPage>>;
  createNote(input: CreateNoteInput): Promise<NotesResult<NoteRecord>>;
  updateNote(noteId: string, input: UpdateNoteInput): Promise<NotesResult<NoteRecord>>;
  deleteNote(noteId: string, input: DeleteNoteInput): Promise<NotesResult<NoteRecord>>;
  applyVisibilityAndPermissions(noteId: string, input: ChangeNoteVisibilityInput): Promise<NotesResult<NoteRecord>>;
  relateToContact(noteId: string, input: RelateNoteInput): Promise<NotesResult<NoteRecord>>;
}

export function isNoteContentValid(content: TipTapDocument, plainTextPreview: string): boolean {
  return content.type === "doc" && Boolean(plainTextPreview.trim());
}
