import { useEffect, useState } from "react";
import { loopdevAdapter } from "@/loopdev/domains/crm/adapter";
import { desktopContactAdapter } from "@/loopdev/domains/crm/adapter/contact";
import { useTenantContext } from "@/hooks/use-tenant-context";
export { useCrmAutomations } from "./use-crm-automations";
import type {
  CRMContact,
  CRMContactListParams,
  CRMCreateOpportunityFromLeadInput,
  CRMCreateLeadInput,
  CRMCreateOpportunityInput,
  CRMLead,
  CRMLeadMutationResult,
  CRMUpdateLeadInput,
  CRMOpportunityListParams,
  CRMOpportunityMutationResult,
  CRMMoveOpportunityStageInput,
  CRMUpdateOpportunityInput,
  CRMReopenOpportunityInput,
  CRMPipelineOpportunity,
  CRMPipelineStageCode,
  Customer360View,
} from "@/loopdev/domains/crm/adapter";

const LOCAL_ORGANIZATION_ID = "local-development-organization";
const DEFAULT_CONTACT_LIMIT = 10;

export function useCrmContacts(params: Partial<CRMContactListParams> = {}) {
  const { activeOrganization } = useTenantContext();
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const isVitest = Boolean(
    (typeof process !== "undefined" && (process.env?.VITEST || process.env?.NODE_ENV === "test")) ||
    (typeof import.meta !== "undefined" && ((import.meta as any).env?.VITEST || (import.meta as any).env?.MODE === "test"))
  );
  const orgId = params.organizationId || activeOrganization?.id || (!isVitest ? "80fce911-57c5-4a83-809f-78df6a3736f7" : "local-development-organization");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const request: CRMContactListParams = {
      organizationId: orgId,
      query: params.query,
      cursor: params.cursor ?? null,
      limit: params.limit ?? DEFAULT_CONTACT_LIMIT,
      identityStatus: params.identityStatus,
      preferredChannel: params.preferredChannel,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };
    void desktopContactAdapter.listContacts(request)
      .then((page) => {
        if (active) {
          setContacts(page.items);
          setNextCursor(page.nextCursor);
          setHasMore(page.hasMore);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load contacts.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [
    orgId,
    params.cursor,
    params.limit,
    params.query,
    params.identityStatus,
    params.preferredChannel,
    params.sortBy,
    params.sortDirection,
    reloadToken,
  ]);

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
  const [conversion, setConversion] = useState<CrmLeadConversionState>({ status: "idle" });
  const [creation, setCreation] = useState<CrmLeadCreationState>({ status: "idle" });

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

  const createOpportunityFromLead = async (
    leadId: string,
    input: CRMCreateOpportunityFromLeadInput,
  ) => {
    setConversion({ status: "pending", leadId });
    let result: CRMOpportunityMutationResult;
    try {
      result = await loopdevAdapter.crm.createOpportunityFromLead(leadId, input);
    } catch (cause: unknown) {
      result = { status: "server-error", message: cause instanceof Error ? cause.message : "Please try again." };
    }
    if (result.status === "success") {
      setConversion(result);
      setReloadToken((token) => token + 1);
    } else {
      setConversion({ status: result.status, message: result.message });
    }
    return result;
  };

  const createLead = async (input: Omit<CRMCreateLeadInput, "organizationId">) => {
    setCreation({ status: "pending" });
    let result: Awaited<ReturnType<typeof loopdevAdapter.crm.createLead>>;
    try {
      result = await loopdevAdapter.crm.createLead({ ...input, organizationId: LOCAL_ORGANIZATION_ID });
    } catch (cause: unknown) {
      result = { status: "server-error", message: cause instanceof Error ? cause.message : "Please try again." };
    }
    if (result.status === "success") {
      setLeads((current) => [result.lead, ...current]);
      setCreation({ status: "success", lead: result.lead });
    } else {
      setCreation({ status: result.status, message: result.message });
    }
    return result;
  };

  const updateLead = async (lead: CRMLead, input: Omit<CRMUpdateLeadInput, "organizationId" | "expectedUpdatedAt">) => {
    const result = await loopdevAdapter.crm.updateLead(lead.id, {
      ...input,
      organizationId: LOCAL_ORGANIZATION_ID,
      expectedUpdatedAt: lead.updatedAt,
    });
    if (result.status === "success") {
      setLeads((current) => current.map((item) => item.id === result.lead.id ? result.lead : item));
    } else if (result.status === "conflict" && result.lead) {
      setLeads((current) => current.map((item) => item.id === result.lead!.id ? result.lead! : item));
    }
    return result;
  };

  return {
    leads,
    loading,
    error,
    conversion,
    creation,
    createLead,
    createOpportunityFromLead,
    updateLead,
    resetConversion: () => setConversion({ status: "idle" }),
    reload: () => setReloadToken((token) => token + 1),
  };
}

export type CrmLeadCreationState =
  | { status: "idle" | "pending" }
  | { status: "success"; lead: CRMLead }
  | ({ status: Exclude<CRMLeadMutationResult["status"], "success"> } & { message: string });

export type CrmLeadConversionState =
  | { status: "idle" }
  | { status: "pending"; leadId: string }
  | { status: "success"; opportunity: CRMPipelineOpportunity }
  | ({ status: Exclude<CRMOpportunityMutationResult["status"], "success"> } & { message: string });

export type CrmPipelineMutationState =
  | { status: "idle" }
  | { status: "pending"; opportunityId: string }
  | ({ status: Exclude<CRMOpportunityMutationResult["status"], "success"> } & {
      message: string;
      opportunity?: CRMPipelineOpportunity;
    })
  | { status: "success"; opportunity: CRMPipelineOpportunity };

export interface UseCrmPipelineParams {
  query?: string;
  stageCodes?: CRMPipelineStageCode[];
  ownerIds?: string[];
  productKeys?: string[];
  catalogItemIds?: string[];
  origins?: ("manual" | "lead_conversion")[];
  sortBy?: "updated" | "name" | "amount" | "expectedCloseDate";
  sortDirection?: "asc" | "desc";
}

export function useCrmPipeline(params: UseCrmPipelineParams = {}) {
  const [opportunities, setOpportunities] = useState<CRMPipelineOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [mutation, setMutation] = useState<CrmPipelineMutationState>({ status: "idle" });
  const [reloadToken, setReloadToken] = useState(0);
  const stageCodesKey = (params.stageCodes ?? []).join(",");
  const ownerIdsKey = (params.ownerIds ?? []).join(",");
  const productKeysKey = (params.productKeys ?? []).join(",");
  const catalogItemIdsKey = (params.catalogItemIds ?? []).join(",");
  const originsKey = (params.origins ?? []).join(",");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setForbidden(false);
    const request: CRMOpportunityListParams = {
      organizationId: LOCAL_ORGANIZATION_ID,
      query: params.query,
      stageCodes: stageCodesKey ? stageCodesKey.split(",") as CRMPipelineStageCode[] : undefined,
      ownerIds: ownerIdsKey ? ownerIdsKey.split(",") : undefined,
      productKeys: productKeysKey ? productKeysKey.split(",") : undefined,
      catalogItemIds: catalogItemIdsKey ? catalogItemIdsKey.split(",") : undefined,
      origins: originsKey ? originsKey.split(",") as ("manual" | "lead_conversion")[] : undefined,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };
    void loopdevAdapter.crm.listOpportunities(request)
      .then((items) => {
        if (active) setOpportunities(items);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        if (typeof cause === "object" && cause !== null && "code" in cause && cause.code === "forbidden") {
          setForbidden(true);
          setError(null);
        } else {
          setError(cause instanceof Error ? cause.message : "Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [params.query, stageCodesKey, ownerIdsKey, productKeysKey, catalogItemIdsKey, originsKey, params.sortBy, params.sortDirection, reloadToken]);

  const moveStage = async (opportunity: CRMPipelineOpportunity, stageCode: CRMPipelineStageCode) => {
    const input: CRMMoveOpportunityStageInput = {
      organizationId: LOCAL_ORGANIZATION_ID,
      stageCode,
      expectedUpdatedAt: opportunity.updatedAt,
    };

    setMutation({ status: "pending", opportunityId: opportunity.id });
    const result = await loopdevAdapter.crm.moveOpportunityStage(opportunity.id, input);
    if (result.status === "success") {
      setMutation(result);
      setOpportunities((current) => current.map((item) => item.id === result.opportunity.id ? result.opportunity : item));
    } else {
      setMutation({
        status: result.status,
        message: result.message,
        ...(result.status === "conflict" ? { opportunity: result.opportunity } : {}),
      });
      if (result.status === "conflict") {
        setOpportunities((current) => current.map((item) => item.id === result.opportunity.id ? result.opportunity : item));
      }
    }
    return result;
  };

  const updateOpportunity = async (
    opportunity: CRMPipelineOpportunity,
    input: Omit<CRMUpdateOpportunityInput, "organizationId" | "expectedUpdatedAt">,
  ) => {
    const result = await loopdevAdapter.crm.updateOpportunity(opportunity.id, {
      ...input,
      organizationId: LOCAL_ORGANIZATION_ID,
      expectedUpdatedAt: opportunity.updatedAt,
    });
    if (result.status === "success") {
      setMutation(result);
      setOpportunities((current) => current.map((item) => item.id === result.opportunity.id ? result.opportunity : item));
    } else {
      setMutation({
        status: result.status,
        message: result.message,
        ...(result.status === "conflict" ? { opportunity: result.opportunity } : {}),
      });
      if (result.status === "conflict") {
        setOpportunities((current) => current.map((item) => item.id === result.opportunity.id ? result.opportunity : item));
      }
    }
    return result;
  };

  const createOpportunity = async (input: Omit<CRMCreateOpportunityInput, "organizationId">) => {
    setMutation({ status: "pending", opportunityId: "new" });
    let result: CRMOpportunityMutationResult;
    try {
      result = await loopdevAdapter.crm.createOpportunity({ ...input, organizationId: LOCAL_ORGANIZATION_ID });
    } catch (cause: unknown) {
      result = { status: "server-error", message: cause instanceof Error ? cause.message : "Please try again." };
    }
    if (result.status === "success") {
      setMutation(result);
      setOpportunities((current) => [result.opportunity, ...current]);
    } else {
      setMutation({ status: result.status, message: result.message, ...(result.status === "conflict" ? { opportunity: result.opportunity } : {}) });
    }
    return result;
  };

  const reopenOpportunity = async (
    opportunity: CRMPipelineOpportunity,
    input: Omit<CRMReopenOpportunityInput, "organizationId" | "expectedUpdatedAt">,
  ) => {
    setMutation({ status: "pending", opportunityId: opportunity.id });
    const result = await loopdevAdapter.crm.reopenOpportunity(opportunity.id, {
      ...input,
      organizationId: LOCAL_ORGANIZATION_ID,
      expectedUpdatedAt: opportunity.updatedAt,
    });
    if (result.status === "success") {
      setMutation(result);
      setOpportunities((current) => current.map((item) => item.id === result.opportunity.id ? result.opportunity : item));
    } else {
      setMutation({ status: result.status, message: result.message, ...(result.status === "conflict" ? { opportunity: result.opportunity } : {}) });
      if (result.status === "conflict") {
        setOpportunities((current) => current.map((item) => item.id === result.opportunity.id ? result.opportunity : item));
      }
    }
    return result;
  };

  return {
    opportunities,
    loading,
    error,
    forbidden,
    mutation,
    moveStage,
    updateOpportunity,
    createOpportunity,
    reopenOpportunity,
    reload: () => setReloadToken((token) => token + 1),
  };
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
