import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataCard, EmptyState, PageContainer, PageHeader, SearchInput } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { agentsStore } from "@/data";
import type { Agent } from "@/types";

type Draft = Omit<Agent, "id" | "createdAt" | "updatedAt">;
const empty: Draft = { name: "", email: "", phone: "", region: "", listingsCount: 0, closedDeals: 0, rating: 4.5 };

export default function RealEstateManageAgents() {
  const { trail } = useBreadcrumbs();
  const agents = useLocalStore(agentsStore);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Agent | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter((a) => a.name.toLowerCase().includes(q) || a.region.toLowerCase().includes(q));
  }, [agents, search]);

  const openCreate = () => { setEditing(null); setDraft(empty); setOpen(true); };
  const openEdit = (a: Agent) => {
    setEditing(a);
    setDraft({ name: a.name, email: a.email, phone: a.phone, region: a.region, listingsCount: a.listingsCount, closedDeals: a.closedDeals, rating: a.rating, avatarUrl: a.avatarUrl });
    setOpen(true);
  };
  const save = () => {
    if (!draft.name.trim() || !draft.email.trim()) { toast.error("Name and email are required"); return; }
    if (editing) { agentsStore.update(editing.id, draft); }
    else { agentsStore.create(draft); }
    setOpen(false);
  };
  const remove = () => { if (confirmId) { agentsStore.remove(confirmId); setConfirmId(null); } };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Real Estate"
        title="Manage agents"
        description="Add, edit, and remove agents from the directory."
        breadcrumbs={trail.length ? trail : [{ label: "Real Estate" }, { label: "Agents" }, { label: "Manage" }]}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />New agent</Button>}
      />

      <DataCard title="Agents" description={`${filtered.length} records`} flush
        action={<SearchInput value={search} onValueChange={setSearch} placeholder="Search…" containerClassName="w-64" />}
      >
        {filtered.length === 0 ? (
          <EmptyState title="No agents" description="Add your first agent." action={<Button onClick={openCreate}><Plus className="h-4 w-4" />New agent</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Listings</TableHead>
                <TableHead className="text-right">Closed</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-muted-foreground">{a.email}</TableCell>
                  <TableCell>{a.region}</TableCell>
                  <TableCell className="text-right font-mono">{a.listingsCount}</TableCell>
                  <TableCell className="text-right font-mono">{a.closedDeals}</TableCell>
                  <TableCell className="text-right font-mono">{a.rating.toFixed(1)}</TableCell>
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
          <DialogHeader><DialogTitle>{editing ? "Edit agent" : "Create agent"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
            <div><Label>Region</Label><Input value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value })} /></div>
            <div><Label>Rating (0–5)</Label><Input type="number" step="0.1" min={0} max={5} value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) || 0 })} /></div>
            <div><Label>Listings</Label><Input type="number" value={draft.listingsCount} onChange={(e) => setDraft({ ...draft, listingsCount: Number(e.target.value) || 0 })} /></div>
            <div><Label>Closed deals</Label><Input type="number" value={draft.closedDeals} onChange={(e) => setDraft({ ...draft, closedDeals: Number(e.target.value) || 0 })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)} title="Remove agent?" description="This will remove the agent from the directory." confirmLabel="Delete" tone="destructive" onConfirm={remove} />
    </PageContainer>
  );
}