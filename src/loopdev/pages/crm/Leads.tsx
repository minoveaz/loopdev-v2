import React, { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle, CalendarClock, Columns3, Flame, LayoutList,
  MoreHorizontal, Plus, RefreshCw, SearchX, UserRound, Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  ConfirmDialog, DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader,
  FormSectionHeader, SearchInput, StatusBadge, useFormLifecycle,
} from "@/components/common";
import { AppDrawer } from "@/components/platform";
import { CRMRecordPicker, type CRMRecordPickerItem } from "@/loopdev/components/crm/CRMRecordPicker";
import { LeadKanbanBoard } from "@/loopdev/components/crm/LeadKanbanBoard";
import { LeadQuickPreviewDrawer } from "@/loopdev/components/crm/LeadQuickPreviewDrawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useTenantContext } from "@/hooks/use-tenant-context";
import {
  CRM_LEAD_STATUS_CODES, contactName, type CRMLead, type CRMLeadStatusCode,
} from "@/loopdev/domains/crm/adapter";
import { useCrmContacts, useCrmLeads, useCrmPipeline } from "@/loopdev/domains/crm/hooks/use-crm";
import { formatDate, getInitials } from "@/lib/formatters";

const STATUS_LABELS: Record<CRMLeadStatusCode, string> = {
  new: "New", contacted: "Contacted", qualified: "Qualified", stalled: "Stalled",
  inactive: "Inactive", converted: "Converted",
};
const STATUS_TONES: Record<CRMLeadStatusCode, "success" | "info" | "warning" | "neutral"> = {
  new: "info", contacted: "info", qualified: "success", stalled: "warning", inactive: "neutral", converted: "success",
};
const statusOptions = CRM_LEAD_STATUS_CODES.map((value) => ({ label: STATUS_LABELS[value], value }));
const CURRENT_USER_ID = "owner-maya";
const CURRENT_USER_NAME = "Maya Chen";
const sevenDaysAgo = () => Date.now() - 7 * 86400000;

type OpportunityFilter = "all" | "with" | "without";
type ViewKey = "all" | "mine" | "new" | "working" | "qualified" | "converted" | "inactive";

const SAVED_VIEWS: Array<{ key: ViewKey; label: string; statuses?: CRMLeadStatusCode[]; owner?: string }> = [
  { key: "all", label: "All leads" },
  { key: "mine", label: "My leads", owner: CURRENT_USER_ID },
  { key: "new", label: "New", statuses: ["new"] },
  { key: "working", label: "Working / Contacted", statuses: ["contacted"] },
  { key: "qualified", label: "Qualified", statuses: ["qualified"] },
  { key: "converted", label: "Converted", statuses: ["converted"] },
  { key: "inactive", label: "Inactive", statuses: ["inactive"] },
];

