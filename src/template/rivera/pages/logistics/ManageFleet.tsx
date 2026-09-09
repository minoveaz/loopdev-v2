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
import { vehiclesStore } from "@/template/rivera/data";
import { vehicleStatusTone } from "@/template/rivera/features/logistics/shared";
import type { Vehicle } from "@/types";

type Draft = Omit<Vehicle, "id" | "createdAt" | "updatedAt">;
const empty: Draft = {
  plate: "", model: "", type: "van", driver: "", capacityKg: 1000,
  status: "active", mileageKm: 0, lastServiceAt: new Date().toISOString(),
};

export default function LogisticsManageFleet() {
  const { trail } = useBreadcrumbs();
  const vehicles = useLocalStore(vehiclesStore);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) => v.plate.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.driver.toLowerCase().includes(q));
  }, [vehicles, search]);

  const openCreate = () => { setEditing(null); setDraft(empty); setOpen(true); };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setDraft({ plate: v.plate, model: v.model, type: v.type, driver: v.driver, capacityKg: v.capacityKg, status: v.status, mileageKm: v.mileageKm, lastServiceAt: v.lastServiceAt });
    setOpen(true);
  };
  const save = () => {
    if (!draft.plate.trim() || !draft.model.trim()) { toast.error("Plate and model are required"); return; }
    if (editing) { vehiclesStore.update(editing.id, draft); }
    else { vehiclesStore.create(draft); }
    setOpen(false);
  };
  const remove = () => { if (confirmId) { vehiclesStore.remove(confirmId); setConfirmId(null); } };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Logistics"
        title="Manage fleet"
        description="Add, edit, and decommission vehicles."
        breadcrumbs={trail.length ? trail : [{ label: "Logistics" }, { label: "Fleet" }, { label: "Manage" }]}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New vehicle</Button>}
      />

      <DataCard title="Vehicles" description={`${filtered.length} records`} flush
        action={<SearchInput value={search} onValueChange={setSearch} placeholder="Search…" containerClassName="w-64" />}
      >
        {filtered.length === 0 ? (
          <EmptyState title="No vehicles" description="Add your first vehicle." action={<Button onClick={openCreate}><Plus className="h-4 w-4" />New vehicle</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs">{v.plate}</TableCell>
                  <TableCell className="font-medium">{v.model}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{v.type}</TableCell>
                  <TableCell>{v.driver}</TableCell>
                  <TableCell className="text-right font-mono">{v.capacityKg} kg</TableCell>
                  <TableCell><StatusBadge tone={vehicleStatusTone[v.status]}>{v.status}</StatusBadge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmId(v.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit vehicle" : "Create vehicle"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Plate</Label><Input value={draft.plate} onChange={(e) => setDraft({ ...draft, plate: e.target.value })} /></div>
            <div><Label>Model</Label><Input value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} /></div>
            <div>
              <Label>Type</Label>
              <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as Vehicle["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Driver</Label><Input value={draft.driver} onChange={(e) => setDraft({ ...draft, driver: e.target.value })} /></div>
            <div><Label>Capacity (kg)</Label><Input type="number" value={draft.capacityKg} onChange={(e) => setDraft({ ...draft, capacityKg: Number(e.target.value) || 0 })} /></div>
            <div><Label>Mileage (km)</Label><Input type="number" value={draft.mileageKm} onChange={(e) => setDraft({ ...draft, mileageKm: Number(e.target.value) || 0 })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Vehicle["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Last service</Label><Input type="date" value={draft.lastServiceAt.slice(0, 10)} onChange={(e) => setDraft({ ...draft, lastServiceAt: new Date(e.target.value).toISOString() })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)} title="Delete vehicle?" description="This will remove the vehicle." confirmLabel="Delete" tone="destructive" onConfirm={remove} />
    </PageContainer>
  );
}