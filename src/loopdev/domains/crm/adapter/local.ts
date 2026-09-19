import { crmCustomersStore, type LocalCustomer } from "../data/localCustomers";
import {
  localCrmOpportunitiesStore,
  localCrmOpportunityLinesStore,
  type LocalOpportunity,
  type LocalOpportunityLine,
} from "../data/localOpportunities";
import { localCrmLeadsStore, type LocalLead } from "../data/localLeads";
import { localCrmStageHistoryStore } from "../data/localStageHistory";
import { localCustomerProductsStore } from "../data/localCustomerProducts";
import { localReferenceDataAdapter } from "../../reference-data/adapter/local";
import { catalogAdapter } from "../../catalog";
import { platformAdapter } from "../../platform";
import type {
  Customer360View,
  CRMContact,
  CRMContactMutationResult,
  CRMActivity,
  CRMContactListParams,
  CRMContactPage,
  CRMCreateContactInput,
  CRMCreateLeadInput,
  CRMCreateOpportunityFromLeadInput,
  CRMCreateOpportunityInput,
  CRMLead,
  CRMLeadMutationResult,
  CRMUpdateLeadInput,
  CRMOpportunity,
  CRMOpportunityListParams,
  CRMOpportunityMutationResult,
  CRMMoveOpportunityStageInput,
  CRMUpdateOpportunityInput,
  CRMReopenOpportunityInput,
  CRMOpportunityLine,
  CRMOpportunityStageHistory,
  CRMStageDefinition,
  CRMPipelineOpportunity,
  CRMPipelineStageCode,
  CRMTask,
  CRMUpdateContactPatch,
  CRMCustomerProduct,
  CRMCreateCustomerProductInput,
  CRMPotentialDuplicate,
  CRMDuplicateReviewResult,
} from "./types";
import { contactName, CRMAdapterError, CRM_LEAD_STATUS_CODES, CRM_PIPELINE_STAGE_CODES } from "./types";
import { localCrmOperationsAdapter } from "../operations/adapter/local";
import { localCrmAutomationsAdapter } from "../automations";
import { localCommunicationsAdapter } from "../../communications/adapter/local";
import { localNotesAdapter, type GlobalNoteRecord, type NoteRelationRef } from "../../notes";
import { validateContactMutationInput } from "../../../../../packages/contracts/src/contact-port";

const organizationId = "local-development-organization";
const dismissedDuplicateReviews = new Set<string>();

const PIPELINE_STAGE_LABELS: Record<CRMPipelineStageCode, string> = {
  prospecting: "Prospecting",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

const PIPELINE_STAGES: CRMStageDefinition[] = [
  { code: "prospecting", label: "Prospecting", order: 10, terminal: false, probability: 0.15 },
  { code: "qualified", label: "Qualified", order: 20, terminal: false, probability: 0.4 },
  { code: "proposal", label: "Proposal", order: 30, terminal: false, probability: 0.65 },
  { code: "negotiation", label: "Negotiation", order: 40, terminal: false, probability: 0.8 },
  { code: "won", label: "Won", order: 50, terminal: true, probability: 1 },
  { code: "lost", label: "Lost", order: 60, terminal: true, probability: 0 },
];

/**
 * Compatibility bridge for the one seeded CRM note that predates GlobalNoteRecord.
 * It is imported through the global adapter once, so Customer 360 has one notes source.
 */
function legacyCustomerNote(contactId: string, contactLabel: string, occurredAt: string): GlobalNoteRecord {
  const body = "Relationship note added during the last review.";
  const relation: NoteRelationRef = { type: "contact", id: contactId, label: contactLabel };
  return {
    id: `legacy-crm-note-${contactId}`,
    organizationId,
    authorId: "legacy-crm",
    authorName: "Imported CRM note",
    title: "",
    mode: "quick",
    visibility: "team",
    relations: [relation],
    content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: body }] }] },
    plainTextPreview: body,
    mentions: [],
    attachments: [],
    createdAt: occurredAt,
    updatedAt: occurredAt,
    permissions: { canEdit: true, canDelete: true },
  };
}

function toOpportunityLine(source: LocalOpportunityLine): CRMOpportunityLine {
  return {
    id: source.id,
    opportunityId: source.opportunityId,
    catalogItemId: source.catalogItemId,
    offerId: source.offerId,
    variantId: source.variantId,
    productKey: source.productKey,
    label: source.label,
    quantity: source.quantity,
    unitAmount: source.unitAmount,
    currency: source.currency,
    totalAmount: source.totalAmount,
  };
}

