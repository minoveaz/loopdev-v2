import { crmCustomersStore } from "../../crm/data/localCustomers";
import { localCrmLeadsStore } from "../../crm/data/localLeads";
import { localCrmOpportunitiesStore } from "../../crm/data/localOpportunities";
import { localDocumentIntelligenceAdapter } from "../../document-intelligence/adapter/local";
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
} from "./types";

function validateScope(filters: AnalyticsFilters): AnalyticsResponse<never> | null {
  if (!filters.scope.organizationId) {
    return { success: false, error: { code: "INVALID_SCOPE", message: "An organization scope is required." } };
  }
  return null;
}

function result(metricId: AnalyticsMetricId, filters: AnalyticsFilters, value: number): AnalyticsResponse<AnalyticsMetricResult> {
  const denied = validateScope(filters);
  if (denied) return denied;
  return {
    success: true,
    data: {
      kind: "metric",
      metric: analyticsMetricCatalog[metricId],
      value,
      scope: filters.scope,
      generatedAt: new Date().toISOString(),
      freshUntil: null,
      sourceVersion: "local",
      freshness: "fresh",
    },
  };
}

export const localAnalyticsAdapter: AnalyticsAdapter = {
  async getMetric(metricId, filters) {
    const scope = filters.scope.organizationId;
    switch (metricId) {
      case "crm.contacts":
        return result(metricId, filters, crmCustomersStore.list().length);
      case "crm.open_leads":
        return result(metricId, filters, localCrmLeadsStore.list().filter((item) => item.organizationId === scope && item.status !== "converted" && item.status !== "inactive").length);
      case "crm.open_opportunities":
        return result(metricId, filters, localCrmOpportunitiesStore.list().filter((item) => item.organizationId === scope && !item.archivedAt && !["won", "lost"].includes(item.stageCode)).length);
      case "crm.pipeline_value":
        return result(metricId, filters, localCrmOpportunitiesStore.list().filter((item) => item.organizationId === scope && !item.archivedAt && !["won", "lost"].includes(item.stageCode)).reduce((sum, item) => sum + item.amount, 0));
      case "document_intelligence.processed": {
        const metrics = await localDocumentIntelligenceAdapter.getMetrics(scope);
        return result(metricId, filters, metrics.totalProcessed);
      }
      case "document_intelligence.pending_review": {
        const metrics = await localDocumentIntelligenceAdapter.getMetrics(scope);
        return result(metricId, filters, metrics.reviewCount);
      }
      case "document_intelligence.average_confidence": {
        const metrics = await localDocumentIntelligenceAdapter.getMetrics(scope);
        return result(metricId, filters, metrics.averageConfidence * 100);
      }
      case "document_intelligence.estimated_cost": {
        const metrics = await localDocumentIntelligenceAdapter.getMetrics(scope);
        return result(metricId, filters, metrics.estimatedCostUsd);
      }
      default:
        return result(metricId, filters, 0);
    }
  },

  async getTimeSeries(metricId, filters, _interval: AnalyticsInterval) {
    const denied = validateScope(filters);
    if (denied) return denied;
    const metric = analyticsMetricCatalog[metricId];
    return {
      success: true,
      data: {
        kind: "series",
        metric,
        points: [],
        scope: filters.scope,
        generatedAt: new Date().toISOString(),
        freshUntil: null,
        sourceVersion: "local",
        freshness: "fresh",
      },
      };
  },

  async getBreakdown(metricId, filters) {
      const denied = validateScope(filters);
      if (denied) return denied;
      return { success: true, data: { kind: "breakdown", metricId, items: [], scope: filters.scope, generatedAt: new Date().toISOString(), freshUntil: null, sourceVersion: "local", freshness: "fresh" } satisfies AnalyticsBreakdownResult };
  },
};
