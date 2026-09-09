import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge, type StatusTone } from "@/components/common";
import { SIM_PERMISSIONS, rolePermsToSim } from "@/template/rivera/features/roles/permissions";
import { formatDate, formatRelative, getInitials } from "@/lib/formatters";
import type { Role, User } from "@/types";
import { Check, X } from "lucide-react";

const statusTone: Record<string, StatusTone> = {
  active: "success",
  pending: "warning",
  suspended: "destructive",
  archived: "neutral",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  role?: Role;
}

export function UserDetailsDrawer({ open, onOpenChange, user, role }: Props) {
  if (!user) return null;
  const perms = role ? rolePermsToSim(role.permissions) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">User details</SheetTitle>
          <SheetDescription>Profile, role assignment, and simulated permissions.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex items-center gap-4">
          <Avatar className="h-14 w-14 border border-border">
            <AvatarFallback className="bg-primary-soft text-base font-semibold text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusBadge tone={statusTone[user.status]} dot>{user.status}</StatusBadge>
              {role && <StatusBadge tone="primary">{role.name}</StatusBadge>}
            </div>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 surface-card-muted-compact p-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Title</dt>
            <dd className="mt-0.5 text-foreground">{user.title || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Department</dt>
            <dd className="mt-0.5 text-foreground">{user.department || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Created</dt>
            <dd className="mt-0.5 text-foreground">{formatDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Last active</dt>
            <dd className="mt-0.5 text-foreground">{formatRelative(user.lastActiveAt)}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold text-foreground">Simulated permissions</h4>
          <ul className="space-y-2">
            {SIM_PERMISSIONS.map((p) => {
              const granted = perms.includes(p.key);
              return (
                <li key={p.key} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                  <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-md ${granted ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>
                    {granted ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Permissions are visual only — Rivera does not enforce them.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
