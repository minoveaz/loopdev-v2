import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { Role } from "@/types";
import {
  SIM_PERMISSIONS,
  type SimPermissionKey,
  rolePermsToSim,
} from "./permissions";

export interface RoleDraft {
  name: string;
  slug: string;
  description: string;
  permissions: SimPermissionKey[];
}

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const DEFAULT_DRAFT: RoleDraft = {
  name: "",
  slug: "",
  description: "",
  permissions: ["dashboard.view"],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
  onSubmit: (draft: RoleDraft) => void;
}

export function RoleDialog({ open, onOpenChange, role, onSubmit }: Props) {
  const isEdit = !!role;
  const [draft, setDraft] = useState<RoleDraft>(DEFAULT_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSlugTouched(!!role);
    setDraft(
      role
        ? {
            name: role.name,
            slug: role.slug,
            description: role.description,
            permissions: rolePermsToSim(role.permissions),
          }
        : DEFAULT_DRAFT,
    );
  }, [open, role]);

  const togglePerm = (key: SimPermissionKey) => {
    setDraft((d) => {
      const has = d.permissions.includes(key);
      return { ...d, permissions: has ? d.permissions.filter((p) => p !== key) : [...d.permissions, key] };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return setError("Role name is required.");
    const slug = draft.slug.trim() || slugify(draft.name);
    onSubmit({
      name: draft.name.trim(),
      slug,
      description: draft.description.trim(),
      permissions: draft.permissions,
    });
  };

  const groups = SIM_PERMISSIONS.reduce<Record<string, typeof SIM_PERMISSIONS>>((acc, p) => {
    (acc[p.group] ??= []).push(p);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{isEdit ? "Edit role" : "New role"}</DialogTitle>
          <DialogDescription>
            Define a role and select the permissions it grants. Permissions are simulated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="r-name">Name</Label>
              <Input
                id="r-name"
                value={draft.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setDraft((d) => ({ ...d, name, slug: slugTouched ? d.slug : slugify(name) }));
                }}
                placeholder="Marketing Lead"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-slug">Slug</Label>
              <Input
                id="r-slug"
                value={draft.slug}
                onChange={(e) => { setSlugTouched(true); setDraft((d) => ({ ...d, slug: e.target.value })); }}
                placeholder="marketing-lead"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-desc">Description</Label>
            <Textarea
              id="r-desc"
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="What can people in this role do?"
            />
          </div>

          <div>
            <Label className="mb-2 block">Permissions</Label>
            <div className="space-y-3">
              {Object.entries(groups).map(([group, perms]) => (
                <div key={group} className="surface-card-muted-compact p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group}</p>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {perms.map((p) => {
                      const checked = draft.permissions.includes(p.key);
                      return (
                        <li key={p.key}>
                          <label
                            className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-2.5 transition-fast hover:border-border-strong"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => togglePerm(p.key)}
                              className="mt-0.5"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-foreground">{p.label}</span>
                              <span className="block text-xs text-muted-foreground">{p.description}</span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEdit ? "Save changes" : "Create role"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
