import { useCallback, useRef, type RefObject } from "react";
import { AppDrawer } from "@/components/platform";
import type { CRMContact, CRMContactMutationResult } from "@/loopdev/domains/crm/adapter";
import { ContactForm, type ContactFormValues } from "./ContactForm";

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
  const handleDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);
  const confirmDiscard = useCallback(() => {
    dirtyRef.current = false;
  }, []);

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit contact" : "Create contact"}
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
        />
      )}
    </AppDrawer>
  );
}
