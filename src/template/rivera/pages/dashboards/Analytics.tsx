import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, Eye, Globe2, MousePointerClick, Smartphone, Tablet, Monitor,
  TrendingDown, Users, Wifi,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { DataCard, FilterDropdown, PageContainer, PageHeader, StatCard, StatusBadge, type StatusTone } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import { channelBreakdown, topPages, trafficByDay } from "@/template/rivera/data";
import { formatNumber, formatPercent } from "@/lib/formatters";

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
  padding: "8px 12px",
  boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)",
};

const palette = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--gold))",
  "hsl(var(--info))",
  "hsl(var(--success))",
];

const devices = [
  { label: "Desktop", value: 58, icon: Monitor },
  { label: "Mobile", value: 34, icon: Smartphone },
  { label: "Tablet", value: 8, icon: Tablet },
];

const browsers = [
  { name: "Chrome", share: 62.4, sessions: 18420 },
  { name: "Safari", share: 19.1, sessions: 5640 },
  { name: "Edge", share: 8.7, sessions: 2570 },
  { name: "Firefox", share: 6.2, sessions: 1830 },
  { name: "Other", share: 3.6, sessions: 1060 },
];

const geo = [
  { country: "United States", flag: "🇺🇸", visitors: 8420, share: 32 },
  { country: "United Kingdom", flag: "🇬🇧", visitors: 4120, share: 16 },
  { country: "Germany", flag: "🇩🇪", visitors: 3180, share: 12 },
  { country: "France", flag: "🇫🇷", visitors: 2640, share: 10 },
  { country: "Japan", flag: "🇯🇵", visitors: 2210, share: 8 },
  { country: "Brazil", flag: "🇧🇷", visitors: 1820, share: 7 },
];

const trafficTrendTone: Record<string, StatusTone> = {
  up: "success",
  down: "destructive",
  flat: "neutral",
};

const RANGE_FACTOR: Record<string, number> = {
  today: 0.18,
  "7d": 1,
  "30d": 4.1,
  "12m": 48,
};

const RANGE_LABEL: Record<string, string> = {
  today: "today",
  "7d": "vs. last week",
  "30d": "vs. last month",
  "12m": "vs. last year",
};

