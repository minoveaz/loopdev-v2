import { useMemo, useState } from "react";
import { FolderTree, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog, DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { categoriesStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import { formatNumber } from "@/lib/formatters";
import type { Category } from "@/types";
import { CategoryDialog, type CategoryDraft } from "@/features/commerce/CategoryDialog";

export default function CategoriesPage() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const cats = useLocalStore(categoriesStore);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cats.filter((c) => {
      if (q && !(c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))) return false;
      if (statusFilter.length) {
        const tag = c.isActive ? "active" : "inactive";
        if (!statusFilter.includes(tag)) return false;
      }
      return true;
    });
  }, [cats, search, statusFilter]);

  const stats = useMemo(() => ({
    total: cats.length,
    active: cats.filter((c) => c.isActive).length,
    products: cats.reduce((acc, c) => acc + c.productCount, 0),
  }), [cats]);

  const handleCreate = (d: CategoryDraft) => {
    categoriesStore.create(d);
    setCreateOpen(false);
    toast({ title: "Category created", description: `${d.name} added.` });
  };
  const handleEdit = (d: CategoryDraft) => {
    if (!editing) return;
    categoriesStore.update(editing.id, d);
    setEditing(null);
    toast({ title: "Category updated", description: `${d.name} saved.` });
  };
  const handleDelete = () => {
    if (!deleting) return;
    categoriesStore.remove(deleting.id);
    toast({ title: "Category deleted", description: `${deleting.name} removed.` });
    setDeleting(null);
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="eCommerce"
        title="Categories"
        description="Organize your catalog into searchable groups."
        breadcrumbs={trail.length ? trail : [{ label: "eCommerce" }, { label: "Catalog" }, { label: "Categories" }]}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New category
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard label="Total" value={String(stats.total)} icon={FolderTree} accent="primary" compact />
        <StatCard label="Active" value={String(stats.active)} accent="success" compact />
        <StatCard label="Products" value={formatNumber(stats.products)} accent="info" compact />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search by name or slug…" size="sm" containerClassName="w-72" />
        <FilterDropdown
          label="Status" multiple value={statusFilter} onChange={setStatusFilter} size="sm" align="end"
          options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6"><DataCard><EmptyState icon={FolderTree} title="No categories" description="Add a category to start grouping products." /></DataCard></div>
      ) : (
        <div className="mt-6">
          <DataCard flush>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Slug</th>
                    <th className="px-5 py-3 font-medium">Products</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((c) => (
                    <tr key={c.id} className="transition-fast hover:bg-muted/50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">/{c.slug}</td>
                      <td className="px-5 py-3 font-mono tabular-nums text-foreground">{c.productCount}</td>
                      <td className="px-5 py-3">
                        <StatusBadge tone={c.isActive ? "success" : "neutral"} dot>
                          {c.isActive ? "active" : "inactive"}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => setEditing(c)}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleting(c)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataCard>
        </div>
      )}

      <CategoryDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} />
      <CategoryDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} category={editing} onSubmit={handleEdit} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        tone="destructive"
        title={deleting ? `Delete ${deleting.name}?` : "Delete category?"}
        description="This permanently removes the category from mock data."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}
