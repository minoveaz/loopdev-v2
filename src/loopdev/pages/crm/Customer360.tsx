import { Link, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { EmptyState, NoteEditorDrawer, PageContainer, PageHeader, type NoteEditorValue } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useCrmCustomer360 } from "@/loopdev/domains/crm/hooks/use-crm";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { contactName, loopdevAdapter, type CRMNote, type CRMUpdateContactPatch } from "@/loopdev/domains/crm/adapter";
import type { ContactFormValues } from "@/loopdev/components/crm/contacts/ContactForm";
import { ContactFormDrawer } from "@/loopdev/components/crm/contacts/ContactFormDrawer";
import { Customer360ProfileCard } from "@/loopdev/components/customer360/Customer360ProfileCard";
import { Customer360DetailTabs } from "@/loopdev/components/customer360/Customer360DetailTabs";
import { Customer360TimelineCard } from "@/loopdev/components/customer360/Customer360ActivityCards";

export default function SalesCRMCustomer360() {
  const { contactId } = useParams<{ contactId: string }>();
  const [searchParams] = useSearchParams();
  const { trail } = useBreadcrumbs();
  const { view, loading, error, reload } = useCrmCustomer360(contactId);
  const [editorOpen, setEditorOpen] = useState(false);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CRMNote | null>(null);
  const [customerNotes, setCustomerNotes] = useState<CRMNote[]>([]);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const customerName = view ? contactName(view.contact) : "";
  const noteInitialValue = useMemo(() => selectedNote && view ? {
    mode: "quick" as const,
    plainTextPreview: selectedNote.body ?? "",
    visibility: selectedNote.visibility === "private" ? "private" as const : selectedNote.visibility === "organization" ? "organization" as const : "team" as const,
    relations: [{ type: "contact" as const, id: view.contact.id, label: customerName }],
    content: { type: "doc" as const, content: [{ type: "paragraph" as const, content: selectedNote.body ? [{ type: "text" as const, text: selectedNote.body }] : undefined }] },
  } : undefined, [customerName, selectedNote, view]);

  useEffect(() => {
    if (view) setCustomerNotes(view.notes);
  }, [view]);

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
  const demoMultiple = searchParams.get("demo") === "multiple" && contact.id === "crm_cust_1";
  const demoView = demoMultiple ? {
    ...view,
    leads: view.leads.length ? [
      ...view.leads,
      {
        ...view.leads[0],
        id: `${view.leads[0].id}-demo-2`,
        interest: "Security review",
        status: "contacted" as const,
        source: "Referral",
        ownerName: "Jon Bell",
        assignedUserId: "owner-jon",
        score: 68,
      },
      {
        ...view.leads[0],
        id: `${view.leads[0].id}-demo-3`,
        interest: "Implementation planning",
        status: "new" as const,
        source: "Event",
        ownerName: "Lee Okafor",
        assignedUserId: "owner-lee",
        score: 51,
      },
    ] : view.leads,
    opportunities: view.opportunities.length ? [
      ...view.opportunities,
      {
        ...view.opportunities[0],
        id: `${view.opportunities[0].id}-demo-2`,
        name: "Security review package",
        stageKey: "qualified" as const,
        amount: 18500,
        ownerName: "Jon Bell",
        ownerId: "owner-jon",
        origin: "lead_conversion" as const,
      },
      {
        ...view.opportunities[0],
        id: `${view.opportunities[0].id}-demo-3`,
        name: "Implementation services",
        stageKey: "negotiation" as const,
        amount: 32000,
        ownerName: "Lee Okafor",
        ownerId: "owner-lee",
        origin: "manual" as const,
      },
    ] : view.opportunities,
  } : view;
  const name = customerName;
  const openEditor = () => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditorOpen(true);
  };
  const openNewNote = () => {
    setSelectedNote(null);
    setNoteEditorOpen(true);
  };
  const openExistingNote = (note: CRMNote) => {
    setSelectedNote(note);
    setNoteEditorOpen(true);
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
        <Customer360DetailTabs contact={contact} leads={demoView.leads} opportunities={demoView.opportunities} tasks={view.tasks} notes={customerNotes} onEdit={openEditor} onNewNote={openNewNote} onEditNote={openExistingNote} />
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
      <NoteEditorDrawer
        open={noteEditorOpen}
        onOpenChange={setNoteEditorOpen}
        relation={{ type: "contact", id: contact.id, label: name }}
        title={selectedNote ? "Edit note" : "New note"}
        initialValue={noteInitialValue}
        onSubmit={async (value: NoteEditorValue) => {
          if (selectedNote) {
            setCustomerNotes((current) => current.map((note) => note.id === selectedNote.id ? { ...note, body: value.plainTextPreview, visibility: value.visibility, updatedAt: new Date().toISOString() } : note));
          } else {
            const created = await loopdevAdapter.notes.create({
              organizationId: contact.organizationId,
              authorId: "local-development-user",
              authorName: "Alex Morgan",
              ...value,
            });
            setCustomerNotes((current) => [{ id: created.id, body: created.plainTextPreview, visibility: created.visibility, createdAt: created.createdAt, updatedAt: created.updatedAt }, ...current]);
          }
          setSelectedNote(null);
          setNoteEditorOpen(false);
        }}
      />
    </PageContainer>
  );
}
