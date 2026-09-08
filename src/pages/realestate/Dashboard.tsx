import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo } from "react";
import { Building2, DollarSign, Handshake, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DataCard, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { listingsStore, dealsStore, agentsStore } from "@/data";
import { buildRevenueSeries, dealStageLabel, dealStageTone, formatPrice, listingStatusLabel, listingStatusTone, summarizeDeals, summarizeListings, tooltipStyle } from "@/features/realestate/shared";
import { formatNumber } from "@/lib/formatters";

export default function RealEstateDashboard() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const listings = useLocalStore(listingsStore);
  const deals = useLocalStore(dealsStore);
  const agents = useLocalStore(agentsStore);

  const lstats = summarizeListings(listings);
  const dstats = summarizeDeals(deals);
  const series = useMemo(buildRevenueSeries, []);
  const recentListings = [...listings].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 5);
  const recentDeals = [...deals].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 5);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Real Estate"
        title="Portfolio overview"
        description="Listings, pipeline, and revenue across all regions."
        breadcrumbs={trail.length ? trail : [{ label: "Real Estate" }, { label: "Dashboard" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active listings" value={formatNumber(lstats.available)} delta={4.6} icon={Building2} accent="primary" />
        <StatCard label="Pipeline value" value={formatPrice(lstats.totalValue)} delta={2.3} icon={DollarSign} accent="accent" />
        <StatCard label="Closed deals" value={formatNumber(dstats.won)} delta={5.1} icon={Handshake} accent="info" />
        <StatCard label="Agents" value={formatNumber(agents.length)} icon={Users} accent="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="Revenue trend" description="Monthly closed-won revenue">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ left: -10, right: 6, top: 4 }}>
                <defs>
                  <linearGradient id="re-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type={curve} dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#re-rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Pipeline" description={`${dstats.pipeline} open deals`}>
          <ul className="space-y-3">
            {recentDeals.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.client}</p>
                  <p className="truncate text-xs text-muted-foreground">{formatPrice(d.amount, d.currency)}</p>
                </div>
                <StatusBadge tone={dealStageTone[d.stage]}>{dealStageLabel[d.stage]}</StatusBadge>
              </li>
            ))}
          </ul>
        </DataCard>
      </div>

      <DataCard title="Recent listings" description="Latest updated">
        <ul className="divide-y divide-border">
          {recentListings.map((l) => (
            <li key={l.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <img src={l.imageUrl} alt={l.title} className="h-14 w-20 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{l.title}</p>
                <p className="truncate text-xs text-muted-foreground">{l.address} · {l.city}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold">{formatPrice(l.price, l.currency)}</p>
                <StatusBadge tone={listingStatusTone[l.status]}>{listingStatusLabel[l.status]}</StatusBadge>
              </div>
            </li>
          ))}
        </ul>
      </DataCard>
    </PageContainer>
  );
}