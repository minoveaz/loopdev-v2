import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataCard, EmptyState, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { dealsStore, listingsStore, agentsStore } from "@/template/rivera/data";
import { dealStageLabel, dealStageTone, formatPrice, STAGES } from "@/template/rivera/features/realestate/shared";
import type { RealEstateDeal } from "@/types";

type Draft = Omit<RealEstateDeal, "id" | "createdAt" | "updatedAt">;
const empty: Draft = {
  listingId: "", client: "", agentId: "", amount: 250000, currency: "USD",
  stage: "new", expectedCloseDate: new Date(Date.now() + 86400000 * 14).toISOString(), notes: "",
};

export default function RealEstateManageDeals() {
  const { trail } = useBreadcrumbs();
  const deals = useLocalStore(dealsStore);
  const listings = useLocalStore(listingsStore);
  const agents = useLocalStore(agentsStore);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<RealEstateDeal | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return deals;
    return deals.filter((d) => d.client.toLowerCase().includes(q));
  }, [deals, search]);

  const openCreate = () => {
    setEditing(null);
    setDraft({ ...empty, listingId: listings[0]?.id ?? "", agentId: agents[0]?.id ?? "" });
    setOpen(true);
  };
  const openEdit = (d: RealEstateDeal) => {
    setEditing(d);
    setDraft({ listingId: d.listingId, client: d.client, agentId: d.agentId, amount: d.amount, currency: d.currency, stage: d.stage, expectedCloseDate: d.expectedCloseDate, notes: d.notes ?? "" });
    setOpen(true);
  };
  const save = () => {
    if (!draft.client.trim()) { toast.error("Client is required"); return; }
    if (editing) { dealsStore.update(editing.id, draft); }
    else { dealsStore.create(draft); }
    setOpen(false);
  };
  const remove = () => { if (confirmId) { dealsStore.remove(confirmId); setConfirmId(null); } };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Real Estate"
        title="Manage deals"
        description="Create, edit, and remove deals."
        breadcrumbs={trail.length ? trail : [{ label: "Real Estate" }, { label: "Deals" }, { label: "Manage" }]}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New deal</Button>}
      />

      <DataCard title="Deals" description={`${filtered.length} records`} flush
        action={<SearchInput value={search} onValueChange={setSearch} placeholder="Search…" containerClassName="w-64" />}
      >
        {filtered.length === 0 ? (
          <EmptyState title="No deals" description="Create your first deal." action={<Button onClick={openCreate}><Plus className="h-4 w-4" />New deal</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.client}</TableCell>
                  <TableCell className="text-muted-foreground">{listings.find((l) => l.id === d.listingId)?.title ?? "—"}</TableCell>
                  <TableCell>{agents.find((a) => a.id === d.agentId)?.name ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono">{formatPrice(d.amount, d.currency)}</TableCell>
                  <TableCell>{new Date(d.expectedCloseDate).toLocaleDateString()}</TableCell>
                  <TableCell><StatusBadge tone={dealStageTone[d.stage]}>{dealStageLabel[d.stage]}</StatusBadge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmId(d.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit deal" : "Create deal"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Client</Label><Input value={draft.client} onChange={(e) => setDraft({ ...draft, client: e.target.value })} /></div>
            <div className="sm:col-span-2">
              <Label>Property</Label>
              <Select value={draft.listingId} onValueChange={(v) => setDraft({ ...draft, listingId: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{listings.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Agent</Label>
              <Select value={draft.agentId} onValueChange={(v) => setDraft({ ...draft, agentId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={draft.stage} onValueChange={(v) => setDraft({ ...draft, stage: v as Draft["stage"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{dealStageLabel[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Amount</Label><Input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) || 0 })} /></div>
            <div><Label>Expected close</Label><Input type="date" value={draft.expectedCloseDate.slice(0, 10)} onChange={(e) => setDraft({ ...draft, expectedCloseDate: new Date(e.target.value).toISOString() })} /></div>
            <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)} title="Delete deal?" description="This action cannot be undone." confirmLabel="Delete" tone="destructive" onConfirm={remove} />
    </PageContainer>
  );
}