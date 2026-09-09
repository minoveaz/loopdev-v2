import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataCard, EmptyState, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { shipmentsStore, vehiclesStore } from "@/template/rivera/data";
import { shipmentStatusLabel, shipmentStatusTone } from "@/template/rivera/features/logistics/shared";
import type { Shipment } from "@/types";

type Draft = Omit<Shipment, "id" | "createdAt" | "updatedAt">;
const empty: Draft = {
  trackingNumber: "", origin: "", destination: "", carrier: "Rivera Express",
  weightKg: 10, status: "pending", etaDate: new Date(Date.now() + 86400000 * 4).toISOString(),
  customer: "", vehicleId: "",
};

export default function LogisticsManageShipments() {
  const { trail } = useBreadcrumbs();
  const shipments = useLocalStore(shipmentsStore);
  const vehicles = useLocalStore(vehiclesStore);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return shipments;
    return shipments.filter((s) => s.trackingNumber.toLowerCase().includes(q) || s.customer.toLowerCase().includes(q));
  }, [shipments, search]);

  const openCreate = () => {
    setEditing(null);
    setDraft({ ...empty, trackingNumber: `RX-${Date.now().toString().slice(-6)}` });
    setOpen(true);
  };
  const openEdit = (s: Shipment) => {
    setEditing(s);
    setDraft({ trackingNumber: s.trackingNumber, origin: s.origin, destination: s.destination, carrier: s.carrier, weightKg: s.weightKg, status: s.status, etaDate: s.etaDate, customer: s.customer, vehicleId: s.vehicleId });
    setOpen(true);
  };
  const save = () => {
    if (!draft.trackingNumber.trim() || !draft.origin.trim() || !draft.destination.trim()) {
      toast.error("Tracking, origin, and destination are required"); return;
    }
    if (editing) { shipmentsStore.update(editing.id, draft); }
    else { shipmentsStore.create(draft); }
    setOpen(false);
  };
  const remove = () => { if (confirmId) { shipmentsStore.remove(confirmId); setConfirmId(null); } };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Logistics"
        title="Manage shipments"
        description="Create, edit, and delete shipments."
        breadcrumbs={trail.length ? trail : [{ label: "Logistics" }, { label: "Shipments" }, { label: "Manage" }]}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New shipment</Button>}
      />

      <DataCard title="All shipments" description={`${filtered.length} records`} flush
        action={<SearchInput value={search} onValueChange={setSearch} placeholder="Search…" containerClassName="w-64" />}
      >
        {filtered.length === 0 ? (
          <EmptyState title="No shipments" description="Create your first shipment." action={<Button onClick={openCreate}><Plus className="h-4 w-4" />New shipment</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.trackingNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{s.origin} → {s.destination}</TableCell>
                  <TableCell>{s.customer}</TableCell>
                  <TableCell>{new Date(s.etaDate).toLocaleDateString()}</TableCell>
                  <TableCell><StatusBadge tone={shipmentStatusTone[s.status]}>{shipmentStatusLabel[s.status]}</StatusBadge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmId(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Edit shipment" : "Create shipment"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Tracking #</Label><Input value={draft.trackingNumber} onChange={(e) => setDraft({ ...draft, trackingNumber: e.target.value })} /></div>
            <div><Label>Customer</Label><Input value={draft.customer} onChange={(e) => setDraft({ ...draft, customer: e.target.value })} /></div>
            <div><Label>Origin</Label><Input value={draft.origin} onChange={(e) => setDraft({ ...draft, origin: e.target.value })} /></div>
            <div><Label>Destination</Label><Input value={draft.destination} onChange={(e) => setDraft({ ...draft, destination: e.target.value })} /></div>
            <div><Label>Carrier</Label><Input value={draft.carrier} onChange={(e) => setDraft({ ...draft, carrier: e.target.value })} /></div>
            <div><Label>Weight (kg)</Label><Input type="number" value={draft.weightKg} onChange={(e) => setDraft({ ...draft, weightKg: Number(e.target.value) || 0 })} /></div>
            <div><Label>ETA</Label><Input type="date" value={draft.etaDate.slice(0, 10)} onChange={(e) => setDraft({ ...draft, etaDate: new Date(e.target.value).toISOString() })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Shipment["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_transit">In transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Vehicle</Label>
              <Select value={draft.vehicleId || ""} onValueChange={(v) => setDraft({ ...draft, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="Assign a vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.plate} · {v.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)} title="Delete shipment?" description="This action cannot be undone." confirmLabel="Delete" tone="destructive" onConfirm={remove} />
    </PageContainer>
  );
}