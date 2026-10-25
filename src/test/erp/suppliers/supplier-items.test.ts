import { beforeEach, describe, expect, it } from "vitest";
import { catalogAdapter } from "@/loopdev/domains/catalog/adapter";
import { localCatalogVariantsStore } from "@/loopdev/domains/catalog/data/localCatalog";
import { supplierItemAdapter } from "@/loopdev/domains/suppliers/adapter";
import { localSupplierItemsStore } from "@/loopdev/domains/suppliers/data/localSupplierItems";
import { isSupplierItemPurchasable } from "../../../../packages/contracts/src/suppliers";

const organizationId = "local-development-organization";
const supplierId = "supplier_iberica";

describe("Supplier assortment adapter", () => {
  beforeEach(() => {
    localSupplierItemsStore.reset();
  });

  it("creates unlinked drafts and hands product creation to the Products flow", async () => {
    const item = await supplierItemAdapter.addSupplierItem({
      organizationId,
      supplierId,
      supplierItemCode: "RAW-001",
      name: "Demo raw material",
      purchaseUnit: "box",
      unitsPerStockUnit: 12,
      unitPrice: 24,
      currency: "EUR",
    });

    expect(item.status).toBe("draft");
    expect(item.productId).toBeNull();
    expect(item.variantId).toBeNull();
    expect(isSupplierItemPurchasable(item, null)).toBe(false);
    await expect(supplierItemAdapter.listSupplierItems(supplierId, { organizationId })).resolves.toContainEqual(
      expect.objectContaining({ id: item.id, name: item.name }),
    );
    await expect(supplierItemAdapter.startProductCreationFromSupplierItem(item.id, { organizationId })).resolves.toMatchObject({
      supplierItemId: item.id,
      supplierId,
      name: item.name,
      supplierItemCode: item.supplierItemCode,
    });
  });

  it("links only a same-organization product and uses optimistic versions", async () => {
    const item = await supplierItemAdapter.addSupplierItem({
      organizationId,
      supplierId,
      name: "Linked demo material",
      purchaseUnit: "pack",
      unitsPerStockUnit: 4,
      currency: "EUR",
    });
    const catalog = await catalogAdapter.createCatalog({
      organizationId,
      key: `supplier-test-${Date.now()}`,
      name: "Supplier adapter test catalog",
      kind: "products",
    });
    const product = await catalogAdapter.createCatalogItem({
      organizationId,
      catalogId: catalog.id,
      name: "Supplier linked product",
      type: "physical_product",
    });
    const canonicalProductBeforeLink = await catalogAdapter.getCatalogItem(product.id, { organizationId });

    const linked = await supplierItemAdapter.linkSupplierItemToProduct(item.id, { organizationId }, {
      productId: product.id,
      expectedVersion: item.version,
    });
    expect(linked.productId).toBe(product.id);
    expect(linked.version).toBe(item.version + 1);
    expect(await catalogAdapter.getCatalogItem(product.id, { organizationId })).toEqual(canonicalProductBeforeLink);
    await expect(supplierItemAdapter.updateSupplierItem(item.id, { organizationId }, {
      name: "Stale update",
      expectedVersion: item.version,
    })).rejects.toMatchObject({ code: "conflict" });
    expect(isSupplierItemPurchasable({ ...linked, status: "active" }, organizationId)).toBe(true);

    const variant = localCatalogVariantsStore.create({
      organizationId,
      workspaceId: null,
      catalogItemId: product.id,
      key: "SUPPLIER-VARIANT-01",
      sku: "SUPPLIER-VARIANT-01",
      name: "Variant 01",
      status: "active",
      attributes: {},
      metadata: {},
    });
    const variantItem = await supplierItemAdapter.addSupplierItem({
      organizationId,
      supplierId,
      name: "Variant-linked material",
      purchaseUnit: "unit",
      unitsPerStockUnit: 1,
      currency: "EUR",
    });
    await expect(supplierItemAdapter.linkSupplierItemToProduct(variantItem.id, { organizationId }, {
      variantId: variant.id,
      expectedVersion: variantItem.version,
    })).resolves.toMatchObject({ variantId: variant.id, productId: null });
  });

  it("updates item details and commercial terms with version checks, then deactivates", async () => {
    const item = await supplierItemAdapter.addSupplierItem({
      organizationId,
      supplierId,
      name: "Material to update",
      purchaseUnit: "box",
      unitsPerStockUnit: 6,
      unitPrice: 20,
      currency: "EUR",
      minimumQuantity: 2,
      leadTimeDays: 5,
    });
    const updated = await supplierItemAdapter.updateSupplierItem(item.id, { organizationId }, {
      name: "Updated material",
      status: "active",
      expectedVersion: item.version,
    });
    expect(updated).toMatchObject({ name: "Updated material", status: "active", version: item.version + 1 });

    const terms = await supplierItemAdapter.updateSupplierItemTerms(item.id, { organizationId }, {
      purchaseUnit: "case",
      unitsPerStockUnit: 12,
      unitPrice: 32.5,
      currency: "USD",
      minimumQuantity: 3,
      leadTimeDays: 9,
      expectedVersion: updated.version,
    });
    expect(terms).toMatchObject({
      purchaseUnit: "case",
      unitsPerStockUnit: 12,
      unitPrice: 32.5,
      currency: "USD",
      minimumQuantity: 3,
      leadTimeDays: 9,
      version: updated.version + 1,
    });

    const inactive = await supplierItemAdapter.deactivateSupplierItem(item.id, { organizationId }, terms.version);
    expect(inactive).toMatchObject({ status: "inactive", version: terms.version + 1 });
    await expect(supplierItemAdapter.listSupplierItems(supplierId, { organizationId })).resolves.not.toContainEqual(
      expect.objectContaining({ id: item.id }),
    );
    await expect(supplierItemAdapter.listSupplierItems(supplierId, { organizationId, includeInactive: true })).resolves.toContainEqual(
      expect.objectContaining({ id: item.id, status: "inactive" }),
    );
  });

  it("rejects cross-organization links and duplicate supplier item codes", async () => {
    const item = await supplierItemAdapter.addSupplierItem({
      organizationId,
      supplierId,
      supplierItemCode: "DUPLICATE-CODE",
      name: "Duplicate candidate one",
      purchaseUnit: "unit",
      unitsPerStockUnit: 1,
      currency: "EUR",
    });
    await expect(supplierItemAdapter.addSupplierItem({
      organizationId,
      supplierId,
      supplierItemCode: "duplicate-code",
      name: "Duplicate candidate two",
      purchaseUnit: "unit",
      unitsPerStockUnit: 1,
      currency: "EUR",
    })).rejects.toMatchObject({ code: "conflict" });

    await expect(supplierItemAdapter.linkSupplierItemToProduct(item.id, { organizationId }, {
      productId: "catalog_item_other_org",
      expectedVersion: item.version,
    })).rejects.toMatchObject({ code: "invalid-scope" });
    expect(item.productId).toBeNull();
  });
});
