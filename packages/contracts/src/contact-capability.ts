import { contactActions } from "./contact-actions";
import { contactFormSections } from "./contact-form";
import { loopdevNavigationContract } from "./navigation";

/**
 * Machine-readable semantic contract consumed by all Contacts renderers.
 * Keep layout and platform composition out of this object.
 */
export const contactsCapabilityContract = {
  id: "crm.contacts",
  version: "1.0.0",
  owner: "CRM Platform",
  actions: contactActions,
  states: ["loading", "empty", "error", "forbidden", "conflict", "offline", "pending", "success"],
  labels: contactActions.map(({ id, label }) => ({ id, label })),
  validation: {
    formSections: contactFormSections.map(({ id, fields }) => ({
      id,
      fields: fields.map(({ id: fieldId, required, type }) => ({ id: fieldId, required, type })),
    })),
    requiredGroups: ["email-or-phone"],
  },
  navigation: {
    list: "/app/sales-crm/contacts",
    create: "/app/sales-crm/contacts/new",
    detail: "/app/sales-crm/contacts/:contactId",
    sharedContract: "packages/contracts/src/navigation.ts",
    navigationId: loopdevNavigationContract.groups
      .flatMap((group) => group.items)
      .find((item) => item.path === "/app/sales-crm/contacts")?.id ?? "crm-contacts",
  },
  permissions: ["crm.contacts.read", "crm.contacts.write"],
} as const;
