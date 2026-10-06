export type CatalogItemType =
  | "physical_product"
  | "service"
  | "subscription"
  | "coverage"
  | "package"
  | "digital_product"
  | "fee";

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
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const LOCAL_CATALOG_ORGANIZATION_ID = "local-development-organization";
export function getMobileOrganizationId(): string {
  return mobileTenantContextAdapter.getTenantContext()?.activeOrganizationId ?? "";
}
const CATALOG_STORAGE_KEY = "loopdev_mobile_catalog_items";
const DEFAULT_CATALOG_ID = "mobile-catalog-products";
const DEFAULT_ORGANIZATION_ID = "80fce911-57c5-4a83-809f-78df6a3736f7";
const DEFAULT_CATALOGS: OrganizationCatalog[] = [];

const DEFAULT_ITEMS: CatalogItem[] = [];

function readItems(): CatalogItem[] {
  if (typeof window === "undefined") return DEFAULT_ITEMS.map((item) => ({ ...item }));
  try {
    const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    return raw ? JSON.parse(raw) as CatalogItem[] : DEFAULT_ITEMS.map((item) => ({ ...item }));
  } catch (cause) {
    throw new Error(cause instanceof Error ? `Unable to read local catalog: ${cause.message}` : "Unable to read local catalog.");
  }
}

function writeItems(items: CatalogItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(items));
  } catch (cause) {
    throw new Error(cause instanceof Error ? `Unable to persist local catalog: ${cause.message}` : "Unable to persist local catalog.");
  }
}

export const mobileCatalogAdapter = {
  async listCatalogs(input: { organizationId: string }): Promise<OrganizationCatalog[]> {
    if (!input.organizationId || input.organizationId === LOCAL_CATALOG_ORGANIZATION_ID) return [];
    return [{
      id: DEFAULT_CATALOG_ID,
      organizationId: input.organizationId,
      name: "Productos y servicios",
      description: null,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }];
  },

  async listCatalogItems(input: { organizationId: string; catalogId?: string; includeArchived?: boolean }): Promise<CatalogItem[]> {
    if (!input.organizationId || input.organizationId === LOCAL_CATALOG_ORGANIZATION_ID) return [];
    const remote = await mobileSupabaseClient
      .from("catalog_products")
      .select("id,organization_id,sku,name,description,type,status,category,metadata,created_at,updated_at")
      .eq("organization_id", input.organizationId)
      .order("created_at", { ascending: false });
    if (!remote.error) {
      return (remote.data ?? [])
        .filter((item) => input.includeArchived || item.status !== "archived")
        .map((item) => ({
          id: item.id,
          organizationId: item.organization_id,
          catalogId: input.catalogId ?? DEFAULT_CATALOG_ID,
          key: item.sku,
          sku: item.sku,
          type: item.type === "product" ? "physical_product" : item.type === "plan" ? "subscription" : item.type as CatalogItemType,
          name: item.name,
          description: item.description ?? null,
          categoryKey: item.category ?? null,
          channels: [],
          status: item.status as CatalogItemStatus,
          metadata: item.metadata ?? {},
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));
    }
    return readItems().filter((item) =>
      item.organizationId === input.organizationId
      && (!input.catalogId || item.catalogId === input.catalogId)
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
    if (!input.organizationId || !input.catalogId || !input.name.trim() || !input.key.trim()) {
      throw new Error("Catalog item organization, catalog, name and key are required.");
    }
    const timestamp = new Date().toISOString();
    const item: CatalogItem = {
      id: `mobile-item-${Date.now()}`,
      organizationId: input.organizationId,
      catalogId: input.catalogId,
      name: input.name.trim(),
      key: input.key.trim().toLowerCase(),
      sku: input.sku?.trim() || input.key.trim(),
      type: input.type,
      description: input.description?.trim() || null,
      categoryKey: input.categoryKey?.trim() || null,
      channels: input.channels ?? [],
      status: input.status ?? "draft",
      metadata: {},
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    if (input.organizationId !== LOCAL_CATALOG_ORGANIZATION_ID) {
      const remote = await mobileSupabaseClient.from("catalog_products").insert({
        organization_id: input.organizationId,
        sku: item.sku,
        name: item.name,
        description: item.description,
        type: item.type === "physical_product" ? "product" : item.type === "subscription" ? "plan" : item.type,
        status: item.status,
        category: item.categoryKey,
        metadata: item.metadata,
      }).select("id,organization_id,sku,name,description,type,status,category,metadata,created_at,updated_at").single();
      if (remote.error || !remote.data) throw new Error(remote.error?.message ?? "Unable to create catalog item.");
      return {
        ...item,
        id: remote.data.id,
        createdAt: remote.data.created_at,
        updatedAt: remote.data.updated_at,
      };
    }
    writeItems([item, ...readItems()]);
    return item;
  },

  async archiveCatalogItem(input: { organizationId: string; catalogId: string; itemId: string }): Promise<void> {
    if (input.organizationId !== LOCAL_CATALOG_ORGANIZATION_ID) {
      const remote = await mobileSupabaseClient.from("catalog_products")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("id", input.itemId)
        .eq("organization_id", input.organizationId);
      if (remote.error) throw new Error(remote.error.message);
      return;
    }
    const items = readItems();
    const current = items.find((item) =>
      item.id === input.itemId
      && item.organizationId === input.organizationId
      && item.catalogId === input.catalogId,
    );
    if (!current) throw new Error("Catalog item not found in this organization.");
    writeItems(items.map((item) => item.id === current.id
      ? { ...item, status: "archived" as const, updatedAt: new Date().toISOString() }
      : item));
  },
};

export const DEFAULT_CATALOG_ITEMS = DEFAULT_ITEMS;
import { mobileSupabaseClient } from "./supabase";
import { mobileTenantContextAdapter } from "./auth";
