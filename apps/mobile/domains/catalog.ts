export type CatalogItemType =
  | "physical_product"
  | "service"
  | "subscription"
  | "coverage"
  | "package"
  | "digital_product";

export type CatalogItemStatus = "draft" | "active" | "archived";

export interface OrganizationCatalog {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: CatalogItemStatus;
  createdAt: string;
  updatedAt: string;
  kind?: string;
  currency?: string;
}

export interface CatalogItem {
  id: string;
  organizationId: string;
  catalogId: string;
  key: string;
  sku: string;
  type: CatalogItemType;
  name: string;
  description: string | null;
  categoryKey: string | null;
  channels: string[];
  status: CatalogItemStatus;
  createdAt: string;
  updatedAt: string;
}

const now = "2026-09-20T00:00:00.000Z";
export const LOCAL_CATALOG_ORGANIZATION_ID = "local-development-organization";

const catalogs: OrganizationCatalog[] = [
  {
    id: "mobile-catalog-products",
    organizationId: LOCAL_CATALOG_ORGANIZATION_ID,
    name: "Productos",
    description: "Catálogo móvil de productos y servicios.",
    status: "active",
    createdAt: now,
    updatedAt: now,
  },
];

const items: CatalogItem[] = [];

export const mobileCatalogAdapter = {
  async listCatalogs(input: { organizationId: string }): Promise<OrganizationCatalog[]> {
    return catalogs.filter((catalog) => catalog.organizationId === input.organizationId && catalog.status !== "archived");
  },

  async listCatalogItems(input: { organizationId: string; catalogId: string; includeArchived?: boolean }): Promise<CatalogItem[]> {
    return items.filter(
      (item) => item.organizationId === input.organizationId
        && item.catalogId === input.catalogId
        && (input.includeArchived || item.status !== "archived"),
    );
  },

  async createCatalogItem(input: {
    organizationId: string;
    catalogId: string;
    name: string;
    key: string;
    sku?: string;
    type: CatalogItemType;
    categoryKey?: string;
    channels?: string[];
    status?: CatalogItemStatus;
    description?: string;
  }): Promise<CatalogItem> {
    const timestamp = new Date().toISOString();
    const item: CatalogItem = {
      id: `mobile-item-${Date.now()}`,
      organizationId: input.organizationId,
      catalogId: input.catalogId,
      name: input.name,
      key: input.key,
      sku: input.sku ?? input.key,
      type: input.type,
      description: input.description ?? null,
      categoryKey: input.categoryKey ?? null,
      channels: input.channels ?? [],
      status: input.status ?? "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    items.push(item);
    return item;
  },

  async archiveCatalogItem(input: { organizationId: string; catalogId: string; itemId: string }): Promise<void> {
    const item = items.find(
      (candidate) => candidate.id === input.itemId
        && candidate.organizationId === input.organizationId
        && candidate.catalogId === input.catalogId,
    );
    if (!item) throw new Error("Catalog item not found.");
    item.status = "archived";
    item.updatedAt = new Date().toISOString();
  },
};
