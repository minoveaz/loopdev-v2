import { describe, expect, it } from "vitest";
import {
  erpProductActions,
  erpProductOperations,
  erpProductsCapabilityContract,
  erpProductStates,
} from "../../../packages/contracts/src/erp-products-capability";

describe("ERP Products capability contract", () => {
  it("declares one shared action for every product and category operation", () => {
    expect(erpProductActions.map(({ id }) => id)).toEqual(erpProductOperations);
    expect(erpProductsCapabilityContract.capabilities.flatMap(({ operations }) => operations))
      .toEqual(erpProductOperations);
  });

  it("uses canonical mutation permissions and retains the legacy permission only as compatibility", () => {
    expect(erpProductsCapabilityContract.permissions).toEqual(["catalog.read", "catalog.write"]);
    expect(erpProductsCapabilityContract.legacyPermissions).toEqual(["catalog.manage"]);
    expect(erpProductActions.filter(({ permission }) => permission === "catalog.write"))
      .toHaveLength(6);
  });

  it("keeps lifecycle, category, navigation and platform meaning shared", () => {
    expect(erpProductsCapabilityContract.lifecycle).toMatchObject({
      restoreProduct: "draft",
      restoreVariant: "draft",
      permanentDeletion: false,
    });
    expect(erpProductsCapabilityContract.categories).toMatchObject({
      scope: "organization",
      productCategoryAssignment: "independent",
      variantCategoryAssignment: "independent",
      preventCycles: true,
    });
    expect(erpProductsCapabilityContract.navigation.products).toBe("/app/erp/products");
    expect(erpProductsCapabilityContract.platforms.desktop_web.required).toBe(true);
    expect(erpProductsCapabilityContract.platforms.mobile_web.required).toBe(true);
    expect(erpProductStates).toContain("conflict");
    expect(erpProductStates).toContain("offline");
  });
});
