import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChefHat, Clock, DollarSign, Users, Utensils } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatCard, StatusBadge, type StatusTone } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { formatCurrency, formatNumber } from "@/lib/formatters";

const HOURLY = ["11","12","13","14","15","16","17","18","19","20","21","22"].map((h, i) => ({
  hour: `${h}:00`,
  covers: 6 + Math.round(Math.sin(i / 2) * 18 + i * 1.4 + (i > 6 ? 22 : 4)),
}));

const TABLES = Array.from({ length: 14 }, (_, i) => {
  const status = (["available", "seated", "ordering", "paying", "available", "seated"] as const)[i % 6];
  return { id: i + 1, status, party: status === "available" ? 0 : 1 + (i % 4) };
});

const tableTone: Record<typeof TABLES[number]["status"], StatusTone> = {
  available: "neutral",
  seated: "info",
  ordering: "warning",
  paying: "success",
};

const TOP_DISHES = [
  { name: "Truffle Risotto", sold: 86, revenue: 1892 },
  { name: "Wagyu Burger", sold: 74, revenue: 1480 },
  { name: "Seared Salmon", sold: 62, revenue: 1364 },
  { name: "Pesto Linguine", sold: 58, revenue: 986 },
  { name: "Tiramisu", sold: 51, revenue: 510 },
];

export default function RestaurantDashboard() {
  const { trail } = useBreadcrumbs();
  const totalCovers = useMemo(() => HOURLY.reduce((s, x) => s + x.covers, 0), []);
  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Dashboards"
        title="Restaurant"
        description="Live floor map, kitchen tickets and tonight's bestsellers."
        breadcrumbs={trail.length ? trail : [{ label: "Dashboards" }, { label: "Restaurant" }]}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Covers tonight" value={formatNumber(totalCovers)} icon={Users} accent="primary" delta={12.4} />
        <StatCard label="Avg ticket" value={formatCurrency(48, "USD")} icon={DollarSign} accent="success" delta={3.1} />
        <StatCard label="Wait time" value="14 min" icon={Clock} accent="info" delta={-8.2} hint="vs last week" />
        <StatCard label="Open tables" value={`${TABLES.filter(t=>t.status==='available').length}/${TABLES.length}`} icon={Utensils} accent="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard title="Covers by hour" description="Tonight's pacing" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HOURLY} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Bar dataKey="covers" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataCard>
        <DataCard title="Top dishes" description="By revenue tonight">
          <ul className="space-y-3">
            {TOP_DISHES.map((d, i) => (
              <li key={d.name} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary"><ChefHat className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{formatNumber(d.sold)} sold</p>
                </div>
                <span className="font-mono text-xs font-semibold">{formatCurrency(d.revenue, "USD")}</span>
                {i === 0 && <StatusBadge tone="gold">Top</StatusBadge>}
              </li>
            ))}
          </ul>
        </DataCard>
      </div>

      <DataCard title="Floor map" description="Live table status">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
          {TABLES.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Table</p>
              <p className="font-display text-2xl font-semibold">{t.id}</p>
              <StatusBadge tone={tableTone[t.status]} dot className="mt-1 capitalize">{t.status}</StatusBadge>
              {t.party > 0 && <p className="mt-1 text-[11px] text-muted-foreground">{t.party} guests</p>}
            </div>
          ))}
        </div>
      </DataCard>
    </PageContainer>
  );
}