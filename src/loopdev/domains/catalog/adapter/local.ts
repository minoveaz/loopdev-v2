import { isScopeVisible } from "@/loopdev/domains/platform";
import { localPlatformAdapter } from "@/loopdev/domains/platform/adapter";
import {
  localCatalogItemsStore,
  localOrganizationCatalogsStore,
  localCatalogOffersStore,
  localProductCostReferencesStore,
  localProductReferencesStore,
  localCatalogPriceBooksStore,
  localCatalogPriceEntriesStore,
  localCatalogVariantsStore,
  localCatalogPartyRolesStore,
  localCatalogAvailabilitiesStore,
  localCatalogEligibilitiesStore,
} from "../data/localCatalog";
import type {
  CatalogItem,
  CatalogCreateInput,
  CatalogItemCreateInput,
  CatalogListParams,
  CatalogRecordStatus,
  CatalogReferenceResolutionParams,
  CatalogScopeParams,
  CatalogVariant,
  OrganizationCatalog,
  Offer,
  PriceBook,
  PriceEntry,
  ResolvedCatalogReference,
  ProductCostReferenceInput,
  ProductReferenceCreateInput,
  ProductReferenceKind,
} from "../types";
import { CatalogAdapterError } from "../types";
import type { CatalogAdapter } from "./index";

function scopeFor(params: CatalogScopeParams) {
  return { organizationId: params.organizationId, workspaceId: params.workspaceId ?? null };
}

function assertRead(params: CatalogScopeParams): void {
  if (!localPlatformAdapter.hasPermission("catalog.read", scopeFor(params))) {
    throw new CatalogAdapterError("You do not have permission to view this catalog.", "forbidden");
  }
}

function visible<T extends { organizationId: string; workspaceId: string | null; status: string }>(
  items: T[],
  params: CatalogListParams,
): T[] {
  const scope = scopeFor(params);
  return items
    .filter((item) => isScopeVisible({ organizationId: item.organizationId, workspaceId: item.workspaceId }, scope))
    .filter((item) => params.includeArchived || params.status?.includes("archived") || item.status !== "archived")
    .filter((item) => !params.status?.length || params.status.includes(item.status as CatalogRecordStatus));
}

function findVisible<T extends { id: string; organizationId: string; workspaceId: string | null; status: string }>(
  items: T[],
  id: string,
  params: CatalogScopeParams,
): T | null {
  const scope = scopeFor(params);
  const item = items.find((candidate) => candidate.id === id);
  if (!item || !isScopeVisible({ organizationId: item.organizationId, workspaceId: item.workspaceId }, scope)) return null;
  if (item.status === "archived") return null;
  return item;
}

function assertWrite(params: CatalogScopeParams): void {
  if (!localPlatformAdapter.hasPermission("catalog.write", scopeFor(params))) {
    throw new CatalogAdapterError("You do not have permission to manage this catalog.", "forbidden");
  }
}

function assertOwned<T extends { id: string; organizationId: string; workspaceId: string | null }>(store: { get(id: string): T | null | undefined }, id: string, params: CatalogScopeParams): T {
  const current = store.get(id);
  if (!current || current.organizationId !== params.organizationId || (params.workspaceId !== undefined && current.workspaceId !== params.workspaceId)) {
    throw new CatalogAdapterError("Catalog record not found in this scope.", "server-error");
  }
  return current;
}

