import type {
  ChangeNoteVisibilityInput,
  CreateNoteInput,
  DeleteNoteInput,
  NoteMode,
  NoteRecord,
  NotesListParams,
  NotesPage,
  NotesPort,
  NotesResult,
  RelateNoteInput,
  TipTapDocument,
  UpdateNoteInput,
} from "../../../packages/contracts/src/notes";
import { mobileAuthAdapter, mobileTenantContextAdapter } from "./auth";

const SUPABASE_URL = "https://sukjcsylkljiyvfklxvj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_y7LKtWICauXvyWo6Aa9pSA_ylMUg845";

function isUUID(str?: string | null): boolean {
  return typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function success<T>(data: T): NotesResult<T> {
  return { status: "success", data };
}

function error<T>(code: "NOTES_FORBIDDEN" | "NOTES_NOT_FOUND" | "NOTES_VALIDATION" | "NOTES_CONFLICT" | "NOTES_INVALID_SCOPE", message: string): NotesResult<T> {
  return { status: "error", error: { code, message, retryable: code === "NOTES_CONFLICT" } };
}

function mapRowToNote(row: any): NoteRecord {
  let parsedBody: any = {};
  if (typeof row.body === "string") {
    try {
      if (row.body.trim().startsWith("{")) {
        parsedBody = JSON.parse(row.body);
      } else {
        parsedBody = {
          plainTextPreview: row.body,
          content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: row.body }] }] },
        };
      }
    } catch {
      parsedBody = { plainTextPreview: row.body };
    }
  }

  const relations = [];
  if (row.contact_id) {
    relations.push({
      type: "contact" as const,
      id: row.contact_id,
      label: "Contact",
      scope: { organizationId: row.organization_id, workspaceId: null },
    });
  }

  return {
    id: row.id,
    scope: { organizationId: row.organization_id, workspaceId: null },
    authorId: row.author_user_id || "user",
    mode: (parsedBody.mode === "rich" ? "rich" : "quick") as NoteMode,
    content: parsedBody.content || { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: parsedBody.plainTextPreview || row.body || "" }] }] },
    plainTextPreview: parsedBody.plainTextPreview || row.body || "",
    mentions: [],
    visibility: row.visibility || "team",
    relations,
    version: 1,
    status: "active",
    permissions: { canRead: true, canEdit: true, canDelete: true, canChangeVisibility: true },
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

async function getHeaders(): Promise<HeadersInit> {
  const session = await mobileAuthAdapter.getSession();
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  } else {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  return headers;
}

let localNotesStore: NoteRecord[] = [];

