import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, Building2, Calendar, Clock, Monitor, MapPin, Smartphone, Check, X } from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader, StatusBadge, type StatusTone } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { activityStore, rolesStore, usersStore } from "@/template/rivera/data";
import { formatDate, formatRelative, getInitials } from "@/lib/formatters";
import { SIM_PERMISSIONS, rolePermsToSim } from "@/template/rivera/features/roles/permissions";
import type { UserStatus } from "@/types";

const statusTone: Record<UserStatus, StatusTone> = {
  active: "success", pending: "warning", suspended: "destructive", archived: "neutral",
};

export default function ViewUserPage() {
  const { trail } = useBreadcrumbs();
  const [params] = useSearchParams();
  const id = params.get("id");
  const users = useLocalStore(usersStore);
  const roles = useLocalStore(rolesStore);
  const activity = useLocalStore(activityStore);

  const user = useMemo(() => users.find((u) => u.id === id) ?? users[0], [users, id]);
  const role = useMemo(() => (user ? roles.find((r) => r.id === user.roleId) : undefined), [user, roles]);
  const userActivity = useMemo(
    () => (user ? activity.filter((a) => a.actorId === user.id).slice(0, 8) : []),
    [activity, user],
  );
  const perms = role ? rolePermsToSim(role.permissions) : [];

  const sessions = useMemo(() => [
    { id: "s1", device: "MacBook Pro · Safari", location: "Lisbon, PT", ip: "82.155.21.4", lastActive: "2 minutes ago", current: true, icon: Monitor },
    { id: "s2", device: "iPhone 15 · Mobile Safari", location: "Lisbon, PT", ip: "84.21.13.9", lastActive: "5 hours ago", current: false, icon: Smartphone },
    { id: "s3", device: "Windows · Chrome", location: "Berlin, DE", ip: "91.64.18.2", lastActive: "3 days ago", current: false, icon: Monitor },
  ], []);

  if (!user) {
    return (
      <PageContainer width="narrow">
        <EmptyState title="User not found" description="The user you're looking for doesn't exist." action={<Button asChild><Link to="/user-management/users">Back to users</Link></Button>} />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="User management"
        title={user.name}
        description="Profile, role, and recent activity."
        breadcrumbs={trail.length ? trail : [{ label: "User management" }, { label: "Users" }, { label: "View" }]}
        actions={
          <Button variant="outline" asChild>
            <Link to="/user-management/users"><ArrowLeft className="h-3.5 w-3.5" />Back</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard title="Profile" description="At a glance">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 border border-border">
              <AvatarFallback className="bg-primary-soft text-lg font-semibold text-primary">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <h3 className="mt-3 text-base font-semibold">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.title || "—"}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <StatusBadge tone={statusTone[user.status]} dot>{user.status}</StatusBadge>
              {role && <StatusBadge tone="primary">{role.name}</StatusBadge>}
            </div>
          </div>
          <ul className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{user.email}</li>
            <li className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{user.department || "—"}</li>
            <li className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />Joined {formatDate(user.createdAt)}</li>
            <li className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" />Last active {formatRelative(user.lastActiveAt)}</li>
          </ul>
        </DataCard>

        <DataCard className="lg:col-span-2" title="Account details" description="Workspace and assignment">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={user.name} />
            <Field label="Email" value={user.email} />
            <Field label="Title" value={user.title || "—"} />
            <Field label="Department" value={user.department || "—"} />
            <Field label="Role" value={role?.name ?? "—"} />
            <Field label="Status" value={user.status} />
            <Field label="User ID" value={user.id} mono />
            <Field label="Created" value={formatDate(user.createdAt)} />
          </dl>

          <div className="mt-6">
            <h4 className="mb-3 text-sm font-semibold">Permissions summary</h4>
            <ul className="grid gap-2 sm:grid-cols-2">
              {SIM_PERMISSIONS.map((p) => {
                const granted = perms.includes(p.key);
                return (
                  <li key={p.key} className="flex items-start gap-2 rounded-md border border-border bg-card-muted/30 p-2.5 text-sm">
                    <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded ${granted ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>
                      {granted ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{p.label}</p>
                      <p className="text-[11px] text-muted-foreground">{p.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </DataCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DataCard title="Activity timeline" description="Recent actions">
          {userActivity.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <ol className="relative ml-2 space-y-4 border-l border-border pl-5">
              {userActivity.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                  <p className="text-sm font-medium">{a.summary}</p>
                  <p className="text-xs text-muted-foreground">{formatRelative(a.createdAt)} · {a.action}</p>
                </li>
              ))}
            </ol>
          )}
        </DataCard>

        <DataCard title="Recent sessions" description="Mock active sessions">
          <ul className="space-y-2">
            {sessions.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card-muted/30 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.device}</p>
                      <p className="truncate text-xs text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />{s.location} · {s.ip}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {s.current && <StatusBadge tone="success">Current</StatusBadge>}
                    <p className="mt-1 text-[11px] text-muted-foreground">{s.lastActive}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </DataCard>
      </div>
    </PageContainer>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card-muted/30 p-3">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 text-sm ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}