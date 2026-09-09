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
import { campaignsStore } from "@/template/rivera/data";
import { CHANNELS, statusLabel, statusTone } from "@/template/rivera/features/marketing/shared";
import type { Campaign } from "@/types";

type Draft = Omit<Campaign, "id" | "createdAt" | "updatedAt">;
const empty: Draft = {
  name: "", channel: "email", status: "draft", budget: 5000, spent: 0, currency: "USD",
  impressions: 0, clicks: 0, conversions: 0,
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
};

export default function MarketingManageCampaigns() {
  const { trail } = useBreadcrumbs();
  const campaigns = useLocalStore(campaignsStore);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter((c) => c.name.toLowerCase().includes(q));
  }, [campaigns, search]);

  const openCreate = () => { setEditing(null); setDraft(empty); setOpen(true); };
  const openEdit = (c: Campaign) => {
    setEditing(c);
    setDraft({ name: c.name, channel: c.channel, status: c.status, budget: c.budget, spent: c.spent, currency: c.currency, impressions: c.impressions, clicks: c.clicks, conversions: c.conversions, startDate: c.startDate, endDate: c.endDate });
    setOpen(true);
  };
  const save = () => {
    if (!draft.name.trim()) { toast.error("Name is required"); return; }
    if (editing) { campaignsStore.update(editing.id, draft); }
    else { campaignsStore.create(draft); }
    setOpen(false);
  };
  const remove = () => { if (confirmId) { campaignsStore.remove(confirmId); setConfirmId(null); } };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Marketing"
        title="Manage campaigns"
        description="Create, edit, and remove marketing campaigns."
        breadcrumbs={trail.length ? trail : [{ label: "Marketing" }, { label: "Campaigns" }, { label: "Manage" }]}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New campaign</Button>}
      />

      <DataCard title="Campaigns" description={`${filtered.length} records`} flush
        action={<SearchInput value={search} onValueChange={setSearch} placeholder="Search…" containerClassName="w-64" />}
      >
        {filtered.length === 0 ? (
          <EmptyState title="No campaigns" description="Create your first campaign." action={<Button onClick={openCreate}><Plus className="h-4 w-4" />New campaign</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{c.channel}</TableCell>
                  <TableCell className="text-right font-mono">${c.budget.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">${c.spent.toLocaleString()}</TableCell>
                  <TableCell><StatusBadge tone={statusTone[c.status]}>{statusLabel[c.status]}</StatusBadge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
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
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Edit campaign" : "Create campaign"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div>
              <Label>Channel</Label>
              <Select value={draft.channel} onValueChange={(v) => setDraft({ ...draft, channel: v as Draft["channel"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Draft["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Budget</Label><Input type="number" value={draft.budget} onChange={(e) => setDraft({ ...draft, budget: Number(e.target.value) || 0 })} /></div>
            <div><Label>Spent</Label><Input type="number" value={draft.spent} onChange={(e) => setDraft({ ...draft, spent: Number(e.target.value) || 0 })} /></div>
            <div><Label>Impressions</Label><Input type="number" value={draft.impressions} onChange={(e) => setDraft({ ...draft, impressions: Number(e.target.value) || 0 })} /></div>
            <div><Label>Clicks</Label><Input type="number" value={draft.clicks} onChange={(e) => setDraft({ ...draft, clicks: Number(e.target.value) || 0 })} /></div>
            <div><Label>Conversions</Label><Input type="number" value={draft.conversions} onChange={(e) => setDraft({ ...draft, conversions: Number(e.target.value) || 0 })} /></div>
            <div><Label>Start</Label><Input type="date" value={draft.startDate.slice(0, 10)} onChange={(e) => setDraft({ ...draft, startDate: new Date(e.target.value).toISOString() })} /></div>
            <div><Label>End</Label><Input type="date" value={draft.endDate.slice(0, 10)} onChange={(e) => setDraft({ ...draft, endDate: new Date(e.target.value).toISOString() })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)} title="Delete campaign?" description="This action cannot be undone." confirmLabel="Delete" tone="destructive" onConfirm={remove} />
    </PageContainer>
  );
}