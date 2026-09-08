import { useMemo } from "react";
import { Target, TrendingUp } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { Progress } from "@/components/ui/progress";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { projectsStore, tasksStore, timeEntriesStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";

interface KPI {
  label: string;
  value: number;
  goal: number;
  unit?: string;
  tone: "success" | "warning" | "destructive" | "info";
}

export default function Targets() {
  const { trail } = useBreadcrumbs();
  const projects = useLocalStore(projectsStore);
  const tasks = useLocalStore(tasksStore);
  const time = useLocalStore(timeEntriesStore);

  const kpis: KPI[] = useMemo(() => {
    const completed = projects.filter((p) => p.status === "completed").length;
    const onTime = projects.filter((p) => p.status === "completed" && new Date(p.dueDate) >= new Date(p.updatedAt)).length;
    const billable = time.filter((t) => t.billable).reduce((s, t) => s + t.hours, 0);
    const totalHours = time.reduce((s, t) => s + t.hours, 0);
    const closedTasks = tasks.filter((t) => t.status === "done").length;
    return [
      { label: "Projects delivered", value: completed,            goal: 8,   tone: "success" },
      { label: "On-time delivery",   value: onTime,                goal: completed || 1, unit: "/", tone: "info" },
      { label: "Billable utilization", value: Math.round((billable / Math.max(totalHours, 1)) * 100), goal: 80, unit: "%", tone: "warning" },
      { label: "Tasks closed (Q)",   value: closedTasks,           goal: 25,  tone: "info" },
      { label: "Hours logged",       value: Math.round(totalHours),goal: 200, unit: "h", tone: "success" },
      { label: "Backlog items",      value: tasks.filter((t) => t.status === "backlog" || t.status === "todo").length, goal: 20, tone: "destructive" },
    ];
  }, [projects, tasks, time]);

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Projects"
        title="Targets & KPIs"
        description="Quarterly OKRs and team performance signals."
        breadcrumbs={trail}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="OKRs on track" value="4 / 6" icon={Target} accent="success" />
        <StatCard label="At risk" value="1" icon={TrendingUp} accent="gold" />
        <StatCard label="Below target" value="1" icon={TrendingUp} accent="info" invertTrend />
        <StatCard label="Quarter progress" value="62%" accent="primary" />
      </div>

      <DataCard title="Key results" description="Quantitative KPI tracking">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {kpis.map((k) => {
            const pct = Math.min(100, Math.round((k.value / Math.max(k.goal, 1)) * 100));
            return (
              <div key={k.label} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{k.label}</p>
                  <StatusBadge tone={pct >= 90 ? "success" : pct >= 60 ? "info" : pct >= 40 ? "warning" : "destructive"}>
                    {pct}%
                  </StatusBadge>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-display font-semibold">{k.value}{k.unit ?? ""}</span>
                  <span className="text-sm text-muted-foreground">/ {k.goal}{k.unit ?? ""}</span>
                </div>
                <Progress value={pct} className="mt-3 h-1.5" />
              </div>
            );
          })}
        </div>
      </DataCard>
    </PageContainer>
  );
}