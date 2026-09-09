import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DataCard, PageContainer, PageHeader, StatCard } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { shipmentsStore, vehiclesStore, warehousesStore } from "@/template/rivera/data";
import { buildVolumeSeries, summarizeShipments, summarizeWarehouses, tooltipStyle } from "@/template/rivera/features/logistics/shared";
import { CheckCircle2, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { formatNumber } from "@/lib/formatters";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--gold))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

export default function LogisticsAnalytics() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const shipments = useLocalStore(shipmentsStore);
  const vehicles = useLocalStore(vehiclesStore);
  const warehouses = useLocalStore(warehousesStore);
  const s = summarizeShipments(shipments);
  const w = summarizeWarehouses(warehouses);

  const volume = useMemo(buildVolumeSeries, []);
  const statusBreakdown = [
    { name: "Delivered", value: s.delivered },
    { name: "In transit", value: s.inTransit },
    { name: "Pending", value: s.pending },
    { name: "Delayed", value: s.delayed },
    { name: "Cancelled", value: s.cancelled },
  ];
  const carrierMix = useMemo(() => {
    const map = new Map<string, number>();
    shipments.forEach((sh) => map.set(sh.carrier, (map.get(sh.carrier) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [shipments]);
  const onTimeRate = s.total ? Math.round(((s.delivered) / s.total) * 100) : 0;

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Logistics"
        title="Analytics"
        description="Performance, volume, and carrier mix at a glance."
        breadcrumbs={trail.length ? trail : [{ label: "Logistics" }, { label: "Analytics" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="On-time rate" value={`${onTimeRate}%`} delta={2.6} icon={CheckCircle2} accent="accent" />
        <StatCard label="Avg transit" value="3.2 days" delta={-0.4} icon={Clock} accent="info" />
        <StatCard label="Volume MoM" value="+8.1%" delta={8.1} icon={TrendingUp} accent="primary" />
        <StatCard label="Delay rate" value={`${s.total ? Math.round((s.delayed / s.total) * 100) : 0}%`} delta={-1.2} icon={AlertTriangle} accent="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="Shipment volume" description="Monthly trend">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volume} margin={{ left: -10, right: 6, top: 4 }}>
                <defs>
                  <linearGradient id="lg-vol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type={curve} dataKey="shipments" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#lg-vol)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Status breakdown" description="All shipments">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))", paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </DataCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DataCard title="Carrier mix" description="Shipments by carrier">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carrierMix} layout="vertical" margin={{ left: 20, right: 20, top: 4 }}>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={100} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Operational summary" description="At-a-glance">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Stat label="Fleet vehicles" value={formatNumber(vehicles.length)} />
            <Stat label="Warehouses" value={formatNumber(warehouses.length)} />
            <Stat label="Total capacity" value={formatNumber(w.capacity)} />
            <Stat label="Used capacity" value={formatNumber(w.used)} />
            <Stat label="Avg occupancy" value={`${w.avgOccupancy}%`} />
            <Stat label="Total shipments" value={formatNumber(s.total)} />
          </dl>
        </DataCard>
      </div>
    </PageContainer>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card-muted-compact p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-lg font-semibold">{value}</dd>
    </div>
  );
}