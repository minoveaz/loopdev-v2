import { useMemo, useState } from "react";
import { Truck, Wrench, Gauge, MapPin } from "lucide-react";
import { DataCard, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { vehiclesStore } from "@/data";
import { summarizeFleet, vehicleStatusTone } from "@/features/logistics/shared";
import { formatNumber } from "@/lib/formatters";

export default function LogisticsFleet() {
  const { trail } = useBreadcrumbs();
  const vehicles = useLocalStore(vehiclesStore);
  const f = summarizeFleet(vehicles);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (type !== "all" && v.type !== type) return false;
      if (!q) return true;
      return v.plate.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.driver.toLowerCase().includes(q);
    });
  }, [vehicles, search, type]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Logistics"
        title="Fleet"
        description="Vehicle availability, maintenance, and assignments."
        breadcrumbs={trail.length ? trail : [{ label: "Logistics" }, { label: "Fleet" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active" value={formatNumber(f.active)} delta={2.4} icon={Truck} accent="accent" />
        <StatCard label="Maintenance" value={formatNumber(f.maintenance)} delta={-0.5} icon={Wrench} accent="gold" />
        <StatCard label="Idle" value={formatNumber(f.idle)} icon={Gauge} accent="info" />
        <StatCard label="Total fleet" value={formatNumber(f.total)} icon={MapPin} accent="primary" />
      </div>

      <DataCard
        title="Vehicles"
        description={`${filtered.length} vehicles`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={search} onValueChange={setSearch} placeholder="Plate, model, driver…" containerClassName="w-64" />
            <FilterDropdown
              label="Type"
              value={type}
              onChange={setType}
              options={[
                { value: "all", label: "All" },
                { value: "van", label: "Van" },
                { value: "truck", label: "Truck" },
                { value: "bike", label: "Bike" },
                { value: "car", label: "Car" },
              ]}
            />
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => {
            const daysSinceService = Math.floor((Date.now() - +new Date(v.lastServiceAt)) / 86400000);
            const needsService = daysSinceService > 60;
            return (
              <div key={v.id} className="surface-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{v.type}</p>
                    <p className="text-lg font-semibold">{v.model}</p>
                    <p className="font-mono text-xs text-muted-foreground">{v.plate}</p>
                  </div>
                  <StatusBadge tone={vehicleStatusTone[v.status]}>{v.status}</StatusBadge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <Field label="Driver" value={v.driver} />
                  <Field label="Capacity" value={`${v.capacityKg} kg`} />
                  <Field label="Mileage" value={`${formatNumber(v.mileageKm)} km`} />
                  <Field label="Last service" value={`${daysSinceService}d ago`} />
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-card-muted/40 p-2 text-[11px]">
                  <Wrench className={`h-3.5 w-3.5 ${needsService ? "text-warning" : "text-success"}`} />
                  <span className={needsService ? "text-warning" : "text-muted-foreground"}>
                    {needsService ? "Service due soon" : "Maintenance up to date"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </DataCard>
    </PageContainer>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}