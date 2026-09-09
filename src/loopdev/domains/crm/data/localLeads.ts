import { createLocalStore } from "@/lib/localStore";
import { crmCustomersStore } from "./localCustomers";
import type { CRMLeadStatusCode } from "../adapter/types";

export interface LocalLead {
  id: string;
  organizationId: string;
  contactId: string;
  status: CRMLeadStatusCode;
  interest: string | null;
  source: string | null;
  assignedUserId: string | null;
  ownerName: string | null;
  score: number | null;
  lastActivityAt: string | null;
  nextActivityAt: string | null;
  duplicateReviewId: string | null;
  createdAt: string;
  updatedAt: string;
}

const organizationId = "local-development-organization";
const owners = [
  { id: "owner-maya", name: "Maya Chen" },
  { id: "owner-jon", name: "Jon Bell" },
  { id: "owner-lee", name: "Lee Okafor" },
];
const sources = ["Website", "Referral", "Partner", "Social", "Event"];
const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
const fromNow = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

const seed: LocalLead[] = crmCustomersStore.list().map((contact, index) => ({
  id: `local-lead-${contact.id}`,
  organizationId,
  contactId: contact.id,
  status: contact.tier === "lead"
    ? "qualified"
    : (["new", "contacted", "stalled", "inactive", "contacted"][index % 5] as CRMLeadStatusCode),
  interest: contact.tier === "lead" ? "Enterprise expansion" : "General interest",
  source: sources[index % sources.length],
  assignedUserId: owners[index % owners.length].id,
  ownerName: owners[index % owners.length].name,
  score: 42 + ((index * 11) % 57),
  lastActivityAt: index % 5 === 0 ? null : ago(index % 9),
  nextActivityAt: index % 4 === 0 ? null : fromNow((index % 6) + 1),
  duplicateReviewId: index === 7 ? "duplicate-review-7" : null,
  createdAt: contact.createdAt,
  updatedAt: contact.updatedAt,
}));

export const localCrmLeadsStore = createLocalStore<LocalLead>({
  key: "loopdev:crm:leads",
  seed,
  idPrefix: "local-lead",
});
