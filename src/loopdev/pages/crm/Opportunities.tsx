import { useMemo, useRef, useState } from "react";
import { ExternalLink, RefreshCw, SearchX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppDrawer } from "@/components/platform";
import { DataCard, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Currency } from "@/types";
import {
  CRM_PIPELINE_STAGE_CODES,
  type CRMPipelineOpportunity,
  type CRMPipelineStageCode,
} from "@/loopdev/domains/crm/adapter";
import { useCrmPipeline } from "@/loopdev/domains/crm/hooks/use-crm";

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
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [stageCodes, setStageCodes] = useState<CRMPipelineStageCode[]>([]);
  const [origins, setOrigins] = useState<("manual" | "lead_conversion")[]>([]);
  const [sortBy, setSortBy] = useState<"updated" | "name" | "amount" | "expectedCloseDate">("updated");
  const [selected, setSelected] = useState<CRMPipelineOpportunity | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { opportunities, loading, error, forbidden, mutation, reload, updateOpportunity, moveStage } = useCrmPipeline({
    query, stageCodes, origins, sortBy, sortDirection: "desc",
  });
  const ownerOptions = useMemo(() => [...new Map(
    opportunities.filter((item) => item.owner).map((item) => [item.owner!.id, item.owner!.displayName]),
  )].map(([value, label]) => ({ value, label })), [opportunities]);
  const [ownerIds, setOwnerIds] = useState<string[]>([]);
  const filtered = ownerIds.length ? opportunities.filter((item) => item.owner && ownerIds.includes(item.owner.id)) : opportunities;

  const openDetails = (opportunity: CRMPipelineOpportunity) => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected(opportunity);
    setDrawerOpen(true);
  };

  const closeDetails = (open: boolean) => {
    setDrawerOpen(open);
    if (!open) setSelected(null);
  };

  return (
    <PageContainer width="wide" className="max-w-[1600px]">
      <PageHeader eyebrow="CRM" title="Opportunities" description="Manage the sales cycle behind your pipeline." breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Opportunities" }]} />
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
      <AppDrawer open={drawerOpen} onOpenChange={closeDetails} title={selected?.name ?? "Opportunity"} description={selected ? `${selected.contact.displayName} · ${labels[selected.stageCode]}` : undefined} restoreFocusRef={restoreFocusRef} size="md" footer={selected ? <div className="flex w-full justify-between gap-2"><Button variant="outline" onClick={() => navigate(`/app/sales-crm/contacts/${selected.contactId}`)}><ExternalLink className="mr-1.5 h-4 w-4" />Contact</Button><Button onClick={() => closeDetails(false)}>Done</Button></div> : undefined}>
        {selected && <OpportunityDetails opportunity={selected} onUpdate={async (input) => { const result = await updateOpportunity(selected, input); if (result.status === "success") setSelected(result.opportunity); }} onMove={async (stage) => { const result = await moveStage(selected, stage); if (result.status === "success") setSelected(result.opportunity); }} />}
      </AppDrawer>
    </PageContainer>
  );
}

function OpportunityDetails({ opportunity, onUpdate, onMove }: { opportunity: CRMPipelineOpportunity; onUpdate: (input: { amount?: number | null; expectedCloseDate?: string | null; lossReason?: string | null }) => Promise<void>; onMove: (stage: CRMPipelineStageCode) => Promise<void> }) {
  const [amount, setAmount] = useState(opportunity.amount?.toString() ?? "");
  const [closeDate, setCloseDate] = useState(opportunity.expectedCloseDate ?? "");
  const [lossReason, setLossReason] = useState(opportunity.lossReason ?? "");
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); await onUpdate({ amount: amount ? Number(amount) : null, expectedCloseDate: closeDate || null, lossReason: opportunity.stageCode === "lost" ? lossReason : undefined }); setSaving(false); };
  return <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-muted-foreground">Origin</span><p className="font-medium">{opportunity.origin === "lead_conversion" ? "Lead conversion" : "Manual"}</p></div><div><span className="text-muted-foreground">Product</span><p className="font-medium">{opportunity.productKey ?? "—"}</p></div><div><span className="text-muted-foreground">Owner</span><p className="font-medium">{opportunity.owner?.displayName ?? "Unassigned"}</p></div><div><span className="text-muted-foreground">Probability</span><p className="font-medium">{opportunity.probability === null ? "—" : `${Math.round(opportunity.probability * 100)}%`}</p></div></div>
    <div className="space-y-2"><Label htmlFor="opportunity-stage">Stage</Label><select id="opportunity-stage" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={opportunity.stageCode} onChange={(event) => void onMove(event.target.value as CRMPipelineStageCode)}>{CRM_PIPELINE_STAGE_CODES.map((stage) => <option key={stage} value={stage}>{labels[stage]}</option>)}</select></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="opportunity-amount">Amount</Label><Input id="opportunity-amount" type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="opportunity-close-date">Expected close</Label><Input id="opportunity-close-date" type="date" value={closeDate} onChange={(event) => setCloseDate(event.target.value)} /></div></div>
    {opportunity.stageCode === "lost" && <div className="space-y-2"><Label htmlFor="opportunity-loss-reason">Loss reason</Label><Input id="opportunity-loss-reason" value={lossReason} onChange={(event) => setLossReason(event.target.value)} placeholder="Why was this opportunity lost?" /></div>}
    <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
    <div className="rounded-lg border border-border p-4 text-sm"><p className="font-medium">Relationships</p><p className="mt-2 text-muted-foreground">Contact: {opportunity.contact.displayName}</p><p className="text-muted-foreground">Lead: {opportunity.leadId ?? "No originating lead"}</p></div>
  </div>;
}
