import { contactActions } from "./contact-actions";
import { contactFormSections } from "./contact-form";
import { loopdevNavigationContract } from "./navigation";

export const contactNavigationRoutes = {
  list: "/app/sales-crm/contacts",
  create: "/app/sales-crm/contacts/new",
  detail: "/app/sales-crm/contacts/:contactId",
  edit: "/app/sales-crm/contacts/:contactId/edit",
  duplicates: "/app/sales-crm/contacts/:contactId/duplicates",
} as const;

export function matchContactRoute(template: string, path: string): Record<string, string> | null {
  const parameterNames: string[] = [];
  const pattern = template.split("/").map((segment) => {
    if (!segment.startsWith(":")) return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    parameterNames.push(segment.slice(1));
    return "([^/]+)";
  }).join("/");
  const match = path.match(new RegExp(`^${pattern}$`));
  return match ? Object.fromEntries(parameterNames.map((name, index) => [name, decodeURIComponent(match[index + 1])])) : null;
}

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
    ...contactNavigationRoutes,
    sharedContract: "packages/contracts/src/navigation.ts",
    navigationId: loopdevNavigationContract.groups
      .flatMap((group) => group.items)
      .find((item) => item.path === "/app/sales-crm/contacts")?.id ?? "crm-contacts",
  },
  customer360: {
    sections: ["contact", "sales", "work", "documents", "products", "activity"],
    operations: [
      "navigateLead", "navigateOpportunity", "navigateTask",
      "createNote", "editNote", "deleteNote",
      "uploadDocument", "previewDocument", "deleteDocument",
      "associateProduct", "viewCatalog", "navigateActivity",
    ],
    parity: {
      domain: "shared-contact-port",
      renderer: "platform-specific",
      operations: "must-be-declared-per-platform",
    },
  },
  permissions: ["crm.contacts.read", "crm.contacts.write"],
  platforms: {
    desktop_web: { required: true, renderer: "data-table-and-drawer", navigation: "router-link" },
    mobile_web: { required: true, renderer: "card-list-and-full-screen-form", navigation: "stack-and-action-sheet" },
    ios: { required: false, renderer: "planned", navigation: "native-stack" },
    android: { required: false, renderer: "planned", navigation: "native-stack" },
  },
} as const;
