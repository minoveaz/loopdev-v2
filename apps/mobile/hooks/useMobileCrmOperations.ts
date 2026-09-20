import { useCallback, useEffect, useState } from "react";
import {
  CRM_LOCAL_CONTEXT,
  type CRMCustomFieldDefinition,
  type CRMCustomFieldValue,
  type CRMEntityType,
  type CRMExportInput,
  type CRMFilter,
  type CRMImportResult,
  type CRMOperationsContext,
  type CRMSearchResult,
  type CRMSavedView,
  type CRMTag,
} from "../domains/crm-operations";
import { mobileCrmOperationsAdapter } from "../domains/crm-operations";

export function useCrmOperations(entityType: CRMEntityType = "contact", context: CRMOperationsContext = CRM_LOCAL_CONTEXT) {
  const [savedViews, setSavedViews] = useState<CRMSavedView[]>([]);
  const [tags, setTags] = useState<CRMTag[]>([]);
  const [customFields, setCustomFields] = useState<CRMCustomFieldDefinition[]>([]);
  const [results, setResults] = useState<CRMSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([
      mobileCrmOperationsAdapter.listSavedViews(context, entityType),
      mobileCrmOperationsAdapter.listTags(context),
      mobileCrmOperationsAdapter.listCustomFieldDefinitions(context, entityType),
    ])
      .then(([views, nextTags, fields]) => {
        if (!active) return;
        setSavedViews(views);
        setTags(nextTags);
        setCustomFields(fields);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load CRM operations.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [context, entityType, reloadToken]);

  const search = useCallback(
    async (query: string, filters: CRMFilter[] = [], entityTypes?: CRMEntityType[]) => {
      const next = await mobileCrmOperationsAdapter.search({ ...context, query, filters, entityTypes });
      setResults(next);
      return next;
    },
    [context],
  );

  const createSavedView = useCallback(
    async (input: Pick<CRMSavedView, "name" | "entityType" | "filters" | "columns" | "visibility">) => {
      const view = await mobileCrmOperationsAdapter.createSavedView(context, input);
      setSavedViews((current) => [...current, view]);
      return view;
    },
    [context],
  );

  const deleteSavedView = useCallback(
    async (id: string) => {
      const deleted = await mobileCrmOperationsAdapter.deleteSavedView(context, id);
      if (deleted) setSavedViews((current) => current.filter((view) => view.id !== id));
      return deleted;
    },
    [context],
  );

  const createTag = useCallback(
    async (input: Pick<CRMTag, "name" | "color" | "visibility">) => {
      const tag = await mobileCrmOperationsAdapter.createTag(context, input);
      setTags((current) => [...current, tag]);
      return tag;
    },
    [context],
  );

  const updateTag = useCallback(
    async (id: string, patch: Partial<Pick<CRMTag, "name" | "color" | "visibility">>) => {
      const tag = await mobileCrmOperationsAdapter.updateTag(context, id, patch);
      if (tag) setTags((current) => current.map((item) => (item.id === tag.id ? tag : item)));
      return tag;
    },
    [context],
  );

  const bulkUpdateEntityTags = useCallback(
    (entityIds: string[], tagId: string, operation: "add" | "remove") =>
      mobileCrmOperationsAdapter.bulkUpdateEntityTags({ ...context, entityType, entityIds, tagId, operation }),
    [context, entityType],
  );

  const createCustomField = useCallback(
    async (
      input: Pick<
        CRMCustomFieldDefinition,
        "entityType" | "key" | "label" | "type" | "required" | "visibility" | "options"
      >,
    ) => {
      const field = await mobileCrmOperationsAdapter.createCustomFieldDefinition(context, input);
      setCustomFields((current) => [...current, field]);
      return field;
    },
    [context],
  );

  const updateCustomField = useCallback(
    async (
      id: string,
      patch: Partial<Pick<CRMCustomFieldDefinition, "label" | "required" | "visibility" | "options" | "active">>,
    ) => {
      const field = await mobileCrmOperationsAdapter.updateCustomFieldDefinition(context, id, patch);
      if (field) setCustomFields((current) => current.map((item) => (item.id === field.id ? field : item)));
      return field;
    },
    [context],
  );

  const setCustomFieldValue = useCallback(
    (input: Pick<CRMCustomFieldValue, "entityId" | "definitionId" | "value">) =>
      mobileCrmOperationsAdapter.setCustomFieldValue({ ...context, entityType, ...input }),
    [context, entityType],
  );

  const listCustomFieldValues = useCallback(
    (entityId: string) => mobileCrmOperationsAdapter.listCustomFieldValues(context, entityType, entityId),
    [context, entityType],
  );

  const importContacts = useCallback(
    (csv: string, mode: "validate" | "commit" = "commit") =>
      mobileCrmOperationsAdapter.importContacts({ ...context, csv, mode, deduplicateBy: "email_or_phone" }),
    [context],
  );

  const exportCsv = useCallback(
    (input: Omit<CRMExportInput, keyof CRMOperationsContext>) =>
      mobileCrmOperationsAdapter.exportCsv({ ...context, ...input }),
    [context],
  );

  return {
    savedViews,
    tags,
    customFields,
    results,
    loading,
    error,
    search,
    createSavedView,
    deleteSavedView,
    createTag,
    updateTag,
    bulkUpdateEntityTags,
    createCustomField,
    updateCustomField,
    setCustomFieldValue,
    listCustomFieldValues,
    importContacts,
    exportCsv,
    reload,
  };
}

export type { CRMImportResult };
