import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog, DataCard, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { projectsStore, usersStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import { formatCurrency, formatDate, getInitials } from "@/lib/formatters";
import type { Project } from "@/types";
import { ProjectDialog, type ProjectDraft } from "@/features/projects/ProjectDialog";
import {
  PRIORITY_OPTIONS, PROJECT_STATUS_OPTIONS,
} from "@/features/projects/shared";
import { priorityTone, projectStatusTone } from "@/features/tasks/shared";

export default function ProjectsOverview() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const projects = useLocalStore(projectsStore);
  const users = useLocalStore(usersStore);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string[]>([]);
  const [priority, setPriority] = useState<string[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (q && !(p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q))) return false;
      if (status.length && !status.includes(p.status)) return false;
      if (priority.length && !priority.includes(p.priority)) return false;
      return true;
    });
  }, [projects, search, status, priority]);

  const buildPayload = (d: ProjectDraft) => ({
    name: d.name, client: d.client, description: d.description,
    status: d.status, priority: d.priority, progress: d.progress,
    budget: d.budget, spent: 0, currency: d.currency,
    ownerId: d.ownerId, memberIds: [] as string[], tags: [] as string[],
    startDate: new Date(d.startDate).toISOString(),
    dueDate: new Date(d.dueDate).toISOString(),
  });

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Projects"
        title="Projects overview"
        description="All engagements across the portfolio."
        breadcrumbs={trail}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New project
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search projects…" size="sm" containerClassName="w-60" />
        <FilterDropdown label="Status" multiple value={status} onChange={setStatus} options={PROJECT_STATUS_OPTIONS} size="sm" align="end" />
        <FilterDropdown label="Priority" multiple value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} size="sm" align="end" />
      </div>

      <DataCard flush>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const owner = userMap.get(p.ownerId);
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.client}</div>
                  </TableCell>
                  <TableCell><StatusBadge tone={projectStatusTone[p.status]}>{p.status.replace("_", " ")}</StatusBadge></TableCell>
                  <TableCell><StatusBadge tone={priorityTone[p.priority]} variant="outline">{p.priority}</StatusBadge></TableCell>
                  <TableCell className="w-40">
                    <div className="flex items-center gap-2">
                      <Progress value={p.progress} className="h-1.5 w-24" />
                      <span className="text-xs text-muted-foreground">{p.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{formatCurrency(p.spent, p.currency, { compact: true })}</div>
                    <div className="text-xs text-muted-foreground">of {formatCurrency(p.budget, p.currency, { compact: true })}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 border border-border">
                        <AvatarFallback className="text-[10px]">{getInitials(owner?.name ?? "?")}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{owner?.name ?? "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(p.dueDate)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleting(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DataCard>

      <ProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        users={users}
        onSubmit={(d) => {
          projectsStore.create(buildPayload(d));
          setCreateOpen(false);
          toast({ title: "Project created", description: d.name });
        }}
      />
      <ProjectDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        project={editing ?? undefined}
        users={users}
        onSubmit={(d) => {
          if (!editing) return;
          projectsStore.update(editing.id, {
            ...buildPayload(d),
            memberIds: editing.memberIds,
            tags: editing.tags,
            spent: editing.spent,
          });
          setEditing(null);
          toast({ title: "Project updated", description: d.name });
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete project?"
        description={deleting ? `${deleting.name} will be permanently removed.` : ""}
        confirmLabel="Delete"
        tone="destructive"
        onConfirm={() => {
          if (!deleting) return;
          projectsStore.remove(deleting.id);
          toast({ title: "Project deleted", description: deleting.name });
          setDeleting(null);
        }}
      />
    </PageContainer>
  );
}