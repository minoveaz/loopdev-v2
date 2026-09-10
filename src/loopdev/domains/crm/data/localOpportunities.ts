import { createLocalStore } from "@/lib/localStore";
import type { CRMPipelineStageCode } from "../adapter/types";

export interface LocalOpportunity {
  id: string;
  organizationId: string;
  name: string;
  contactId: string;
  leadId: string | null;
  productKey: string | null;
  origin: "manual" | "lead_conversion";
  idempotencyKey?: string | null;
  ownerId: string | null;
  ownerName: string | null;
  stageCode: CRMPipelineStageCode;
  amount: number | null;
  currency: string | null;
  probability: number | null;
  expectedCloseDate: string | null;
  lossReason: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

const organizationId = "local-development-organization";
const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
const fromNow = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const seed: LocalOpportunity[] = [
  {
    id: "crm_opp_1",
    organizationId,
    name: "Enterprise expansion",
    contactId: "crm_cust_1",
    leadId: null,
    productKey: null,
    origin: "manual",
    ownerId: "owner-maya",
    ownerName: "Maya Chen",
    stageCode: "proposal",
    amount: 48000,
    currency: "EUR",
    probability: 0.65,
    expectedCloseDate: fromNow(28),
    lossReason: null,
    createdAt: ago(24),
    updatedAt: ago(1),
    archivedAt: null,
  },
  {
    id: "crm_opp_2",
    organizationId,
    name: "Annual plan renewal",
    contactId: "crm_cust_2",
    leadId: null,
    productKey: null,
    origin: "manual",
    ownerId: "owner-jon",
    ownerName: "Jon Bell",
    stageCode: "qualified",
    amount: 14500,
    currency: "EUR",
    probability: 0.4,
    expectedCloseDate: fromNow(45),
    lossReason: null,
    createdAt: ago(18),
    updatedAt: ago(3),
    archivedAt: null,
  },
  {
    id: "crm_opp_3",
    organizationId,
    name: "Security review package",
    contactId: "crm_cust_3",
    leadId: null,
    productKey: null,
    origin: "manual",
    ownerId: "owner-maya",
    ownerName: "Maya Chen",
    stageCode: "prospecting",
    amount: 8200,
    currency: "USD",
    probability: 0.15,
    expectedCloseDate: fromNow(60),
    lossReason: null,
    createdAt: ago(10),
    updatedAt: ago(6),
    archivedAt: null,
  },
  {
    id: "crm_opp_4",
    organizationId,
    name: "Regional rollout",
    contactId: "crm_cust_4",
    leadId: null,
    productKey: null,
    origin: "manual",
    ownerId: "owner-lee",
    ownerName: "Lee Okafor",
    stageCode: "negotiation",
    amount: 27500,
    currency: "USD",
    probability: 0.8,
    expectedCloseDate: fromNow(14),
    lossReason: null,
    createdAt: ago(32),
    updatedAt: ago(2),
    archivedAt: null,
  },
  {
    id: "crm_opp_5",
    organizationId,
    name: "Partner enablement",
    contactId: "crm_cust_5",
    leadId: null,
    productKey: null,
    origin: "manual",
    ownerId: "owner-jon",
    ownerName: "Jon Bell",
    stageCode: "won",
    amount: 9600,
    currency: "EUR",
    probability: 1,
    expectedCloseDate: fromNow(-5),
    lossReason: null,
    createdAt: ago(55),
    updatedAt: ago(5),
    archivedAt: null,
  },
  {
    id: "crm_opp_6",
    organizationId,
    name: "Legacy migration",
    contactId: "crm_cust_6",
    leadId: null,
    productKey: null,
    origin: "manual",
    ownerId: "owner-lee",
    ownerName: "Lee Okafor",
    stageCode: "lost",
    amount: 11200,
    currency: "EUR",
    probability: 0,
    expectedCloseDate: fromNow(-12),
    lossReason: "Migration deferred",
    createdAt: ago(70),
    updatedAt: ago(12),
    archivedAt: null,
  },
];

export const localCrmOpportunitiesStore = createLocalStore<LocalOpportunity>({
  key: "loopdev:crm:opportunities",
  seed,
  idPrefix: "crm_opp",
});
