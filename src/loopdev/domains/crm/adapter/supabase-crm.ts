import type {
  CRMCreateLeadInput,
  CRMLead,
  CRMLeadMutationResult,
  CRMUpdateLeadInput,
  CRMCreateOpportunityInput,
  CRMCreateOpportunityFromLeadInput,
  CRMOpportunityListParams,
  CRMOpportunityMutationResult,
  CRMMoveOpportunityStageInput,
  CRMUpdateOpportunityInput,
  CRMReopenOpportunityInput,
  CRMOpportunityStageHistory,
  CRMPipelineOpportunity,
} from "./types";
import { CRM_LEAD_STATUS_CODES, CRM_PIPELINE_STAGE_CODES } from "./types";
import { localLoopdevAdapter } from "./local";
import { DEFAULT_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_URL, defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCAL_ORGANIZATION_ID = "local-development-organization";

const statusToDatabase: Record<CRMLead["status"], { status: string; stage: string }> = {
  new: { status: "nuevo", stage: "lead" },
  contacted: { status: "contactado", stage: "contacted" },
  qualified: { status: "cualificado", stage: "proposal" },
  stalled: { status: "estancado", stage: "lead" },
  inactive: { status: "inactivo", stage: "discarded" },
  converted: { status: "convertido", stage: "won" },
};

const databaseStatusToApp: Record<string, CRMLead["status"]> = {
  active: "new",
  nuevo: "new",
  contactado: "contacted",
  cualificado: "qualified",
  estancado: "stalled",
  inactivo: "inactive",
  convertido: "converted",
};

function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function normalizeLeadSource(value: string | null | undefined): string {
  const normalized = (value ?? "manual").trim().toLowerCase();
  const aliases: Record<string, string> = { website: "website", referral: "referral", partner: "partner", social: "social", event: "campaign", direct: "manual", manual: "manual", email: "email", whatsapp: "whatsapp" };
  return aliases[normalized] ?? "other";
}

function mapLead(row: any): CRMLead {
  return {
    id: row.id,
    organizationId: row.organization_id,
    contactId: row.contact_id,
    status: databaseStatusToApp[row.status] ?? databaseStatusToApp[row.stage] ?? "new",
    interest: row.interest ?? null,
    source: row.source ?? null,
    assignedUserId: row.assigned_to_user_id ?? null,
    ownerName: null,
    score: row.lead_score ?? null,
    estimatedValue: row.estimated_budget ?? null,
    estimatedCurrency: null,
    qualificationNeed: row.qualification_need ?? null,
    qualificationTimeline: row.purchase_timeline ?? null,
    lastActivityAt: null,
    nextActivityAt: null,
    duplicateReviewId: null,
    archivedAt: row.archived_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOpportunity(row: any): CRMPipelineOpportunity {
  const stageCode = row.stage_key ?? row.stage ?? "prospecting";
  return {
    id: row.id, organizationId: row.organization_id, name: row.name,
    stageCode, stageLabel: stageCode, amount: row.amount ?? null, currency: row.currency ?? null,
    contact: { id: row.contact_id, displayName: row.contact_name ?? row.contact_id, email: row.contact_email ?? null },
    owner: row.assigned_to_user_id ? { id: row.assigned_to_user_id, displayName: row.owner_name ?? row.assigned_to_user_id } : null,
    probability: row.probability == null ? null : Number(row.probability) / 100,
    expectedCloseDate: row.expected_close_at ?? null, lossReason: row.loss_reason ?? null,
    updatedAt: row.updated_at, archivedAt: row.archived_at ?? null, contactId: row.contact_id,
    leadId: row.lead_id ?? null, productKey: row.product_key ?? null, catalogItemId: row.catalog_item_id ?? null,
    offerId: row.offer_id ?? null, variantId: row.variant_id ?? null,
    origin: row.origin === "conversion" ? "lead_conversion" : "manual", lines: [],
  };
}

function opportunityError(error: any): CRMOpportunityMutationResult {
  return { status: error?.code === "42501" ? "forbidden" : "server-error", message: error?.message ?? "The opportunity operation failed." } as CRMOpportunityMutationResult;
}

function getClient() {
  return defaultWebAuthAdapter.getClient();
}

function fallbackForOrganization(organizationId: string) {
  return organizationId === LOCAL_ORGANIZATION_ID || !isUuid(organizationId);
}

function activeOrganizationId(): string | null {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem("loopdev:auth-session") : null;
    const parsed = raw ? JSON.parse(raw) : null;
    if (isUuid(parsed?.activeOrganizationId)) return parsed.activeOrganizationId;
    const tenantOrganizationId = typeof window !== "undefined" ? window.localStorage.getItem("loopdev.active_org_id") : null;
    return isUuid(tenantOrganizationId) ? tenantOrganizationId : null;
  } catch {
    return null;
  }
}

export function createSupabaseCrmAdapter() {
  const local = localLoopdevAdapter.crm;

  return {
    async listLeads(): Promise<CRMLead[]> {
      if (!activeOrganizationId()) return local.listLeads();
      const client = getClient();
      if (!client) throw new Error("Supabase is not configured for the active organization.");
      try {
        const { data, error } = await client.from("crm_leads").select("*").eq("organization_id", activeOrganizationId()).is("archived_at", null).order("created_at", { ascending: false });
        if (error) throw error;
        return (data ?? []).map(mapLead);
      } catch (error) {
        console.warn("Supabase listLeads failed:", error);
        throw error;
      }
    },

    async createLead(input: CRMCreateLeadInput): Promise<CRMLeadMutationResult> {
      if (fallbackForOrganization(input.organizationId)) return local.createLead(input);
      const fieldErrors: Record<string, string> = {};
      if (!input.contactId.trim() || !isUuid(input.contactId)) fieldErrors.contactId = "Select an existing contact.";
      if (!input.interest?.trim()) fieldErrors.interest = "Interest is required.";
      if (Object.keys(fieldErrors).length) return { status: "validation-error", message: "Check the lead details and try again.", fieldErrors };

      const client = getClient();
      if (!client) return { status: "server-error", message: "Supabase is not configured." };
      const status = statusToDatabase.new;
      const { data, error } = await client.from("crm_leads").insert({
        organization_id: input.organizationId,
        contact_id: input.contactId,
        interest: input.interest.trim(),
        source: normalizeLeadSource(input.source),
        status: status.status,
        stage: status.stage,
        assigned_to_user_id: input.assignedUserId ?? null,
        estimated_budget: input.estimatedValue ?? null,
        lead_score: input.score ?? null,
        purchase_timeline: input.qualificationTimeline ?? null,
      }).select().single();
      if (error || !data) return { status: "server-error", message: error?.message ?? "The lead could not be created." };
      return { status: "success", lead: mapLead(data) };
    },

    async updateLead(leadId: string, input: CRMUpdateLeadInput): Promise<CRMLeadMutationResult> {
      if (fallbackForOrganization(input.organizationId) || !isUuid(leadId)) return local.updateLead(leadId, input);
      const client = getClient();
      if (!client) return { status: "server-error", message: "Supabase is not configured." };
      const payload: Record<string, unknown> = {};
      if (input.interest !== undefined) payload.interest = input.interest?.trim() || null;
      if (input.source !== undefined) payload.source = normalizeLeadSource(input.source);
      if (input.assignedUserId !== undefined) payload.assigned_to_user_id = input.assignedUserId;
      if (input.estimatedValue !== undefined) payload.estimated_budget = input.estimatedValue;
      if (input.qualificationNeed !== undefined) payload.qualification_need = input.qualificationNeed;
      if (input.qualificationTimeline !== undefined) payload.purchase_timeline = input.qualificationTimeline;
      if (input.status !== undefined) {
        if (!CRM_LEAD_STATUS_CODES.includes(input.status)) return { status: "validation-error", message: "The selected lead status is not available." };
        const next = statusToDatabase[input.status];
        payload.status = next.status;
        payload.stage = next.stage;
      }
      if (input.expectedUpdatedAt) {
        const { data: current, error } = await client.from("crm_leads").select("*").eq("id", leadId).eq("organization_id", input.organizationId).single();
        if (error || !current) return { status: "server-error", message: "The lead could not be found." };
        const currentLead = mapLead(current);
        if (currentLead.updatedAt !== input.expectedUpdatedAt) return { status: "conflict", message: "The lead changed before it could be updated.", lead: currentLead };
      }
      const { data, error } = await client.from("crm_leads").update(payload).eq("id", leadId).eq("organization_id", input.organizationId).select().single();
      if (error || !data) return { status: "server-error", message: error?.message ?? "The lead could not be updated." };
      return { status: "success", lead: mapLead(data) };
    },

    async archiveLead(leadId: string, organizationId: string, expectedUpdatedAt?: string): Promise<CRMLeadMutationResult> {
      if (fallbackForOrganization(organizationId) || !isUuid(leadId)) {
        return { status: "server-error", message: "Lead archiving is only available for Supabase leads." };
      }
      const client = getClient(); if (!client) return { status: "server-error", message: "Supabase is not configured." };
      const currentQuery = client.from("crm_leads").select("*").eq("id", leadId).eq("organization_id", organizationId).single();
      const { data: current, error: readError } = await currentQuery;
      if (readError || !current) return { status: "server-error", message: "The lead could not be found." };
      if (expectedUpdatedAt && current.updated_at !== expectedUpdatedAt) return { status: "conflict", message: "The lead changed before it could be archived.", lead: mapLead(current) };
      let query = client.from("crm_leads").update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", leadId).eq("organization_id", organizationId);
      if (expectedUpdatedAt) query = query.eq("updated_at", expectedUpdatedAt);
      const { data, error } = await query.select().single();
      if (error || !data) return { status: "server-error", message: error?.message ?? "The lead could not be archived." };
      return { status: "success", lead: mapLead(data) };
    },

    async bulkArchiveLeads(leadIds: string[], organizationId: string): Promise<{ successCount: number; failureCount: number }> {
      if (fallbackForOrganization(organizationId)) return { successCount: 0, failureCount: leadIds.length };
      const client = getClient(); if (!client) return { successCount: 0, failureCount: leadIds.length };
      const ids = leadIds.filter(isUuid);
      if (!ids.length) return { successCount: 0, failureCount: leadIds.length };
      const { data, error } = await client.from("crm_leads").update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).in("id", ids).eq("organization_id", organizationId).select("id");
      const successCount = error ? 0 : (data ?? []).length;
      return { successCount, failureCount: leadIds.length - successCount };
    },

    async listOpportunities(params: CRMOpportunityListParams) {
      if (fallbackForOrganization(params.organizationId)) return local.listOpportunities(params);
      const client = getClient(); if (!client) throw new Error("Supabase is not configured.");
      let query = client.from("crm_opportunities").select("*").eq("organization_id", params.organizationId).is("archived_at", null);
      if (params.stageCodes?.length) query = query.in("stage_key", params.stageCodes);
      if (params.ownerIds?.length) query = query.in("assigned_to_user_id", params.ownerIds);
      if (params.productKeys?.length) query = query.in("product_key", params.productKeys);
      const { data, error } = await query.order(params.sortBy === "name" ? "name" : "updated_at", { ascending: params.sortDirection === "asc" });
      if (error) throw error; return (data ?? []).map(mapOpportunity);
    },

    async bulkArchiveOpportunities(opportunityIds: string[], organizationId: string) {
      if (fallbackForOrganization(organizationId)) return local.bulkArchiveOpportunities?.(opportunityIds, organizationId) ?? { successCount: 0, failureCount: opportunityIds.length };
      const client = getClient(); if (!client) return { successCount: 0, failureCount: opportunityIds.length };
      const ids = opportunityIds.filter(isUuid);
      if (!ids.length) return { successCount: 0, failureCount: opportunityIds.length };
      const { data, error } = await client
        .from("crm_opportunities")
        .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .in("id", ids)
        .eq("organization_id", organizationId)
        .is("archived_at", null)
        .select("id");
      const successCount = error ? 0 : (data ?? []).length;
      return { successCount, failureCount: opportunityIds.length - successCount };
    },

    async createOpportunity(input: CRMCreateOpportunityInput): Promise<CRMOpportunityMutationResult> {
      if (fallbackForOrganization(input.organizationId)) return local.createOpportunity(input);
      const client = getClient(); if (!client) return { status: "server-error", message: "Supabase is not configured." };
      const conversionInput = input as CRMCreateOpportunityFromLeadInput;
      const initialStage = input.leadId ? "qualified" : "prospecting";
      const { data, error } = await client.from("crm_opportunities").insert({ organization_id: input.organizationId, contact_id: input.contactId, lead_id: input.leadId ?? null, catalog_item_id: input.catalogItemId ?? null, offer_id: input.offerId ?? null, variant_id: input.variantId ?? null, product_key: input.productKey ?? input.name.trim().toLowerCase().replace(/\s+/g, "-"), name: input.name.trim(), stage_key: initialStage, stage: initialStage, amount: input.amount ?? null, currency: input.currency ?? "EUR", expected_close_at: input.expectedCloseDate ?? null, assigned_to_user_id: input.ownerId ?? null, version: 1, origin: input.leadId ? "lead_conversion" : "manual", idempotency_key: conversionInput.idempotencyKey ?? null }).select().single();
      if (error || !data) return opportunityError(error); return { status: "success", opportunity: mapOpportunity(data) };
    },

    async updateOpportunity(opportunityId: string, input: CRMUpdateOpportunityInput): Promise<CRMOpportunityMutationResult> {
      if (fallbackForOrganization(input.organizationId)) return local.updateOpportunity(opportunityId, input);
      const client = getClient(); if (!client) return { status: "server-error", message: "Supabase is not configured." };
      const { data: current } = await client.from("crm_opportunities").select("*").eq("id", opportunityId).eq("organization_id", input.organizationId).single();
      if (!current) return { status: "server-error", message: "The opportunity could not be found." };
      if (current.updated_at !== input.expectedUpdatedAt) return { status: "conflict", message: "The opportunity changed before it could be updated.", opportunity: mapOpportunity(current) };
      const payload: Record<string, unknown> = { version: Number(current.version ?? 1) + 1, updated_at: new Date().toISOString() };
      if (input.amount !== undefined) payload.amount = input.amount; if (input.currency !== undefined) payload.currency = input.currency; if (input.expectedCloseDate !== undefined) payload.expected_close_at = input.expectedCloseDate; if (input.ownerId !== undefined) payload.assigned_to_user_id = input.ownerId;
      const { data, error } = await client.from("crm_opportunities").update(payload).eq("id", opportunityId).eq("organization_id", input.organizationId).eq("updated_at", input.expectedUpdatedAt).select().single();
      if (error || !data) return opportunityError(error); return { status: "success", opportunity: mapOpportunity(data) };
    },

    async moveOpportunityStage(opportunityId: string, input: CRMMoveOpportunityStageInput): Promise<CRMOpportunityMutationResult> {
      if (fallbackForOrganization(input.organizationId)) return local.moveOpportunityStage(opportunityId, input);
      if (!CRM_PIPELINE_STAGE_CODES.includes(input.stageCode)) return { status: "validation-error", message: "Invalid opportunity stage.", fieldErrors: { stageCode: "Invalid stage" } };
      const client = getClient(); if (!client) return { status: "server-error", message: "Supabase is not configured." };
      const { data: current } = await client.from("crm_opportunities").select("*").eq("id", opportunityId).eq("organization_id", input.organizationId).single();
      if (!current) return { status: "server-error", message: "The opportunity could not be found." };
      if (current.updated_at !== input.expectedUpdatedAt) return { status: "conflict", message: "The opportunity changed before it could be moved.", opportunity: mapOpportunity(current) };
      const { data, error } = await client.from("crm_opportunities").update({ stage_key: input.stageCode, stage: input.stageCode, version: Number(current.version ?? 1) + 1, updated_at: new Date().toISOString() }).eq("id", opportunityId).eq("organization_id", input.organizationId).eq("updated_at", input.expectedUpdatedAt).select().single();
      if (error || !data) return opportunityError(error); await client.from("crm_opportunity_stage_history").insert({ organization_id: input.organizationId, opportunity_id: opportunityId, from_stage_key: current.stage_key, to_stage_key: input.stageCode, origin: "board", opportunity_version: data.version }); return { status: "success", opportunity: mapOpportunity(data) };
    },

    async reopenOpportunity(opportunityId: string, input: CRMReopenOpportunityInput): Promise<CRMOpportunityMutationResult> {
      const reason = input.reason.trim();
      if (!reason) return { status: "validation-error", message: "A reason is required to reopen a terminal opportunity.", fieldErrors: { reason: "Reason is required." } };
      if (fallbackForOrganization(input.organizationId)) return local.reopenOpportunity(opportunityId, input);
      const client = getClient(); if (!client) return { status: "server-error", message: "Supabase is not configured." };
      const { data: current, error: readError } = await client.from("crm_opportunities").select("*").eq("id", opportunityId).eq("organization_id", input.organizationId).single();
      if (readError || !current) return opportunityError(readError);
      if (current.updated_at !== input.expectedUpdatedAt) return { status: "conflict", message: "The opportunity changed before it could be reopened.", opportunity: mapOpportunity(current) };
      if (current.stage_key !== "won" && current.stage_key !== "lost") return { status: "validation-error", message: "Only won or lost opportunities can be reopened.", fieldErrors: { stageCode: "The opportunity is not terminal." } };
      const nextStage = input.stageCode ?? "prospecting";
      const { data, error } = await client.from("crm_opportunities").update({ stage_key: nextStage, stage: nextStage, loss_reason: null, version: Number(current.version ?? 1) + 1, updated_at: new Date().toISOString() }).eq("id", opportunityId).eq("organization_id", input.organizationId).eq("updated_at", input.expectedUpdatedAt).select().single();
      if (error || !data) return opportunityError(error);
      const { error: historyError } = await client.from("crm_opportunity_stage_history").insert({ organization_id: input.organizationId, opportunity_id: opportunityId, from_stage_key: current.stage_key, to_stage_key: nextStage, origin: "reopen", reason, opportunity_version: data.version });
      if (historyError) return opportunityError(historyError);
      return { status: "success", opportunity: mapOpportunity(data) };
    },

    async createOpportunityFromLead(leadId: string, input: CRMCreateOpportunityFromLeadInput): Promise<CRMOpportunityMutationResult> {
      if (fallbackForOrganization(input.organizationId)) return local.createOpportunityFromLead(leadId, input);
      const client = getClient(); if (!client) return { status: "server-error", message: "Supabase is not configured." };
      const { data: lead, error } = await client.from("crm_leads").select("*").eq("id", leadId).eq("organization_id", input.organizationId).single();
      if (error || !lead) return opportunityError(error);
      const productKey = (input.productKey ?? input.name ?? lead.interest ?? "opportunity").trim().toLowerCase().replace(/\s+/g, "-");
      const idempotencyKey = input.idempotencyKey?.trim() || null;
      const { data: existing, error: existingError } = await client.from("crm_opportunities").select("*").eq("organization_id", input.organizationId).eq("lead_id", leadId).eq("origin", "lead_conversion").eq("product_key", productKey).maybeSingle();
      if (existingError) return opportunityError(existingError);
      if (existing) return { status: "success", opportunity: mapOpportunity(existing) };
      if (idempotencyKey) {
        const { data: keyMatch, error: keyError } = await client.from("crm_opportunities").select("*").eq("organization_id", input.organizationId).eq("origin", "lead_conversion").eq("idempotency_key", idempotencyKey).maybeSingle();
        if (keyError) return opportunityError(keyError);
        if (keyMatch) return { status: "conflict", message: "The idempotency key was already used for a different lead conversion.", opportunity: mapOpportunity(keyMatch) };
      }
      const result = await this.createOpportunity({ ...input, productKey, contactId: lead.contact_id, leadId, name: input.name ?? lead.interest ?? "Opportunity", lines: [] });
      if (result.status !== "success") return result;
      const { error: leadError } = await client.from("crm_leads").update({ status: "convertido", stage: "won", updated_at: new Date().toISOString() }).eq("id", leadId).eq("organization_id", input.organizationId);
      if (leadError) return opportunityError(leadError);
      return result;
    },

    async listOpportunityStageHistory(opportunityId: string) {
      const organizationId = activeOrganizationId() ?? LOCAL_ORGANIZATION_ID;
      if (fallbackForOrganization(organizationId)) return local.listOpportunityStageHistory(opportunityId);
      const client = getClient(); if (!client) throw new Error("Supabase is not configured.");
      const { data, error } = await client.from("crm_opportunity_stage_history").select("*").eq("organization_id", organizationId).eq("opportunity_id", opportunityId).order("created_at", { ascending: false });
      if (error) throw error; return (data ?? []).map((row: any): CRMOpportunityStageHistory => ({ id: row.id, opportunityId: row.opportunity_id, fromStageCode: row.from_stage_key, toStageCode: row.to_stage_key, reason: row.reason ?? null, occurredAt: row.created_at, createdAt: row.created_at, updatedAt: row.created_at }));
    },
  };
}

export const supabaseCrmAdapter = createSupabaseCrmAdapter();