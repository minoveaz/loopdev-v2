import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, DollarSign, Handshake, TrendingUp } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatCard } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { listingsStore, dealsStore } from "@/template/rivera/data";
import { buildRevenueSeries, formatPrice, propertyDistribution, summarizeDeals, summarizeListings, tooltipStyle } from "@/template/rivera/features/realestate/shared";
import { formatNumber } from "@/lib/formatters";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--gold))", "hsl(var(--info))", "hsl(var(--muted-foreground))"];

export default function RealEstateAnalytics() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const listings = useLocalStore(listingsStore);
  const deals = useLocalStore(dealsStore);

  const lstats = summarizeListings(listings);
  const dstats = summarizeDeals(deals);
  const series = useMemo(buildRevenueSeries, []);
  const distribution = useMemo(() => propertyDistribution(listings), [listings]);

  const cityBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    listings.forEach((l) => map.set(l.city, (map.get(l.city) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [listings]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Real Estate"
        title="Analytics"
        description="Performance, pipeline, and inventory insights."
        breadcrumbs={trail.length ? trail : [{ label: "Real Estate" }, { label: "Analytics" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Inventory" value={formatNumber(lstats.total)} delta={3.2} icon={Building2} accent="primary" />
        <StatCard label="Avg price" value={formatPrice(lstats.avgPrice)} delta={1.4} icon={DollarSign} accent="accent" />
        <StatCard label="Won deals" value={formatNumber(dstats.won)} delta={6.8} icon={Handshake} accent="info" />
        <StatCard label="Avg deal size" value={formatPrice(dstats.avgDeal)} delta={2.1} icon={TrendingUp} accent="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="Revenue trend" description="Monthly closed-won revenue">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ left: -10, right: 6, top: 4 }}>
                <defs>
                  <linearGradient id="re-an-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type={curve} dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#re-an-rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Property types" description="Inventory mix">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))", paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </DataCard>
      </div>

      <DataCard title="Listings by city" description="Geographic distribution">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cityBreakdown} margin={{ left: -10, right: 6, top: 4 }}>
              <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DataCard>
    </PageContainer>
  );
}