import { mobileSupabaseClient } from "./supabase";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value: string | null | undefined): value is string => typeof value === "string" && UUID_PATTERN.test(value);
const assertSupabase = (error: any, operation: string) => { if (error) throw new Error(`CRM ${operation} failed: ${error.message}`); };
const mapSupabaseOpportunity = (row: any): CRMOpportunity => ({
  id: row.id, organizationId: row.organization_id, contactId: row.contact_id, leadId: row.lead_id ?? null,
  catalogItemId: row.catalog_item_id ?? null, productKey: row.product_key ?? null, name: row.name,
  amount: row.amount ?? null, currency: row.currency ?? "EUR", stageKey: row.stage_key ?? row.stage,
  origin: row.origin === "conversion" ? "lead_conversion" : "manual", ownerName: row.owner_name ?? "", ownerId: row.assigned_to_user_id ?? "",
  probability: row.probability == null ? undefined : Number(row.probability) / 100, expectedCloseAt: row.expected_close_at ?? null,
  lossReason: row.loss_reason ?? null, createdAt: row.created_at, updatedAt: row.updated_at,
});

export interface CRMLead {
  id: string;
  organizationId: string;
  contactId: string;
  interest: string;
  source: string;
  score: number | null;
  status: "new" | "contacted" | "qualified" | "unqualified" | "converted" | "stalled" | "inactive";
  ownerName: string;
  assignedUserId: string;
  estimatedValue?: number | null;
  estimatedCurrency?: string | null;
  qualificationNeed?: string | null;
  qualificationTimeline?: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string | null;
  nextActivityAt: string | null;
}

