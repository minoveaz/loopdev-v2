import { useMemo, useState, type DragEvent } from "react";
import {
  CalendarClock, MoreHorizontal, MoveRight, Pencil, Plus, Trash2,
} from "lucide-react";
import {
  ConfirmDialog, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge,
} from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { projectsStore, tasksStore, usersStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import { formatDate, getInitials } from "@/lib/formatters";
import type { Task, TaskStatus } from "@/types";
import { TaskDialog, type TaskDraft } from "@/features/tasks/TaskDialog";
import { TASK_STATUSES, priorityTone, taskStatusTone } from "@/features/tasks/shared";

const KANBAN_COLUMNS: { key: TaskStatus; label: string; accent: string }[] = [
  { key: "backlog", label: "Backlog", accent: "bg-muted text-muted-foreground" },
  { key: "todo", label: "To-do", accent: "bg-primary-soft text-primary" },
  { key: "in_progress", label: "In Progress", accent: "bg-info-soft text-info" },
  { key: "review", label: "Review", accent: "bg-gold-soft text-gold" },
  { key: "done", label: "Done", accent: "bg-success-soft text-success" },
];

function isOverdue(t: Task) {
  return !!t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== "done";
}

export default function KanbanPage() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const tasks = useLocalStore(tasksStore);
  const projects = useLocalStore(projectsStore);
  const users = useLocalStore(usersStore);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const [search, setSearch] = useState("");
  const [projectF, setProjectF] = useState<string[]>([]);
  const [priorityF, setPriorityF] = useState<string[]>([]);

  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [createStatus, setCreateStatus] = useState<TaskStatus | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (projectF.length && !projectF.includes(t.projectId)) return false;
      if (priorityF.length && !priorityF.includes(t.priority)) return false;
      return true;
    });
  }, [tasks, search, projectF, priorityF]);

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    KANBAN_COLUMNS.forEach((c) => map.set(c.key, []));
    // Show "blocked" tasks under Backlog visually
    visible.forEach((t) => {
      const col = t.status === "blocked" ? "backlog" : t.status;
      if (!map.has(col)) map.set(col, []);
      map.get(col)!.push(t);
    });
    return map;
  }, [visible]);

  const moveTask = (id: string, target: TaskStatus) => {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.status === target) return;
    tasksStore.update(id, { status: target });
    toast({ title: "Task moved", description: `→ ${TASK_STATUSES.find((s) => s.key === target)?.label ?? target}` });
  };

  const onDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOverCol = (e: DragEvent<HTMLDivElement>, col: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== col) setDragOverCol(col);
  };
  const onDrop = (e: DragEvent<HTMLDivElement>, col: TaskStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    if (id) moveTask(id, col);
    setDragOverCol(null);
    setDraggingId(null);
  };
  const onDragEnd = () => { setDragOverCol(null); setDraggingId(null); };

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
    setCreateStatus(null);
    toast({ title: "Task created", description: d.title });
  };
  const handleEdit = (d: TaskDraft) => {
    if (!editing) return;
    tasksStore.update(editing.id, buildPayload(d));
    setEditing(null);
  };
  const handleDelete = () => {
    if (!deleting) return;
    tasksStore.remove(deleting.id);
    setDeleting(null);
  };

  return (
    <PageContainer width="wide" className="max-w-[1600px]">
      <PageHeader
        eyebrow="Apps"
        title="Kanban"
        description="Drag cards between columns or use the menu to move them."
        breadcrumbs={trail.length ? trail : [{ label: "Apps" }, { label: "Kanban" }]}
        actions={
          <Button onClick={() => setCreateStatus("todo")} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New task
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search tasks…" size="sm" containerClassName="w-56" />
        <FilterDropdown
          label="Project" multiple value={projectF} onChange={setProjectF} size="sm" align="end"
          options={projects.map((p) => ({ label: p.name, value: p.id }))}
        />
        <FilterDropdown
          label="Priority" multiple value={priorityF} onChange={setPriorityF} size="sm" align="end"
          options={[
            { label: "Low", value: "low" }, { label: "Medium", value: "medium" },
            { label: "High", value: "high" }, { label: "Urgent", value: "urgent" },
          ]}
        />
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const list = grouped.get(col.key) ?? [];
          const isOver = dragOverCol === col.key;
          return (
            <div
              key={col.key}
              className={`flex w-72 shrink-0 flex-col rounded-xl border bg-card-muted/40 transition-fast ${isOver ? "border-primary bg-primary-soft/40" : "border-border"}`}
              onDragOver={(e) => onDragOverCol(e, col.key)}
              onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
              onDrop={(e) => onDrop(e, col.key)}
            >
              <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold ${col.accent}`}>
                    {list.length}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                </div>
                <button
                  onClick={() => setCreateStatus(col.key)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-fast hover:bg-muted hover:text-foreground"
                  aria-label={`Add task to ${col.label}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </header>

              <div className="flex flex-1 flex-col gap-2.5 p-3">
                {list.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    Drop tasks here
                  </div>
                ) : (
                  list.map((t) => {
                    const proj = projectMap.get(t.projectId);
                    const assignee = t.assigneeId ? userMap.get(t.assigneeId) : undefined;
                    const overdue = isOverdue(t);
                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, t.id)}
                        onDragEnd={onDragEnd}
                        className={`group cursor-grab surface-card-compact p-3 shadow-soft transition-smooth hover:-translate-y-0.5 surface-card-hover active:cursor-grabbing ${draggingId === t.id ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge tone={priorityTone[t.priority]} dot>{t.priority}</StatusBadge>
                            {t.status === "blocked" && (
                              <StatusBadge tone={taskStatusTone.blocked}>blocked</StatusBadge>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-fast hover:bg-muted hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
                                aria-label="Task actions"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => setEditing(t)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">Move to</DropdownMenuLabel>
                              {TASK_STATUSES.filter((s) => s.key !== t.status).map((s) => (
                                <DropdownMenuItem key={s.key} onClick={() => moveTask(t.id, s.key)}>
                                  <MoveRight className="mr-2 h-3.5 w-3.5" /> {s.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleting(t)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <p className="mt-2 text-sm font-medium text-foreground">{t.title}</p>
                        {proj && <p className="mt-0.5 text-xs text-muted-foreground">{proj.name}</p>}

                        {t.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {t.tags.map((tag) => (
                              <span key={tag} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{tag}</span>
                            ))}
                          </div>
                        )}

                        <footer className="mt-3 flex items-center justify-between text-xs">
                          <div className={`inline-flex items-center gap-1 ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                            {t.dueDate ? (
                              <>
                                <CalendarClock className="h-3 w-3" />
                                {formatDate(t.dueDate, "short")}
                              </>
                            ) : <span className="text-muted-foreground/70">No due date</span>}
                          </div>
                          {assignee ? (
                            <Avatar className="h-6 w-6 border border-border">
                              <AvatarFallback className="bg-primary-soft text-[10px] font-semibold text-primary">{getInitials(assignee.name)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Unassigned</span>
                          )}
                        </footer>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskDialog
        open={createStatus !== null}
        onOpenChange={(o) => !o && setCreateStatus(null)}
        projects={projects}
        users={users}
        onSubmit={(d) => handleCreate({ ...d, status: createStatus ?? d.status })}
      />
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
