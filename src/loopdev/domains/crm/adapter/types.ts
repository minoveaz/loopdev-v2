export type Customer360Section = "profile" | "leads" | "opportunities" | "tasks" | "notes" | "timeline";
export type Customer360SectionState = "fresh" | "stale" | "loading" | "error" | "forbidden";

export interface CRMContact {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string | null;
  secondLastName: string | null;
  preferredName: string | null;
  email: string | null;
  secondaryEmail: string | null;
  phone: string | null;
  secondaryPhone: string | null;
  preferredChannel: "whatsapp" | "phone" | "email" | null;
  preferredLanguage: string | null;
  documentType: string | null;
  documentNumber: string | null;
  birthDate: string | null;
  gender: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateProvince: string | null;
  postalCode: string | null;
  country: string | null;
  companyName: string | null;
  jobTitle: string | null;
  department: string | null;
  attributes: Record<string, unknown>;
  identityStatus: "verified" | "pending_identity_review";
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface CRMContactListParams {
  organizationId: string;
  query?: string;
  cursor?: string | null;
  limit: number;
  identityStatus?: CRMContact["identityStatus"][];
  preferredChannel?: NonNullable<CRMContact["preferredChannel"]>[];
  sortBy?: "name" | "company" | "channel" | "identity" | "location" | "updated";
  sortDirection?: "asc" | "desc";
}

export interface CRMContactPage {
  items: CRMContact[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CRMCreateContactInput {
  organizationId: string;
  firstName: string;
  lastName?: string | null;
  secondLastName?: string | null;
  preferredName?: string | null;
  email?: string | null;
  secondaryEmail?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  preferredChannel?: CRMContact["preferredChannel"];
  preferredLanguage?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  country?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  birthDate?: string | null;
  gender?: string | null;
}

export interface CRMUpdateContactPatch {
  organizationId: string;
  firstName?: string;
  lastName?: string | null;
  secondLastName?: string | null;
  preferredName?: string | null;
  email?: string | null;
  secondaryEmail?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  preferredChannel?: CRMContact["preferredChannel"];
  preferredLanguage?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  country?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  birthDate?: string | null;
  gender?: string | null;
}

export type CRMContactMutationResult =
  | { status: "success"; contact: CRMContact }
  | { status: "validation-error"; message: string; fieldErrors: Record<string, string> }
  | { status: "forbidden"; message: string }
  | { status: "conflict"; message: string; contact: CRMContact }
  | { status: "server-error"; message: string };

export interface CRMLead {
  id: string;
  organizationId: string;
  contactId: string;
  status: CRMLeadStatusCode;
  interest: string | null;
  source: string | null;
  assignedUserId?: string | null;
  ownerName?: string | null;
  score?: number | null;
  lastActivityAt?: string | null;
  nextActivityAt?: string | null;
  duplicateReviewId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const CRM_LEAD_STATUS_CODES = [
  "new",
  "contacted",
  "qualified",
  "stalled",
  "inactive",
  "converted",
] as const;

export type CRMLeadStatusCode = (typeof CRM_LEAD_STATUS_CODES)[number];

export interface CRMUpdateLeadInput {
  organizationId: string;
  status?: CRMLeadStatusCode;
  assignedUserId?: string | null;
  ownerName?: string | null;
  expectedUpdatedAt?: string;
}

export type CRMLeadMutationResult =
  | { status: "success"; lead: CRMLead }
  | { status: "validation-error" | "forbidden" | "conflict" | "server-error"; message: string; lead?: CRMLead };

export interface CRMOpportunity {
  id: string;
  organizationId: string;
  contactId: string;
  leadId: string | null;
  productKey: string | null;
  origin: "manual" | "lead_conversion";
  name: string;
  stageKey: CRMPipelineStageCode;
  amount: number | null;
  currency: string | null;
  expectedCloseAt: string | null;
}

/** Stable product stage codes used by the first local Pipeline slice. */
export const CRM_PIPELINE_STAGE_CODES = [
  "prospecting",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

export type CRMPipelineStageCode = (typeof CRM_PIPELINE_STAGE_CODES)[number];

export interface CRMPipelineContact {
  id: string;
  displayName: string;
  email: string | null;
}

export interface CRMPipelineOwner {
  id: string;
  displayName: string;
}

export interface CRMPipelineOpportunity {
  id: string;
  organizationId: string;
  name: string;
  stageCode: CRMPipelineStageCode;
  stageLabel: string;
  amount: number | null;
  currency: string | null;
  contact: CRMPipelineContact;
  owner: CRMPipelineOwner | null;
  probability: number | null;
  expectedCloseDate: string | null;
  lossReason: string | null;
  updatedAt: string;
  archivedAt: string | null;
  contactId: string;
  leadId: string | null;
  productKey: string | null;
  origin: "manual" | "lead_conversion";
}

export interface CRMOpportunityListParams {
  organizationId: string;
  query?: string;
  stageCodes?: CRMPipelineStageCode[];
  ownerIds?: string[];
  productKeys?: string[];
  origins?: CRMOpportunity["origin"][];
  sortBy?: "updated" | "name" | "amount" | "expectedCloseDate";
  sortDirection?: "asc" | "desc";
}

export interface CRMMoveOpportunityStageInput {
  organizationId: string;
  stageCode: CRMPipelineStageCode;
  expectedUpdatedAt: string;
}

export interface CRMUpdateOpportunityInput {
  organizationId: string;
  amount?: number | null;
  currency?: string | null;
  expectedCloseDate?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  lossReason?: string | null;
  expectedUpdatedAt: string;
}

export interface CRMCreateOpportunityFromLeadInput {
  organizationId: string;
  productKey: string;
  name?: string | null;
  amount?: number | null;
  currency?: string | null;
  expectedCloseDate?: string | null;
  idempotencyKey?: string;
}

export type CRMOpportunityMutationResult =
  | { status: "success"; opportunity: CRMPipelineOpportunity }
  | { status: "validation-error"; message: string; fieldErrors: Record<string, string> }
  | { status: "forbidden"; message: string }
  | { status: "conflict"; message: string; opportunity: CRMPipelineOpportunity }
  | { status: "server-error"; message: string };

export class CRMAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: "forbidden" | "server-error",
  ) {
    super(message);
    this.name = "CRMAdapterError";
  }
}

export interface CRMTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt: string | null;
  relationId: string;
}

export interface CRMNote {
  id: string;
  body: string | null;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMActivity {
  id: string;
  sourceType: string;
  sourceId: string;
  type: string;
  summary: string;
  occurredAt: string;
}

export interface Customer360View {
  contact: CRMContact;
  leads: CRMLead[];
  opportunities: CRMOpportunity[];
  tasks: CRMTask[];
  notes: CRMNote[];
  timeline: CRMActivity[];
  cursors: Record<Customer360Section, string | null>;
  sectionState: Record<Customer360Section, Customer360SectionState>;
  sectionPermissions: Record<Customer360Section, boolean>;
}

export const contactName = (contact: CRMContact) =>
  [contact.preferredName || contact.firstName, contact.lastName, contact.secondLastName]
    .filter(Boolean)
    .join(" ");
