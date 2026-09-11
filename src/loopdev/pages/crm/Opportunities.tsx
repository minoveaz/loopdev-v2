import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ExternalLink, Plus, RefreshCw, SearchX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppDrawer } from "@/components/platform";
import { CRMRecordPicker, type CRMRecordPickerItem } from "@/loopdev/components/crm/CRMRecordPicker";
import { ConfirmDialog, DataCard, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge, useFormLifecycle } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Currency } from "@/types";
import {
  loopdevAdapter,
  CRM_PIPELINE_STAGE_CODES,
  type CRMPipelineOpportunity,
  type CRMPipelineStageCode,
} from "@/loopdev/domains/crm/adapter";
import type { CatalogItem } from "@/loopdev/domains/catalog";
import { useCrmContacts, useCrmPipeline } from "@/loopdev/domains/crm/hooks/use-crm";

const labels: Record<CRMPipelineStageCode, string> = {
  prospecting: "Prospecting", qualified: "Qualified", proposal: "Proposal",
  negotiation: "Negotiation", won: "Won", lost: "Lost",
};

const stageTone: Record<CRMPipelineStageCode, "neutral" | "info" | "success" | "warning" | "destructive"> = {
  prospecting: "neutral", qualified: "info", proposal: "info", negotiation: "warning", won: "success", lost: "destructive",
};

