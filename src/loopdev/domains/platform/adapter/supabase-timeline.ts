import { createClient } from "@supabase/supabase-js";
import type { ActivityRecord, TimelineEvent, EntityRef } from "../types";
import type { AppendTimelineInput, PlatformPage, PlatformTimelineListParams, PlatformWorkAdapter } from "./work";

const client = createClient(
  import.meta.env.VITE_SUPABASE_URL || "https://sukjcsylkljiyvfklxvj.supabase.co",
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_y7LKtWICauXvyWo6Aa9pSA_ylMUg845",
);

function mapRow(row: any): TimelineEvent {
  const scope = { organizationId: row.organization_id, workspaceId: row.workspace_id ?? null, brandId: row.brand_id ?? null };
  const relation: EntityRef | null = row.relation_id && row.relation_type ? { entityType: row.relation_type, entityId: row.relation_id, scope } : null;
  return {
    id: row.id, scope, relation, type: row.type, actorId: row.actor_id ?? null,
    actorType: row.actor_type, origin: row.origin, sourceType: row.source_type, sourceId: row.source_id,
    dedupeKey: row.dedupe_key, summary: row.summary, metadata: row.metadata ?? {}, visibility: row.visibility,
    permissions: { canRead: true, canEdit: false, canDelete: false, canAssign: false, canModerate: false },
    occurredAt: row.occurred_at, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function mapActivity(row: any): ActivityRecord {
  const timeline = mapRow(row);
  return { ...timeline, metadata: Object.fromEntries(Object.entries(timeline.metadata).map(([key, value]) => [key, String(value)])) };
}

function relationFilter(query: string, relation?: EntityRef) {
  if (!relation) return query;
  return `${query}&relation_type=eq.${encodeURIComponent(relation.entityType)}&relation_id=eq.${encodeURIComponent(relation.entityId)}`;
}

export function createSupabaseTimelineAdapter(local: PlatformWorkAdapter): PlatformWorkAdapter {
  return {
    ...local,
    async listActivities(params: any) {
      const scope = params?.scope ?? { organizationId: params?.organizationId ?? "" };
      if (!scope.organizationId || scope.organizationId === "local-development-organization") return local.listActivities(params);
      let query = `${import.meta.env.VITE_SUPABASE_URL || "https://sukjcsylkljiyvfklxvj.supabase.co"}/rest/v1/platform_timeline_events?select=*&organization_id=eq.${scope.organizationId}&order=occurred_at.desc,id.desc`;
      query = relationFilter(query, params?.relation);
      const response = await fetch(query, { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_y7LKtWICauXvyWo6Aa9pSA_ylMUg845", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_y7LKtWICauXvyWo6Aa9pSA_ylMUg845"}` } });
      if (!response.ok) throw new Error(`Activity read failed (${response.status}).`);
      const rows = await response.json() as any[];
      const items = rows.map(mapActivity);
      return { items, nextCursor: null, hasMore: false, total: items.length };
    },
    async listTimeline(params: PlatformTimelineListParams = {}): Promise<PlatformPage<TimelineEvent>> {
      const scope = params.scope ?? { organizationId: params.organizationId ?? "" };
      if (!scope.organizationId || scope.organizationId === "local-development-organization") return local.listTimeline(params);
      let query = `${import.meta.env.VITE_SUPABASE_URL || "https://sukjcsylkljiyvfklxvj.supabase.co"}/rest/v1/platform_timeline_events?select=*&organization_id=eq.${scope.organizationId}&order=occurred_at.desc,id.desc`;
      query = relationFilter(query, params.relation);
      const response = await fetch(query, { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_y7LKtWICauXvyWo6Aa9pSA_ylMUg845", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_y7LKtWICauXvyWo6Aa9pSA_ylMUg845"}` } });
      if (!response.ok) throw new Error(`Timeline read failed (${response.status}).`);
      const rows = await response.json() as any[];
      const items = rows.map(mapRow);
      return { items, nextCursor: null, hasMore: false, total: items.length };
    },
    async appendTimeline(input: AppendTimelineInput): Promise<TimelineEvent> {
      const scope = input.scope ?? { organizationId: input.organizationId ?? "" };
      if (!scope.organizationId || scope.organizationId === "local-development-organization") return local.appendTimeline(input);
      const payload = {
        organization_id: scope.organizationId, workspace_id: scope.workspaceId ?? null, brand_id: scope.brandId ?? null,
        relation_type: input.relation?.entityType ?? null, relation_id: input.relation?.entityId ?? null,
        type: input.type, actor_id: input.actorId ?? null, actor_type: input.actorType ?? "system", origin: input.origin ?? "system",
        source_type: input.sourceType, source_id: input.sourceId, dedupe_key: input.dedupeKey ?? `${input.sourceType}:${input.sourceId}`,
        summary: input.summary, metadata: input.metadata ?? {}, visibility: "organization", occurred_at: input.occurredAt ?? new Date().toISOString(),
      };
      const { data, error } = await client.from("platform_timeline_events").upsert(payload, { onConflict: "organization_id,dedupe_key" }).select().single();
      if (error || !data) throw new Error(error?.message ?? "Timeline append failed.");
      return mapRow(data);
    },
  };
}
