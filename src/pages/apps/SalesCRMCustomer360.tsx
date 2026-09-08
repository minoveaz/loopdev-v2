import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { EmptyState, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useLoopdevCustomer360 } from "@/hooks/use-loopdev-crm";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { contactName } from "@/adapters/loopdev";
import { Customer360ProfileCard } from "@/components/loopdev/customer360/Customer360ProfileCard";
import { Customer360DetailTabs } from "@/components/loopdev/customer360/Customer360DetailTabs";
import {
  Customer360LeadsCard,
  Customer360NotesCard,
  Customer360OpportunitiesCard,
  Customer360TasksCard,
  Customer360TimelineCard,
} from "@/components/loopdev/customer360/Customer360ActivityCards";

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

      <Customer360TimelineCard timeline={view.timeline} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Customer360LeadsCard leads={view.leads} />
        <Customer360OpportunitiesCard opportunities={view.opportunities} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Customer360TasksCard tasks={view.tasks} />
        <Customer360NotesCard notes={view.notes} />
      </div>
    </PageContainer>
  );
}
