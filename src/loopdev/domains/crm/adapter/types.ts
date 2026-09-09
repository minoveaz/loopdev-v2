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
}

export interface CRMLead {
  id: string;
  contactId: string;
  status: string;
  interest: string | null;
  source: string | null;
  createdAt: string;
}

export interface CRMOpportunity {
  id: string;
  contactId: string;
  name: string;
  stageKey: string;
  amount: number | null;
  currency: string | null;
  expectedCloseAt: string | null;
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
