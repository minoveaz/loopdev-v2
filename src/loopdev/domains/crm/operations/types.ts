import type { CRMContact } from "@/loopdev/domains/crm/adapter/types";

export type CRMEntityType = "contact" | "lead" | "opportunity";
export type CRMVisibility = "private" | "workspace" | "organization";
export type CRMFieldType = "text" | "number" | "date" | "boolean" | "select";
export type CRMOperationsPermission =
  | "crm.search"
  | "crm.views.read"
  | "crm.views.write"
  | "crm.tags.read"
  | "crm.tags.write"
  | "crm.fields.read"
  | "crm.fields.write"
  | "crm.import"
  | "crm.export";

export interface CRMOperationsScope {
  organizationId: string;
  workspaceId: string;
}

export interface CRMOperationsContext extends CRMOperationsScope {
  permissions: CRMOperationsPermission[];
  userId: string;
}

export interface CRMFilter {
  field: string;
  operator: "equals" | "contains" | "in" | "is_empty" | "not_empty";
  value?: string | string[];
}

export interface CRMSearchInput extends CRMOperationsContext {
  query: string;
  entityTypes?: CRMEntityType[];
  filters?: CRMFilter[];
  limit?: number;
}

export interface CRMSearchResult {
  id: string;
  entityType: CRMEntityType;
  title: string;
  subtitle: string;
  matchedFields: string[];
  tags: CRMTag[];
}

export interface CRMSavedView extends CRMOperationsScope {
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

export interface CRMTag extends CRMOperationsScope {
  id: string;
  name: string;
  slug: string;
  color: string;
  visibility: CRMVisibility;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMEntityTag extends CRMOperationsScope {
  id: string;
  entityType: CRMEntityType;
  entityId: string;
  tagId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMCustomFieldDefinition extends CRMOperationsScope {
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

export interface CRMCustomFieldValue extends CRMOperationsScope {
  id: string;
  definitionId: string;
  entityType: CRMEntityType;
  entityId: string;
  value: string | number | boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface CRMImportRowResult {
  rowNumber: number;
  status: "imported" | "duplicate" | "invalid" | "skipped";
  message: string;
  contactId?: string;
  values: Record<string, string>;
}

export interface CRMImportResult {
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  invalidRows: number;
  results: CRMImportRowResult[];
}

export interface CRMImportInput extends CRMOperationsContext {
  csv: string;
  mode: "validate" | "commit";
  deduplicateBy: "email" | "phone" | "email_or_phone";
}

export interface CRMExportInput extends CRMOperationsContext {
  entityType: "contact";
  query?: string;
  filters?: CRMFilter[];
}

export interface CRMBulkTagInput extends CRMOperationsContext {
  entityType: CRMEntityType;
  entityIds: string[];
  tagId: string;
  operation: "add" | "remove";
}

export interface CRMCustomFieldValueInput extends CRMOperationsContext {
  entityType: CRMEntityType;
  entityId: string;
  definitionId: string;
  value: CRMCustomFieldValue["value"];
}

export interface CRMOperationsAdapter {
  search(input: CRMSearchInput): Promise<CRMSearchResult[]>;
  listSavedViews(context: CRMOperationsContext, entityType?: CRMEntityType): Promise<CRMSavedView[]>;
  createSavedView(context: CRMOperationsContext, input: Pick<CRMSavedView, "name" | "entityType" | "filters" | "columns" | "visibility">): Promise<CRMSavedView>;
  deleteSavedView(context: CRMOperationsContext, id: string): Promise<boolean>;
  listTags(context: CRMOperationsContext): Promise<CRMTag[]>;
  createTag(context: CRMOperationsContext, input: Pick<CRMTag, "name" | "color" | "visibility">): Promise<CRMTag>;
  updateTag(context: CRMOperationsContext, id: string, patch: Partial<Pick<CRMTag, "name" | "color" | "visibility">>): Promise<CRMTag | null>;
  listEntityTags(context: CRMOperationsContext, entityType: CRMEntityType, entityIds?: string[]): Promise<CRMEntityTag[]>;
  bulkUpdateEntityTags(input: CRMBulkTagInput): Promise<{ updated: number }>;
  listCustomFieldDefinitions(context: CRMOperationsContext, entityType?: CRMEntityType): Promise<CRMCustomFieldDefinition[]>;
  createCustomFieldDefinition(context: CRMOperationsContext, input: Pick<CRMCustomFieldDefinition, "entityType" | "key" | "label" | "type" | "required" | "visibility" | "options">): Promise<CRMCustomFieldDefinition>;
  updateCustomFieldDefinition(context: CRMOperationsContext, id: string, patch: Partial<Pick<CRMCustomFieldDefinition, "label" | "required" | "visibility" | "options" | "active">>): Promise<CRMCustomFieldDefinition | null>;
  listCustomFieldValues(context: CRMOperationsContext, entityType: CRMEntityType, entityId: string): Promise<CRMCustomFieldValue[]>;
  setCustomFieldValue(input: CRMCustomFieldValueInput): Promise<CRMCustomFieldValue>;
  importContacts(input: CRMImportInput): Promise<CRMImportResult>;
  exportCsv(input: CRMExportInput): Promise<string>;
}

export const CRM_LOCAL_CONTEXT: CRMOperationsContext = {
  organizationId: "local-development-organization",
  workspaceId: "local-development-workspace",
  userId: "local-development-user",
  permissions: [
    "crm.search", "crm.views.read", "crm.views.write", "crm.tags.read",
    "crm.tags.write", "crm.fields.read", "crm.fields.write", "crm.import", "crm.export",
  ],
};

export function canAccess(
  context: CRMOperationsContext,
  permission: CRMOperationsPermission,
): boolean {
  return context.permissions.includes(permission);
}

export function isVisible(
  visibility: CRMVisibility,
  ownerId: string,
  context: CRMOperationsContext,
): boolean {
  return visibility === "organization"
    || (visibility === "workspace" && context.workspaceId === "local-development-workspace")
    || (visibility === "private" && ownerId === context.userId);
}

export type CRMOperationsContact = CRMContact;
