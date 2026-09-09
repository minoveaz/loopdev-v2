import { useMemo, useState, type DragEvent } from "react";
import { CalendarClock, Plus } from "lucide-react";
import { DataCard, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { projectsStore, tasksStore, usersStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatDate, getInitials } from "@/lib/formatters";
import type { Task, TaskStatus } from "@/types";
import { TaskDialog, type TaskDraft } from "@/template/rivera/features/tasks/TaskDialog";
import { priorityTone } from "@/template/rivera/features/tasks/shared";

const COLUMNS: { key: TaskStatus; label: string; tone: string }[] = [
  { key: "backlog",     label: "Backlog",     tone: "bg-muted text-muted-foreground" },
  { key: "todo",        label: "Todo",        tone: "bg-primary-soft text-primary" },
  { key: "in_progress", label: "In Progress", tone: "bg-info-soft text-info" },
  { key: "review",      label: "Review",      tone: "bg-gold-soft text-gold" },
  { key: "done",        label: "Done",        tone: "bg-success-soft text-success" },
];

function isOverdue(t: Task) {
  return !!t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== "done";
}

export default function Workspace() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const tasks = useLocalStore(tasksStore);
  const projects = useLocalStore(projectsStore);
  const users = useLocalStore(usersStore);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const [search, setSearch] = useState("");
  const [projectF, setProjectF] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (projectF.length && !projectF.includes(t.projectId)) return false;
      return true;
    });
  }, [tasks, search, projectF]);

  const grouped = useMemo(() => {
    const m = new Map<TaskStatus, Task[]>();
    for (const c of COLUMNS) m.set(c.key, []);
    for (const t of filtered) {
      const status: TaskStatus = t.status === "blocked" ? "todo" : t.status;
      (m.get(status) ?? m.get("backlog")!).push(t);
    }
    return m;
  }, [filtered]);

  const onDragStart = (id: string) => (e: DragEvent) => {
    setDrag(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDrop = (col: TaskStatus) => (e: DragEvent) => {
    e.preventDefault();
    setOverCol(null);
    if (drag) {
      tasksStore.update(drag, { status: col });
      toast({ title: "Task moved", description: `Moved to ${col.replace("_", " ")}` });
    }
    setDrag(null);
  };

  const buildPayload = (d: TaskDraft) => ({
    title: d.title, description: d.description,
    projectId: d.projectId, assigneeId: d.assigneeId || undefined,
    status: d.status, priority: d.priority,
    dueDate: d.dueDate ? new Date(d.dueDate).toISOString() : undefined,
    tags: d.tags.split(",").map((s) => s.trim()).filter(Boolean),
    checklist: [0, 0] as [number, number],
  });

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Projects"
        title="Workspace"
        description="Drag-and-drop Kanban board across all engagements."
        breadcrumbs={trail}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New task
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search tasks…" size="sm" containerClassName="w-60" />
        <FilterDropdown label="Project" multiple value={projectF} onChange={setProjectF} options={projects.map((p) => ({ value: p.id, label: p.name }))} size="sm" align="end" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {COLUMNS.map((col) => {
          const items = grouped.get(col.key) ?? [];
          return (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
              onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
              onDrop={onDrop(col.key)}
              className={`flex flex-col rounded-xl border bg-card-muted p-3 transition ${overCol === col.key ? "border-primary ring-1 ring-primary/30" : "border-border"}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${col.tone}`}>{col.label}</span>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((t) => {
                  const u = t.assigneeId ? userMap.get(t.assigneeId) : null;
                  const p = projectMap.get(t.projectId);
                  return (
                    <button
                      key={t.id}
                      draggable
                      onDragStart={onDragStart(t.id)}
                      onClick={() => setEditing(t)}
                      className="cursor-grab surface-card-compact p-3 text-left shadow-soft transition hover:-translate-y-0.5 surface-card-hover active:cursor-grabbing"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-medium">{t.title}</p>
                        <StatusBadge tone={priorityTone[t.priority]} variant="outline">{t.priority}</StatusBadge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{p?.name}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          {t.dueDate && (
                            <>
                              <CalendarClock className="h-3 w-3" />
                              <span className={isOverdue(t) ? "text-destructive" : ""}>{formatDate(t.dueDate)}</span>
                            </>
                          )}
                        </div>
                        {u && (
                          <Avatar className="h-6 w-6 border border-border">
                            <AvatarFallback className="text-[9px]">{getInitials(u.name)}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </button>
                  );
                })}
                {items.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted-foreground">Drop here</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projects={projects}
        users={users}
        onSubmit={(d) => { tasksStore.create(buildPayload(d)); setCreateOpen(false); toast({ title: "Task created", description: d.title }); }}
      />
      <TaskDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        task={editing ?? undefined}
        projects={projects}
        users={users}
        onSubmit={(d) => {
          if (!editing) return;
          tasksStore.update(editing.id, buildPayload(d));
          setEditing(null);
          toast({ title: "Task updated", description: d.title });
        }}
      />
    </PageContainer>
  );
}