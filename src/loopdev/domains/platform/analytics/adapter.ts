import type {
  AnalyticsFilters,
  AnalyticsInterval,
  AnalyticsMetricId,
  AnalyticsMetricResult,
  AnalyticsResponse,
  AnalyticsSeriesResult,
  AnalyticsBreakdownResult,
} from "./types";

export interface AnalyticsAdapter {
  getMetric(metricId: AnalyticsMetricId, filters: AnalyticsFilters): Promise<AnalyticsResponse<AnalyticsMetricResult>>;
  getTimeSeries(
    metricId: AnalyticsMetricId,
    filters: AnalyticsFilters,
    interval: AnalyticsInterval,
  ): Promise<AnalyticsResponse<AnalyticsSeriesResult>>;
  getBreakdown(
    metricId: string,
    filters: AnalyticsFilters,
  ): Promise<AnalyticsResponse<AnalyticsBreakdownResult>>;
}
