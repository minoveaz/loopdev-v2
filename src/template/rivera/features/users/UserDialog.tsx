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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role, User, UserStatus } from "@/types";

export interface UserDraft {
  name: string;
  email: string;
  title: string;
  department: string;
  roleId: string;
  status: UserStatus;
}

const DEFAULT_DRAFT: UserDraft = {
  name: "",
  email: "",
  title: "",
  department: "",
  roleId: "",
  status: "active",
};

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Provided when editing; omitted when creating. */
  user?: User | null;
  roles: readonly Role[];
  onSubmit: (draft: UserDraft) => void;
}

export function UserDialog({ open, onOpenChange, user, roles, onSubmit }: UserDialogProps) {
  const isEdit = !!user;
  const [draft, setDraft] = useState<UserDraft>(DEFAULT_DRAFT);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDraft(
      user
        ? {
            name: user.name,
            email: user.email,
            title: user.title ?? "",
            department: user.department ?? "",
            roleId: user.roleId,
            status: user.status,
          }
        : { ...DEFAULT_DRAFT, roleId: roles[0]?.id ?? "" },
    );
  }, [open, user, roles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return setError("Name is required.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email)) return setError("Enter a valid email.");
    if (!draft.roleId) return setError("Pick a role.");
    onSubmit({
      ...draft,
      name: draft.name.trim(),
      email: draft.email.trim(),
      title: draft.title.trim(),
      department: draft.department.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {isEdit ? "Edit user" : "Add user"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Update profile details and role." : "Invite a new team member with a role."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="u-name">Name</Label>
              <Input id="u-name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-email">Email</Label>
              <Input id="u-email" type="email" value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} placeholder="jane@rivera.app" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="u-title">Title</Label>
              <Input id="u-title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Designer" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-dept">Department</Label>
              <Input id="u-dept" value={draft.department} onChange={(e) => setDraft((d) => ({ ...d, department: e.target.value }))} placeholder="Design" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={draft.roleId} onValueChange={(v) => setDraft((d) => ({ ...d, roleId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft((d) => ({ ...d, status: v as UserStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEdit ? "Save changes" : "Create user"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
