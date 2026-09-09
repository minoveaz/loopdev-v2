import { useMemo, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useCrmContacts, useCrmCustomer360, useCrmLeads } from "@/loopdev/domains/crm/hooks/use-crm";
import { contactName } from "@/loopdev/domains/crm/adapter";
import { formatDate } from "@/lib/formatters";

const statusOptions = ["new", "contacted", "qualified", "stalled", "inactive", "converted"].map((value) => ({ label: value, value }));

export default function SalesCRMLeads() {
  const { trail } = useBreadcrumbs();
  const { leads, loading } = useCrmLeads();
  const { contacts } = useCrmContacts();
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>();
  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts]);
  const filtered = useMemo(() => leads.filter((lead) => {
    const contact = contactById.get(lead.contactId);
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [contact && contactName(contact), lead.interest, lead.source].filter(Boolean).some((value) => value!.toLowerCase().includes(query));
    return matchesSearch && (!statuses.length || statuses.includes(lead.status));
  }), [contactById, leads, search, statuses]);
  const selectedLead = filtered.find((lead) => lead.id === selectedLeadId) ?? filtered[0];
  const selectedContact = selectedLead ? contactById.get(selectedLead.contactId) : undefined;
  const { view: selectedView } = useCrmCustomer360(selectedContact?.id);

  return (
    <PageContainer width="wide" className="min-w-0">
      <PageHeader
        title="Leads"
        description="Manage commercial intent and qualification across CRM."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Leads" }]}
        actions={<Button><Plus className="mr-1.5 h-3.5 w-3.5" />New lead</Button>}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search leads..." size="sm" containerClassName="w-64" />
        <FilterDropdown label="Status" multiple value={statuses} onChange={setStatuses} options={statusOptions} size="sm" />
      </div>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <DataCard flush>
          {loading ? <div className="p-8 text-center text-sm text-muted-foreground">Loading leads...</div> : filtered.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Contact</TableHead><TableHead>Status</TableHead><TableHead>Source</TableHead><TableHead>Interest</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
              <TableBody>{filtered.map((lead) => {
                const contact = contactById.get(lead.contactId);
                const selected = lead.id === selectedLead?.id;
                return <TableRow key={lead.id} className={`cursor-pointer ${selected ? "bg-primary/5" : ""}`} onClick={() => setSelectedLeadId(lead.id)}>
                  <TableCell><div className="font-medium">{contact ? contactName(contact) : "Unknown contact"}</div><div className="text-xs text-muted-foreground">{contact?.email || "—"}</div></TableCell>
                  <TableCell><StatusBadge tone={lead.status === "qualified" ? "success" : "info"}>{lead.status}</StatusBadge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.source || "—"}</TableCell>
                  <TableCell className="text-sm">{lead.interest || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(lead.createdAt)}</TableCell>
                </TableRow>;
              })}</TableBody>
            </Table>
          ) : <EmptyState title="No leads found" description="Try changing the search or filters." />}
        </DataCard>
        <LeadPreview lead={selectedLead} contact={selectedContact} view={selectedView} />
      </div>
    </PageContainer>
  );
}

function LeadPreview({ lead, contact, view }: { lead: ReturnType<typeof useCrmLeads>["leads"][number] | undefined; contact: ReturnType<typeof useCrmContacts>["contacts"][number] | undefined; view: ReturnType<typeof useCrmCustomer360>["view"] }) {
  if (!lead || !contact) return <DataCard title="Lead preview" description="Select a lead to inspect it."><EmptyState title="No lead selected" description="Choose a row from the table." /></DataCard>;
  return <DataCard title="Lead preview" description="Contextual lead details">
    <div className="space-y-5">
      <div><p className="text-lg font-semibold">{contactName(contact)}</p><p className="text-sm text-muted-foreground">{contact.email || "No email"} · {contact.phone || "No phone"}</p><div className="mt-2 flex gap-2"><StatusBadge tone="success">{lead.status}</StatusBadge><StatusBadge tone="neutral">{lead.source || "Unknown source"}</StatusBadge></div></div>
      <dl className="grid gap-3 sm:grid-cols-2"><PreviewField label="Interest" value={lead.interest} /><PreviewField label="Created" value={formatDate(lead.createdAt)} /><PreviewField label="Opportunities" value={String(view?.opportunities.length ?? "—")} /><PreviewField label="Open tasks" value={String(view?.tasks.filter((task) => task.status !== "completed").length ?? "—")} /></dl>
      <div className="space-y-2 border-t border-border pt-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent activity</p>{view?.timeline.slice(0, 3).map((item) => <p key={item.id} className="text-sm">{item.summary}</p>)}</div>
      <Button className="w-full" asChild><Link to={`/app/sales-crm/contacts/${contact.id}`}>Open Customer 360 <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
    </div>
  </DataCard>;
}

function PreviewField({ label, value }: { label: string; value: string | null }) {
  return <div className="rounded-md border border-border bg-card-muted/30 p-3"><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="mt-0.5 text-sm">{value || "—"}</dd></div>;
}
