import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
import type { ActivityRecord, EntityRef, TimelineEvent } from "../types";
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
  scope: { organizationId: string; workspaceId?: string | null },
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
  if (relation) query = query.eq("relation_type", relation.entityType).eq("relation_id", relation.entityId);
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function createSupabaseTimelineAdapter(local: PlatformWorkAdapter): PlatformWorkAdapter {
  return {
    ...local,
    async listActivities(params: any) {
      const scope = params?.scope ?? { organizationId: params?.organizationId ?? "" };
      if (!scope.organizationId || scope.organizationId === "local-development-organization") return local.listActivities(params);
      const rows = await listRemoteRows(scope, params?.relation, params?.limit);
      const items = rows.map(mapActivity);
      return { items, nextCursor: null, hasMore: false, total: items.length };
    },
    async listTimeline(params: PlatformTimelineListParams = {}): Promise<PlatformPage<TimelineEvent>> {
      const scope = params.scope ?? { organizationId: params.organizationId ?? "" };
      if (!scope.organizationId || scope.organizationId === "local-development-organization") return local.listTimeline(params);
      const rows = await listRemoteRows(scope, params.relation, params.limit);
      const items = rows.map(mapRow);
      return { items, nextCursor: null, hasMore: false, total: items.length };
    },
    async appendTimeline(input: AppendTimelineInput): Promise<TimelineEvent> {
      const scope = input.scope ?? { organizationId: input.organizationId ?? "" };
      if (!scope.organizationId || scope.organizationId === "local-development-organization") return local.appendTimeline(input);
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
