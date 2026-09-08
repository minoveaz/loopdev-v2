import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Category } from "@/types";

export interface CategoryDraft {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  productCount: number;
}

const DEFAULT: CategoryDraft = { name: "", slug: "", description: "", isActive: true, productCount: 0 };

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category?: Category | null;
  onSubmit: (d: CategoryDraft) => void;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function CategoryDialog({ open, onOpenChange, category, onSubmit }: Props) {
  const isEdit = !!category;
  const [draft, setDraft] = useState<CategoryDraft>(DEFAULT);
  const [error, setError] = useState<string | null>(null);
  const [touchedSlug, setTouchedSlug] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTouchedSlug(false);
    setDraft(category
      ? { name: category.name, slug: category.slug, description: category.description, isActive: category.isActive, productCount: category.productCount }
      : { ...DEFAULT });
  }, [open, category]);

  const set = <K extends keyof CategoryDraft>(k: K, v: CategoryDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return setError("Name is required.");
    onSubmit({
      ...draft,
      name: draft.name.trim(),
      slug: (draft.slug || slugify(draft.name)).trim(),
      description: draft.description.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{isEdit ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the category metadata." : "Create a new product category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={draft.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!touchedSlug) set("slug", slugify(e.target.value));
              }}
              placeholder="Apparel"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={draft.slug}
              onChange={(e) => { setTouchedSlug(true); set("slug", e.target.value); }}
              placeholder="apparel"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea id="cat-desc" rows={2} value={draft.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-card-muted px-3 py-2">
            <div>
              <Label htmlFor="cat-active" className="cursor-pointer">Active</Label>
              <p className="text-xs text-muted-foreground">Visible in storefront filters.</p>
            </div>
            <Switch id="cat-active" checked={draft.isActive} onCheckedChange={(v) => set("isActive", v)} />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEdit ? "Save changes" : "Create category"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
