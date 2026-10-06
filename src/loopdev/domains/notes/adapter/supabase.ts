import { localNotesAdapter } from "./local";
import type {
  CreateGlobalNoteInput,
  GlobalNoteRecord,
  GlobalNotesAdapter,
  NoteRelationRef,
  NoteAttachment,
  WorkspaceUser,
} from "../types";
import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";

const LOCAL_ORGANIZATION_ID = "local-development-organization";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID.test(value);
}

function relationColumn(relation?: NoteRelationRef) {
  if (!relation || !isUuid(relation.id)) return {};
  if (relation.type === "contact") return { contact_id: relation.id };
  if (relation.type === "lead") return { lead_id: relation.id };
  if (relation.type === "opportunity") return { opportunity_id: relation.id };
  return { relation_type: relation.type, relation_id: relation.id };
}

function mapNote(row: any): GlobalNoteRecord {
  let body: any = {};
  try { body = typeof row.body === "string" ? JSON.parse(row.body) : row.body ?? {}; } catch { body = { plainTextPreview: row.body ?? "" }; }
  const relation: NoteRelationRef | null = row.contact_id
    ? { type: "contact", id: row.contact_id, label: "Contact" }
    : row.lead_id
      ? { type: "lead", id: row.lead_id, label: "Lead" }
      : row.opportunity_id
        ? { type: "opportunity", id: row.opportunity_id, label: "Opportunity" }
        : row.relation_id && row.relation_type
          ? { type: row.relation_type, id: row.relation_id, label: row.relation_type }
          : null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    authorId: row.author_user_id,
    authorName: body.authorName ?? "",
    title: body.title ?? "",
    mode: body.mode === "rich" ? "rich" : "quick",
    visibility: row.visibility ?? "team",
    relations: relation ? [relation] : [],
    content: body.content ?? { type: "doc", content: [] },
    plainTextPreview: body.plainTextPreview ?? row.body ?? "",
    mentions: body.mentions ?? [],
    attachments: body.attachments ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    permissions: { canEdit: true, canDelete: true },
  };
}

function clientOrThrow() {
  const client = defaultWebAuthAdapter.getClient();
  if (!client) throw new Error("Supabase is not configured.");
  return client;
}

function activeOrganizationId(): string | null {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem("loopdev:auth-session") : null;
    const parsed = raw ? JSON.parse(raw) : null;
    return isUuid(parsed?.activeOrganizationId) ? parsed.activeOrganizationId : null;
  } catch {
    return null;
  }
}

export const supabaseNotesAdapter: GlobalNotesAdapter = {
  async list(relation) {
    if (!relation || relation.id === LOCAL_ORGANIZATION_ID || !isUuid(relation.id)) return localNotesAdapter.list(relation);
    const client = clientOrThrow();
    let query = client.from("crm_notes").select("*");
    const organizationId = activeOrganizationId();
    if (organizationId) query = query.eq("organization_id", organizationId);
    if (relation.type === "contact") query = query.eq("contact_id", relation.id);
    else query = query.eq("relation_id", relation.id).eq("relation_type", relation.type);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapNote);
  },

  async create(input: CreateGlobalNoteInput) {
    if (input.organizationId === LOCAL_ORGANIZATION_ID || !isUuid(input.organizationId)) return localNotesAdapter.create(input);
    if (!input.plainTextPreview.trim()) throw new Error("Note content is required.");
    const client = clientOrThrow();
    const relation = input.relations[0];
    const session = (await client.auth.getSession()).data.session;
    if (!session?.user.id) throw new Error("An authenticated user is required to create a note.");
    const body = JSON.stringify({ title: input.title ?? "", mode: input.mode, content: input.content, plainTextPreview: input.plainTextPreview.trim(), mentions: input.mentions ?? [], attachments: input.attachments ?? [], authorName: input.authorName });
    const { data, error } = await client.from("crm_notes").insert({ organization_id: input.organizationId, author_user_id: session.user.id, body, visibility: input.visibility, ...relationColumn(relation) }).select().single();
    if (error || !data) throw error ?? new Error("The note could not be created.");
    return mapNote(data);
  },

  async update(noteId, input) {
    if (!isUuid(noteId)) return localNotesAdapter.update(noteId, input);
    const client = clientOrThrow();
    const body = JSON.stringify({ title: input.title ?? "", mode: input.mode ?? "quick", content: input.content ?? { type: "doc", content: [] }, plainTextPreview: input.plainTextPreview ?? "", mentions: input.mentions ?? [], attachments: input.attachments ?? [], authorName: input.authorName ?? "" });
    const { data, error } = await client.from("crm_notes").update({ body, visibility: input.visibility, ...relationColumn(input.relations?.[0]), updated_at: new Date().toISOString() }).eq("id", noteId).select().single();
    if (error || !data) throw error ?? new Error("The note could not be updated.");
    return mapNote(data);
  },

  async delete(noteId) {
    if (!isUuid(noteId)) return localNotesAdapter.delete(noteId);
    const { error } = await clientOrThrow().from("crm_notes").delete().eq("id", noteId);
    if (error) throw error;
  },

  async seed(records) { return localNotesAdapter.seed(records); },
  async uploadAttachment(_file): Promise<NoteAttachment> { throw new Error("Supabase Storage is disabled in the local profile; attachments are unavailable."); },
  releaseAttachment(attachment) { if (attachment.url.startsWith("blob:")) URL.revokeObjectURL(attachment.url); },
  async listWorkspaceUsers(organizationId): Promise<WorkspaceUser[]> {
    if (!isUuid(organizationId)) return localNotesAdapter.listWorkspaceUsers(organizationId);
    const { data, error } = await clientOrThrow().from("organization_memberships").select("user_id, users:auth_users(id, email)").eq("organization_id", organizationId);
    if (error) throw error;
    return (data ?? []).map((row: any) => ({ id: row.user_id, displayName: row.users?.email ?? row.user_id, email: row.users?.email, organizationId }));
  },
};