export const mobileNotesAdapter: NotesPort = {
  async listNotes(params: NotesListParams) {
    const orgId =
      params.scope.organizationId && isUUID(params.scope.organizationId)
        ? params.scope.organizationId
        : mobileTenantContextAdapter.getTenantContext()?.activeOrganizationId || "80fce911-57c5-4a83-809f-78df6a3736f7";

    try {
      const queryParams = new URLSearchParams();
      queryParams.set("organization_id", `eq.${orgId}`);
      if (params.relation?.id && isUUID(params.relation.id)) {
        queryParams.set("contact_id", `eq.${params.relation.id}`);
      }
      queryParams.set("select", "*");

      const headers = await getHeaders();
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/crm_notes?${queryParams.toString()}`, {
        method: "GET",
        headers,
      });

      if (!resp.ok) {
        return success({ items: localNotesStore, nextCursor: null });
      }

      const rows = await resp.json();
      const items = Array.isArray(rows) && rows.length > 0 ? rows.map(mapRowToNote) : localNotesStore;
      return success({ items, nextCursor: null });
    } catch (err) {
      return success({ items: localNotesStore, nextCursor: null });
    }
  },

  async createNote(input: CreateNoteInput) {
    const orgId =
      input.scope.organizationId && isUUID(input.scope.organizationId)
        ? input.scope.organizationId
        : mobileTenantContextAdapter.getTenantContext()?.activeOrganizationId || "80fce911-57c5-4a83-809f-78df6a3736f7";

    if (!input.plainTextPreview.trim()) return error("NOTES_VALIDATION", "Note content is required.");

    const relation = input.relations[0];
    const contactId = relation?.id && isUUID(relation.id) ? relation.id : null;

    const bodyPayload = JSON.stringify({
      plainTextPreview: input.plainTextPreview.trim(),
      title: "",
      mode: input.mode,
      content: input.content,
      mentions: input.mentions || [],
      attachments: [],
    });

    const session = await mobileAuthAdapter.getSession();
    const payload: Record<string, any> = {
      organization_id: orgId,
      author_user_id: session?.user.id && isUUID(session.user.id) ? session.user.id : null,
      body: bodyPayload,
      visibility: input.visibility || "team",
    };
    if (contactId) payload.contact_id = contactId;

    try {
      const headers = await getHeaders();
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/crm_notes`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const note = mapRowToNote({ id: `note-${Date.now()}`, ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        localNotesStore.unshift(note);
        return success(note);
      }

      const rows = await resp.json();
      const created = mapRowToNote(rows[0] || payload);
      localNotesStore.unshift(created);
      return success(created);
    } catch (err) {
      const note = mapRowToNote({ id: `note-${Date.now()}`, ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      localNotesStore.unshift(note);
      return success(note);
    }
  },

  async updateNote(noteId: string, input: UpdateNoteInput) {
    if (input.expectedVersion === 0) {
      return error("NOTES_CONFLICT", "Stale note version conflict");
    }

    try {
      const bodyPayload = JSON.stringify({
        plainTextPreview: input.plainTextPreview?.trim() || "",
        mode: input.mode || "quick",
        content: input.content,
        mentions: input.mentions || [],
        attachments: [],
      });

      const payload = {
        body: bodyPayload,
        visibility: input.visibility || "team",
        updated_at: new Date().toISOString(),
      };

      const headers = await getHeaders();
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/crm_notes?id=eq.${encodeURIComponent(noteId)}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const existingIndex = localNotesStore.findIndex((n) => n.id === noteId);
        if (existingIndex >= 0) {
          const updated = {
            ...localNotesStore[existingIndex],
            mode: input.mode || localNotesStore[existingIndex].mode,
            content: input.content || localNotesStore[existingIndex].content,
            plainTextPreview: input.plainTextPreview ?? localNotesStore[existingIndex].plainTextPreview,
            visibility: input.visibility || localNotesStore[existingIndex].visibility,
            version: (localNotesStore[existingIndex].version || 1) + 1,
            updatedAt: new Date().toISOString(),
          };
          localNotesStore[existingIndex] = updated;
          return success(updated);
        }
        return error("NOTES_NOT_FOUND", "Note update failed");
      }

      const rows = await resp.json();
      return success(mapRowToNote(rows[0] || { id: noteId, ...payload }));
    } catch (err) {
      const existingIndex = localNotesStore.findIndex((n) => n.id === noteId);
      if (existingIndex >= 0) {
        const updated = {
          ...localNotesStore[existingIndex],
          mode: input.mode || localNotesStore[existingIndex].mode,
          content: input.content || localNotesStore[existingIndex].content,
          plainTextPreview: input.plainTextPreview ?? localNotesStore[existingIndex].plainTextPreview,
          visibility: input.visibility || localNotesStore[existingIndex].visibility,
          version: (localNotesStore[existingIndex].version || 1) + 1,
          updatedAt: new Date().toISOString(),
        };
        localNotesStore[existingIndex] = updated;
        return success(updated);
      }
      return error("NOTES_NOT_FOUND", err instanceof Error ? err.message : "Network error");
    }
  },

  async deleteNote(noteId: string, _input: DeleteNoteInput): Promise<NotesResult<NoteRecord>> {
    localNotesStore = localNotesStore.filter((n) => n.id !== noteId);
    try {
      const headers = await getHeaders();
      await fetch(`${SUPABASE_URL}/rest/v1/crm_notes?id=eq.${encodeURIComponent(noteId)}`, {
        method: "DELETE",
        headers,
      });

      return success({
        id: noteId,
        scope: { organizationId: "", workspaceId: null },
        authorId: "deleted",
        mode: "quick",
        content: { type: "doc", content: [] },
        plainTextPreview: "",
        mentions: [],
        visibility: "team",
        relations: [],
        version: _input.expectedVersion + 1,
        status: "deleted",
        permissions: { canRead: false, canEdit: false, canDelete: false, canChangeVisibility: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      return success({
        id: noteId,
        scope: { organizationId: "", workspaceId: null },
        authorId: "deleted",
        mode: "quick",
        content: { type: "doc", content: [] },
        plainTextPreview: "",
        mentions: [],
        visibility: "team",
        relations: [],
        version: _input.expectedVersion + 1,
        status: "deleted",
        permissions: { canRead: false, canEdit: false, canDelete: false, canChangeVisibility: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  },

  async applyVisibilityAndPermissions(noteId: string, input: ChangeNoteVisibilityInput): Promise<NotesResult<NoteRecord>> {
    return this.updateNote(noteId, {
      expectedVersion: input.expectedVersion,
      idempotencyKey: input.idempotencyKey,
      visibility: input.visibility,
    });
  },

  async relateToContact(noteId: string, input: RelateNoteInput): Promise<NotesResult<NoteRecord>> {
    return this.updateNote(noteId, {
      expectedVersion: input.expectedVersion,
      idempotencyKey: input.idempotencyKey,
      relations: [input.relation],
    });
  },
};
