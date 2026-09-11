import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Filter, ListFilter } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ActivityFeed, getActivityActionLabel, getActivityKind, type ActivityFeedItem, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput } from "@/components/common";
import { AppDrawer } from "@/components/platform";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { contactName, type CRMActivity } from "@/loopdev/domains/crm/adapter";
import { useCrmCustomer360 } from "@/loopdev/domains/crm/hooks/use-crm";
import { formatDate, formatDateTime, formatRelative } from "@/lib/formatters";

const TYPE_TONE: Record<string, "success" | "info" | "warning" | "neutral"> = {
  created: "success", updated: "info", completed: "success", note: "neutral", task: "warning",
  communication: "info", email: "info", call: "success", meeting: "warning", opportunity: "success", status_change: "neutral",
};
const RANGE_OPTIONS = [{ value: "all", label: "All time" }, { value: "today", label: "Today" }, { value: "7", label: "Last 7 days" }, { value: "30", label: "Last 30 days" }];

function crmActivityTarget(item: CRMActivity): string | undefined {
  if (item.sourceType === "communication") return `/app/sales-crm/communications/${item.sourceId}`;
  if (item.sourceType === "task") return `/app/sales-crm/tasks?taskId=${item.sourceId}`;
  if (item.sourceType === "opportunity") return `/app/sales-crm/opportunities?opportunityId=${item.sourceId}`;
  return undefined;
}

function rangeStart(range: string): number | null {
  if (range === "today") return new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  if (range === "7" || range === "30") return Date.now() - Number(range) * 86400000;
  return null;
}

function dayLabel(value: string): string {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(Date.now() - 86400000);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return formatDate(value);
}

