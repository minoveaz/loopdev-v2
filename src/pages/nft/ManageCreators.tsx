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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { nftCreatorsStore, type NftCreator } from "@/data";

type Draft = Omit<NftCreator, "id" | "createdAt" | "updatedAt">;
const empty: Draft = { handle: "", name: "", avatarUrl: "https://i.pravatar.cc/150?img=15", verified: false, followers: 0, items: 0, volume: 0, joinedAt: new Date().toISOString() };

export default function NftManageCreators() {
  const { trail } = useBreadcrumbs();
  const creators = useLocalStore(nftCreatorsStore) as readonly NftCreator[];
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<NftCreator | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? creators.filter((c) => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q)) : creators;
  }, [creators, search]);

  const openCreate = () => { setEditing(null); setDraft(empty); setOpen(true); };
  const openEdit = (c: NftCreator) => {
    setEditing(c);
    setDraft({ handle: c.handle, name: c.name, avatarUrl: c.avatarUrl, verified: c.verified, followers: c.followers, items: c.items, volume: c.volume, joinedAt: c.joinedAt });
    setOpen(true);
  };
  const save = () => {
    if (!draft.name.trim() || !draft.handle.trim()) { toast.error("Name and handle required"); return; }
    if (editing) { nftCreatorsStore.update(editing.id, draft); }
    else { nftCreatorsStore.create(draft); }
    setOpen(false);
  };
  const remove = () => { if (confirmId) { nftCreatorsStore.remove(confirmId); setConfirmId(null); } };

  return (
    <PageContainer width="wide">
      <PageHeader eyebrow="NFT Market" title="Manage creators" description="Add, edit, and verify creators on the marketplace."
        breadcrumbs={trail.length ? trail : [{ label: "NFT Market" }, { label: "Creators" }, { label: "Manage" }]}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New creator</Button>} />

      <DataCard title="Creators" flush action={<SearchInput value={search} onValueChange={setSearch} placeholder="Search…" containerClassName="w-64" />}>
        {filtered.length === 0 ? (
          <EmptyState title="No creators" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Handle</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-9 w-9"><AvatarImage src={c.avatarUrl} /><AvatarFallback>{c.name[0]}</AvatarFallback></Avatar>
                    <span className="font-medium">{c.name}</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">@{c.handle}</TableCell>
                  <TableCell className="text-right font-mono">{c.items}</TableCell>
                  <TableCell className="text-right font-mono">{c.volume.toFixed(2)} ETH</TableCell>
                  <TableCell><StatusBadge tone={c.verified ? "success" : "neutral"}>{c.verified ? "Verified" : "Unverified"}</StatusBadge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmId(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit creator" : "Add creator"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div><Label>Handle</Label><Input value={draft.handle} onChange={(e) => setDraft({ ...draft, handle: e.target.value })} /></div>
            <div><Label>Avatar URL</Label><Input value={draft.avatarUrl} onChange={(e) => setDraft({ ...draft, avatarUrl: e.target.value })} /></div>
            <div><Label>Items</Label><Input type="number" value={draft.items} onChange={(e) => setDraft({ ...draft, items: Number(e.target.value) || 0 })} /></div>
            <div><Label>Followers</Label><Input type="number" value={draft.followers} onChange={(e) => setDraft({ ...draft, followers: Number(e.target.value) || 0 })} /></div>
            <div><Label>Volume (ETH)</Label><Input type="number" step="0.01" value={draft.volume} onChange={(e) => setDraft({ ...draft, volume: Number(e.target.value) || 0 })} /></div>
            <div className="flex items-center gap-3 pt-6"><Switch checked={draft.verified} onCheckedChange={(v) => setDraft({ ...draft, verified: v })} /><Label className="cursor-pointer">Verified</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)} title="Remove creator?" description="This action cannot be undone." confirmLabel="Remove" tone="destructive" onConfirm={remove} />
    </PageContainer>
  );
}