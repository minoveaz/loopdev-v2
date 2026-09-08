import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo } from "react";
import { Megaphone, MousePointerClick, Target, DollarSign } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DataCard, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { campaignsStore } from "@/data";
import { buildEmailSeries, channelTone, statusLabel, statusTone, summarize, tooltipStyle } from "@/features/marketing/shared";
import { formatNumber } from "@/lib/formatters";

export default function MarketingDashboard() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const campaigns = useLocalStore(campaignsStore);
  const s = summarize(campaigns);
  const series = useMemo(buildEmailSeries, []);
  const top = [...campaigns].sort((a, b) => b.conversions - a.conversions).slice(0, 5);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Marketing"
        title="Campaigns overview"
        description="Spend, reach, and conversions across every channel."
        breadcrumbs={trail.length ? trail : [{ label: "Marketing" }, { label: "Dashboard" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active campaigns" value={formatNumber(s.running)} delta={4.1} icon={Megaphone} accent="primary" />
        <StatCard label="Total clicks" value={formatNumber(s.clicks)} delta={6.8} icon={MousePointerClick} accent="info" />
        <StatCard label="Conversions" value={formatNumber(s.conversions)} delta={3.6} icon={Target} accent="accent" />
        <StatCard label="ROAS" value={`${s.roas}x`} delta={1.4} icon={DollarSign} accent="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="Email performance" description="Last 7 days">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ left: -10, right: 6, top: 4 }}>
                <defs>
                  <linearGradient id="mk-sent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mk-open" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))", paddingTop: 8 }} />
                <Area type={curve} dataKey="sent" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#mk-sent)" />
                <Area type={curve} dataKey="opens" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#mk-open)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Top campaigns" description="By conversions">
          <ul className="space-y-3">
            {top.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{c.channel}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">{formatNumber(c.conversions)}</p>
                  <StatusBadge tone={statusTone[c.status]}>{statusLabel[c.status]}</StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        </DataCard>
      </div>

      <DataCard title="Click activity" description="Daily clicks">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ left: -10, right: 6, top: 4 }}>
              <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DataCard>
    </PageContainer>
  );
}