import { defaultWebAuthAdapter } from "../adapter/auth-supabase";
import { analyticsMetricCatalog } from "./catalog";
import type { AnalyticsAdapter } from "./adapter";
import type {
  AnalyticsFilters,
  AnalyticsInterval,
  AnalyticsMetricId,
  AnalyticsMetricResult,
  AnalyticsResponse,
  AnalyticsSeriesResult,
  AnalyticsBreakdownResult,
  AnalyticsError,
} from "./types";

type ExtractionMetricRow = {
  status: string;
  fields: { overallConfidence?: number; usage?: { estimatedCostUsd?: number } } | null;
};

const client = defaultWebAuthAdapter.getClient();
export const supabaseAnalyticsConfigured = Boolean(client);
const OPEN_OPPORTUNITY_STAGES = ["prospecting", "qualified", "proposal", "negotiation", "propuesta", "negociacion"];

function unavailable<T>(message: string): AnalyticsResponse<T> {
  return { success: false, error: { code: "UNAVAILABLE", message } };
}

export function mapRemoteError(error: unknown): AnalyticsError {
  const message = error instanceof Error ? error.message : "Analytics query failed.";
  const normalized = message.toLowerCase();
  if (normalized.includes("permission") || normalized.includes("row-level security") || normalized.includes("access denied")) {
    return { code: "FORBIDDEN", message: "This data is not available for the active scope." };
  }
  if (normalized.includes("invalid") || normalized.includes("unsupported")) {
    return { code: "INVALID_FILTER", message: "The analytics filter is not valid." };
  }
  if (normalized.includes("jwt") || normalized.includes("auth")) {
    return { code: "UNAUTHORIZED", message: "Authentication is required to load analytics." };
  }
  if (normalized.includes("schema") || normalized.includes("column") || normalized.includes("function")) {
    return { code: "SCHEMA_MISMATCH", message: "The remote analytics contract is unavailable." };
  }
  return { code: "UNAVAILABLE", message };
}

function remoteFailure<T>(error: unknown): AnalyticsResponse<T> {
  return { success: false, error: mapRemoteError(error) };
}

function freshnessMetadata() {
  const generatedAt = new Date();
  return {
    generatedAt: generatedAt.toISOString(),
    freshUntil: new Date(generatedAt.getTime() + 60_000).toISOString(),
    sourceVersion: generatedAt.toISOString(),
    freshness: "fresh" as const,
  };
}

function metricResult(
  metricId: AnalyticsMetricId,
  filters: AnalyticsFilters,
  value: number,
): AnalyticsResponse<AnalyticsMetricResult> {
  return {
    success: true,
    data: {
      kind: "metric",
      metric: analyticsMetricCatalog[metricId],
      value,
      scope: filters.scope,
      ...freshnessMetadata(),
    },
  };
}

async function extractionRows(filters: AnalyticsFilters): Promise<ExtractionMetricRow[] | null> {
  if (!client || !filters.scope.organizationId) return null;
  let query = client
    .from("document_intelligence_extractions")
    .select("status, fields")
    .eq("organization_id", filters.scope.organizationId);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ExtractionMetricRow[];
}

