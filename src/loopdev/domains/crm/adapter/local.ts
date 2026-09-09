import { crmCustomersStore, type LocalCustomer } from "../data/localCustomers";
import type {
  Customer360View,
  CRMContact,
  CRMContactMutationResult,
  CRMActivity,
  CRMContactListParams,
  CRMContactPage,
  CRMCreateContactInput,
  CRMLead,
  CRMNote,
  CRMOpportunity,
  CRMTask,
  CRMUpdateContactPatch,
} from "./types";
import { contactName } from "./types";

const organizationId = "local-development-organization";

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
    documentType: null,
    documentNumber: null,
    birthDate: null,
    gender: null,
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
  };
}

const localActivities: CRMActivity[] = [
  { id: "local-activity-1", sourceType: "email", sourceId: "local-email-1", type: "email", summary: "Proposal follow-up sent", occurredAt: new Date().toISOString() },
  { id: "local-activity-2", sourceType: "meeting", sourceId: "local-meeting-1", type: "meeting", summary: "Quarterly review scheduled", occurredAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "local-activity-3", sourceType: "note", sourceId: "local-note-1", type: "note", summary: "Relationship note added", occurredAt: new Date(Date.now() - 3 * 86400000).toISOString() },
];

function toLead(contact: LocalCustomer): CRMLead {
  return {
    id: `local-lead-${contact.id}`,
    contactId: contact.id,
    status: contact.tier === "lead" ? "qualified" : "new",
    interest: contact.tier === "lead" ? "Enterprise expansion" : "General interest",
    source: "local",
    createdAt: contact.createdAt,
  };
}

export const localLoopdevAdapter = {
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
      const filtered = crmCustomersStore.list().map(toContact).filter((contact) => {
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

    async listLeads(): Promise<CRMLead[]> {
      return crmCustomersStore.list().map(toLead);
    },

    async getCustomer360(contactId: string): Promise<Customer360View | null> {
      const contact = crmCustomersStore.get(contactId);
      if (!contact) return null;

      const leads: CRMLead[] = [{ id: "local-lead-1", contactId, status: "qualified", interest: "Enterprise expansion", source: "local", createdAt: contact.createdAt }];
      const opportunities: CRMOpportunity[] = [
        { id: "local-opportunity-1", contactId, name: "Enterprise expansion", stageKey: "proposal", amount: 48000, currency: "EUR", expectedCloseAt: null },
        { id: "local-opportunity-2", contactId, name: "Annual plan renewal", stageKey: "qualified", amount: 14500, currency: "EUR", expectedCloseAt: null },
      ];
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
