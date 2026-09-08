import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { categoriesStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import type { Category } from "@/types";
import { CategoryDialog, type CategoryDraft } from "@/features/commerce/CategoryDialog";

export default function CategoryEdit() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const navigate = useNavigate();
  const cats = useLocalStore(categoriesStore);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cats;
    return cats.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [cats, search]);

  const handleEdit = (d: CategoryDraft) => {
    if (!editing) return;
    categoriesStore.update(editing.id, d);
    toast({ title: "Category updated", description: `${d.name} saved.` });
    setEditing(null);
  };

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="eCommerce"
        title="Edit category"
        description="Pick a category to edit."
        breadcrumbs={trail.length ? trail : [{ label: "eCommerce" }, { label: "Catalog" }, { label: "Edit Category" }]}
        actions={<Button variant="outline" size="sm" onClick={() => navigate("/ecommerce/catalog/categories")}>Back to list</Button>}
      />

      <div className="mb-4">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search categories…" size="sm" containerClassName="w-80" />
      </div>

      <DataCard flush>
        {filtered.length === 0 ? (
          <div className="p-6"><EmptyState icon={Pencil} title="No categories found" description="Try another search." /></div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setEditing(c)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-fast hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{c.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">/{c.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge tone={c.isActive ? "success" : "neutral"} dot>{c.isActive ? "active" : "inactive"}</StatusBadge>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </DataCard>

      <CategoryDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        category={editing}
        onSubmit={handleEdit}
      />
    </PageContainer>
  );
}
