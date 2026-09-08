import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { productsStore } from "@/data";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { LOW_STOCK_THRESHOLD, statusTone } from "@/features/pos/shared";
import type { Product } from "@/types";

export default function PosInventory() {
  const { trail } = useBreadcrumbs();
  const products = useLocalStore(productsStore) as readonly Product[];
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [adjust, setAdjust] = useState<number>(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, search]);

  const lowCount = products.filter((p) => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD).length;
  const outCount = products.filter((p) => p.stock === 0).length;
  const totalUnits = products.reduce((s, p) => s + Math.min(p.stock, 9999), 0);

  const stockLabel = (p: Product) => {
    if (p.stock === 0) return { tone: "destructive" as const, label: "Out of stock" };
    if (p.stock < LOW_STOCK_THRESHOLD) return { tone: "warning" as const, label: "Low stock" };
    return { tone: "success" as const, label: "In stock" };
  };

  const openAdjust = (p: Product) => { setEditing(p); setAdjust(p.stock); };
  const saveAdjust = () => {
    if (!editing) return;
    productsStore.update(editing.id, { stock: Math.max(0, Math.floor(adjust)), status: adjust === 0 ? "out_of_stock" : "active" });
    setEditing(null);
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="POS System"
        title="Inventory"
        description="Track stock levels and adjust quantities."
        breadcrumbs={trail.length ? trail : [{ label: "POS System" }, { label: "Inventory" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total SKUs" value={formatNumber(products.length)} icon={Boxes} accent="primary" />
        <StatCard label="Low stock" value={formatNumber(lowCount)} icon={AlertTriangle} accent="gold" />
        <StatCard label="Out of stock" value={formatNumber(outCount)} icon={AlertTriangle} accent="info" />
      </div>

      <div className="mt-6 surface-card">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inventory…" className="pl-9" />
          </div>
          <p className="text-xs text-muted-foreground">{formatNumber(totalUnits)} total units</p>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Boxes} title="No products match" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const s = stockLabel(p);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(p.price, p.currency)}</TableCell>
                    <TableCell className="text-right font-mono">{p.stock >= 9999 ? "∞" : p.stock}</TableCell>
                    <TableCell><StatusBadge tone={s.tone}>{s.label}</StatusBadge></TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => openAdjust(p)}>Adjust</Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust stock — {editing?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Current: <span className="font-mono">{editing?.stock}</span></p>
            <div>
              <Label>New quantity</Label>
              <Input type="number" min={0} value={adjust} onChange={(e) => setAdjust(Number(e.target.value) || 0)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveAdjust}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}