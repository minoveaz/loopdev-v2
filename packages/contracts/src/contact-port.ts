export type ContactIdentityStatus = "verified" | "pending_identity_review";
export type ContactPreferredChannel = "whatsapp" | "phone" | "email";

export interface ContactRecord {
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
  preferredChannel: ContactPreferredChannel | null;
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
  identityStatus: ContactIdentityStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ContactListParams {
  organizationId: string;
  query?: string;
  cursor?: string | null;
  limit: number;
  identityStatus?: ContactIdentityStatus[];
  preferredChannel?: ContactPreferredChannel[];
  sortBy?: "name" | "company" | "channel" | "identity" | "location" | "updated";
  sortDirection?: "asc" | "desc";
}

export interface ContactPage {
  items: ContactRecord[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreateContactInput {
  organizationId: string;
  firstName: string;
  lastName?: string | null;
  secondLastName?: string | null;
  preferredName?: string | null;
  email?: string | null;
  secondaryEmail?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  preferredChannel?: ContactPreferredChannel | null;
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
  attributes?: Record<string, unknown>;
}

export type UpdateContactPatch = Partial<Omit<CreateContactInput, "organizationId">> & {
  organizationId: string;
};

export type ContactMutationResult =
  | { status: "success"; contact: ContactRecord }
  | { status: "validation-error"; message: string; fieldErrors: Record<string, string> }
  | { status: "forbidden"; message: string }
  | { status: "conflict"; message: string; contact: ContactRecord }
  | { status: "server-error"; message: string };

export interface PotentialContactDuplicate {
  contact: ContactRecord;
  score: number;
  reasons: string[];
}

export type DuplicateReviewResult =
  | { status: "success"; reviewId: string; dismissedAt: string }
  | { status: "forbidden" | "not-found" | "server-error"; message: string };

export interface ContactRelatedItem {
  id: string;
  name?: string;
  summary?: string;
  occurredAt?: string;
  stageKey?: string;
  amount?: number | null;
}

export type Customer360Section = "profile" | "leads" | "opportunities" | "tasks" | "notes" | "timeline";
export type Customer360SectionState = "fresh" | "stale" | "loading" | "error" | "forbidden";

export interface ContactCustomer360View {
  contact: ContactRecord;
  leads: ContactRelatedItem[];
  opportunities: ContactRelatedItem[];
  tasks: ContactRelatedItem[];
  notes: ContactRelatedItem[];
  timeline: ContactRelatedItem[];
  cursors: Record<Customer360Section, string | null>;
  sectionState: Record<Customer360Section, Customer360SectionState>;
  sectionPermissions: Record<Customer360Section, boolean>;
}

export interface ContactPort {
  listContacts(params: ContactListParams): Promise<ContactPage>;
  createContact(input: CreateContactInput): Promise<ContactMutationResult>;
  updateContact(contactId: string, patch: UpdateContactPatch, expectedUpdatedAt: string): Promise<ContactMutationResult>;
  archiveContact(contactId: string, expectedUpdatedAt: string): Promise<ContactMutationResult>;
  getCustomer360(contactId: string): Promise<ContactCustomer360View | null>;
  findPotentialDuplicates(contactId: string): Promise<PotentialContactDuplicate[]>;
  dismissDuplicateReview(contactId: string, candidateId: string, confirmation: string): Promise<DuplicateReviewResult>;
}

export function validateContactMutationInput(input: {
  firstName?: string | null;
  email?: string | null;
  phone?: string | null;
}): Extract<ContactMutationResult, { status: "validation-error" }> | null {
  const fieldErrors: Record<string, string> = {};
  if (!input.firstName?.trim()) fieldErrors.firstName = "First name is required.";
  if (!input.email?.trim() && !input.phone?.trim()) {
    fieldErrors.email = "Email or phone is required.";
    fieldErrors.phone = "Email or phone is required.";
  }
  return Object.keys(fieldErrors).length
    ? { status: "validation-error", message: "Check the contact details and try again.", fieldErrors }
    : null;
}