export default function AnalyticsDashboard() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const loading = useSimulatedLoad(700);
  const [range, setRange] = useState("7d");
  const [live, setLive] = useState(247);

  useEffect(() => {
    const id = setInterval(() => {
      setLive((v) => Math.max(80, Math.min(520, v + Math.round((Math.random() - 0.5) * 40))));
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const factor = RANGE_FACTOR[range] ?? 1;

  const totals = useMemo(() => {
    const visitors = trafficByDay.reduce((s, d) => s + d.visitors, 0) * factor;
    const pageViews = trafficByDay.reduce((s, d) => s + d.pageViews, 0) * factor;
    const bounce = trafficByDay.reduce((s, d) => s + d.bounceRate, 0) / trafficByDay.length;
    return { visitors: Math.round(visitors), pageViews: Math.round(pageViews), bounce };
  }, [factor]);

  const trendData = useMemo(
    () => trafficByDay.map((d) => ({
      ...d,
      visitors: Math.round(d.visitors * (factor < 1 ? factor * 6 : 1)),
      pageViews: Math.round(d.pageViews * (factor < 1 ? factor * 6 : 1)),
    })),
    [factor],
  );

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Dashboards"
        title="Analytics"
        description="Sessions, visitors, and engagement across channels."
        breadcrumbs={trail.length ? trail : [{ label: "Dashboard" }, { label: "Analytics" }]}
        actions={
          <FilterDropdown
            label="Range"
            value={range}
            onChange={setRange}
            icon="none"
            size="sm"
            align="end"
            options={[
              { label: "Today", value: "today" },
              { label: "Last 7 days", value: "7d" },
              { label: "Last 30 days", value: "30d" },
              { label: "Last 12 months", value: "12m" },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard loading={loading} label="Sessions" value={formatNumber(totals.visitors)} delta={8.2} hint={RANGE_LABEL[range]} icon={Activity} accent="primary" />
        <StatCard loading={loading} label="Page Views" value={formatNumber(totals.pageViews)} delta={6.4} hint={RANGE_LABEL[range]} icon={Eye} accent="info" />
        <StatCard loading={loading} label="Bounce Rate" value={formatPercent(totals.bounce, { alreadyPercent: true, decimals: 1 })} delta={-1.8} invertTrend hint="lower is better" icon={TrendingDown} accent="gold" />
        <StatCard loading={loading} label="Avg. Session Duration" value="2m 34s" delta={3.1} hint={RANGE_LABEL[range]} icon={MousePointerClick} accent="success" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard title="Visitor trend" description="Sessions and page views over the selected range" className="lg:col-span-2" loading={loading} loadingHeight={272}>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="vis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
                <Area type={curve} name="Page views" dataKey="pageViews" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#pv)" />
                <Area type={curve} name="Visitors" dataKey="visitors" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#vis)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Device breakdown" description="Sessions by device type" loading={loading} loadingHeight={264}>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatPercent(v, { alreadyPercent: true })} />
                <Pie data={devices} dataKey="value" nameKey="label" innerRadius={48} outerRadius={72} paddingAngle={2} stroke="hsl(var(--card))" strokeWidth={2}>
                  {devices.map((_, i) => (
                    <Cell key={i} fill={palette[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-2.5">
            {devices.map((d, i) => {
              const Icon = d.icon;
              return (
                <li key={d.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${palette[i]}1a`, color: palette[i] }}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {d.label}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{d.value}%</span>
                </li>
              );
            })}
          </ul>
        </DataCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard title="Traffic sources" description="Share of sessions by acquisition channel" loading={loading} loadingHeight={224}>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelBreakdown} layout="vertical" margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="label" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatPercent(v, { alreadyPercent: true })} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard
          title="Top pages"
          description="Most-visited URLs"
          className="lg:col-span-2"
          flush
          loading={loading}
          loadingHeight={224}
          empty={!loading && topPages.length === 0}
          emptyIcon={Globe2}
          emptyTitle="No traffic yet"
          emptyDescription="Your top pages will appear here."
        >
          <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Path</th>
                    <th className="px-5 py-3 font-medium">Views</th>
                    <th className="px-5 py-3 font-medium">Avg. time</th>
                    <th className="px-5 py-3 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topPages.map((p, i) => {
                    const trend = i % 3 === 0 ? "down" : i % 2 === 0 ? "up" : "flat";
                    return (
                      <tr key={p.path} className="transition-fast hover:bg-muted/50">
                        <td className="px-5 py-3 font-mono text-xs text-foreground">{p.path}</td>
                        <td className="px-5 py-3 tabular-nums text-foreground">{formatNumber(p.views)}</td>
                        <td className="px-5 py-3 text-muted-foreground">{p.avgTime}</td>
                        <td className="px-5 py-3">
                          <StatusBadge tone={trafficTrendTone[trend]} dot>
                            {trend}
                          </StatusBadge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>
        </DataCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard title="Browser usage" description="Sessions by browser" className="lg:col-span-2" flush loading={loading} loadingHeight={240}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Browser</th>
                  <th className="px-5 py-3 font-medium">Sessions</th>
                  <th className="px-5 py-3 font-medium">Share</th>
                  <th className="px-5 py-3 font-medium w-1/3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {browsers.map((b, i) => (
                  <tr key={b.name} className="transition-fast hover:bg-muted/50">
                    <td className="px-5 py-3 font-medium text-foreground">{b.name}</td>
                    <td className="px-5 py-3 tabular-nums text-foreground">{formatNumber(b.sessions)}</td>
                    <td className="px-5 py-3 tabular-nums text-muted-foreground">{formatPercent(b.share, { alreadyPercent: true })}</td>
                    <td className="px-5 py-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${b.share}%`, background: palette[i % palette.length] }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataCard>

        <DataCard
          title="Real-time visitors"
          description="Active on site right now"
          loading={loading}
          loadingHeight={200}
          action={
            <span className="flex items-center gap-1.5 text-xs font-medium text-success">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Live
            </span>
          }
        >
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold tabular-nums text-foreground">{live}</span>
            <span className="text-sm text-muted-foreground">visitors</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-border bg-card-muted p-2">
              <Wifi className="mx-auto h-4 w-4 text-primary" />
              <div className="mt-1 font-medium text-foreground">{Math.round(live * 0.62)}</div>
              <div className="text-muted-foreground">Desktop</div>
            </div>
            <div className="rounded-lg border border-border bg-card-muted p-2">
              <Smartphone className="mx-auto h-4 w-4 text-accent" />
              <div className="mt-1 font-medium text-foreground">{Math.round(live * 0.31)}</div>
              <div className="text-muted-foreground">Mobile</div>
            </div>
            <div className="rounded-lg border border-border bg-card-muted p-2">
              <Tablet className="mx-auto h-4 w-4 text-gold" />
              <div className="mt-1 font-medium text-foreground">{Math.round(live * 0.07)}</div>
              <div className="text-muted-foreground">Tablet</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Peak today</span>
            <span className="font-mono text-foreground">512</span>
          </div>
        </DataCard>
      </div>

      <div className="mt-6">
        <DataCard
          title="Geographic traffic"
          description="Top countries by visitor count"
          loading={loading}
          loadingHeight={220}
          empty={!loading && geo.length === 0}
          emptyIcon={Globe2}
          emptyTitle="No regional data"
          emptyDescription="Visitor geography will appear here once traffic is recorded."
        >
          <ul className="space-y-3">
            {geo.map((g) => (
              <li key={g.country} className="flex items-center gap-3">
                <span className="text-xl leading-none">{g.flag}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{g.country}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatNumber(g.visitors)} · {g.share}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${g.share * 2.8}%` }} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </DataCard>
      </div>
    </PageContainer>
  );
}
