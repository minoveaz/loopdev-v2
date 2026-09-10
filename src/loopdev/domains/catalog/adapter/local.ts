import { isScopeVisible } from "@/loopdev/domains/platform";
import { localPlatformAdapter } from "@/loopdev/domains/platform/adapter";
import {
  localCatalogItemsStore,
  localCatalogOffersStore,
  localCatalogPriceBooksStore,
  localCatalogPriceEntriesStore,
  localCatalogVariantsStore,
} from "../data/localCatalog";
import type {
  CatalogItem,
  CatalogListParams,
  CatalogRecordStatus,
  CatalogReferenceResolutionParams,
  CatalogScopeParams,
  CatalogVariant,
  Offer,
  PriceBook,
  PriceEntry,
  ResolvedCatalogReference,
} from "../types";
import { CatalogAdapterError, type CatalogAdapter } from "./index";

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

export const localCatalogAdapter: CatalogAdapter = {
  async listCatalogItems(params) {
    assertRead(params);
    return visible(localCatalogItemsStore.list(), params);
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

  async listVariants(params) {
    assertRead(params);
    return visible(localCatalogVariantsStore.list(), params)
      .filter((variant) => !params.catalogItemId || variant.catalogItemId === params.catalogItemId);
  },

  async listPriceBooks(params) {
    assertRead(params);
    return visible(localCatalogPriceBooksStore.list(), params);
  },

  async listPriceEntries(params) {
    assertRead(params);
    return visible(localCatalogPriceEntriesStore.list(), params)
      .filter((entry) => !params.priceBookId || entry.priceBookId === params.priceBookId);
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