export default function SalesCRMLeads() {
  const { activeOrganization } = useTenantContext();
  const { trail } = useBreadcrumbs();
  const navigate = useNavigate();
  const {
    leads, loading, error, reload, conversion, createOpportunityFromLead, updateLead, resetConversion,
    creation, createLead, archiveLead, bulkArchiveLeads,
  } = useCrmLeads();
  const { contacts } = useCrmContacts();
  const { opportunities, reload: reloadOpportunities } = useCrmPipeline();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [previewLead, setPreviewLead] = useState<CRMLead | null>(null);
  const [statuses, setStatuses] = useState<CRMLeadStatusCode[]>([]);
  const [source, setSource] = useState<string[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [opportunityFilter, setOpportunityFilter] = useState<OpportunityFilter>("all");
  const [noRecentActivity, setNoRecentActivity] = useState(false);
  const [viewKey, setViewKey] = useState<ViewKey>("all");
  const leadRestoreFocusRef = useRef<HTMLElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts]);
  const opportunityCountByLeadOrContact = useMemo(() => {
    const map = new Map<string, number>();
    opportunities.forEach((opportunity) => {
      if (opportunity.leadId) map.set(opportunity.leadId, (map.get(opportunity.leadId) ?? 0) + 1);
      map.set(`contact:${opportunity.contactId}`, (map.get(`contact:${opportunity.contactId}`) ?? 0) + 1);
    });
    return map;
  }, [opportunities]);
  const sourceOptions = useMemo(
    () => [...new Set(leads.map((lead) => lead.source).filter((value): value is string => Boolean(value)))]
      .sort().map((value) => ({ label: value, value })),
    [leads],
  );
  const ownerOptions = useMemo(
    () => [...new Map(leads.filter((lead) => lead.assignedUserId && lead.ownerName)
      .map((lead) => [lead.assignedUserId!, lead.ownerName!]))]
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, label]) => ({ label, value })),
    [leads],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const contact = contactById.get(lead.contactId);
      const opportunityCount = opportunityCountByLeadOrContact.get(lead.id)
        ?? opportunityCountByLeadOrContact.get(`contact:${lead.contactId}`) ?? 0;
      const values = [contact ? contactName(contact) : "", contact?.email ?? "", lead.interest ?? "", lead.source ?? "", lead.ownerName ?? ""];
      const matchesSearch = !query || values.some((value) => value.toLowerCase().includes(query));
      const matchesOpportunity = opportunityFilter === "all" || (opportunityFilter === "with" ? opportunityCount > 0 : opportunityCount === 0);
      const stale = !lead.lastActivityAt || new Date(lead.lastActivityAt).getTime() < sevenDaysAgo();
      return matchesSearch
        && (!statuses.length || statuses.includes(lead.status))
        && (!source.length || source.includes(lead.source ?? ""))
        && (!owners.length || owners.includes(lead.assignedUserId ?? ""))
        && matchesOpportunity
        && (!noRecentActivity || stale);
    });
  }, [contactById, leads, noRecentActivity, opportunityCountByLeadOrContact, opportunityFilter, owners, search, source, statuses]);
  const allVisibleSelected = filtered.length > 0 && filtered.every((lead) => selectedIds.includes(lead.id));
  const hasFilters = Boolean(search || statuses.length || source.length || owners.length || opportunityFilter !== "all" || noRecentActivity);
  const openLead = (leadId: string, trigger?: HTMLElement) => {
    if (trigger) leadRestoreFocusRef.current = trigger;
    const target = leads.find((l) => l.id === leadId);
    if (target) {
      setPreviewLead(target);
    }
  };

  const selectView = (key: ViewKey) => {
    const view = SAVED_VIEWS.find((item) => item.key === key)!;
    setViewKey(key);
    setStatuses(view.statuses ?? []);
    setOwners(view.owner ? [view.owner] : []);
    setSource([]);
    setOpportunityFilter("all");
    setNoRecentActivity(false);
  };
  const selectAllVisible = (checked: boolean) => {
    setSelectedIds(checked ? filtered.map((lead) => lead.id) : []);
  };
  const toggleSelected = (leadId: string, checked: boolean) => {
    setSelectedIds((current) => checked ? [...new Set([...current, leadId])] : current.filter((id) => id !== leadId));
  };
  const runUpdate = async (
    lead: CRMLead,
    patch: { status?: CRMLeadStatusCode; assignedUserId?: string | null; ownerName?: string | null },
  ) => {
    const result = await updateLead(lead, patch);
    setActionMessage(result.status === "success" ? "Lead updated." : result.message);
  };
  const bulkUpdate = async (patch: { status?: CRMLeadStatusCode; assignedUserId?: string | null; ownerName?: string | null }) => {
    const targets = leads.filter((lead) => selectedIds.includes(lead.id));
    const results = await Promise.all(targets.map((lead) => updateLead(lead, patch)));
    const failed = results.find((result) => result.status !== "success");
    setActionMessage(failed ? failed.message : `${targets.length} lead${targets.length === 1 ? "" : "s"} updated.`);
    if (!failed) setSelectedIds([]);
  };
  const bulkArchive = async () => {
    const targets = leads.filter((lead) => selectedIds.includes(lead.id));
    const result = await bulkArchiveLeads(targets);
    setActionMessage(`${result.successCount} lead${result.successCount === 1 ? "" : "s"} archived.`);
    setSelectedIds([]);
  };

  const [conversionLead, setConversionLead] = useState<CRMLead>();
  const [productKey, setProductKey] = useState("");
  const [opportunityName, setOpportunityName] = useState("");
  const [amount, setAmount] = useState("");
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [conversionDiscardOpen, setConversionDiscardOpen] = useState(false);
  const [newLeadContactId, setNewLeadContactId] = useState("");
  const [newLeadInterest, setNewLeadInterest] = useState("");
  const [newLeadSource, setNewLeadSource] = useState("");
  const [newLeadOwner, setNewLeadOwner] = useState("");
  const conversionRestoreFocusRef = useRef<HTMLElement | null>(null);
  const conversionLifecycle = useFormLifecycle();
  const createLeadLifecycle = useFormLifecycle();
  const submitConversion = async () => {
    if (!conversionLead) return;
    const result = await createOpportunityFromLead(conversionLead.id, {
      organizationId: conversionLead.organizationId || activeOrganization?.id || "local-development-organization",
      productKey,
      name: opportunityName || productKey,
      amount: amount ? Number(amount) : null,
    });
    if (result.status === "success") {
      setProductKey(""); setOpportunityName(""); setAmount(""); conversionLifecycle.markClean();
      reloadOpportunities();
    }
  };
  const closeConversion = useCallback(() => {
    setConversionLead(undefined); conversionLifecycle.markClean(); resetConversion();
  }, [conversionLifecycle, resetConversion]);
  const openConversion = (lead: CRMLead) => {
    resetConversion(); conversionLifecycle.markClean();
    conversionRestoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setConversionLead(lead); setProductKey(lead.interest ?? ""); setOpportunityName(lead.interest ?? "");
  };
  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const owner = ownerOptions.find((option) => option.value === newLeadOwner);
    const result = await createLead({
      contactId: newLeadContactId,
      interest: newLeadInterest,
      source: newLeadSource || null,
      assignedUserId: owner?.value ?? null,
      ownerName: owner?.label ?? null,
    });
    if (result.status === "success") {
      setCreateLeadOpen(false);
      setNewLeadContactId(""); setNewLeadInterest(""); setNewLeadSource(""); setNewLeadOwner("");
      createLeadLifecycle.markClean();
    }
  };

  return (
    <PageContainer width="wide" className="min-w-0">
      <PageHeader
        title="Leads"
        description="Manage commercial intent and qualification across CRM."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Leads" }]}
        actions={<Button onClick={(event) => { leadRestoreFocusRef.current = event.currentTarget; setCreateLeadOpen(true); }}><Plus className="mr-1.5 h-3.5 w-3.5" />New lead</Button>}
      />

      <div className="flex flex-wrap items-center gap-2" aria-label="Lead workspace controls">
        <div className="w-48">
          <Label htmlFor="lead-saved-view" className="sr-only">Saved view</Label>
          <Select value={viewKey} onValueChange={(value) => selectView(value as ViewKey)}>
            <SelectTrigger id="lead-saved-view" className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{SAVED_VIEWS.map((view) => <SelectItem key={view.key} value={view.key}>{view.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search leads..." size="sm" containerClassName="w-64" />
        <FilterDropdown label="Status" multiple value={statuses} onChange={(values) => { setViewKey("all"); setStatuses(values as CRMLeadStatusCode[]); }} options={statusOptions} size="sm" />
        <FilterDropdown label="Source" multiple value={source} onChange={(values) => { setViewKey("all"); setSource(values); }} options={sourceOptions} size="sm" />
        <FilterDropdown label="Owner" multiple value={owners} onChange={(values) => { setViewKey("all"); setOwners(values); }} options={ownerOptions} size="sm" />
        <FilterDropdown
          label="Opportunity"
          value={opportunityFilter}
          onChange={(value) => setOpportunityFilter(value as OpportunityFilter)}
          options={[{ label: "All leads", value: "all" }, { label: "With opportunity", value: "with" }, { label: "Without opportunity", value: "without" }]}
          size="sm"
        />
        <Button
          type="button"
          variant={noRecentActivity ? "secondary" : "outline"}
          size="sm"
          aria-pressed={noRecentActivity}
          onClick={() => setNoRecentActivity((current) => !current)}
        >
          <CalendarClock className="mr-1.5 h-3.5 w-3.5" />No recent activity
        </Button>

        {/* View Switcher: Table vs Kanban */}
        <div className="ms-auto flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              viewMode === "table"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              viewMode === "kanban"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Columns3 className="h-3.5 w-3.5" />
            Kanban
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div role="region" aria-label="Bulk lead actions" className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary-soft/30 px-3 py-2">
          <span className="text-sm font-medium" aria-live="polite">{selectedIds.length} selected</span>
          <Button size="sm" variant="outline" onClick={() => void bulkUpdate({ status: "contacted" })}>Mark contacted</Button>
          <Button size="sm" variant="outline" onClick={() => void bulkUpdate({ assignedUserId: CURRENT_USER_ID, ownerName: CURRENT_USER_NAME })}>Assign to Maya Chen</Button>
          <Button size="sm" variant="outline" onClick={() => void bulkArchive()}>Archive selected</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear selection</Button>
        </div>
      )}
      {actionMessage && <div role="status" className="rounded-md border border-border bg-card-muted px-3 py-2 text-sm">{actionMessage}</div>}

      <div className="min-w-0">
        <DataCard
          flush
          loading={loading}
          error={error ? <><span>{error}</span><Button className="mt-3" size="sm" variant="outline" onClick={reload}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Try again</Button></> : undefined}
          empty={!loading && !error && filtered.length === 0}
          emptyIcon={hasFilters ? SearchX : AlertTriangle}
          emptyTitle={hasFilters ? "No leads found" : "No leads yet"}
          emptyDescription={hasFilters ? "Try changing the search or filters." : "Leads will appear here when they are added to your workspace."}
        >
          {!loading && !error && filtered.length ? (
            viewMode === "kanban" ? (
              <div className="p-3">
                <LeadKanbanBoard
                  leads={filtered}
                  contacts={contacts}
                  onSelectLead={(lead) => setPreviewLead(lead)}
                  onUpdateStatus={(lead, status) => void runUpdate(lead, { status })}
                  onCreateLead={() => setCreateLeadOpen(true)}
                />
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"><Checkbox checked={allVisibleSelected ? true : selectedIds.length > 0 ? "indeterminate" : false} onCheckedChange={(checked) => selectAllVisible(checked === true)} aria-label="Select all visible leads" /></TableHead>
                        <TableHead>Contact</TableHead><TableHead>Status</TableHead><TableHead>Source</TableHead>
                        <TableHead>Interest / Product</TableHead><TableHead>Owner</TableHead><TableHead>Score</TableHead>
                        <TableHead>Last activity</TableHead><TableHead>Next activity</TableHead><TableHead>Opportunity</TableHead><TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{filtered.map((lead) => (
                      <LeadTableRow
                        key={lead.id}
                        lead={lead}
                        contact={contactById.get(lead.contactId)}
                        opportunityCount={opportunityCountByLeadOrContact.get(lead.id) ?? opportunityCountByLeadOrContact.get(`contact:${lead.contactId}`) ?? 0}
                        selected={previewLead?.id === lead.id}
                        checked={selectedIds.includes(lead.id)}
                        onSelect={(checked) => toggleSelected(lead.id, checked)}
                        onOpen={(trigger) => openLead(lead.id, trigger)}
                        onStatus={(status) => void runUpdate(lead, { status })}
                        onAssign={() => void runUpdate(lead, { assignedUserId: CURRENT_USER_ID, ownerName: CURRENT_USER_NAME })}
                        onConvert={() => openConversion(lead)}
                      />
                    ))}</TableBody>
                  </Table>
                </div>
                <div className="space-y-3 p-3 lg:hidden">
                  <div className="flex items-center gap-2 border-b border-border px-1 pb-2 text-sm">
                    <Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => selectAllVisible(checked === true)} aria-label="Select all visible leads" />
                    <span className="text-muted-foreground">Select all visible ({filtered.length})</span>
                  </div>
                  {filtered.map((lead) => (
                    <LeadMobileCard
                      key={lead.id}
                      lead={lead}
                      contact={contactById.get(lead.contactId)}
                      opportunityCount={opportunityCountByLeadOrContact.get(lead.id) ?? opportunityCountByLeadOrContact.get(`contact:${lead.contactId}`) ?? 0}
                      selected={previewLead?.id === lead.id}
                      checked={selectedIds.includes(lead.id)}
                      onSelect={(checked) => toggleSelected(lead.id, checked)}
                      onOpen={(trigger) => openLead(lead.id, trigger)}
                      onStatus={(status) => void runUpdate(lead, { status })}
                      onAssign={() => void runUpdate(lead, { assignedUserId: CURRENT_USER_ID, ownerName: CURRENT_USER_NAME })}
                      onConvert={() => openConversion(lead)}
                    />
                  ))}
                </div>
              </>
            )
          ) : null}
        </DataCard>
      </div>

      {/* Quick Preview Slide-over Drawer */}
      <LeadQuickPreviewDrawer
        open={Boolean(previewLead)}
        lead={previewLead}
        contact={previewLead ? contactById.get(previewLead.contactId) ?? null : null}
        onClose={() => setPreviewLead(null)}
        onUpdateStatus={(lead, status) => {
          void runUpdate(lead, { status });
          setPreviewLead((curr) => curr ? { ...curr, status } : null);
        }}
        onConvert={(lead) => {
          openConversion(lead);
        }}
        onArchive={(lead) => void archiveLead(lead)}
      />
      <AppDrawer
        open={Boolean(conversionLead)}
        onOpenChange={(open) => { if (!open) closeConversion(); }}
        title="Create opportunity"
        eyebrow="CRM / Lead conversion"
        mode="New"
        headerMeta={<span>Opportunity form</span>}
        description="Create a qualified-stage opportunity for this lead. The contact relationship is preserved."
        restoreFocusRef={conversionRestoreFocusRef}
        dirty={() => conversionLifecycle.dirtyRef.current}
        showDirtyState={conversionLifecycle.dirty}
        confirmOnClose
        confirmTitle="Discard opportunity details?"
        confirmDescription="Your conversion details will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onDiscard={closeConversion}
        size="md"
        layoutMode="standard"
        responsive="auto"
        footer={conversion.status === "success" ? (
          <Button type="button" onClick={closeConversion}>Close</Button>
        ) : (
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { if (conversionLifecycle.dirtyRef.current) setConversionDiscardOpen(true); else closeConversion(); }}>Cancel</Button>
            <Button type="submit" form="lead-conversion-form" disabled={!productKey.trim() || conversion.status === "pending"}>
              {conversion.status === "pending" ? "Creating…" : "Create opportunity"}
            </Button>
          </div>
        )}
      >
          <form id="lead-conversion-form" className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submitConversion(); }}><section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs"><FormSectionHeader eyebrow="Conversion" title="Opportunity details" description="Define the commercial opportunity created from this qualified lead." mode="expanded" responsive="auto" meta={<span>Core details</span>} /><div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="lead-product-key">Product or interest key</Label><Input id="lead-product-key" value={productKey} onChange={(event) => { conversionLifecycle.markDirty(); setProductKey(event.target.value); }} placeholder="e.g. enterprise-plan" /></div>
            <div className="space-y-1.5"><Label htmlFor="lead-opportunity-name">Opportunity name</Label><Input id="lead-opportunity-name" value={opportunityName} onChange={(event) => { conversionLifecycle.markDirty(); setOpportunityName(event.target.value); }} placeholder="Optional display name" /></div>
            <div className="space-y-1.5"><Label htmlFor="lead-opportunity-amount">Amount</Label><Input id="lead-opportunity-amount" type="number" min="0" value={amount} onChange={(event) => { conversionLifecycle.markDirty(); setAmount(event.target.value); }} placeholder="Optional" /></div>
            {conversion.status !== "idle" && conversion.status !== "pending" && conversion.status !== "success" ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{conversion.message}</p> : null}
            {conversion.status === "success" ? <p role="status" className="text-sm text-success">Opportunity created.</p> : null}
          </div></section></form>
      </AppDrawer>
      <ConfirmDialog
        open={conversionDiscardOpen}
        onOpenChange={setConversionDiscardOpen}
        title="Discard opportunity details?"
        description="Your conversion details will be lost."
        confirmLabel="Discard"
        tone="warning"
        onConfirm={() => {
          setConversionDiscardOpen(false);
          closeConversion();
        }}
      />
      <AppDrawer
        open={createLeadOpen}
        onOpenChange={setCreateLeadOpen}
        title="Create lead"
        eyebrow="CRM / Leads"
        mode="New"
        headerMeta={<span>Lead form</span>}
        description="Capture commercial intent locally and assign it to an existing contact."
        restoreFocusRef={leadRestoreFocusRef}
        dirty={() => createLeadLifecycle.dirtyRef.current}
        showDirtyState={createLeadLifecycle.dirty}
        confirmOnClose
        confirmTitle="Discard lead changes?"
        confirmDescription="Your unsaved lead changes will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onDiscard={() => {
          setNewLeadContactId(""); setNewLeadInterest(""); setNewLeadSource(""); setNewLeadOwner("");
          createLeadLifecycle.markClean();
        }}
        size="md"
        layoutMode="standard"
        responsive="auto"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateLeadOpen(false)}>Cancel</Button>
            <Button type="submit" form="create-lead-form" disabled={!newLeadContactId || !newLeadInterest.trim() || creation.status === "pending"}>
              {creation.status === "pending" ? "Creating…" : "Create lead"}
            </Button>
          </div>
        }
      >
          <form id="create-lead-form" className="space-y-4" onSubmit={(event) => void submitLead(event)}><section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs"><FormSectionHeader eyebrow="Profile" title="Lead details" description="Capture commercial intent and connect it to an existing contact." mode="expanded" responsive="auto" meta={<span>Core details</span>} /><div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="new-lead-contact">Contact</Label><CRMRecordPicker items={contacts.map((contact): CRMRecordPickerItem => ({ type: "contact", id: contact.id, label: contactName(contact) }))} value={newLeadContactId ? `contact:${newLeadContactId}` : ""} onValueChange={(value) => { createLeadLifecycle.markDirty(); setNewLeadContactId(value.replace(/^contact:/, "")); }} placeholder="Search contacts..." ariaLabel="Search contact" /></div>
            <div className="space-y-1.5"><Label htmlFor="new-lead-interest">Interest</Label><Input id="new-lead-interest" required value={newLeadInterest} onChange={(event) => { createLeadLifecycle.markDirty(); setNewLeadInterest(event.target.value); }} placeholder="e.g. Enterprise expansion" /></div>
            <div className="space-y-1.5"><Label htmlFor="new-lead-source">Source / attribution</Label><Input id="new-lead-source" value={newLeadSource} onChange={(event) => { createLeadLifecycle.markDirty(); setNewLeadSource(event.target.value); }} placeholder="Website, referral, event…" /></div>
            <div className="space-y-1.5"><Label htmlFor="new-lead-owner">Owner</Label><Select value={newLeadOwner || "unassigned"} onValueChange={(value) => { createLeadLifecycle.markDirty(); setNewLeadOwner(value === "unassigned" ? "" : value); }}><SelectTrigger id="new-lead-owner"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{ownerOptions.map((owner) => <SelectItem key={owner.value} value={owner.value}>{owner.label}</SelectItem>)}</SelectContent></Select></div>
            {"message" in creation && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{creation.message}</p>}
          </div></section></form>
      </AppDrawer>
    </PageContainer>
  );
}

