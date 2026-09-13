import { useCallback, useRef, useState, type RefObject } from "react";
import { AppDrawer } from "@/components/platform";
import { FormSectionNav } from "@/components/common";
import type { CRMContact, CRMContactMutationResult } from "@/loopdev/domains/crm/adapter";
import { ContactForm, type ContactFormValues, type ContactSectionStats } from "./ContactForm";
import { contactFormSections } from "../../../../../packages/contracts/src/contact-form";

interface ContactFormDrawerProps {
  open: boolean;
  contact?: CRMContact | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ContactFormValues) => Promise<CRMContactMutationResult>;
  onSuccess: (contact: CRMContact) => void;
  restoreFocusRef?: RefObject<HTMLElement | null>;
}

export function ContactFormDrawer({
  open,
  contact,
  onOpenChange,
  onSubmit,
  onSuccess,
  restoreFocusRef,
}: ContactFormDrawerProps) {
  const editing = Boolean(contact);
  const dirtyRef = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [sectionStats, setSectionStats] = useState<Record<string, ContactSectionStats>>({});
  const handleDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
    setDirty(dirty);
  }, []);
  const confirmDiscard = useCallback(() => {
    dirtyRef.current = false;
    setDirty(false);
  }, []);
  const scrollToSection = useCallback((id: string) => {
    const target = document.getElementById(id);
    const container = target?.closest<HTMLElement>("[data-app-drawer-scroll]");
    if (!target || !container) return;

    const targetTop = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    container.scrollTo({ top: Math.max(0, targetTop - 12), behavior: "smooth" });
  }, []);

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit contact" : "Create contact"}
      eyebrow="CRM / Contact"
      mode={editing ? "Editing" : "New"}
      layoutMode="expanded"
      responsive="auto"
      showDirtyState={dirty}
      headerMeta={<span>Profile form</span>}
      headerNav={
        <FormSectionNav
          items={contactFormSections.map((section) => ({ id: `contact-form-${section.id}`, label: section.label, status: sectionStats[section.id]?.status ?? "neutral" }))}
          onSelect={scrollToSection}
        />
      }
      description={editing
        ? "Update the contact profile and relationship details."
        : "Add a complete contact profile without leaving the contacts list."}
      restoreFocusRef={restoreFocusRef}
      dirty={() => dirtyRef.current}
      confirmOnClose
      confirmTitle="Discard contact changes?"
      confirmDescription="Your unsaved contact changes will be lost."
      confirmLabel="Discard"
      confirmTone="warning"
      onDiscard={confirmDiscard}
    >
      {({ requestClose }) => (
        <ContactForm
          contact={contact}
          onCancel={requestClose}
          onSubmit={onSubmit}
          onSuccess={onSuccess}
          onDirtyChange={handleDirtyChange}
          onSectionStatsChange={setSectionStats}
        />
      )}
    </AppDrawer>
  );
}
