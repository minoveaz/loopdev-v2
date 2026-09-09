import { useEffect, useState } from "react";
import { loopdevAdapter } from "@/loopdev/domains/crm/adapter";
import type {
  CRMContact,
  CRMContactListParams,
  CRMLead,
  Customer360View,
} from "@/loopdev/domains/crm/adapter";

const LOCAL_ORGANIZATION_ID = "local-development-organization";
const DEFAULT_CONTACT_LIMIT = 10;

export function useCrmContacts(params: Partial<Omit<CRMContactListParams, "organizationId">> = {}) {
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const request: CRMContactListParams = {
      organizationId: LOCAL_ORGANIZATION_ID,
      query: params.query,
      cursor: params.cursor ?? null,
      limit: params.limit ?? DEFAULT_CONTACT_LIMIT,
    };
    void loopdevAdapter.crm.listContacts(request)
      .then((page) => {
        if (active) {
          setContacts(page.items);
          setNextCursor(page.nextCursor);
          setHasMore(page.hasMore);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [params.cursor, params.limit, params.query, reloadToken]);

  return {
    contacts,
    nextCursor,
    hasMore,
    forbidden: false,
    loading,
    error,
    reload: () => setReloadToken((token) => token + 1),
  };
}

export function useCrmLeads() {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void loopdevAdapter.crm.listLeads()
      .then((items) => {
        if (active) setLeads(items);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [reloadToken]);

  return { leads, loading, error, reload: () => setReloadToken((token) => token + 1) };
}

export function useCrmCustomer360(contactId: string | undefined) {
  const [view, setView] = useState<Customer360View | null>(null);
  const [loading, setLoading] = useState(Boolean(contactId));
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    if (!contactId) {
      setView(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    void loopdevAdapter.crm.getCustomer360(contactId)
      .then((result) => {
        if (active) setView(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [contactId, reloadToken]);

  return { view, loading, error, reload: () => setReloadToken((token) => token + 1) };
}
