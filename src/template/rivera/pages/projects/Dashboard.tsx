import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { Activity, FolderKanban, ListChecks, Timer, Wallet } from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import {
  activityStore, projectsStore, tasksStore, timeEntriesStore, usersStore,
} from "@/template/rivera/data";
import { formatCurrency, formatRelative, getInitials } from "@/lib/formatters";
import { priorityTone, projectStatusTone } from "@/template/rivera/features/tasks/shared";

const STATUS_COLORS: Record<string, string> = {
  in_progress: "hsl(var(--info))",
  completed: "hsl(var(--success))",
  on_hold: "hsl(var(--warning))",
  planned: "hsl(var(--muted-foreground))",
  cancelled: "hsl(var(--destructive))",
};

export default function ProjectsDashboard() {
  const { trail } = useBreadcrumbs();
  const projects = useLocalStore(projectsStore);
  const tasks = useLocalStore(tasksStore);
  const time = useLocalStore(timeEntriesStore);
  const users = useLocalStore(usersStore);
  const activity = useLocalStore(activityStore);

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status === "in_progress").length;
    const overdue = tasks.filter(
      (t) => t.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date(),
    ).length;
    const hours = time.reduce((s, t) => s + t.hours, 0);
    const budget = projects.reduce((s, p) => s + p.budget, 0);
    const spent = projects.reduce((s, p) => s + p.spent, 0);
    return { active, overdue, hours, budget, spent };
  }, [projects, tasks, time]);

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projects) map.set(p.status, (map.get(p.status) ?? 0) + 1);
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [projects]);

  const burnData = useMemo(() => {
    return projects.map((p) => ({
      name: p.name.length > 14 ? p.name.slice(0, 12) + "…" : p.name,
      Budget: p.budget,
      Spent: p.spent,
    }));
  }, [projects]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Projects"
        title="Projects dashboard"
        description="Live snapshot of delivery health, budget burn, and team activity."
        breadcrumbs={trail}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Active projects" value={String(stats.active)} icon={FolderKanban} accent="primary" />
        <StatCard label="Open tasks" value={String(tasks.filter((t) => t.status !== "done").length)} icon={ListChecks} accent="info" hint={`${stats.overdue} overdue`} invertTrend />
        <StatCard label="Hours logged" value={`${stats.hours.toFixed(1)}h`} icon={Timer} accent="gold" />
        <StatCard label="Budget used" value={formatCurrency(stats.spent)} icon={Wallet} accent="success" hint={`of ${formatCurrency(stats.budget)}`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard title="Budget vs. spend" description="Per project, USD" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={burnData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--popover-foreground))", boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)", fontSize: 12, padding: "8px 12px" }} />
                <Bar dataKey="Budget" fill="hsl(var(--primary-soft))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Spent" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Status mix" description="Portfolio breakdown">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {statusData.map((d) => (
                    <Cell key={d.name} fill={STATUS_COLORS[d.name] ?? "hsl(var(--muted-foreground))"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--popover-foreground))", boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)", fontSize: 12, padding: "8px 12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {statusData.map((d) => (
              <li key={d.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[d.name] }} />
                <span className="capitalize text-muted-foreground">{d.name.replace("_", " ")}</span>
                <span className="ml-auto font-semibold">{d.value}</span>
              </li>
            ))}
          </ul>
        </DataCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DataCard title="Active projects" description="Top engagements by progress">
          <ul className="divide-y divide-border">
            {projects.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{p.name}</p>
                    <StatusBadge tone={projectStatusTone[p.status]}>{p.status.replace("_", " ")}</StatusBadge>
                    <StatusBadge tone={priorityTone[p.priority]} variant="outline">{p.priority}</StatusBadge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{p.client}</p>
                  <Progress value={p.progress} className="mt-2 h-1.5" />
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="font-semibold text-foreground">{p.progress}%</div>
                  <div>{formatCurrency(p.spent, p.currency, { compact: true })}</div>
                </div>
              </li>
            ))}
          </ul>
        </DataCard>

        <DataCard title="Recent activity" description="Across the workspace">
          {activity.length === 0 ? (
            <EmptyState icon={Activity} title="Nothing yet" />
          ) : (
            <ul className="space-y-3">
              {activity.slice(0, 7).map((a) => {
                const u = userMap.get(a.actorId);
                return (
                  <li key={a.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="text-[10px]">{getInitials(u?.name ?? "?")}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{u?.name ?? "System"}</span>{" "}
                        <span className="text-muted-foreground">{a.summary}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatRelative(a.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DataCard>
      </div>
    </PageContainer>
  );
}