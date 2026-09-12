import { ArrowLeft, ArrowRight, ListTodo, Mail, MessageCircle, MessageSquarePlus, Phone, PhoneCall, Plus, RefreshCw } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppDrawer } from "@/components/platform";
import { ActivityFeed, DataCard, EmptyState, FormSectionHeader, PageContainer, PageHeader, StatusBadge, getActivityActionLabel, getActivityKind, type ActivityFeedItem, useFormLifecycle } from "@/components/common";
import { RelatedFilesPanel } from "@/loopdev/components/files";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useCrmContacts, useCrmCustomer360, useCrmLeads, useCrmPipeline } from "@/loopdev/domains/crm/hooks/use-crm";
import { contactName, CRM_LEAD_STATUS_CODES, type CRMLeadStatusCode } from "@/loopdev/domains/crm/adapter";
import { formatDate, getInitials } from "@/lib/formatters";
import { platformAdapter } from "@/loopdev/domains/platform";
import { PlatformNotesPanel } from "@/loopdev/components/platform";
import { usePlatformNotes } from "@/loopdev/domains/platform";
import type { EntityRef } from "@/loopdev/domains/platform";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useRef, useState } from "react";

const STATUS_LABELS: Record<CRMLeadStatusCode, string> = {
  new: "New", contacted: "Contacted", qualified: "Qualified", stalled: "Stalled", inactive: "Inactive", converted: "Converted",
};
const STATUS_TONES: Record<CRMLeadStatusCode, "success" | "info" | "warning" | "neutral"> = {
  new: "info", contacted: "info", qualified: "success", stalled: "warning", inactive: "neutral", converted: "success",
};

