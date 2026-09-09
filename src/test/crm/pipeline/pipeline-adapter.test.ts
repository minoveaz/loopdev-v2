import { beforeEach, describe, expect, it } from "vitest";
import { localCrmOpportunitiesStore } from "@/loopdev/domains/crm/data/localOpportunities";
import { localCrmLeadsStore } from "@/loopdev/domains/crm/data/localLeads";
import { localLoopdevAdapter } from "@/loopdev/domains/crm/adapter/local";

const organizationId = "local-development-organization";

describe("Pipeline adapter contract", () => {
  beforeEach(() => {
    localCrmOpportunitiesStore.reset();
    localCrmLeadsStore.reset();
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

  it("keeps lead status codes separate from pipeline stages", async () => {
      const leads = await localLoopdevAdapter.crm.listLeads();
      expect(new Set(leads.map((lead) => lead.status))).toEqual(new Set(["new", "contacted", "qualified", "stalled", "inactive"]));
      expect(leads.every((lead) => !["prospecting", "proposal", "negotiation", "won", "lost"].includes(lead.status))).toBe(true);
  });

  it("converts qualified leads at qualified stage idempotently and supports multiple products", async () => {
      const lead = (await localLoopdevAdapter.crm.listLeads()).find((item) => item.status === "qualified");
      expect(lead).toBeDefined();
      if (!lead) return;

      const first = await localLoopdevAdapter.crm.createOpportunityFromLead(lead.id, {
        organizationId,
        productKey: "Enterprise Plan",
        name: "Enterprise Plan",
        amount: 1200,
        idempotencyKey: "conversion-1",
      });
      expect(first).toMatchObject({ status: "success", opportunity: {
        leadId: lead.id, productKey: "enterprise plan", origin: "lead_conversion", stageCode: "qualified",
        contact: { id: lead.contactId },
      } });
      if (first.status !== "success") return;

      const repeated = await localLoopdevAdapter.crm.createOpportunityFromLead(lead.id, {
        organizationId, productKey: " enterprise  plan ", name: "Different label",
      });
      expect(repeated).toMatchObject({ status: "success", opportunity: { id: first.opportunity.id } });

      const second = await localLoopdevAdapter.crm.createOpportunityFromLead(lead.id, {
        organizationId, productKey: "Premium support",
      });
      expect(second).toMatchObject({ status: "success", opportunity: { stageCode: "qualified", leadId: lead.id } });
      const otherLead = (await localLoopdevAdapter.crm.listLeads()).find((item) => item.status === "qualified" && item.id !== lead.id);
      expect(otherLead).toBeDefined();
      if (!otherLead) return;
      const idempotencyConflict = await localLoopdevAdapter.crm.createOpportunityFromLead(otherLead.id, {
        organizationId, productKey: "Different product", idempotencyKey: "conversion-1",
      });
      expect(idempotencyConflict).toMatchObject({ status: "conflict" });
      expect((await localLoopdevAdapter.crm.listLeads()).find((item) => item.id === lead.id)?.status).toBe("converted");
  });

  it("rejects non-qualified leads and never changes lead status when an opportunity is lost", async () => {
      const lead = (await localLoopdevAdapter.crm.listLeads()).find((item) => item.status === "new");
      expect(lead).toBeDefined();
      if (!lead) return;
      const rejected = await localLoopdevAdapter.crm.createOpportunityFromLead(lead.id, {
        organizationId, productKey: "Blocked product",
      });
      expect(rejected).toMatchObject({ status: "validation-error" });

      const qualified = (await localLoopdevAdapter.crm.listLeads()).find((item) => item.status === "qualified");
      expect(qualified).toBeDefined();
      if (!qualified) return;
      const converted = await localLoopdevAdapter.crm.createOpportunityFromLead(qualified.id, {
        organizationId, productKey: "Loss test",
      });
      expect(converted.status).toBe("success");
      if (converted.status !== "success") return;
      const moved = await localLoopdevAdapter.crm.moveOpportunityStage(converted.opportunity.id, {
        organizationId, stageCode: "lost", expectedUpdatedAt: converted.opportunity.updatedAt,
      });
      expect(moved.status).toBe("success");
      expect((await localLoopdevAdapter.crm.listLeads()).find((item) => item.id === qualified.id)?.status).toBe("converted");
  });
});
