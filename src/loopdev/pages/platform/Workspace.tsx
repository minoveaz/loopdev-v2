import { Link } from "react-router-dom";
import { useMemo } from "react";
import { ArrowUpRight, Database, RefreshCw } from "lucide-react";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  PlatformActivityFeed,
  PlatformAttachmentsPanel,
  PlatformNotificationFeed,
  PlatformNotesPanel,
  PlatformRelationsPanel,
  PlatformTaskWorkspace,
  PlatformTimeline,
} from "@/loopdev/components/platform";
import {
  usePlatformActivities,
  usePlatformAttachments,
  usePlatformNotifications,
  usePlatformNotes,
  usePlatformTasks,
  usePlatformTimeline,
} from "@/loopdev/domains/platform";
import { platformAdapter } from "@/loopdev/domains/platform";
import type { EntityRef } from "@/loopdev/domains/platform";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

export default function PlatformWorkspace() {
  const { trail } = useBreadcrumbs();
  const { organizationId, workspaceId, brandId } = platformAdapter.getScope();
  const scope = useMemo(() => ({ organizationId, workspaceId, brandId }), [organizationId, workspaceId, brandId]);
  const contactRef: EntityRef<"contact"> = useMemo(() => ({
    entityType: "contact",
    entityId: "crm_cust_1",
    scope,
  }), [scope]);
  const leadRef: EntityRef<"lead"> = useMemo(() => ({
    entityType: "lead",
    entityId: "local-lead-crm_cust_1",
    scope,
  }), [scope]);
  const opportunityRef: EntityRef<"opportunity"> = useMemo(() => ({
    entityType: "opportunity",
    entityId: "crm_opp_1",
    scope,
  }), [scope]);
  const taskParams = { relation: contactRef, includeCompleted: true, limit: 50 };
  const { tasks, loading: tasksLoading, error: tasksError, forbidden: tasksForbidden, createTask, transitionTask, reload: reloadTasks } = usePlatformTasks(taskParams);
  const { notes, loading: notesLoading, error: notesError, forbidden: notesForbidden, createNote, updateNote } = usePlatformNotes({ relation: contactRef, limit: 50 });
  const { events, loading: timelineLoading, error: timelineError } = usePlatformTimeline({ relation: contactRef, limit: 50 });
  const { activities, loading: activitiesLoading, error: activitiesError } = usePlatformActivities({ relation: contactRef, limit: 50 });
  const { attachments, loading: attachmentsLoading, error: attachmentsError, createAttachment } = usePlatformAttachments({ relation: contactRef, limit: 50 });
  const { notifications, loading: notificationsLoading, error: notificationsError, markRead } = usePlatformNotifications({ recipientUserId: scope.organizationId === "local-development-organization" ? "local-development-user" : undefined, limit: 20 });

  return (
    <PageContainer width="wide" className="min-w-0">
      <PageHeader
        title="Platform work workspace"
        description="Tasks, Notes, Activities, Timeline and file signals for a CRM entity."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Platform workspace" }]}
        actions={<Button variant="outline" asChild><Link to="/app/sales-crm/contacts/crm_cust_1">Open Customer 360 <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>}
      />

      <DataCard className="mb-6" borderless>
        <div className="flex flex-wrap items-start gap-3">
          <div className="rounded-lg bg-primary-soft p-2 text-primary"><Database className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Local Platform adapter active</p>
            <p className="mt-1 text-sm text-muted-foreground">Scope: {scope.organizationId} / {scope.workspaceId}. Supabase, Storage and Auth remain pending by design.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={reloadTasks}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Refresh tasks</Button>
        </div>
      </DataCard>

      <div className="mb-6">
        <PlatformRelationsPanel references={[
          { label: "Contact", reference: contactRef, href: "/app/sales-crm/contacts/crm_cust_1" },
          { label: "Lead", reference: leadRef, href: "/app/sales-crm/leads" },
          { label: "Opportunity", reference: opportunityRef, href: "/app/sales-crm/opportunities" },
        ]} />
      </div>

      <PlatformTaskWorkspace
        tasks={tasks}
        loading={tasksLoading}
        error={tasksError}
        forbidden={tasksForbidden}
        relation={contactRef}
        onCreate={(input) => createTask({ ...input, scope, idempotencyKey: `workspace-task-${Date.now()}` })}
        onTransition={(task, status) => transitionTask(task.id, status, task.version)}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PlatformNotesPanel
          notes={notes}
          loading={notesLoading}
          error={notesError}
          forbidden={notesForbidden}
          relation={contactRef}
          onCreate={(body, visibility) => createNote({ scope, relation: contactRef, body, visibility, idempotencyKey: `workspace-note-${Date.now()}` })}
          onUpdate={(noteId, body, expectedVersion) => updateNote(noteId, { scope, body, expectedVersion })}
        />
        <PlatformTimeline events={events} loading={timelineLoading} error={timelineError} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PlatformActivityFeed activities={activities} loading={activitiesLoading} error={activitiesError} />
        <PlatformAttachmentsPanel
          attachments={attachments}
          loading={attachmentsLoading}
          error={attachmentsError}
          onUpload={(file) => createAttachment({ scope, relation: contactRef, ...file })}
        />
      </div>

      <div className="mt-6">
        <PlatformNotificationFeed notifications={notifications} loading={notificationsLoading} error={notificationsError} onMarkRead={(notification) => markRead(notification.id)} />
      </div>
    </PageContainer>
  );
}
