import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckSquare, Plus, TrendingUp } from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useLoopdevCustomer360 } from "@/hooks/use-loopdev-crm";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { contactName } from "@/adapters/loopdev";
import { formatDate, formatRelative } from "@/lib/formatters";
import { Customer360ProfileCard } from "@/components/loopdev/customer360/Customer360ProfileCard";
import { Customer360DetailTabs } from "@/components/loopdev/customer360/Customer360DetailTabs";

export default function SalesCRMCustomer360() {
  const { contactId } = useParams<{ contactId: string }>();
  const { trail } = useBreadcrumbs();
  const { view, loading } = useLoopdevCustomer360(contactId);

  if (loading) {
    return <PageContainer width="narrow"><div className="py-16 text-center text-sm text-muted-foreground">Loading contact...</div></PageContainer>;
  }

  if (!view) {
    return <PageContainer width="narrow"><EmptyState title="Contact not found" description="The contact you're looking for doesn't exist." action={<Button asChild><Link to="/app/sales-crm/contacts">Back to contacts</Link></Button>} /></PageContainer>;
  }

  const { contact } = view;
  const name = contactName(contact);
  const openTasks = view.tasks.filter((task) => task.status !== "completed");

  return (
    <PageContainer width="wide" className="min-w-0">
      <PageHeader
        title={name}
        description="Profile, relationship details, and recent CRM activity."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Contacts" }, { label: name }]}
        actions={<Button variant="outline" asChild><Link to="/app/sales-crm/contacts"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Back</Link></Button>}
      />

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <Customer360ProfileCard contact={contact} />
        <Customer360DetailTabs contact={contact} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DataCard title="Activity timeline" description="Recent relationship activity">
          {view.timeline.length ? (
            <ol className="relative ml-2 space-y-5 border-l border-border pl-5">
              {view.timeline.map((item) => (
                <li key={`${item.sourceType}:${item.sourceId}`} className="relative">
                  <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                  <p className="text-sm font-medium">{item.summary}</p>
                  <p className="text-xs text-muted-foreground">{formatRelative(item.occurredAt)} · {item.type}</p>
                </li>
              ))}
            </ol>
          ) : <EmptyState title="No recent activity" description="Activity will appear here as the relationship develops." />}
        </DataCard>

        <DataCard title="Related opportunities" description="Commercial context for this contact">
          {view.opportunities.length ? (
            <ul className="space-y-2">
              {view.opportunities.map((opportunity) => (
                <li key={opportunity.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card-muted/30 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary"><TrendingUp className="h-4 w-4" /></span>
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{opportunity.name}</p><p className="text-xs text-muted-foreground">{opportunity.stageKey} · {opportunity.amount ?? "—"} {opportunity.currency ?? ""}</p></div>
                  </div>
                  <Button size="sm" variant="ghost">View</Button>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No opportunities" description="Related opportunities will appear here." />}
          <Button variant="outline" className="mt-4 w-full"><Plus className="mr-1.5 h-3.5 w-3.5" />New opportunity</Button>
        </DataCard>
      </div>

      <DataCard title="Open tasks" description="Follow-ups and next actions">
        {openTasks.length ? (
          <ul className="grid gap-2 md:grid-cols-2">
            {openTasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card-muted/30 p-3">
                <div className="flex min-w-0 items-center gap-3"><CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><p className="truncate text-sm font-medium">{task.title}</p><p className="text-xs text-muted-foreground">{task.priority} priority · {task.dueAt ? formatDate(task.dueAt) : "No due date"}</p></div></div>
                <Button size="sm" variant="ghost">View</Button>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No open tasks" description="Follow-ups will appear here." />}
      </DataCard>
    </PageContainer>
  );
}
