import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataCard, EmptyState, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { coursesStore, instructorsStore } from "@/data";
import { CATEGORIES, LEVELS, STATUSES, courseStatusLabel, courseStatusTone, levelTone } from "@/features/academy/shared";
import type { Course } from "@/types";

type Draft = Omit<Course, "id" | "createdAt" | "updatedAt">;
const empty: Draft = {
  title: "", category: CATEGORIES[0], level: "beginner", status: "draft",
  instructorId: "", durationMinutes: 120, lessons: 8, enrolled: 0, rating: 4.5, price: 79, currency: "USD",
};

export default function AcademyManageCourses() {
  const { trail } = useBreadcrumbs();
  const courses = useLocalStore(coursesStore);
  const instructors = useLocalStore(instructorsStore);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Course | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => c.title.toLowerCase().includes(q));
  }, [courses, search]);

  const openCreate = () => {
    setEditing(null);
    setDraft({ ...empty, instructorId: instructors[0]?.id ?? "" });
    setOpen(true);
  };
  const openEdit = (c: Course) => {
    setEditing(c);
    const { id, createdAt, updatedAt, ...rest } = c;
    void id; void createdAt; void updatedAt;
    setDraft(rest);
    setOpen(true);
  };
  const save = () => {
    if (!draft.title.trim()) { toast.error("Title is required"); return; }
    if (editing) { coursesStore.update(editing.id, draft); }
    else { coursesStore.create(draft); }
    setOpen(false);
  };
  const remove = () => {
    if (confirmId) { coursesStore.remove(confirmId); setConfirmId(null); }
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Academy"
        title="Manage courses"
        description="Create, edit, and remove courses in the catalog."
        breadcrumbs={trail.length ? trail : [{ label: "Academy" }, { label: "Courses" }, { label: "Manage" }]}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New course</Button>}
      />

      <DataCard title="Courses" description={`${filtered.length} records`} flush
        action={<SearchInput value={search} onValueChange={setSearch} placeholder="Search…" containerClassName="w-64" />}
      >
        {filtered.length === 0 ? (
          <EmptyState title="No courses" description="Create your first course." action={<Button onClick={openCreate}><Plus className="h-4 w-4" />New course</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">Enrolled</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell className="text-muted-foreground">{c.category}</TableCell>
                  <TableCell><StatusBadge tone={levelTone[c.level]}>{c.level}</StatusBadge></TableCell>
                  <TableCell className="text-right font-mono">{c.enrolled.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">${c.price}</TableCell>
                  <TableCell><StatusBadge tone={courseStatusTone[c.status]}>{courseStatusLabel[c.status]}</StatusBadge></TableCell>
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
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Edit course" : "Create course"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
            <div>
              <Label>Category</Label>
              <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Instructor</Label>
              <Select value={draft.instructorId} onValueChange={(v) => setDraft({ ...draft, instructorId: v })}>
                <SelectTrigger><SelectValue placeholder="Select instructor" /></SelectTrigger>
                <SelectContent>{instructors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Level</Label>
              <Select value={draft.level} onValueChange={(v) => setDraft({ ...draft, level: v as Draft["level"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Draft["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Duration (min)</Label><Input type="number" value={draft.durationMinutes} onChange={(e) => setDraft({ ...draft, durationMinutes: Number(e.target.value) || 0 })} /></div>
            <div><Label>Lessons</Label><Input type="number" value={draft.lessons} onChange={(e) => setDraft({ ...draft, lessons: Number(e.target.value) || 0 })} /></div>
            <div><Label>Enrolled</Label><Input type="number" value={draft.enrolled} onChange={(e) => setDraft({ ...draft, enrolled: Number(e.target.value) || 0 })} /></div>
            <div><Label>Rating</Label><Input type="number" step="0.1" value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) || 0 })} /></div>
            <div><Label>Price (USD)</Label><Input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)} title="Delete course?" description="This action cannot be undone." confirmLabel="Delete" tone="destructive" onConfirm={remove} />
    </PageContainer>
  );
}