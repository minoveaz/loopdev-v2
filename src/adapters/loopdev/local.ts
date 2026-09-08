import { customersStore } from "@/data";
import type { Customer } from "@/types";
import type { Customer360View, CRMContact, CRMActivity, CRMLead, CRMNote, CRMOpportunity, CRMTask } from "./types";

const organizationId = "local-development-organization";

function toContact(source: Customer): CRMContact {
  const [firstName, ...lastNameParts] = source.name.split(" ");
  return {
    id: source.id,
    organizationId,
    firstName,
    lastName: lastNameParts.join(" ") || null,
    secondLastName: null,
    preferredName: null,
    email: source.email,
    secondaryEmail: null,
    phone: source.phone,
    secondaryPhone: null,
    preferredChannel: "email",
    preferredLanguage: null,
    documentType: null,
    documentNumber: null,
    birthDate: null,
    gender: null,
    addressLine1: null,
    addressLine2: null,
    city: source.city,
    stateProvince: null,
    postalCode: null,
    country: source.country,
    companyName: null,
    jobTitle: null,
    department: null,
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

export const localLoopdevAdapter = {
  crm: {
    async listContacts(): Promise<CRMContact[]> {
      return customersStore.list().map(toContact);
    },

    async getCustomer360(contactId: string): Promise<Customer360View | null> {
      const contact = customersStore.get(contactId);
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
