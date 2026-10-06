import type { ActivityRecord, ActivityTimelinePort } from "../../../packages/contracts/src/activity-timeline";
import { mobileSupabaseClient } from "./supabase";

function mapRow(row: Record<string, any>): ActivityRecord {
  return {
    id: row.id,
    scope: { organizationId: row.organization_id, workspaceId: row.workspace_id ?? null },
    relation: row.relation_type && row.relation_id
      ? { entityType: row.relation_type, entityId: row.relation_id }
      : null,
    type: row.type,
    actorId: row.actor_id ?? null,
    sourceType: row.source_type,
    sourceId: row.source_id,
    summary: row.summary,
    metadata: Object.fromEntries(Object.entries(row.metadata ?? {}).map(([key, value]) => [key, String(value)])),
    occurredAt: row.occurred_at,
  };
}

export const mobileActivityTimelineAdapter: ActivityTimelinePort = {
  async list({ scope, relation, limit }) {
    if (!scope.organizationId) return [];
    let query = mobileSupabaseClient
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
    return (data ?? []).map(mapRow);
  },

  async append(input) {
    if (!input.scope.organizationId) throw new Error("An organization is required.");
    const { data, error } = await mobileSupabaseClient
      .from("platform_timeline_events")
      .upsert({
        organization_id: input.scope.organizationId,
        workspace_id: input.scope.workspaceId ?? null,
        relation_type: input.relation?.entityType ?? null,
        relation_id: input.relation?.entityId ?? null,
        type: input.type,
        actor_id: input.actorId ?? null,
        actor_type: "user",
        origin: "mobile",
        source_type: input.sourceType,
        source_id: input.sourceId,
        dedupe_key: input.dedupeKey ?? `${input.sourceType}:${input.sourceId}`,
        summary: input.summary,
        metadata: input.metadata ?? {},
        visibility: "organization",
        occurred_at: input.occurredAt ?? new Date().toISOString(),
      }, { onConflict: "organization_id,dedupe_key" })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "Unable to append timeline event.");
    return mapRow(data);
  },
};