export default function SalesCRMContactActivity() {
  const { contactId } = useParams<{ contactId: string }>();
  const { trail } = useBreadcrumbs();
  const { view, loading, error, reload } = useCrmCustomer360(contactId);
  const [search, setSearch] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [actors, setActors] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [range, setRange] = useState("all");
  const [selected, setSelected] = useState<CRMActivity | null>(null);

  const options = useMemo(() => {
    const timeline = view?.timeline ?? [];
    const values = (key: keyof CRMActivity) => Array.from(new Set(timeline.map((item) => String(item[key] ?? "")).filter(Boolean))).map((value) => ({ value, label: value.replace(/_/g, " ") }));
    return { types: values("type"), sources: values("source"), channels: values("channel"), actors: values("actor"), statuses: values("status") };
  }, [view]);

  const filtered = useMemo(() => {
    const start = rangeStart(range);
    const query = search.trim().toLowerCase();
    return [...(view?.timeline ?? [])]
      .filter((item) => !query || `${item.summary} ${item.type} ${item.source} ${item.channel} ${item.actor}`.toLowerCase().includes(query))
      .filter((item) => !types.length || types.includes(item.type))
      .filter((item) => !sources.length || sources.includes(item.source ?? ""))
      .filter((item) => !channels.length || channels.includes(item.channel ?? ""))
      .filter((item) => !actors.length || actors.includes(item.actor ?? ""))
      .filter((item) => !statuses.length || statuses.includes(item.status ?? ""))
      .filter((item) => !start || new Date(item.occurredAt).getTime() >= start)
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
  }, [actors, channels, range, search, sources, statuses, types, view]);

  const feedItems: ActivityFeedItem[] = filtered.map((item) => ({
    id: `${item.sourceType}:${item.sourceId}`,
    kind: getActivityKind(item.type),
    actorLabel: item.actor ?? item.sourceType,
    actorInitials: (item.actor ?? item.sourceType).slice(0, 2).toUpperCase(),
    action: item.type,
    actionTone: TYPE_TONE[item.type] ?? "neutral",
    actionLabel: getActivityActionLabel(item.type),
    contextLabel: item.status ?? undefined,
    targetHref: crmActivityTarget(item),
    targetLabel: item.sourceType === "communication" ? "Open conversation" : "Open record",
    occurredAt: item.occurredAt,
    summary: item.summary,
    groupLabel: dayLabel(item.occurredAt),
  }));
  const clearFilters = () => { setSearch(""); setTypes([]); setSources([]); setChannels([]); setActors([]); setStatuses([]); setRange("all"); };
  const hasFilters = Boolean(search || types.length || sources.length || channels.length || actors.length || statuses.length || range !== "all");

  if (loading) return <PageContainer width="narrow"><div className="py-16 text-center text-sm text-muted-foreground">Loading activity...</div></PageContainer>;
  if (error) return <PageContainer width="narrow"><EmptyState title="Unable to load activity" description={error} action={<Button onClick={reload}>Try again</Button>} /></PageContainer>;
  if (!view) return <PageContainer width="narrow"><EmptyState title="Contact not found" description="The contact activity you're looking for doesn't exist." action={<Button asChild><Link to="/app/sales-crm/contacts">Back to contacts</Link></Button>} /></PageContainer>;

  const latest = view.timeline[0];
  const pending = view.timeline.filter((item) => item.status === "pending").length;
  return (
    <PageContainer width="wide">
      <PageHeader title="Activity" description={`Complete relationship history for ${contactName(view.contact)}.`} breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Contacts" }, { label: contactName(view.contact) }, { label: "Activity" }]} actions={<Button variant="outline" asChild><Link to={`/app/sales-crm/contacts/${view.contact.id}`}><ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Back to Customer 360</Link></Button>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Activities shown</p><p className="mt-1 text-2xl font-semibold">{filtered.length}</p></div>
        <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Last interaction</p><p className="mt-1 font-semibold">{latest ? formatRelative(latest.occurredAt) : "No activity"}</p></div>
        <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Pending follow-ups</p><p className="mt-1 text-2xl font-semibold">{pending}</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search activity..." size="sm" containerClassName="w-64" />
        <Select value={range} onValueChange={setRange}><SelectTrigger className="h-8 w-36 text-xs"><CalendarDays className="mr-1.5 h-3.5 w-3.5" /><SelectValue /></SelectTrigger><SelectContent>{RANGE_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
        <FilterDropdown label="Type" multiple value={types} onChange={setTypes} options={options.types} size="sm" />
        <FilterDropdown label="Source" multiple value={sources} onChange={setSources} options={options.sources} size="sm" />
        <FilterDropdown label="Channel" multiple value={channels} onChange={setChannels} options={options.channels} size="sm" />
        <FilterDropdown label="Actor" multiple value={actors} onChange={setActors} options={options.actors} size="sm" />
        <FilterDropdown label="Status" multiple value={statuses} onChange={setStatuses} options={options.statuses} size="sm" />
        {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}><Filter className="mr-1.5 h-3.5 w-3.5" />Clear filters</Button>}
      </div>
      <ActivityFeed title={`${filtered.length} activities`} description="Chronological CRM events for this contact." items={feedItems} onItemSelect={(item) => setSelected(filtered.find((activity) => `${activity.sourceType}:${activity.sourceId}` === item.id) ?? null)} emptyTitle="No activity found" emptyDescription={view.timeline.length ? "Try changing your filters." : "Activity will appear here as the relationship develops."} />
      <AppDrawer open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }} title={selected?.summary ?? "Activity details"} description={selected ? `${selected.type} · ${selected.source ?? selected.sourceType}` : undefined} size="sm" layoutMode="standard" responsive="auto" footer={selected ? <div className="flex w-full justify-end"><Button onClick={() => setSelected(null)}>Close</Button></div> : undefined}>
        {selected && <div className="space-y-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Actor</dt><dd className="font-medium">{selected.actor ?? "System"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Occurred</dt><dd className="font-medium">{formatDateTime(selected.occurredAt)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Channel</dt><dd className="font-medium">{selected.channel ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="font-medium">{selected.status ?? "—"}</dd></div>
          </dl>
          <div className="rounded-lg border border-border bg-card-muted/40 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</p><p className="mt-2 text-sm leading-relaxed">{selected.details ?? selected.summary}</p></div>
        </div>}
      </AppDrawer>
    </PageContainer>
  );
}
