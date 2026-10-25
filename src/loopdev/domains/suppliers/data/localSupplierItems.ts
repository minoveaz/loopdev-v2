import { createLocalStore } from "@/lib/localStore";
import type { SupplierItemRecord } from "../types";

const organizationId = "local-development-organization";
const createdAt = "2026-10-25T00:00:00.000Z";

export const localSupplierItemsStore = createLocalStore<SupplierItemRecord>({
  key: "loopdev:erp:supplier-items",
  idPrefix: "supplier_item",
  seed: [
    {
      id: "supplier_item_iberica_kit",
      organizationId,
      supplierId: "supplier_iberica",
      supplierItemCode: "KIT-001",
      name: "Store starter kit",
      productId: "catalog_item_store_kit",
      variantId: null,
      purchaseUnit: "case",
      unitsPerStockUnit: 12,
      unitPrice: 48.5,
      currency: "EUR",
      minimumQuantity: 2,
      leadTimeDays: 7,
      status: "active",
      version: 1,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "supplier_item_northstar_component",
      organizationId,
      supplierId: "supplier_northstar",
      supplierItemCode: "NS-COMP-04",
      name: "Modular component",
      productId: null,
      variantId: null,
      purchaseUnit: "box",
      unitsPerStockUnit: 20,
      unitPrice: 16.75,
      currency: "USD",
      minimumQuantity: 5,
      leadTimeDays: 12,
      status: "draft",
      version: 1,
      createdAt,
      updatedAt: createdAt,
    },
  ],
});
