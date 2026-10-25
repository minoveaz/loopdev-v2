import { beforeEach, describe, expect, it } from "vitest";
import { localCatalogAdapter as catalogAdapter } from "@/loopdev/domains/catalog";
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
    localProductReferencesStore.reset();
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

  it("keeps purchase cost separate and limits cost reads to product writers", async () => {
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
    });

    expect(cost).toMatchObject({ catalogItemId: item.id, amount: 12.5, currency: "EUR" });
    await expect(catalogAdapter.getProductCostReference({ organizationId, catalogItemId: item.id }))
      .resolves.toMatchObject({ id: cost.id, amount: 12.5 });
    await expect(catalogAdapter.saveProductCostReference({
      organizationId,
      catalogItemId: item.id,
      variantId: null,
      amount: -1,
      currency: "EUR",
    })).rejects.toMatchObject({ code: "server-error" });
    await expect(catalogAdapter.getProductCostReference({
      organizationId: "other-development-organization",
      catalogItemId: item.id,
    })).rejects.toMatchObject({ code: "forbidden" });
  });
});
