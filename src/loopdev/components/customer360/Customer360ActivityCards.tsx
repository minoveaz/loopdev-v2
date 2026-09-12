import { CheckSquare, TrendingUp, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ActivityFeed, DataCard, EmptyState, getActivityActionLabel, getActivityKind, StatusBadge, type ActivityFeedItem } from "@/components/common";
import { Button } from "@/components/ui/button";
import type { CRMActivity, CRMLead, CRMOpportunity, CRMTask } from "@/loopdev/domains/crm/adapter";
import type { GlobalNoteRecord } from "@/loopdev/domains/notes";
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
  const navigate = useNavigate();
  const openLead = (leadId: string) => navigate(`/app/sales-crm/leads?lead=${encodeURIComponent(leadId)}`);
  return <DataCard title={`Leads (${leads.length})`} action={<Button asChild variant="ghost" size="sm"><Link to="/app/sales-crm/leads">View</Link></Button>} className="border-border-strong">
    {leads.length ? <ul className="space-y-3">{leads.map((lead) => <li key={lead.id} role="button" tabIndex={0} onClick={() => openLead(lead.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openLead(lead.id); } }} className="cursor-pointer rounded-md border border-border-strong bg-card-muted/20 px-3 py-3 transition-colors hover:bg-card-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="break-words text-sm font-medium">{lead.interest || "General interest"}</p><StatusBadge tone={lead.status === "converted" ? "success" : lead.status === "inactive" || lead.status === "stalled" ? "destructive" : "info"}>{statusLabel(lead.status)}</StatusBadge></div><dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-xs"><div><dt className="text-muted-foreground">Source</dt><dd className="mt-0.5 break-words font-medium">{lead.source || "Unknown source"}</dd></div><div><dt className="text-muted-foreground">Score</dt><dd className="mt-0.5 font-medium">{lead.score ?? "—"}</dd></div><div><dt className="text-muted-foreground">Owner</dt><dd className="mt-0.5 break-words font-medium">{lead.ownerName || "Unassigned"}</dd></div><div><dt className="text-muted-foreground">Started</dt><dd className="mt-0.5 break-words font-medium">{formatDate(lead.createdAt)}</dd></div><div><dt className="text-muted-foreground">Last activity</dt><dd className="mt-0.5 break-words font-medium">{lead.lastActivityAt ? formatRelative(lead.lastActivityAt) : "None recorded"}</dd></div><div><dt className="text-muted-foreground">Next activity</dt><dd className="mt-0.5 break-words font-medium">{lead.nextActivityAt ? formatDate(lead.nextActivityAt) : "Not set"}</dd></div></dl></div>
    </li>)}</ul> : <EmptyState title="No related leads" description="Leads associated with this contact will appear here." />}
  </DataCard>;
}

export function Customer360OpportunitiesCard({ opportunities }: { opportunities: CRMOpportunity[] }) {
  const navigate = useNavigate();
  const openOpportunity = (opportunityId: string) => navigate(`/app/sales-crm/opportunities?opportunityId=${encodeURIComponent(opportunityId)}`);
  return <DataCard title={`Opportunities (${opportunities.length})`} action={<Button asChild variant="ghost" size="sm"><Link to="/app/sales-crm/opportunities">View</Link></Button>} className="border-border-strong">
    {opportunities.length ? <ul className="space-y-3">{opportunities.map((opportunity) => <li key={opportunity.id} role="button" tabIndex={0} onClick={() => openOpportunity(opportunity.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openOpportunity(opportunity.id); } }} className="cursor-pointer rounded-md border border-border-strong bg-card-muted/20 px-3 py-3 transition-colors hover:bg-card-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><TrendingUp className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="break-words text-sm font-medium">{opportunity.name}</p><StatusBadge tone={opportunity.stageKey === "won" ? "success" : opportunity.stageKey === "lost" ? "destructive" : "info"}>{opportunity.stageKey}</StatusBadge></div><dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-xs"><div><dt className="text-muted-foreground">Amount</dt><dd className="mt-0.5 break-words font-medium">{opportunity.amount ?? "—"} {opportunity.currency ?? ""}</dd></div><div><dt className="text-muted-foreground">Owner</dt><dd className="mt-0.5 break-words font-medium">{opportunity.ownerName || "Unassigned"}</dd></div><div><dt className="text-muted-foreground">Started</dt><dd className="mt-0.5 break-words font-medium">{formatDate(opportunity.createdAt)}</dd></div><div><dt className="text-muted-foreground">Expected close</dt><dd className="mt-0.5 break-words font-medium">{opportunity.expectedCloseAt ? formatDate(opportunity.expectedCloseAt) : "Not set"}</dd></div><div><dt className="text-muted-foreground">Last updated</dt><dd className="mt-0.5 break-words font-medium">{formatRelative(opportunity.updatedAt)}</dd></div><div><dt className="text-muted-foreground">Origin</dt><dd className="mt-0.5 break-words font-medium">{opportunity.origin === "lead_conversion" ? "Lead conversion" : "Manual opportunity"}</dd></div></dl></div></div>
    </li>)}</ul> : <EmptyState title="No opportunities" description="Related opportunities will appear here." />}
  </DataCard>;
}

export function Customer360TasksCard({ tasks }: { tasks: CRMTask[] }) {
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const navigate = useNavigate();
  const openTask = (taskId: string) => navigate(`/app/sales-crm/tasks?taskId=${encodeURIComponent(taskId)}`);
  return <DataCard title={`Tasks (${openTasks.length})`} action={<Button asChild variant="ghost" size="sm"><Link to="/app/sales-crm/tasks">View</Link></Button>}>
    {openTasks.length ? <ul className="space-y-3">{openTasks.map((task) => <li key={task.id} role="button" tabIndex={0} onClick={() => openTask(task.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openTask(task.id); } }} className="cursor-pointer rounded-md border border-border-strong bg-card-muted/20 p-3 transition-colors hover:bg-card-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="flex min-w-0 items-start gap-3"><CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><p className="break-words text-sm font-medium">{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{task.priority} priority · {task.dueAt ? formatDate(task.dueAt) : "No due date"}</p></div></div>
    </li>)}</ul> : <EmptyState title="No open tasks" description="Follow-ups will appear here." />}
  </DataCard>;
}

export function Customer360NotesCard({ notes, onEditNote }: { notes: GlobalNoteRecord[]; onEditNote?: (note: GlobalNoteRecord) => void }) {
  return <DataCard title={`Notes (${notes.length})`}>
    {notes.length ? <ul className="space-y-3">{notes.map((note) => <li key={note.id}><button type="button" onClick={() => onEditNote?.(note)} className="w-full cursor-pointer rounded-md border border-border-strong bg-card-muted/20 p-3 text-left transition-colors hover:bg-card-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{note.title && <p className="mb-1 break-words text-sm font-medium">{note.title}</p>}<p className="break-words whitespace-pre-wrap text-sm">{note.plainTextPreview || "Note content is restricted."}</p><p className="mt-1 text-xs text-muted-foreground">{formatRelative(note.updatedAt)} · {note.visibility}{note.attachments.length ? ` · ${note.attachments.length} attachment${note.attachments.length === 1 ? "" : "s"}` : ""}</p></button></li>)}</ul> : <EmptyState title="No notes" description="Notes added to this contact will appear here." />}
  </DataCard>;
}
