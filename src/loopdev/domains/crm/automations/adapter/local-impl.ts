import { platformAdapter } from "@/loopdev/domains/platform";
import {
  localCrmAutomationsStore,
  localCrmEventsStore,
  localCrmExecutionLogStore,
} from "../data/localAutomations";
import type {
  CRMAutomation,
  CRMAutomationsAdapter,
  CRMCreateAutomationInput,
  CRMEmitEventInput,
  CRMEvent,
  CRMEventDispatchResult,
  CRMExecutionLogParams,
} from "../types";

const LOCAL_WORKSPACE_ID = "local-workspace";
const LOCAL_USER_ID = "local-development-user";

function matchesConditions(event: CRMEvent, conditions: CRMAutomation["trigger"]["conditions"]): boolean {
  return Object.entries(conditions ?? {}).every(([key, expected]) => event.payload[key] === expected);
}

function sameEventType(left: string, right: string): boolean {
  return left.replace(/^crm\./, "") === right.replace(/^crm\./, "");
}

function relation(event: CRMEvent) {
  const scope = {
    organizationId: event.organizationId,
    workspaceId: LOCAL_WORKSPACE_ID,
    brandId: null,
  };
  return { entityType: event.entityType, entityId: event.entityId, scope };
}

function entitlementPermission(organizationId: string): void {
  platformAdapter.entitlements.assertPermission(organizationId, "entitlements.write");
}

async function executeAction(event: CRMEvent, action: CRMAutomation["actions"][number]): Promise<void> {
  const payload = action.payload;
  if (action.type === "create_task") {
    const title = typeof payload.title === "string" ? payload.title : "Follow up on CRM automation";
    await platformAdapter.work.createTask({
      organizationId: event.organizationId,
      workspaceId: LOCAL_WORKSPACE_ID,
      title,
      description: typeof payload.description === "string" ? payload.description : null,
      priority: payload.priority === "low" || payload.priority === "high" || payload.priority === "urgent" ? payload.priority : "normal",
      assignedUserId: typeof payload.assignedUserId === "string" ? payload.assignedUserId : null,
      relation: relation(event),
    });
  } else if (action.type === "create_note") {
    await platformAdapter.work.createNote({
      organizationId: event.organizationId,
      workspaceId: LOCAL_WORKSPACE_ID,
      body: typeof payload.body === "string" ? payload.body : "CRM automation note",
      relation: relation(event),
      visibility: "team",
    });
  } else {
    await platformAdapter.work.recordActivity({
      organizationId: event.organizationId,
      workspaceId: LOCAL_WORKSPACE_ID,
      actorId: LOCAL_USER_ID,
      actorType: "system",
      origin: "system",
      sourceType: "automation",
      sourceId: event.id,
      type: "notification",
      summary: typeof payload.summary === "string" ? payload.summary : "CRM automation executed",
      relation: relation(event),
    });
  }
}

export const localCrmAutomationsAdapter: CRMAutomationsAdapter = {
  async list(organizationId) {
    platformAdapter.entitlements.assertPermission(organizationId, "entitlements.read");
    return localCrmAutomationsStore.list().filter((item) => item.organizationId === organizationId);
  },

  async create(input: CRMCreateAutomationInput) {
    entitlementPermission(input.organizationId);
    const entitlement = platformAdapter.entitlements;
    entitlement.assertCanUse(input.organizationId, "crm.automations", 1);
    const current = localCrmAutomationsStore.list().filter((item) => item.organizationId === input.organizationId);
    const limit = entitlement.get(input.organizationId, "crm.automations")?.limit;
    if (limit !== null && limit !== undefined && current.length >= limit) {
      throw new Error("The organization automation limit has been reached.");
    }
    if (!input.name.trim() || input.actions.length === 0) throw new Error("An automation needs a name and at least one action.");
    return localCrmAutomationsStore.create({
      organizationId: input.organizationId,
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      active: input.active ?? true,
      trigger: input.trigger,
      actions: input.actions,
    });
  },

  async update(id, organizationId, patch) {
    entitlementPermission(organizationId);
    const existing = localCrmAutomationsStore.get(id);
    if (!existing || existing.organizationId !== organizationId) return null;
    return localCrmAutomationsStore.update(id, patch) ?? null;
  },

  async remove(id, organizationId) {
    entitlementPermission(organizationId);
    const existing = localCrmAutomationsStore.get(id);
    return Boolean(existing && existing.organizationId === organizationId && localCrmAutomationsStore.remove(id));
  },

  async emitEvent(input: CRMEmitEventInput): Promise<CRMEventDispatchResult> {
    entitlementPermission(input.organizationId);
    const key = input.idempotencyKey.trim();
    if (!key) throw new Error("An idempotency key is required for CRM automation events.");
    const priorEvent = localCrmEventsStore.list().find((event) => event.organizationId === input.organizationId && event.idempotencyKey === key);
    if (priorEvent) {
      return {
        event: priorEvent,
        executions: localCrmExecutionLogStore.list().filter((log) => log.eventId === priorEvent.id),
        duplicate: true,
      };

    }
    platformAdapter.entitlements.assertCanUse(input.organizationId, "crm.automation.executions", 1);
    const event = localCrmEventsStore.create({
      organizationId: input.organizationId,
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload ?? {},
      idempotencyKey: key,
      occurredAt: input.occurredAt ?? new Date().toISOString(),
    });
    const executions: ReturnType<typeof localCrmExecutionLogStore.create>[] = [];
    for (const automation of localCrmAutomationsStore.list().filter((item) => item.organizationId === input.organizationId && item.active && sameEventType(item.trigger.eventType, event.type) && matchesConditions(event, item.trigger.conditions))) {
      const startedAt = new Date().toISOString();
      let status: "succeeded" | "failed" = "succeeded";
      let error: string | null = null;
      let actionCount = 0;
      try {
        for (const action of automation.actions) {
          await executeAction(event, action);
          actionCount += 1;
        }
      } catch (cause) {
        status = "failed";
        error = cause instanceof Error ? cause.message : "Automation action failed.";
      }
      executions.push(localCrmExecutionLogStore.create({
        organizationId: input.organizationId,
        automationId: automation.id,
        eventId: event.id,
        idempotencyKey: key,
        status,
        actionCount,
        error,
        startedAt,
        completedAt: new Date().toISOString(),
      }));
    }
    platformAdapter.entitlements.consume(input.organizationId, "crm.automation.executions", 1);
    return { event, executions, duplicate: false };
  },

  async listExecutionLog(params: CRMExecutionLogParams) {
    platformAdapter.entitlements.assertPermission(params.organizationId, "entitlements.read");
    return localCrmExecutionLogStore.list()
      .filter((log) => log.organizationId === params.organizationId)
      .filter((log) => !params.automationId || log.automationId === params.automationId)
      .filter((log) => !params.eventId || log.eventId === params.eventId)
      .slice(0, params.limit ?? 100);
  },
};
