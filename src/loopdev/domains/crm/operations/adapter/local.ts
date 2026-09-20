import { crmCustomersStore } from "@/loopdev/domains/crm/data/localCustomers";
import { localCrmLeadsStore } from "@/loopdev/domains/crm/data/localLeads";
import { localCrmOpportunitiesStore } from "@/loopdev/domains/crm/data/localOpportunities";
import { contactName, type CRMContact } from "@/loopdev/domains/crm/adapter/types";
import {
  crmCustomFieldDefinitionsStore,
  crmCustomFieldValuesStore,
  crmEntityTagsStore,
  crmSavedViewsStore,
  crmTagsStore,
} from "../data/localOperations";
import type {
  CRMCustomFieldDefinition,
  CRMCustomFieldValue,
  CRMEntityType,
  CRMExportInput,
  CRMFilter,
  CRMImportInput,
  CRMImportResult,
  CRMImportRowResult,
  CRMOperationsAdapter,
  CRMOperationsContext,
  CRMSearchInput,
  CRMSearchResult,
  CRMSavedView,
  CRMTag,
} from "../types";
import { canAccess, isVisible } from "../types";

const organizationId = "local-development-organization";
const workspaceId = "local-development-workspace";
const userId = "local-development-user";

function assertScope(context: CRMOperationsContext, permission: Parameters<typeof canAccess>[1]) {
  if (context.organizationId !== organizationId || context.workspaceId !== workspaceId) {
    throw new Error("This CRM operation is not available for the selected organization or workspace.");
  }
  if (!canAccess(context, permission)) throw new Error("You do not have permission to perform this CRM operation.");
}

function visibleScope<T extends { organizationId: string; workspaceId: string; visibility: "private" | "workspace" | "organization"; ownerId: string }>(
  items: T[],
  context: CRMOperationsContext,
): T[] {
  return items.filter((item) =>
    item.organizationId === context.organizationId
    && item.workspaceId === context.workspaceId
    && isVisible(item.visibility, item.ownerId, context));
}

function toContact(customer: ReturnType<typeof crmCustomersStore.list>[number]): CRMContact {
  const [firstName, ...lastNameParts] = customer.name.split(" ");
  return {
    id: customer.id,
    organizationId,
    firstName,
    lastName: lastNameParts.join(" ") || null,
    secondLastName: customer.secondLastName ?? null,
    preferredName: customer.preferredName ?? null,
    email: customer.email || null,
    secondaryEmail: customer.secondaryEmail ?? null,
    phone: customer.phone || null,
    secondaryPhone: customer.secondaryPhone ?? null,
    preferredChannel: customer.preferredChannel ?? "email",
    preferredLanguage: customer.preferredLanguage ?? null,
    documentType: customer.documentType ?? null,
    documentNumber: customer.documentNumber ?? null,
    birthDate: customer.birthDate ?? null,
    gender: customer.gender ?? null,
    addressLine1: customer.addressLine1 ?? null,
    addressLine2: customer.addressLine2 ?? null,
    city: customer.city,
    stateProvince: customer.stateProvince ?? null,
    postalCode: customer.postalCode ?? null,
    country: customer.country,
    companyName: customer.companyName ?? null,
    jobTitle: customer.jobTitle ?? null,
    department: customer.department ?? null,
    attributes: {},
    identityStatus: "verified",
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    archivedAt: customer.archivedAt ?? null,
  };
}

function matchesFilters(item: Record<string, unknown>, filters: CRMFilter[] = []): boolean {
  return filters.every((filter) => {
    const actual = item[filter.field];
    if (filter.operator === "is_empty") return actual === undefined || actual === null || actual === "";
    if (filter.operator === "not_empty") return actual !== undefined && actual !== null && actual !== "";
    const values = Array.isArray(filter.value) ? filter.value : [filter.value ?? ""];
    if (filter.operator === "in") return values.includes(String(actual ?? ""));
    if (filter.operator === "equals") return String(actual ?? "").toLowerCase() === String(values[0]).toLowerCase();
    return String(actual ?? "").toLowerCase().includes(String(values[0]).toLowerCase());
  });
}