function LeadTableRow({ lead, contact, opportunityCount, selected, checked, onSelect, onOpen, onStatus, onAssign, onConvert }: LeadActionProps) {
  const name = contact ? contactName(contact) : "Unknown contact";
  const score = lead.score ?? 50;
  const isHot = score >= 75;
  const isWarm = score >= 50 && score < 75;

  return (
    <TableRow
      className={`cursor-pointer ${selected ? "bg-primary/5" : ""}`}
      tabIndex={0}
      aria-label={`Open lead for ${name}`}
      onClick={(event) => onOpen(event.currentTarget)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(event.currentTarget);
        }
      }}
    >
      <TableCell onClick={(event) => event.stopPropagation()}><Checkbox checked={checked} onCheckedChange={(value) => onSelect(value === true)} onKeyDown={(event) => event.stopPropagation()} aria-label={`Select ${name}`} /></TableCell>
      <TableCell><div className="font-medium">{name}</div><div className="text-xs text-muted-foreground">{contact?.email || "—"}</div></TableCell>
      <TableCell><StatusBadge tone={STATUS_TONES[lead.status]}>{STATUS_LABELS[lead.status]}</StatusBadge></TableCell>
      <TableCell className="text-sm text-muted-foreground">{lead.source || "—"}</TableCell>
      <TableCell className="text-sm">{lead.interest || "—"}</TableCell>
      <TableCell className="text-sm">{lead.ownerName || "Unassigned"}</TableCell>
      <TableCell className="text-sm font-medium">
        <div className="flex items-center gap-1.5">
          {isHot ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-xs font-bold text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300">
              <Flame className="h-3 w-3" />
              {score}
            </span>
          ) : isWarm ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-xs font-semibold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300">
              <Zap className="h-3 w-3" />
              {score}
            </span>
          ) : (
            <span className="text-muted-foreground">{lead.score ?? "—"}</span>
          )}
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{lead.lastActivityAt ? formatDate(lead.lastActivityAt) : <span className="text-warning">None</span>}</TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{lead.nextActivityAt ? formatDate(lead.nextActivityAt) : "—"}</TableCell>
      <TableCell>{opportunityCount ? <StatusBadge tone="success">{opportunityCount} linked</StatusBadge> : lead.duplicateReviewId ? <StatusBadge tone="warning">Duplicate review</StatusBadge> : <span className="text-sm text-muted-foreground">—</span>}</TableCell>
      <TableCell onClick={(event) => event.stopPropagation()}><LeadActions lead={lead} onStatus={onStatus} onAssign={onAssign} onConvert={onConvert} /></TableCell>
    </TableRow>
  );
}

