import type {
  CreateNoteInput,
  DeleteNoteInput,
  NotesError,
  NotesListParams,
  NotesPage,
  NotesPort,
  NotesResult,
  NoteRecord as ContractNoteRecord,
  RelateNoteInput,
  TipTapDocument,
  UpdateNoteInput,
} from "../../../../../packages/contracts/src/notes";
import type { EntityRef, NoteRecord as PlatformNoteRecord } from "../types";
import { PlatformWorkAdapterError, type PlatformWorkAdapter } from "./work";

function documentFromBody(body: string): TipTapDocument {
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: body }] }],
  };
}

function toContractNote(note: PlatformNoteRecord): ContractNoteRecord {
  return {
    id: note.id,
    scope: {
      organizationId: note.scope.organizationId,
      workspaceId: note.scope.workspaceId,
    },
    authorId: note.authorId,
    mode: "quick",
    content: documentFromBody(note.body),
    plainTextPreview: note.body,
    mentions: [],
    visibility: note.visibility,
    relations: [{
      type: note.relation.entityType as "contact" | "customer" | "lead" | "opportunity" | "conversation" | "task",
      id: note.relation.entityId,
      label: note.relation.entityId,
      scope: {
        organizationId: note.relation.scope.organizationId,
        workspaceId: note.relation.scope.workspaceId,
      },
    }],
    version: note.version,
    status: note.status === "archived" ? "deleted" : "active",
    permissions: {
      canRead: note.permissions.canRead,
      canEdit: note.permissions.canEdit,
      canDelete: note.permissions.canDelete,
      canChangeVisibility: note.permissions.canModerate,
    },
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

function errorFromCause(cause: unknown): NotesError {
  if (cause instanceof PlatformWorkAdapterError) {
    const code = cause.code === "forbidden"
      ? "NOTES_FORBIDDEN"
      : cause.code === "not-found"
        ? "NOTES_NOT_FOUND"
        : cause.code === "conflict"
          ? "NOTES_CONFLICT"
          : cause.code === "invalid-scope"
            ? "NOTES_INVALID_SCOPE"
            : "NOTES_VALIDATION";
    return { code, message: cause.message, retryable: code === "NOTES_CONFLICT" };
  }
  return { code: "NOTES_NETWORK", message: cause instanceof Error ? cause.message : "Unable to access notes.", retryable: true };
}

function result<T>(operation: () => Promise<T>): Promise<NotesResult<T>> {
  return operation().then((data) => ({ status: "success", data }), (cause) => ({ status: "error", error: errorFromCause(cause) }));
}

function relationFromInput(input: CreateNoteInput | RelateNoteInput): EntityRef {
  const relation = "relations" in input ? input.relations[0] : input.relation;
  if (!relation) throw new PlatformWorkAdapterError("A note relation is required.", "validation-error");
  return {
    entityType: relation.type,
    entityId: relation.id,
    scope: {
      organizationId: relation.scope.organizationId,
      workspaceId: relation.scope.workspaceId,
    },
  };
}

export function createDesktopNotesPort(work: PlatformWorkAdapter): NotesPort {
  return {
    listNotes(params: NotesListParams) {
      return result(async () => {
        const page = await work.listNotes({
          organizationId: params.scope.organizationId,
          workspaceId: params.scope.workspaceId,
          relation: params.relation ? { entityType: params.relation.type, entityId: params.relation.id, scope: params.scope } : undefined,
          cursor: params.cursor ?? undefined,
          limit: params.limit,
          visibility: params.visibility ? [params.visibility] : undefined,
        });
        const data: NotesPage = { items: page.items.map(toContractNote), nextCursor: page.nextCursor };
        return data;
      });
    },
    createNote(input) {
      return result(async () => toContractNote(await work.createNote({
        organizationId: input.scope.organizationId,
        workspaceId: input.scope.workspaceId,
        relation: relationFromInput(input),
        body: input.plainTextPreview,
        visibility: input.visibility,
        idempotencyKey: input.idempotencyKey,
      })));
    },
    updateNote(noteId: string, input: UpdateNoteInput) {
      return result(async () => toContractNote(await work.updateNote(noteId, {
        expectedVersion: input.expectedVersion,
        body: input.plainTextPreview ?? "",
      })));
    },
    deleteNote(_noteId: string, _input: DeleteNoteInput) {
      return result(async () => toContractNote(await work.deleteNote(_noteId, _input.expectedVersion)));
    },
    applyVisibilityAndPermissions(noteId, input) {
      return result(async () => toContractNote(await work.updateNoteVisibility(noteId, input.visibility, input.expectedVersion)));
    },
    relateToContact(noteId, input) {
      return result(async () => toContractNote(await work.relateNote(noteId, {
        entityType: input.relation.type,
        entityId: input.relation.id,
        scope: input.relation.scope,
      }, input.expectedVersion)));
    },
  };
}
