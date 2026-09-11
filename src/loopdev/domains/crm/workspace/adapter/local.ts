import { loopdevAdapter } from "../../adapter";
import { platformAdapter } from "@/loopdev/domains/platform";
import type { EntityRef } from "@/loopdev/domains/platform";
import type { CRMWorkspaceAdapter, CRMWorkspaceContext } from "../types";

function scopeFor(context: CRMWorkspaceContext) {
  return {
    organizationId: context.organizationId,
    workspaceId: context.workspaceId,
    brandId: null,
  };
}

function contactRef(context: CRMWorkspaceContext, contactId: string): EntityRef<"contact"> {
  return {
    entityType: "contact",
    entityId: contactId,
    scope: scopeFor(context),
  };
}

export const localCrmWorkspaceAdapter: CRMWorkspaceAdapter = {
  async getWorkspace(context, contactId) {
    const customer360 = await loopdevAdapter.crm.getCustomer360(contactId);
    if (!customer360) return null;

    const relation = contactRef(context, contactId);
    const [taskPage, notePage, timelinePage] = await Promise.all([
      platformAdapter.work.listTasks({ relation, includeCompleted: true, limit: 25 }),
      platformAdapter.work.listNotes({ relation, limit: 25 }),
      platformAdapter.work.listTimeline({ relation, limit: 25 }),
    ]);

    return {
      contact: customer360.contact,
      leads: customer360.leads,
      opportunities: customer360.opportunities,
      tasks: taskPage.items,
      notes: notePage.items,
      timeline: timelinePage.items,
      permissions: {
        canRead: platformAdapter.hasPermission("crm.read", scopeFor(context)),
        canWrite: platformAdapter.hasPermission("work.write", scopeFor(context)),
        canAssign: platformAdapter.hasPermission("work.assign", scopeFor(context)),
      },
    };
  },

  createTask(context, input) {
    return platformAdapter.work.createTask({
      ...input,
      ...scopeFor(context),
    });
  },

  createNote(context, input) {
    return platformAdapter.work.createNote({
      ...input,
      ...scopeFor(context),
    });
  },

  updateLead(context, leadId, input) {
    return loopdevAdapter.crm.updateLead(leadId, {
      ...input,
      organizationId: context.organizationId,
    });
  },

  assignTask(context, taskId, assignedUserId, expectedVersion) {
    return platformAdapter.work.assignTask(taskId, assignedUserId, expectedVersion, scopeFor(context));
  },
};
