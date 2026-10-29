import { isScopeVisible } from "@/loopdev/domains/platform";
import { localPlatformAdapter } from "@/loopdev/domains/platform/adapter";
import {
  localCatalogItemsStore,
  localCatalogItemKeyCountersStore,
  localCatalogSkuCountersStore,
  localOrganizationCatalogsStore,
  localCatalogOffersStore,
  localProductCostReferencesStore,
  localProductCostMutationsStore,
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
  ProductCostAccess,
  ResolvedCatalogReference,
  ProductCostReferenceInput,
  ProductReferenceCreateInput,
  ProductReferenceUpdateInput,
  ProductReferenceKind,
} from "../types";
import { CatalogAdapterError, matchesCatalogItemKey } from "../types";
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

function assertActiveCategory(organizationId: string, categoryKey: string | null | undefined): void {
  if (!categoryKey) return;
  const category = localProductReferencesStore.list().find((reference) =>
    reference.organizationId === organizationId
    && reference.kind === "category"
    && reference.key === categoryKey
    && reference.status === "active");
  if (!category) throw new CatalogAdapterError("Choose an active category in this organization.", "invalid-scope");
}

function assertUniqueSku(sku: string, organizationId: string, exceptVariantId?: string, exceptItemId?: string): void {
  const normalizedSku = sku.trim().toLocaleLowerCase();
  if (!normalizedSku) return;
  const itemConflict = localCatalogItemsStore.list().some((item) =>
    item.organizationId === organizationId
    && item.id !== exceptItemId
    && item.sku.trim().toLocaleLowerCase() === normalizedSku);
  const variantConflict = localCatalogVariantsStore.list().some((variant) =>
    variant.organizationId === organizationId
    && variant.id !== exceptVariantId
    && variant.sku.trim().toLocaleLowerCase() === normalizedSku);
  if (itemConflict || variantConflict) {
    throw new CatalogAdapterError("A product or SKU with this code already exists in the organization.", "conflict");
  }
}

type IdentifierCounterStore = {
  list(): Array<{ id: string; organizationId: string; lastValue: string }>;
  create(input: { organizationId: string; lastValue: string }): unknown;
  update(id: string, patch: { lastValue: string }): unknown;
};

function nextNumericIdentifier(
  organizationId: string,
  counterStore: IdentifierCounterStore,
  initialValue: bigint,
  existingValues: string[],
): string {
  const latestExistingValue = existingValues
    .filter((value) => /^\d+$/.test(value))
    .reduce((latest, value) => {
      const numericValue = BigInt(value);
      return numericValue > latest ? numericValue : latest;
    }, initialValue);
  const counter = counterStore.list().find((item) => item.organizationId === organizationId);
  const previousValue = counter && /^\d+$/.test(counter.lastValue) ? BigInt(counter.lastValue) : initialValue;
  const nextValue = (previousValue > latestExistingValue ? previousValue : latestExistingValue) + 1n;
  if (counter) counterStore.update(counter.id, { lastValue: nextValue.toString() });
  else counterStore.create({ organizationId, lastValue: nextValue.toString() });
  return nextValue.toString();
}

function nextCatalogItemKey(organizationId: string): string {
  return nextNumericIdentifier(
    organizationId,
    localCatalogItemKeyCountersStore,
    0n,
    [
      ...localCatalogItemsStore.list().filter((item) => item.organizationId === organizationId).map((item) => item.key),
      ...localCatalogVariantsStore.list().filter((variant) => variant.organizationId === organizationId).map((variant) => variant.key),
    ],
  );
}

function nextCatalogSku(organizationId: string): string {
  return nextNumericIdentifier(
    organizationId,
    localCatalogSkuCountersStore,
    10_000_000_000n,
    [
      ...localCatalogItemsStore.list().filter((item) => item.organizationId === organizationId).map((item) => item.sku),
      ...localCatalogVariantsStore.list().filter((variant) => variant.organizationId === organizationId).map((variant) => variant.sku),
    ],
  );
}

