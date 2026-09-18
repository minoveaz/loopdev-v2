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
  expectedCloseAt: string | null;
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

  async listOpportunities(contactId: string): Promise<CRMOpportunity[]> {
    const storage = getStorage();
    if (!storage) return [];
    try {
      const raw = storage.getItem(LOCAL_OPPORTUNITIES_KEY);
      const items: CRMOpportunity[] = raw ? JSON.parse(raw) : [];
      return items.filter((o) => o.contactId === contactId);
    } catch {
      return [];
    }
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
