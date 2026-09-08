import { CheckSquare, Plus, TrendingUp } from "lucide-react";
import { DataCard, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import type { CRMActivity, CRMLead, CRMNote, CRMOpportunity, CRMTask } from "@/adapters/loopdev";
import { formatDate, formatRelative } from "@/lib/formatters";

export function Customer360TimelineCard({ timeline }: { timeline: CRMActivity[] }) {
  return (
    <DataCard title="Activity timeline" description="Recent relationship activity">
      {timeline.length ? <ol className="relative ml-2 max-w-3xl space-y-5 border-l border-border pl-5">
        {timeline.map((item) => <li key={`${item.sourceType}:${item.sourceId}`} className="relative">
          <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
          <p className="text-sm font-medium">{item.summary}</p>
          <p className="text-xs text-muted-foreground">{formatRelative(item.occurredAt)} · {item.type}</p>
        </li>)}
      </ol> : <EmptyState title="No recent activity" description="Activity will appear here as the relationship develops." />}
    </DataCard>
  );
}

export function Customer360LeadsCard({ leads }: { leads: CRMLead[] }) {
  return <DataCard title={`Leads (${leads.length})`} description="Lead source and qualification context">
    {leads.length ? <ul className="space-y-2">{leads.map((lead) => <li key={lead.id} className="rounded-md border border-border bg-card-muted/30 p-3">
      <div className="flex items-center justify-between"><span className="text-sm font-medium">{lead.interest || "General interest"}</span><span className="text-xs text-muted-foreground">{lead.status}</span></div>
      <p className="mt-1 text-xs text-muted-foreground">{lead.source || "Unknown source"} · {formatDate(lead.createdAt)}</p>
    </li>)}</ul> : <EmptyState title="No related leads" description="Leads associated with this contact will appear here." />}
  </DataCard>;
}

export function Customer360OpportunitiesCard({ opportunities }: { opportunities: CRMOpportunity[] }) {
  return <DataCard title={`Opportunities (${opportunities.length})`} description="Commercial context for this contact">
    {opportunities.length ? <ul className="space-y-2">{opportunities.map((opportunity) => <li key={opportunity.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card-muted/30 p-3">
      <div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary"><TrendingUp className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-medium">{opportunity.name}</p><p className="text-xs text-muted-foreground">{opportunity.stageKey} · {opportunity.amount ?? "—"} {opportunity.currency ?? ""}</p></div></div>
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
