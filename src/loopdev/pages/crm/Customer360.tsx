import { Link, useParams } from "react-router-dom";
import { useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { EmptyState, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useCrmCustomer360 } from "@/loopdev/domains/crm/hooks/use-crm";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { contactName, loopdevAdapter, type CRMUpdateContactPatch } from "@/loopdev/domains/crm/adapter";
import type { ContactFormValues } from "@/loopdev/components/crm/contacts/ContactForm";
import { ContactFormDrawer } from "@/loopdev/components/crm/contacts/ContactFormDrawer";
import { Customer360ProfileCard } from "@/loopdev/components/customer360/Customer360ProfileCard";
import { Customer360DetailTabs } from "@/loopdev/components/customer360/Customer360DetailTabs";
import { Customer360TimelineCard } from "@/loopdev/components/customer360/Customer360ActivityCards";

export default function SalesCRMCustomer360() {
  const { contactId } = useParams<{ contactId: string }>();
  const { trail } = useBreadcrumbs();
  const { view, loading, error, reload } = useCrmCustomer360(contactId);
  const [editorOpen, setEditorOpen] = useState(false);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  if (loading) {
    return <PageContainer width="narrow"><div className="py-16 text-center text-sm text-muted-foreground">Loading contact...</div></PageContainer>;
  }

  if (error) {
    return (
      <PageContainer width="narrow">
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load contact"
          description={error}
          action={<Button onClick={reload}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Try again</Button>}
        />
      </PageContainer>
    );
  }

  if (!view) {
    return <PageContainer width="narrow"><EmptyState title="Contact not found" description="The contact you're looking for doesn't exist." action={<Button asChild><Link to="/app/sales-crm/contacts">Back to contacts</Link></Button>} /></PageContainer>;
  }

  const { contact } = view;
  const name = contactName(contact);
  const openEditor = () => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditorOpen(true);
  };
  const submitContact = async (values: ContactFormValues) => {
    const optional = (value: string) => value.trim() || null;
    const patch: CRMUpdateContactPatch = {
      organizationId: "local-development-organization",
      firstName: values.firstName.trim(),
      lastName: optional(values.lastName),
      secondLastName: optional(values.secondLastName),
      preferredName: optional(values.preferredName),
      documentType: optional(values.documentType),
      documentNumber: optional(values.documentNumber),
      birthDate: optional(values.birthDate),
      gender: optional(values.gender),
      email: values.email.trim() || null,
      secondaryEmail: optional(values.secondaryEmail),
      phone: values.phone.trim() || null,
      secondaryPhone: optional(values.secondaryPhone),
      preferredChannel: values.preferredChannel,
      preferredLanguage: optional(values.preferredLanguage),
      companyName: optional(values.companyName),
      jobTitle: optional(values.jobTitle),
      department: optional(values.department),
      addressLine1: optional(values.addressLine1),
      addressLine2: optional(values.addressLine2),
      city: optional(values.city),
      stateProvince: optional(values.stateProvince),
      postalCode: optional(values.postalCode),
      country: optional(values.country),
    };
    return loopdevAdapter.crm.updateContact(contact.id, patch, contact.updatedAt);
  };

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
        <Customer360DetailTabs contact={contact} leads={view.leads} opportunities={view.opportunities} tasks={view.tasks} notes={view.notes} onEdit={openEditor} />
      </div>

      <Customer360TimelineCard timeline={view.timeline} contactId={contact.id} />

      <ContactFormDrawer
        open={editorOpen}
        contact={contact}
        onOpenChange={setEditorOpen}
        onSubmit={submitContact}
        onSuccess={() => {
          setEditorOpen(false);
          reload();
        }}
        restoreFocusRef={restoreFocusRef}
      />
    </PageContainer>
  );
}
