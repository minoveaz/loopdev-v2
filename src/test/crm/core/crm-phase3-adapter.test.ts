import { beforeEach, describe, expect, it } from "vitest";
import { localLoopdevAdapter } from "@/loopdev/domains/crm/adapter/local";
import { localCrmLeadsStore } from "@/loopdev/domains/crm/data/localLeads";
import { localCrmOpportunitiesStore, localCrmOpportunityLinesStore } from "@/loopdev/domains/crm/data/localOpportunities";
import { localCrmStageHistoryStore } from "@/loopdev/domains/crm/data/localStageHistory";

const organizationId = "local-development-organization";

describe("CRM phase 3 local contracts", () => {
  beforeEach(() => {
    localCrmLeadsStore.reset();
    localCrmOpportunitiesStore.reset();
    localCrmOpportunityLinesStore.reset();
    localCrmStageHistoryStore.reset();
  });

  it("creates a manual catalog-backed opportunity with an extensible line", async () => {
    const result = await localLoopdevAdapter.crm.createOpportunity({
      organizationId,
      contactId: "crm_cust_1",
      name: "Manual enterprise opportunity",
      catalogItemId: "catalog_item_enterprise_plan",
      lines: [{ catalogItemId: "catalog_item_enterprise_plan", quantity: 2, unitAmount: 1000 }],
    });

    expect(result).toMatchObject({
      status: "success",
      opportunity: {
        origin: "manual",
        catalogItemId: "catalog_item_enterprise_plan",
        lines: [{ quantity: 2, catalogItemId: "catalog_item_enterprise_plan" }],
      },
    });
  });

  it("rejects direct changes from terminal stages and reopens with a reason", async () => {
    const won = (await localLoopdevAdapter.crm.listOpportunities({ organizationId })).find((item) => item.stageCode === "won");
    expect(won).toBeDefined();
    if (!won) return;

    const direct = await localLoopdevAdapter.crm.moveOpportunityStage(won.id, {
      organizationId,
      stageCode: "proposal",
      expectedUpdatedAt: won.updatedAt,
    });
    expect(direct).toMatchObject({ status: "validation-error" });

    const reopened = await localLoopdevAdapter.crm.reopenOpportunity(won.id, {
      organizationId,
      expectedUpdatedAt: won.updatedAt,
      reason: "Customer requested a revised proposal",
      stageCode: "proposal",
    });
    expect(reopened).toMatchObject({ status: "success", opportunity: { stageCode: "proposal" } });
  });

  it("preserves append-only stage history and lead conversion relationships", async () => {
    const lead = (await localLoopdevAdapter.crm.listLeads()).find((item) => item.status === "qualified");
    expect(lead).toBeDefined();
    if (!lead) return;

    const conversion = await localLoopdevAdapter.crm.createOpportunityFromLead(lead.id, {
      organizationId,
      productKey: "legacy-product",
    });
    expect(conversion.status).toBe("success");
    if (conversion.status !== "success") return;

    const history = await localLoopdevAdapter.crm.listOpportunityStageHistory(conversion.opportunity.id);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ fromStageCode: null, toStageCode: "qualified" });
    expect((await localLoopdevAdapter.crm.listLeads()).find((item) => item.id === lead.id)?.status).toBe("converted");
  });
});