export default function SalesCRMOpportunities() {
  const { trail } = useBreadcrumbs();
  const navigate = useNavigate();
  const { contacts } = useCrmContacts({ limit: 100 });
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const createLifecycle = useFormLifecycle();
  const detailsLifecycle = useFormLifecycle();
  const reopenLifecycle = useFormLifecycle();
  const [query, setQuery] = useState("");
  const [stageCodes, setStageCodes] = useState<CRMPipelineStageCode[]>([]);
  const [origins, setOrigins] = useState<("manual" | "lead_conversion")[]>([]);
  const [sortBy, setSortBy] = useState<"updated" | "name" | "amount" | "expectedCloseDate">("updated");
  const [selected, setSelected] = useState<CRMPipelineOpportunity | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [newContactId, setNewContactId] = useState("");
  const [newName, setNewName] = useState("");
  const [newProductKey, setNewProductKey] = useState("");
  const [newCatalogItemId, setNewCatalogItemId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newLineQuantity, setNewLineQuantity] = useState("1");
  const [createError, setCreateError] = useState<string | null>(null);
  const [reopenTarget, setReopenTarget] = useState<CRMPipelineOpportunity | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenDiscardOpen, setReopenDiscardOpen] = useState(false);
  const { opportunities, loading, error, forbidden, mutation, reload, updateOpportunity, moveStage, createOpportunity, reopenOpportunity } = useCrmPipeline({
    query, stageCodes, origins, sortBy, sortDirection: "desc",
  });
  const ownerOptions = useMemo(() => [...new Map(
    opportunities.filter((item) => item.owner).map((item) => [item.owner!.id, item.owner!.displayName]),
  )].map(([value, label]) => ({ value, label })), [opportunities]);
  const [ownerIds, setOwnerIds] = useState<string[]>([]);
  const filtered = ownerIds.length ? opportunities.filter((item) => item.owner && ownerIds.includes(item.owner.id)) : opportunities;

  useEffect(() => {
    void loopdevAdapter.catalog.listCatalogItems({ organizationId: "local-development-organization", status: ["active"] })
      .then(setCatalogItems)
      .catch(() => setCatalogItems([]));
  }, []);

  const openDetails = (opportunity: CRMPipelineOpportunity) => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected(opportunity);
    detailsLifecycle.markClean();
    setDrawerOpen(true);
  };

  const closeDetails = (open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      setSelected(null);
      detailsLifecycle.markClean();
    }
  };
  const submitManualOpportunity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);
    const item = catalogItems.find((candidate) => candidate.id === newCatalogItemId);
    const result = await createOpportunity({
      contactId: newContactId,
      name: newName,
      productKey: newProductKey || item?.key || null,
      catalogItemId: newCatalogItemId || null,
      amount: newAmount ? Number(newAmount) : null,
      lines: [{
        catalogItemId: newCatalogItemId || null,
        productKey: newProductKey || item?.key || null,
        label: item?.name || newProductKey || null,
        quantity: Number(newLineQuantity),
        unitAmount: newAmount ? Number(newAmount) : null,
      }],
    });
    if (result.status === "success") {
      setCreateOpen(false);
      setNewContactId(""); setNewName(""); setNewProductKey(""); setNewCatalogItemId(""); setNewAmount(""); setNewLineQuantity("1");
      createLifecycle.markClean();
    } else {
      setCreateError(result.message);
    }
  };
  const submitReopen = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reopenTarget) return;
    const result = await reopenOpportunity(reopenTarget, { reason: reopenReason });
    if (result.status === "success") {
      setReopenTarget(null); setReopenReason(""); reopenLifecycle.markClean();
      setSelected(result.opportunity);
    }
  };

  return (
    <PageContainer width="wide" className="max-w-[1600px]">
      <PageHeader eyebrow="CRM" title="Opportunities" description="Manage the sales cycle behind your pipeline." breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Opportunities" }]} actions={<Button onClick={(event) => { restoreFocusRef.current = event.currentTarget; setCreateOpen(true); }}><Plus className="mr-1.5 h-3.5 w-3.5" />New opportunity</Button>} />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={query} onValueChange={setQuery} placeholder="Search opportunities, contacts, owners…" size="sm" containerClassName="w-80" />
        <FilterDropdown label="Stage" multiple value={stageCodes} onChange={(values) => setStageCodes(values as CRMPipelineStageCode[])} options={CRM_PIPELINE_STAGE_CODES.map((value) => ({ value, label: labels[value] }))} size="sm" />
        <FilterDropdown label="Origin" multiple value={origins} onChange={(values) => setOrigins(values as ("manual" | "lead_conversion")[])} options={[{ value: "manual", label: "Manual" }, { value: "lead_conversion", label: "Lead conversion" }]} size="sm" />
        <FilterDropdown label="Owner" multiple value={ownerIds} onChange={setOwnerIds} options={ownerOptions} size="sm" />
        <FilterDropdown label="Sort" multiple value={[sortBy]} onChange={(values) => setSortBy((values[0] ?? "updated") as typeof sortBy)} options={[{ value: "updated", label: "Recently updated" }, { value: "name", label: "Name" }, { value: "amount", label: "Amount" }, { value: "expectedCloseDate", label: "Close date" }]} size="sm" />
      </div>
      <DataCard
        flush loading={loading}
        error={forbidden ? <span role="alert">You do not have permission to view opportunities.</span> : error ? <><span>{error}</span><Button className="mt-3" size="sm" variant="outline" onClick={reload}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Try again</Button></> : undefined}
        empty={!loading && !error && !forbidden && filtered.length === 0}
        emptyIcon={SearchX} emptyTitle="No opportunities found" emptyDescription="Try changing the search or filters."
      >
        <div className="hidden md:block">
          <Table>
            <TableHeader><TableRow><TableHead>Opportunity</TableHead><TableHead>Contact</TableHead><TableHead>Stage</TableHead><TableHead>Owner</TableHead><TableHead>Amount</TableHead><TableHead>Expected close</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>{filtered.map((item) => <TableRow key={item.id} className="cursor-pointer" onClick={() => openDetails(item)}><TableCell><div className="font-medium">{item.name}</div><div className="text-xs text-muted-foreground">{item.productKey ?? "No product"}</div></TableCell><TableCell>{item.contact.displayName}</TableCell><TableCell><StatusBadge tone={stageTone[item.stageCode]}>{labels[item.stageCode]}</StatusBadge></TableCell><TableCell>{item.owner?.displayName ?? "Unassigned"}</TableCell><TableCell>{item.amount === null ? "—" : formatCurrency(item.amount, (item.currency ?? "EUR") as Currency)}</TableCell><TableCell>{item.expectedCloseDate ? formatDate(item.expectedCloseDate) : "—"}</TableCell><TableCell><Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); openDetails(item); }}>View</Button></TableCell></TableRow>)}</TableBody>
          </Table>
        </div>
        <div className="grid gap-3 p-3 md:hidden">{filtered.map((item) => <button key={item.id} type="button" className="surface-card-compact p-4 text-left" onClick={() => openDetails(item)}><div className="flex items-start justify-between gap-2"><span className="font-semibold">{item.name}</span><StatusBadge tone={stageTone[item.stageCode]}>{labels[item.stageCode]}</StatusBadge></div><p className="mt-1 text-sm text-muted-foreground">{item.contact.displayName}</p><div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>{item.amount === null ? "No amount" : formatCurrency(item.amount, (item.currency ?? "EUR") as Currency)}</span><span>{item.expectedCloseDate ? formatDate(item.expectedCloseDate) : "No close date"}</span></div></button>)}</div>
      </DataCard>
      {mutation.status !== "idle" && mutation.status !== "pending" && <div role={mutation.status === "success" ? "status" : "alert"} className="text-sm text-muted-foreground">{mutation.status === "success" ? "Opportunity updated." : mutation.message}</div>}
      <AppDrawer open={drawerOpen} onOpenChange={closeDetails} title={selected?.name ?? "Opportunity"} description={selected ? `${selected.contact.displayName} · ${labels[selected.stageCode]}` : undefined} restoreFocusRef={restoreFocusRef} size="md" layoutMode="expanded" responsive="auto" dirty={() => detailsLifecycle.dirtyRef.current} confirmOnClose onDiscard={() => detailsLifecycle.markClean()} footer={selected ? <div className="flex w-full justify-between gap-2"><div className="flex gap-2"><Button variant="outline" onClick={() => navigate(`/app/sales-crm/contacts/${selected.contactId}`)}><ExternalLink className="mr-1.5 h-4 w-4" />Contact</Button>{selected.leadId && <Button variant="outline" onClick={() => navigate(`/app/sales-crm/leads?lead=${selected.leadId}`)}><ExternalLink className="mr-1.5 h-4 w-4" />Lead</Button>}</div><Button onClick={() => closeDetails(false)}>Done</Button></div> : undefined}>
        {selected && <OpportunityDetails opportunity={selected} onDirtyChange={detailsLifecycle.setDirty} onUpdate={async (input) => { const result = await updateOpportunity(selected, input); if (result.status === "success") { setSelected(result.opportunity); detailsLifecycle.markClean(); } }} onMove={async (stage) => { const result = await moveStage(selected, stage); if (result.status === "success") setSelected(result.opportunity); }} onReopen={() => setReopenTarget(selected)} />}
      </AppDrawer>
      <AppDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New opportunity"
        description="Create a local opportunity with at least one catalog or legacy product line."
        restoreFocusRef={restoreFocusRef}
        dirty={() => createLifecycle.dirtyRef.current}
        confirmOnClose
        onDiscard={() => {
          setNewContactId(""); setNewName(""); setNewProductKey(""); setNewCatalogItemId(""); setNewAmount(""); setNewLineQuantity("1");
          createLifecycle.markClean();
        }}
        size="md"
        layoutMode="standard"
        responsive="auto"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={mutation.status === "pending"}>Cancel</Button>
            <Button type="submit" form="create-opportunity-form" disabled={!newContactId || !newName.trim() || mutation.status === "pending"}>
              {mutation.status === "pending" ? "Creating…" : "Create opportunity"}
            </Button>
          </div>
        }
      >
          <form id="create-opportunity-form" className="space-y-4" onSubmit={(event) => void submitManualOpportunity(event)}>
            <div className="space-y-1.5"><Label htmlFor="manual-opportunity-contact">Contact</Label><CRMRecordPicker items={contacts.map((contact): CRMRecordPickerItem => ({ type: "contact", id: contact.id, label: `${contact.firstName} ${contact.lastName ?? ""}`.trim() }))} value={newContactId ? `contact:${newContactId}` : ""} onValueChange={(value) => { createLifecycle.markDirty(); setNewContactId(value.replace(/^contact:/, "")); }} placeholder="Search contacts..." ariaLabel="Search contact" /></div>
            <div className="space-y-1.5"><Label htmlFor="manual-opportunity-name">Opportunity name</Label><Input id="manual-opportunity-name" required value={newName} onChange={(event) => { createLifecycle.markDirty(); setNewName(event.target.value); }} /></div>
            <div className="space-y-1.5"><Label htmlFor="manual-opportunity-catalog">Catalog item</Label><Select value={newCatalogItemId || "legacy"} onValueChange={(value) => { createLifecycle.markDirty(); setNewCatalogItemId(value === "legacy" ? "" : value); }}><SelectTrigger id="manual-opportunity-catalog"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="legacy">Use legacy product key</SelectItem>{catalogItems.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} ({item.key})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="manual-opportunity-product">Legacy product key</Label><Input id="manual-opportunity-product" value={newProductKey} onChange={(event) => { createLifecycle.markDirty(); setNewProductKey(event.target.value); }} placeholder="Optional when a catalog item is selected" /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="manual-opportunity-amount">Amount</Label><Input id="manual-opportunity-amount" type="number" min="0" value={newAmount} onChange={(event) => { createLifecycle.markDirty(); setNewAmount(event.target.value); }} /></div><div className="space-y-1.5"><Label htmlFor="manual-opportunity-quantity">Line quantity</Label><Input id="manual-opportunity-quantity" type="number" min="1" value={newLineQuantity} onChange={(event) => { createLifecycle.markDirty(); setNewLineQuantity(event.target.value); }} /></div></div>
            {createError && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{createError}</p>}
          </form>
      </AppDrawer>
      <Dialog open={Boolean(reopenTarget)} onOpenChange={(open) => { if (!open) { if (reopenLifecycle.dirtyRef.current) setReopenDiscardOpen(true); else setReopenTarget(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Reopen terminal opportunity</DialogTitle><DialogDescription>Won and lost opportunities require an explicit reason before re-entering the pipeline.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void submitReopen(event)}>
            <div className="space-y-1.5"><Label htmlFor="reopen-reason">Reason</Label><Input id="reopen-reason" required value={reopenReason} onChange={(event) => { reopenLifecycle.markDirty(); setReopenReason(event.target.value); }} placeholder="Customer re-engaged…" /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => { if (reopenLifecycle.dirtyRef.current) setReopenDiscardOpen(true); else setReopenTarget(null); }}>Cancel</Button><Button type="submit" disabled={!reopenReason.trim()}>Reopen opportunity</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={reopenDiscardOpen}
        onOpenChange={setReopenDiscardOpen}
        title="Discard reopen changes?"
        description="Your reopen reason will be lost."
        confirmLabel="Discard"
        tone="warning"
        onConfirm={() => {
          setReopenDiscardOpen(false);
          setReopenTarget(null);
          setReopenReason("");
          reopenLifecycle.markClean();
        }}
      />
    </PageContainer>
  );
}

