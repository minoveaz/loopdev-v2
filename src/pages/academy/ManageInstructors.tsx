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
import { instructorsStore } from "@/data";
import type { Instructor } from "@/types";

type Draft = Omit<Instructor, "id" | "createdAt" | "updatedAt">;
const empty: Draft = {
  name: "", email: "", expertise: "", coursesCount: 0, studentsCount: 0, rating: 4.5,
};

export default function AcademyManageInstructors() {
  const { trail } = useBreadcrumbs();
  const items = useLocalStore(instructorsStore);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Instructor | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => c.name.toLowerCase().includes(q));
  }, [items, search]);

  const openCreate = () => { setEditing(null); setDraft(empty); setOpen(true); };
  const openEdit = (c: Instructor) => {
    setEditing(c);
    const { id, createdAt, updatedAt, ...rest } = c;
    void id; void createdAt; void updatedAt;
    setDraft(rest);
    setOpen(true);
  };
  const save = () => {
    if (!draft.name.trim()) { toast.error("Name is required"); return; }
    if (editing) { instructorsStore.update(editing.id, draft); }
    else { instructorsStore.create(draft); }
    setOpen(false);
  };
  const remove = () => {
    if (confirmId) { instructorsStore.remove(confirmId); setConfirmId(null); }
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Academy"
        title="Manage instructors"
        description="Add, edit, and remove instructor profiles."
        breadcrumbs={trail.length ? trail : [{ label: "Academy" }, { label: "Instructors" }, { label: "Manage" }]}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New instructor</Button>}
      />

      <DataCard title="Instructors" description={`${filtered.length} records`} flush
        action={<SearchInput value={search} onValueChange={setSearch} placeholder="Search…" containerClassName="w-64" />}
      >
        {filtered.length === 0 ? (
          <EmptyState title="No instructors" description="Add your first instructor." action={<Button onClick={openCreate}><Plus className="h-4 w-4" />New</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Expertise</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Courses</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.expertise}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="text-right font-mono">{c.coursesCount}</TableCell>
                  <TableCell className="text-right font-mono">{c.studentsCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{c.rating}</TableCell>
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
          <DialogHeader><DialogTitle>{editing ? "Edit instructor" : "Create instructor"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Email</Label><Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Expertise</Label><Input value={draft.expertise} onChange={(e) => setDraft({ ...draft, expertise: e.target.value })} /></div>
            <div><Label>Courses</Label><Input type="number" value={draft.coursesCount} onChange={(e) => setDraft({ ...draft, coursesCount: Number(e.target.value) || 0 })} /></div>
            <div><Label>Students</Label><Input type="number" value={draft.studentsCount} onChange={(e) => setDraft({ ...draft, studentsCount: Number(e.target.value) || 0 })} /></div>
            <div><Label>Rating</Label><Input type="number" step="0.1" value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) || 0 })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)} title="Delete instructor?" description="This action cannot be undone." confirmLabel="Delete" tone="destructive" onConfirm={remove} />
    </PageContainer>
  );
}