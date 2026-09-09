import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowRight, CalendarClock, Mail,
  MoreHorizontal, Phone, Plus, RefreshCw, SearchX, UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  ConfirmDialog, DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader,
  SearchInput, StatusBadge,
} from "@/components/common";
import { AppDrawer } from "@/components/platform";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import {
  CRM_LEAD_STATUS_CODES, contactName, type CRMLead, type CRMLeadStatusCode,
} from "@/loopdev/domains/crm/adapter";
import { useCrmContacts, useCrmCustomer360, useCrmLeads, useCrmPipeline } from "@/loopdev/domains/crm/hooks/use-crm";
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
  const { trail } = useBreadcrumbs();
  const {
    leads, loading, error, reload, conversion, createOpportunityFromLead, updateLead, resetConversion,
  } = useCrmLeads();
  const { contacts } = useCrmContacts();
  const { opportunities, reload: reloadOpportunities } = useCrmPipeline();
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<CRMLeadStatusCode[]>([]);
  const [source, setSource] = useState<string[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [opportunityFilter, setOpportunityFilter] = useState<OpportunityFilter>("all");
  const [noRecentActivity, setNoRecentActivity] = useState(false);
  const [viewKey, setViewKey] = useState<ViewKey>("all");
  const [selectedLeadId, setSelectedLeadId] = useState<string>();
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
  const selectedLead = filtered.find((lead) => lead.id === selectedLeadId);
  const selectedContact = selectedLead ? contactById.get(selectedLead.contactId) : undefined;
  const { view: selectedView, loading: previewLoading, error: previewError, reload: reloadCustomer360 } = useCrmCustomer360(selectedContact?.id);
  const allVisibleSelected = filtered.length > 0 && filtered.every((lead) => selectedIds.includes(lead.id));
  const hasFilters = Boolean(search || statuses.length || source.length || owners.length || opportunityFilter !== "all" || noRecentActivity);
  const openLead = (leadId: string, trigger: HTMLElement) => {
    leadRestoreFocusRef.current = trigger;
    setSelectedLeadId(leadId);
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

  const [conversionLead, setConversionLead] = useState<CRMLead>();
  const [productKey, setProductKey] = useState("");
  const [opportunityName, setOpportunityName] = useState("");
  const [amount, setAmount] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);
  const conversionRestoreFocusRef = useRef<HTMLElement | null>(null);
  const conversionDirtyRef = useRef(false);
  const submitConversion = async () => {
    if (!conversionLead) return;
    const result = await createOpportunityFromLead(conversionLead.id, {
      organizationId: "local-development-organization",
      productKey,
      name: opportunityName || productKey,
      amount: amount ? Number(amount) : null,
    });
    if (result.status === "success") {
      setProductKey(""); setOpportunityName(""); setAmount(""); conversionDirtyRef.current = false;
      reloadCustomer360();
      reloadOpportunities();
    }
  };
  const closeConversion = useCallback(() => {
    setConversionLead(undefined); setDiscardOpen(false); conversionDirtyRef.current = false; resetConversion();
  }, [resetConversion]);
  const requestCloseConversion = useCallback(() => {
    if (conversionDirtyRef.current && conversion.status !== "success") { setDiscardOpen(true); return; }
    closeConversion();
  }, [closeConversion, conversion.status]);
  const handleConversionCloseAutoFocus = useCallback((event: Event) => {
    const target = conversionRestoreFocusRef.current;
    if (!target?.isConnected) return;
    event.preventDefault();
    window.requestAnimationFrame(() => target.focus());
  }, []);
  const openConversion = (lead: CRMLead) => {
    resetConversion(); conversionDirtyRef.current = false;
    conversionRestoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setConversionLead(lead); setProductKey(lead.interest ?? ""); setOpportunityName(lead.interest ?? "");
  };

  return (
    <PageContainer width="wide" className="min-w-0">
      <PageHeader
        title="Leads"
        description="Manage commercial intent and qualification across CRM."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Leads" }]}
        actions={<Button><Plus className="mr-1.5 h-3.5 w-3.5" />New lead</Button>}
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
      </div>

      {selectedIds.length > 0 && (
        <div role="region" aria-label="Bulk lead actions" className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary-soft/30 px-3 py-2">
          <span className="text-sm font-medium" aria-live="polite">{selectedIds.length} selected</span>
          <Button size="sm" variant="outline" onClick={() => void bulkUpdate({ status: "contacted" })}>Mark contacted</Button>
          <Button size="sm" variant="outline" onClick={() => void bulkUpdate({ assignedUserId: CURRENT_USER_ID, ownerName: CURRENT_USER_NAME })}>Assign to Maya Chen</Button>
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
                      selected={lead.id === selectedLead?.id}
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
                    selected={lead.id === selectedLead?.id}
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
          ) : null}
        </DataCard>
      </div>
      <AppDrawer
        open={Boolean(selectedLead && selectedContact)}
        onOpenChange={(open) => { if (!open) setSelectedLeadId(undefined); }}
        title={selectedContact ? `${contactName(selectedContact)} · Lead` : "Lead preview"}
        description="Contact, commercial and activity context"
        restoreFocusRef={leadRestoreFocusRef}
        size="lg"
      >
        {selectedLead && selectedContact ? (
          <LeadPreview
            lead={selectedLead}
            contact={selectedContact}
            view={selectedView}
            loading={previewLoading}
            error={previewError}
            opportunityCount={opportunityCountByLeadOrContact.get(selectedLead.id) ?? opportunityCountByLeadOrContact.get(`contact:${selectedLead.contactId}`) ?? 0}
            onRetry={reloadCustomer360}
            onStatus={(status) => void runUpdate(selectedLead, { status })}
            onAssign={() => void runUpdate(selectedLead, { assignedUserId: CURRENT_USER_ID, ownerName: CURRENT_USER_NAME })}
            onConvert={openConversion}
          />
        ) : null}
      </AppDrawer>

      <Dialog open={Boolean(conversionLead)} onOpenChange={(open) => { if (!open) requestCloseConversion(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" onCloseAutoFocus={handleConversionCloseAutoFocus}>
          <DialogHeader><DialogTitle>Create opportunity</DialogTitle><DialogDescription>Create a qualified-stage opportunity for this lead. The contact relationship is preserved.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submitConversion(); }}>
            <div className="space-y-1.5"><Label htmlFor="lead-product-key">Product or interest key</Label><Input id="lead-product-key" value={productKey} onChange={(event) => { conversionDirtyRef.current = true; setProductKey(event.target.value); }} placeholder="e.g. enterprise-plan" /></div>
            <div className="space-y-1.5"><Label htmlFor="lead-opportunity-name">Opportunity name</Label><Input id="lead-opportunity-name" value={opportunityName} onChange={(event) => { conversionDirtyRef.current = true; setOpportunityName(event.target.value); }} placeholder="Optional display name" /></div>
            <div className="space-y-1.5"><Label htmlFor="lead-opportunity-amount">Amount</Label><Input id="lead-opportunity-amount" type="number" min="0" value={amount} onChange={(event) => { conversionDirtyRef.current = true; setAmount(event.target.value); }} placeholder="Optional" /></div>
            {conversion.status !== "idle" && conversion.status !== "pending" && conversion.status !== "success" ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{conversion.message}</p> : null}
            {conversion.status === "success" ? <p role="status" className="text-sm text-success">Opportunity created.</p> : null}
            <DialogFooter>{conversion.status === "success" ? <Button type="button" onClick={closeConversion}>Close</Button> : <><Button type="button" variant="outline" onClick={requestCloseConversion}>Cancel</Button><Button type="submit" disabled={!productKey.trim() || conversion.status === "pending"}>{conversion.status === "pending" ? "Creating…" : "Create opportunity"}</Button></>}</DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen} title="Discard opportunity details?" description="Your conversion details will be lost." confirmLabel="Discard" tone="warning" onConfirm={closeConversion} />
    </PageContainer>
  );
}