function LeadMobileCard({ lead, contact, opportunityCount, selected, checked, onSelect, onOpen, onStatus, onAssign, onConvert }: LeadActionProps) {
  const name = contact ? contactName(contact) : "Unknown contact";
  const score = lead.score ?? 50;
  const isHot = score >= 75;
  const isWarm = score >= 50 && score < 75;

  return (
    <article
      className={`surface-card-interactive p-4 ${selected ? "ring-1 ring-primary" : ""}`}
      tabIndex={0}
      aria-label={`Open lead for ${name}`}
      onClick={(event) => onOpen(event.currentTarget)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(event.currentTarget);
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Checkbox checked={checked} onCheckedChange={(value) => onSelect(value === true)} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} aria-label={`Select ${name}`} />
          <div className="min-w-0"><p className="truncate font-medium">{name}</p><p className="truncate text-xs text-muted-foreground">{contact?.email || "No email"}</p></div>
        </div>
        <LeadActions lead={lead} onStatus={onStatus} onAssign={onAssign} onConvert={onConvert} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge tone={STATUS_TONES[lead.status]}>{STATUS_LABELS[lead.status]}</StatusBadge>
        {isHot ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-xs font-bold text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300">
            <Flame className="h-3 w-3" />
            Hot ({score})
          </span>
        ) : isWarm ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-xs font-semibold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300">
            <Zap className="h-3 w-3" />
            Warm ({score})
          </span>
        ) : null}
        <span className="rounded-full bg-card-muted px-2 py-1 text-[11px] text-muted-foreground">{lead.source || "Unknown source"}</span>
        {opportunityCount > 0 && <StatusBadge tone="success">{opportunityCount} opportunity</StatusBadge>}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
        <div><dt className="text-muted-foreground">Interest</dt><dd className="truncate font-medium">{lead.interest || "—"}</dd></div>
        <div><dt className="text-muted-foreground">Owner</dt><dd className="truncate font-medium">{lead.ownerName || "Unassigned"}</dd></div>
        <div><dt className="text-muted-foreground">Score</dt><dd className="font-medium">{lead.score ?? "—"}</dd></div>
        <div><dt className="text-muted-foreground">Next activity</dt><dd className="font-medium">{lead.nextActivityAt ? formatDate(lead.nextActivityAt) : "—"}</dd></div>
      </dl>
    </article>
  );
}

interface LeadActionProps {
  lead: CRMLead;
  contact?: ReturnType<typeof useCrmContacts>["contacts"][number];
  opportunityCount: number;
  selected: boolean;
  checked: boolean;
  onSelect: (checked: boolean) => void;
  onOpen: (trigger: HTMLElement) => void;
  onStatus: (status: CRMLeadStatusCode) => void;
  onAssign: () => void;
  onConvert: () => void;
}

function LeadActions({ lead, onStatus, onAssign, onConvert }: Pick<LeadActionProps, "lead" | "onStatus" | "onAssign" | "onConvert">) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Actions for ${lead.interest || "lead"}`} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Lead actions</DropdownMenuLabel><DropdownMenuSeparator />
        <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onStatus("contacted"); }} disabled={lead.status === "contacted"}>Mark contacted</DropdownMenuItem>
        <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onAssign(); }}><UserRound className="mr-2 h-3.5 w-3.5" />Assign to Maya Chen</DropdownMenuItem>
        <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onConvert(); }}><Plus className="mr-2 h-3.5 w-3.5" />Create opportunity</DropdownMenuItem>
        <DropdownMenuItem disabled title="Task and note commands are not available in the current adapter.">Add task or note (unavailable)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
