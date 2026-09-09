import { beforeEach, describe, expect, it } from "vitest";
import { localCrmOpportunitiesStore } from "@/loopdev/domains/crm/data/localOpportunities";
import { localLoopdevAdapter } from "@/loopdev/domains/crm/adapter/local";

const organizationId = "local-development-organization";

describe("Pipeline adapter contract", () => {
  beforeEach(() => {
    localCrmOpportunitiesStore.reset();
  });

  it("lists tenant-scoped opportunities with typed pipeline fields", async () => {
    const opportunities = await localLoopdevAdapter.crm.listOpportunities({ organizationId });

    expect(opportunities).toHaveLength(6);
    expect(opportunities[0]).toMatchObject({
      organizationId,
      stageCode: expect.any(String),
      amount: expect.any(Number),
      currency: expect.any(String),
      contact: { id: expect.any(String), displayName: expect.any(String) },
      owner: { id: expect.any(String), displayName: expect.any(String) },
      probability: expect.any(Number),
      updatedAt: expect.any(String),
      archivedAt: null,
    });
  });
  it("rejects reads from another organization", async () => {
    await expect(localLoopdevAdapter.crm.listOpportunities({ organizationId: "other-organization" }))
      .rejects.toMatchObject({ code: "forbidden" });
  });

  it("moves a stage and returns a conflict for stale expectedUpdatedAt", async () => {
    const [opportunity] = await localLoopdevAdapter.crm.listOpportunities({ organizationId });
    const moved = await localLoopdevAdapter.crm.moveOpportunityStage(opportunity.id, {
      organizationId,
      stageCode: "negotiation",
      expectedUpdatedAt: opportunity.updatedAt,
    });

    expect(moved).toMatchObject({
      status: "success",
      opportunity: { id: opportunity.id, stageCode: "negotiation" },
    });
    if (moved.status !== "success") return;

    const conflict = await localLoopdevAdapter.crm.moveOpportunityStage(opportunity.id, {
      organizationId,
      stageCode: "won",
      expectedUpdatedAt: opportunity.updatedAt,
    });
    expect(conflict).toMatchObject({
      status: "conflict",
      opportunity: { id: opportunity.id, stageCode: "negotiation" },
    });
  });
});
