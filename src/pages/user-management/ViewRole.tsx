import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Shield, Users, X } from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader, StatusBadge, type StatusTone } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { rolesStore, usersStore } from "@/data";
import { SIM_PERMISSIONS, rolePermsToSim } from "@/features/roles/permissions";
import { formatDate, getInitials } from "@/lib/formatters";
import type { UserStatus } from "@/types";

const statusTone: Record<UserStatus, StatusTone> = {
  active: "success", pending: "warning", suspended: "destructive", archived: "neutral",
};

export default function ViewRolePage() {
  const { trail } = useBreadcrumbs();
  const [params] = useSearchParams();
  const id = params.get("id");
  const roles = useLocalStore(rolesStore);
  const users = useLocalStore(usersStore);

  const role = useMemo(() => roles.find((r) => r.id === id) ?? roles[0], [roles, id]);
  const assigned = useMemo(() => (role ? users.filter((u) => u.roleId === role.id) : []), [users, role]);
  const perms = role ? rolePermsToSim(role.permissions) : [];

  if (!role) {
    return (
      <PageContainer width="narrow">
        <EmptyState title="Role not found" description="This role doesn't exist." action={<Button asChild><Link to="/user-management/roles">Back to roles</Link></Button>} />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="User management"
        title={role.name}
        description={role.description}
        breadcrumbs={trail.length ? trail : [{ label: "User management" }, { label: "Roles" }, { label: role.name }]}
        actions={
          <Button variant="outline" asChild>
            <Link to="/user-management/roles"><ArrowLeft className="h-3.5 w-3.5" />Back</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard title="Role details" description="Identity and scope">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Shield className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{role.name}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{role.slug}</p>
            </div>
          </div>
          <dl className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
            <Row label="Type" value={role.isSystem ? "System" : "Custom"} />
            <Row label="Members" value={`${assigned.length}`} />
            <Row label="Permissions" value={`${perms.length} of ${SIM_PERMISSIONS.length}`} />
            <Row label="Created" value={formatDate(role.createdAt)} />
            <Row label="Updated" value={formatDate(role.updatedAt)} />
          </dl>
        </DataCard>

        <DataCard className="lg:col-span-2" title="Permission matrix" description="What this role can do">
          <ul className="grid gap-2 sm:grid-cols-2">
            {SIM_PERMISSIONS.map((p) => {
              const granted = perms.includes(p.key);
              return (
                <li key={p.key} className="flex items-start gap-3 rounded-lg border border-border bg-card-muted/30 p-3">
                  <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded ${granted ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>
                    {granted ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </DataCard>
      </div>

      <DataCard title={`Assigned users (${assigned.length})`} description="Members with this role" flush>
        {assigned.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={Users} title="No users assigned" description="This role isn't assigned to anyone yet." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assigned.map((u) => (
                  <tr key={u.id} className="transition-fast hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.title || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-5 py-3"><StatusBadge tone={statusTone[u.status]} dot>{u.status}</StatusBadge></td>
                    <td className="px-5 py-3 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/user-management/users/view?id=${u.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataCard>
    </PageContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}