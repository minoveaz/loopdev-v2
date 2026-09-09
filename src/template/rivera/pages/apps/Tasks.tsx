import { useMemo, useState } from "react";
import {
  CheckCircle2, Circle, ListChecks, MoreHorizontal, Pencil, Plus, Trash2,
} from "lucide-react";
import { ConfirmDialog, DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { projectsStore, tasksStore, usersStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatDate, getInitials } from "@/lib/formatters";
import type { Task, TaskStatus } from "@/types";
import { TaskDialog, type TaskDraft } from "@/template/rivera/features/tasks/TaskDialog";
import { TASK_STATUSES, priorityTone, taskStatusTone } from "@/template/rivera/features/tasks/shared";

type DueFilter = "all" | "overdue" | "today" | "7d" | "none";

function isOverdue(t: Task) {
  return !!t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== "done";
}
function isToday(d: string) {
  const a = new Date(d);
  const b = new Date();
  return a.toDateString() === b.toDateString();
}
function within(d: string, days: number) {
  const ms = new Date(d).getTime() - Date.now();
  return ms >= 0 && ms <= days * 86400000;
}

export default function TasksPage() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const tasks = useLocalStore(tasksStore);
  const projects = useLocalStore(projectsStore);
  const users = useLocalStore(usersStore);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState<string[]>([]);
  const [priorityF, setPriorityF] = useState<string[]>([]);
  const [assigneeF, setAssigneeF] = useState<string[]>([]);
  const [dueF, setDueF] = useState<DueFilter>("all");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (statusF.length && !statusF.includes(t.status)) return false;
      if (priorityF.length && !priorityF.includes(t.priority)) return false;
      if (assigneeF.length) {
        if (assigneeF.includes("__unassigned")) {
          if (t.assigneeId && !assigneeF.includes(t.assigneeId)) return false;
        } else if (!t.assigneeId || !assigneeF.includes(t.assigneeId)) return false;
      }
      if (dueF !== "all") {
        if (dueF === "none" && t.dueDate) return false;
        if (dueF === "overdue" && !isOverdue(t)) return false;
        if (dueF === "today" && !(t.dueDate && isToday(t.dueDate))) return false;
        if (dueF === "7d" && !(t.dueDate && within(t.dueDate, 7))) return false;
      }
      return true;
    });
  }, [tasks, search, statusF, priorityF, assigneeF, dueF]);

  const stats = useMemo(() => ({
    total: tasks.length,
    open: tasks.filter((t) => t.status !== "done").length,
    overdue: tasks.filter(isOverdue).length,
    done: tasks.filter((t) => t.status === "done").length,
  }), [tasks]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((t) => selected.has(t.id));
  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((t) => next.add(t.id));
        return next;
      });
    }
  };
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const buildPayload = (d: TaskDraft): Partial<Task> => ({
    title: d.title,
    description: d.description || undefined,
    projectId: d.projectId,
    assigneeId: d.assigneeId || undefined,
    status: d.status,
    priority: d.priority,
    dueDate: d.dueDate ? new Date(d.dueDate).toISOString() : undefined,
    tags: d.tags.split(",").map((s) => s.trim()).filter(Boolean),
  });

  const handleCreate = (d: TaskDraft) => {
    tasksStore.create({ ...(buildPayload(d) as Omit<Task, "id" | "createdAt" | "updatedAt">), checklist: [0, 0] });
    setCreateOpen(false);
    toast({ title: "Task created", description: d.title });
  };
  const handleEdit = (d: TaskDraft) => {
    if (!editing) return;
    tasksStore.update(editing.id, buildPayload(d));
    setEditing(null);
    toast({ title: "Task updated" });
  };
  const handleDelete = () => {
    if (!deleting) return;
    tasksStore.remove(deleting.id);
    setDeleting(null);
  };

  const toggleComplete = (t: Task) => {
    const next: TaskStatus = t.status === "done" ? "todo" : "done";
    tasksStore.update(t.id, { status: next });
  };

  const bulkSetStatus = (status: TaskStatus) => {
    selected.forEach((id) => tasksStore.update(id, { status }));
    toast({ title: `${selected.size} task${selected.size === 1 ? "" : "s"} updated`, description: `Status set to ${status.replace("_", " ")}.` });
    setSelected(new Set());
  };
  const bulkDelete = () => {
    selected.forEach((id) => tasksStore.remove(id));
    toast({ title: `${selected.size} task${selected.size === 1 ? "" : "s"} deleted` });
    setSelected(new Set());
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Apps"
        title="Tasks"
        description="Stay on top of work across every project."
        breadcrumbs={trail.length ? trail : [{ label: "Apps" }, { label: "Tasks" }]}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New task
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total" value={String(stats.total)} icon={ListChecks} accent="primary" compact />
        <StatCard label="Open" value={String(stats.open)} accent="info" compact />
        <StatCard label="Overdue" value={String(stats.overdue)} accent="gold" compact />
        <StatCard label="Completed" value={String(stats.done)} accent="success" compact />
      </div>

      <div className="mt-6">
        <DataCard
          title={`Tasks (${filtered.length})`}
          description="Filter, search, sort, and bulk-update."
          flush
          action={
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={search} onValueChange={setSearch} placeholder="Search tasks…" size="sm" containerClassName="w-56" />
              <FilterDropdown
                label="Status" multiple value={statusF} onChange={setStatusF} size="sm" align="end"
                options={TASK_STATUSES.map((s) => ({ label: s.label, value: s.key }))}
              />
              <FilterDropdown
                label="Priority" multiple value={priorityF} onChange={setPriorityF} size="sm" align="end"
                options={[
                  { label: "Low", value: "low" }, { label: "Medium", value: "medium" },
                  { label: "High", value: "high" }, { label: "Urgent", value: "urgent" },
                ]}
              />
              <FilterDropdown
                label="Assignee" multiple value={assigneeF} onChange={setAssigneeF} size="sm" align="end"
                options={[
                  { label: "Unassigned", value: "__unassigned" },
                  ...users.map((u) => ({ label: u.name, value: u.id })),
                ]}
              />
              <FilterDropdown
                label="Due" value={dueF} onChange={(v) => setDueF(v as DueFilter)} size="sm" align="end" icon="none"
                options={[
                  { label: "Any", value: "all" },
                  { label: "Overdue", value: "overdue" },
                  { label: "Due today", value: "today" },
                  { label: "Next 7 days", value: "7d" },
                  { label: "No due date", value: "none" },
                ]}
              />
            </div>
          }
        >
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-primary-soft/40 px-5 py-2.5 text-sm">
              <span className="font-medium text-foreground">{selected.size} selected</span>
              <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">Set status</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {TASK_STATUSES.map((s) => (
                      <DropdownMenuItem key={s.key} onClick={() => bulkSetStatus(s.key)}>{s.label}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
                <Button size="sm" variant="destructive" onClick={bulkDelete} className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={ListChecks}
                title="No tasks match your filters"
                description="Try clearing filters or create a new task."
                action={<Button size="sm" onClick={() => setCreateOpen(true)}>New task</Button>}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-10 px-5 py-3">
                      <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAll} />
                    </th>
                    <th className="px-2 py-3"></th>
                    <th className="px-2 py-3 font-medium">Task</th>
                    <th className="px-3 py-3 font-medium">Project</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Priority</th>
                    <th className="px-3 py-3 font-medium">Assignee</th>
                    <th className="px-3 py-3 font-medium">Due</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((t) => {
                    const isDone = t.status === "done";
                    const proj = projectMap.get(t.projectId);
                    const assignee = t.assigneeId ? userMap.get(t.assigneeId) : undefined;
                    const overdue = isOverdue(t);
                    return (
                      <tr key={t.id} className="transition-fast hover:bg-muted/50">
                        <td className="px-5 py-3">
                          <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggleOne(t.id)} />
                        </td>
                        <td className="px-2 py-3">
                          <button
                            onClick={() => toggleComplete(t)}
                            className="text-muted-foreground transition-fast hover:text-success"
                            aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                          >
                            {isDone ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5" />}
                          </button>
                        </td>
                        <td className="px-2 py-3">
                          <p className={`font-medium ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.title}</p>
                          {t.tags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {t.tags.map((tag) => (
                                <span key={tag} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{tag}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{proj?.name ?? "—"}</td>
                        <td className="px-3 py-3"><StatusBadge tone={taskStatusTone[t.status]}>{t.status.replace("_", " ")}</StatusBadge></td>
                        <td className="px-3 py-3"><StatusBadge tone={priorityTone[t.priority]} dot>{t.priority}</StatusBadge></td>
                        <td className="px-3 py-3">
                          {assignee ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 border border-border"><AvatarFallback className="bg-primary-soft text-[10px] font-semibold text-primary">{getInitials(assignee.name)}</AvatarFallback></Avatar>
                              <span className="text-foreground">{assignee.name}</span>
                            </div>
                          ) : <span className="text-muted-foreground">Unassigned</span>}
                        </td>
                        <td className={`px-3 py-3 ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                          {t.dueDate ? formatDate(t.dueDate) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => setEditing(t)}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleComplete(t)}>
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> {isDone ? "Mark incomplete" : "Mark complete"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleting(t)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </DataCard>
      </div>

      <TaskDialog open={createOpen} onOpenChange={setCreateOpen} projects={projects} users={users} onSubmit={handleCreate} />
      <TaskDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} task={editing} projects={projects} users={users} onSubmit={handleEdit} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        tone="destructive"
        title="Delete task?"
        description={deleting?.title}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}
