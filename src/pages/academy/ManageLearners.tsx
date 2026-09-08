import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataCard, EmptyState, PageContainer, PageHeader, SearchInput } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { learnersStore } from "@/data";
import type { Learner } from "@/types";

type Draft = Omit<Learner, "id" | "createdAt" | "updatedAt">;
const empty: Draft = {
  name: "", email: "", enrolledCourses: 0, completedCourses: 0, progress: 0,
  lastActiveAt: new Date().toISOString(),
};

export default function AcademyManageLearners() {
  const { trail } = useBreadcrumbs();
  const items = useLocalStore(learnersStore);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Learner | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => c.name.toLowerCase().includes(q));
  }, [items, search]);

  const openCreate = () => { setEditing(null); setDraft({ ...empty, lastActiveAt: new Date().toISOString() }); setOpen(true); };
  const openEdit = (c: Learner) => {
    setEditing(c);
    const { id, createdAt, updatedAt, ...rest } = c;
    void id; void createdAt; void updatedAt;
    setDraft(rest);
    setOpen(true);
  };
  const save = () => {
    if (!draft.name.trim()) { toast.error("Name is required"); return; }
    if (editing) { learnersStore.update(editing.id, draft); }
    else { learnersStore.create(draft); }
    setOpen(false);
  };
  const remove = () => {
    if (confirmId) { learnersStore.remove(confirmId); setConfirmId(null); }
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Academy"
        title="Manage learners"
        description="Add, edit, or remove learner records."
        breadcrumbs={trail.length ? trail : [{ label: "Academy" }, { label: "Learners" }, { label: "Manage" }]}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New learner</Button>}
      />

      <DataCard title="Learners" description={`${filtered.length} records`} flush
        action={<SearchInput value={search} onValueChange={setSearch} placeholder="Search…" containerClassName="w-64" />}
      >
        {filtered.length === 0 ? (
          <EmptyState title="No learners" description="Add your first learner." action={<Button onClick={openCreate}><Plus className="h-4 w-4" />New</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Enrolled</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="text-right font-mono">{c.enrolledCourses}</TableCell>
                  <TableCell className="text-right font-mono">{c.completedCourses}</TableCell>
                  <TableCell className="text-right font-mono">{c.progress}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmId(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit learner" : "Create learner"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Email</Label><Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
            <div><Label>Enrolled courses</Label><Input type="number" value={draft.enrolledCourses} onChange={(e) => setDraft({ ...draft, enrolledCourses: Number(e.target.value) || 0 })} /></div>
            <div><Label>Completed</Label><Input type="number" value={draft.completedCourses} onChange={(e) => setDraft({ ...draft, completedCourses: Number(e.target.value) || 0 })} /></div>
            <div><Label>Progress (%)</Label><Input type="number" value={draft.progress} onChange={(e) => setDraft({ ...draft, progress: Number(e.target.value) || 0 })} /></div>
            <div><Label>Last active</Label><Input type="date" value={draft.lastActiveAt.slice(0, 10)} onChange={(e) => setDraft({ ...draft, lastActiveAt: new Date(e.target.value).toISOString() })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)} title="Delete learner?" description="This action cannot be undone." confirmLabel="Delete" tone="destructive" onConfirm={remove} />
    </PageContainer>
  );
}