function LeadTableRow({ lead, contact, opportunityCount, selected, checked, onSelect, onOpen, onStatus, onAssign, onConvert }: LeadActionProps) {
  const name = contact ? contactName(contact) : "Unknown contact";
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
      <TableCell className="text-sm font-medium">{lead.score ?? "—"}</TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{lead.lastActivityAt ? formatDate(lead.lastActivityAt) : <span className="text-warning">None</span>}</TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{lead.nextActivityAt ? formatDate(lead.nextActivityAt) : "—"}</TableCell>
      <TableCell>{opportunityCount ? <StatusBadge tone="success">{opportunityCount} linked</StatusBadge> : lead.duplicateReviewId ? <StatusBadge tone="warning">Duplicate review</StatusBadge> : <span className="text-sm text-muted-foreground">—</span>}</TableCell>
      <TableCell onClick={(event) => event.stopPropagation()}><LeadActions lead={lead} onStatus={onStatus} onAssign={onAssign} onConvert={onConvert} /></TableCell>
    </TableRow>
  );
}

function LeadMobileCard({ lead, contact, opportunityCount, selected, checked, onSelect, onOpen, onStatus, onAssign, onConvert }: LeadActionProps) {
  const name = contact ? contactName(contact) : "Unknown contact";
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
      <div className="mt-3 flex flex-wrap items-center gap-2"><StatusBadge tone={STATUS_TONES[lead.status]}>{STATUS_LABELS[lead.status]}</StatusBadge><span className="rounded-full bg-card-muted px-2 py-1 text-[11px] text-muted-foreground">{lead.source || "Unknown source"}</span>{opportunityCount > 0 && <StatusBadge tone="success">{opportunityCount} opportunity</StatusBadge>}</div>
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
        {lead.status === "qualified" && <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onConvert(); }}><Plus className="mr-2 h-3.5 w-3.5" />Create opportunity</DropdownMenuItem>}
        <DropdownMenuItem disabled title="Task and note commands are not available in the current adapter.">Add task or note (unavailable)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LeadPreview({ lead, contact, view, loading, error, opportunityCount, onRetry, onStatus, onAssign, onConvert }: {
  lead?: CRMLead;
  contact?: ReturnType<typeof useCrmContacts>["contacts"][number];
  view: ReturnType<typeof useCrmCustomer360>["view"];
  loading: boolean;
  error: string | null;
  opportunityCount: number;
  onRetry: () => void;
  onStatus: (status: CRMLeadStatusCode) => void;
  onAssign: () => void;
  onConvert: (lead: CRMLead) => void;
}) {
  if (!lead || !contact) return <DataCard title="Lead preview" description="Select a lead to inspect it."><EmptyState title="No lead selected" description="Choose a row from the table." /></DataCard>;
  return (
    <DataCard title="Lead preview" description="Contact, commercial and activity context" action={<LeadActions lead={lead} onStatus={onStatus} onAssign={onAssign} onConvert={() => onConvert(lead)} />}>
      <div className="space-y-5">
        <header className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">{getInitials(contactName(contact))}</div>
          <div className="min-w-0"><h2 className="truncate text-lg font-semibold">{contactName(contact)}</h2><p className="truncate text-sm text-muted-foreground">{contact.companyName || "No company"} · {contact.jobTitle || "No title"}</p><div className="mt-2 flex flex-wrap gap-2"><StatusBadge tone={STATUS_TONES[lead.status]}>{STATUS_LABELS[lead.status]}</StatusBadge><StatusBadge tone="neutral">{lead.source || "Unknown source"}</StatusBadge></div></div>
        </header>
        <div className="grid gap-2 text-sm"><p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{contact.email || "No email"}</p><p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{contact.phone || "No phone"}</p></div>
        <dl className="grid gap-3 sm:grid-cols-2"><PreviewField label="Interest / product" value={lead.interest} /><PreviewField label="Owner" value={lead.ownerName || "Unassigned"} /><PreviewField label="Score" value={lead.score === null || lead.score === undefined ? null : String(lead.score)} /><PreviewField label="Created" value={formatDate(lead.createdAt)} /><PreviewField label="Opportunities" value={String(opportunityCount)} /><PreviewField label="Next activity" value={lead.nextActivityAt ? formatDate(lead.nextActivityAt) : null} /></dl>
        <DataCard title="Activity" description="Recent customer timeline" flush borderless loading={loading} error={error ? <><span>{error}</span><Button className="mt-2" size="sm" variant="outline" onClick={onRetry}>Try again</Button></> : undefined} empty={!loading && !error && !view?.timeline.length} emptyTitle="No activity yet" emptyDescription="Activity will appear here when captured.">
          <div className="space-y-3">{view?.timeline.slice(0, 5).map((item) => <div key={item.id} className="border-l-2 border-primary/30 pl-3"><p className="text-sm">{item.summary}</p><p className="text-xs text-muted-foreground">{formatDate(item.occurredAt)}</p></div>)}</div>
        </DataCard>
        {view?.opportunities.length ? <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related opportunities</p><div className="space-y-2">{view.opportunities.map((opportunity) => <div key={opportunity.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm"><span className="truncate">{opportunity.name}</span><StatusBadge tone="info">{opportunity.stageKey}</StatusBadge></div>)}</div></div> : <p className="text-sm text-muted-foreground">No related opportunities.</p>}
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => onStatus("contacted")} disabled={lead.status === "contacted"}>Mark contacted</Button>{lead.status === "qualified" && <Button onClick={() => onConvert(lead)}><Plus className="mr-1.5 h-3.5 w-3.5" />Create opportunity</Button>}</div>
        <Button className="w-full" asChild><Link to={`/app/sales-crm/contacts/${contact.id}`}>Open Customer 360 <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
      </div>
    </DataCard>
  );
}

function PreviewField({ label, value }: { label: string; value: string | null }) {
  return <div className="rounded-md border border-border bg-card-muted/30 p-3"><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="mt-0.5 text-sm">{value || "—"}</dd></div>;
}
