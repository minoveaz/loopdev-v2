import { useEffect, useState } from "react";
import { platformAdapter } from "../adapter";
import type { AnalyticsFilters, AnalyticsMetricId, AnalyticsMetricResult, AnalyticsBreakdownResult } from "./types";

const READ_CACHE_TTL = 60_000;
const MAX_STALE_AGE = 5 * 60_000;
const analyticsCache = new Map<string, { savedAt: number; data: AnalyticsMetricResult | AnalyticsBreakdownResult }>();

function cacheKey(kind: string, id: string, filters: AnalyticsFilters) {
  return `${kind}:${id}:${JSON.stringify(filters)}`;
}

export function isAnalyticsCacheFresh(savedAt: number, now = Date.now()) {
  return now - savedAt <= MAX_STALE_AGE;
}

function cacheIsUsable(cached: { savedAt: number; data: AnalyticsMetricResult | AnalyticsBreakdownResult } | undefined) {
  return Boolean(cached && isAnalyticsCacheFresh(cached.savedAt));
}

export function useAnalyticsMetric(metricId: AnalyticsMetricId, filters: AnalyticsFilters) {
  const [state, setState] = useState<{
    status: "loading" | "success" | "empty" | "error" | "stale";
    data: AnalyticsMetricResult | null;
    error: string | null;
  }>({ status: "loading", data: null, error: null });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    const key = cacheKey("metric", metricId, filters);
    const cached = analyticsCache.get(key);
    if (cached && Date.now() - cached.savedAt < READ_CACHE_TTL) {
      setState({ status: "success", data: cached.data as AnalyticsMetricResult, error: null });
      return () => { active = false; };
    }
    const usableCache = cacheIsUsable(cached) ? cached : undefined;
    setState({ status: usableCache ? "stale" : "loading", data: usableCache?.data as AnalyticsMetricResult ?? null, error: null });
    void platformAdapter.analytics.getMetric(metricId, filters).then((response) => {
      if (!active) return;
      if (response.success === false) {
        setState({ status: usableCache ? "stale" : "error", data: usableCache?.data as AnalyticsMetricResult ?? null, error: response.error.message });
        return;
      }
      analyticsCache.set(key, { savedAt: Date.now(), data: response.data });
      setState({
        status: response.data.value === 0 ? "empty" : "success",
        data: response.data,
        error: null,
      });
    });
    return () => { active = false; };
  }, [filters, metricId, reloadToken]);

  return { ...state, reload: () => setReloadToken((token) => token + 1) };
}

export function useAnalyticsBreakdown(metricId: string, filters: AnalyticsFilters) {
  const [state, setState] = useState<{
    status: "loading" | "success" | "empty" | "error" | "stale";
    data: AnalyticsBreakdownResult | null;
    error: string | null;
  }>({ status: "loading", data: null, error: null });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    const key = cacheKey("breakdown", metricId, filters);
    const cached = analyticsCache.get(key);
    if (cached && Date.now() - cached.savedAt < READ_CACHE_TTL) {
      setState({ status: "success", data: cached.data as AnalyticsBreakdownResult, error: null });
      return () => { active = false; };
    }
    const usableCache = cacheIsUsable(cached) ? cached : undefined;
    setState({ status: usableCache ? "stale" : "loading", data: usableCache?.data as AnalyticsBreakdownResult ?? null, error: null });
    void platformAdapter.analytics.getBreakdown(metricId, filters).then((response) => {
      if (!active) return;
      if (response.success === false) {
        setState({ status: usableCache ? "stale" : "error", data: usableCache?.data as AnalyticsBreakdownResult ?? null, error: response.error.message });
        return;
      }
      analyticsCache.set(key, { savedAt: Date.now(), data: response.data });
      setState({ status: response.data.items.length ? "success" : "empty", data: response.data, error: null });
    });
    return () => { active = false; };
  }, [filters, metricId, reloadToken]);

  return { ...state, reload: () => setReloadToken((token) => token + 1) };
}
