import { useMemo } from "react";
import { Wallet } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { DataCard, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { Progress } from "@/components/ui/progress";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { projectsStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatCurrency } from "@/lib/formatters";
import { projectHealth } from "@/template/rivera/features/projects/shared";

const HEALTH_TONE = {
  "on-track": "success",
  "at-risk": "warning",
  "off-track": "destructive",
} as const;

export default function Budgets() {
  const { trail } = useBreadcrumbs();
  const projects = useLocalStore(projectsStore);

  const totals = useMemo(() => {
    const budget = projects.reduce((s, p) => s + p.budget, 0);
    const spent = projects.reduce((s, p) => s + p.spent, 0);
    return { budget, spent, remaining: budget - spent, pct: budget ? Math.round((spent / budget) * 100) : 0 };
  }, [projects]);

  const chart = useMemo(() => projects.map((p) => ({
    name: p.name.length > 12 ? p.name.slice(0, 11) + "…" : p.name,
    Spent: p.spent,
    Remaining: Math.max(0, p.budget - p.spent),
  })), [projects]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Projects"
        title="Budgets"
        description="Track spend against allocated budgets per engagement."
        breadcrumbs={trail}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total budget" value={formatCurrency(totals.budget)} icon={Wallet} accent="primary" />
        <StatCard label="Spent" value={formatCurrency(totals.spent)} accent="info" hint={`${totals.pct}% used`} />
        <StatCard label="Remaining" value={formatCurrency(totals.remaining)} accent="success" />
        <StatCard label="Engagements" value={String(projects.length)} accent="gold" />
      </div>

      <DataCard title="Spend vs. remaining" description="Per project, USD">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--popover-foreground))", boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)", fontSize: 12, padding: "8px 12px" }} />
              <Bar dataKey="Spent" stackId="b" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Remaining" stackId="b" fill="hsl(var(--primary-soft))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DataCard>

      <DataCard title="Budget breakdown" description="Per project burn">
        <ul className="divide-y divide-border">
          {projects.map((p) => {
            const pct = p.budget ? Math.round((p.spent / p.budget) * 100) : 0;
            const health = projectHealth(p);
            return (
              <li key={p.id} className="grid grid-cols-1 items-center gap-3 py-3 md:grid-cols-[1.5fr_2fr_1fr_1fr_auto]">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.client}</p>
                </div>
                <div>
                  <div className="flex justify-between text-xs">
                    <span>{formatCurrency(p.spent, p.currency)}</span>
                    <span className="text-muted-foreground">of {formatCurrency(p.budget, p.currency)}</span>
                  </div>
                  <Progress value={pct} className="mt-1 h-1.5" />
                </div>
                <div className="text-sm font-semibold">{pct}%</div>
                <div className="text-sm text-muted-foreground">Progress {p.progress}%</div>
                <StatusBadge tone={HEALTH_TONE[health]}>{health}</StatusBadge>
              </li>
            );
          })}
        </ul>
      </DataCard>
    </PageContainer>
  );
}