function toPipelineOpportunity(source: LocalOpportunity): CRMPipelineOpportunity {
  const contact = crmCustomersStore.get(source.contactId);
  const contactView = contact ? toContact(contact) : null;
  return {
    id: source.id,
    organizationId: source.organizationId,
    contactId: source.contactId,
    leadId: source.leadId ?? null,
    productKey: source.productKey ?? null,
    catalogItemId: source.catalogItemId ?? null,
    offerId: source.offerId ?? null,
    variantId: source.variantId ?? null,
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
    lossReason: source.lossReason ?? null,
    updatedAt: source.updatedAt,
    archivedAt: source.archivedAt,
    lines: localCrmOpportunityLinesStore.list()
      .filter((line) => line.opportunityId === source.id)
      .map(toOpportunityLine),
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
  { id: "local-activity-1", sourceType: "email", sourceId: "local-email-1", type: "email", summary: "Proposal follow-up sent", occurredAt: new Date().toISOString(), actor: "Maya Chen", source: "Communications", channel: "Email", status: "completed", outcome: "Delivered", details: "The proposal follow-up was delivered and opened by the contact." },
  { id: "local-activity-2", sourceType: "meeting", sourceId: "local-meeting-1", type: "meeting", summary: "Quarterly review scheduled", occurredAt: new Date(Date.now() - 86400000).toISOString(), actor: "Maya Chen", source: "CRM", channel: "Meeting", status: "scheduled", outcome: "Pending", details: "Quarterly review scheduled for the next account planning cycle." },
  { id: "local-activity-3", sourceType: "note", sourceId: "local-note-1", type: "note", summary: "Relationship note added", occurredAt: new Date(Date.now() - 3 * 86400000).toISOString(), actor: "Jordan Lee", source: "Notes", channel: "Internal", status: "completed", outcome: "Recorded", details: "The contact prefers concise updates and quarterly planning conversations." },
  { id: "local-activity-4", sourceType: "call", sourceId: "local-call-1", type: "call", summary: "Discovery call completed", occurredAt: new Date(Date.now() - 5 * 86400000).toISOString(), actor: "Maya Chen", source: "CRM", channel: "Phone", status: "completed", outcome: "Connected", details: "Discussed current priorities, timeline and decision process." },
  { id: "local-activity-5", sourceType: "task", sourceId: "local-task-1", type: "task", summary: "Prepare pricing comparison", occurredAt: new Date(Date.now() - 7 * 86400000).toISOString(), actor: "Alex Morgan", source: "Tasks", channel: "Internal", status: "pending", outcome: "Open", details: "Prepare a comparison between the current plan and the enterprise option." },
  { id: "local-activity-6", sourceType: "opportunity", sourceId: "local-opportunity-1", type: "opportunity", summary: "Opportunity moved to proposal", occurredAt: new Date(Date.now() - 10 * 86400000).toISOString(), actor: "Maya Chen", source: "Pipeline", channel: "CRM", status: "completed", outcome: "Stage changed", details: "The opportunity was advanced after the discovery call." },
  { id: "local-activity-7", sourceType: "whatsapp", sourceId: "local-whatsapp-1", type: "communication", summary: "WhatsApp message received", occurredAt: new Date(Date.now() - 12 * 86400000).toISOString(), actor: "Aria Blackwood", source: "Communications", channel: "WhatsApp", status: "completed", outcome: "Received", details: "The contact asked for a revised implementation timeline." },
  { id: "local-activity-8", sourceType: "status", sourceId: "local-status-1", type: "status_change", summary: "Contact marked as verified", occurredAt: new Date(Date.now() - 15 * 86400000).toISOString(), actor: "System", source: "CRM", channel: "System", status: "completed", outcome: "Verified", details: "Identity verification was completed successfully." },
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
    estimatedValue: source.estimatedValue,
    estimatedCurrency: source.estimatedCurrency,
    qualificationNeed: source.qualificationNeed,
    qualificationTimeline: source.qualificationTimeline,
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

function appendStageHistory(
  opportunityId: string,
  fromStageCode: CRMPipelineStageCode | null,
  toStageCode: CRMPipelineStageCode,
  reason: string | null = null,
): void {
  const occurredAt = new Date().toISOString();
  localCrmStageHistoryStore.create({ opportunityId, fromStageCode, toStageCode, reason, occurredAt });
}

export const localLoopdevAdapter = {
  platform: platformAdapter,
  catalog: catalogAdapter,
  referenceData: localReferenceDataAdapter,
  communications: localCommunicationsAdapter,
  notes: localNotesAdapter,
  crm: {
    operations: localCrmOperationsAdapter,
    automations: localCrmAutomationsAdapter,
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

      const validation = validateContactMutationInput(input);
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

      const validation = validateContactMutationInput({ ...currentContact, ...patch });
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

    async bulkArchiveContacts(contactIds: string[]): Promise<{ successCount: number; failureCount: number }> {
      let successCount = 0;
      let failureCount = 0;
      const now = new Date().toISOString();
      for (const id of contactIds) {
        const current = crmCustomersStore.get(id);
        if (current) {
          crmCustomersStore.update(id, { archivedAt: now });
          successCount++;
        } else {
          failureCount++;
        }
      }
      return { successCount, failureCount };
    },

    async findPotentialDuplicates(contactId: string): Promise<CRMPotentialDuplicate[]> {
      const source = crmCustomersStore.get(contactId);
      if (!source) return [];
      const contact = toContact(source);
      return crmCustomersStore.list().filter((candidate) => candidate.id !== contactId && !candidate.archivedAt).map((candidate) => {
        const other = toContact(candidate);
        const reasons: string[] = [];
        if (contact.email && other.email && contact.email.toLowerCase() === other.email.toLowerCase()) reasons.push("Same email address");
        if (contact.phone && other.phone && contact.phone === other.phone) reasons.push("Same phone number");
        if (`${contact.firstName} ${contact.lastName ?? ""}`.trim().toLowerCase() === `${other.firstName} ${other.lastName ?? ""}`.trim().toLowerCase()) reasons.push("Same name");
        return { contact: other, score: Math.min(99, reasons.length * 35 + (reasons.length ? 10 : 0)), reasons };
      }).filter((candidate) => candidate.reasons.length && !dismissedDuplicateReviews.has(`${contactId}:${candidate.contact.id}`));
    },

    async dismissDuplicateReview(contactId: string, candidateId: string, confirmation: string): Promise<CRMDuplicateReviewResult> {
      if (confirmation !== "DISMISS_DUPLICATE_REVIEW") return { status: "server-error", message: "Audit confirmation is required." };
      if (!crmCustomersStore.get(contactId) || !crmCustomersStore.get(candidateId)) return { status: "not-found", message: "The duplicate review contact could not be found." };
      dismissedDuplicateReviews.add(`${contactId}:${candidateId}`);
      return { status: "success", reviewId: `${contactId}:${candidateId}`, dismissedAt: new Date().toISOString() };
    },

    async listLeads(): Promise<CRMLead[]> {
      return localCrmLeadsStore.list().map(toLead);
    },

    async createLead(input: CRMCreateLeadInput): Promise<CRMLeadMutationResult> {
      if (input.organizationId !== organizationId) {
        return { status: "forbidden", message: "You do not have permission to create leads in this organization." };
      }
      const fieldErrors: Record<string, string> = {};
      if (!input.contactId.trim() || !crmCustomersStore.get(input.contactId)) {
        fieldErrors.contactId = "Select an existing contact.";
      }
      if (!input.interest?.trim()) fieldErrors.interest = "Interest is required.";
      if (Object.keys(fieldErrors).length) {
        return { status: "validation-error", message: "Check the lead details and try again.", fieldErrors };
      }
      const created = localCrmLeadsStore.create({
        organizationId,
        contactId: input.contactId,
        status: "new",
        interest: input.interest!.trim(),
        source: input.source?.trim() || null,
        assignedUserId: input.assignedUserId ?? null,
        ownerName: input.ownerName?.trim() || null,
        score: input.score ?? null,
        estimatedValue: input.estimatedValue ?? null,
        estimatedCurrency: input.estimatedCurrency ?? null,
        qualificationNeed: input.qualificationNeed?.trim() || null,
        qualificationTimeline: input.qualificationTimeline?.trim() || null,
        lastActivityAt: null,
        nextActivityAt: null,
        duplicateReviewId: null,
      });
      return created
        ? { status: "success", lead: toLead(created) }
        : { status: "server-error", message: "The lead could not be created." };
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
        ...(input.interest !== undefined ? { interest: input.interest } : {}),
        ...(input.source !== undefined ? { source: input.source } : {}),
        ...(input.assignedUserId !== undefined ? { assignedUserId: input.assignedUserId } : {}),
        ...(input.ownerName !== undefined ? { ownerName: input.ownerName } : {}),
        ...(input.estimatedValue !== undefined ? { estimatedValue: input.estimatedValue } : {}),
        ...(input.estimatedCurrency !== undefined ? { estimatedCurrency: input.estimatedCurrency } : {}),
        ...(input.qualificationNeed !== undefined ? { qualificationNeed: input.qualificationNeed } : {}),
        ...(input.qualificationTimeline !== undefined ? { qualificationTimeline: input.qualificationTimeline } : {}),
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
      productKeys = [],
      catalogItemIds = [],
      origins = [],
      sortBy = "updated",
      sortDirection = "desc",
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
        .filter((opportunity) => !productKeys.length || (opportunity.productKey && productKeys.includes(opportunity.productKey)))
        .filter((opportunity) => !catalogItemIds.length || (opportunity.catalogItemId && catalogItemIds.includes(opportunity.catalogItemId)))
        .filter((opportunity) => !origins.length || origins.includes(opportunity.origin))
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
        .sort((left, right) => {
          const leftValue = sortBy === "amount"
            ? left.amount ?? 0
            : sortBy === "name"
              ? left.name
              : sortBy === "expectedCloseDate"
                ? left.expectedCloseDate ?? ""
                : left.updatedAt;
          const rightValue = sortBy === "amount"
            ? right.amount ?? 0
            : sortBy === "name"
              ? right.name
              : sortBy === "expectedCloseDate"
                ? right.expectedCloseDate ?? ""
                : right.updatedAt;
          const result = typeof leftValue === "number" && typeof rightValue === "number"
            ? leftValue - rightValue
            : String(leftValue).localeCompare(String(rightValue));
          return sortDirection === "asc" ? result : -result;
        })
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
      if ((current.stageCode === "won" || current.stageCode === "lost") && moveInput.stageCode !== current.stageCode) {
        return {
          status: "validation-error",
          message: "Terminal opportunities must be reopened with an explicit reason before changing stage.",
          fieldErrors: { stageCode: "Use the reopen action for won or lost opportunities." },
        };
      }
      const updated = localCrmOpportunitiesStore.update(opportunityId, {
        stageCode: moveInput.stageCode,
        probability: PIPELINE_STAGES.find((stage) => stage.code === moveInput.stageCode)?.probability ?? current.probability,
        ...(moveInput.stageCode !== "lost" ? { lossReason: null } : {}),
      });
      if (!updated) return { status: "server-error", message: "The opportunity could not be updated." };
      if (current.stageCode !== updated.stageCode) appendStageHistory(opportunityId, current.stageCode, updated.stageCode);
      return { status: "success", opportunity: toPipelineOpportunity(updated) };
    },

    async updateOpportunity(
      opportunityId: string,
      input: CRMUpdateOpportunityInput,
    ): Promise<CRMOpportunityMutationResult> {
      if (input.organizationId !== organizationId) {
        return { status: "forbidden", message: "You do not have permission to update opportunities in this organization." };
      }
      const current = localCrmOpportunitiesStore.get(opportunityId);
      if (!current || current.organizationId !== organizationId || current.archivedAt) {
        return { status: "server-error", message: "The opportunity could not be found." };
      }
      if (current.updatedAt !== input.expectedUpdatedAt) {
        return { status: "conflict", message: "The opportunity changed before it could be updated.", opportunity: toPipelineOpportunity(current) };
      }
      const fieldErrors: Record<string, string> = {};
      if (input.amount !== undefined && input.amount !== null && (!Number.isFinite(input.amount) || input.amount < 0)) {
        fieldErrors.amount = "Amount must be a non-negative number.";
      }
      if (current.stageCode === "lost" && input.lossReason !== undefined && !input.lossReason?.trim()) {
        fieldErrors.lossReason = "A loss reason is required.";
      }
      if (input.lines && (!input.lines.length || input.lines.some((line) => !Number.isFinite(line.quantity) || line.quantity <= 0))) {
        fieldErrors.lines = "At least one line with a positive quantity is required.";
      }
      if (Object.keys(fieldErrors).length) {
        return { status: "validation-error", message: "Check the opportunity details and try again.", fieldErrors };
      }
      const updated = localCrmOpportunitiesStore.update(opportunityId, {
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.expectedCloseDate !== undefined ? { expectedCloseDate: input.expectedCloseDate } : {}),
        ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
        ...(input.ownerName !== undefined ? { ownerName: input.ownerName } : {}),
        ...(input.lossReason !== undefined ? { lossReason: input.lossReason?.trim() || null } : {}),
      });
      if (updated && input.lines) {
        input.lines.forEach((line) => {
          const currentLine = line.id
            ? localCrmOpportunityLinesStore.get(line.id)
            : localCrmOpportunityLinesStore.list().find((item) => item.opportunityId === opportunityId);
          if (!currentLine) return;
          const unitAmount = line.unitAmount === undefined ? currentLine.unitAmount : line.unitAmount;
          localCrmOpportunityLinesStore.update(currentLine.id, {
            label: line.label?.trim() || currentLine.label,
            quantity: line.quantity,
            unitAmount,
            currency: line.currency === undefined ? currentLine.currency : line.currency,
            totalAmount: unitAmount === null ? null : unitAmount * line.quantity,
          });
        });
      }
      return updated
        ? { status: "success", opportunity: toPipelineOpportunity(updated) }
        : { status: "server-error", message: "The opportunity could not be updated." };
    },

    async createOpportunity(input: CRMCreateOpportunityInput): Promise<CRMOpportunityMutationResult> {
      if (input.organizationId !== organizationId) {
        return { status: "forbidden", message: "You do not have permission to create opportunities in this organization." };
      }
      const fieldErrors: Record<string, string> = {};
      if (!input.contactId.trim() || !crmCustomersStore.get(input.contactId)) fieldErrors.contactId = "Select an existing contact.";
      if (!input.name.trim()) fieldErrors.name = "Opportunity name is required.";
      if (input.amount !== undefined && input.amount !== null && (!Number.isFinite(input.amount) || input.amount < 0)) fieldErrors.amount = "Amount must be a non-negative number.";
      if (!input.lines.length) fieldErrors.lines = "Add at least one opportunity line.";
      if (input.lines.some((line) => !Number.isFinite(line.quantity) || line.quantity <= 0)) {
        fieldErrors.lines = "Line quantities must be greater than zero.";
      }
      if (input.lines.some((line) => line.unitAmount !== undefined && line.unitAmount !== null && (!Number.isFinite(line.unitAmount) || line.unitAmount < 0))) {
        fieldErrors.lines = "Line amounts must be non-negative numbers.";
      }
      const lineRefs = input.lines.map((line) => ({
        ...line,
        productKey: normalizeProductKey(line.productKey ?? ""),
      }));
      const resolvedLines = [];
      for (const line of lineRefs) {
        const hasReference = Boolean(line.catalogItemId || line.offerId || line.variantId || line.productKey);
        if (!hasReference) {
          fieldErrors.lines = "Each line needs a catalog reference or product key.";
          continue;
        }
        const resolved = await catalogAdapter.resolveReference({
          organizationId,
          reference: {
            catalogItemId: line.catalogItemId,
            offerId: line.offerId,
            variantId: line.variantId,
            productKey: line.productKey,
          },
        });
        if ((line.catalogItemId || line.offerId || line.variantId) && !resolved) {
          fieldErrors.lines = "One or more catalog references are not available.";
          continue;
        }
        resolvedLines.push({ line, resolved });
      }
      if (Object.keys(fieldErrors).length) {
        return { status: "validation-error", message: "Check the opportunity details and try again.", fieldErrors };
      }
      const first = resolvedLines[0];
      const primaryProductKey = first.resolved?.item.key ?? first.line.productKey ?? null;
      const calculatedAmount = resolvedLines.reduce((sum, entry) => {
        const unitAmount = entry.line.unitAmount ?? null;
        return sum + (unitAmount === null ? 0 : unitAmount * entry.line.quantity);
      }, 0);
      const amount = input.amount !== undefined && input.amount !== null
        ? input.amount
        : calculatedAmount || null;
      const created = localCrmOpportunitiesStore.create({
        organizationId,
        name: input.name.trim(),
        contactId: input.contactId,
        leadId: input.leadId ?? null,
        productKey: primaryProductKey,
        catalogItemId: first.resolved?.item.id ?? first.line.catalogItemId ?? null,
        offerId: first.resolved?.offer?.id ?? first.line.offerId ?? null,
        variantId: first.resolved?.variant?.id ?? first.line.variantId ?? null,
        origin: "manual",
        idempotencyKey: null,
        ownerId: input.ownerId ?? null,
        ownerName: input.ownerName?.trim() || null,
        stageCode: "prospecting",
        amount,
        currency: input.currency?.trim() || first.line.currency?.trim() || null,
        probability: PIPELINE_STAGES[0].probability,
        expectedCloseDate: input.expectedCloseDate ?? null,
        lossReason: null,
        archivedAt: null,
      });
      if (!created) return { status: "server-error", message: "The opportunity could not be created." };
      for (const entry of resolvedLines) {
        const unitAmount = entry.line.unitAmount ?? null;
        localCrmOpportunityLinesStore.create({
          opportunityId: created.id,
          catalogItemId: entry.resolved?.item.id ?? entry.line.catalogItemId ?? null,
          offerId: entry.resolved?.offer?.id ?? entry.line.offerId ?? null,
          variantId: entry.resolved?.variant?.id ?? entry.line.variantId ?? null,
          productKey: entry.resolved?.item.key ?? entry.line.productKey ?? null,
          label: entry.line.label?.trim() || entry.resolved?.item.name || entry.line.productKey || "Opportunity line",
          quantity: entry.line.quantity,
          unitAmount,
          currency: entry.line.currency?.trim() || input.currency?.trim() || null,
          totalAmount: unitAmount === null ? null : unitAmount * entry.line.quantity,
        });
      }
      appendStageHistory(created.id, null, created.stageCode);
      return { status: "success", opportunity: toPipelineOpportunity(created) };
    },

    async reopenOpportunity(
      opportunityId: string,
      input: CRMReopenOpportunityInput,
    ): Promise<CRMOpportunityMutationResult> {
      if (input.organizationId !== organizationId) {
        return { status: "forbidden", message: "You do not have permission to reopen opportunities in this organization." };
      }
      const reason = input.reason.trim();
      if (!reason) {
        return { status: "validation-error", message: "A reason is required to reopen a terminal opportunity.", fieldErrors: { reason: "Reason is required." } };
      }
      const current = localCrmOpportunitiesStore.get(opportunityId);
      if (!current || current.organizationId !== organizationId || current.archivedAt) {
        return { status: "server-error", message: "The opportunity could not be found." };
      }
      if (current.updatedAt !== input.expectedUpdatedAt) {
        return { status: "conflict", message: "The opportunity changed before it could be reopened.", opportunity: toPipelineOpportunity(current) };
      }
      if (current.stageCode !== "won" && current.stageCode !== "lost") {
        return { status: "validation-error", message: "Only won or lost opportunities can be reopened.", fieldErrors: { stageCode: "The opportunity is not terminal." } };
      }
      const nextStage = input.stageCode ?? "prospecting";
      const updated = localCrmOpportunitiesStore.update(opportunityId, {
        stageCode: nextStage,
        probability: PIPELINE_STAGES.find((stage) => stage.code === nextStage)?.probability ?? null,
        lossReason: null,
      });
      if (!updated) return { status: "server-error", message: "The opportunity could not be reopened." };
      appendStageHistory(opportunityId, current.stageCode, nextStage, reason);
      return { status: "success", opportunity: toPipelineOpportunity(updated) };
    },

    async listPipelineStages(): Promise<CRMStageDefinition[]> {
      return PIPELINE_STAGES.map((stage) => ({ ...stage }));
    },

    async listOpportunityStageHistory(opportunityId: string): Promise<CRMOpportunityStageHistory[]> {
      return localCrmStageHistoryStore.list()
        .filter((entry) => entry.opportunityId === opportunityId)
        .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
    },

    async createOpportunityFromLead(
      leadId: string,
      input: CRMCreateOpportunityFromLeadInput,
    ): Promise<CRMOpportunityMutationResult> {
      if (input.organizationId !== organizationId) {
        return { status: "forbidden", message: "You do not have permission to convert leads in this organization." };
      }

      const productKey = normalizeProductKey(input.productKey ?? "");
      const fieldErrors: Record<string, string> = {};
      if (!productKey && !input.catalogItemId && !input.offerId && !input.variantId) {
        fieldErrors.productKey = "Product or interest is required.";
      }
      if (input.amount !== undefined && input.amount !== null && (!Number.isFinite(input.amount) || input.amount < 0)) {
        fieldErrors.amount = "Amount must be a non-negative number.";
      }
      if (Object.keys(fieldErrors).length) {
        return { status: "validation-error", message: "Check the conversion details and try again.", fieldErrors };
      }

      const catalogReference = input.catalogItemId || input.offerId || input.variantId || productKey
        ? await catalogAdapter.resolveReference({
          organizationId,
          reference: {
            catalogItemId: input.catalogItemId,
            offerId: input.offerId,
            variantId: input.variantId,
            productKey,
          },
        })
        : null;
      if ((input.catalogItemId || input.offerId || input.variantId) && !catalogReference) {
        return {
          status: "validation-error",
          message: "The selected catalog reference is not available.",
          fieldErrors: { productKey: "Select an active catalog item." },
        };
      }
      const resolvedProductKey = productKey || catalogReference?.item.key || "";

      const existing = localCrmOpportunitiesStore.list().find((opportunity) => (
        opportunity.organizationId === organizationId &&
        opportunity.leadId === leadId &&
        opportunity.origin === "lead_conversion" &&
        opportunity.productKey === resolvedProductKey
      ));
      if (existing) return { status: "success", opportunity: toPipelineOpportunity(existing) };
      const normalizedIdempotencyKey = input.idempotencyKey?.trim();
      if (normalizedIdempotencyKey) {
        const idempotencyConflict = localCrmOpportunitiesStore.list().find((opportunity) => (
          opportunity.organizationId === organizationId &&
          opportunity.origin === "lead_conversion" &&
          opportunity.idempotencyKey === normalizedIdempotencyKey &&
          (opportunity.leadId !== leadId || opportunity.productKey !== resolvedProductKey)
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
        name: input.name?.trim() || resolvedProductKey,
        contactId: lead.contactId,
        leadId,
        productKey: resolvedProductKey,
        catalogItemId: catalogReference?.item.id ?? input.catalogItemId ?? null,
        offerId: catalogReference?.offer?.id ?? input.offerId ?? null,
        variantId: catalogReference?.variant?.id ?? input.variantId ?? null,
        origin: "lead_conversion",
        idempotencyKey: normalizedIdempotencyKey ?? null,
        ownerId: null,
        ownerName: null,
        stageCode: "qualified",
        amount: input.amount ?? null,
        currency: input.currency?.trim() || null,
        probability: 0.4,
        expectedCloseDate: input.expectedCloseDate ?? null,
        lossReason: null,
        archivedAt: null,
      });
      if (!created) return { status: "server-error", message: "The opportunity could not be created." };

      localCrmOpportunityLinesStore.create({
        opportunityId: created.id,
        catalogItemId: created.catalogItemId,
        offerId: created.offerId,
        variantId: created.variantId,
        productKey: created.productKey,
        label: created.name,
        quantity: 1,
        unitAmount: created.amount,
        currency: created.currency,
        totalAmount: created.amount,
      });
      appendStageHistory(created.id, null, created.stageCode);

      if (lead.status === "qualified") {
        const converted = localCrmLeadsStore.update(leadId, { status: "converted" });
        if (!converted) return { status: "server-error", message: "The lead could not be converted." };
      }
      return { status: "success", opportunity: toPipelineOpportunity(created) };
    },

    async getCustomer360(contactId: string): Promise<Customer360View | null> {
      const contact = crmCustomersStore.get(contactId);
      let resolvedContact: CRMContact | null = contact ? toContact(contact) : null;

      if (!resolvedContact) {
        try {
          const { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, defaultWebAuthAdapter } = await import("@/loopdev/domains/platform/adapter/auth-supabase");
          const session = await defaultWebAuthAdapter.getSession();
          const headers: Record<string, string> = {
            apikey: DEFAULT_SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
          };
          if (session?.accessToken) {
            headers.Authorization = `Bearer ${session.accessToken}`;
          } else {
            headers.Authorization = `Bearer ${DEFAULT_SUPABASE_ANON_KEY}`;
          }
          const resp = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/crm_contacts?id=eq.${encodeURIComponent(contactId)}&select=*`, {
            method: "GET",
            headers,
          });
          if (resp.ok) {
            const rows = await resp.json();
            if (Array.isArray(rows) && rows.length > 0) {
              const row = rows[0];
              let firstName = (row.first_name || "").trim();
              let lastName = (row.last_name || "").trim() || null;
              if (!firstName && row.name) {
                const parts = row.name.trim().split(" ");
                firstName = parts[0] || "Contacto";
                lastName = parts.slice(1).join(" ") || null;
              }
              resolvedContact = {
                id: row.id,
                organizationId: row.organization_id || "80fce911-57c5-4a83-809f-78df6a3736f7",
                firstName: firstName || "Contacto",
                lastName,
                secondLastName: row.second_last_name || null,
                preferredName: row.preferred_name || null,
                email: row.email || null,
                secondaryEmail: row.secondary_email || null,
                phone: row.phone || null,
                secondaryPhone: row.secondary_phone || null,
                preferredChannel: row.preferred_channel || "email",
                preferredLanguage: row.preferred_language || "es",
                documentType: row.document_type || null,
                documentNumber: row.document_number || null,
                birthDate: row.birth_date || null,
                gender: row.gender || null,
                addressLine1: row.address_line1 || null,
                addressLine2: row.address_line2 || null,
                city: row.city || "",
                stateProvince: row.state_province || null,
                postalCode: row.postal_code || null,
                country: row.country || "",
                companyName: row.company_name || null,
                jobTitle: row.job_title || null,
                department: row.department || null,
                attributes: row.attributes || {},
                identityStatus: row.identity_status || "verified",
                createdAt: row.created_at || new Date().toISOString(),
                updatedAt: row.updated_at || new Date().toISOString(),
                archivedAt: row.archived_at || null,
              };
            }
          }
        } catch (err) {
          console.warn("Failed to fetch remote contact for Customer360:", err);
        }
      }

      if (!resolvedContact) return null;

      const leads = localCrmLeadsStore.list().filter((lead) => lead.contactId === contactId).map(toLead);
      const opportunities: CRMOpportunity[] = localCrmOpportunitiesStore.list()
        .filter((opportunity) => (opportunity.organizationId === organizationId || opportunity.organizationId === resolvedContact!.organizationId) && opportunity.contactId === contactId && !opportunity.archivedAt)
        .map((opportunity) => ({
          id: opportunity.id,
          organizationId: opportunity.organizationId,
          contactId: opportunity.contactId,
          leadId: opportunity.leadId,
          productKey: opportunity.productKey,
          catalogItemId: opportunity.catalogItemId ?? null,
          offerId: opportunity.offerId ?? null,
          variantId: opportunity.variantId ?? null,
          origin: opportunity.origin,
          name: opportunity.name,
          stageKey: opportunity.stageCode,
          amount: opportunity.amount,
          currency: opportunity.currency,
          expectedCloseAt: opportunity.expectedCloseDate,
          ownerId: opportunity.ownerId,
          ownerName: opportunity.ownerName,
          createdAt: opportunity.createdAt,
          updatedAt: opportunity.updatedAt,
          lines: localCrmOpportunityLinesStore.list()
            .filter((line) => line.opportunityId === opportunity.id)
            .map(toOpportunityLine),
        }));
      const tasks: CRMTask[] = [
        { id: "local-task-1", title: "Review renewal requirements", status: "open", priority: "high", dueAt: new Date().toISOString(), relationId: contactId },
        { id: "local-task-2", title: "Schedule technical follow-up", status: "open", priority: "medium", dueAt: new Date(Date.now() + 86400000).toISOString(), relationId: contactId },
      ];
      const contactNameLabel = [resolvedContact.preferredName || resolvedContact.firstName, resolvedContact.lastName].filter(Boolean).join(" ");
      const relation = { type: "contact" as const, id: contactId, label: contactNameLabel };
      const legacyCreatedAt = localActivities[2]?.occurredAt ?? resolvedContact.updatedAt;
      // Import legacy CRM data into the global adapter before reading Customer 360 notes.
      await localNotesAdapter.seed([legacyCustomerNote(contactId, contactNameLabel, legacyCreatedAt)]);
      const notes = await localNotesAdapter.list(relation);
      const state = { profile: "fresh", leads: "fresh", opportunities: "fresh", tasks: "fresh", notes: "fresh", timeline: "fresh" } as const;

      return {
        contact: resolvedContact,
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
    async listCustomerProducts(contactId: string): Promise<CRMCustomerProduct[]> {
      return localCustomerProductsStore.list().filter((item) => item.organizationId === organizationId && item.contactId === contactId);
    },
    async createCustomerProduct(input: CRMCreateCustomerProductInput): Promise<CRMCustomerProduct> {
      if (input.organizationId !== organizationId) throw new CRMAdapterError("The active CRM scope is not available.", "server-error");
      if (!crmCustomersStore.get(input.contactId)) throw new CRMAdapterError("Contact not found.", "server-error");
      if (input.quantity <= 0) throw new CRMAdapterError("Quantity must be greater than zero.", "server-error");
      const now = new Date().toISOString();
      return localCustomerProductsStore.create({
        ...input,
        offerId: input.offerId ?? null,
        variantId: input.variantId ?? null,
        unitAmount: input.unitAmount ?? null,
        totalAmount: input.totalAmount ?? null,
        currency: input.currency ?? null,
        associatedAt: input.associatedAt ?? now,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        sourceOpportunityId: input.sourceOpportunityId ?? null,
        sourceLeadId: input.sourceLeadId ?? null,
      });
    },
  },
} as const;
