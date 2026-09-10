import { beforeEach, describe, expect, it } from "vitest";
import { catalogAdapter } from "@/loopdev/domains/catalog";
import {
  localCatalogItemsStore,
  localCatalogOffersStore,
  localCatalogPriceBooksStore,
  localCatalogPriceEntriesStore,
  localCatalogVariantsStore,
} from "@/loopdev/domains/catalog/data/localCatalog";

const organizationId = "local-development-organization";

describe("local Catalog adapter", () => {
  beforeEach(() => {
    localCatalogItemsStore.reset();
    localCatalogOffersStore.reset();
    localCatalogPriceBooksStore.reset();
    localCatalogPriceEntriesStore.reset();
    localCatalogVariantsStore.reset();
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
});