export interface CRMOpportunity {
  id: string;
  organizationId: string;
  contactId: string;
  leadId: string | null;
  catalogItemId: string | null;
  productKey: string | null;
  name: string;
  amount: number | null;
  currency: string;
  stageKey: "prospecting" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  origin: "manual" | "lead_conversion";
  ownerName: string;
  ownerId: string;
  probability?: number;
  expectedCloseAt: string | null;
  lossReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CRMActivity {
  id: string;
  sourceType: "communication" | "task" | "opportunity" | "note" | "document";
  sourceId: string;
  type: string;
  summary: string;
  occurredAt: string;
  status?: string | null;
}

export interface CRMCustomerProduct {
  id: string;
  organizationId: string;
  contactId: string;
  catalogItemId: string;
  offerId: string | null;
  variantId: string | null;
  quantity: number;
  unitAmount: number | null;
  totalAmount: number | null;
  currency: string;
  sourceOpportunityId: string | null;
  sourceLeadId: string | null;
  status: "interested" | "active" | "churned";
  createdAt: string;
  updatedAt: string;
}

const LOCAL_PRODUCTS_KEY = "loopdev_mobile_customer_products";
const LOCAL_LEADS_KEY = "loopdev_mobile_leads";
const LOCAL_OPPORTUNITIES_KEY = "loopdev_mobile_opportunities";

function getStorage() {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return null;
}

const initialSeedOpportunities: CRMOpportunity[] = [
  {
    id: "crm_opp_1",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    name: "Enterprise Workspace Expansion",
    contactId: "crm_cust_1",
    leadId: "crm_lead_1",
    catalogItemId: "catalog_item_enterprise_plan",
    productKey: "enterprise-plan",
    amount: 48000,
    currency: "USD",
    stageKey: "proposal",
    probability: 0.65,
    origin: "manual",
    ownerName: "Maya Chen",
    ownerId: "owner-maya",
    expectedCloseAt: new Date(Date.now() + 28 * 86400000).toISOString(),
    lossReason: null,
    createdAt: new Date(Date.now() - 24 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "crm_opp_2",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    name: "Annual Plan Logistics Renewal",
    contactId: "crm_cust_2",
    leadId: null,
    catalogItemId: null,
    productKey: null,
    amount: 28000,
    currency: "USD",
    stageKey: "qualified",
    probability: 0.4,
    origin: "manual",
    ownerName: "Jon Bell",
    ownerId: "owner-jon",
    expectedCloseAt: new Date(Date.now() + 45 * 86400000).toISOString(),
    lossReason: null,
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "crm_opp_3",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    name: "AI Vision & Legal OCR Package",
    contactId: "crm_cust_3",
    leadId: "crm_lead_3",
    catalogItemId: null,
    productKey: null,
    amount: 62000,
    currency: "USD",
    stageKey: "prospecting",
    probability: 0.15,
    origin: "manual",
    ownerName: "Maya Chen",
    ownerId: "owner-maya",
    expectedCloseAt: new Date(Date.now() + 60 * 86400000).toISOString(),
    lossReason: null,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: "crm_opp_4",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    name: "Regional Omnichannel Communications",
    contactId: "crm_cust_4",
    leadId: null,
    catalogItemId: null,
    productKey: null,
    amount: 27500,
    currency: "USD",
    stageKey: "negotiation",
    probability: 0.8,
    origin: "manual",
    ownerName: "Lee Okafor",
    ownerId: "owner-lee",
    expectedCloseAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    lossReason: null,
    createdAt: new Date(Date.now() - 32 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "crm_opp_5",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    name: "Cloud Financial Analytics Integration",
    contactId: "crm_cust_5",
    leadId: "crm_lead_5",
    catalogItemId: null,
    productKey: null,
    amount: 80000,
    currency: "USD",
    stageKey: "won",
    probability: 1.0,
    origin: "lead_conversion",
    ownerName: "Maya Chen",
    ownerId: "owner-maya",
    expectedCloseAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    lossReason: null,
    createdAt: new Date(Date.now() - 55 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "crm_opp_6",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    name: "Legacy Ingestion Pipeline",
    contactId: "crm_cust_1",
    leadId: null,
    catalogItemId: null,
    productKey: null,
    amount: 15000,
    currency: "USD",
    stageKey: "lost",
    probability: 0.0,
    origin: "manual",
    ownerName: "Lee Okafor",
    ownerId: "owner-lee",
    expectedCloseAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    lossReason: "Project budget postponed to next fiscal year",
    createdAt: new Date(Date.now() - 70 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

function loadStoredOpportunities(): CRMOpportunity[] {
  const storage = getStorage();
  if (!storage) return initialSeedOpportunities;
  try {
    const raw = storage.getItem(LOCAL_OPPORTUNITIES_KEY);
    if (!raw) {
      storage.setItem(LOCAL_OPPORTUNITIES_KEY, JSON.stringify(initialSeedOpportunities));
      return initialSeedOpportunities;
    }
    const parsed = JSON.parse(raw);
    return parsed.length > 0 ? parsed : initialSeedOpportunities;
  } catch {
    return initialSeedOpportunities;
  }
}

function saveStoredOpportunities(opps: CRMOpportunity[]) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(LOCAL_OPPORTUNITIES_KEY, JSON.stringify(opps));
  } catch {
    // noop
  }
}

const initialSeedLeads: CRMLead[] = [
  {
    id: "crm_lead_1",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    contactId: "crm_cust_1",
    interest: "Enterprise Workspace Migration & API Integration",
    source: "Website",
    score: 88,
    status: "new",
    ownerName: "Maya Chen",
    assignedUserId: "owner-maya",
    estimatedValue: 45000,
    estimatedCurrency: "USD",
    qualificationNeed: "Upgrade core legacy document pipeline to real-time sync",
    qualificationTimeline: "1 month",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    lastActivityAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    nextActivityAt: new Date(Date.now() + 1 * 86400000).toISOString(),
  },
  {
    id: "crm_lead_2",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    contactId: "crm_cust_2",
    interest: "Multi-branch Inventory & Logistics Operations",
    source: "Referral",
    score: 72,
    status: "contacted",
    ownerName: "Jon Bell",
    assignedUserId: "owner-jon",
    estimatedValue: 28000,
    estimatedCurrency: "USD",
    qualificationNeed: "Automate regional distribution centers",
    qualificationTimeline: "2–3 months",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    lastActivityAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    nextActivityAt: new Date(Date.now() + 2 * 86400000).toISOString(),
  },
  {
    id: "crm_lead_3",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    contactId: "crm_cust_3",
    interest: "AI Document Intelligence & OCR Extraction",
    source: "Partner",
    score: 94,
    status: "qualified",
    ownerName: "Maya Chen",
    assignedUserId: "owner-maya",
    estimatedValue: 62000,
    estimatedCurrency: "USD",
    qualificationNeed: "Automated legal contract ingestion & classification",
    qualificationTimeline: "Immediate",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    lastActivityAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    nextActivityAt: new Date(Date.now() + 3 * 86400000).toISOString(),
  },
  {
    id: "crm_lead_4",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    contactId: "crm_cust_4",
    interest: "CRM Communications Hub & Omni-channel messaging",
    source: "Social",
    score: 45,
    status: "stalled",
    ownerName: "Lee Okafor",
    assignedUserId: "owner-lee",
    estimatedValue: 15000,
    estimatedCurrency: "USD",
    qualificationNeed: "Unified customer inbox across WhatsApp and Email",
    qualificationTimeline: "6 months",
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    lastActivityAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    nextActivityAt: null,
  },
  {
    id: "crm_lead_5",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    contactId: "crm_cust_5",
    interest: "Cloud Financial Analytics & Real-time Reporting",
    source: "Event",
    score: 91,
    status: "converted",
    ownerName: "Maya Chen",
    assignedUserId: "owner-maya",
    estimatedValue: 80000,
    estimatedCurrency: "USD",
    qualificationNeed: "Consolidate 4 international subsidiaries into LoopDev",
    qualificationTimeline: "Closed",
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    lastActivityAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    nextActivityAt: null,
  },
];

function loadStoredLeads(): CRMLead[] {
  const storage = getStorage();
  if (!storage) return initialSeedLeads;
  try {
    const raw = storage.getItem(LOCAL_LEADS_KEY);
    if (!raw) {
      storage.setItem(LOCAL_LEADS_KEY, JSON.stringify(initialSeedLeads));
      return initialSeedLeads;
    }
    return JSON.parse(raw);
  } catch {
    return initialSeedLeads;
  }
}

function saveStoredLeads(leads: CRMLead[]) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(LOCAL_LEADS_KEY, JSON.stringify(leads));
  } catch {
    // noop
  }
}

export const mobileCrmAdapter = {
  async listAllLeads(): Promise<CRMLead[]> {
    return loadStoredLeads();
  },

  async getLead(id: string): Promise<CRMLead | null> {
    const leads = loadStoredLeads();
    return leads.find((l) => l.id === id) || null;
  },

  async listLeads(contactId: string): Promise<CRMLead[]> {
    const leads = loadStoredLeads();
    return leads.filter((l) => l.contactId === contactId);
  },

  async createLead(input: Omit<CRMLead, "id" | "createdAt" | "updatedAt">): Promise<CRMLead> {
    const now = new Date().toISOString();
    const lead: CRMLead = {
      id: `crm_lead_${Date.now()}`,
      ...input,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    };
    const leads = loadStoredLeads();
    leads.unshift(lead);
    saveStoredLeads(leads);
    return lead;
  },

  async updateLead(id: string, input: Partial<CRMLead>): Promise<CRMLead> {
    const leads = loadStoredLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new Error(`Lead ${id} not found`);
    }
    const updated: CRMLead = {
      ...leads[index],
      ...input,
      updatedAt: new Date().toISOString(),
      lastActivityAt: input.status ? new Date().toISOString() : leads[index].lastActivityAt,
    };
    leads[index] = updated;
    saveStoredLeads(leads);
    return updated;
  },

  async convertLeadToOpportunity(
    leadId: string,
    opportunityData: {
      name: string;
      amount?: number | null;
      currency?: string;
      stageKey?: CRMOpportunity["stageKey"];
      expectedCloseAt?: string | null;
    }
  ): Promise<{ lead: CRMLead; opportunity: CRMOpportunity }> {
    const leads = loadStoredLeads();
    const leadIndex = leads.findIndex((l) => l.id === leadId);
    if (leadIndex === -1) {
      throw new Error(`Lead ${leadId} not found`);
    }
    const targetLead = leads[leadIndex];
    const now = new Date().toISOString();

    // 1. Mark lead as converted
    const updatedLead: CRMLead = {
      ...targetLead,
      status: "converted",
      updatedAt: now,
      lastActivityAt: now,
    };
    leads[leadIndex] = updatedLead;
    saveStoredLeads(leads);

    // 2. Create opportunity
    const storage = getStorage();
    const opportunity: CRMOpportunity = {
      id: `opp_${Date.now()}`,
      organizationId: targetLead.organizationId,
      contactId: targetLead.contactId,
      leadId: targetLead.id,
      catalogItemId: null,
      productKey: null,
      name: opportunityData.name || `Opportunity · ${targetLead.interest}`,
      amount: opportunityData.amount ?? targetLead.estimatedValue ?? 25000,
      currency: opportunityData.currency ?? targetLead.estimatedCurrency ?? "USD",
      stageKey: opportunityData.stageKey ?? "qualified",
      origin: "lead_conversion",
      ownerName: targetLead.ownerName,
      ownerId: targetLead.assignedUserId,
      expectedCloseAt: opportunityData.expectedCloseAt ?? new Date(Date.now() + 30 * 86400000).toISOString(),
      createdAt: now,
      updatedAt: now,
    };

    if (storage) {
      try {
        const raw = storage.getItem(LOCAL_OPPORTUNITIES_KEY);
        const opps: CRMOpportunity[] = raw ? JSON.parse(raw) : [];
        opps.unshift(opportunity);
        storage.setItem(LOCAL_OPPORTUNITIES_KEY, JSON.stringify(opps));
      } catch {
        // noop
      }
    }

    return { lead: updatedLead, opportunity };
  },

  async listAllOpportunities(): Promise<CRMOpportunity[]> {
    const organizationId = loadStoredOpportunities()[0]?.organizationId;
    if (isUuid(organizationId)) {
      const { data, error } = await mobileSupabaseClient.from("crm_opportunities").select("*").eq("organization_id", organizationId).order("updated_at", { ascending: false });
      assertSupabase(error, "list opportunities"); return (data ?? []).map(mapSupabaseOpportunity);
    }
    return loadStoredOpportunities();
  },

  async getOpportunity(id: string): Promise<CRMOpportunity | null> {
    const opps = loadStoredOpportunities();
    return opps.find((o) => o.id === id) || null;
  },

  async listOpportunities(contactId: string): Promise<CRMOpportunity[]> {
    if (isUuid(contactId)) {
      const { data, error } = await mobileSupabaseClient.from("crm_opportunities").select("*").eq("contact_id", contactId).order("updated_at", { ascending: false });
      assertSupabase(error, "list opportunities"); return (data ?? []).map(mapSupabaseOpportunity);
    }
    const opps = loadStoredOpportunities();
    return opps.filter((o) => o.contactId === contactId);
  },

  async createOpportunity(input: Omit<CRMOpportunity, "id" | "createdAt" | "updatedAt">): Promise<CRMOpportunity> {
    if (isUuid(input.organizationId) && isUuid(input.contactId) && (!input.leadId || isUuid(input.leadId))) {
      const { data, error } = await mobileSupabaseClient.from("crm_opportunities").insert({ organization_id: input.organizationId, contact_id: input.contactId, lead_id: input.leadId ?? null, product_key: input.productKey, name: input.name, stage_key: input.stageKey, stage: input.stageKey, amount: input.amount, currency: input.currency, expected_close_at: input.expectedCloseAt, assigned_to_user_id: isUuid(input.ownerId) ? input.ownerId : null, version: 1 }).select().single();
      assertSupabase(error, "create opportunity"); if (!data) throw new Error("CRM create opportunity returned no data"); return mapSupabaseOpportunity(data);
    }
    const now = new Date().toISOString();
    const opportunity: CRMOpportunity = {
      id: `crm_opp_${Date.now()}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    const opps = loadStoredOpportunities();
    opps.unshift(opportunity);
    saveStoredOpportunities(opps);
    return opportunity;
  },

  async moveOpportunityStage(id: string, stageKey: CRMOpportunity["stageKey"], lossReason?: string): Promise<CRMOpportunity> {
    if (isUuid(id)) {
      const { data: current, error: readError } = await mobileSupabaseClient.from("crm_opportunities").select("*").eq("id", id).single();
      assertSupabase(readError, "read opportunity"); if (!current) throw new Error(`Opportunity ${id} not found`);
      const { data, error } = await mobileSupabaseClient.from("crm_opportunities").update({ stage_key: stageKey, stage: stageKey, loss_reason: lossReason ?? null, version: Number(current.version ?? 1) + 1, updated_at: new Date().toISOString() }).eq("id", id).eq("updated_at", current.updated_at).select().single();
      assertSupabase(error, "move opportunity"); if (!data) throw new Error("CRM move opportunity returned no data");
      const { error: historyError } = await mobileSupabaseClient.from("crm_opportunity_stage_history").insert({ organization_id: current.organization_id, opportunity_id: id, from_stage_key: current.stage_key, to_stage_key: stageKey, origin: "board", reason: lossReason ?? null, opportunity_version: data.version });
      assertSupabase(historyError, "record opportunity stage history"); return mapSupabaseOpportunity(data);
    }
    const opps = loadStoredOpportunities();
    const index = opps.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error(`Opportunity ${id} not found`);
    }
    const current = opps[index];
    const isTerminal = current.stageKey === "won" || current.stageKey === "lost";
    if (isTerminal && stageKey !== current.stageKey) {
      throw new Error(`Terminal opportunity in stage "${current.stageKey}" cannot be moved directly. Use reopenOpportunity instead.`);
    }

    const updated: CRMOpportunity = {
      ...current,
      stageKey,
      lossReason: stageKey === "lost" ? lossReason || current.lossReason : null,
      probability: stageKey === "won" ? 1.0 : stageKey === "lost" ? 0.0 : stageKey === "negotiation" ? 0.8 : stageKey === "proposal" ? 0.65 : stageKey === "qualified" ? 0.4 : 0.15,
      updatedAt: new Date().toISOString(),
    };
    opps[index] = updated;
    saveStoredOpportunities(opps);
    return updated;
  },

  async reopenOpportunity(id: string, reason: string, expectedUpdatedAt?: string): Promise<CRMOpportunity> {
    if (!reason || !reason.trim()) {
      throw new Error("A non-empty reason is required to reopen a closed opportunity.");
    }
    if (isUuid(id)) {
      const { data: current, error: readError } = await mobileSupabaseClient.from("crm_opportunities").select("*").eq("id", id).single();
      assertSupabase(readError, "read opportunity"); if (!current) throw new Error(`Opportunity ${id} not found`);
      if (current.stage_key !== "won" && current.stage_key !== "lost") throw new Error("Only won or lost opportunities can be reopened.");
      const expected = expectedUpdatedAt ?? current.updated_at;
      if (current.updated_at !== expected) throw new Error("The opportunity changed before it could be reopened.");
      const targetStage = current.stage_key === "won" ? "proposal" : "prospecting";
      const { data, error } = await mobileSupabaseClient.from("crm_opportunities").update({ stage_key: targetStage, stage: targetStage, loss_reason: null, version: Number(current.version ?? 1) + 1, updated_at: new Date().toISOString() }).eq("id", id).eq("organization_id", current.organization_id).eq("updated_at", expected).select().single();
      assertSupabase(error, "reopen opportunity"); if (!data) throw new Error("CRM reopen opportunity returned no data");
      const { error: historyError } = await mobileSupabaseClient.from("crm_opportunity_stage_history").insert({ organization_id: current.organization_id, opportunity_id: id, from_stage_key: current.stage_key, to_stage_key: targetStage, origin: "reopen", reason: reason.trim(), opportunity_version: data.version });
      assertSupabase(historyError, "record opportunity stage history"); return mapSupabaseOpportunity(data);
    }
    const opps = loadStoredOpportunities();
    const index = opps.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error(`Opportunity ${id} not found`);
    }
    const current = opps[index];
    const targetStage: CRMOpportunity["stageKey"] = current.stageKey === "won" ? "proposal" : "prospecting";

    const updated: CRMOpportunity = {
      ...current,
      stageKey: targetStage,
      probability: targetStage === "proposal" ? 0.65 : 0.15,
      lossReason: null,
      updatedAt: new Date().toISOString(),
    };
    opps[index] = updated;
    saveStoredOpportunities(opps);
    return updated;
  },

  async updateOpportunity(id: string, input: Partial<CRMOpportunity>): Promise<CRMOpportunity> {
    if (isUuid(id) && isUuid(input.organizationId)) {
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.name !== undefined) payload.name = input.name; if (input.amount !== undefined) payload.amount = input.amount; if (input.currency !== undefined) payload.currency = input.currency; if (input.expectedCloseAt !== undefined) payload.expected_close_at = input.expectedCloseAt; if (input.ownerId !== undefined) payload.assigned_to_user_id = isUuid(input.ownerId) ? input.ownerId : null;
      const { data, error } = await mobileSupabaseClient.from("crm_opportunities").update(payload).eq("id", id).eq("organization_id", input.organizationId).select().single();
      assertSupabase(error, "update opportunity"); if (!data) throw new Error("CRM update opportunity returned no data"); return mapSupabaseOpportunity(data);
    }
    const opps = loadStoredOpportunities();
    const index = opps.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error(`Opportunity ${id} not found`);
    }
    const updated: CRMOpportunity = {
      ...opps[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    opps[index] = updated;
    saveStoredOpportunities(opps);
    return updated;
  },

  async listCustomerProducts(contactId: string): Promise<CRMCustomerProduct[]> {
    const storage = getStorage();
    if (!storage) return [];
    try {
      const raw = storage.getItem(LOCAL_PRODUCTS_KEY);
      const items: CRMCustomerProduct[] = raw ? JSON.parse(raw) : [];
      return items.filter((p) => p.contactId === contactId);
    } catch {
      return [];
    }
  },

  async createCustomerProduct(input: Omit<CRMCustomerProduct, "id" | "createdAt" | "updatedAt">): Promise<CRMCustomerProduct> {
    const storage = getStorage();
    const now = new Date().toISOString();
    const record: CRMCustomerProduct = {
      id: `cp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    if (storage) {
      try {
        const raw = storage.getItem(LOCAL_PRODUCTS_KEY);
        const list: CRMCustomerProduct[] = raw ? JSON.parse(raw) : [];
        list.unshift(record);
        storage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(list));
      } catch {
        // noop
      }
    }
    return record;
  },
};
