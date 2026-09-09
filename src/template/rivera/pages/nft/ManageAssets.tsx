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
import { nftStore } from "@/template/rivera/data";
import { formatCrypto, nftStatusTone } from "@/template/rivera/features/nft/shared";
import type { NftAsset } from "@/types";

type Draft = Omit<NftAsset, "id" | "createdAt" | "updatedAt">;
const empty: Draft = {
  name: "", collection: "Lumen", creator: "", imageUrl: "https://picsum.photos/seed/new/400/400",
  price: 1, currency: "ETH", status: "draft", likes: 0, views: 0,
};

export default function NftManageAssets() {
  const { trail } = useBreadcrumbs();
  const assets = useLocalStore(nftStore) as readonly NftAsset[];
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<NftAsset | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) => a.name.toLowerCase().includes(q) || a.collection.toLowerCase().includes(q) || a.creator.toLowerCase().includes(q));
  }, [assets, search]);

  const openCreate = () => { setEditing(null); setDraft(empty); setOpen(true); };
  const openEdit = (a: NftAsset) => {
    setEditing(a);
    setDraft({ name: a.name, collection: a.collection, creator: a.creator, imageUrl: a.imageUrl, price: a.price, currency: a.currency, status: a.status, likes: a.likes, views: a.views, highestBid: a.highestBid });
    setOpen(true);
  };
  const save = () => {
    if (!draft.name.trim()) { toast.error("Name is required"); return; }
    if (editing) { nftStore.update(editing.id, draft); }
    else { nftStore.create(draft); }
    setOpen(false);
  };
  const remove = () => { if (confirmId) { nftStore.remove(confirmId); setConfirmId(null); } };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="NFT Market"
        title="Manage assets"
        description="Create, edit, and remove marketplace assets."
        breadcrumbs={trail.length ? trail : [{ label: "NFT Market" }, { label: "Assets" }, { label: "Manage" }]}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New asset</Button>}
      />

      <DataCard title="Catalog" description={`${filtered.length} assets`} flush
        action={<SearchInput value={search} onValueChange={setSearch} placeholder="Search…" containerClassName="w-64" />}
      >
        {filtered.length === 0 ? (
          <EmptyState title="No assets" description="Create your first asset to get started." action={<Button onClick={openCreate}><Plus className="h-4 w-4" />New asset</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Collection</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="flex items-center gap-3">
                    <img src={a.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <span className="font-medium">{a.name}</span>
                  </TableCell>
                  <TableCell>{a.collection}</TableCell>
                  <TableCell className="text-muted-foreground">{a.creator}</TableCell>
                  <TableCell className="text-right font-mono">{formatCrypto(a.price, a.currency)}</TableCell>
                  <TableCell><StatusBadge tone={nftStatusTone[a.status]}>{a.status}</StatusBadge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmId(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit asset" : "Create asset"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div><Label>Collection</Label><Input value={draft.collection} onChange={(e) => setDraft({ ...draft, collection: e.target.value })} /></div>
            <div><Label>Creator</Label><Input value={draft.creator} onChange={(e) => setDraft({ ...draft, creator: e.target.value })} /></div>
            <div><Label>Price</Label><Input type="number" step="0.01" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })} /></div>
            <div>
              <Label>Currency</Label>
              <Select value={draft.currency} onValueChange={(v) => setDraft({ ...draft, currency: v as NftAsset["currency"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="SOL">SOL</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>Image URL</Label><Input value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as NftAsset["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="listed">Listed</SelectItem>
                  <SelectItem value="auction">Auction</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
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

      <ConfirmDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)} title="Delete asset?" description="This will remove the asset from the marketplace." confirmLabel="Delete" tone="destructive" onConfirm={remove} />
    </PageContainer>
  );
}