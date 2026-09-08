import { useMemo, useState } from "react";
import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog, DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { projectsStore, tasksStore, usersStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import { formatDate, getInitials } from "@/lib/formatters";
import type { Task } from "@/types";
import { TaskDialog, type TaskDraft } from "@/features/tasks/TaskDialog";
import { TASK_STATUSES, priorityTone, taskStatusTone } from "@/features/tasks/shared";

export default function ProjectTasks() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const tasks = useLocalStore(tasksStore);
  const projects = useLocalStore(projectsStore);
  const users = useLocalStore(usersStore);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const [search, setSearch] = useState("");
  const [projectF, setProjectF] = useState<string[]>([]);
  const [statusF, setStatusF] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (projectF.length && !projectF.includes(t.projectId)) return false;
      if (statusF.length && !statusF.includes(t.status)) return false;
      return true;
    });
  }, [tasks, search, projectF, statusF]);

  const stats = useMemo(() => ({
    total: tasks.length,
    open: tasks.filter((t) => t.status !== "done").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length,
  }), [tasks]);

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
        title="Tasks"
        description="All tasks across the portfolio."
        breadcrumbs={trail}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New task
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total" value={String(stats.total)} icon={ListChecks} accent="primary" compact />
        <StatCard label="Open" value={String(stats.open)} accent="info" compact />
        <StatCard label="Done" value={String(stats.done)} accent="success" compact />
        <StatCard label="Overdue" value={String(stats.overdue)} accent="gold" compact invertTrend />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search tasks…" size="sm" containerClassName="w-60" />
        <FilterDropdown label="Project" multiple value={projectF} onChange={setProjectF} options={projects.map((p) => ({ value: p.id, label: p.name }))} size="sm" align="end" />
        <FilterDropdown label="Status" multiple value={statusF} onChange={setStatusF} options={TASK_STATUSES.map((s) => ({ value: s.key, label: s.label }))} size="sm" align="end" />
      </div>

      <DataCard flush>
        {filtered.length === 0 ? (
          <EmptyState icon={ListChecks} title="No tasks match" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const u = t.assigneeId ? userMap.get(t.assigneeId) : null;
                const p = projectMap.get(t.projectId);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p?.name ?? "—"}</TableCell>
                    <TableCell>
                      {u ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border border-border">
                            <AvatarFallback className="text-[9px]">{getInitials(u.name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{u.name}</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">Unassigned</span>}
                    </TableCell>
                    <TableCell><StatusBadge tone={taskStatusTone[t.status]}>{t.status.replace("_", " ")}</StatusBadge></TableCell>
                    <TableCell><StatusBadge tone={priorityTone[t.priority]} variant="outline">{t.priority}</StatusBadge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.dueDate ? formatDate(t.dueDate) : "—"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleting(t)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DataCard>

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
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete task?"
        description={deleting ? `${deleting.title} will be removed.` : ""}
        confirmLabel="Delete"
        tone="destructive"
        onConfirm={() => {
          if (!deleting) return;
          tasksStore.remove(deleting.id);
          setDeleting(null);
          toast({ title: "Task deleted" });
        }}
      />
    </PageContainer>
  );
}