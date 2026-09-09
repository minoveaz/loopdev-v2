import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Eye, Lock, MoreHorizontal, Pencil, Plus, Shield, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataCard, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { rolesStore, usersStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import type { Role } from "@/types";
import { RoleDialog, type RoleDraft } from "@/template/rivera/features/roles/RoleDialog";
import { SIM_PERMISSIONS, rolePermsToSim, simToRolePerms } from "@/template/rivera/features/roles/permissions";

export default function RolesListPage() {
  const { trail } = useBreadcrumbs();
  const roles = useLocalStore(rolesStore);
  const users = useLocalStore(usersStore);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);

  const memberCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of users) m.set(u.roleId, (m.get(u.roleId) ?? 0) + 1);
    return m;
  }, [users]);

  const totals = useMemo(() => {
    const system = roles.filter((r) => r.isSystem).length;
    return { total: roles.length, system, custom: roles.length - system };
  }, [roles]);

  const handleCreate = (draft: RoleDraft) => {
    rolesStore.create({
      name: draft.name, slug: draft.slug, description: draft.description,
      permissions: simToRolePerms(draft.permissions) as Role["permissions"],
      memberCount: 0, isSystem: false,
    });
    setCreateOpen(false);
    toast.success(`${draft.name} role created.`);
  };

  const handleEdit = (draft: RoleDraft) => {
    if (!editing) return;
    rolesStore.update(editing.id, {
      name: draft.name, slug: draft.slug, description: draft.description,
      permissions: simToRolePerms(draft.permissions) as Role["permissions"],
    });
    setEditing(null);
    toast.success(`${draft.name} role saved.`);
  };

  const handleDelete = () => {
    if (!deleting) return;
    rolesStore.remove(deleting.id);
    setDeleting(null);
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="User management"
        title="Roles"
        description="Define what people can do across the workspace."
        breadcrumbs={trail.length ? trail : [{ label: "User management" }, { label: "Roles" }]}
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5" />New role</Button>}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total roles" value={String(totals.total)} icon={Shield} accent="primary" compact />
        <StatCard label="System roles" value={String(totals.system)} icon={ShieldCheck} accent="info" compact />
        <StatCard label="Custom roles" value={String(totals.custom)} icon={Lock} accent="gold" compact />
        <StatCard label="Assigned users" value={String(users.length)} icon={Users} accent="success" compact />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => {
          const perms = rolePermsToSim(role.permissions);
          const isAdmin = role.permissions.includes("*");
          const count = memberCounts.get(role.id) ?? role.memberCount;
          return (
            <article key={role.id} className="group flex flex-col surface-card-interactive p-5">
              <header className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isAdmin ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"}`}>
                    <Shield className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <Link to={`/user-management/roles/view?id=${role.id}`} className="block truncate font-display text-base font-semibold text-foreground hover:underline">{role.name}</Link>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">{role.slug}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem asChild><Link to={`/user-management/roles/view?id=${role.id}`}><Eye className="mr-2 h-3.5 w-3.5" />View</Link></DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditing(role)}><Pencil className="mr-2 h-3.5 w-3.5" />Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={role.isSystem} onClick={() => !role.isSystem && setDeleting(role)} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </header>
              <p className="mt-3 text-sm text-muted-foreground">{role.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {role.isSystem ? <StatusBadge tone="info">System</StatusBadge> : <StatusBadge tone="accent">Custom</StatusBadge>}
                <StatusBadge tone="neutral"><Users className="h-3 w-3" /> {count} member{count === 1 ? "" : "s"}</StatusBadge>
                <StatusBadge tone="primary">{perms.length}/{SIM_PERMISSIONS.length} perms</StatusBadge>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-1.5 border-t border-border pt-3 text-xs">
                {SIM_PERMISSIONS.map((p) => {
                  const granted = perms.includes(p.key);
                  return (
                    <li key={p.key} className="flex items-center gap-1.5 text-muted-foreground">
                      <span className={`flex h-4 w-4 items-center justify-center rounded ${granted ? "bg-success-soft text-success" : "bg-muted text-muted-foreground/60"}`}>
                        {granted ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      </span>
                      <span className={granted ? "text-foreground" : ""}>{p.label}</span>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>

      <DataCard title="Permissions matrix" description="At-a-glance view of what each role can do." flush>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="sticky left-0 bg-card-muted px-5 py-3 font-medium">Permission</th>
                {roles.map((r) => <th key={r.id} className="px-3 py-3 text-center font-medium">{r.name}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SIM_PERMISSIONS.map((p) => (
                <tr key={p.key} className="transition-fast hover:bg-muted/40">
                  <td className="sticky left-0 bg-card px-5 py-3">
                    <p className="font-medium text-foreground">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </td>
                  {roles.map((r) => {
                    const granted = rolePermsToSim(r.permissions).includes(p.key);
                    return (
                      <td key={r.id} className="px-3 py-3 text-center">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${granted ? "bg-success-soft text-success" : "bg-muted text-muted-foreground/60"}`}>
                          {granted ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataCard>

      <RoleDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} />
      <RoleDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} role={editing} onSubmit={handleEdit} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        tone="destructive"
        title={deleting ? `Delete ${deleting.name}?` : "Delete role?"}
        description="Users assigned to this role will keep their assignment until reassigned."
        confirmLabel="Delete role"
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}