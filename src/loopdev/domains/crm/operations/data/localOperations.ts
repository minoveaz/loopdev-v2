import { createLocalStore } from "@/lib/localStore";
import type {
  CRMCustomFieldDefinition,
  CRMCustomFieldValue,
  CRMEntityTag,
  CRMSavedView,
  CRMTag,
} from "../types";

const organizationId = "local-development-organization";
const workspaceId = "local-development-workspace";
const now = new Date().toISOString();

const savedViewSeed: CRMSavedView[] = [
  {
    id: "crm_view_all-contacts",
    organizationId,
    workspaceId,
    name: "All contacts",
    entityType: "contact",
    filters: [],
    columns: ["name", "email", "companyName", "tags"],
    visibility: "organization",
    ownerId: "local-development-user",
    createdAt: now,
    updatedAt: now,
  },
];

const tagSeed: CRMTag[] = [
  {
    id: "crm_tag_priority",
    organizationId,
    workspaceId,
    name: "Priority",
    slug: "priority",
    color: "#2563eb",
    visibility: "workspace",
    ownerId: "local-development-user",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "crm_tag_partner",
    organizationId,
    workspaceId,
    name: "Partner",
    slug: "partner",
    color: "#7c3aed",
    visibility: "organization",
    ownerId: "local-development-user",
    createdAt: now,
    updatedAt: now,
  },
];

const customFieldSeed: CRMCustomFieldDefinition[] = [
  {
    id: "crm_field_industry",
    organizationId,
    workspaceId,
    entityType: "contact",
    key: "industry",
    label: "Industry",
    type: "text",
    required: false,
    visibility: "workspace",
    ownerId: "local-development-user",
    options: [],
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "crm_field_account_tier",
    organizationId,
    workspaceId,
    entityType: "contact",
    key: "account_tier",
    label: "Account tier",
    type: "select",
    required: false,
    visibility: "organization",
    ownerId: "local-development-user",
    options: ["Standard", "Strategic", "Enterprise"],
    active: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const crmSavedViewsStore = createLocalStore<CRMSavedView>({
  key: "loopdev:crm:saved-views",
  seed: savedViewSeed,
  idPrefix: "crm_view",
});

export const crmTagsStore = createLocalStore<CRMTag>({
  key: "loopdev:crm:tags",
  seed: tagSeed,
  idPrefix: "crm_tag",
});

export const crmEntityTagsStore = createLocalStore<CRMEntityTag>({
  key: "loopdev:crm:entity-tags",
  seed: [],
  idPrefix: "crm_entity_tag",
});

export const crmCustomFieldDefinitionsStore = createLocalStore<CRMCustomFieldDefinition>({
  key: "loopdev:crm:custom-field-definitions",
  seed: customFieldSeed,
  idPrefix: "crm_field",
});

export const crmCustomFieldValuesStore = createLocalStore<CRMCustomFieldValue>({
  key: "loopdev:crm:custom-field-values",
  seed: [],
  idPrefix: "crm_field_value",
});
