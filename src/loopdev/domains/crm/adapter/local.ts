import { crmCustomersStore, type LocalCustomer } from "../data/localCustomers";
import { localCrmOpportunitiesStore, type LocalOpportunity } from "../data/localOpportunities";
import { localCrmLeadsStore, type LocalLead } from "../data/localLeads";
import { localReferenceDataAdapter } from "@/loopdev/domains/reference-data/adapter/local";
import type {
  Customer360View,
  CRMContact,
  CRMContactMutationResult,
  CRMActivity,
  CRMContactListParams,
  CRMContactPage,
  CRMCreateContactInput,
  CRMCreateOpportunityFromLeadInput,
  CRMLead,
  CRMLeadMutationResult,
  CRMUpdateLeadInput,
  CRMNote,
  CRMOpportunity,
  CRMOpportunityListParams,
  CRMOpportunityMutationResult,
  CRMMoveOpportunityStageInput,
  CRMPipelineOpportunity,
  CRMPipelineStageCode,
  CRMTask,
  CRMUpdateContactPatch,
} from "./types";
import { contactName, CRMAdapterError, CRM_LEAD_STATUS_CODES, CRM_PIPELINE_STAGE_CODES } from "./types";

const organizationId = "local-development-organization";

const PIPELINE_STAGE_LABELS: Record<CRMPipelineStageCode, string> = {
  prospecting: "Prospecting",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

function toPipelineOpportunity(source: LocalOpportunity): CRMPipelineOpportunity {
  const contact = crmCustomersStore.get(source.contactId);
  const contactView = contact ? toContact(contact) : null;
  return {
    id: source.id,
    organizationId: source.organizationId,
    contactId: source.contactId,
    leadId: source.leadId ?? null,
    productKey: source.productKey ?? null,
    origin: source.origin ?? "manual",
    name: source.name,
    stageCode: source.stageCode,
    stageLabel: PIPELINE_STAGE_LABELS[source.stageCode],
    amount: source.amount,
    currency: source.currency,
    contact: {
      id: source.contactId,
      displayName: contactView ? contactName(contactView) : "Unknown contact",
      email: contactView?.email ?? null,
    },
    owner: source.ownerId && source.ownerName
      ? { id: source.ownerId, displayName: source.ownerName }
      : null,
    probability: source.probability,
    expectedCloseDate: source.expectedCloseDate,
    updatedAt: source.updatedAt,
    archivedAt: source.archivedAt,
  };
}

function toContact(source: LocalCustomer): CRMContact {
  const [firstName, ...lastNameParts] = source.name.split(" ");
  return {
    id: source.id,
    organizationId,
    firstName,
    lastName: lastNameParts.join(" ") || null,
    secondLastName: source.secondLastName ?? null,
    preferredName: source.preferredName ?? null,
    email: source.email,
    secondaryEmail: source.secondaryEmail ?? null,
    phone: source.phone,
    secondaryPhone: source.secondaryPhone ?? null,
    preferredChannel: source.preferredChannel ?? "email",
    preferredLanguage: source.preferredLanguage ?? null,
    documentType: source.documentType ?? null,
    documentNumber: source.documentNumber ?? null,
    birthDate: source.birthDate ?? null,
    gender: source.gender ?? null,
    addressLine1: source.addressLine1 ?? null,
    addressLine2: source.addressLine2 ?? null,
    city: source.city,
    stateProvince: source.stateProvince ?? null,
    postalCode: source.postalCode ?? null,
    country: source.country,
    companyName: source.companyName ?? null,
    jobTitle: source.jobTitle ?? null,
    department: source.department ?? null,
    attributes: { localTier: source.tier, ordersCount: source.ordersCount },
    identityStatus: "verified",
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    archivedAt: source.archivedAt ?? null,
  };
}

const localActivities: CRMActivity[] = [
  { id: "local-activity-1", sourceType: "email", sourceId: "local-email-1", type: "email", summary: "Proposal follow-up sent", occurredAt: new Date().toISOString() },
  { id: "local-activity-2", sourceType: "meeting", sourceId: "local-meeting-1", type: "meeting", summary: "Quarterly review scheduled", occurredAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "local-activity-3", sourceType: "note", sourceId: "local-note-1", type: "note", summary: "Relationship note added", occurredAt: new Date(Date.now() - 3 * 86400000).toISOString() },
];

function toLead(source: LocalLead): CRMLead {
  return {
    id: source.id,
    organizationId: source.organizationId,
    contactId: source.contactId,
    status: source.status,
    interest: source.interest,
    source: source.source,
    assignedUserId: source.assignedUserId,
    ownerName: source.ownerName,
    score: source.score,
    lastActivityAt: source.lastActivityAt,
    nextActivityAt: source.nextActivityAt,
    duplicateReviewId: source.duplicateReviewId,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

function normalizeProductKey(value: string): string {
  return value.trim().toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

export const localLoopdevAdapter = {
  referenceData: localReferenceDataAdapter,
  crm: {
    async listContacts({
      query = "",
      cursor = null,
      limit,
      identityStatus = [],
      preferredChannel = [],
      sortBy = "updated",
      sortDirection = "desc",
    }: CRMContactListParams): Promise<CRMContactPage> {
      const normalizedQuery = query.trim().toLowerCase();
      const filtered = crmCustomersStore.list().map(toContact).filter((contact) => !contact.archivedAt).filter((contact) => {
        if (!normalizedQuery) return true;
        return [`${contact.firstName} ${contact.lastName ?? ""}`.trim(), contact.email, contact.phone, contact.companyName]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      }).filter((contact) => (
        (!identityStatus.length || identityStatus.includes(contact.identityStatus)) &&
        (!preferredChannel.length || (contact.preferredChannel && preferredChannel.includes(contact.preferredChannel)))
      ));
      const sorted = [...filtered].sort((left, right) => {
        const value = (contact: CRMContact) => ({
          name: contactName(contact),
          company: `${contact.companyName ?? ""} ${contact.jobTitle ?? ""}`,
          channel: contact.preferredChannel ?? "",
          identity: contact.identityStatus,
          location: `${contact.city ?? ""} ${contact.stateProvince ?? ""} ${contact.country ?? ""}`,
          updated: contact.updatedAt,
        })[sortBy].toLowerCase();
        const result = value(left).localeCompare(value(right), undefined, { numeric: true });
        return sortDirection === "asc" ? result : -result;
      });
      const offset = cursor ? Number.parseInt(cursor, 10) : 0;
      const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
      const items = sorted.slice(safeOffset, safeOffset + limit);
      const nextOffset = safeOffset + items.length;

      return {
        items,
        nextCursor: nextOffset < sorted.length ? String(nextOffset) : null,
        hasMore: nextOffset < sorted.length,
      };
    },

    async createContact(input: CRMCreateContactInput): Promise<CRMContactMutationResult> {
      if (input.organizationId !== organizationId) {
        return { status: "forbidden", message: "You do not have permission to create contacts in this organization." };
      }

      const validation = validateContactInput(input);
      if (validation) return validation;

      const created = crmCustomersStore.create({
        name: [input.firstName.trim(), input.lastName?.trim()].filter(Boolean).join(" "),
        email: input.email?.trim() ?? "",
        phone: input.phone?.trim() ?? "",
        companyName: input.companyName?.trim() || null,
        secondLastName: input.secondLastName?.trim() || null,
        preferredName: input.preferredName?.trim() || null,
        secondaryEmail: input.secondaryEmail?.trim() || null,
        secondaryPhone: input.secondaryPhone?.trim() || null,
        preferredChannel: input.preferredChannel ?? "email",
        preferredLanguage: input.preferredLanguage?.trim() || null,
        jobTitle: input.jobTitle?.trim() || null,
        department: input.department?.trim() || null,
        addressLine1: input.addressLine1?.trim() || null,
        addressLine2: input.addressLine2?.trim() || null,
        city: input.city?.trim() || "",
        stateProvince: input.stateProvince?.trim() || null,
        postalCode: input.postalCode?.trim() || null,
        country: input.country?.trim() || "",
        documentType: input.documentType?.trim() || null,
        documentNumber: input.documentNumber?.trim() || null,
        birthDate: input.birthDate?.trim() || null,
        gender: input.gender?.trim() || null,
        ordersCount: 0,
        tier: "standard",
      });
      return { status: "success", contact: toContact(created) };
    },

    async updateContact(
      contactId: string,
      patch: CRMUpdateContactPatch,
      expectedUpdatedAt: string,
    ): Promise<CRMContactMutationResult> {
      if (patch.organizationId !== organizationId) {
        return { status: "forbidden", message: "You do not have permission to update contacts in this organization." };
      }

      const current = crmCustomersStore.get(contactId);
      if (!current) return { status: "server-error", message: "The contact could not be found." };

      const currentContact = toContact(current);
      if (currentContact.updatedAt !== expectedUpdatedAt) {
        return { status: "conflict", message: "The contact changed before it could be updated.", contact: currentContact };
      }

      const validation = validateContactInput({ ...currentContact, ...patch });
      if (validation) return validation;

      const firstName = patch.firstName ?? currentContact.firstName;
      const lastName = Object.prototype.hasOwnProperty.call(patch, "lastName")
        ? patch.lastName
        : currentContact.lastName;
      const email = Object.prototype.hasOwnProperty.call(patch, "email") ? patch.email : current.email;
      const phone = Object.prototype.hasOwnProperty.call(patch, "phone") ? patch.phone : current.phone;
      const companyName = Object.prototype.hasOwnProperty.call(patch, "companyName")
        ? patch.companyName
        : current.companyName;
      const nextFields = {
        documentType: Object.prototype.hasOwnProperty.call(patch, "documentType") ? patch.documentType : current.documentType,
        documentNumber: Object.prototype.hasOwnProperty.call(patch, "documentNumber") ? patch.documentNumber : current.documentNumber,
        birthDate: Object.prototype.hasOwnProperty.call(patch, "birthDate") ? patch.birthDate : current.birthDate,
        gender: Object.prototype.hasOwnProperty.call(patch, "gender") ? patch.gender : current.gender,
        secondLastName: patch.secondLastName ?? current.secondLastName,
        preferredName: patch.preferredName ?? current.preferredName,
        secondaryEmail: patch.secondaryEmail ?? current.secondaryEmail,
        secondaryPhone: patch.secondaryPhone ?? current.secondaryPhone,
        preferredChannel: patch.preferredChannel ?? current.preferredChannel,
        preferredLanguage: patch.preferredLanguage ?? current.preferredLanguage,
        jobTitle: patch.jobTitle ?? current.jobTitle,
        department: patch.department ?? current.department,
        addressLine1: patch.addressLine1 ?? current.addressLine1,
        addressLine2: patch.addressLine2 ?? current.addressLine2,
        city: patch.city ?? current.city,
        stateProvince: patch.stateProvince ?? current.stateProvince,
        postalCode: patch.postalCode ?? current.postalCode,
        country: patch.country ?? current.country,
      };
      const updated = crmCustomersStore.update(contactId, {
        name: [firstName, lastName].filter(Boolean).join(" "),
        email: email ?? "",
        phone: phone ?? "",
        companyName: companyName ?? null,
        ...nextFields,
      });
      if (!updated) return { status: "server-error", message: "The contact could not be updated." };
      return { status: "success", contact: toContact(updated) };
    },

    async archiveContact(contactId: string, expectedUpdatedAt: string): Promise<CRMContactMutationResult> {
      const current = crmCustomersStore.get(contactId);
      if (!current) return { status: "server-error", message: "The contact could not be found." };
      const currentContact = toContact(current);
      if (currentContact.updatedAt !== expectedUpdatedAt) {
        return { status: "conflict", message: "The contact changed before it could be archived.", contact: currentContact };
      }
      const archived = crmCustomersStore.update(contactId, { archivedAt: new Date().toISOString() });
      if (!archived) return { status: "server-error", message: "The contact could not be archived." };
      return { status: "success", contact: toContact(archived) };
    },

    async listLeads(): Promise<CRMLead[]> {
      return localCrmLeadsStore.list().map(toLead);
    },

    async updateLead(leadId: string, input: CRMUpdateLeadInput): Promise<CRMLeadMutationResult> {
      if (input.organizationId !== organizationId) {
        return { status: "forbidden", message: "You do not have permission to update leads in this organization." };
      }
      const current = localCrmLeadsStore.get(leadId);
      if (!current || current.organizationId !== organizationId) {
        return { status: "server-error", message: "The lead could not be found." };
      }
      if (input.expectedUpdatedAt && current.updatedAt !== input.expectedUpdatedAt) {
        return { status: "conflict", message: "The lead changed before it could be updated.", lead: toLead(current) };
      }
      if (input.status && !CRM_LEAD_STATUS_CODES.includes(input.status)) {
        return { status: "validation-error", message: "The selected lead status is not available." };
      }
      const updated = localCrmLeadsStore.update(leadId, {
        ...(input.status ? { status: input.status } : {}),
        ...(input.assignedUserId !== undefined ? { assignedUserId: input.assignedUserId } : {}),
        ...(input.ownerName !== undefined ? { ownerName: input.ownerName } : {}),
      });
      return updated
        ? { status: "success", lead: toLead(updated) }
        : { status: "server-error", message: "The lead could not be updated." };
    },

    async listOpportunities({
      organizationId: requestedOrganizationId,
      query = "",
      stageCodes = [],
      ownerIds = [],
    }: CRMOpportunityListParams): Promise<CRMPipelineOpportunity[]> {
      if (requestedOrganizationId !== organizationId) {
        throw new CRMAdapterError(
          "You do not have permission to view opportunities in this organization.",
          "forbidden",
        );
      }

      const normalizedQuery = query.trim().toLowerCase();
      return localCrmOpportunitiesStore
        .list()
        .filter((opportunity) => opportunity.organizationId === requestedOrganizationId)
        .filter((opportunity) => !opportunity.archivedAt)
        .filter((opportunity) => !stageCodes.length || stageCodes.includes(opportunity.stageCode))
        .filter((opportunity) => !ownerIds.length || (opportunity.ownerId && ownerIds.includes(opportunity.ownerId)))
        .filter((opportunity) => {
          if (!normalizedQuery) return true;
          const contact = crmCustomersStore.get(opportunity.contactId);
          const contactView = contact ? toContact(contact) : null;
          return [
            opportunity.name,
            contactView ? contactName(contactView) : "",
            contactView?.email ?? "",
            opportunity.ownerName ?? "",
          ].some((value) => value.toLowerCase().includes(normalizedQuery));
        })
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .map(toPipelineOpportunity);
    },

    async moveOpportunityStage(
      opportunityId: string,
      input: CRMMoveOpportunityStageInput | CRMPipelineStageCode,
      expectedUpdatedAt?: string,
    ): Promise<CRMOpportunityMutationResult> {
      const moveInput: CRMMoveOpportunityStageInput = typeof input === "string"
        ? { organizationId, stageCode: input, expectedUpdatedAt: expectedUpdatedAt ?? "" }
        : input;
      if (moveInput.organizationId !== organizationId) {
        return {
          status: "forbidden",
          message: "You do not have permission to move opportunities in this organization.",
        };
      }
      if (!CRM_PIPELINE_STAGE_CODES.includes(moveInput.stageCode)) {
        return { status: "server-error", message: "The selected pipeline stage is not available." };
      }

      const current = localCrmOpportunitiesStore.get(opportunityId);
      if (!current || current.organizationId !== moveInput.organizationId || current.archivedAt) {
        return { status: "server-error", message: "The opportunity could not be found." };
      }
      const currentOpportunity = toPipelineOpportunity(current);
      if (current.updatedAt !== moveInput.expectedUpdatedAt) {
        return {
          status: "conflict",
          message: "The opportunity changed before it could be moved.",
          opportunity: currentOpportunity,
        };
      }
      const updated = localCrmOpportunitiesStore.update(opportunityId, { stageCode: moveInput.stageCode });
      if (!updated) return { status: "server-error", message: "The opportunity could not be updated." };
      return { status: "success", opportunity: toPipelineOpportunity(updated) };
    },

    async createOpportunityFromLead(
      leadId: string,
      input: CRMCreateOpportunityFromLeadInput,
    ): Promise<CRMOpportunityMutationResult> {
      if (input.organizationId !== organizationId) {
        return { status: "forbidden", message: "You do not have permission to convert leads in this organization." };
      }

      const productKey = normalizeProductKey(input.productKey);
      const fieldErrors: Record<string, string> = {};
      if (!productKey) fieldErrors.productKey = "Product or interest is required.";
      if (input.amount !== undefined && input.amount !== null && (!Number.isFinite(input.amount) || input.amount < 0)) {
        fieldErrors.amount = "Amount must be a non-negative number.";
      }
      if (Object.keys(fieldErrors).length) {
        return { status: "validation-error", message: "Check the conversion details and try again.", fieldErrors };
      }

      const existing = localCrmOpportunitiesStore.list().find((opportunity) => (
        opportunity.organizationId === organizationId &&
        opportunity.leadId === leadId &&
        opportunity.origin === "lead_conversion" &&
        opportunity.productKey === productKey
      ));
      if (existing) return { status: "success", opportunity: toPipelineOpportunity(existing) };
      const normalizedIdempotencyKey = input.idempotencyKey?.trim();
      if (normalizedIdempotencyKey) {
        const idempotencyConflict = localCrmOpportunitiesStore.list().find((opportunity) => (
          opportunity.organizationId === organizationId &&
          opportunity.origin === "lead_conversion" &&
          opportunity.idempotencyKey === normalizedIdempotencyKey &&
          (opportunity.leadId !== leadId || opportunity.productKey !== productKey)
        ));
        if (idempotencyConflict) {
          return {
            status: "conflict",
            message: "The idempotency key was already used for a different lead conversion.",
            opportunity: toPipelineOpportunity(idempotencyConflict),
          };
        }
      }

      const lead = localCrmLeadsStore.get(leadId);
      if (!lead || lead.organizationId !== organizationId) {
        return { status: "server-error", message: "The lead could not be found." };
      }
      if (lead.status !== "qualified" && lead.status !== "converted") {
        return {
          status: "validation-error",
          message: "Only qualified leads can create opportunities.",
          fieldErrors: { leadId: "The lead must be qualified before conversion." },
        };
      }
      const contact = crmCustomersStore.get(lead.contactId);
      if (!contact) return { status: "server-error", message: "The lead contact could not be found." };

      const created = localCrmOpportunitiesStore.create({
        organizationId,
        name: input.name?.trim() || input.productKey.trim(),
        contactId: lead.contactId,
        leadId,
        productKey,
        origin: "lead_conversion",
        idempotencyKey: normalizedIdempotencyKey ?? null,
        ownerId: null,
        ownerName: null,
        stageCode: "qualified",
        amount: input.amount ?? null,
        currency: input.currency?.trim() || null,
        probability: 0.4,
        expectedCloseDate: input.expectedCloseDate ?? null,
        archivedAt: null,
      });
      if (!created) return { status: "server-error", message: "The opportunity could not be created." };

      if (lead.status === "qualified") {
        const converted = localCrmLeadsStore.update(leadId, { status: "converted" });
        if (!converted) return { status: "server-error", message: "The lead could not be converted." };
      }
      return { status: "success", opportunity: toPipelineOpportunity(created) };
    },

    async getCustomer360(contactId: string): Promise<Customer360View | null> {
      const contact = crmCustomersStore.get(contactId);
      if (!contact) return null;

      const leads = localCrmLeadsStore.list().filter((lead) => lead.contactId === contactId).map(toLead);
      const opportunities: CRMOpportunity[] = localCrmOpportunitiesStore.list()
        .filter((opportunity) => opportunity.organizationId === organizationId && opportunity.contactId === contactId && !opportunity.archivedAt)
        .map((opportunity) => ({
          id: opportunity.id,
          organizationId: opportunity.organizationId,
          contactId: opportunity.contactId,
          leadId: opportunity.leadId,
          productKey: opportunity.productKey,
          origin: opportunity.origin,
          name: opportunity.name,
          stageKey: opportunity.stageCode,
          amount: opportunity.amount,
          currency: opportunity.currency,
          expectedCloseAt: opportunity.expectedCloseDate,
        }));
      const tasks: CRMTask[] = [
        { id: "local-task-1", title: "Review renewal requirements", status: "open", priority: "high", dueAt: new Date().toISOString(), relationId: contactId },
        { id: "local-task-2", title: "Schedule technical follow-up", status: "open", priority: "medium", dueAt: new Date(Date.now() + 86400000).toISOString(), relationId: contactId },
      ];
      const notes: CRMNote[] = [{ id: "local-note-1", body: "Relationship note added during the last review.", visibility: "team", createdAt: localActivities[2].occurredAt, updatedAt: localActivities[2].occurredAt }];
      const state = { profile: "fresh", leads: "fresh", opportunities: "fresh", tasks: "fresh", notes: "fresh", timeline: "fresh" } as const;

      return {
        contact: toContact(contact),
        leads,
        opportunities,
        tasks,
        notes,
        timeline: localActivities,
        cursors: { profile: null, leads: null, opportunities: null, tasks: null, notes: null, timeline: null },
        sectionState: state,
        sectionPermissions: { profile: true, leads: true, opportunities: true, tasks: true, notes: true, timeline: true },
      };
    },
  },
} as const;

function validateContactInput(input: {
  firstName?: string | null;
  email?: string | null;
  phone?: string | null;
}): Extract<CRMContactMutationResult, { status: "validation-error" }> | null {
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