export const supabaseAnalyticsAdapter: AnalyticsAdapter = {
  async getMetric(metricId, filters) {
    try {
      if (metricId === "crm.contacts") {
        if (!client) return unavailable("Supabase is not configured.");
        let query = client.from("crm_contacts").select("id")
          .eq("organization_id", filters.scope.organizationId).is("archived_at", null);
        if (filters.scope.workspaceId) query = query.eq("workspace_id", filters.scope.workspaceId);
        if (filters.scope.brandId) query = query.eq("brand_id", filters.scope.brandId);
        const { data, error } = await query;
        if (error) throw error;
        return metricResult(metricId, filters, data?.length ?? 0);
      }
      if (metricId === "crm.open_leads") {
        if (!client) return unavailable("Supabase is not configured.");
        let query = client.from("crm_leads").select("id", { count: "exact", head: true })
          .eq("organization_id", filters.scope.organizationId).is("archived_at", null)
          .not("status", "in", '("converted","inactive")');
        if (filters.scope.workspaceId) query = query.eq("workspace_id", filters.scope.workspaceId);
        if (filters.scope.brandId) query = query.eq("brand_id", filters.scope.brandId);
        const { count, error } = await query;
        if (error) throw error;
        return metricResult(metricId, filters, count ?? 0);
      }
      if (metricId === "crm.open_opportunities" || metricId === "crm.pipeline_value") {
        if (!client) return unavailable("Supabase is not configured.");
        let query = client.from("crm_opportunities").select("amount, stage_key")
          .eq("organization_id", filters.scope.organizationId).is("archived_at", null)
          .in("stage_key", OPEN_OPPORTUNITY_STAGES);
        if (filters.scope.workspaceId) query = query.eq("workspace_id", filters.scope.workspaceId);
        if (filters.scope.brandId) query = query.eq("brand_id", filters.scope.brandId);
        const { data, error } = await query;
        if (error) throw error;
        const rows = data ?? [];
        return metricResult(metricId, filters, metricId === "crm.open_opportunities"
          ? rows.length
          : rows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0));
      }
      if (!metricId.startsWith("document_intelligence.")) {
        return unavailable("This metric is not available in the Supabase Analytics adapter yet.");
      }
      const rows = await extractionRows(filters);
      if (!rows) return unavailable("Supabase is not configured or organization scope is missing.");
      if (metricId === "document_intelligence.processed") return metricResult(metricId, filters, rows.length);
      if (metricId === "document_intelligence.pending_review") {
        return metricResult(metricId, filters, rows.filter((row) => row.status === "review").length);
      }
      if (metricId === "document_intelligence.average_confidence") {
        const values = rows
          .map((row) => Number(row.fields?.overallConfidence))
          .filter((value) => Number.isFinite(value));
        return metricResult(metricId, filters, values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length) * 100 : 0);
      }
      const cost = rows.reduce((sum, row) => sum + Number(row.fields?.usage?.estimatedCostUsd ?? 0), 0);
      return metricResult(metricId, filters, cost);
    } catch (error) {
      return remoteFailure(error);
    }
  },

  async getTimeSeries(metricId, filters, _interval: AnalyticsInterval) {
    if (!client) return unavailable("Supabase is not configured.");
    const from = filters.from ?? new Date(Date.now() - 30 * 86400000).toISOString();
    const to = filters.to ?? new Date().toISOString();
    const { data, error } = await client.rpc("platform_analytics_time_series", {
      p_metric_id: metricId,
      p_organization_id: filters.scope.organizationId,
      p_from: from,
      p_to: to,
      p_interval: _interval,
    });
    if (error) return remoteFailure(error);
    return {
      success: true,
      data: {
        kind: "series",
        metric: analyticsMetricCatalog[metricId as keyof typeof analyticsMetricCatalog],
        points: (data ?? []).map((point: { bucket: string; value: number }) => ({ label: point.bucket, value: Number(point.value) })),
        scope: filters.scope,
        ...freshnessMetadata(),
      },
    };
  },

  async getBreakdown(metricId, filters) {
    if (!client) return unavailable("Supabase is not configured.");
    if (metricId === "crm.pipeline_by_stage") {
      try {
        let query = client.from("crm_opportunities").select("stage_key")
          .eq("organization_id", filters.scope.organizationId).is("archived_at", null)
          .in("stage_key", OPEN_OPPORTUNITY_STAGES);
        if (filters.scope.workspaceId) query = query.eq("workspace_id", filters.scope.workspaceId);
        if (filters.scope.brandId) query = query.eq("brand_id", filters.scope.brandId);
        const { data, error } = await query;
        if (error) throw error;
        const counts = new Map<string, number>();
        for (const row of data ?? []) counts.set(row.stage_key, (counts.get(row.stage_key) ?? 0) + 1);
        return {
          success: true,
          data: {
            kind: "breakdown",
            metricId,
            items: [...counts.entries()].map(([key, value]) => ({ key, value })),
            scope: filters.scope,
            ...freshnessMetadata(),
          },
        } satisfies AnalyticsResponse<AnalyticsBreakdownResult>;
      } catch (error) {
        return remoteFailure(error);
      }
    }
    const { data, error } = await client.rpc("platform_analytics_breakdown", {
      p_metric_id: metricId,
      p_organization_id: filters.scope.organizationId,
      p_from: filters.from ?? "-infinity",
      p_to: filters.to ?? "infinity",
    });
    if (error) return remoteFailure(error);
    return {
      success: true,
      data: {
        kind: "breakdown",
        metricId,
        items: (data ?? []).map((item: { key: string; value: number }) => ({ key: item.key, value: Number(item.value) })),
        scope: filters.scope,
        ...freshnessMetadata(),
      },
    } satisfies AnalyticsResponse<AnalyticsBreakdownResult>;
  },
};
