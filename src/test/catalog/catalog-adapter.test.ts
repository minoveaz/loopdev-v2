import { beforeEach, describe, expect, it } from "vitest";
import { localCatalogAdapter as catalogAdapter } from "@/loopdev/domains/catalog";
import {
  localCatalogItemsStore,
  localCatalogOffersStore,
  localCatalogPriceBooksStore,
  localCatalogPriceEntriesStore,
  localCatalogVariantsStore,
  localCatalogPartyRolesStore,
  localCatalogAvailabilitiesStore,
  localCatalogEligibilitiesStore,
} from "@/loopdev/domains/catalog/data/localCatalog";

const organizationId = "local-development-organization";

describe("local Catalog adapter", () => {
  beforeEach(() => {
    localCatalogItemsStore.reset();
    localCatalogOffersStore.reset();
    localCatalogPriceBooksStore.reset();
    localCatalogPriceEntriesStore.reset();
    localCatalogVariantsStore.reset();
    localCatalogPartyRolesStore.reset();
    localCatalogAvailabilitiesStore.reset();
    localCatalogEligibilitiesStore.reset();
  });

  it("lists shared catalog items and workspace-visible items", async () => {
    const shared = await catalogAdapter.listCatalogItems({ organizationId });
    expect(shared.map((item) => item.key)).toEqual(["enterprise-plan", "advisory-package"]);

    const health = await catalogAdapter.listCatalogItems({ organizationId, workspaceId: "workspace-health" });
    expect(health.map((item) => item.key)).toEqual(["enterprise-plan", "health-consultation", "advisory-package"]);
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
        productKey: "enterprise-plan",
        offerId: "catalog_offer_enterprise_annual",
        variantId: "catalog_variant_enterprise_25",
      },
    });
    expect(resolved).toMatchObject({
      item: { id: "catalog_item_enterprise_plan", type: "subscription", key: "enterprise-plan", sku: "SAAS-ENTERPRISE" },
      offer: { key: "enterprise-annual", billingModel: "recurring" },
      variant: { key: "enterprise-25-seats" },
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
      key: "physical-lamp",
      sku: "LAMP-001",
      name: "Physical lamp",
      type: "physical_product",
      status: "active",
      metadata: { barcode: "843000000001", material: "Steel" },
    });

    expect(created).toMatchObject({ key: "physical-lamp", sku: "LAMP-001", status: "active" });

    const archived = await catalogAdapter.updateCatalogItem(created.id, { organizationId }, { status: "archived" });
    expect(archived.status).toBe("archived");
    await expect(catalogAdapter.getCatalogItem(created.id, { organizationId })).resolves.toBeNull();

    const restored = await catalogAdapter.updateCatalogItem(created.id, { organizationId }, { status: "draft" });
    expect(restored.status).toBe("draft");
    await catalogAdapter.deleteCatalogItem(created.id, { organizationId });
    await expect(catalogAdapter.getCatalogItem(created.id, { organizationId })).resolves.toBeNull();
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
      key: "enterprise-50-seats", sku: "ENT-50", name: "50 seats", status: "draft", attributes: { seats: "50" }, metadata: {},
    });
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
});
