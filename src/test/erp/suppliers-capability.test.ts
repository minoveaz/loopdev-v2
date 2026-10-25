import { describe, expect, it } from "vitest";
import {
  isSupplierItemPurchasable,
  supplierAssortmentOperations,
  supplierP2POperations,
  supplierOperations,
  supplierStates,
} from "../../../packages/contracts/src/suppliers";
import {
  supplierActions,
  supplierCapabilityContract,
} from "../../../packages/contracts/src/suppliers-capability";

describe("ERP Suppliers capability contract", () => {
  it("uses a dedicated Supplier permission and navigation entry", () => {
    expect(supplierCapabilityContract.permissions).toEqual({
      read: "supplier.read",
      manage: "supplier.manage",
    });
    expect(supplierCapabilityContract.navigation.directory).toBe("/app/erp/suppliers");
    expect(supplierCapabilityContract.platforms.desktop_web.required).toBe(true);
    expect(supplierCapabilityContract.platforms.mobile_web.required).toBe(true);
  });

  it("keeps the shared operation and state catalogs stable", () => {
    expect(supplierCapabilityContract.operations).toEqual(supplierOperations);
    expect(supplierCapabilityContract.assortmentOperations).toEqual(supplierAssortmentOperations);
    expect(supplierCapabilityContract.p2pOperations).toEqual(supplierP2POperations);
    expect(supplierCapabilityContract.labels).toEqual(supplierActions.map(({ id, label }) => ({ id, label })));
    expect(supplierStates).toContain("conflict");
    expect(supplierStates).toContain("forbidden");
  });

  it("keeps sensitive P2P values out of shared projections and offline work", () => {
    expect(supplierCapabilityContract.p2p).toMatchObject({
      taxValuesExposed: false,
      payeeValuesExposed: false,
      sensitiveValuesMayBeQueuedOffline: false,
      sensitiveValuesMayBeLogged: false,
      verificationRequiresDifferentOwnerOrAdmin: true,
      materialPayeeChangeRevokesVerification: true,
    });
    expect(supplierCapabilityContract.assortment).toEqual({
      productCreation: "catalog-owner-handoff",
      canonicalProductMutatedBySupplierItemOperations: false,
      draftOffersOrderEligible: false,
    });
  });

  it("only allows active offers with a same-scope Product/variant link and positive conversion", () => {
    const base = {
      id: "offer-1",
      organizationId: "org-1",
      supplierId: "supplier-1",
      supplierItemCode: null,
      name: "Paper",
      productId: "product-1",
      variantId: null,
      purchaseUnit: "box",
      unitsPerStockUnit: 10,
      unitPrice: null,
      currency: "EUR",
      minimumQuantity: null,
      leadTimeDays: null,
      status: "active" as const,
      version: 1,
      createdAt: "",
      updatedAt: "",
    };

    expect(isSupplierItemPurchasable(base, "org-1")).toBe(true);
    expect(isSupplierItemPurchasable(base, "org-2")).toBe(false);
    expect(isSupplierItemPurchasable({ ...base, productId: null, variantId: null }, "org-1")).toBe(false);
    expect(isSupplierItemPurchasable({ ...base, variantId: "variant-1" }, "org-1")).toBe(false);
    expect(isSupplierItemPurchasable({ ...base, unitsPerStockUnit: 0 }, "org-1")).toBe(false);
    expect(isSupplierItemPurchasable({ ...base, status: "draft" }, "org-1")).toBe(false);
  });
});
