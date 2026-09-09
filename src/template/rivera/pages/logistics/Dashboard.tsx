import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo } from "react";
import { Truck, PackageCheck, Clock, AlertTriangle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DataCard, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { shipmentsStore, vehiclesStore, warehousesStore } from "@/template/rivera/data";
import { buildDeliverySeries, shipmentStatusLabel, shipmentStatusTone, summarizeFleet, summarizeShipments, summarizeWarehouses, tooltipStyle } from "@/template/rivera/features/logistics/shared";
import { formatNumber } from "@/lib/formatters";

export default function LogisticsDashboard() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const shipments = useLocalStore(shipmentsStore);
  const vehicles = useLocalStore(vehiclesStore);
  const warehouses = useLocalStore(warehousesStore);

  const s = summarizeShipments(shipments);
  const f = summarizeFleet(vehicles);
  const w = summarizeWarehouses(warehouses);
  const series = useMemo(buildDeliverySeries, []);
  const recent = [...shipments].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 6);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Logistics"
        title="Operations overview"
        description="Live view of shipments, fleet utilization, and warehouse capacity."
        breadcrumbs={trail.length ? trail : [{ label: "Logistics" }, { label: "Dashboard" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total shipments" value={formatNumber(s.total)} delta={5.4} icon={Truck} accent="primary" />
        <StatCard label="In transit" value={formatNumber(s.inTransit)} delta={2.1} icon={Clock} accent="info" />
        <StatCard label="Delivered" value={formatNumber(s.delivered)} delta={3.2} icon={PackageCheck} accent="accent" />
        <StatCard label="Delayed" value={formatNumber(s.delayed)} delta={-1.8} icon={AlertTriangle} accent="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="Delivery performance" description="Last 7 days">
          <ChartFrame>
            <BarChart data={series} margin={{ left: -10, right: 6, top: 4 }}>
              <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))", paddingTop: 8 }} />
              <Bar dataKey="onTime" name="On time" stackId="a" fill="hsl(var(--accent))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pending" name="Pending" stackId="a" fill="hsl(var(--primary))" />
              <Bar dataKey="delayed" name="Delayed" stackId="a" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </DataCard>

        <DataCard title="Fleet snapshot" description={`${f.total} vehicles`}>
          <ul className="space-y-3 text-sm">
            <Row label="Active" value={f.active} tone="success" />
            <Row label="Idle" value={f.idle} tone="info" />
            <Row label="Maintenance" value={f.maintenance} tone="warning" />
            <Row label="Retired" value={f.retired} tone="neutral" />
          </ul>
          <div className="mt-4 surface-card-muted-compact p-3 text-xs text-muted-foreground">
            Avg warehouse occupancy <span className="font-mono font-semibold text-foreground">{w.avgOccupancy}%</span> across {w.total} sites.
          </div>
        </DataCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="Recent shipments" description="Latest activity">
          <ul className="divide-y divide-border">
            {recent.map((sh) => (
              <li key={sh.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{sh.trackingNumber}</p>
                  <p className="truncate text-xs text-muted-foreground">{sh.origin} → {sh.destination}</p>
                </div>
                <div className="text-right">
                  <StatusBadge tone={shipmentStatusTone[sh.status]}>{shipmentStatusLabel[sh.status]}</StatusBadge>
                  <p className="mt-1 text-[11px] text-muted-foreground">ETA {new Date(sh.etaDate).toLocaleDateString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </DataCard>

        <DataCard title="Volume trend" description="Monthly shipments">
          <ChartFrame>
            <LineChart data={useMemo(() => Array.from({ length: 8 }).map((_, i) => ({ x: i, v: 280 + ((i * 53) % 220) })), [])} margin={{ left: -10, right: 6, top: 4 }}>
              <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="x" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type={curve} dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ChartFrame>
        </DataCard>
      </div>
    </PageContainer>
  );
}

function Row({ label, value, tone }: { label: string; value: number; tone: "success" | "info" | "warning" | "neutral" }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono font-semibold">{value}</span>
        <StatusBadge tone={tone}>{label}</StatusBadge>
      </div>
    </li>
  );
}

function ChartFrame({ children }: { children: React.ReactElement }) {
  return <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}