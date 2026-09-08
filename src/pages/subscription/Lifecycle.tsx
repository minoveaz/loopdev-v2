import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo } from "react";
import { Users, TrendingDown, DollarSign, Repeat } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Funnel, FunnelChart, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { DataCard, PageContainer, PageHeader, StatCard } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { subscriptionPlansStore } from "@/data";
import { buildChurnSeries, buildLifecycleFunnel, buildRevenueSeries, summarizePlans, tooltipStyle } from "@/features/subscription/shared";
import { formatNumber } from "@/lib/formatters";

const FUNNEL_COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--accent))", "hsl(var(--gold))", "hsl(var(--success))"];

export default function SubscriptionLifecycle() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const plans = useLocalStore(subscriptionPlansStore);
  const s = summarizePlans(plans);
  const funnel = useMemo(
    () => buildLifecycleFunnel(plans).map((f, i) => ({ ...f, fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length] })),
    [plans],
  );
  const revenue = useMemo(buildRevenueSeries, []);
  const churn = useMemo(buildChurnSeries, []);
  const churnRate = churn[churn.length - 1].churn;

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Subscription"
        title="Lifecycle"
        description="Acquisition, retention, churn, and revenue."
        breadcrumbs={trail.length ? trail : [{ label: "Subscription" }, { label: "Lifecycle" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active subs" value={formatNumber(s.subs)} delta={4.6} icon={Users} accent="primary" />
        <StatCard label="MRR" value={`$${s.mrr.toLocaleString()}`} delta={6.4} icon={DollarSign} accent="gold" />
        <StatCard label="ARR" value={`$${s.arr.toLocaleString()}`} delta={5.7} icon={Repeat} accent="accent" />
        <StatCard label="Churn rate" value={`${churnRate}%`} delta={-0.4} icon={TrendingDown} accent="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard title="Subscriber funnel" description="Visitor → loyal">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Funnel dataKey="value" data={funnel} isAnimationActive>
                  <LabelList position="right" dataKey="stage" fill="hsl(var(--foreground))" stroke="none" fontSize={11} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard className="lg:col-span-2" title="Revenue trend" description="MRR over time">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue} margin={{ left: -10, right: 6, top: 4 }}>
                <defs>
                  <linearGradient id="sub-mrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type={curve} dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#sub-mrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DataCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DataCard title="New vs. churned" description="Per month">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} margin={{ left: -10, right: 6, top: 4 }}>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="new" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="churn" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Churn rate" description="% per month">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={churn} margin={{ left: -10, right: 6, top: 4 }}>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type={curve} dataKey="churn" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DataCard>
      </div>
    </PageContainer>
  );
}