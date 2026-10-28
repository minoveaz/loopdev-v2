import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { catalogAdapter, CatalogAdapterError, localCatalogAdapter, supabaseCatalogAdapter } from "@/loopdev/domains/catalog";
import { localPlatformAdapter } from "@/loopdev/domains/platform/adapter";
import { createLocalStore } from "@/lib/localStore";
import {
  localCatalogItemsStore,
  localCatalogItemKeyCountersStore,
  localCatalogSkuCountersStore,
  localCatalogOffersStore,
  localCatalogPriceBooksStore,
  localCatalogPriceEntriesStore,
  localCatalogVariantsStore,
  localCatalogPartyRolesStore,
  localCatalogAvailabilitiesStore,
  localCatalogEligibilitiesStore,
  localProductCostReferencesStore,
  localProductCostMutationsStore,
  localProductReferencesStore,
} from "@/loopdev/domains/catalog/data/localCatalog";

const organizationId = "local-development-organization";

describe("local Catalog adapter", () => {
  beforeEach(() => {
    localCatalogItemsStore.reset();
    localCatalogItemKeyCountersStore.reset();
    localCatalogSkuCountersStore.reset();
    localCatalogOffersStore.reset();
    localCatalogPriceBooksStore.reset();
    localCatalogPriceEntriesStore.reset();
    localCatalogVariantsStore.reset();
    localCatalogPartyRolesStore.reset();
    localCatalogAvailabilitiesStore.reset();
    localCatalogEligibilitiesStore.reset();
    localProductCostReferencesStore.reset();
    localProductCostMutationsStore.reset();
    localProductReferencesStore.reset();
  });

  describe("configured Catalog adapter", () => {
    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
      vi.stubEnv("VITE_CATALOG_ADAPTER_MODE", "local_demo");
    });

    it("fails closed when adapter mode is missing or invalid", async () => {
      vi.stubEnv("VITE_CATALOG_ADAPTER_MODE", undefined);
      await expect(catalogAdapter.listCatalogItems({ organizationId }))
        .rejects.toMatchObject({ name: "CatalogAdapterError", code: "server-error" });

      vi.stubEnv("VITE_CATALOG_ADAPTER_MODE", "fixtures" as "local_demo");
      await expect(catalogAdapter.listCatalogItems({ organizationId }))
        .rejects.toThrow("must be explicitly configured");
    });

    it("uses only the explicitly selected remote adapter and does not fall back after remote failure", async () => {
      vi.stubEnv("VITE_CATALOG_ADAPTER_MODE", "supabase");
      const remoteError = new CatalogAdapterError("Remote catalog unavailable.", "server-error");
      const remoteList = vi.spyOn(supabaseCatalogAdapter, "listCatalogItems").mockRejectedValue(remoteError);
      const localList = vi.spyOn(localCatalogAdapter, "listCatalogItems");

      await expect(catalogAdapter.listCatalogItems({ organizationId }))
        .rejects.toBe(remoteError);
      expect(remoteList).toHaveBeenCalledOnce();
      expect(localList).not.toHaveBeenCalled();
    });

    it("surfaces strict catalog persistence errors without changing other local-store defaults", () => {
      const strictKey = "strict-read-test";
      const bestEffortKey = "best-effort-read-test";
      const seed = [{ id: "seed", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }];
      const strictStore = createLocalStore({ key: strictKey, seed, persistence: "strict" });
      const bestEffortStore = createLocalStore({ key: bestEffortKey, seed });
      const browserStorage = window.localStorage;
      vi.stubGlobal("localStorage", {
        getItem: (key: string) => {
        if (key === `rivera:${strictKey}` || key === `rivera:${bestEffortKey}`) {
          throw new Error("storage access denied");
        }
          return browserStorage.getItem(key);
        },
        setItem: browserStorage.setItem.bind(browserStorage),
        removeItem: browserStorage.removeItem.bind(browserStorage),
        clear: browserStorage.clear.bind(browserStorage),
        key: browserStorage.key.bind(browserStorage),
        get length() { return browserStorage.length; },
      } satisfies Storage);

      expect(() => strictStore.list()).toThrow("storage access denied");
      expect(bestEffortStore.list()).toEqual(seed);
    });

    it("does not report a local product write as successful when persistence fails", async () => {
      const browserStorage = window.localStorage;
      vi.stubGlobal("localStorage", {
        getItem: browserStorage.getItem.bind(browserStorage),
        setItem: (key: string, value: string) => {
          if (key === "rivera:loopdev:catalog:items") throw new Error("catalog quota exceeded");
          browserStorage.setItem(key, value);
        },
        removeItem: browserStorage.removeItem.bind(browserStorage),
        clear: browserStorage.clear.bind(browserStorage),
        key: browserStorage.key.bind(browserStorage),
        get length() { return browserStorage.length; },
      } satisfies Storage);

      await expect(catalogAdapter.createCatalogItem({
        organizationId,
        catalogId: "catalog_products",
        name: "Unpersisted product",
        type: "physical_product",
      })).rejects.toThrow("catalog quota exceeded");
      expect(localCatalogItemsStore.list()).not.toContainEqual(expect.objectContaining({ name: "Unpersisted product" }));
    });
  });

  it("lists shared catalog items and workspace-visible items", async () => {
    const shared = await catalogAdapter.listCatalogItems({ organizationId });
    expect(shared.map((item) => item.key)).toEqual(["1", "4"]);

    const health = await catalogAdapter.listCatalogItems({ organizationId, workspaceId: "workspace-health" });
    expect(health.map((item) => item.key)).toEqual(["1", "2", "4"]);
  });

  it("keeps another organization's catalog invisible", async () => {
    await expect(catalogAdapter.listCatalogItems({ organizationId: "other-development-organization" }))
      .rejects.toMatchObject({ code: "forbidden" });
    await expect(catalogAdapter.getCatalogItem("catalog_item_other_org", { organizationId }))
      .resolves.toBeNull();
  });

  it("resolves stable keys and references without sector-specific fields", async () => {
    const resolved = await catalogAdapter.resolveReference({
      organizationId,
      reference: {
        productKey: "1",
        offerId: "catalog_offer_enterprise_annual",
        variantId: "catalog_variant_enterprise_25",
      },
    });
    expect(resolved).toMatchObject({
      item: { id: "catalog_item_enterprise_plan", type: "subscription", key: "1", sku: "10000000001" },
      offer: { key: "enterprise-annual", billingModel: "recurring" },
      variant: { key: "5", sku: "10000000005" },
      reference: { entityType: "catalog_item", entityId: "catalog_item_enterprise_plan" },
    });
  });

  it("resolves a previous product key preserved by identifier migration", async () => {
    const resolved = await catalogAdapter.resolveReference({
      organizationId,
      reference: { productKey: "enterprise-plan" },
    });

    expect(resolved).toMatchObject({
      item: { id: "catalog_item_enterprise_plan", key: "1" },
    });
  });

  it("exposes independent price books and entries through the same scope", async () => {
    const books = await catalogAdapter.listPriceBooks({ organizationId });
    const entries = await catalogAdapter.listPriceEntries({ organizationId, priceBookId: books[0].id });
    expect(books[0]).toMatchObject({ key: "default-eur", currency: "EUR" });
    expect(entries[0]).toMatchObject({ catalogItemId: "catalog_item_enterprise_plan", amount: 48000, status: "active" });
  });

  it("persists active status and supports archive, restore and delete", async () => {
    const created = await catalogAdapter.createCatalogItem({
      organizationId,
      catalogId: "catalog_products",
      name: "Physical lamp",
      type: "physical_product",
      status: "active",
      metadata: { barcode: "843000000001", material: "Steel" },
    });

    expect(created).toMatchObject({ key: "6", sku: "10000000006", status: "active" });

    const archived = await catalogAdapter.updateCatalogItem(created.id, { organizationId }, { status: "archived" });
    expect(archived.status).toBe("archived");
    await expect(catalogAdapter.getCatalogItem(created.id, { organizationId })).resolves.toBeNull();

    const restored = await catalogAdapter.updateCatalogItem(created.id, { organizationId }, { status: "draft" });
    expect(restored.status).toBe("draft");
    await catalogAdapter.deleteCatalogItem(created.id, { organizationId });
    await expect(catalogAdapter.getCatalogItem(created.id, { organizationId })).resolves.toBeNull();
  });

  it("generates numeric organization-scoped keys and SKUs and blocks user changes", async () => {
    const forgedInput = {
      organizationId,
      catalogId: "catalog_products",
      name: "Numeric key product one",
      type: "physical_product",
    } as const;
    const first = await catalogAdapter.createCatalogItem(Object.assign(forgedInput, { key: "900", sku: "USER-CHOSEN" }));
    const second = await catalogAdapter.createCatalogItem({
      organizationId,
      catalogId: "catalog_products",
      name: "Numeric key product two",
      type: "physical_product",
    });

    expect(first.key).toBe("6");
    expect(first.sku).toBe("10000000006");
    expect(second.key).toBe("7");
    expect(second.sku).toBe("10000000007");
    expect(first.key).toMatch(/^\d+$/);
    expect(first.sku).toMatch(/^\d+$/);
    await expect(catalogAdapter.updateCatalogItem(first.id, { organizationId }, Object.assign({ name: first.name }, { key: "900" })))
      .rejects.toMatchObject({ code: "conflict" });
    await expect(catalogAdapter.updateCatalogItem(first.id, { organizationId }, Object.assign({ name: first.name }, { sku: "900" })))
      .rejects.toMatchObject({ code: "conflict" });

    await catalogAdapter.deleteCatalogItem(second.id, { organizationId });
    const third = await catalogAdapter.createCatalogItem({
      organizationId,
      catalogId: "catalog_products",
      name: "Numeric key product three",
      type: "physical_product",
    });
    expect(third.key).toBe("8");
    expect(third.sku).toBe("10000000008");
  });

  it("lists service offering roles, availability and eligibility in the same scope", async () => {
    const roles = await catalogAdapter.listProductPartyRoles({
      organizationId,
      workspaceId: "workspace-health",
      catalogItemId: "catalog_item_health_consultation",
    });
    const availability = await catalogAdapter.listAvailabilities({
      organizationId,
      workspaceId: "workspace-health",
      catalogItemId: "catalog_item_health_consultation",
    });
    const eligibility = await catalogAdapter.listEligibilities({
      organizationId,
      workspaceId: "workspace-health",
      catalogItemId: "catalog_item_health_consultation",
    });

    expect(roles[0]).toMatchObject({ role: "provider", partyKey: "local-health-clinic" });
    expect(availability[0]).toMatchObject({ channels: ["Online", "Branch / office"], markets: ["Spain"] });
    expect(eligibility[0]).toMatchObject({ ruleKey: "open-access", status: "active" });
  });

  it("creates, updates and deletes commercial records", async () => {
    const category = await catalogAdapter.createProductReference({
      organizationId, kind: "category", key: "saas-plans", name: "SaaS plans", parentId: null,
    });
    const offer = await catalogAdapter.createOffer({
      organizationId, workspaceId: null, catalogItemId: "catalog_item_enterprise_plan",
      key: "enterprise-monthly", name: "Enterprise monthly", status: "draft",
      billingModel: "recurring", currency: "EUR", unit: "Month", validFrom: null, validTo: null, metadata: {},
    });
    expect((await catalogAdapter.updateOffer(offer.id, { organizationId }, { status: "active" })).status).toBe("active");
    await catalogAdapter.deleteOffer(offer.id, { organizationId });
    await expect(catalogAdapter.listOffers({ organizationId, catalogItemId: "catalog_item_enterprise_plan", includeArchived: true })).resolves.not.toContainEqual(expect.objectContaining({ id: offer.id }));

    const variant = await catalogAdapter.createVariant({
      organizationId, workspaceId: null, catalogItemId: "catalog_item_enterprise_plan",
      name: "50 seats", status: "draft", attributes: { seats: "50" }, metadata: { categoryKey: category.key },
    });
    expect(variant.key).toMatch(/^\d+$/);
    expect(variant.sku).toMatch(/^\d+$/);
    expect((await catalogAdapter.updateVariant(variant.id, { organizationId }, { status: "active" })).status).toBe("active");
    await catalogAdapter.deleteVariant(variant.id, { organizationId });

    const book = await catalogAdapter.createPriceBook({
      organizationId, workspaceId: null, key: "test-usd", name: "Test USD", currency: "USD",
      status: "active", validFrom: null, validTo: null, visibility: { organizationId, workspaceId: null },
    });
    const entry = await catalogAdapter.createPriceEntry({
      organizationId, workspaceId: null, priceBookId: book.id, catalogItemId: "catalog_item_enterprise_plan",
      offerId: null, variantId: null, amount: 99, currency: "USD", unit: "Month", status: "active",
      minQuantity: 1, maxQuantity: null, validFrom: null, validTo: null,
    });
    expect((await catalogAdapter.updatePriceEntry(entry.id, { organizationId }, { amount: 109 })).amount).toBe(109);
    await catalogAdapter.deletePriceEntry(entry.id, { organizationId });
    await catalogAdapter.deletePriceBook(book.id, { organizationId });
  });

  it("generates distinct numeric SKUs for products and variants and protects them from edits", async () => {
    const forgedInput = {
      organizationId,
      catalogId: "catalog_products",
      name: "SKU uniqueness test",
      type: "physical_product",
      status: "draft",
    } as const;
    const item = await catalogAdapter.createCatalogItem(Object.assign(forgedInput, { key: "manual-key", sku: "MIAU-TOY-01" }));

    const variant = await catalogAdapter.createVariant({
      organizationId,
      workspaceId: null,
      catalogItemId: item.id,
      name: "Duplicate SKU",
      status: "draft",
      attributes: { color: "Black", size: "S" },
      metadata: {},
    });
    expect(variant.sku).toMatch(/^\d+$/);
    expect(variant.sku).not.toBe(item.sku);
    expect(localCatalogItemsStore.get(item.id)?.sku).toBe("");
    await expect(catalogAdapter.updateVariant(variant.id, { organizationId }, Object.assign({ name: variant.name }, { sku: item.sku })))
      .rejects.toMatchObject({ code: "conflict" });
    await catalogAdapter.deleteVariant(variant.id, { organizationId });
    expect(localCatalogItemsStore.get(item.id)?.sku).toMatch(/^\d+$/);
  });

  it("creates organization-scoped category, brand and tag references", async () => {
    const parent = await catalogAdapter.createProductReference({
      organizationId,
      kind: "category",
      key: "pet-care",
      name: "Pet care",
      parentId: null,
    });
    const child = await catalogAdapter.createProductReference({
      organizationId,
      kind: "category",
      key: "toys",
      name: "Toys",
      parentId: parent.id,
    });
    const brand = await catalogAdapter.createProductReference({
      organizationId,
      kind: "brand",
      key: "miaucraft",
      name: "MiauCraft",
      parentId: null,
    });
    const tag = await catalogAdapter.createProductReference({
      organizationId,
      kind: "tag",
      key: "new-arrival",
      name: "New arrival",
      parentId: null,
    });

    expect(await catalogAdapter.listProductReferences({ organizationId, kind: "category" })).toContainEqual(
      expect.objectContaining({ id: child.id, key: "toys", parentId: parent.id }),
    );
    expect(await catalogAdapter.listProductReferences({ organizationId, kind: "brand" })).toContainEqual(
      expect.objectContaining({ id: brand.id, name: "MiauCraft" }),
    );
    expect(await catalogAdapter.listProductReferences({ organizationId, kind: "tag" })).toContainEqual(
      expect.objectContaining({ id: tag.id, key: "new-arrival" }),
    );
    await expect(catalogAdapter.createProductReference({
      organizationId, kind: "brand", key: "miaucraft", name: "Duplicate brand", parentId: null,
    })).rejects.toMatchObject({ code: "conflict" });
  });

  it("manages category trees with immutable keys, cycle guards and optimistic versions", async () => {
    const parent = await catalogAdapter.createProductReference({
      organizationId, kind: "category", key: "pet-care", name: "Pet care", parentId: null,
    });
    const child = await catalogAdapter.createProductReference({
      organizationId, kind: "category", key: "toys", name: "Toys", parentId: parent.id,
    });

    const renamed = await catalogAdapter.updateProductReference(child.id, { organizationId }, {
      expectedVersion: child.version,
      patch: { name: "Toys and play" },
    });
    expect(renamed).toMatchObject({ key: "toys", name: "Toys and play", version: 2 });
    await expect(catalogAdapter.updateProductReference(parent.id, { organizationId }, {
      expectedVersion: parent.version,
      patch: { parentId: child.id },
    })).rejects.toMatchObject({ code: "conflict" });
    await expect(catalogAdapter.updateProductReference(parent.id, { organizationId }, {
      expectedVersion: parent.version,
      patch: { status: "archived" },
    })).rejects.toMatchObject({ code: "conflict" });

    const archivedChild = await catalogAdapter.updateProductReference(child.id, { organizationId }, {
      expectedVersion: renamed.version,
      patch: { status: "archived" },
    });
    await expect(catalogAdapter.createCatalogItem({
      organizationId, name: "Archived category item", type: "physical_product", categoryKey: archivedChild.key,
    })).rejects.toMatchObject({ code: "invalid-scope" });
    const restoredChild = await catalogAdapter.updateProductReference(child.id, { organizationId }, {
      expectedVersion: archivedChild.version,
      patch: { status: "active" },
    });
    await expect(catalogAdapter.updateProductReference(child.id, { organizationId }, {
      expectedVersion: archivedChild.version,
      patch: { name: "Stale update" },
    })).rejects.toMatchObject({ code: "conflict" });
    expect(restoredChild.status).toBe("active");
  });

  it("keeps purchase cost separate and requires read plus manage permission to mutate", async () => {
    const item = await catalogAdapter.createCatalogItem({
      organizationId,
      catalogId: "catalog_products",
      name: "Cost test product",
      type: "physical_product",
      status: "draft",
    });

    const cost = await catalogAdapter.saveProductCostReference({
      organizationId,
      catalogItemId: item.id,
      variantId: null,
      amount: 12.5,
      currency: "EUR",
      expectedVersion: 0,
      idempotencyKey: "cost-test-create",
    });

    expect(cost).toMatchObject({ catalogItemId: item.id, amount: 12.5, currency: "EUR" });
    await expect(catalogAdapter.getProductCostReference({ organizationId, catalogItemId: item.id }))
      .resolves.toMatchObject({ id: cost.id, amount: 12.5 });
    await expect(catalogAdapter.getProductCostAccess({ organizationId }))
      .resolves.toEqual({ canRead: true, canManage: true });
    await expect(catalogAdapter.saveProductCostReference({
      organizationId,
      catalogItemId: item.id,
      variantId: null,
      amount: 12.5,
      currency: "EUR",
      expectedVersion: 0,
      idempotencyKey: "cost-test-create",
    })).resolves.toMatchObject({ id: cost.id, version: 1 });
    await expect(catalogAdapter.saveProductCostReference({
      organizationId,
      catalogItemId: item.id,
      variantId: null,
      amount: 13.25,
      currency: "EUR",
      expectedVersion: 1,
      idempotencyKey: "cost-test-update",
    })).resolves.toMatchObject({ id: cost.id, amount: 13.25, version: 2 });
    await expect(catalogAdapter.saveProductCostReference({
      organizationId,
      catalogItemId: item.id,
      variantId: null,
      amount: 13.25,
      currency: "EUR",
      expectedVersion: 1,
      idempotencyKey: "cost-test-update",
    })).resolves.toMatchObject({ id: cost.id, amount: 13.25, version: 2 });
    await expect(catalogAdapter.saveProductCostReference({
      organizationId,
      catalogItemId: item.id,
      variantId: null,
      amount: 14,
      currency: "EUR",
      expectedVersion: 1,
      idempotencyKey: "cost-test-stale",
    })).rejects.toMatchObject({ code: "conflict" });
    await expect(catalogAdapter.saveProductCostReference({
      organizationId,
      catalogItemId: item.id,
      variantId: null,
      amount: -1,
      currency: "EUR",
      expectedVersion: 2,
      idempotencyKey: "cost-test-invalid",
    })).rejects.toMatchObject({ code: "server-error" });
    await expect(catalogAdapter.saveProductCostReference({
      organizationId,
      catalogItemId: item.id,
      variantId: null,
      amount: 1.239,
      currency: "EUR",
      expectedVersion: 2,
      idempotencyKey: "cost-test-scale",
    })).rejects.toMatchObject({ code: "server-error" });
    await expect(catalogAdapter.getProductCostReference({
      organizationId: "other-development-organization",
      catalogItemId: item.id,
    })).rejects.toMatchObject({ code: "forbidden" });

    const permissionSpy = vi.spyOn(localPlatformAdapter, "hasPermission");
    try {
      permissionSpy.mockImplementation((permission) => permission === "catalog.cost.manage");
      await expect(catalogAdapter.getProductCostAccess({ organizationId }))
        .resolves.toEqual({ canRead: false, canManage: false });
      await expect(catalogAdapter.getProductCostReference({ organizationId, catalogItemId: item.id }))
        .rejects.toMatchObject({ code: "forbidden" });
      await expect(catalogAdapter.saveProductCostReference({
        organizationId,
        catalogItemId: item.id,
        variantId: null,
        amount: 15,
        currency: "EUR",
        expectedVersion: 2,
        idempotencyKey: "cost-manage-only",
      })).rejects.toMatchObject({ code: "forbidden" });

      permissionSpy.mockImplementation((permission) => permission === "catalog.cost.read");
      await expect(catalogAdapter.getProductCostAccess({ organizationId }))
        .resolves.toEqual({ canRead: true, canManage: false });
      await expect(catalogAdapter.getProductCostReference({ organizationId, catalogItemId: item.id }))
        .resolves.toMatchObject({ id: cost.id, amount: 13.25 });
      await expect(catalogAdapter.saveProductCostReference({
        organizationId,
        catalogItemId: item.id,
        variantId: null,
        amount: 15,
        currency: "EUR",
        expectedVersion: 2,
        idempotencyKey: "cost-read-only",
      })).rejects.toMatchObject({ code: "forbidden" });
    } finally {
      permissionSpy.mockRestore();
    }
  });
});
