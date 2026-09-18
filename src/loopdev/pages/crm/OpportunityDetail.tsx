import { ArrowLeft, ArrowRight, CalendarClock, ExternalLink, FileText, RefreshCw, Save, TrendingUp } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { ActivityFeed, DataCard, EmptyState, FormSectionHeader, PageContainer, PageHeader, StatusBadge, getActivityActionLabel, getActivityKind, type ActivityFeedItem, useFormLifecycle } from "@/components/common";
import { PlatformNotesPanel } from "@/loopdev/components/platform";
import { AppDrawer } from "@/components/platform";
import { RelatedFilesPanel } from "@/loopdev/components/files";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { CRM_PIPELINE_STAGE_CODES, contactName, type CRMPipelineStageCode } from "@/loopdev/domains/crm/adapter";
import { useCrmContacts, useCrmPipeline, useCrmCustomer360, useCrmLeads } from "@/loopdev/domains/crm/hooks/use-crm";
import { platformAdapter } from "@/loopdev/domains/platform";
import { usePlatformNotes } from "@/loopdev/domains/platform";
import type { EntityRef } from "@/loopdev/domains/platform";

const labels: Record<CRMPipelineStageCode, string> = { prospecting: "Prospecting", qualified: "Qualified", proposal: "Proposal", negotiation: "Negotiation", won: "Won", lost: "Lost" };
const tones: Record<CRMPipelineStageCode, "neutral" | "info" | "success" | "warning" | "destructive"> = { prospecting: "neutral", qualified: "info", proposal: "info", negotiation: "warning", won: "success", lost: "destructive" };
const owners = [{ value: "owner-maya", label: "Maya Chen" }, { value: "owner-jon", label: "Jon Bell" }, { value: "owner-lee", label: "Lee Okafor" }];

