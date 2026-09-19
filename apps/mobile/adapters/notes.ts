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

function error<T>(code: "NOTES_FORBIDDEN" | "NOTES_NOT_FOUND" | "NOTES_VALIDATION" | "NOTES_CONFLICT" | "NOTES_INVALID_SCOPE" | "NOTES_NETWORK", message: string): NotesResult<T> {
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
  const relation = row.contact_id
    ? { type: "contact" as const, id: row.contact_id, label: "Contact" }
    : row.lead_id
      ? { type: "lead" as const, id: row.lead_id, label: "Lead" }
      : row.opportunity_id
        ? { type: "opportunity" as const, id: row.opportunity_id, label: "Opportunity" }
        : row.relation_id && row.relation_type
          ? { type: row.relation_type as any, id: row.relation_id, label: row.relation_type }
          : null;
  if (relation) relations.push({ ...relation, scope: { organizationId: row.organization_id, workspaceId: null } });

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
    version: Number(row.version ?? 1),
    status: row.status === "deleted" ? "deleted" : "active",
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

const localNotesStore: NoteRecord[] = [];

export const mobileNotesAdapter: NotesPort = {
  async listNotes(params: NotesListParams) {
    if (!isUUID(params.scope.organizationId)) {
      const items = localNotesStore.filter((note) => !params.relation || note.relations.some((relation) => relation.id === params.relation?.id));
      return success({ items, nextCursor: null });
    }
    const orgId =
      params.scope.organizationId && isUUID(params.scope.organizationId)
        ? params.scope.organizationId
        : mobileTenantContextAdapter.getTenantContext()?.activeOrganizationId || "80fce911-57c5-4a83-809f-78df6a3736f7";

    try {
      const queryParams = new URLSearchParams();
      queryParams.set("organization_id", `eq.${orgId}`);
      if (params.relation?.id && isUUID(params.relation.id)) {
        queryParams.set("relation_id", `eq.${params.relation.id}`);
      }
      queryParams.set("select", "*");

      const headers = await getHeaders();
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/crm_notes?${queryParams.toString()}`, {
        method: "GET",
        headers,
      });

      if (!resp.ok) return error("NOTES_NETWORK", `Unable to list notes (${resp.status}).`);

      const rows = await resp.json();
      const items = Array.isArray(rows) ? rows.map(mapRowToNote) : [];
      return success({ items, nextCursor: null });
    } catch (err) {
      return error("NOTES_NETWORK", err instanceof Error ? err.message : "Unable to list notes.");
    }
  },

  async createNote(input: CreateNoteInput) {
    if (!isUUID(input.scope.organizationId)) {
      const now = new Date().toISOString();
      const note = mapRowToNote({
        id: `local-note-${Date.now()}-${localNotesStore.length}`,
        organization_id: input.scope.organizationId,
        author_user_id: input.authorId,
        body: JSON.stringify({ plainTextPreview: input.plainTextPreview.trim(), mode: input.mode, content: input.content, mentions: input.mentions ?? [] }),
        visibility: input.visibility,
        version: 1,
        created_at: now,
        updated_at: now,
        ...(input.relations[0]?.type === "contact" ? { contact_id: input.relations[0].id } : { relation_type: input.relations[0]?.type, relation_id: input.relations[0]?.id }),
      });
      localNotesStore.unshift(note);
      return success(note);
    }
    const orgId =
      input.scope.organizationId && isUUID(input.scope.organizationId)
        ? input.scope.organizationId
        : mobileTenantContextAdapter.getTenantContext()?.activeOrganizationId || "80fce911-57c5-4a83-809f-78df6a3736f7";

    if (!input.plainTextPreview.trim()) return error("NOTES_VALIDATION", "Note content is required.");

    const relation = input.relations[0];
    const relationId = relation?.id && isUUID(relation.id) ? relation.id : null;

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
    if (!payload.author_user_id) return error("NOTES_FORBIDDEN", "An authenticated user is required to create a note.");
    if (relationId) {
      if (relation?.type === "contact") payload.contact_id = relationId;
      else {
        payload.relation_type = relation?.type;
        payload.relation_id = relationId;
      }
    }

    try {
      const headers = await getHeaders();
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/crm_notes`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!resp.ok) return error("NOTES_NETWORK", `Unable to create note (${resp.status}).`);

      const rows = await resp.json();
      if (!rows[0]) return error("NOTES_NETWORK", "The notes service returned no created record.");
      return success(mapRowToNote(rows[0]));
    } catch (err) {
      return error("NOTES_NETWORK", err instanceof Error ? err.message : "Unable to create note.");
    }
  },

  async updateNote(noteId: string, input: UpdateNoteInput) {
    const localIndex = localNotesStore.findIndex((note) => note.id === noteId);
    if (localIndex >= 0) {
      const current = localNotesStore[localIndex];
      if (current.version !== input.expectedVersion) return error("NOTES_CONFLICT", "The note changed before it could be updated.");
      const updated = { ...current, mode: input.mode ?? current.mode, content: input.content ?? current.content, plainTextPreview: input.plainTextPreview ?? current.plainTextPreview, mentions: input.mentions ?? current.mentions, visibility: input.visibility ?? current.visibility, version: current.version + 1, updatedAt: new Date().toISOString() };
      localNotesStore[localIndex] = updated;
      return success(updated);
    }
    try {
      const readHeaders = await getHeaders();
      const currentResponse = await fetch(`${SUPABASE_URL}/rest/v1/crm_notes?id=eq.${encodeURIComponent(noteId)}&select=*`, { headers: readHeaders });
      if (!currentResponse.ok) return error("NOTES_NETWORK", `Unable to read note (${currentResponse.status}).`);
      const currentRows = await currentResponse.json();
      const current = currentRows[0];
      if (!current) return error("NOTES_NOT_FOUND", "The note was not found.");
      if (Number(current.version ?? 1) !== input.expectedVersion) return error("NOTES_CONFLICT", "The note changed before it could be updated.");
      const bodyPayload = JSON.stringify({
        plainTextPreview: input.plainTextPreview?.trim() || "",
        mode: input.mode || "quick",
        content: input.content,
        mentions: input.mentions || [],
        attachments: [],
      });

      const payload: Record<string, any> = {
        body: bodyPayload,
        visibility: input.visibility || "team",
        version: Number(current.version ?? 1) + 1,
        updated_at: new Date().toISOString(),
      };
      if (input.relations?.[0]) {
        const next = input.relations[0];
        payload.contact_id = next.type === "contact" ? next.id : null;
        payload.relation_type = next.type === "contact" ? null : next.type;
        payload.relation_id = next.type === "contact" ? null : next.id;
      }

      const headers = await getHeaders();
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/crm_notes?id=eq.${encodeURIComponent(noteId)}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });

      if (!resp.ok) return error(resp.status === 404 ? "NOTES_NOT_FOUND" : "NOTES_NETWORK", `Unable to update note (${resp.status}).`);

      const rows = await resp.json();
      if (!rows[0]) return error("NOTES_NOT_FOUND", "The note was not found.");
      return success(mapRowToNote(rows[0]));
    } catch (err) {
      return error("NOTES_NETWORK", err instanceof Error ? err.message : "Unable to update note.");
    }
  },

  async deleteNote(noteId: string, _input: DeleteNoteInput): Promise<NotesResult<NoteRecord>> {
    const localIndex = localNotesStore.findIndex((note) => note.id === noteId);
    if (localIndex >= 0) {
      const current = localNotesStore[localIndex];
      if (current.version !== _input.expectedVersion) return error("NOTES_CONFLICT", "The note changed before it could be deleted.");
      const deleted = { ...current, status: "deleted" as const, updatedAt: new Date().toISOString() };
      localNotesStore.splice(localIndex, 1);
      return success(deleted);
    }
    try {
      const headers = await getHeaders();
      const currentResponse = await fetch(`${SUPABASE_URL}/rest/v1/crm_notes?id=eq.${encodeURIComponent(noteId)}&select=*`, { headers: await getHeaders() });
      if (!currentResponse.ok) return error("NOTES_NETWORK", `Unable to read note (${currentResponse.status}).`);
      const currentRows = await currentResponse.json();
      const current = currentRows[0];
      if (!current) return error("NOTES_NOT_FOUND", "The note was not found.");
      if (Number(current.version ?? 1) !== _input.expectedVersion) return error("NOTES_CONFLICT", "The note changed before it could be deleted.");
      const response = await fetch(`${SUPABASE_URL}/rest/v1/crm_notes?id=eq.${encodeURIComponent(noteId)}&version=eq.${Number(current.version ?? 1)}`, {
        method: "DELETE",
        headers: await getHeaders(),
      });
      if (!response.ok) return error(response.status === 404 ? "NOTES_NOT_FOUND" : "NOTES_NETWORK", `Unable to delete note (${response.status}).`);
      return success(mapRowToNote({ ...current, status: "deleted", updated_at: new Date().toISOString() }));
    } catch (err) {
      return error("NOTES_NETWORK", err instanceof Error ? err.message : "Unable to delete note.");
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
