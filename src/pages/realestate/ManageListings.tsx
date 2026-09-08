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
import { listingsStore, agentsStore } from "@/data";
import { formatPrice, listingStatusLabel, listingStatusTone, PROPERTY_TYPES } from "@/features/realestate/shared";
import type { RealEstateListing } from "@/types";

type Draft = Omit<RealEstateListing, "id" | "createdAt" | "updatedAt">;
const empty: Draft = {
  title: "", address: "", city: "", type: "apartment", price: 250000, currency: "USD",
  bedrooms: 2, bathrooms: 1, areaSqm: 75, status: "available", agentId: "",
  imageUrl: "https://picsum.photos/seed/new/640/420",
};

export default function RealEstateManageListings() {
  const { trail } = useBreadcrumbs();
  const listings = useLocalStore(listingsStore);
  const agents = useLocalStore(agentsStore);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<RealEstateListing | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((l) => l.title.toLowerCase().includes(q) || l.city.toLowerCase().includes(q));
  }, [listings, search]);

  const openCreate = () => { setEditing(null); setDraft({ ...empty, agentId: agents[0]?.id ?? "" }); setOpen(true); };
  const openEdit = (l: RealEstateListing) => {
    setEditing(l);
    setDraft({ title: l.title, address: l.address, city: l.city, type: l.type, price: l.price, currency: l.currency, bedrooms: l.bedrooms, bathrooms: l.bathrooms, areaSqm: l.areaSqm, status: l.status, agentId: l.agentId, imageUrl: l.imageUrl });
    setOpen(true);
  };
  const save = () => {
    if (!draft.title.trim() || !draft.city.trim()) { toast.error("Title and city are required"); return; }
    if (editing) { listingsStore.update(editing.id, draft); }
    else { listingsStore.create(draft); }
    setOpen(false);
  };
  const remove = () => { if (confirmId) { listingsStore.remove(confirmId); setConfirmId(null); } };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Real Estate"
        title="Manage listings"
        description="Add, edit, and remove properties from the catalog."
        breadcrumbs={trail.length ? trail : [{ label: "Real Estate" }, { label: "Listings" }, { label: "Manage" }]}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New listing</Button>}
      />

      <DataCard title="Listings" description={`${filtered.length} records`} flush
        action={<SearchInput value={search} onValueChange={setSearch} placeholder="Search…" containerClassName="w-64" />}
      >
        {filtered.length === 0 ? (
          <EmptyState title="No listings" description="Add your first property." action={<Button onClick={openCreate}><Plus className="h-4 w-4" />New listing</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="flex items-center gap-3">
                    <img src={l.imageUrl} alt="" className="h-10 w-14 rounded-md object-cover" />
                    <span className="font-medium">{l.title}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.city}</TableCell>
                  <TableCell className="capitalize">{l.type}</TableCell>
                  <TableCell className="text-right font-mono">{formatPrice(l.price, l.currency)}</TableCell>
                  <TableCell><StatusBadge tone={listingStatusTone[l.status]}>{listingStatusLabel[l.status]}</StatusBadge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(l)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmId(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit listing" : "Create listing"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Address</Label><Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></div>
            <div><Label>City</Label><Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></div>
            <div>
              <Label>Type</Label>
              <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as Draft["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Price</Label><Input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })} /></div>
            <div><Label>Area (m²)</Label><Input type="number" value={draft.areaSqm} onChange={(e) => setDraft({ ...draft, areaSqm: Number(e.target.value) || 0 })} /></div>
            <div><Label>Bedrooms</Label><Input type="number" value={draft.bedrooms} onChange={(e) => setDraft({ ...draft, bedrooms: Number(e.target.value) || 0 })} /></div>
            <div><Label>Bathrooms</Label><Input type="number" value={draft.bathrooms} onChange={(e) => setDraft({ ...draft, bathrooms: Number(e.target.value) || 0 })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Draft["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="off_market">Off market</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Agent</Label>
              <Select value={draft.agentId} onValueChange={(v) => setDraft({ ...draft, agentId: v })}>
                <SelectTrigger><SelectValue placeholder="Assign" /></SelectTrigger>
                <SelectContent>{agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>Image URL</Label><Input value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)} title="Delete listing?" description="This will remove the property." confirmLabel="Delete" tone="destructive" onConfirm={remove} />
    </PageContainer>
  );
}