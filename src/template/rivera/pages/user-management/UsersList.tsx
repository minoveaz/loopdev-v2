import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, MoreHorizontal, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge, type StatusTone } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { rolesStore, usersStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatDate, formatRelative, getInitials } from "@/lib/formatters";
import type { User, UserStatus } from "@/types";
import { UserDialog, type UserDraft } from "@/template/rivera/features/users/UserDialog";

type SortKey = "name" | "email" | "role" | "status" | "createdAt";
type SortDir = "asc" | "desc";

const statusTone: Record<UserStatus, StatusTone> = {
  active: "success", pending: "warning", suspended: "destructive", archived: "neutral",
};

export default function UsersListPage() {
  const { trail } = useBreadcrumbs();
  const users = useLocalStore(usersStore);
  const roles = useLocalStore(rolesStore);
  const roleMap = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (q && !(u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))) return false;
      if (statusFilter.length && !statusFilter.includes(u.status)) return false;
      if (roleFilter.length && !roleFilter.includes(u.roleId)) return false;
      return true;
    });
  }, [users, search, statusFilter, roleFilter]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let av: string;
      let bv: string;
      switch (sortKey) {
        case "role":
          av = roleMap.get(a.roleId)?.name ?? "";
          bv = roleMap.get(b.roleId)?.name ?? "";
          break;
        case "createdAt":
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
        default:
          av = String(a[sortKey] ?? "");
          bv = String(b[sortKey] ?? "");
      }
      return av.localeCompare(bv) * dir;
    });
  }, [filtered, sortKey, sortDir, roleMap]);

  const stats = useMemo(() => {
    const by = (s: UserStatus) => users.filter((u) => u.status === s).length;
    return { total: users.length, active: by("active"), pending: by("pending"), suspended: by("suspended") };
  }, [users]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) =>
    !active ? <ArrowUpDown className="h-3 w-3 opacity-50" /> : dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;

  const handleEdit = (draft: UserDraft) => {
    if (!editing) return;
    usersStore.update(editing.id, {
      name: draft.name, email: draft.email, roleId: draft.roleId, status: draft.status,
      title: draft.title || undefined, department: draft.department || undefined,
    });
    setEditing(null);
    toast.success(`${draft.name}'s profile saved.`);
  };

  const handleDelete = () => {
    if (!deleting) return;
    usersStore.remove(deleting.id);
    setDeleting(null);
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="User management"
        title="Users list"
        description="Search, filter, sort, and manage workspace members."
        breadcrumbs={trail.length ? trail : [{ label: "User management" }, { label: "Users" }]}
        actions={<Button asChild><Link to="/user-management/users/add"><Plus className="h-3.5 w-3.5" />Add user</Link></Button>}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total users" value={String(stats.total)} icon={UserPlus} accent="primary" compact />
        <StatCard label="Active" value={String(stats.active)} accent="success" compact />
        <StatCard label="Pending" value={String(stats.pending)} accent="gold" compact />
        <StatCard label="Suspended" value={String(stats.suspended)} accent="info" compact />
      </div>

      <DataCard
        title={`Members (${filtered.length})`}
        description="Click a row to view details."
        flush
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={search} onValueChange={setSearch} placeholder="Search name or email…" size="sm" containerClassName="w-56" />
            <FilterDropdown label="Status" multiple value={statusFilter} onChange={setStatusFilter} size="sm" align="end"
              options={[
                { label: "Active", value: "active" }, { label: "Pending", value: "pending" },
                { label: "Suspended", value: "suspended" }, { label: "Archived", value: "archived" },
              ]} />
            <FilterDropdown label="Role" multiple value={roleFilter} onChange={setRoleFilter} size="sm" align="end"
              options={roles.map((r) => ({ label: r.name, value: r.id }))} />
          </div>
        }
      >
        {sorted.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={UserPlus} title="No users match your filters" description="Try clearing filters or invite a new member." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {(
                    [["name", "User"], ["email", "Email"], ["role", "Role"], ["status", "Status"], ["createdAt", "Created"]] as [SortKey, string][]
                  ).map(([key, label]) => (
                    <th key={key} className="px-5 py-3 font-medium">
                      <button onClick={() => toggleSort(key)} className="inline-flex items-center gap-1.5 hover:text-foreground">
                        {label}<SortIcon active={sortKey === key} dir={sortDir} />
                      </button>
                    </th>
                  ))}
                  <th className="px-5 py-3 font-medium">Last active</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((u) => {
                  const role = roleMap.get(u.roleId);
                  return (
                    <tr key={u.id} className="transition-fast hover:bg-muted/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">{getInitials(u.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <Link to={`/user-management/users/view?id=${u.id}`} className="block truncate font-medium text-foreground hover:underline">{u.name}</Link>
                            <p className="truncate text-xs text-muted-foreground">{u.title || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-5 py-3"><StatusBadge tone="primary">{role?.name ?? "—"}</StatusBadge></td>
                      <td className="px-5 py-3"><StatusBadge tone={statusTone[u.status]} dot>{u.status}</StatusBadge></td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{formatRelative(u.lastActiveAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <Link to={`/user-management/users/view?id=${u.id}`}><Eye className="mr-2 h-3.5 w-3.5" />View</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditing(u)}><Pencil className="mr-2 h-3.5 w-3.5" />Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleting(u)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataCard>

      <UserDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} user={editing} roles={roles} onSubmit={handleEdit} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        tone="destructive"
        title={deleting ? `Delete ${deleting.name}?` : "Delete user?"}
        description="This permanently removes the user from your workspace mock data."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}