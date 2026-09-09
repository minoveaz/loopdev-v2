import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader, SearchInput } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { productsStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatCurrency } from "@/lib/formatters";
import type { Product } from "@/types";
import { ProductDialog, type ProductDraft } from "@/template/rivera/features/commerce/ProductDialog";

export default function ProductEdit() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const navigate = useNavigate();
  const products = useLocalStore(productsStore);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).sort(), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, search]);

  const handleEdit = (d: ProductDraft) => {
    if (!editing) return;
    productsStore.update(editing.id, d);
    toast({ title: "Product updated", description: `${d.name} saved.` });
    setEditing(null);
  };

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="eCommerce"
        title="Edit product"
        description="Pick a product from the list to edit."
        breadcrumbs={trail.length ? trail : [{ label: "eCommerce" }, { label: "Catalog" }, { label: "Edit Product" }]}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate("/ecommerce/catalog/products")}>
            Back to list
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search by name or SKU…" size="sm" containerClassName="w-80" />
      </div>

      <DataCard flush>
        {filtered.length === 0 ? (
          <div className="p-6"><EmptyState icon={Pencil} title="No products" description="No matching SKUs." /></div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setEditing(p)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-fast hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{p.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{p.sku} · {p.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm tabular-nums text-foreground">{formatCurrency(p.price, p.currency)}</span>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </DataCard>

      <ProductDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        product={editing}
        categories={categories}
        onSubmit={handleEdit}
      />
    </PageContainer>
  );
}
