import { beforeEach, describe, expect, it } from "vitest";
import { localCrmAutomationsAdapter } from "@/loopdev/domains/crm/automations";
import {
  localCrmAutomationsStore,
  localCrmEventsStore,
  localCrmExecutionLogStore,
} from "@/loopdev/domains/crm/automations";
import { localOrganizationEntitlementsStore } from "@/loopdev/domains/platform";
import { localPlatformTasksStore } from "@/loopdev/domains/platform/data/localWork";

const organizationId = "local-development-organization";

describe("CRM local automations", () => {
  beforeEach(() => {
    localCrmAutomationsStore.reset();
    localCrmEventsStore.reset();
    localCrmExecutionLogStore.reset();
    localPlatformTasksStore.reset();
    localOrganizationEntitlementsStore.reset();
  });

  it("executes a matching action once and returns the prior result for duplicate events", async () => {
    const automation = await localCrmAutomationsAdapter.create({
      organizationId,
      name: "Qualified lead task",
      trigger: { eventType: "lead.status_changed", conditions: { status: "qualified" } },
      actions: [{ type: "create_task", payload: { title: "Call qualified lead" } }],
    });
    const input = {
      organizationId,
      type: "lead.status_changed" as const,
      entityType: "lead" as const,
      entityId: "lead-1",
      payload: { status: "qualified" },
      idempotencyKey: "event-1",
    };
    const first = await localCrmAutomationsAdapter.emitEvent(input);
    const duplicate = await localCrmAutomationsAdapter.emitEvent(input);

    expect(first.duplicate).toBe(false);
    expect(first.executions).toHaveLength(1);
    expect(first.executions[0]).toMatchObject({ automationId: automation.id, status: "succeeded", actionCount: 1 });
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.executions).toHaveLength(1);
    expect(localPlatformTasksStore.list().filter((task) => task.title === "Call qualified lead")).toHaveLength(1);
  });

  it("does not execute when trigger conditions do not match and records matching executions", async () => {
    await localCrmAutomationsAdapter.create({
      organizationId,
      name: "Won deal note",
      trigger: { eventType: "opportunity.stage_changed", conditions: { stage: "won" } },
      actions: [{ type: "create_note", payload: { body: "Won deal" } }],
    });
    const result = await localCrmAutomationsAdapter.emitEvent({
      organizationId,
      type: "opportunity.stage_changed",
      entityType: "opportunity",
      entityId: "opp-1",
      payload: { stage: "proposal" },
      idempotencyKey: "event-2",
    });
    expect(result.executions).toHaveLength(0);
    expect(await localCrmAutomationsAdapter.listExecutionLog({ organizationId })).toHaveLength(0);
  });
});
