import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Currency, Product, ProductStatus } from "@/types";

export interface ProductDraft {
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: Currency;
  stock: number;
  status: ProductStatus;
}

const DEFAULT: ProductDraft = {
  sku: "", name: "", description: "", category: "Subscription",
  price: 0, currency: "USD", stock: 0, status: "draft",
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product?: Product | null;
  categories: string[];
  onSubmit: (d: ProductDraft) => void;
}

export function ProductDialog({ open, onOpenChange, product, categories, onSubmit }: Props) {
  const isEdit = !!product;
  const [draft, setDraft] = useState<ProductDraft>(DEFAULT);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDraft(
      product
        ? {
            sku: product.sku, name: product.name, description: product.description,
            category: product.category, price: product.price, currency: product.currency,
            stock: product.stock, status: product.status,
          }
        : { ...DEFAULT, category: categories[0] ?? "Subscription" },
    );
  }, [open, product, categories]);

  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.sku.trim()) return setError("SKU is required.");
    if (!draft.name.trim()) return setError("Name is required.");
    if (!draft.category.trim()) return setError("Category is required.");
    onSubmit({
      ...draft,
      sku: draft.sku.trim(),
      name: draft.name.trim(),
      description: draft.description.trim(),
      category: draft.category.trim(),
      price: Math.max(0, Number(draft.price) || 0),
      stock: Math.max(0, Number(draft.stock) || 0),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{isEdit ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update SKU, pricing, and inventory." : "Add a product to the catalog."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pr-name">Name</Label>
              <Input id="pr-name" value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Rivera Pro Plan" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pr-sku">SKU</Label>
              <Input id="pr-sku" value={draft.sku} onChange={(e) => set("sku", e.target.value)} placeholder="RV-PLN-PRO" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pr-desc">Description</Label>
            <Textarea id="pr-desc" rows={2} value={draft.description} onChange={(e) => set("description", e.target.value)} placeholder="Short marketing description…" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="pr-cat">Category</Label>
              <Input id="pr-cat" value={draft.category} onChange={(e) => set("category", e.target.value)} placeholder="Subscription" list="rv-categories" />
              <datalist id="rv-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pr-price">Price</Label>
              <Input id="pr-price" type="number" min={0} step="0.01" value={draft.price} onChange={(e) => set("price", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={draft.currency} onValueChange={(v) => set("currency", v as Currency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pr-stock">Stock</Label>
              <Input id="pr-stock" type="number" min={0} value={draft.stock} onChange={(e) => set("stock", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v) => set("status", v as ProductStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="out_of_stock">Out of stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEdit ? "Save changes" : "Create product"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}