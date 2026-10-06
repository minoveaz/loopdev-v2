import { useEffect, useState, useCallback } from "react";
import { localDocumentIntelligenceAdapter } from "../adapter/local";
import { supabaseDocumentIntelligenceAdapter } from "../adapter/supabase";
import type {
  ExtractionRecord,
  ExtractionListParams,
  ExtractionMetrics,
} from "../adapter/types";
import { useTenantContext } from "@/hooks/use-tenant-context";

const DEFAULT_LIMIT = 10;

export function useDocumentIntelligence(params: Partial<Omit<ExtractionListParams, "organizationId">> = {}) {
  const { activeOrganization } = useTenantContext();
  const organizationId = activeOrganization?.id ?? "";
  const [extractions, setExtractions] = useState<ExtractionRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [metrics, setMetrics] = useState<ExtractionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const requestParams: ExtractionListParams = {
      organizationId,
      query: params.query,
      cursor: params.cursor ?? null,
      limit: params.limit ?? DEFAULT_LIMIT,
      status: params.status,
      sourceSuite: params.sourceSuite,
      documentType: params.documentType,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };

    if (!organizationId) {
      setExtractions([]);
      setMetrics(null);
      setLoading(false);
      return () => { active = false; };
    }
    const adapter = /^[0-9a-f-]{36}$/i.test(organizationId) ? supabaseDocumentIntelligenceAdapter : localDocumentIntelligenceAdapter;
    Promise.all([
      adapter.listExtractions(requestParams),
      adapter.getMetrics(organizationId),
    ])
      .then(([page, currentMetrics]) => {
        if (active) {
          setExtractions(page.items);
          setNextCursor(page.nextCursor);
          setHasMore(page.hasMore);
          setTotalCount(page.totalCount);
          setMetrics(currentMetrics);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Error al cargar las extracciones.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    params.query,
    params.cursor,
    params.limit,
    params.status,
    params.sourceSuite,
    params.documentType,
    params.sortBy,
    params.sortDirection,
    reloadKey,
    organizationId,
  ]);

  const deleteExtraction = useCallback(
    async (id: string) => {
      if (!organizationId) throw new Error("Selecciona una organización activa.");
      const adapter = /^[0-9a-f-]{36}$/i.test(organizationId) ? supabaseDocumentIntelligenceAdapter : localDocumentIntelligenceAdapter;
      await adapter.deleteExtraction(id);
      reload();
    },
    [organizationId, reload],
  );

  return {
    extractions,
    nextCursor,
    hasMore,
    totalCount,
    metrics,
    loading,
    error,
    reload,
    deleteExtraction,
  };
}