export default function SalesCRMOpportunityDetail() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const navigate = useNavigate();
  const { trail } = useBreadcrumbs();
  const { opportunities, loading, error, reload, updateOpportunity, moveStage, reopenOpportunity } = useCrmPipeline();
  const { contacts } = useCrmContacts({ limit: 100 });
  const { leads } = useCrmLeads();
  const opportunity = opportunities.find((item) => item.id === opportunityId);
  const foundContact = opportunity ? contacts.find((item) => item.id === opportunity.contactId) : undefined;
  const fallbackContact = opportunity ? {
    id: opportunity.contactId,
    organizationId: "local-development-organization",
    firstName: (opportunity.contact.displayName || "Assigned Contact").split(" ")[0] || "Assigned",
    lastName: (opportunity.contact.displayName || "Assigned Contact").split(" ").slice(1).join(" ") || "Contact",
    companyName: "B2B Account",
    email: "contact@company.com",
    phone: "+1 555-0199",
    status: "active" as const,
    tags: [],
    customFields: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } : undefined;
  const contact = foundContact ?? fallbackContact;
  const contactDisplayName = foundContact ? contactName(foundContact) : (opportunity?.contact.displayName || "Assigned Contact");
  const customer = useCrmCustomer360(contact?.id);
  const relation: EntityRef<"opportunity"> | undefined = opportunity ? { entityType: "opportunity", entityId: opportunity.id, scope: platformAdapter.getScope() } : undefined;
  const notes = usePlatformNotes({ relation, limit: 10 });
  const [activityCategory, setActivityCategory] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [lossReason, setLossReason] = useState("");
  const [stage, setStage] = useState<CRMPipelineStageCode>("prospecting");
  const [editLines, setEditLines] = useState<Record<string, string>>({});
  const lifecycle = useFormLifecycle();

  if (loading) return <PageContainer width="wide"><div className="py-16 text-center text-sm text-muted-foreground">Loading opportunity…</div></PageContainer>;
  if (error) return <PageContainer width="narrow"><EmptyState title="Unable to load opportunity" description={error} action={<Button onClick={reload}><RefreshCw className="me-1.5 h-3.5 w-3.5" />Try again</Button>} /></PageContainer>;
  if (!opportunity || !contact) return <PageContainer width="narrow"><EmptyState title="Opportunity not found" description="This opportunity is unavailable." action={<Button asChild><Link to="/app/sales-crm/opportunities">Back to opportunities</Link></Button>} /></PageContainer>;

  const openEdit = () => {
    setAmount(opportunity.amount == null ? "" : String(opportunity.amount));
    setCloseDate(opportunity.expectedCloseDate ?? "");
    setOwnerId(opportunity.owner?.id ?? "");
    setLossReason(opportunity.lossReason ?? "");
    setStage(opportunity.stageCode);
    setEditLines(Object.fromEntries(opportunity.lines.map((line) => [line.id, String(line.quantity)])));
    lifecycle.markClean();
    setEditOpen(true);
  };
  const saveEdit = async () => {
    const owner = owners.find((item) => item.value === ownerId);
    const result = await updateOpportunity(opportunity, {
      amount: amount ? Number(amount) : null,
      expectedCloseDate: closeDate || null,
      ownerId: ownerId || null,
      ownerName: owner?.label ?? null,
      lossReason: stage === "lost" ? lossReason || null : undefined,
      lines: opportunity.lines.map((line) => ({ id: line.id, quantity: Number(editLines[line.id] ?? line.quantity) })),
    });
    if (result.status === "success") { if (stage !== opportunity.stageCode) await moveStage(result.opportunity, stage); lifecycle.markClean(); setEditOpen(false); reload(); }
  };
  const activityItems: ActivityFeedItem[] = (customer.view?.timeline ?? []).map((entry) => ({ id: entry.id, kind: getActivityKind(entry.type), actorLabel: entry.source ?? entry.sourceType, actorInitials: (entry.source ?? entry.sourceType).slice(0, 2).toUpperCase(), action: entry.type, actionLabel: getActivityActionLabel(entry.type), contextLabel: entry.status ?? undefined, occurredAt: entry.occurredAt, summary: entry.summary }));
  const visibleActivity = activityCategory === "all" ? activityItems : activityItems.filter((item) => item.actorLabel.toLowerCase().includes(activityCategory === "communications" ? "communication" : activityCategory === "notes" ? "note" : activityCategory === "tasks" ? "task" : "crm"));
  const originatingLead = opportunity.leadId ? leads.find((lead) => lead.id === opportunity.leadId) : undefined;

  return <PageContainer width="wide" className="min-w-0">
    <PageHeader title={`${opportunity.name} · Opportunity`} description="Pipeline value, commercial lines and relationship activity." breadcrumbs={trail.length ? [...trail, { label: opportunity.name }] : [{ label: "CRM" }, { label: "Opportunities" }, { label: opportunity.name }]} actions={<div className="flex gap-2"><Button variant="outline" onClick={openEdit}>Edit opportunity</Button><Button variant="outline" onClick={() => navigate("/app/sales-crm/opportunities")}><ArrowLeft className="me-1.5 h-3.5 w-3.5" />Back to opportunities</Button></div>} />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
      <main className="space-y-6">
        <DataCard title="Opportunity overview" description="Commercial value and current pipeline state." action={<div className="flex items-center gap-2"><Label htmlFor="opportunity-stage" className="text-xs text-muted-foreground">Stage</Label><Select value={opportunity.stageCode} onValueChange={(value) => void moveStage(opportunity, value as CRMPipelineStageCode)}><SelectTrigger id="opportunity-stage" className="h-9 w-36"><SelectValue /></SelectTrigger><SelectContent>{CRM_PIPELINE_STAGE_CODES.map((value) => <SelectItem key={value} value={value}>{labels[value]}</SelectItem>)}</SelectContent></Select></div>}>
          <div className="flex flex-wrap items-center gap-3 border-b border-border pb-5"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary"><TrendingUp className="h-6 w-6" /></div><div className="min-w-0 flex-1"><h2 className="font-display text-xl font-semibold">{opportunity.name}</h2><div className="mt-1 flex flex-wrap items-center gap-2"><StatusBadge tone={tones[opportunity.stageCode]} dot>{labels[opportunity.stageCode]}</StatusBadge><StatusBadge tone="neutral">{opportunity.origin === "lead_conversion" ? "Lead conversion" : "Manual"}</StatusBadge></div><p className="mt-1 text-sm text-muted-foreground"><Link className="hover:text-primary hover:underline" to={`/app/sales-crm/contacts/${contact.id}`}>{contactDisplayName}</Link>{contact.companyName ? ` · ${contact.companyName}` : ""}</p></div></div>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5"><Metric label="Amount" value={opportunity.amount == null ? "—" : formatCurrency(opportunity.amount, (opportunity.currency ?? "EUR") as never)} /><Metric label="Probability" value={opportunity.probability == null ? "—" : `${Math.round(opportunity.probability * 100)}%`} /><Metric label="Weighted amount" value={opportunity.amount == null || opportunity.probability == null ? "—" : formatCurrency(opportunity.amount * opportunity.probability, (opportunity.currency ?? "EUR") as never)} /><Metric label="Expected close" value={opportunity.expectedCloseDate ? formatDate(opportunity.expectedCloseDate) : "—"} /><Metric label="Owner" value={opportunity.owner?.displayName ?? "Unassigned"} /></dl>
        </DataCard>
        <DataCard title="Commercial lines" description="Products and quantities attached to the opportunity."><div className="space-y-2">{opportunity.lines.map((line) => <div key={line.id} className="flex items-center justify-between rounded-md border border-border p-3"><span><span className="block font-medium">{line.label || line.productKey || "Product line"}</span><span className="text-xs text-muted-foreground">{line.unitAmount == null ? "Unit amount pending" : formatCurrency(line.unitAmount, (line.currency ?? opportunity.currency ?? "EUR") as never)}</span></span><span className="text-sm text-muted-foreground">Qty {line.quantity}</span></div>)}</div></DataCard>
        <section className="surface-card overflow-hidden"><div className="border-b border-border px-5 pt-4"><h3 className="font-display text-lg font-semibold">Activity</h3><p className="text-sm text-muted-foreground">Recent opportunity and customer timeline</p><Tabs value={activityCategory} onValueChange={setActivityCategory} className="mt-3"><TabsList className="h-9 bg-transparent p-0"><TabsTrigger value="all" className="h-9 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary">All</TabsTrigger><TabsTrigger value="communications" className="h-9 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary">Communications</TabsTrigger><TabsTrigger value="notes" className="h-9 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary">Notes</TabsTrigger><TabsTrigger value="tasks" className="h-9 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary">Tasks</TabsTrigger><TabsTrigger value="crm" className="h-9 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary">CRM</TabsTrigger></TabsList></Tabs></div><div className="p-5"><ActivityFeed items={visibleActivity} title="" description="" loading={customer.loading} error={customer.error} emptyTitle="No activity in this category" emptyDescription="Activity will appear here as the opportunity progresses." /></div></section>
      </main>
      <aside className="space-y-6">
        <DataCard title="Opportunity actions" description="Move and manage this opportunity."><div className="grid gap-2"><Button variant="outline" className="justify-start" onClick={openEdit}><FileText className="me-2 h-4 w-4" />Edit opportunity</Button>{opportunity.stageCode !== "won" && <Button variant="outline" className="justify-start" onClick={() => void moveStage(opportunity, "won")}><TrendingUp className="me-2 h-4 w-4" />Mark won</Button>}{opportunity.stageCode !== "lost" && <Button variant="outline" className="justify-start" onClick={() => void moveStage(opportunity, "lost")}><CalendarClock className="me-2 h-4 w-4" />Mark lost</Button>}{(opportunity.stageCode === "won" || opportunity.stageCode === "lost") && <Button variant="outline" className="justify-start" onClick={() => void reopenOpportunity(opportunity, { reason: "Reopened from opportunity detail" })}><RefreshCw className="me-2 h-4 w-4" />Reopen opportunity</Button>}<Button variant="outline" className="justify-start" asChild><Link to={`/app/sales-crm/contacts/${contact.id}`}><ExternalLink className="me-2 h-4 w-4" />Open Customer 360<ArrowRight className="ms-auto h-3.5 w-3.5" /></Link></Button></div></DataCard>
        <DataCard title="Relationships" description="Records connected to this opportunity."><div className="space-y-2 text-sm"><Link className="flex items-center justify-between rounded-md border border-border p-3 hover:border-primary/40" to={`/app/sales-crm/contacts/${contact.id}`}><span>Contact</span><span className="font-medium">{contactDisplayName}</span></Link>{originatingLead && <Link className="flex items-center justify-between rounded-md border border-border p-3 hover:border-primary/40" to={`/app/sales-crm/leads/${originatingLead.id}`}><span>Originating lead</span><span className="font-medium">{originatingLead.interest || "Lead"}</span></Link>}</div></DataCard>
        <PlatformNotesPanel notes={notes.notes} loading={notes.loading} error={notes.error} forbidden={notes.forbidden} relation={relation} onCreate={(body, visibility, attachments) => relation ? notes.createNote({ relation, body, visibility, attachments }) : Promise.resolve()} onUpdate={(noteId, body, expectedVersion) => notes.updateNote(noteId, { body, expectedVersion })} />
        <RelatedFilesPanel relation={{ entityType: "opportunity", entityId: opportunity.id, scope: platformAdapter.getScope() }} />
      </aside>
    </div>
    <AppDrawer open={editOpen} onOpenChange={setEditOpen} title="Edit opportunity" eyebrow="CRM / Opportunities" mode="Editing" headerMeta={<span>Opportunity form</span>} description="Update pipeline stage, value, ownership and commercial lines." dirty={() => lifecycle.dirtyRef.current} showDirtyState={lifecycle.dirty} confirmOnClose confirmTitle="Discard opportunity changes?" confirmDescription="Your unsaved opportunity changes will be lost." onDiscard={() => lifecycle.markClean()} size="md" layoutMode="standard" responsive="auto" footer={<div className="flex w-full justify-end gap-2"><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={() => void saveEdit()}><Save className="me-1.5 h-4 w-4" />Save changes</Button></div>}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void saveEdit(); }}><section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs"><FormSectionHeader eyebrow="Pipeline" title="Opportunity details" description="Maintain the official commercial pipeline record." mode="expanded" responsive="auto" meta={<span>Core details</span>} /><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="edit-opportunity-stage">Stage</Label><Select value={stage} onValueChange={(value) => { lifecycle.markDirty(); setStage(value as CRMPipelineStageCode); }}><SelectTrigger id="edit-opportunity-stage"><SelectValue /></SelectTrigger><SelectContent>{CRM_PIPELINE_STAGE_CODES.map((value) => <SelectItem key={value} value={value}>{labels[value]}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label htmlFor="edit-opportunity-owner">Owner</Label><Select value={ownerId || "unassigned"} onValueChange={(value) => { lifecycle.markDirty(); setOwnerId(value === "unassigned" ? "" : value); }}><SelectTrigger id="edit-opportunity-owner"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{owners.map((owner) => <SelectItem key={owner.value} value={owner.value}>{owner.label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label htmlFor="edit-opportunity-amount">Amount</Label><Input id="edit-opportunity-amount" type="number" min="0" value={amount} onChange={(event) => { lifecycle.markDirty(); setAmount(event.target.value); }} /></div><div className="space-y-1.5"><Label htmlFor="edit-opportunity-close">Expected close</Label><Input id="edit-opportunity-close" type="date" value={closeDate} onChange={(event) => { lifecycle.markDirty(); setCloseDate(event.target.value); }} /></div>{stage === "lost" && <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="edit-opportunity-loss">Loss reason</Label><Input id="edit-opportunity-loss" value={lossReason} onChange={(event) => { lifecycle.markDirty(); setLossReason(event.target.value); }} /></div>}</div></section><section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs"><FormSectionHeader eyebrow="Products" title="Commercial lines" description="Adjust quantities attached to the opportunity." mode="expanded" responsive="auto" meta={<span>{opportunity.lines.length} lines</span>} />{opportunity.lines.map((line) => <div key={line.id} className="space-y-1.5"><Label htmlFor={`edit-line-${line.id}`}>{line.label || line.productKey || "Product line"}</Label><Input id={`edit-line-${line.id}`} type="number" min="1" value={editLines[line.id] ?? line.quantity} onChange={(event) => { lifecycle.markDirty(); setEditLines((current) => ({ ...current, [line.id]: event.target.value })); }} /></div>)}</section></form>
    </AppDrawer>
  </PageContainer>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</dt><dd className="mt-1 truncate text-sm font-medium">{value}</dd></div>; }
