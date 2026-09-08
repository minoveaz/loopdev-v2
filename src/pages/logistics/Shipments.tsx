import { useMemo, useState } from "react";
import { Truck, MapPin, CalendarClock, CheckCircle2, Circle } from "lucide-react";
import { DataCard, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { shipmentsStore } from "@/data";
import { buildTimeline, shipmentStatusLabel, shipmentStatusTone } from "@/features/logistics/shared";
import type { Shipment } from "@/types";

export default function LogisticsShipments() {
  const { trail } = useBreadcrumbs();
  const shipments = useLocalStore(shipmentsStore);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [carrier, setCarrier] = useState<string>("all");
  const [active, setActive] = useState<Shipment | null>(null);

  const carriers = useMemo(() => Array.from(new Set(shipments.map((s) => s.carrier))), [shipments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shipments.filter((s) => {
      if (status !== "all" && s.status !== status) return false;
      if (carrier !== "all" && s.carrier !== carrier) return false;
      if (!q) return true;
      return s.trackingNumber.toLowerCase().includes(q) || s.customer.toLowerCase().includes(q) || s.destination.toLowerCase().includes(q);
    });
  }, [shipments, search, status, carrier]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Logistics"
        title="Shipments"
        description="Search, filter, and track every parcel in flight."
        breadcrumbs={trail.length ? trail : [{ label: "Logistics" }, { label: "Shipments" }]}
      />

      <DataCard
        title="All shipments"
        description={`${filtered.length} of ${shipments.length}`}
        flush
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={search} onValueChange={setSearch} placeholder="Tracking, customer…" containerClassName="w-64" />
            <FilterDropdown
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "in_transit", label: "In transit" },
                { value: "delivered", label: "Delivered" },
                { value: "delayed", label: "Delayed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
            <FilterDropdown
              label="Carrier"
              value={carrier}
              onChange={setCarrier}
              options={[{ value: "all", label: "All" }, ...carriers.map((c) => ({ value: c, label: c }))]}
            />
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Weight</TableHead>
              <TableHead>ETA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id} className="cursor-pointer" onClick={() => setActive(s)}>
                <TableCell className="font-mono text-xs">{s.trackingNumber}</TableCell>
                <TableCell className="text-muted-foreground">{s.origin} → {s.destination}</TableCell>
                <TableCell>{s.carrier}</TableCell>
                <TableCell>{s.customer}</TableCell>
                <TableCell className="text-right font-mono">{s.weightKg} kg</TableCell>
                <TableCell>{new Date(s.etaDate).toLocaleDateString()}</TableCell>
                <TableCell><StatusBadge tone={shipmentStatusTone[s.status]}>{shipmentStatusLabel[s.status]}</StatusBadge></TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setActive(s); }}>Track</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataCard>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2"><Truck className="h-4 w-4" /> {active.trackingNumber}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info icon={MapPin} label="Origin" value={active.origin} />
                  <Info icon={MapPin} label="Destination" value={active.destination} />
                  <Info icon={CalendarClock} label="ETA" value={new Date(active.etaDate).toLocaleString()} />
                  <Info label="Carrier" value={active.carrier} />
                  <Info label="Customer" value={active.customer} />
                  <Info label="Weight" value={`${active.weightKg} kg`} />
                </div>
                <div className="surface-card-muted-compact p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tracking timeline</p>
                  <ol className="space-y-3">
                    {buildTimeline(active).map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          {step.done
                            ? <CheckCircle2 className="h-4 w-4 text-success" />
                            : <Circle className="h-4 w-4 text-muted-foreground" />}
                          {i < 5 && <span className="mt-1 h-6 w-px bg-border" />}
                        </div>
                        <div className="flex-1 pb-2">
                          <p className={`text-sm ${step.done ? "font-medium" : "text-muted-foreground"}`}>{step.label}</p>
                          <p className="text-[11px] text-muted-foreground">{new Date(step.at).toLocaleString()}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}

function Info({ icon: Icon, label, value }: { icon?: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{Icon && <Icon className="h-3 w-3" />} {label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}