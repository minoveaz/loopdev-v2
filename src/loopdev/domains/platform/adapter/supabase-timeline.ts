import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
import type { ActivityRecord, EntityRef, TimelineEvent, TaskRecord, NoteRecord } from "../types";
import type { AppendTimelineInput, PlatformPage, PlatformTimelineListParams, PlatformWorkAdapter } from "./work";

function mapRow(row: any): TimelineEvent {
  const scope = { organizationId: row.organization_id, workspaceId: row.workspace_id ?? null, brandId: row.brand_id ?? null };
  const relation: EntityRef | null = row.relation_id && row.relation_type
    ? { entityType: row.relation_type, entityId: row.relation_id, scope }
    : null;
  return {
    id: row.id,
    scope,
    relation,
    type: row.type,
    actorId: row.actor_id ?? null,
    actorType: row.actor_type,
    origin: row.origin,
    sourceType: row.source_type,
    sourceId: row.source_id,
    dedupeKey: row.dedupe_key,
    summary: row.summary,
    metadata: row.metadata ?? {},
    visibility: row.visibility,
    permissions: { canRead: true, canEdit: false, canDelete: false, canAssign: false, canModerate: false },
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActivity(row: any): ActivityRecord {
  const timeline = mapRow(row);
  return {
    ...timeline,
    metadata: Object.fromEntries(Object.entries(timeline.metadata).map(([key, value]) => [key, String(value)])),
  };
}

function clientOrThrow() {
  const client = defaultWebAuthAdapter.getClient();
  if (!client) throw new Error("Supabase is not configured for the active organization.");
  return client;
}

async function listRemoteRows(
  scope: { organizationId: string; workspaceId?: string | null; brandId?: string | null },
  relation?: EntityRef,
  limit?: number,
) {
  let query = clientOrThrow()
    .from("platform_timeline_events")
    .select("*")
    .eq("organization_id", scope.organizationId)
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: false });
  if (scope.workspaceId) query = query.or(`workspace_id.is.null,workspace_id.eq.${scope.workspaceId}`);
  if (scope.brandId) query = query.or(`brand_id.is.null,brand_id.eq.${scope.brandId}`);
  if (relation) query = query.eq("relation_type", relation.entityType).eq("relation_id", relation.entityId);
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

function isRemoteOrganization(organizationId: string | undefined): boolean {
  return Boolean(organizationId && /^[0-9a-f-]{36}$/i.test(organizationId));
}

export function createSupabaseTimelineAdapter(local: PlatformWorkAdapter): PlatformWorkAdapter {
  return {
    ...local,
    async listTasks(params: any = {}) {
      const scope = params.scope ?? { organizationId: params.organizationId ?? "" };
      if (!isRemoteOrganization(scope.organizationId)) return local.listTasks(params);
      let query = clientOrThrow().from("crm_tasks").select("*")
        .eq("organization_id", scope.organizationId)
        .order("due_at", { ascending: true, nullsFirst: false });
      if (params.includeCompleted === false) query = query.not("status", "in", '("completed","cancelled")');
      if (params.limit) query = query.limit(params.limit);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      const items: TaskRecord[] = (data ?? []).map((row: any) => {
        const rowScope = { organizationId: row.organization_id, workspaceId: row.workspace_id ?? null, brandId: row.brand_id ?? null };
        const entityType = row.relation_type ?? "contact";
        const entityId = row.relation_id ?? row.contact_id;
        return {
          id: row.id, scope: rowScope, createdById: row.created_by_user_id ?? null, updatedById: row.last_actor_user_id ?? null,
          createdAt: row.created_at, updatedAt: row.updated_at, version: row.version ?? 1, visibility: row.visibility ?? "organization",
          permissions: { canRead: true, canEdit: false, canDelete: false, canAssign: false, canModerate: false },
          title: row.title, description: row.description ?? null, status: row.status ?? "open", priority: row.priority ?? "normal",
          ownerId: row.owner_id ?? null, assignedUserId: row.assigned_to_user_id ?? null, dueAt: row.due_at ?? null,
          relation: { entityType, entityId, scope: rowScope }, completedAt: row.completed_at ?? null,
        };
      });
      return { items, nextCursor: null, hasMore: false, total: items.length };
    },
    async listNotes(params: any = {}) {
      const scope = params.scope ?? { organizationId: params.organizationId ?? "" };
      if (!isRemoteOrganization(scope.organizationId)) return local.listNotes(params);
      let query = clientOrThrow().from("crm_notes").select("*")
        .eq("organization_id", scope.organizationId)
        .order("created_at", { ascending: false });
      if (params.limit) query = query.limit(params.limit);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      const items: NoteRecord[] = (data ?? []).map((row: any) => {
        const rowScope = { organizationId: row.organization_id, workspaceId: row.workspace_id ?? null, brandId: row.brand_id ?? null };
        return {
          id: row.id, scope: rowScope, createdById: row.created_by_user_id ?? null, updatedById: row.last_actor_user_id ?? null,
          createdAt: row.created_at, updatedAt: row.updated_at, version: row.version ?? 1, visibility: row.visibility ?? "organization",
          permissions: { canRead: true, canEdit: false, canDelete: false, canAssign: false, canModerate: false },
          status: row.status ?? "active", authorId: row.author_id ?? row.created_by_user_id ?? "system",
          body: row.body ?? row.content ?? "", relation: {
            entityType: row.relation_type ?? "contact", entityId: row.relation_id ?? row.contact_id, scope: rowScope,
          },
        };
      });
      return { items, nextCursor: null, hasMore: false, total: items.length };
    },
    async listAttachments(params: any = {}) {
      const scope = params.scope ?? { organizationId: params.organizationId ?? "" };
      if (!isRemoteOrganization(scope.organizationId)) return local.listAttachments(params);
      return { items: [], nextCursor: null, hasMore: false, total: 0 };
    },
    async listActivities(params: any) {
      const scope = params?.scope ?? { organizationId: params?.organizationId ?? "" };
      if (!isRemoteOrganization(scope.organizationId)) return local.listActivities(params);
      const rows = await listRemoteRows(scope, params?.relation, params?.limit);
      const items = rows.map(mapActivity);
      return { items, nextCursor: null, hasMore: false, total: items.length };
    },
    async listTimeline(params: PlatformTimelineListParams = {}): Promise<PlatformPage<TimelineEvent>> {
      const scope = params.scope ?? { organizationId: params.organizationId ?? "" };
      if (!isRemoteOrganization(scope.organizationId)) return local.listTimeline(params);
      const rows = await listRemoteRows(scope, params.relation, params.limit);
      const items = rows.map(mapRow);
      return { items, nextCursor: null, hasMore: false, total: items.length };
    },
    async appendTimeline(input: AppendTimelineInput): Promise<TimelineEvent> {
      const scope = input.scope ?? { organizationId: input.organizationId ?? "" };
      if (!isRemoteOrganization(scope.organizationId)) return local.appendTimeline(input);
      const payload = {
        organization_id: scope.organizationId,
        workspace_id: scope.workspaceId ?? null,
        brand_id: scope.brandId ?? null,
        relation_type: input.relation?.entityType ?? null,
        relation_id: input.relation?.entityId ?? null,
        type: input.type,
        actor_id: input.actorId ?? null,
        actor_type: input.actorType ?? "system",
        origin: input.origin ?? "system",
        source_type: input.sourceType,
        source_id: input.sourceId,
        dedupe_key: input.dedupeKey ?? `${input.sourceType}:${input.sourceId}`,
        summary: input.summary,
        metadata: input.metadata ?? {},
        visibility: "organization",
        occurred_at: input.occurredAt ?? new Date().toISOString(),
      };
      const { data, error } = await clientOrThrow()
        .from("platform_timeline_events")
        .upsert(payload, { onConflict: "organization_id,dedupe_key" })
        .select()
        .single();
      if (error || !data) throw new Error(error?.message ?? "Timeline append failed.");
      return mapRow(data);
    },
  };
}
