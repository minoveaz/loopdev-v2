import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Circle, ExternalLink,
  ListChecks, Plus, Settings2, Siren,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DataCard, DataTable, FilterDropdown, PageContainer, PageHeader, SearchInput,
  StatCard, StatusBadge, type DataTableAction, type DataTableColumn,
} from "@/components/common";
import { AppDrawer } from "@/components/platform";
import { Button } from "@/components/ui/button";
import { PlatformTaskForm } from "@/loopdev/components/platform";
import { CRMRecordPicker, type CRMRecordPickerItem } from "@/loopdev/components/crm/CRMRecordPicker";
import { platformAdapter, usePlatformTaskTemplates, usePlatformTasks } from "@/loopdev/domains/platform";
import type { EntityRef, TaskPriority, TaskRecord, TaskStatus } from "@/loopdev/domains/platform";
import { useCrmContacts, useCrmLeads, useCrmPipeline } from "@/loopdev/domains/crm/hooks/use-crm";
import { contactName } from "@/loopdev/domains/crm/adapter";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { cn } from "@/lib/utils";

const CURRENT_USER_ID = "local-development-user";
type TaskView = "all" | "mine" | "urgent" | "calendar";

const priorityTone: Record<TaskPriority, "neutral" | "info" | "warning" | "gold"> = {
  low: "neutral",
  normal: "info",
  high: "warning",
  urgent: "gold",
};

