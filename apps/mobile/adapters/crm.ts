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

export const mobileCrmAdapter = {
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

  async listLeads(contactId: string): Promise<CRMLead[]> {
    const storage = getStorage();
    if (!storage) return [];
    try {
      const raw = storage.getItem(LOCAL_LEADS_KEY);
      const items: CRMLead[] = raw ? JSON.parse(raw) : [];
      return items.filter((l) => l.contactId === contactId);
    } catch {
      return [];
    }
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
};
