import { useMemo, useState } from "react";
import {
  ArrowDown, ArrowUp, ArrowUpDown, Boxes, Grid3x3, List, MoreHorizontal,
  Package, Pencil, Plus, Star, Trash2,
} from "lucide-react";
import { ConfirmDialog, DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge, TablePagination } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { productsStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { Product } from "@/types";
import { ProductDialog, type ProductDraft } from "@/features/commerce/ProductDialog";
import { categoryEmoji, productStatusTone } from "@/features/commerce/shared";

type View = "grid" | "table";
type SortKey = "name" | "category" | "price" | "stock" | "status" | "sales";

export default function ProductsPage() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const products = useLocalStore(productsStore);

  const [view, setView] = useState<View>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let items = products.filter((p) => {
      if (q && !(p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))) return false;
      if (statusFilter.length && !statusFilter.includes(p.status)) return false;
      if (categoryFilter.length && !categoryFilter.includes(p.category)) return false;
      return true;
    });
    items = [...items].sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      const dir = sortDir === "asc" ? 1 : -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return items;
  }, [products, search, statusFilter, categoryFilter, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.status === "active").length,
    out: products.filter((p) => p.status === "out_of_stock" || p.stock === 0).length,
    sales: products.reduce((acc, p) => acc + p.sales, 0),
  }), [products]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };

  const handleCreate = (d: ProductDraft) => {
    productsStore.create({ ...d, rating: 0, sales: 0 });
    setCreateOpen(false);
    toast({ title: "Product created", description: `${d.name} added to catalog.` });
  };
  const handleEdit = (d: ProductDraft) => {
    if (!editing) return;
    productsStore.update(editing.id, { ...d });
    setEditing(null);
    toast({ title: "Product updated", description: `${d.name} saved.` });
  };
  const handleDelete = () => {
    if (!deleting) return;
    productsStore.remove(deleting.id);
    toast({ title: "Product deleted", description: `${deleting.name} removed.` });
    setDeleting(null);
  };

  const SortHead = ({ k, children, align = "left" }: { k: SortKey; children: React.ReactNode; align?: "left" | "right" }) => (
    <th className={`px-5 py-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 transition-fast hover:text-foreground ${sortKey === k ? "text-foreground" : ""}`}
      >
        {children}
        {sortKey === k ? (
          sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
      </button>
    </th>
  );

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Management"
        title="Products"
        description="Manage SKUs, pricing, inventory, and lifecycle status."
        breadcrumbs={trail.length ? trail : [{ label: "Management" }, { label: "Products" }]}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New product
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total SKUs" value={String(stats.total)} icon={Package} accent="primary" compact />
        <StatCard label="Active" value={String(stats.active)} accent="success" compact />
        <StatCard label="Out of stock" value={String(stats.out)} accent="gold" compact />
        <StatCard label="Total units sold" value={formatNumber(stats.sales)} icon={Boxes} accent="info" compact />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onValueChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, SKU, category…" size="sm" containerClassName="w-72" />
          <FilterDropdown
            label="Status" multiple value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} size="sm" align="end"
            options={[
              { label: "Active", value: "active" },
              { label: "Draft", value: "draft" },
              { label: "Archived", value: "archived" },
              { label: "Out of stock", value: "out_of_stock" },
            ]}
          />
          <FilterDropdown
            label="Category" multiple value={categoryFilter} onChange={(v) => { setCategoryFilter(v); setPage(1); }} size="sm" align="end"
            options={categories.map((c) => ({ label: c, value: c }))}
          />
        </div>
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
          <button
            onClick={() => setView("table")}
            className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-fast ${view === "table" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="h-3.5 w-3.5" /> Table
          </button>
          <button
            onClick={() => setView("grid")}
            className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-fast ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Grid3x3 className="h-3.5 w-3.5" /> Grid
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <DataCard>
            <EmptyState
              icon={Package}
              title="No products match your filters"
              description="Try adjusting search or filters, or add a new product."
              action={<Button onClick={() => setCreateOpen(true)} size="sm">New product</Button>}
            />
          </DataCard>
        </div>
      ) : view === "grid" ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paged.map((p) => (
            <article key={p.id} className="group flex flex-col surface-card-interactive">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t-2xl bg-gradient-to-br from-primary-soft via-info-soft to-accent-soft">
                <span className="font-display text-6xl text-foreground/60">{categoryEmoji(p.category)}</span>
                <div className="absolute right-3 top-3">
                  <StatusBadge tone={productStatusTone[p.status]} dot>{p.status.replace("_", " ")}</StatusBadge>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{p.category}</p>
                <h3 className="mt-1 truncate font-display text-base font-semibold text-foreground">{p.name}</h3>
                <p className="font-mono text-[11px] text-muted-foreground">{p.sku}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-display text-lg font-semibold text-foreground">{formatCurrency(p.price, p.currency)}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-gold text-gold" /> {p.rating.toFixed(1)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Stock: <span className="font-mono tabular-nums text-foreground">{p.stock >= 9999 ? "∞" : formatNumber(p.stock)}</span></span>
                  <span>{formatNumber(p.sales)} sold</span>
                </div>
                <div className="mt-4 flex items-center justify-end gap-1 border-t border-border pt-3">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(p)} className="h-7 px-2 text-xs">
                    <Pencil className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(p)} className="h-7 px-2 text-xs text-destructive hover:text-destructive">
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <DataCard flush>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <SortHead k="name">Product</SortHead>
                    <SortHead k="category">Category</SortHead>
                    <SortHead k="price">Price</SortHead>
                    <SortHead k="stock">Stock</SortHead>
                    <SortHead k="sales">Sales</SortHead>
                    <SortHead k="status">Status</SortHead>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map((p) => (
                    <tr key={p.id} className="transition-fast hover:bg-muted/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-soft to-info-soft font-display text-xl text-foreground/70">
                            {categoryEmoji(p.category)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{p.name}</p>
                            <p className="font-mono text-[11px] text-muted-foreground">{p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{p.category}</td>
                      <td className="px-5 py-3 font-mono tabular-nums text-foreground">{formatCurrency(p.price, p.currency)}</td>
                      <td className="px-5 py-3 font-mono tabular-nums">
                        <span className={p.stock === 0 ? "text-destructive" : p.stock < 50 ? "text-warning" : "text-foreground"}>
                          {p.stock >= 9999 ? "∞" : formatNumber(p.stock)}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono tabular-nums text-foreground">{formatNumber(p.sales)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge tone={productStatusTone[p.status]} dot>{p.status.replace("_", " ")}</StatusBadge>
                      </td>
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
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={safePage}
              pageCount={pageCount}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />
          </DataCard>
        </div>
      )}

      <ProductDialog open={createOpen} onOpenChange={setCreateOpen} categories={categories} onSubmit={handleCreate} />
      <ProductDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} product={editing} categories={categories} onSubmit={handleEdit} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        tone="destructive"
        title={deleting ? `Delete ${deleting.name}?` : "Delete product?"}
        description="This permanently removes the product from your catalog mock data. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}