function OpportunityDetails({ opportunity, onUpdate, onMove, onReopen, onDirtyChange }: { opportunity: CRMPipelineOpportunity; onUpdate: (input: { amount?: number | null; expectedCloseDate?: string | null; lossReason?: string | null; ownerId?: string | null; ownerName?: string | null; lines?: Array<{ id?: string; label?: string | null; quantity: number; unitAmount?: number | null; currency?: string | null }> }) => Promise<void>; onMove: (stage: CRMPipelineStageCode) => Promise<void>; onReopen: () => void; onDirtyChange: (dirty: boolean) => void }) {
  const [amount, setAmount] = useState(opportunity.amount?.toString() ?? "");
  const [closeDate, setCloseDate] = useState(opportunity.expectedCloseDate ?? "");
  const [lossReason, setLossReason] = useState(opportunity.lossReason ?? "");
  const [ownerId, setOwnerId] = useState(opportunity.owner?.id ?? "");
  const [lineQuantities, setLineQuantities] = useState<Record<string, string>>(() => Object.fromEntries(opportunity.lines.map((line) => [line.id, String(line.quantity)])));
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); const owner = [{ id: "owner-maya", name: "Maya Chen" }, { id: "owner-jon", name: "Jon Bell" }, { id: "owner-lee", name: "Lee Okafor" }].find((candidate) => candidate.id === ownerId); await onUpdate({ amount: amount ? Number(amount) : null, expectedCloseDate: closeDate || null, ownerId: owner?.id ?? null, ownerName: owner?.name ?? null, lossReason: opportunity.stageCode === "lost" ? lossReason : undefined, lines: opportunity.lines.map((line) => ({ id: line.id, quantity: Number(lineQuantities[line.id] ?? line.quantity) })) }); setSaving(false); };
  return <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-muted-foreground">Origin</span><p className="font-medium">{opportunity.origin === "lead_conversion" ? "Lead conversion" : "Manual"}</p></div><div><span className="text-muted-foreground">Product</span><p className="font-medium">{opportunity.productKey ?? "—"}</p></div><div><span className="text-muted-foreground">Owner</span><p className="font-medium">{opportunity.owner?.displayName ?? "Unassigned"}</p></div><div><span className="text-muted-foreground">Probability</span><p className="font-medium">{opportunity.probability === null ? "—" : `${Math.round(opportunity.probability * 100)}%`}</p></div></div>
    {opportunity.stageCode === "won" || opportunity.stageCode === "lost" ? <Button variant="outline" onClick={onReopen}>Reopen terminal opportunity</Button> : <div className="space-y-2"><Label htmlFor="opportunity-stage">Stage</Label><Select value={opportunity.stageCode} onValueChange={(value) => void onMove(value as CRMPipelineStageCode)}><SelectTrigger id="opportunity-stage"><SelectValue /></SelectTrigger><SelectContent>{CRM_PIPELINE_STAGE_CODES.map((stage) => <SelectItem key={stage} value={stage}>{labels[stage]}</SelectItem>)}</SelectContent></Select></div>}
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="opportunity-amount">Amount</Label><Input id="opportunity-amount" type="number" min="0" value={amount} onChange={(event) => { onDirtyChange(true); setAmount(event.target.value); }} /></div><div className="space-y-2"><Label htmlFor="opportunity-close-date">Expected close</Label><Input id="opportunity-close-date" type="date" value={closeDate} onChange={(event) => { onDirtyChange(true); setCloseDate(event.target.value); }} /></div></div>
    <div className="space-y-2"><Label htmlFor="opportunity-owner">Owner</Label><Select value={ownerId || "unassigned"} onValueChange={(value) => { onDirtyChange(true); setOwnerId(value === "unassigned" ? "" : value); }}><SelectTrigger id="opportunity-owner"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem><SelectItem value="owner-maya">Maya Chen</SelectItem><SelectItem value="owner-jon">Jon Bell</SelectItem><SelectItem value="owner-lee">Lee Okafor</SelectItem></SelectContent></Select></div>
    {opportunity.stageCode === "lost" && <div className="space-y-2"><Label htmlFor="opportunity-loss-reason">Loss reason</Label><Input id="opportunity-loss-reason" value={lossReason} onChange={(event) => { onDirtyChange(true); setLossReason(event.target.value); }} placeholder="Why was this opportunity lost?" /></div>}
    <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
    <div className="rounded-lg border border-border p-4 text-sm"><p className="font-medium">Relationships</p><p className="mt-2 text-muted-foreground">Contact: {opportunity.contact.displayName}</p><p className="text-muted-foreground">Lead: {opportunity.leadId ?? "No originating lead"}</p><p className="mt-2 font-medium">Lines ({opportunity.lines.length})</p>{opportunity.lines.map((line) => <div key={line.id} className="mt-2 flex items-center justify-between gap-3 text-muted-foreground"><span className="truncate">{line.label}</span><Input className="h-8 w-20" aria-label={`Quantity for ${line.label}`} type="number" min="1" value={lineQuantities[line.id] ?? line.quantity} onChange={(event) => { onDirtyChange(true); setLineQuantities((current) => ({ ...current, [line.id]: event.target.value })); }} /></div>)} </div>
  </div>;
}
