import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { Users } from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { tasksStore, timeEntriesStore, usersStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { getInitials } from "@/lib/formatters";

const WEEKLY_CAPACITY = 40;

export default function Workload() {
  const { trail } = useBreadcrumbs();
  const users = useLocalStore(usersStore);
  const tasks = useLocalStore(tasksStore);
  const time = useLocalStore(timeEntriesStore);

  const data = useMemo(() => {
    return users
      .filter((u) => u.status === "active")
      .map((u) => {
        const open = tasks.filter((t) => t.assigneeId === u.id && t.status !== "done").length;
        const hours = time.filter((t) => t.userId === u.id).reduce((s, t) => s + t.hours, 0);
        return {
          id: u.id,
          name: u.name.split(" ")[0],
          fullName: u.name,
          title: u.title,
          Open: open,
          Hours: hours,
          load: Math.min(120, Math.round((hours / WEEKLY_CAPACITY) * 100)),
        };
      });
  }, [users, tasks, time]);

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Projects"
        title="Workload"
        description="Open tasks and logged hours per teammate."
        breadcrumbs={trail}
      />

      <DataCard title="Capacity" description={`Hours logged vs. ${WEEKLY_CAPACITY}h weekly capacity`}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--popover-foreground))", boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)", fontSize: 12, padding: "8px 12px" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))", paddingTop: 8 }} />
              <Bar dataKey="Hours" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Open" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DataCard>

      <DataCard title="Per teammate">
        {data.length === 0 ? (
          <EmptyState icon={Users} title="No active members" />
        ) : (
          <ul className="divide-y divide-border">
            {data.map((d) => (
              <li key={d.id} className="grid grid-cols-1 items-center gap-3 py-3 md:grid-cols-[2fr_3fr_auto_auto]">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="text-xs">{getInitials(d.fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{d.fullName}</p>
                    <p className="text-xs text-muted-foreground">{d.title}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs">
                    <span>{d.Hours.toFixed(1)}h logged</span>
                    <span className="text-muted-foreground">{d.load}% of capacity</span>
                  </div>
                  <Progress value={Math.min(d.load, 100)} className="mt-1 h-1.5" />
                </div>
                <span className="text-sm text-muted-foreground">{d.Open} open</span>
                <StatusBadge tone={d.load > 100 ? "destructive" : d.load > 80 ? "warning" : "success"}>
                  {d.load > 100 ? "Overloaded" : d.load > 80 ? "Busy" : "Available"}
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </DataCard>
    </PageContainer>
  );
}