export default function SalesCRMLeadDetail() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { trail } = useBreadcrumbs();
  const { leads, loading: leadsLoading, error: leadsError, reload, updateLead } = useCrmLeads();
  const { contacts } = useCrmContacts();
  const { opportunities } = useCrmPipeline();
  const lead = leads.find((item) => item.id === leadId);
  const contact = lead ? contacts.find((item) => item.id === lead.contactId) : undefined;
  const customer = useCrmCustomer360(contact?.id);
  const relatedOpportunities = lead ? opportunities.filter((opportunity) => opportunity.leadId === lead.id || opportunity.contactId === lead.contactId) : [];
  const leadRelation: EntityRef<"lead"> | undefined = lead ? { entityType: "lead", entityId: lead.id, scope: platformAdapter.getScope() } : undefined;
  const notes = usePlatformNotes({ relation: leadRelation, limit: 10 });
  const [activityCategory, setActivityCategory] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editInterest, setEditInterest] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editStatus, setEditStatus] = useState<CRMLeadStatusCode>("new");
  const [editNeed, setEditNeed] = useState("");
  const [editTimeline, setEditTimeline] = useState("");
  const [editEstimatedValue, setEditEstimatedValue] = useState("");
  const [editEstimatedCurrency, setEditEstimatedCurrency] = useState("EUR");
  const editRestoreFocusRef = useRef<HTMLElement | null>(null);
  const editLifecycle = useFormLifecycle();
  const ownerOptions = useMemo(
    () => [...new Map(leads.filter((item) => item.assignedUserId && item.ownerName).map((item) => [item.assignedUserId!, item.ownerName!]))]
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, label]) => ({ value, label })),
    [leads],
  );

  if (leadsLoading) return <PageContainer width="wide"><div className="py-16 text-center text-sm text-muted-foreground">Loading lead…</div></PageContainer>;
  if (leadsError) return <PageContainer width="narrow"><EmptyState title="Unable to load lead" description={leadsError} action={<Button onClick={reload}><RefreshCw className="me-1.5 h-3.5 w-3.5" />Try again</Button>} /></PageContainer>;
  if (!lead || !contact) return <PageContainer width="narrow"><EmptyState title="Lead not found" description="This lead does not exist or its contact is unavailable in the active organization." action={<Button asChild><Link to="/app/sales-crm/leads">Back to leads</Link></Button>} /></PageContainer>;

  const changeStatus = async (status: CRMLeadStatusCode) => {
    await updateLead(lead, { status });
    reload();
  };
  const openEdit = () => {
    setEditInterest(lead.interest ?? "");
    setEditSource(lead.source ?? "");
    setEditOwner(lead.assignedUserId ?? "");
    setEditStatus(lead.status);
    setEditNeed(lead.qualificationNeed ?? "");
    setEditTimeline(lead.qualificationTimeline ?? "");
    setEditEstimatedValue(lead.estimatedValue == null ? "" : String(lead.estimatedValue));
    setEditEstimatedCurrency(lead.estimatedCurrency ?? "EUR");
    editLifecycle.markClean();
    setEditOpen(true);
  };
  const saveEdit = async () => {
    if (!lead) return;
    const owner = editOwner ? ownerOptions.find((option) => option.value === editOwner) : undefined;
    await updateLead(lead, {
      interest: editInterest.trim() || null,
      source: editSource.trim() || null,
      assignedUserId: editOwner || null,
      ownerName: owner?.label ?? null,
      status: editStatus,
      qualificationNeed: editNeed.trim() || null,
      qualificationTimeline: editTimeline.trim() || null,
      estimatedValue: editEstimatedValue.trim() ? Number(editEstimatedValue) : null,
      estimatedCurrency: editEstimatedCurrency.trim().toUpperCase() || "EUR",
    });
    setEditOpen(false);
    editLifecycle.markClean();
    reload();
  };
  const activityItems: ActivityFeedItem[] = (customer.view?.timeline ?? []).map((entry) => ({
    id: entry.id,
    kind: getActivityKind(entry.type),
    actorLabel: entry.source ?? entry.sourceType,
    actorInitials: (entry.source ?? entry.sourceType).slice(0, 2).toUpperCase(),
    action: entry.type,
    actionLabel: getActivityActionLabel(entry.type),
    contextLabel: entry.status ?? undefined,
    occurredAt: entry.occurredAt,
    summary: entry.summary,
  }));
  const visibleActivityItems = activityCategory === "all"
    ? activityItems
    : activityItems.filter((item) => {
      const source = item.actorLabel.toLowerCase();
      if (activityCategory === "communications") return source.includes("communication");
      if (activityCategory === "notes") return source.includes("note");
      if (activityCategory === "tasks") return source.includes("task");
      return source.includes("crm");
    });
  return (
    <PageContainer width="wide" className="min-w-0">
      <PageHeader
        title={`${contactName(contact)} · Lead`}
        description="Contact, commercial intent and activity context."
        breadcrumbs={trail.length ? [...trail, { label: contactName(contact) }] : [{ label: "CRM" }, { label: "Leads" }, { label: contactName(contact) }]}
        actions={<div className="flex gap-2"><Button variant="outline" onClick={openEdit}>Edit lead</Button><Button variant="outline" onClick={() => navigate("/app/sales-crm/leads")}><ArrowLeft className="me-1.5 h-3.5 w-3.5" />Back to leads</Button></div>}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <main className="space-y-6">
          <DataCard className="overflow-hidden" bodyClassName="py-4" title="Lead overview" description="Contact and current lead state." action={<div className="flex flex-wrap items-center justify-end gap-2"><label htmlFor="lead-phase" className="text-xs font-medium text-muted-foreground">Lead phase</label><Select value={lead.status} onValueChange={(value) => void changeStatus(value as CRMLeadStatusCode)}><SelectTrigger id="lead-phase" className="h-9 w-36" aria-label="Lead phase"><SelectValue /></SelectTrigger><SelectContent>{CRM_LEAD_STATUS_CODES.map((status) => <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>)}</SelectContent></Select>{lead.status === "qualified" && <Button asChild><Link to={`/app/sales-crm/opportunities?leadId=${encodeURIComponent(lead.id)}&contactId=${encodeURIComponent(contact.id)}`}><Plus className="me-1.5 h-3.5 w-3.5" />Create opportunity</Link></Button>}</div>}>
            <div className="flex flex-wrap items-start gap-4 border-b border-border pb-5"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-base font-semibold text-primary">{getInitials(contactName(contact))}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-xl font-semibold"><Link className="hover:text-primary hover:underline" to={`/app/sales-crm/contacts/${contact.id}`}>{contactName(contact)}</Link></h2><StatusBadge tone={STATUS_TONES[lead.status]} dot>{STATUS_LABELS[lead.status]}</StatusBadge><StatusBadge tone="neutral">{lead.source || "Unknown source"}</StatusBadge></div><p className="mt-1 text-sm text-muted-foreground">{contact.companyName || "No company"} · {contact.jobTitle || "No title"}</p><div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground"><a className="inline-flex items-center gap-1.5 hover:text-primary" href={contact.email ? `mailto:${contact.email}` : undefined}><Mail className="h-3.5 w-3.5" />{contact.email || "No email"}</a><a className="inline-flex items-center gap-1.5 hover:text-primary" href={contact.phone ? `tel:${contact.phone}` : undefined}><Phone className="h-3.5 w-3.5" />{contact.phone || "No phone"}</a></div></div></div>
            <div className="mt-4 overflow-hidden border-t border-border pt-3"><dl className="grid grid-cols-5 divide-x divide-border"><InfoField label="Interest / product" value={lead.interest} /><InfoField label="Owner" value={lead.ownerName || "Unassigned"} /><InfoField label="Score" value={lead.score == null ? null : String(lead.score)} /><InfoField label="Created" value={formatDate(lead.createdAt)} /><InfoField label="Next activity" value={lead.nextActivityAt ? formatDate(lead.nextActivityAt) : null} /></dl></div>
          </DataCard>
          <DataCard title="Qualification" description="Commercial potential is indicative until an opportunity is created.">
            <dl className="grid gap-4 sm:grid-cols-3"><InfoField label="Need" value={lead.qualificationNeed} /><InfoField label="Expected timeline" value={lead.qualificationTimeline} /><InfoField label="Estimated potential" value={lead.estimatedValue == null ? null : `${lead.estimatedValue.toLocaleString()} ${lead.estimatedCurrency ?? ""}`} /></dl>
          </DataCard>
          <section className="surface-card overflow-hidden">
            <div className="border-b border-border px-5 pt-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-display text-lg font-semibold tracking-tight">Activity</h3><p className="mt-0.5 text-sm text-muted-foreground">Recent customer timeline</p></div>
              </div>
              <Tabs value={activityCategory} onValueChange={setActivityCategory} className="mt-3"><TabsList className="h-9 bg-transparent p-0"><TabsTrigger value="all" className="h-9 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary">All</TabsTrigger><TabsTrigger value="communications" className="h-9 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary">Communications</TabsTrigger><TabsTrigger value="notes" className="h-9 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary">Notes</TabsTrigger><TabsTrigger value="tasks" className="h-9 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary">Tasks</TabsTrigger><TabsTrigger value="crm" className="h-9 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary">CRM</TabsTrigger></TabsList></Tabs>
            </div>
            <div className="p-5"><ActivityFeed items={visibleActivityItems} title="" description="" loading={customer.loading} error={customer.error} emptyTitle="No activity in this category" emptyDescription="Activity will appear here as the relationship develops." /></div>
          </section>
        </main>
        <aside className="space-y-6">
          <DataCard title="Lead actions" description="Work the lead from the channels that matter.">
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <Button className="w-full justify-start" variant="outline" asChild><a href={contact.phone ? `tel:${contact.phone}` : undefined} aria-disabled={!contact.phone} onClick={(event) => { if (!contact.phone) event.preventDefault(); }}><PhoneCall className="me-2 h-4 w-4" />Call{!contact.phone && " · unavailable"}</a></Button>
              <Button className="w-full justify-start" variant="outline" asChild><a href={contact.email ? `mailto:${contact.email}` : undefined} aria-disabled={!contact.email} onClick={(event) => { if (!contact.email) event.preventDefault(); }}><Mail className="me-2 h-4 w-4" />Email{!contact.email && " · unavailable"}</a></Button>
              <Button className="w-full justify-start" variant="outline" asChild><Link to="/app/sales-crm/communications"><MessageCircle className="me-2 h-4 w-4" />Chat</Link></Button>
              <Button className="w-full justify-start" variant="outline" asChild><Link to="/app/sales-crm/communications"><MessageSquarePlus className="me-2 h-4 w-4" />Message</Link></Button>
              <Button className="w-full justify-start" variant="outline" asChild><Link to="/app/sales-crm/tasks"><ListTodo className="me-2 h-4 w-4" />Task</Link></Button>
              {lead.status !== "contacted" && <Button className="w-full justify-start sm:col-span-3 lg:col-span-1" variant="secondary" onClick={() => void changeStatus("contacted")}><Phone className="me-2 h-4 w-4" />Mark contacted</Button>}
              <div className="flex items-center gap-2 sm:col-span-3 lg:col-span-1"><Label htmlFor="lead-owner-action" className="sr-only">Assign owner</Label><Select value={lead.assignedUserId ?? "unassigned"} onValueChange={(value) => { const owner = ownerOptions.find((option) => option.value === value); void updateLead(lead, { assignedUserId: value === "unassigned" ? null : value, ownerName: owner?.label ?? null }).then(reload); }}><SelectTrigger id="lead-owner-action" className="w-full"><SelectValue placeholder="Assign owner" /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{ownerOptions.map((owner) => <SelectItem key={owner.value} value={owner.value}>{owner.label}</SelectItem>)}</SelectContent></Select></div>
              <Button className="w-full justify-start sm:col-span-3 lg:col-span-1" variant="outline" asChild><Link to={`/app/sales-crm/contacts/${contact.id}`}>Open Customer 360 <ArrowRight className="ms-auto h-3.5 w-3.5" /></Link></Button>
            </div>
          </DataCard>
          <PlatformNotesPanel notes={notes.notes} loading={notes.loading} error={notes.error} forbidden={notes.forbidden} relation={leadRelation} onCreate={(body, visibility, attachments) => leadRelation ? notes.createNote({ relation: leadRelation, body, visibility, attachments }) : Promise.resolve()} onUpdate={(noteId, body, expectedVersion) => notes.updateNote(noteId, { body, expectedVersion })} />
          <DataCard title="Related opportunities" description="Commercial opportunities connected to this lead or contact." empty={!relatedOpportunities.length} emptyTitle="No related opportunities" emptyDescription="Convert or associate this lead with an opportunity to continue the sales process.">
            <div className="space-y-2">{relatedOpportunities.map((opportunity) => <Link key={opportunity.id} to="/app/sales-crm/opportunities" className="flex items-center justify-between rounded-md border border-border p-3 text-sm transition hover:border-primary/40"><span className="min-w-0"><span className="block truncate font-medium">{opportunity.name}</span><span className="text-xs text-muted-foreground">{opportunity.amount == null ? "Amount pending" : `${opportunity.amount} ${opportunity.currency ?? ""}`}</span></span><span className="flex shrink-0 items-center gap-2"><StatusBadge tone="info">{opportunity.stageCode}</StatusBadge><ArrowRight className="h-3.5 w-3.5 text-muted-foreground" /></span></Link>)}</div>
          </DataCard>
          <RelatedFilesPanel relation={{ entityType: "lead", entityId: lead.id, scope: platformAdapter.getScope() }} />
        </aside>
      </div>
      <AppDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit lead"
        eyebrow="CRM / Leads"
        mode="Editing"
        headerMeta={<span>Lead form</span>}
        description="Update contact qualification, attribution and ownership without leaving the lead workspace."
        restoreFocusRef={editRestoreFocusRef}
        dirty={() => editLifecycle.dirtyRef.current}
        showDirtyState={editLifecycle.dirty}
        confirmOnClose
        confirmTitle="Discard lead changes?"
        confirmDescription="Your unsaved lead changes will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onDiscard={() => editLifecycle.markClean()}
        size="md"
        layoutMode="standard"
        responsive="auto"
        footer={<div className="flex w-full justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button type="button" onClick={() => void saveEdit()}>Save changes</Button></div>}
      >
        <form id="edit-lead-form" className="space-y-4" onSubmit={(event) => { event.preventDefault(); void saveEdit(); }}>
          <section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs">
            <FormSectionHeader eyebrow="Profile" title="Lead details" description="Update the commercial context and relationship owner." mode="expanded" responsive="auto" meta={<span>Core details</span>} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2"><Label>Contact</Label><Input value={contactName(contact)} readOnly className="bg-muted/40" /></div>
              <div className="space-y-1.5"><Label htmlFor="edit-lead-interest">Interest</Label><Input id="edit-lead-interest" value={editInterest} onChange={(event) => { editLifecycle.markDirty(); setEditInterest(event.target.value); }} placeholder="e.g. Enterprise expansion" /></div>
              <div className="space-y-1.5"><Label htmlFor="edit-lead-source">Source / attribution</Label><Input id="edit-lead-source" value={editSource} onChange={(event) => { editLifecycle.markDirty(); setEditSource(event.target.value); }} placeholder="Website, referral, event…" /></div>
              <div className="space-y-1.5"><Label htmlFor="edit-lead-owner">Owner</Label><Select value={editOwner || "unassigned"} onValueChange={(value) => { editLifecycle.markDirty(); setEditOwner(value === "unassigned" ? "" : value); }}><SelectTrigger id="edit-lead-owner"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{ownerOptions.map((owner) => <SelectItem key={owner.value} value={owner.value}>{owner.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label htmlFor="edit-lead-status">Lead status</Label><Select value={editStatus} onValueChange={(value) => { editLifecycle.markDirty(); setEditStatus(value as CRMLeadStatusCode); }}><SelectTrigger id="edit-lead-status"><SelectValue /></SelectTrigger><SelectContent>{CRM_LEAD_STATUS_CODES.map((status) => <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </section>
          <section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs">
            <FormSectionHeader eyebrow="Qualification" title="Commercial context" description="Capture indicative potential before an opportunity exists." mode="expanded" responsive="auto" meta={<span>Optional details</span>} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="edit-lead-need">Need</Label><Input id="edit-lead-need" value={editNeed} onChange={(event) => { editLifecycle.markDirty(); setEditNeed(event.target.value); }} placeholder="What problem are they solving?" /></div>
              <div className="space-y-1.5"><Label htmlFor="edit-lead-timeline">Expected timeline</Label><Input id="edit-lead-timeline" value={editTimeline} onChange={(event) => { editLifecycle.markDirty(); setEditTimeline(event.target.value); }} placeholder="This quarter, 3–6 months…" /></div>
              <div className="space-y-1.5"><Label htmlFor="edit-lead-value">Estimated potential</Label><Input id="edit-lead-value" type="number" min="0" value={editEstimatedValue} onChange={(event) => { editLifecycle.markDirty(); setEditEstimatedValue(event.target.value); }} placeholder="Optional" /></div>
              <div className="space-y-1.5"><Label htmlFor="edit-lead-currency">Currency</Label><Input id="edit-lead-currency" maxLength={3} value={editEstimatedCurrency} onChange={(event) => { editLifecycle.markDirty(); setEditEstimatedCurrency(event.target.value); }} placeholder="EUR" /></div>
            </div>
          </section>
        </form>
      </AppDrawer>
    </PageContainer>
  );
}

function InfoField({ label, value }: { label: string; value: string | null }) {
  return <div className="min-w-0 px-3 first:pl-0 last:pr-0"><dt className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</dt><dd className="mt-1 truncate text-sm font-medium text-foreground" title={value || "—"}>{value || "—"}</dd></div>;
}
