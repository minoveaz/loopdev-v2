import type { EntityScope } from "../types";

export type AnalyticsMetricId =
  | "crm.contacts"
  | "crm.open_leads"
  | "crm.open_opportunities"
  | "crm.pipeline_value"
  | "crm.pending_tasks"
  | "crm.activity_volume"
  | "document_intelligence.processed"
  | "document_intelligence.pending_review"
  | "document_intelligence.average_confidence"
  | "document_intelligence.estimated_cost";

export type AnalyticsMetricFormat = "number" | "currency" | "percent" | "duration";
export type AnalyticsInterval = "day" | "week" | "month";

export interface AnalyticsFilters {
  scope: EntityScope;
  from?: string;
  to?: string;
  ownerId?: string;
  status?: string;
}

export interface AnalyticsMetricDefinition {
  id: AnalyticsMetricId;
  suite: "crm" | "document-intelligence";
  label: string;
  format: AnalyticsMetricFormat;
  version: number;
}

export interface AnalyticsMetricResult {
  kind: "metric";
  metric: AnalyticsMetricDefinition;
  value: number;
  scope: EntityScope;
  generatedAt: string;
  freshUntil: string | null;
  sourceVersion: string;
  freshness: "fresh" | "stale";
}

export interface AnalyticsSeriesPoint {
  label: string;
  value: number;
}

export interface AnalyticsSeriesResult {
  kind: "series";
  metric: AnalyticsMetricDefinition;
  points: AnalyticsSeriesPoint[];
  scope: EntityScope;
  generatedAt: string;
  freshUntil: string | null;
  sourceVersion: string;
  freshness: "fresh" | "stale";
}

export interface AnalyticsBreakdownResult {
  kind: "breakdown";
  metricId: string;
  items: Array<{ key: string; value: number }>;
  scope: EntityScope;
  generatedAt: string;
  freshUntil: string | null;
  sourceVersion: string;
  freshness: "fresh" | "stale";
}

export type AnalyticsResult = AnalyticsMetricResult | AnalyticsSeriesResult | AnalyticsBreakdownResult;

export type AnalyticsErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_SCOPE"
  | "INVALID_FILTER"
  | "SCHEMA_MISMATCH"
  | "UNAVAILABLE"
  | "RATE_LIMITED";

export interface AnalyticsError {
  code: AnalyticsErrorCode;
  message: string;
}

export type AnalyticsResponse<T> =
  | { success: true; data: T }
  | { success: false; error: AnalyticsError };