function parseCsv(csv: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    if (char === '"' && quoted && csv[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell.trim());
    if (row.some((value) => value !== "")) rows.push(row);
  }
  const headers = (rows.shift() ?? []).map((header) => header.trim().toLowerCase());
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function csvEscape(value: unknown): string {
  const stringValue = String(value ?? "");
  return /[",\r\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, "\"\"")}"` : stringValue;
}

function entityTagRows(context: CRMOperationsContext, entityType: CRMEntityType, entityIds?: string[]) {
  return crmEntityTagsStore.list().filter((item) =>
    item.organizationId === context.organizationId
    && item.workspaceId === context.workspaceId
    && item.entityType === entityType
    && (!entityIds || entityIds.includes(item.entityId)));
}

function validateCustomFieldValue(definition: CRMCustomFieldDefinition, value: CRMCustomFieldValue["value"]) {
    if (definition.required && (value === null || value === "")) throw new Error(`${definition.label} is required.`);
    if (value === null || value === "") return;
    if (definition.type === "text" && typeof value !== "string") throw new Error(`${definition.label} must be text.`);
    if (definition.type === "number" && (typeof value !== "number" || !Number.isFinite(value))) throw new Error(`${definition.label} must be a valid number.`);
    if (definition.type === "boolean" && typeof value !== "boolean") throw new Error(`${definition.label} must be true or false.`);
    if (definition.type === "date" && (typeof value !== "string" || Number.isNaN(Date.parse(value)))) throw new Error(`${definition.label} must be a valid date.`);
    if (definition.type === "select" && (typeof value !== "string" || !definition.options.includes(value))) {
      throw new Error(`${definition.label} must match one of the configured options.`);
    }
}

