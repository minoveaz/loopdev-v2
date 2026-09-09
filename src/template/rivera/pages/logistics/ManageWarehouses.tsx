import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataCard, EmptyState, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { warehousesStore } from "@/template/rivera/data";
import { warehouseTone } from "@/template/rivera/features/logistics/shared";
import type { Warehouse } from "@/types";

type Draft = Omit<Warehouse, "id" | "createdAt" | "updatedAt">;
const empty: Draft = { name: "", code: "", city: "", country: "", capacity: 5000, occupancy: 0, manager: "", isActive: true };

export default function LogisticsManageWarehouses() {
  const { trail } = useBreadcrumbs();
  const warehouses = useLocalStore(warehousesStore);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return warehouses;
    return warehouses.filter((w) => w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q) || w.city.toLowerCase().includes(q));
  }, [warehouses, search]);

  const openCreate = () => { setEditing(null); setDraft(empty); setOpen(true); };
  const openEdit = (w: Warehouse) => {
    setEditing(w);
    setDraft({ name: w.name, code: w.code, city: w.city, country: w.country, capacity: w.capacity, occupancy: w.occupancy, manager: w.manager, isActive: w.isActive });
    setOpen(true);
  };
  const save = () => {
    if (!draft.name.trim() || !draft.code.trim()) { toast.error("Name and code are required"); return; }
    if (editing) { warehousesStore.update(editing.id, draft); }
    else { warehousesStore.create(draft); }
    setOpen(false);
  };
  const remove = () => { if (confirmId) { warehousesStore.remove(confirmId); setConfirmId(null); } };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Logistics"
        title="Manage warehouses"
        description="Add, edit, and decommission storage sites."
        breadcrumbs={trail.length ? trail : [{ label: "Logistics" }, { label: "Warehouses" }, { label: "Manage" }]}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New warehouse</Button>}
      />

      <DataCard title="Warehouses" description={`${filtered.length} sites`} flush
        action={<SearchInput value={search} onValueChange={setSearch} placeholder="Search…" containerClassName="w-64" />}
      >
        {filtered.length === 0 ? (
          <EmptyState title="No warehouses" description="Add your first site." action={<Button onClick={openCreate}><Plus className="h-4 w-4" />New warehouse</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Capacity</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-mono text-xs">{w.code}</TableCell>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell className="text-muted-foreground">{w.city}, {w.country}</TableCell>
                  <TableCell className="text-right font-mono">{w.capacity.toLocaleString()}</TableCell>
                  <TableCell><StatusBadge tone={warehouseTone(w.occupancy)}>{w.occupancy}%</StatusBadge></TableCell>
                  <TableCell>{w.isActive ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(w)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmId(w.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit warehouse" : "Create warehouse"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div><Label>Code</Label><Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} /></div>
            <div><Label>Manager</Label><Input value={draft.manager} onChange={(e) => setDraft({ ...draft, manager: e.target.value })} /></div>
            <div><Label>City</Label><Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></div>
            <div><Label>Country</Label><Input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} /></div>
            <div><Label>Capacity</Label><Input type="number" value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: Number(e.target.value) || 0 })} /></div>
            <div><Label>Occupancy %</Label><Input type="number" min={0} max={100} value={draft.occupancy} onChange={(e) => setDraft({ ...draft, occupancy: Number(e.target.value) || 0 })} /></div>
            <div className="flex items-center justify-between sm:col-span-2 rounded-lg border border-border p-3">
              <div><p className="text-sm font-medium">Active site</p><p className="text-xs text-muted-foreground">Enable for shipment routing</p></div>
              <Switch checked={draft.isActive} onCheckedChange={(v) => setDraft({ ...draft, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)} title="Delete warehouse?" description="This action cannot be undone." confirmLabel="Delete" tone="destructive" onConfirm={remove} />
    </PageContainer>
  );
}