function assertIdentifiersAreServerControlled(patch: object): void {
  if (Object.prototype.hasOwnProperty.call(patch, "key") || Object.prototype.hasOwnProperty.call(patch, "sku")) {
    throw new CatalogAdapterError("Product keys and SKUs are generated by LoopDev and cannot be changed.", "conflict");
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
    if (!input.name.trim()) throw new CatalogAdapterError("A product name is required.", "server-error");
    assertActiveCategory(input.organizationId, input.categoryKey);
    const key = nextCatalogItemKey(input.organizationId);
    const sku = nextCatalogSku(input.organizationId);
    assertUniqueSku(sku, input.organizationId);
    return localCatalogItemsStore.create({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId ?? null,
      catalogId: input.catalogId ?? null,
      key,
      sku,
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
    assertIdentifiersAreServerControlled(patch);
    if (patch.categoryKey !== undefined) assertActiveCategory(params.organizationId, patch.categoryKey);
    if (patch.status === "active") assertActiveCategory(params.organizationId, patch.categoryKey ?? current.categoryKey);
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
      .find((item) => matchesCatalogItemKey(item, normalizedKey)) ?? null;
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
    const item = localCatalogItemsStore.get(input.catalogItemId);
    if (!item || item.organizationId !== input.organizationId) {
      throw new CatalogAdapterError("Catalog item not found in this organization.", "invalid-scope");
    }
    if (!input.name.trim()) throw new CatalogAdapterError("A variant name is required.", "server-error");
    if (input.status === "active") {
      const categoryKey = input.metadata.categoryKey;
      const category = typeof categoryKey === "string"
        ? localProductReferencesStore.list().find((reference) =>
          reference.organizationId === input.organizationId
          && reference.kind === "category"
          && reference.key === categoryKey
          && reference.status === "active")
        : null;
      if (!category) throw new CatalogAdapterError("An active SKU needs an active category.", "invalid-scope");
    }
    if (typeof input.metadata.categoryKey === "string") assertActiveCategory(input.organizationId, input.metadata.categoryKey);
    const key = nextCatalogItemKey(input.organizationId);
    const sku = nextCatalogSku(input.organizationId);
    assertUniqueSku(sku, input.organizationId);
    const variant = localCatalogVariantsStore.create({
      ...input,
      workspaceId: input.workspaceId ?? null,
      key,
      sku,
      name: input.name.trim(),
    });
    if (item.sku) {
      const updatedItem = localCatalogItemsStore.update(item.id, { sku: "" });
      if (!updatedItem) {
        localCatalogVariantsStore.remove(variant.id);
        throw new CatalogAdapterError("Unable to mark the product as variant-managed.", "server-error");
      }
    }
    return variant;
  },
  async updateVariant(id, params, patch) {
    assertWrite(params); assertOwned(localCatalogVariantsStore, id, params);
    assertIdentifiersAreServerControlled(patch);
    const current = localCatalogVariantsStore.get(id);
    if (!current) throw new CatalogAdapterError("SKU not found.", "not-found");
    const updatedValue = { ...current, ...patch };
    if (!updatedValue.name.trim()) throw new CatalogAdapterError("A variant name is required.", "server-error");
    const categoryKey = updatedValue.metadata.categoryKey;
    if (typeof categoryKey === "string") assertActiveCategory(params.organizationId, categoryKey);
    if (patch.status === "active" && current.status !== "active") {
      const categoryKey = updatedValue.metadata.categoryKey;
      const category = typeof categoryKey === "string"
        ? localProductReferencesStore.list().find((reference) =>
          reference.organizationId === params.organizationId
          && reference.kind === "category"
          && reference.key === categoryKey
          && reference.status === "active")
        : null;
      if (!category) throw new CatalogAdapterError("An active SKU needs an active category.", "invalid-scope");
    }
    const updated = localCatalogVariantsStore.update(id, patch);
    if (!updated) throw new CatalogAdapterError("Unable to update variant.", "server-error");
    return updated;
  },
  async deleteVariant(id, params) {
    assertWrite(params);
    const current = assertOwned(localCatalogVariantsStore, id, params);
    if (!localCatalogVariantsStore.remove(id)) throw new CatalogAdapterError("Unable to delete variant.", "server-error");
    const siblingVariants = localCatalogVariantsStore.list().some((variant) =>
      variant.organizationId === current.organizationId && variant.catalogItemId === current.catalogItemId);
    if (!siblingVariants) {
      const parent = localCatalogItemsStore.get(current.catalogItemId);
      if (parent && parent.organizationId === current.organizationId && !parent.sku) {
        const updated = localCatalogItemsStore.update(parent.id, { sku: nextCatalogSku(parent.organizationId) });
        if (!updated) throw new CatalogAdapterError("Unable to restore the product SKU.", "server-error");
      }
    }
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
      .filter((reference) => params.includeArchived || reference.status !== "archived")
      .filter((reference) => !params.kind || reference.kind === params.kind);
  },

  async createProductReference(input: ProductReferenceCreateInput) {
    assertWrite(input);
    const name = input.name.trim();
    const baseKey = input.kind === "category"
      ? name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "category"
      : input.key.trim().toLocaleLowerCase().replace(/\s+/g, "-");
    if (!baseKey || !name) throw new CatalogAdapterError("Reference name and key are required.", "server-error");
    const duplicate = localProductReferencesStore.list().some((reference) =>
      reference.organizationId === input.organizationId
      && reference.kind === input.kind
      && reference.key.toLocaleLowerCase() === baseKey
      && reference.status !== "archived");
    if (duplicate && input.kind !== "category") {
      throw new CatalogAdapterError("A reference with this name already exists.", "conflict");
    }
    let normalizedKey = baseKey;
    let suffix = 2;
    while (localProductReferencesStore.list().some((reference) =>
      reference.organizationId === input.organizationId
      && reference.kind === input.kind
      && reference.key.toLocaleLowerCase() === normalizedKey)) {
      normalizedKey = `${baseKey}-${suffix++}`;
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
      version: 1,
    });
  },

  async updateProductReference(id: string, params: CatalogScopeParams, input: ProductReferenceUpdateInput) {
    assertWrite(params);
    const current = localProductReferencesStore.get(id);
    if (!current || current.organizationId !== params.organizationId || current.kind !== "category") {
      throw new CatalogAdapterError("Product category not found in this organization.", "not-found");
    }
    if (current.version !== input.expectedVersion) throw new CatalogAdapterError("Product category changed. Reload and try again.", "conflict");
    const patch = input.patch;
    if (patch.name !== undefined && !patch.name.trim()) throw new CatalogAdapterError("Category name is required.", "server-error");
    if (patch.status !== undefined && patch.status !== "active" && patch.status !== "archived") {
      throw new CatalogAdapterError("Category status is invalid.", "server-error");
    }
    const parentId = patch.parentId === undefined ? current.parentId : patch.parentId;
    let parent = parentId ? localProductReferencesStore.get(parentId) : null;
    if (parentId && (!parent || parent.organizationId !== params.organizationId || parent.kind !== "category" || parent.status !== "active")) {
      throw new CatalogAdapterError("The parent category must be active and in this organization.", "invalid-scope");
    }
    const visited = new Set<string>();
    while (parent) {
      if (parent.id === id || visited.has(parent.id)) {
        throw new CatalogAdapterError("Category moves cannot create a hierarchy cycle.", "conflict");
      }
      visited.add(parent.id);
      parent = parent.parentId ? localProductReferencesStore.get(parent.parentId) ?? null : null;
    }
    if (patch.status === "archived") {
      const hasActiveChildren = localProductReferencesStore.list().some((reference) =>
        reference.kind === "category" && reference.parentId === id && reference.status === "active");
      const hasActiveAssignments = localCatalogItemsStore.list().some((item) =>
        item.organizationId === params.organizationId && item.status === "active" && item.categoryKey === current.key)
        || localCatalogVariantsStore.list().some((variant) =>
          variant.organizationId === params.organizationId
          && variant.status === "active"
          && variant.metadata.categoryKey === current.key);
      if (hasActiveChildren || hasActiveAssignments) {
        throw new CatalogAdapterError("Move active child categories and assignments before archiving this category.", "conflict");
      }
    }
    const updated = localProductReferencesStore.update(id, {
      ...patch,
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      parentId,
      version: current.version + 1,
    });
    if (!updated) throw new CatalogAdapterError("Unable to update product category.", "server-error");
    return updated;
  },

  async getProductCostAccess(params): Promise<ProductCostAccess> {
    const scope = scopeFor(params);
    const canRead = localPlatformAdapter.hasPermission("catalog.cost.read", scope);
    const hasManagePermission = localPlatformAdapter.hasPermission("catalog.cost.manage", scope);
    return { canRead, canManage: canRead && hasManagePermission };
  },

  async getProductCostReference(params) {
    if (!localPlatformAdapter.hasPermission("catalog.cost.read", scopeFor(params))) {
      throw new CatalogAdapterError("You do not have permission to view purchase costs.", "forbidden");
    }
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
    const access = await this.getProductCostAccess(input);
    if (!access.canManage) {
      throw new CatalogAdapterError("You need both purchase-cost read and manage permissions.", "forbidden");
    }
    if (input.amount !== null && (!Number.isFinite(input.amount) || input.amount < 0 || Math.round(input.amount * 100) !== input.amount * 100)) {
      throw new CatalogAdapterError("Cost must be a non-negative amount.", "server-error");
    }
    if (!/^[A-Z]{3}$/.test(input.currency)) {
      throw new CatalogAdapterError("Cost currency must be a three-letter ISO code.", "server-error");
    }
    if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 0 || !/^[A-Za-z0-9._:-]{8,128}$/.test(input.idempotencyKey)) {
      throw new CatalogAdapterError("Cost version and idempotency key are required.", "server-error");
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
    const fingerprint = JSON.stringify([
      input.catalogItemId,
      input.variantId ?? null,
      input.amount,
      input.currency,
      input.expectedVersion,
    ]);
    const priorMutation = localProductCostMutationsStore.list().find((mutation) =>
      mutation.organizationId === input.organizationId && mutation.idempotencyKey === input.idempotencyKey);
    if (priorMutation) {
      if (priorMutation.fingerprint !== fingerprint) {
        throw new CatalogAdapterError("The cost idempotency key was reused with different values.", "conflict");
      }
      const priorCost = localProductCostReferencesStore.get(priorMutation.costReferenceId);
      if (!priorCost) throw new CatalogAdapterError("The idempotent cost result is unavailable.", "server-error");
      return priorCost;
    }
    if ((current?.version ?? 0) !== input.expectedVersion) {
      throw new CatalogAdapterError("Purchase cost changed. Reload and try again.", "conflict");
    }
    let saved: import("../types").ProductCostReference;
    if (current) {
      const updated = localProductCostReferencesStore.update(current.id, {
        amount: input.amount,
        currency: input.currency,
        version: current.version + 1,
      });
      if (!updated) throw new CatalogAdapterError("Unable to update product cost reference.", "server-error");
      saved = updated;
    } else {
      saved = localProductCostReferencesStore.create({
        organizationId: input.organizationId,
        catalogItemId: input.catalogItemId,
        variantId: input.variantId ?? null,
        amount: input.amount,
        currency: input.currency,
        version: 1,
      });
    }
    localProductCostMutationsStore.create({
      organizationId: input.organizationId,
      idempotencyKey: input.idempotencyKey,
      fingerprint,
      costReferenceId: saved.id,
    });
    return saved;
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
    if (reference.productKey && !matchesCatalogItemKey(item, reference.productKey)) return null;
    return {
      item,
      offer,
      variant,
      reference: { entityType: "catalog_item", entityId: item.id, scope: { organizationId: item.organizationId, workspaceId: item.workspaceId } },
    };
  },
};
