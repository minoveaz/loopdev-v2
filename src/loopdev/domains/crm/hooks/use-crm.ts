import { useEffect, useState } from "react";
import { loopdevAdapter } from "@/loopdev/domains/crm/adapter";
import type {
  CRMContact,
  CRMContactListParams,
  CRMCreateOpportunityFromLeadInput,
  CRMLead,
  CRMUpdateLeadInput,
  CRMOpportunityListParams,
  CRMOpportunityMutationResult,
  CRMMoveOpportunityStageInput,
  CRMPipelineOpportunity,
  CRMPipelineStageCode,
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
      identityStatus: params.identityStatus,
      preferredChannel: params.preferredChannel,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
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
  }, [
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
    createOpportunityFromLead,
    updateLead,
    resetConversion: () => setConversion({ status: "idle" }),
    reload: () => setReloadToken((token) => token + 1),
  };
}

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
  }, [params.query, stageCodesKey, ownerIdsKey, reloadToken]);

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

  return {
    opportunities,
    loading,
    error,
    forbidden,
    mutation,
    moveStage,
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
