import { useMemo, useState } from "react";
import {
  ArrowUpRight, CalendarClock, FolderKanban, Grid3x3, List, MoreHorizontal,
  Pencil, Plus, Trash2,
} from "lucide-react";
import { ConfirmDialog, DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { projectsStore, usersStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import { formatCurrency, formatDate, getInitials } from "@/lib/formatters";
import type { Project } from "@/types";
import { ProjectDialog, type ProjectDraft } from "@/features/projects/ProjectDialog";
import { priorityTone, projectStatusTone } from "@/features/tasks/shared";

type View = "grid" | "table";

export default function ProjectsPage() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const projects = useLocalStore(projectsStore);
  const users = useLocalStore(usersStore);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const [view, setView] = useState<View>("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (q && !(p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q))) return false;
      if (statusFilter.length && !statusFilter.includes(p.status)) return false;
      if (priorityFilter.length && !priorityFilter.includes(p.priority)) return false;
      return true;
    });
  }, [projects, search, statusFilter, priorityFilter]);

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter((p) => p.status === "in_progress").length,
    completed: projects.filter((p) => p.status === "completed").length,
    onHold: projects.filter((p) => p.status === "on_hold").length,
  }), [projects]);

  const buildPayload = (d: ProjectDraft) => ({
    name: d.name, client: d.client, description: d.description,
    status: d.status, priority: d.priority,
    progress: d.progress, budget: d.budget, spent: 0, currency: d.currency,
    ownerId: d.ownerId, memberIds: [] as string[], tags: [] as string[],
    startDate: new Date(d.startDate).toISOString(),
    dueDate: new Date(d.dueDate).toISOString(),
  });

  const handleCreate = (d: ProjectDraft) => {
    projectsStore.create(buildPayload(d));
    setCreateOpen(false);
    toast({ title: "Project created", description: `${d.name} has been added.` });
  };
  const handleEdit = (d: ProjectDraft) => {
    if (!editing) return;
    projectsStore.update(editing.id, {
      ...buildPayload(d),
      memberIds: editing.memberIds,
      tags: editing.tags,
      spent: editing.spent,
    });
    setEditing(null);
    toast({ title: "Project updated", description: `${d.name} has been saved.` });
  };
  const handleDelete = () => {
    if (!deleting) return;
    projectsStore.remove(deleting.id);
    toast({ title: "Project deleted", description: `${deleting.name} was removed.` });
    setDeleting(null);
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Management"
        title="Projects"
        description="Track engagements, budgets, and delivery progress."
        breadcrumbs={trail.length ? trail : [{ label: "Management" }, { label: "Projects" }]}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New project
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total" value={String(stats.total)} icon={FolderKanban} accent="primary" compact />
        <StatCard label="In progress" value={String(stats.active)} accent="info" compact />
        <StatCard label="Completed" value={String(stats.completed)} accent="success" compact />
        <StatCard label="On hold" value={String(stats.onHold)} accent="gold" compact />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onValueChange={setSearch} placeholder="Search projects…" size="sm" containerClassName="w-60" />
          <FilterDropdown
            label="Status" multiple value={statusFilter} onChange={setStatusFilter} size="sm" align="end"
            options={[
              { label: "Planned", value: "planned" },
              { label: "In progress", value: "in_progress" },
              { label: "On hold", value: "on_hold" },
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" },
            ]}
          />
          <FilterDropdown
            label="Priority" multiple value={priorityFilter} onChange={setPriorityFilter} size="sm" align="end"
            options={[
              { label: "Low", value: "low" }, { label: "Medium", value: "medium" },
              { label: "High", value: "high" }, { label: "Urgent", value: "urgent" },
            ]}
          />
        </div>
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
          <button
            onClick={() => setView("grid")}
            className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-fast ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Grid3x3 className="h-3.5 w-3.5" /> Cards
          </button>
          <button
            onClick={() => setView("table")}
            className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-fast ${view === "table" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="h-3.5 w-3.5" /> Table
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <DataCard>
            <EmptyState
              icon={FolderKanban}
              title="No projects match your filters"
              description="Try adjusting search or filters, or create a new project."
              action={<Button onClick={() => setCreateOpen(true)} size="sm">New project</Button>}
            />
          </DataCard>
        </div>
      ) : view === "grid" ? (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const owner = userMap.get(p.ownerId);
            const members = p.memberIds.map((id) => userMap.get(id)).filter(Boolean);
            return (
              <article key={p.id} className="flex flex-col surface-card-interactive p-5">
                <header className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={projectStatusTone[p.status]}>{p.status.replace("_", " ")}</StatusBadge>
                      <StatusBadge tone={priorityTone[p.priority]} dot>{p.priority}</StatusBadge>
                    </div>
                    <h3 className="mt-2 truncate font-display text-base font-semibold text-foreground">{p.name}</h3>
                    <p className="truncate text-xs text-muted-foreground">{p.client}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => setEditing(p)}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDeleting(p)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </header>

                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-mono tabular-nums text-foreground">{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} className="h-1.5" />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" /> {formatDate(p.dueDate)}
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(p.spent, p.currency, { compact: true })} / {formatCurrency(p.budget, p.currency, { compact: true })}
                  </span>
                </div>

                <footer className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex -space-x-2">
                    {owner && (
                      <Avatar className="h-7 w-7 border-2 border-card">
                        <AvatarFallback className="bg-primary-soft text-[10px] font-semibold text-primary">{getInitials(owner.name)}</AvatarFallback>
                      </Avatar>
                    )}
                    {members.slice(0, 3).map((m) => (
                      <Avatar key={m!.id} className="h-7 w-7 border-2 border-card">
                        <AvatarFallback className="bg-info-soft text-[10px] font-semibold text-info">{getInitials(m!.name)}</AvatarFallback>
                      </Avatar>
                    ))}
                    {members.length > 3 && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground">
                        +{members.length - 3}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Open <ArrowUpRight className="h-3 w-3" />
                  </span>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6">
          <DataCard flush>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Project</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Priority</th>
                    <th className="px-5 py-3 font-medium">Progress</th>
                    <th className="px-5 py-3 font-medium">Owner</th>
                    <th className="px-5 py-3 font-medium">Due</th>
                    <th className="px-5 py-3 font-medium">Budget</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((p) => {
                    const owner = userMap.get(p.ownerId);
                    return (
                      <tr key={p.id} className="transition-fast hover:bg-muted/50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.client}</p>
                        </td>
                        <td className="px-5 py-3"><StatusBadge tone={projectStatusTone[p.status]}>{p.status.replace("_", " ")}</StatusBadge></td>
                        <td className="px-5 py-3"><StatusBadge tone={priorityTone[p.priority]} dot>{p.priority}</StatusBadge></td>
                        <td className="px-5 py-3 w-44">
                          <div className="flex items-center gap-2">
                            <Progress value={p.progress} className="h-1.5 flex-1" />
                            <span className="font-mono text-xs tabular-nums text-foreground">{p.progress}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {owner ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 border border-border"><AvatarFallback className="bg-primary-soft text-[10px] font-semibold text-primary">{getInitials(owner.name)}</AvatarFallback></Avatar>
                              <span className="text-foreground">{owner.name}</span>
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{formatDate(p.dueDate)}</td>
                        <td className="px-5 py-3 font-mono tabular-nums text-foreground">{formatCurrency(p.budget, p.currency, { compact: true })}</td>
                        <td className="px-5 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => setEditing(p)}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleting(p)} className="text-destructive focus:text-destructive">
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
          </DataCard>
        </div>
      )}

      <ProjectDialog open={createOpen} onOpenChange={setCreateOpen} users={users} onSubmit={handleCreate} />
      <ProjectDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} project={editing} users={users} onSubmit={handleEdit} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        tone="destructive"
        title={deleting ? `Delete ${deleting.name}?` : "Delete project?"}
        description="This permanently removes the project from your workspace mock data. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}
