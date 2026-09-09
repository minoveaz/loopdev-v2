import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, MapPin, PackageOpen, Boxes } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { warehousesStore } from "@/template/rivera/data";
import { summarizeWarehouses, tooltipStyle, warehouseTone } from "@/template/rivera/features/logistics/shared";
import { formatNumber } from "@/lib/formatters";

export default function LogisticsWarehouses() {
  const { trail } = useBreadcrumbs();
  const warehouses = useLocalStore(warehousesStore);
  const w = summarizeWarehouses(warehouses);
  const data = useMemo(() => warehouses.map((x) => ({ name: x.code, occupancy: x.occupancy })), [warehouses]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Logistics"
        title="Warehouses"
        description="Capacity, occupancy, and global footprint."
        breadcrumbs={trail.length ? trail : [{ label: "Logistics" }, { label: "Warehouses" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sites" value={formatNumber(w.total)} icon={Building2} accent="primary" />
        <StatCard label="Active" value={formatNumber(w.active)} icon={MapPin} accent="accent" />
        <StatCard label="Capacity" value={`${formatNumber(w.capacity)}`} icon={Boxes} accent="info" />
        <StatCard label="Avg occupancy" value={`${w.avgOccupancy}%`} icon={PackageOpen} accent="gold" />
      </div>

      <DataCard title="Capacity utilization" description="Occupancy by site (%)">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -10, right: 6, top: 4 }}>
              <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="occupancy" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DataCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="All warehouses" description={`${warehouses.length} sites`}>
          <ul className="divide-y divide-border">
            {warehouses.map((wh) => (
              <li key={wh.id} className="grid gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">{wh.name}</p>
                    <p className="text-xs text-muted-foreground">{wh.code} · {wh.city}, {wh.country} · Mgr {wh.manager}</p>
                  </div>
                </div>
                <div className="min-w-[160px]">
                  <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>{wh.occupancy}% used</span>
                    <span>{formatNumber(wh.capacity)} cap</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${wh.occupancy}%` }}
                    />
                  </div>
                </div>
                <StatusBadge tone={warehouseTone(wh.occupancy)}>
                  {wh.occupancy >= 90 ? "Full" : wh.occupancy >= 75 ? "Tight" : "Healthy"}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </DataCard>

        <DataCard title="Route map" description="Global warehouse network">
          <div className="relative h-72 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card-muted/40 to-primary/5">
            <svg viewBox="0 0 400 220" className="h-full w-full text-border">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
                </pattern>
              </defs>
              <rect width="400" height="220" fill="url(#grid)" />
              {warehouses.map((wh, i) => {
                const cx = 40 + ((i * 67) % 320);
                const cy = 40 + ((i * 41) % 140);
                return (
                  <g key={wh.id}>
                    <circle cx={cx} cy={cy} r="14" className="fill-primary/10" />
                    <circle cx={cx} cy={cy} r="5" className="fill-primary" />
                    <text x={cx + 10} y={cy + 4} className="fill-foreground" fontSize="9">{wh.code}</text>
                  </g>
                );
              })}
              {warehouses.slice(1).map((_, i) => {
                const x1 = 40 + ((i * 67) % 320), y1 = 40 + ((i * 41) % 140);
                const x2 = 40 + (((i + 1) * 67) % 320), y2 = 40 + (((i + 1) * 41) % 140);
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-primary/30" strokeDasharray="3 3" strokeWidth="1" />;
              })}
            </svg>
            <div className="absolute bottom-2 right-2 rounded-md bg-card/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">
              Static map placeholder
            </div>
          </div>
        </DataCard>
      </div>
    </PageContainer>
  );
}