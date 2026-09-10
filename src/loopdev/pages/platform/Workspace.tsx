import { useMemo, useState } from "react";
import { ListChecks, ExternalLink } from "lucide-react";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { AppDrawer } from "@/components/platform";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PlatformTaskWorkspace } from "@/loopdev/components/platform";
import { platformAdapter, usePlatformTasks } from "@/loopdev/domains/platform";
import type { EntityRef, TaskRecord } from "@/loopdev/domains/platform";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

const CRM_RELATIONS = [
  { type: "contact", id: "crm_cust_1", label: "Contact · Helena Park" },
  { type: "lead", id: "local-lead-crm_cust_1", label: "Lead · Helena Park" },
  { type: "opportunity", id: "crm_opp_1", label: "Opportunity · Renewal options" },
] as const;

export default function CRMTasks() {
  const { trail } = useBreadcrumbs();
  const { organizationId, workspaceId, brandId } = platformAdapter.getScope();
  const [relationKey, setRelationKey] = useState("contact:crm_cust_1");
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const relation = useMemo(() => {
    const selected = CRM_RELATIONS.find((item) => `${item.type}:${item.id}` === relationKey) ?? CRM_RELATIONS[0];
    return {
      entityType: selected.type,
      entityId: selected.id,
      scope: { organizationId, workspaceId, brandId },
    } as EntityRef<"contact" | "lead" | "opportunity">;
  }, [brandId, organizationId, relationKey, workspaceId]);
  const tasks = usePlatformTasks({
    organizationId,
    workspaceId,
    brandId,
    relationTypes: ["contact", "lead", "opportunity"],
    includeCompleted: true,
    limit: 100,
  });

  return (
    <PageContainer width="wide">
      <PageHeader
        title="CRM tasks"
        description="Follow-up work associated with Contacts, Leads and Opportunities."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Tasks" }]}
      />

      <DataCard className="mb-6" borderless>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary-soft p-2 text-primary">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">CRM task queue</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This view only includes tasks related to CRM records. Create new tasks from a Contact, Lead or Opportunity.
            </p>
          </div>
        </div>
      </DataCard>

      <DataCard className="mb-6" title="New CRM task" description="Choose the record that this follow-up belongs to.">
        <div className="max-w-xl space-y-2">
          <Label htmlFor="crm-task-relation">Related CRM record</Label>
          <select
            id="crm-task-relation"
            value={relationKey}
            onChange={(event) => setRelationKey(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {CRM_RELATIONS.map((item) => (
              <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>{item.label}</option>
            ))}
          </select>
        </div>
      </DataCard>

      <PlatformTaskWorkspace
        tasks={tasks.tasks}
        loading={tasks.loading}
        error={tasks.error}
        forbidden={tasks.forbidden}
        relation={relation}
        onCreate={(input) => tasks.createTask({
          ...input,
          scope: { organizationId, workspaceId, brandId },
          idempotencyKey: `crm-task-${Date.now()}`,
        })}
        onTransition={(task, status) => tasks.transitionTask(task.id, status, task.version)}
        onOpen={setSelectedTask}
      />

      <AppDrawer
        open={Boolean(selectedTask)}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
        title={selectedTask?.title ?? "Task"}
        description={selectedTask ? `${selectedTask.relation.entityType} · ${selectedTask.relation.entityId}` : undefined}
        size="md"
        footer={selectedTask ? (
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedTask(null)}>Close</Button>
            {selectedTask.relation.entityType === "contact" && (
              <Button asChild>
                <a href={`/app/sales-crm/contacts/${selectedTask.relation.entityId}`}>
                  Open CRM record <ExternalLink className="ml-1.5 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        ) : undefined}
      >
        {selectedTask && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-primary-soft px-2.5 py-1 text-primary">{selectedTask.status.replace("_", " ")}</span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{selectedTask.priority} priority</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{selectedTask.description || "No description provided."}</p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">Related record</dt><dd className="mt-1 text-sm font-medium">{selectedTask.relation.entityType} · {selectedTask.relation.entityId}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Due date</dt><dd className="mt-1 text-sm font-medium">{selectedTask.dueAt ? new Date(selectedTask.dueAt).toLocaleDateString() : "No due date"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Assigned to</dt><dd className="mt-1 text-sm font-medium">{selectedTask.assignedUserId || "Unassigned"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Updated</dt><dd className="mt-1 text-sm font-medium">{new Date(selectedTask.updatedAt).toLocaleString()}</dd></div>
            </dl>
          </div>
        )}
      </AppDrawer>
    </PageContainer>
  );
}
