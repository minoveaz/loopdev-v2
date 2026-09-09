import { useMemo, useState } from "react";
import { Plus, Timer, Trash2 } from "lucide-react";
import { DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { projectsStore, timeEntriesStore, usersStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatDate } from "@/lib/formatters";

export default function TimeTracking() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const entries = useLocalStore(timeEntriesStore);
  const projects = useLocalStore(projectsStore);
  const users = useLocalStore(usersStore);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const [search, setSearch] = useState("");
  const [projectF, setProjectF] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    projectId: "", userId: "", date: new Date().toISOString().slice(0, 10),
    hours: 1, billable: true, note: "",
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((e) => !q || e.note.toLowerCase().includes(q))
      .filter((e) => !projectF.length || projectF.includes(e.projectId))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, search, projectF]);

  const totals = useMemo(() => {
    const total = entries.reduce((s, e) => s + e.hours, 0);
    const billable = entries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0);
    return { total, billable, ratio: total ? Math.round((billable / total) * 100) : 0 };
  }, [entries]);

  const create = () => {
    if (!draft.projectId || !draft.userId || draft.hours <= 0) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    timeEntriesStore.create(draft);
    setOpen(false);
    setDraft((d) => ({ ...d, hours: 1, note: "" }));
    toast({ title: "Time logged", description: `${draft.hours}h` });
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Projects"
        title="Time tracking"
        description="Log billable and internal hours across projects."
        breadcrumbs={trail}
        actions={
          <Button onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Log time
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total hours" value={`${totals.total.toFixed(1)}h`} icon={Timer} accent="primary" />
        <StatCard label="Billable" value={`${totals.billable.toFixed(1)}h`} accent="success" hint={`${totals.ratio}% of total`} />
        <StatCard label="Entries" value={String(entries.length)} accent="info" />
        <StatCard label="Active members" value={String(new Set(entries.map((e) => e.userId)).size)} accent="gold" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search notes…" size="sm" containerClassName="w-60" />
        <FilterDropdown label="Project" multiple value={projectF} onChange={setProjectF} options={projects.map((p) => ({ value: p.id, label: p.name }))} size="sm" align="end" />
      </div>

      <DataCard flush>
        {filtered.length === 0 ? (
          <EmptyState icon={Timer} title="No time entries" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm">{formatDate(e.date)}</TableCell>
                  <TableCell className="text-sm">{projectMap.get(e.projectId)?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{userMap.get(e.userId)?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.note}</TableCell>
                  <TableCell className="font-semibold">{e.hours.toFixed(1)}h</TableCell>
                  <TableCell><StatusBadge tone={e.billable ? "success" : "neutral"}>{e.billable ? "Billable" : "Internal"}</StatusBadge></TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { timeEntriesStore.remove(e.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Log time</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>Project</Label>
              <Select value={draft.projectId} onValueChange={(v) => setDraft({ ...draft, projectId: v })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Member</Label>
              <Select value={draft.userId} onValueChange={(v) => setDraft({ ...draft, userId: v })}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Date</Label>
                <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Hours</Label>
                <Input type="number" step="0.25" min="0.25" value={draft.hours} onChange={(e) => setDraft({ ...draft, hours: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Note</Label>
              <Input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="What did you work on?" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <Label htmlFor="bill" className="cursor-pointer">Billable</Label>
              <Switch id="bill" checked={draft.billable} onCheckedChange={(v) => setDraft({ ...draft, billable: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Log entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}