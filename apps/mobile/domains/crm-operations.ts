export type CRMEntityType = "contact" | "lead" | "opportunity";
export type CRMVisibility = "private" | "workspace" | "organization";
export type CRMFieldType = "text" | "number" | "date" | "boolean" | "select";
export type CRMOperationsPermission = string;

export interface CRMOperationsContext {
  organizationId: string;
  workspaceId: string;
  permissions: CRMOperationsPermission[];
  userId: string;
}

export interface CRMFilter {
  field: string;
  operator: "equals" | "contains" | "in" | "is_empty" | "not_empty";
  value?: string | string[];
}

export interface CRMExportInput extends CRMOperationsContext {
  entityType: "contact";
  query?: string;
  filters?: CRMFilter[];
}

export interface CRMTag extends CRMOperationsContext {
  id: string;
  name: string;
  slug: string;
  color: string;
  visibility: CRMVisibility;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMSavedView extends CRMOperationsContext {
  id: string;
  name: string;
  entityType: CRMEntityType;
  filters: CRMFilter[];
  columns: string[];
  visibility: CRMVisibility;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMCustomFieldDefinition extends CRMOperationsContext {
  id: string;
  entityType: CRMEntityType;
  key: string;
  label: string;
  type: CRMFieldType;
  required: boolean;
  visibility: CRMVisibility;
  ownerId: string;
  options: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CRMCustomFieldValue extends CRMOperationsContext {
  id: string;
  definitionId: string;
  entityType: CRMEntityType;
  entityId: string;
  value: string | number | boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface CRMSearchResult {
  id: string;
  entityType: CRMEntityType;
  title: string;
  subtitle: string;
  matchedFields: string[];
  tags: CRMTag[];
}

export interface CRMImportResult {
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  invalidRows: number;
  results: Array<{ rowNumber: number; status: "imported" | "duplicate" | "invalid" | "skipped"; message: string; values: Record<string, string> }>;
}

export const CRM_LOCAL_CONTEXT: CRMOperationsContext = {
  organizationId: "local-development-organization",
  workspaceId: "local-development-workspace",
  userId: "local-development-user",
  permissions: ["crm.search", "crm.tags.write", "crm.fields.write", "crm.export"],
};

const tags: CRMTag[] = [];
const customFields: CRMCustomFieldDefinition[] = [];

export const mobileCrmOperationsAdapter = {
  async search(input: { query: string; entityTypes?: CRMEntityType[]; filters?: CRMFilter[] }): Promise<CRMSearchResult[]> {
    const query = input.query.trim().toLowerCase();
    if (!query) return [];
    return [];
  },
  async listSavedViews(_context: CRMOperationsContext, _entityType?: CRMEntityType): Promise<CRMSavedView[]> { return []; },
  async createSavedView(context: CRMOperationsContext, input: Pick<CRMSavedView, "name" | "entityType" | "filters" | "columns" | "visibility">) {
    const timestamp = new Date().toISOString();
    return { ...context, ...input, id: `mobile-view-${Date.now()}`, ownerId: context.userId, createdAt: timestamp, updatedAt: timestamp };
  },
  async listTags(_context: CRMOperationsContext): Promise<CRMTag[]> { return [...tags]; },
  async listCustomFieldDefinitions(_context: CRMOperationsContext, entityType?: CRMEntityType) {
    return customFields.filter((field) => !entityType || field.entityType === entityType);
  },
  async createTag(context: CRMOperationsContext, input: Pick<CRMTag, "name" | "color" | "visibility">) {
    const timestamp = new Date().toISOString();
    const tag: CRMTag = { ...context, ...input, id: `mobile-tag-${Date.now()}`, name: input.name.trim(), slug: input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"), ownerId: context.userId, createdAt: timestamp, updatedAt: timestamp };
    tags.push(tag);
    return tag;
  },
  async createCustomFieldDefinition(context: CRMOperationsContext, input: Pick<CRMCustomFieldDefinition, "entityType" | "key" | "label" | "type" | "required" | "visibility" | "options">) {
    const timestamp = new Date().toISOString();
    const field: CRMCustomFieldDefinition = { ...context, ...input, id: `mobile-field-${Date.now()}`, ownerId: context.userId, active: true, createdAt: timestamp, updatedAt: timestamp };
    customFields.push(field);
    return field;
  },
  async bulkUpdateEntityTags(_input: { entityType: CRMEntityType; entityIds: string[]; tagId: string; operation: "add" | "remove" }) { return { updated: 0 }; },
  async exportCsv(_input: CRMExportInput) { return "id,name,email,phone\r\n"; },
  async deleteSavedView(_context: CRMOperationsContext, _id: string) { return false; },
  async updateTag(_context: CRMOperationsContext, _id: string, _patch: Partial<Pick<CRMTag, "name" | "color" | "visibility">>): Promise<CRMTag | null> { return null; },
  async updateCustomFieldDefinition(_context: CRMOperationsContext, _id: string, _patch: Partial<Pick<CRMCustomFieldDefinition, "label" | "required" | "options" | "active">>): Promise<CRMCustomFieldDefinition | null> { return null; },
  async setCustomFieldValue(input: { entityType: CRMEntityType; entityId: string; definitionId: string; value: CRMCustomFieldValue["value"] }) { return input; },
  async listCustomFieldValues(_context: CRMOperationsContext, _entityType: CRMEntityType, _entityId: string) { return []; },
  async importContacts(_input: { csv: string; mode: "validate" | "commit"; deduplicateBy: "email" | "phone" | "email_or_phone" } & CRMOperationsContext): Promise<CRMImportResult> { return { totalRows: 0, importedRows: 0, duplicateRows: 0, invalidRows: 0, results: [] }; },
};
