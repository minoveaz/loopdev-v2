import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { addDays, isWithinInterval, startOfDay } from "date-fns";
import {
  Activity,
  Eye,
  Globe2,
  Monitor,
  MousePointerClick,
  Smartphone,
  Tablet,
  Target,
  TrendingDown,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataCard, DateRangeFilter, EmptyState, FilterDropdown, PageContainer, PageHeader, StatCard, StatusBadge, type StatusTone } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
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

const sourceTone: Record<string, StatusTone> = {
  Direct: "primary",
  Organic: "success",
  Referral: "info",
  Social: "accent",
  Email: "gold",
};

const conversions = [
  { label: "Signups", value: 482, rate: 4.6, delta: 6.1 },
  { label: "Trial starts", value: 261, rate: 2.5, delta: 3.4 },
  { label: "Paid conversions", value: 124, rate: 1.2, delta: -0.8 },
];

/** Anchor each row of `trafficByDay` to a real calendar date so a date-range
 * picker can filter the series. The last entry maps to "today". */
function buildTrafficDates(): Date[] {
  const today = startOfDay(new Date());
  return trafficByDay.map((_, i) => addDays(today, -(trafficByDay.length - 1 - i)));
}
const TRAFFIC_DATES = buildTrafficDates();
const EARLIEST = TRAFFIC_DATES[0];
const LATEST = TRAFFIC_DATES[TRAFFIC_DATES.length - 1];

const PRESETS = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 5 days", value: "5d" },
  { label: "Last 3 days", value: "3d" },
  { label: "Custom range", value: "custom" },
];