export const localCatalogAdapter: CatalogAdapter = {
  async listCatalogs(params) {
    assertRead(params);
    return localOrganizationCatalogsStore.list()
      .filter((catalog) => isScopeVisible({ organizationId: catalog.organizationId, workspaceId: catalog.workspaceId }, scopeFor(params)))
      .filter((catalog) => catalog.status !== "archived");
  },

  async createCatalog(input: CatalogCreateInput): Promise<OrganizationCatalog> {
    if (!localPlatformAdapter.hasPermission("catalog.write", scopeFor(input))) {
      throw new CatalogAdapterError("You do not have permission to manage this catalog.", "forbidden");
    }
    const catalog = localOrganizationCatalogsStore.create({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId ?? null,
      key: input.key.trim().toLocaleLowerCase().replace(/\s+/g, "-"),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      kind: input.kind,
      status: "active",
      metadata: input.metadata ?? {},
    });
    return catalog;
  },

  async createCatalogItem(input: CatalogItemCreateInput): Promise<CatalogItem> {
    if (!localPlatformAdapter.hasPermission("catalog.write", scopeFor(input))) {
      throw new CatalogAdapterError("You do not have permission to manage this catalog.", "forbidden");
    }
    return localCatalogItemsStore.create({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId ?? null,
      catalogId: input.catalogId ?? null,
      key: input.key.trim().toLocaleLowerCase().replace(/\s+/g, "-"),
      sku: input.sku.trim(),
      type: input.type,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      categoryKey: input.categoryKey?.trim() || null,
      status: input.status ?? "draft",
      visibility: { organizationId: input.organizationId, workspaceId: input.workspaceId ?? null },
      metadata: input.metadata ?? {},
    });
  },

  async updateCatalogItem(id, params, patch) {
    if (!localPlatformAdapter.hasPermission("catalog.write", scopeFor(params))) {
      throw new CatalogAdapterError("You do not have permission to manage this catalog.", "forbidden");
    }
    const current = localCatalogItemsStore.get(id);
    if (!current || current.organizationId !== params.organizationId || (params.workspaceId !== undefined && current.workspaceId !== params.workspaceId)) {
      throw new CatalogAdapterError("Catalog item not found in this scope.", "server-error");
    }
    const updated = localCatalogItemsStore.update(id, patch);
    if (!updated) throw new CatalogAdapterError("Unable to update catalog item.", "server-error");
    return updated;
  },

  async deleteCatalogItem(id, params) {
    if (!localPlatformAdapter.hasPermission("catalog.write", scopeFor(params))) {
      throw new CatalogAdapterError("You do not have permission to manage this catalog.", "forbidden");
    }
    const current = localCatalogItemsStore.get(id);
    if (!current || current.organizationId !== params.organizationId || (params.workspaceId !== undefined && current.workspaceId !== params.workspaceId)) {
      throw new CatalogAdapterError("Catalog item not found in this scope.", "server-error");
    }
    if (!localCatalogItemsStore.remove(id)) throw new CatalogAdapterError("Unable to delete catalog item.", "server-error");
  },

  async listCatalogItems(params) {
    assertRead(params);
    return visible(localCatalogItemsStore.list(), params)
      .filter((item) => !params.catalogId || item.catalogId === params.catalogId || (!item.catalogId && params.catalogId === "catalog_products" && item.type !== "service" && item.type !== "coverage"));
  },

  async getCatalogItem(id, params) {
    assertRead(params);
    return findVisible(localCatalogItemsStore.list(), id, params);
  },

  async findCatalogItemByKey(key, params) {
    assertRead(params);
    const normalizedKey = key.trim().toLocaleLowerCase();
    return visible(localCatalogItemsStore.list(), params)
      .find((item) => item.key.toLocaleLowerCase() === normalizedKey) ?? null;
  },

  async listOffers(params) {
    assertRead(params);
    return visible(localCatalogOffersStore.list(), params)
      .filter((offer) => !params.catalogItemId || offer.catalogItemId === params.catalogItemId);
  },
  async createOffer(input) {
    assertWrite(input);
    return localCatalogOffersStore.create({ ...input, workspaceId: input.workspaceId ?? null, key: input.key.trim().toLocaleLowerCase().replace(/\s+/g, "-"), name: input.name.trim() });
  },
  async updateOffer(id, params, patch) {
    assertWrite(params); assertOwned(localCatalogOffersStore, id, params);
    const updated = localCatalogOffersStore.update(id, patch);
    if (!updated) throw new CatalogAdapterError("Unable to update offer.", "server-error");
    return updated;
  },
  async deleteOffer(id, params) {
    assertWrite(params); assertOwned(localCatalogOffersStore, id, params);
    if (!localCatalogOffersStore.remove(id)) throw new CatalogAdapterError("Unable to delete offer.", "server-error");
  },

  async listVariants(params) {
    assertRead(params);
    return visible(localCatalogVariantsStore.list(), params)
      .filter((variant) => !params.catalogItemId || variant.catalogItemId === params.catalogItemId);
  },
  async createVariant(input) {
    assertWrite(input);
    return localCatalogVariantsStore.create({ ...input, workspaceId: input.workspaceId ?? null, key: input.key.trim().toLocaleLowerCase().replace(/\s+/g, "-"), name: input.name.trim() });
  },
  async updateVariant(id, params, patch) {
    assertWrite(params); assertOwned(localCatalogVariantsStore, id, params);
    const updated = localCatalogVariantsStore.update(id, patch);
    if (!updated) throw new CatalogAdapterError("Unable to update variant.", "server-error");
    return updated;
  },
  async deleteVariant(id, params) {
    assertWrite(params); assertOwned(localCatalogVariantsStore, id, params);
    if (!localCatalogVariantsStore.remove(id)) throw new CatalogAdapterError("Unable to delete variant.", "server-error");
  },

  async listPriceBooks(params) {
    assertRead(params);
    return visible(localCatalogPriceBooksStore.list(), params);
  },
  async createPriceBook(input) {
    assertWrite(input);
    return localCatalogPriceBooksStore.create({ ...input, workspaceId: input.workspaceId ?? null, key: input.key.trim().toLocaleLowerCase().replace(/\s+/g, "-"), name: input.name.trim() });
  },
  async updatePriceBook(id, params, patch) {
    assertWrite(params); assertOwned(localCatalogPriceBooksStore, id, params);
    const updated = localCatalogPriceBooksStore.update(id, patch);
    if (!updated) throw new CatalogAdapterError("Unable to update price book.", "server-error");
    return updated;
  },
  async deletePriceBook(id, params) {
    assertWrite(params); assertOwned(localCatalogPriceBooksStore, id, params);
    if (!localCatalogPriceBooksStore.remove(id)) throw new CatalogAdapterError("Unable to delete price book.", "server-error");
  },

  async listPriceEntries(params) {
    assertRead(params);
    return visible(localCatalogPriceEntriesStore.list(), params)
      .filter((entry) => !params.priceBookId || entry.priceBookId === params.priceBookId);
  },
  async createPriceEntry(input) {
    assertWrite(input);
    return localCatalogPriceEntriesStore.create({ ...input, workspaceId: input.workspaceId ?? null });
  },
  async updatePriceEntry(id, params, patch) {
    assertWrite(params); assertOwned(localCatalogPriceEntriesStore, id, params);
    const updated = localCatalogPriceEntriesStore.update(id, patch);
    if (!updated) throw new CatalogAdapterError("Unable to update price entry.", "server-error");
    return updated;
  },
  async deletePriceEntry(id, params) {
    assertWrite(params); assertOwned(localCatalogPriceEntriesStore, id, params);
    if (!localCatalogPriceEntriesStore.remove(id)) throw new CatalogAdapterError("Unable to delete price entry.", "server-error");
  },

  async listProductPartyRoles(params) {
    assertRead(params);
    return visible(localCatalogPartyRolesStore.list(), params)
      .filter((role) => !params.catalogItemId || role.catalogItemId === params.catalogItemId)
      .filter((role) => !params.role || role.role === params.role);
  },

  async listAvailabilities(params) {
    assertRead(params);
    return visible(localCatalogAvailabilitiesStore.list(), params)
      .filter((availability) => !params.catalogItemId || availability.catalogItemId === params.catalogItemId);
  },

  async listEligibilities(params) {
    assertRead(params);
    return visible(localCatalogEligibilitiesStore.list(), params)
      .filter((eligibility) => !params.catalogItemId || eligibility.catalogItemId === params.catalogItemId);
  },

  async listProductReferences(params) {
    assertRead(params);
    return localProductReferencesStore.list()
      .filter((reference) => reference.organizationId === params.organizationId)
      .filter((reference) => reference.status === "active")
      .filter((reference) => !params.kind || reference.kind === params.kind);
  },

  async createProductReference(input: ProductReferenceCreateInput) {
    assertWrite(input);
    const normalizedKey = input.key.trim().toLocaleLowerCase().replace(/\s+/g, "-");
    const name = input.name.trim();
    if (!normalizedKey || !name) throw new CatalogAdapterError("Reference name and key are required.", "server-error");
    if (localProductReferencesStore.list().some((reference) =>
      reference.organizationId === input.organizationId
      && reference.kind === input.kind
      && reference.key.toLocaleLowerCase() === normalizedKey
      && reference.status !== "archived")) {
      throw new CatalogAdapterError("A reference with this name already exists.", "conflict");
    }
    if (input.parentId) {
      const parent = localProductReferencesStore.get(input.parentId);
      if (!parent || parent.organizationId !== input.organizationId || parent.kind !== "category" || parent.status !== "active") {
        throw new CatalogAdapterError("The parent category is unavailable.", "invalid-scope");
      }
    }
    return localProductReferencesStore.create({
      ...input,
      key: normalizedKey,
      name,
      parentId: input.kind === "category" ? input.parentId : null,
      status: "active",
    });
  },

  async getProductCostReference(params) {
    assertWrite(params);
    const item = localCatalogItemsStore.get(params.catalogItemId);
    if (!item || item.organizationId !== params.organizationId) return null;
    if (params.variantId) {
      const variant = localCatalogVariantsStore.get(params.variantId);
      if (!variant || variant.organizationId !== params.organizationId || variant.catalogItemId !== item.id) return null;
    }
    return localProductCostReferencesStore.list().find((cost) =>
      cost.organizationId === params.organizationId
      && cost.catalogItemId === params.catalogItemId
      && cost.variantId === (params.variantId ?? null)) ?? null;
  },

  async saveProductCostReference(input: ProductCostReferenceInput) {
    assertWrite(input);
    if (input.amount !== null && (!Number.isFinite(input.amount) || input.amount < 0)) {
      throw new CatalogAdapterError("Cost must be a non-negative amount.", "server-error");
    }
    if (!/^[A-Z]{3}$/.test(input.currency)) {
      throw new CatalogAdapterError("Cost currency must be a three-letter ISO code.", "server-error");
    }
    const item = localCatalogItemsStore.get(input.catalogItemId);
    if (!item || item.organizationId !== input.organizationId) {
      throw new CatalogAdapterError("Catalog item not found in this organization.", "invalid-scope");
    }
    if (input.variantId) {
      const variant = localCatalogVariantsStore.get(input.variantId);
      if (!variant || variant.organizationId !== input.organizationId || variant.catalogItemId !== item.id) {
        throw new CatalogAdapterError("SKU not found for this catalog item.", "invalid-scope");
      }
    }
    const current = localProductCostReferencesStore.list().find((cost) =>
      cost.organizationId === input.organizationId
      && cost.catalogItemId === input.catalogItemId
      && cost.variantId === (input.variantId ?? null));
    if (current) {
      const updated = localProductCostReferencesStore.update(current.id, input);
      if (!updated) throw new CatalogAdapterError("Unable to update product cost reference.", "server-error");
      return updated;
    }
    return localProductCostReferencesStore.create(input);
  },

  async resolveReference({ reference, ...params }: CatalogReferenceResolutionParams): Promise<ResolvedCatalogReference | null> {
    assertRead(params);
    const offers = await localCatalogAdapter.listOffers({ ...params, includeArchived: false });
    const variants = await localCatalogAdapter.listVariants({ ...params, includeArchived: false });
    const referencedOffer = reference.offerId ? offers.find((offer) => offer.id === reference.offerId) ?? null : null;
    const referencedVariant = reference.variantId ? variants.find((variant) => variant.id === reference.variantId) ?? null : null;
    const itemId = reference.catalogItemId
      ?? referencedOffer?.catalogItemId
      ?? referencedVariant?.catalogItemId;
    const item = itemId
      ? await localCatalogAdapter.getCatalogItem(itemId, params)
      : reference.productKey
        ? await localCatalogAdapter.findCatalogItemByKey(reference.productKey, params)
        : null;
    if (!item) return null;

    const offer = referencedOffer && referencedOffer.catalogItemId === item.id ? referencedOffer : null;
    const variant = referencedVariant && referencedVariant.catalogItemId === item.id ? referencedVariant : null;
    if ((reference.offerId && !offer) || (reference.variantId && !variant)) return null;
    if (reference.productKey && reference.productKey.trim().toLocaleLowerCase() !== item.key.toLocaleLowerCase()) return null;
    return {
      item,
      offer,
      variant,
      reference: { entityType: "catalog_item", entityId: item.id, scope: { organizationId: item.organizationId, workspaceId: item.workspaceId } },
    };
  },
};
