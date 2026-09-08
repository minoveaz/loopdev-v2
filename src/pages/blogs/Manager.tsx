import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Bold, Italic, List, Link2, Image as ImageIcon, Heading1, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataCard, DataTable, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge, type DataTableColumn } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import { blogPostsStore } from "@/data";
import { BLOG_CATEGORIES, BLOG_STATUSES, blogStatusLabel, blogStatusTone } from "@/features/blogs/shared";
import type { BlogPost } from "@/types";

type Draft = Omit<BlogPost, "id" | "createdAt" | "updatedAt"> & { content?: string };
const empty: Draft = { title: "", slug: "", excerpt: "", authorId: "u_1", category: BLOG_CATEGORIES[0], tags: [], status: "draft", views: 0, comments: 0, content: "" };

export default function BlogManager() {
  const { trail } = useBreadcrumbs();
  const posts = useLocalStore(blogPostsStore);
  const loading = useSimulatedLoad();
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState<string[]>([]);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (statusF.length && !statusF.includes(p.status)) return false;
      if (q && !p.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, search, statusF]);

  const openCreate = () => { setEditing(null); setDraft(empty); setOpen(true); };
  const openEdit = (p: BlogPost) => { setEditing(p); const { id, createdAt, updatedAt, ...rest } = p; void id; void createdAt; void updatedAt; setDraft({ ...rest, content: rest.excerpt }); setOpen(true); };
  const save = () => {
    if (!draft.title.trim()) { toast.error("Title is required"); return; }
    const slug = draft.slug || draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { content, ...payload } = draft; void content;
    if (editing) { blogPostsStore.update(editing.id, { ...payload, slug }); }
    else { blogPostsStore.create({ ...payload, slug }); }
    setOpen(false);
  };
  const remove = () => { if (confirmId) { blogPostsStore.remove(confirmId); setConfirmId(null); } };

  const columns: DataTableColumn<BlogPost>[] = [
    { key: "title", header: "Title", sortable: true, cell: (p) => <span className="font-medium">{p.title}</span> },
    { key: "category", header: "Category", sortable: true, hideOnMobile: true, cell: (p) => <span className="text-muted-foreground">{p.category}</span> },
    { key: "status", header: "Status", sortable: true, cell: (p) => <StatusBadge tone={blogStatusTone[p.status]}>{blogStatusLabel[p.status]}</StatusBadge> },
    { key: "views", header: "Views", sortable: true, align: "right", hideOnMobile: true, cell: (p) => <span className="font-mono">{p.views.toLocaleString()}</span> },
    { key: "comments", header: "Comments", sortable: true, align: "right", hideOnMobile: true, cell: (p) => <span className="font-mono">{p.comments}</span> },
  ];

  return (
    <PageContainer width="wide">
      <PageHeader eyebrow="Blogs" title="Blog manager" description="Author, edit, and publish blog posts."
        breadcrumbs={trail.length ? trail : [{ label: "Blogs" }, { label: "Manager" }]}
        actions={<Button onClick={openCreate} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New post</Button>}
      />

      <DataCard flush>
        <DataTable
          data={filtered}
          columns={columns}
          loading={loading}
          emptyIcon={FileText}
          emptyTitle="No posts"
          emptyDescription="Create your first post."
          emptyAction={<Button onClick={openCreate} size="sm"><Plus className="h-4 w-4" /> New post</Button>}
          initialSort={{ key: "title", dir: "asc" }}
          rowActions={[
            { label: "Edit", icon: Pencil, onClick: openEdit },
            { label: "Preview", icon: Eye, onClick: () => toast("Preview (mock)") },
            { label: "Delete", icon: Trash2, destructive: true, separator: true, onClick: (p) => setConfirmId(p.id) },
          ]}
          bulkActions={[
            { label: "Publish", onClick: (rows) => { rows.forEach((r) => blogPostsStore.update(r.id, { status: "published" })); toast.success(`${rows.length} published`); } },
            { label: "Delete", icon: Trash2, destructive: true, onClick: (rows) => { rows.forEach((r) => blogPostsStore.remove(r.id)); } },
          ]}
          toolbar={
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={search} onValueChange={setSearch} placeholder="Search title…" containerClassName="w-64" size="sm" />
              <FilterDropdown label="Status" multiple value={statusF} onChange={setStatusF} size="sm" align="end"
                options={BLOG_STATUSES.map((s) => ({ value: s, label: blogStatusLabel[s] }))} />
            </div>
          }
        />
      </DataCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? "Edit post" : "Create post"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
            <div><Label>Slug</Label><Input value={draft.slug} placeholder="auto-from-title" onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></div>
            <div><Label>Category</Label>
              <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BLOG_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Draft["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BLOG_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Cover URL</Label><Input value={draft.coverUrl ?? ""} onChange={(e) => setDraft({ ...draft, coverUrl: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Excerpt</Label><Textarea rows={2} value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Content</Label>
              <div className="rounded-md border border-border">
                <div className="flex flex-wrap items-center gap-1 border-b border-border bg-card-muted/40 p-2">
                  {[Heading1, Bold, Italic, List, Link2, ImageIcon].map((Icon, i) => (
                    <Button key={i} type="button" size="icon" variant="ghost" className="h-7 w-7"><Icon className="h-3.5 w-3.5" /></Button>
                  ))}
                  <span className="ml-auto text-[11px] text-muted-foreground">Mock editor</span>
                </div>
                <Textarea className="min-h-[180px] resize-y rounded-none border-0 focus-visible:ring-0" placeholder="Write your post here…"
                  value={draft.content ?? ""} onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)} title="Delete post?" description="This action cannot be undone." confirmLabel="Delete" tone="destructive" onConfirm={remove} />
    </PageContainer>
  );
}