export const localCrmOperationsAdapter: CRMOperationsAdapter = {
  async search(input: CRMSearchInput): Promise<CRMSearchResult[]> {
    assertScope(input, "crm.search");
    const query = input.query.trim().toLowerCase();
    const types = input.entityTypes?.length ? input.entityTypes : ["contact", "lead", "opportunity"];
    const results: CRMSearchResult[] = [];
    const tags = visibleScope(crmTagsStore.list(), input);
    if (types.includes("contact")) {
      crmCustomersStore.list().filter((customer) => !customer.archivedAt).forEach((customer) => {
        const contact = toContact(customer);
        const fields: Record<string, string> = {
          name: contactName(contact),
          email: contact.email ?? "",
          phone: contact.phone ?? "",
          company: contact.companyName ?? "",
          city: contact.city ?? "",
        };
        if ((!query || Object.values(fields).some((value) => value.toLowerCase().includes(query))) && matchesFilters(fields, input.filters)) {
          const entityTags = entityTagRows(input, "contact", [contact.id]).map((item) => tags.find((tag) => tag.id === item.tagId)).filter((tag): tag is CRMTag => Boolean(tag));
          results.push({ id: contact.id, entityType: "contact", title: contactName(contact), subtitle: contact.companyName ?? contact.email ?? "Contact", matchedFields: Object.keys(fields).filter((key) => fields[key].toLowerCase().includes(query)), tags: entityTags });
        }
      });
    }
    if (types.includes("lead")) {
      localCrmLeadsStore.list().forEach((lead) => {
        const contact = crmCustomersStore.get(lead.contactId);
        const fields: Record<string, string> = { interest: lead.interest ?? "", source: lead.source ?? "", status: lead.status, owner: lead.ownerName ?? "" };
        if ((!query || Object.values(fields).some((value) => value.toLowerCase().includes(query))) && matchesFilters(fields, input.filters)) {
          results.push({ id: lead.id, entityType: "lead", title: lead.interest ?? "Untitled lead", subtitle: contact ? contact.name : lead.status, matchedFields: Object.keys(fields).filter((key) => fields[key].toLowerCase().includes(query)), tags: [] });
        }
      });
    }
    if (types.includes("opportunity")) {
      localCrmOpportunitiesStore.list().filter((opportunity) => !opportunity.archivedAt).forEach((opportunity) => {
        const contact = crmCustomersStore.get(opportunity.contactId);
        const fields: Record<string, string> = { name: opportunity.name, stage: opportunity.stageCode, owner: opportunity.ownerName ?? "", amount: String(opportunity.amount ?? "") };
        if ((!query || Object.values(fields).some((value) => value.toLowerCase().includes(query))) && matchesFilters(fields, input.filters)) {
          results.push({ id: opportunity.id, entityType: "opportunity", title: opportunity.name, subtitle: contact?.name ?? opportunity.stageCode, matchedFields: Object.keys(fields).filter((key) => fields[key].toLowerCase().includes(query)), tags: [] });
        }
      });
    }
    return results.slice(0, input.limit ?? 50);
  },

  async listSavedViews(context, entityType) {
    assertScope(context, "crm.views.read");
    return visibleScope(crmSavedViewsStore.list(), context).filter((view) => !entityType || view.entityType === entityType);
  },

  async createSavedView(context, input) {
    assertScope(context, "crm.views.write");
    return crmSavedViewsStore.create({ ...input, organizationId: context.organizationId, workspaceId: context.workspaceId, ownerId: context.userId });
  },

  async deleteSavedView(context, id) {
    assertScope(context, "crm.views.write");
    const view = crmSavedViewsStore.get(id);
    if (!view || view.organizationId !== context.organizationId || view.workspaceId !== context.workspaceId || view.ownerId !== context.userId) return false;
    return crmSavedViewsStore.remove(id);
  },

  async listTags(context) {
    assertScope(context, "crm.tags.read");
    return visibleScope(crmTagsStore.list(), context);
  },

  async createTag(context, input) {
    assertScope(context, "crm.tags.write");
    const name = input.name.trim();
    if (!name) throw new Error("Tag name is required.");
    return crmTagsStore.create({ ...input, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), organizationId: context.organizationId, workspaceId: context.workspaceId, ownerId: context.userId });
  },

  async updateTag(context, id, patch) {
    assertScope(context, "crm.tags.write");
    const tag = crmTagsStore.get(id);
    if (!tag || tag.organizationId !== context.organizationId || tag.workspaceId !== context.workspaceId || tag.ownerId !== context.userId) return null;
    return crmTagsStore.update(id, { ...patch, ...(patch.name ? { slug: patch.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") } : {}) }) ?? null;
  },

  async listEntityTags(context, entityType, entityIds) {
    assertScope(context, "crm.tags.read");
    return entityTagRows(context, entityType, entityIds);
  },

  async bulkUpdateEntityTags(input) {
    assertScope(input, "crm.tags.write");
    const tag = crmTagsStore.get(input.tagId);
    if (!tag || tag.organizationId !== input.organizationId) throw new Error("The selected tag is not available.");
    let updated = 0;
    input.entityIds.forEach((entityId) => {
      const existing = entityTagRows(input, input.entityType, [entityId]).find((item) => item.tagId === input.tagId);
      if (input.operation === "add" && !existing) {
        crmEntityTagsStore.create({ organizationId: input.organizationId, workspaceId: input.workspaceId, entityType: input.entityType, entityId, tagId: input.tagId });
        updated += 1;
      } else if (input.operation === "remove" && existing && crmEntityTagsStore.remove(existing.id)) updated += 1;
    });
    return { updated };
  },

  async listCustomFieldDefinitions(context, entityType) {
    assertScope(context, "crm.fields.read");
    return visibleScope(crmCustomFieldDefinitionsStore.list(), context).filter((field) => field.active && (!entityType || field.entityType === entityType));
  },

  async createCustomFieldDefinition(context, input) {
    assertScope(context, "crm.fields.write");
    if (!input.key.trim() || !input.label.trim()) throw new Error("Field key and label are required.");
    const duplicate = crmCustomFieldDefinitionsStore.list().some((field) => field.organizationId === context.organizationId && field.entityType === input.entityType && field.key === input.key.trim());
    if (duplicate) throw new Error("A field with this key already exists for the entity.");
    return crmCustomFieldDefinitionsStore.create({ ...input, key: input.key.trim(), label: input.label.trim(), organizationId: context.organizationId, workspaceId: context.workspaceId, ownerId: context.userId, active: true });
  },

  async updateCustomFieldDefinition(context, id, patch) {
    assertScope(context, "crm.fields.write");
    const field = crmCustomFieldDefinitionsStore.get(id);
    if (!field || field.organizationId !== context.organizationId || field.workspaceId !== context.workspaceId || field.ownerId !== context.userId) return null;
    return crmCustomFieldDefinitionsStore.update(id, patch) ?? null;
  },

  async listCustomFieldValues(context, entityType, entityId) {
    assertScope(context, "crm.fields.read");
    return crmCustomFieldValuesStore.list().filter((value) => value.organizationId === context.organizationId && value.workspaceId === context.workspaceId && value.entityType === entityType && value.entityId === entityId);
  },

  async setCustomFieldValue(input) {
    assertScope(input, "crm.fields.write");
    const definition = crmCustomFieldDefinitionsStore.get(input.definitionId);
    if (!definition
      || definition.organizationId !== input.organizationId
      || definition.workspaceId !== input.workspaceId
      || definition.entityType !== input.entityType
      || !isVisible(definition.visibility, definition.ownerId, input)) {
      throw new Error("The custom field is not available for this entity.");
    }
    validateCustomFieldValue(definition, input.value);
    const existing = crmCustomFieldValuesStore.list().find((value) => value.definitionId === input.definitionId && value.entityId === input.entityId);
    if (existing) return crmCustomFieldValuesStore.update(existing.id, { value: input.value })!;
    return crmCustomFieldValuesStore.create({ organizationId: input.organizationId, workspaceId: input.workspaceId, definitionId: input.definitionId, entityType: input.entityType, entityId: input.entityId, value: input.value });
  },

  async importContacts(input: CRMImportInput): Promise<CRMImportResult> {
    assertScope(input, "crm.import");
    const rows = parseCsv(input.csv);
    const existing = crmCustomersStore.list();
    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();
    const required = crmCustomFieldDefinitionsStore.list().filter((field) => field.entityType === "contact" && field.required && field.active).map((field) => field.key);
    const results: CRMImportRowResult[] = rows.map((row, index) => {
      const email = row.email?.trim().toLowerCase() ?? "";
      const phone = row.phone?.trim() ?? "";
      const missing: string[] = [];
      if (!row.name?.trim()) missing.push("name");
      if (!email && !phone) missing.push("email or phone");
      required.forEach((field) => { if (!row[field]?.trim()) missing.push(field); });
      if (missing.length) return { rowNumber: index + 2, status: "invalid", message: `Missing ${missing.join(", ")}.`, values: row };
      const duplicateExisting = existing.some((item) => (
        (input.deduplicateBy !== "phone" && email && item.email.toLowerCase() === email)
        || (input.deduplicateBy !== "email" && phone && item.phone === phone)
      ));
      const duplicateInBatch = (
        (input.deduplicateBy !== "phone" && email && seenEmails.has(email))
        || (input.deduplicateBy !== "email" && phone && seenPhones.has(phone))
      );
      const duplicate = duplicateExisting || duplicateInBatch;
      if (duplicate) return { rowNumber: index + 2, status: "duplicate", message: "A matching contact already exists in this workspace.", values: row };
      if (email) seenEmails.add(email);
      if (phone) seenPhones.add(phone);
      if (input.mode === "validate") return { rowNumber: index + 2, status: "skipped", message: "Valid row; not committed in validation mode.", values: row };
      const created = crmCustomersStore.create({ name: row.name.trim(), email, phone, country: row.country?.trim() ?? "", city: row.city?.trim() ?? "", companyName: row.company?.trim() || null, ordersCount: 0, tier: "standard" });
      return { rowNumber: index + 2, status: "imported", message: "Contact imported.", contactId: created.id, values: row };
    });
    return {
      totalRows: rows.length,
      importedRows: results.filter((row) => row.status === "imported").length,
      duplicateRows: results.filter((row) => row.status === "duplicate").length,
      invalidRows: results.filter((row) => row.status === "invalid").length,
      results,
    };
  },

  async exportCsv(input: CRMExportInput): Promise<string> {
    assertScope(input, "crm.export");
    const query = input.query?.trim().toLowerCase() ?? "";
    const contacts = crmCustomersStore.list().map(toContact).filter((contact) =>
      !contact.archivedAt
      && (!query || [contactName(contact), contact.email, contact.phone, contact.companyName].filter(Boolean).some((value) => value!.toLowerCase().includes(query)))
      && matchesFilters(contact as unknown as Record<string, unknown>, input.filters));
    const headers = ["id", "name", "email", "phone", "company", "city", "country"];
    return [headers.join(","), ...contacts.map((contact) => [contact.id, contactName(contact), contact.email, contact.phone, contact.companyName, contact.city, contact.country].map(csvEscape).join(","))].join("\r\n");
  },
};

export { workspaceId };