export default function TrafficReport() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const [preset, setPreset] = useState("7d");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [channels, setChannels] = useState<string[]>([]);

  const channelOptions = useMemo(
    () => channelBreakdown.map((c) => ({ label: c.label, value: c.label })),
    [],
  );

  /** Window of traffic rows after applying the preset / custom range. */
  const series = useMemo(() => {
    if (preset === "custom" && customRange?.from) {
      const from = startOfDay(customRange.from);
      const to = startOfDay(customRange.to ?? customRange.from);
      return trafficByDay.filter((_, i) => isWithinInterval(TRAFFIC_DATES[i], { start: from, end: to }));
    }
    const n = preset === "3d" ? 3 : preset === "5d" ? 5 : 7;
    return trafficByDay.slice(-n);
  }, [preset, customRange]);

  /** Channels visible after the multi-select filter. */
  const filteredChannels = useMemo(
    () => (channels.length === 0 ? channelBreakdown : channelBreakdown.filter((c) => channels.includes(c.label))),
    [channels],
  );

  const totals = useMemo(() => {
    const totalShare = channelBreakdown.reduce((s, c) => s + c.value, 0) || 1;
    const pickedShare = filteredChannels.reduce((s, c) => s + c.value, 0);
    /** Scale session/pageview totals by the picked channels' share of overall traffic. */
    const channelScale = channels.length === 0 ? 1 : pickedShare / totalShare;
    const sessions = series.reduce((s, d) => s + d.visitors, 0) * channelScale;
    const pageViews = series.reduce((s, d) => s + d.pageViews, 0) * channelScale;
    const bounce = series.length ? series.reduce((s, d) => s + d.bounceRate, 0) / series.length : 0;
    return { sessions, pageViews, bounce };
  }, [series, filteredChannels, channels]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Reports"
        title="Traffic Report"
        description="Sessions, traffic sources, devices, and conversion outcomes."
        breadcrumbs={trail.length ? trail : [{ label: "Reports" }, { label: "Traffic Report" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="Channels"
              multiple
              value={channels}
              onChange={setChannels}
              icon="filter"
              size="sm"
              align="end"
              options={channelOptions}
            />
            <FilterDropdown
              label="Range"
              value={preset}
              onChange={(v) => {
                setPreset(v);
                if (v !== "custom") setCustomRange(undefined);
              }}
              icon="none"
              size="sm"
              align="end"
              options={PRESETS}
            />
            {preset === "custom" && (
              <DateRangeFilter
                value={customRange}
                onChange={setCustomRange}
                size="sm"
                minDate={EARLIEST}
                maxDate={LATEST}
                placeholder="Pick days"
              />
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sessions" value={formatNumber(totals.sessions)} delta={8.2} hint="vs. last week" icon={Activity} accent="primary" />
        <StatCard label="Page Views" value={formatNumber(totals.pageViews)} delta={6.4} hint="vs. last week" icon={Eye} accent="info" />
        <StatCard label="Bounce Rate" value={`${totals.bounce.toFixed(1)}%`} delta={-1.8} invertTrend hint="lower is better" icon={TrendingDown} accent="gold" />
        <StatCard label="Conversion Rate" value="3.1%" delta={0.4} hint="overall funnel" icon={Target} accent="success" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard title="Sessions" description="Session and page view trend in the selected window" className="lg:col-span-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {series.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <EmptyState icon={Activity} title="No sessions in range" description="Pick a wider window to see traffic." />
                </div>
              ) : (
              <AreaChart data={series} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="t-vis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type={curve} name="Sessions" dataKey="visitors" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#t-vis)" />
              </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Device breakdown" description="Sessions by device type">
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
        <DataCard title="Traffic sources" description="Share of sessions by acquisition channel" className="lg:col-span-2" flush>
          {filteredChannels.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Globe2} title="No traffic yet" description="Acquisition channels will appear here." />
            </div>
          ) : (
            <>
              <div className="h-56 w-full px-5 pt-5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredChannels} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="label" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={70} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatPercent(v, { alreadyPercent: true })} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-y border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Source</th>
                      <th className="px-5 py-3 font-medium text-right">Share</th>
                      <th className="px-5 py-3 font-medium text-right">Sessions</th>
                      <th className="px-5 py-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredChannels.map((c) => {
                      const sessions = Math.round((c.value / 100) * totals.sessions);
                      const tone = sourceTone[c.label] ?? "neutral";
                      return (
                        <tr key={c.label} className="transition-fast hover:bg-muted/50">
                          <td className="px-5 py-3 font-medium text-foreground">{c.label}</td>
                          <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{c.value}%</td>
                          <td className="px-5 py-3 text-right tabular-nums text-foreground">{formatNumber(sessions)}</td>
                          <td className="px-5 py-3 text-right">
                            <StatusBadge tone={tone} dot>active</StatusBadge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </DataCard>

        <DataCard title="Conversions" description="Funnel outcomes this period">
          <ul className="space-y-3">
            {conversions.map((c) => {
              const tone: StatusTone = c.delta >= 0 ? "success" : "destructive";
              return (
                <li key={c.label} className="surface-card-muted-compact p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                      {c.label}
                    </span>
                    <StatusBadge tone={tone} variant="soft">{c.delta >= 0 ? "+" : ""}{c.delta}%</StatusBadge>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-display text-2xl font-semibold tracking-tight tabular-nums text-foreground">{formatNumber(c.value)}</span>
                    <span className="font-mono text-xs text-muted-foreground">{c.rate}% rate</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </DataCard>
      </div>

      <div className="mt-6">
        <DataCard title="Top pages" description="Most-visited URLs this week" flush>
          {topPages.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Globe2} title="No traffic yet" description="Your top pages will appear here." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Path</th>
                    <th className="px-5 py-3 font-medium text-right">Views</th>
                    <th className="px-5 py-3 font-medium text-right">Avg. time</th>
                    <th className="px-5 py-3 font-medium text-right">Conv. rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topPages.map((p, i) => (
                    <tr key={p.path} className="transition-fast hover:bg-muted/50">
                      <td className="px-5 py-3 font-mono text-xs text-foreground">{p.path}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-foreground">{formatNumber(p.views)}</td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{p.avgTime}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{(2 + i * 0.6).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataCard>
      </div>
    </PageContainer>
  );
}