const statusLabel: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function isOverdue(task: TaskRecord) {
  return Boolean(task.dueAt && new Date(task.dueAt).getTime() < Date.now()
    && task.status !== "completed" && task.status !== "cancelled");
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

export default function CRMTasks() {
  const { trail } = useBreadcrumbs();
  const { organizationId, workspaceId, brandId } = platformAdapter.getScope();
  const [relationKey, setRelationKey] = useState("");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskFormKey, setTaskFormKey] = useState(0);
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [editingTask, setEditingTask] = useState(false);
  const [taskEditFormKey, setTaskEditFormKey] = useState(0);
  const [view, setView] = useState<TaskView>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const taskCreateTriggerRef = useRef<HTMLButtonElement>(null);
  const taskFormDirtyRef = useRef(false);
  const taskEditDirtyRef = useRef(false);
  const { contacts } = useCrmContacts({ limit: 100 });
  const { leads } = useCrmLeads();
  const { opportunities } = useCrmPipeline();
  const crmRelations = useMemo<CRMRecordPickerItem[]>(() => [
    ...contacts.map((contact) => ({
      type: "contact" as const,
      id: contact.id,
      label: `Contact · ${contactName(contact)}`,
    })),
    ...leads.map((lead) => {
      const contact = contacts.find((item) => item.id === lead.contactId);
      return {
        type: "lead" as const,
        id: lead.id,
        label: `Lead · ${contact ? contactName(contact) : lead.id}`,
      };
    }),
    ...opportunities.map((opportunity) => ({
      type: "opportunity" as const,
      id: opportunity.id,
      label: `Opportunity · ${opportunity.name}`,
    })),
  ], [contacts, leads, opportunities]);
  useEffect(() => {
    if (crmRelations.length && !crmRelations.some((item) => `${item.type}:${item.id}` === relationKey)) {
      setRelationKey(`${crmRelations[0].type}:${crmRelations[0].id}`);
    }
  }, [crmRelations, relationKey]);
  const relation = useMemo(() => {
    const selected = crmRelations.find((item) => `${item.type}:${item.id}` === relationKey) ?? crmRelations[0];
    return {
      entityType: selected?.type ?? "contact",
      entityId: selected?.id ?? "",
      scope: { organizationId, workspaceId, brandId },
    } as EntityRef<"contact" | "lead" | "opportunity">;
  }, [brandId, crmRelations, organizationId, relationKey, workspaceId]);
  const tasks = usePlatformTasks({
    organizationId,
    workspaceId,
    brandId,
    relationTypes: ["contact", "lead", "opportunity"],
    includeCompleted: true,
    limit: 100,
  });
  const taskTemplates = usePlatformTaskTemplates();
  const relationLabels = useMemo(
    () => new Map(crmRelations.map((item) => [`${item.type}:${item.id}`, item.label])),
    [crmRelations],
  );
  const stats = useMemo(() => ({
    total: tasks.tasks.length,
    open: tasks.tasks.filter((task) => task.status !== "completed" && task.status !== "cancelled").length,
    overdue: tasks.tasks.filter(isOverdue).length,
    urgent: tasks.tasks.filter((task) => task.priority === "urgent" || isOverdue(task)).length,
  }), [tasks.tasks]);
  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.tasks.filter((task) => {
      const relationLabel = relationLabels.get(`${task.relation.entityType}:${task.relation.entityId}`) ?? "";
      if (query && !`${task.title} ${task.description ?? ""} ${relationLabel}`.toLowerCase().includes(query)) return false;
      if (statusFilter.length && !statusFilter.includes(task.status)) return false;
      if (priorityFilter.length && !priorityFilter.includes(task.priority)) return false;
      if (view === "mine" && task.assignedUserId !== CURRENT_USER_ID) return false;
      if (view === "urgent" && task.priority !== "urgent" && !isOverdue(task)) return false;
      return true;
    });
  }, [priorityFilter, relationLabels, search, statusFilter, tasks.tasks, view]);
  const columns: DataTableColumn<TaskRecord>[] = useMemo(() => [
    {
      key: "title",
      header: "Task",
      sortable: true,
      cell: (task) => (
        <div className="min-w-[220px]">
          <p className={cn("font-medium", (task.status === "completed" || task.status === "cancelled") && "text-muted-foreground line-through")}>{task.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{relationLabels.get(`${task.relation.entityType}:${task.relation.entityId}`) ?? `${task.relation.entityType} · ${task.relation.entityId}`}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (task) => <StatusBadge tone={task.status === "completed" ? "success" : task.status === "in_progress" ? "info" : "neutral"}>{statusLabel[task.status]}</StatusBadge>,
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      cell: (task) => <StatusBadge tone={priorityTone[task.priority]} dot>{task.priority}</StatusBadge>,
    },
    {
      key: "assignedUserId",
      header: "Assignee",
      cell: (task) => <span className="text-sm">{task.assignedUserId === CURRENT_USER_ID ? "You" : task.assignedUserId ?? "Unassigned"}</span>,
    },
    {
      key: "dueAt",
      header: "Due",
      sortable: true,
      sortAccessor: (task) => task.dueAt ? new Date(task.dueAt) : null,
      cell: (task) => <span className={cn("whitespace-nowrap text-sm", isOverdue(task) && "font-medium text-destructive")}>{task.dueAt ? new Date(task.dueAt).toLocaleDateString() : "No due date"}</span>,
    },
  ], [relationLabels]);
  const rowActions: DataTableAction<TaskRecord>[] = useMemo(() => [
    { label: "Open details", onClick: (task) => setSelectedTask(task) },
    {
      label: "Mark complete",
      icon: CheckCircle2,
      hidden: (task) => task.status === "completed" || task.status === "cancelled",
      onClick: (task) => void tasks.transitionTask(task.id, "completed", task.version),
    },
    {
      label: "Reopen",
      icon: Circle,
      hidden: (task) => task.status !== "completed" && task.status !== "cancelled",
      onClick: (task) => void tasks.transitionTask(task.id, "open", task.version),
    },
  ], [tasks]);
  const calendarDays = useMemo(() => {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(monthStart);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [cursor]);
  const tasksByDay = useMemo(() => {
    const grouped = new Map<string, TaskRecord[]>();
    visibleTasks.filter((task) => task.dueAt).forEach((task) => {
      const key = dateKey(new Date(task.dueAt!));
      grouped.set(key, [...(grouped.get(key) ?? []), task]);
    });
    return grouped;
  }, [visibleTasks]);

  return (
    <PageContainer width="wide">
      <PageHeader
        title="CRM tasks"
        description="Follow-up work associated with Contacts, Leads and Opportunities."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Tasks" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/app/sales-crm/task-templates"><Settings2 className="mr-1.5 h-3.5 w-3.5" />Task templates</Link>
            </Button>
            <Button onClick={(event) => { taskCreateTriggerRef.current = event.currentTarget; setTaskFormKey((key) => key + 1); setCreateTaskOpen(true); }}><Plus className="mr-1.5 h-3.5 w-3.5" />New task</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total tasks" value={String(stats.total)} icon={ListChecks} accent="primary" compact />
        <StatCard label="Open" value={String(stats.open)} icon={Circle} accent="info" compact />
        <StatCard label="Overdue" value={String(stats.overdue)} icon={CalendarDays} accent="gold" compact />
        <StatCard label="Urgent" value={String(stats.urgent)} icon={Siren} accent="accent" compact />
      </div>

      <div className="mt-6 flex max-w-full items-center gap-1 overflow-x-auto border-b border-border">
        {([
          ["all", "All tasks"],
          ["mine", "My tasks"],
          ["urgent", "Urgent & overdue"],
          ["calendar", "Calendar"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={cn("border-b-2 px-3 py-2.5 text-sm font-medium transition-colors", view === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            {label}
          </button>
        ))}
      </div>

      {view !== "calendar" ? (
        <DataCard className="mt-4" flush>
          <DataTable
            data={visibleTasks}
            columns={columns}
            rowActions={rowActions}
            onRowClick={(task) => setSelectedTask(task)}
            loading={tasks.loading}
            emptyIcon={ListChecks}
            emptyTitle={view === "mine" ? "No tasks assigned to you" : "No CRM tasks match"}
            emptyDescription="Try clearing filters or create a new follow-up task."
            toolbar={
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput value={search} onValueChange={setSearch} placeholder="Search tasks or CRM records..." size="sm" containerClassName="w-full sm:w-64" />
                <FilterDropdown label="Status" multiple value={statusFilter} onChange={setStatusFilter} size="sm" options={Object.entries(statusLabel).map(([value, label]) => ({ value, label }))} />
                <FilterDropdown label="Priority" multiple value={priorityFilter} onChange={setPriorityFilter} size="sm" options={(["low", "normal", "high", "urgent"] as TaskPriority[]).map((value) => ({ value, label: value }))} />
              </div>
            }
            initialSort={{ key: "dueAt", dir: "asc" }}
            initialPageSize={10}
          />
        </DataCard>
      ) : (
        <DataCard className="mt-4 overflow-hidden" flush>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
              <div className="inline-flex items-center rounded-lg border border-border bg-card">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <h2 className="font-display text-lg font-semibold">{cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
            </div>
            <SearchInput value={search} onValueChange={setSearch} placeholder="Search calendar..." size="sm" containerClassName="w-56" />
          </div>
          <div className="overflow-x-auto">
          <div className="min-w-[640px]">
          <div className="grid grid-cols-7 border-b border-border bg-card-muted text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day} className="px-2 py-2">{day}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const dayTasks = tasksByDay.get(dateKey(day)) ?? [];
              const inMonth = day.getMonth() === cursor.getMonth();
              return (
                <div key={dateKey(day)} className={cn("min-h-[112px] border-b border-r border-border p-2", !inMonth && "bg-card-muted/40 text-muted-foreground")}>
                  <span className={cn("inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold", isSameDay(day, new Date()) && "bg-primary text-primary-foreground")}>{day.getDate()}</span>
                  <div className="mt-1 space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <button key={task.id} type="button" onClick={() => setSelectedTask(task)} className="block w-full truncate rounded bg-primary-soft px-1.5 py-1 text-left text-[11px] font-medium text-primary hover:bg-primary/20">{task.title}</button>
                    ))}
                    {dayTasks.length > 3 && <p className="px-1 text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
          </div>
        </DataCard>
      )}

      <AppDrawer
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        title="New CRM task"
        description="Create follow-up work and associate it with a Contact, Lead or Opportunity."
        restoreFocusRef={taskCreateTriggerRef}
        size="md"
        layoutMode="standard"
        responsive="auto"
        dirty={() => taskFormDirtyRef.current}
        confirmOnClose
        onDiscard={() => { taskFormDirtyRef.current = false; }}
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateTaskOpen(false)}>Cancel</Button>
            <Button type="submit" form="create-crm-task-form" disabled={tasks.loading}>Create task</Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label htmlFor="crm-task-relation" className="text-sm font-medium">Related CRM record</label>
            <CRMRecordPicker
              value={relationKey}
              onValueChange={(value) => { setRelationKey(value); taskFormDirtyRef.current = true; }}
              items={crmRelations}
              placeholder="Search contacts, leads or opportunities..."
            />
          </div>
          <PlatformTaskForm
            key={taskFormKey}
            formId="create-crm-task-form"
            showSubmitButton={false}
            canAssign={platformAdapter.hasPermission("work.assign")}
            relation={relation}
            templates={taskTemplates.templates}
            onDirtyChange={(dirty) => { taskFormDirtyRef.current = dirty; }}
            onSubmit={async (input) => {
              await tasks.createTask({
                ...input,
                scope: { organizationId, workspaceId, brandId },
                idempotencyKey: `crm-task-${Date.now()}`,
              });
              taskFormDirtyRef.current = false;
              setCreateTaskOpen(false);
            }}
          />
        </div>
      </AppDrawer>

      <AppDrawer
        open={Boolean(selectedTask)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
            setEditingTask(false);
            taskEditDirtyRef.current = false;
          }
        }}
        title={editingTask ? "Edit task" : selectedTask?.title ?? "Task"}
        description={selectedTask ? `${selectedTask.relation.entityType} · ${selectedTask.relation.entityId}` : undefined}
        size="md"
        layoutMode="standard"
        responsive="auto"
        dirty={() => taskEditDirtyRef.current}
        confirmOnClose={editingTask}
        onDiscard={() => { taskEditDirtyRef.current = false; }}
        footer={selectedTask ? (
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" onClick={() => { setSelectedTask(null); setEditingTask(false); }}>Close</Button>
            {editingTask ? (
              <Button type="submit" form="edit-crm-task-form" disabled={tasks.loading}>Save changes</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setTaskEditFormKey((key) => key + 1); setEditingTask(true); }}>Edit task</Button>
                {selectedTask.relation.entityType === "contact" && (
                  <Button asChild>
                    <a href={`/app/sales-crm/contacts/${selectedTask.relation.entityId}`}>
                      Open CRM record <ExternalLink className="ml-1.5 h-4 w-4" />
                    </a>
                  </Button>
                )}
              </>
            )}
          </div>
        ) : undefined}
      >
        {selectedTask && editingTask ? (
          <PlatformTaskForm
            key={`${selectedTask.id}-${taskEditFormKey}`}
            task={selectedTask}
            relation={selectedTask.relation}
            templates={taskTemplates.templates}
            formId="edit-crm-task-form"
            showSubmitButton={false}
            canAssign={selectedTask.permissions.canAssign}
            onDirtyChange={(dirty) => { taskEditDirtyRef.current = dirty; }}
            onSubmit={async (input) => {
              const { relation: _relation, assignedUserId, ...taskFields } = input;
              const updated = await tasks.updateTask(selectedTask.id, {
                ...taskFields,
                expectedVersion: selectedTask.version,
                scope: { organizationId, workspaceId, brandId },
              });
              const next = assignedUserId === undefined || assignedUserId === selectedTask.assignedUserId
                ? updated
                : await tasks.assignTask(updated.id, assignedUserId, updated.version);
              setSelectedTask(next);
              taskEditDirtyRef.current = false;
              setEditingTask(false);
            }}
          />
        ) : selectedTask && (
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
