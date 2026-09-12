import { beforeEach, describe, expect, it } from "vitest";
import { localLoopdevAdapter } from "@/loopdev/domains/crm/adapter/local";
import { localCustomerProductsStore } from "@/loopdev/domains/crm/data/localCustomerProducts";

describe("local Customer Product adapter", () => {
  beforeEach(() => {
    localCustomerProductsStore.reset();
  });

  it("persists a contractual association with CRM source references", async () => {
    const created = await localLoopdevAdapter.crm.createCustomerProduct({
      organizationId: "local-development-organization",
      contactId: "crm_cust_1",
      catalogItemId: "catalog_item_enterprise_plan",
      offerId: "catalog_offer_enterprise_annual",
      variantId: "catalog_variant_enterprise_25",
      quantity: 3,
      unitAmount: 16000,
      totalAmount: 48000,
      currency: "EUR",
      sourceOpportunityId: "crm_opp_1",
      sourceLeadId: null,
      status: "active",
    });

    expect(created).toMatchObject({
      contactId: "crm_cust_1",
      quantity: 3,
      totalAmount: 48000,
      sourceOpportunityId: "crm_opp_1",
      status: "active",
    });
    await expect(localLoopdevAdapter.crm.listCustomerProducts("crm_cust_1")).resolves.toContainEqual(created);
  });

  it("rejects invalid quantities", async () => {
    await expect(localLoopdevAdapter.crm.createCustomerProduct({
      organizationId: "local-development-organization",
      contactId: "crm_cust_1",
      catalogItemId: "catalog_item_enterprise_plan",
      quantity: 0,
      status: "interested",
    })).rejects.toThrow("Quantity must be greater than zero.");
  });
});
