import { beforeEach, describe, expect, it } from "vitest";
import { localLoopdevAdapter } from "@/loopdev/domains/crm/adapter/local";
import { localCrmLeadsStore } from "@/loopdev/domains/crm/data/localLeads";
import { localCrmOpportunitiesStore } from "@/loopdev/domains/crm/data/localOpportunities";

const organizationId = "local-development-organization";

describe("CRM catalog references", () => {
  beforeEach(() => {
    localCrmLeadsStore.reset();
    localCrmOpportunitiesStore.reset();
  });

  it("resolves catalog references while keeping productKey compatibility", async () => {
    const lead = localCrmLeadsStore.list().find((item) => item.status === "qualified");
    expect(lead).toBeDefined();
    if (!lead) return;

    const result = await localLoopdevAdapter.crm.createOpportunityFromLead(lead.id, {
      organizationId,
      catalogItemId: "catalog_item_enterprise_plan",
      offerId: "catalog_offer_enterprise_annual",
      productKey: "enterprise-plan",
    });

    expect(result).toMatchObject({
      status: "success",
      opportunity: {
        productKey: "enterprise-plan",
        catalogItemId: "catalog_item_enterprise_plan",
        offerId: "catalog_offer_enterprise_annual",
        variantId: null,
      },
    });
  });
});
