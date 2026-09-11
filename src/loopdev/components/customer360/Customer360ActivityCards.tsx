import { CheckSquare, Plus, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ActivityFeed, DataCard, EmptyState, getActivityActionLabel, getActivityKind, type ActivityFeedItem } from "@/components/common";
import { Button } from "@/components/ui/button";
import type { CRMActivity, CRMLead, CRMNote, CRMOpportunity, CRMTask } from "@/loopdev/domains/crm/adapter";
import { formatDate, formatRelative } from "@/lib/formatters";

function crmActivityTarget(item: CRMActivity): string | undefined {
  if (item.sourceType === "communication") return `/app/sales-crm/communications/${item.sourceId}`;
  if (item.sourceType === "task") return `/app/sales-crm/tasks?taskId=${item.sourceId}`;
  if (item.sourceType === "opportunity") return `/app/sales-crm/opportunities?opportunityId=${item.sourceId}`;
  return undefined;
}

export function Customer360TimelineCard({ timeline, contactId }: { timeline: CRMActivity[]; contactId: string }) {
  const recentTimeline = [...timeline]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .slice(0, 4);
  const orderedTimeline = [...timeline].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  const firstActivity = orderedTimeline[0];
  const lastActivity = orderedTimeline[orderedTimeline.length - 1];
  const items: ActivityFeedItem[] = recentTimeline.map((item) => ({
    id: `${item.sourceType}:${item.sourceId}`,
    kind: getActivityKind(item.type),
    actorLabel: item.sourceType,
    actorInitials: item.sourceType.slice(0, 2).toUpperCase(),
    action: item.type,
    actionLabel: getActivityActionLabel(item.type),
    contextLabel: item.status ?? undefined,
    targetHref: crmActivityTarget(item),
    targetLabel: item.sourceType === "communication" ? "Open conversation" : "Open record",
    occurredAt: item.occurredAt,
    summary: item.summary,
  }));
  const activitySummary = timeline.length ? (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span><strong className="font-medium text-foreground">Total activities:</strong> {timeline.length}</span>
      {firstActivity && <span><strong className="font-medium text-foreground">First activity:</strong> {formatDate(firstActivity.occurredAt)}</span>}
      {lastActivity && <span><strong className="font-medium text-foreground">Last activity:</strong> {formatDate(lastActivity.occurredAt)}</span>}
    </div>
  ) : "Latest relationship activity";
  return <ActivityFeed title="Activity timeline" description={activitySummary} action={<Button asChild variant="ghost" size="sm"><Link to={`/app/sales-crm/contacts/${contactId}/activity`}>View all<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>} items={items} emptyTitle="No recent activity" emptyDescription="Activity will appear here as the relationship develops." />;
}

export function Customer360LeadsCard({ leads }: { leads: CRMLead[] }) {
  const statusLabel = (status: CRMLead["status"]) => status.replace("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
  return <DataCard title={`Leads (${leads.length})`} description="Lead source and qualification context">
    {leads.length ? <ul className="space-y-2">{leads.map((lead) => <li key={lead.id} className="rounded-md border border-border bg-card-muted/30 p-3">
      <div className="flex items-center justify-between"><span className="text-sm font-medium">{lead.interest || "General interest"}</span><span className="text-xs text-muted-foreground">{statusLabel(lead.status)}</span></div>
      <p className="mt-1 text-xs text-muted-foreground">{lead.source || "Unknown source"} · {formatDate(lead.createdAt)}</p>
    </li>)}</ul> : <EmptyState title="No related leads" description="Leads associated with this contact will appear here." />}
  </DataCard>;
}

export function Customer360OpportunitiesCard({ opportunities }: { opportunities: CRMOpportunity[] }) {
  return <DataCard title={`Opportunities (${opportunities.length})`} description="Commercial context for this contact">
    {opportunities.length ? <ul className="space-y-2">{opportunities.map((opportunity) => <li key={opportunity.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card-muted/30 p-3">
      <div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary"><TrendingUp className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-medium">{opportunity.name}</p><p className="text-xs text-muted-foreground">{opportunity.stageKey} · {opportunity.amount ?? "—"} {opportunity.currency ?? ""}</p><p className="text-xs text-muted-foreground">{opportunity.origin === "lead_conversion" ? `Lead conversion · ${opportunity.productKey ?? "—"}` : "Manual opportunity"}{opportunity.leadId ? ` · ${opportunity.leadId}` : ""}</p></div></div>
      <Button size="sm" variant="ghost">View</Button>
    </li>)}</ul> : <EmptyState title="No opportunities" description="Related opportunities will appear here." />}
    <Button variant="outline" className="mt-4 w-full"><Plus className="mr-1.5 h-3.5 w-3.5" />New opportunity</Button>
  </DataCard>;
}

export function Customer360TasksCard({ tasks }: { tasks: CRMTask[] }) {
  const openTasks = tasks.filter((task) => task.status !== "completed");
  return <DataCard title={`Tasks (${openTasks.length})`} description="Follow-ups and next actions">
    {openTasks.length ? <ul className="space-y-2">{openTasks.map((task) => <li key={task.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card-muted/30 p-3">
      <div className="flex min-w-0 items-center gap-3"><CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><p className="truncate text-sm font-medium">{task.title}</p><p className="text-xs text-muted-foreground">{task.priority} priority · {task.dueAt ? formatDate(task.dueAt) : "No due date"}</p></div></div>
      <Button size="sm" variant="ghost">View</Button>
    </li>)}</ul> : <EmptyState title="No open tasks" description="Follow-ups will appear here." />}
  </DataCard>;
}

export function Customer360NotesCard({ notes }: { notes: CRMNote[] }) {
  return <DataCard title={`Notes (${notes.length})`} description="Contextual notes for this relationship">
    {notes.length ? <ul className="space-y-2">{notes.map((note) => <li key={note.id} className="rounded-md border border-border bg-card-muted/30 p-3"><p className="text-sm">{note.body || "Note content is restricted."}</p><p className="mt-1 text-xs text-muted-foreground">{formatRelative(note.updatedAt)} · {note.visibility}</p></li>)}</ul> : <EmptyState title="No notes" description="Notes added to this contact will appear here." />}
    <Button variant="outline" className="mt-4 w-full"><Plus className="mr-1.5 h-3.5 w-3.5" />Add note</Button>
  </DataCard>;
}
