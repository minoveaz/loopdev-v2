import { useCallback, useRef, type RefObject } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen && dirtyRef.current && !window.confirm("Discard your unsaved changes?")) return;
    onOpenChange(nextOpen);
  }, [onOpenChange]);
  const handleCloseAutoFocus = useCallback((event: Event) => {
    const target = restoreFocusRef?.current;
    if (!target?.isConnected) return;
    event.preventDefault();
    window.requestAnimationFrame(() => target.focus());
  }, [restoreFocusRef]);
  const handleDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        className="w-full overflow-y-auto sm:max-w-xl"
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <SheetHeader>
          <SheetTitle className="font-display text-xl">
            {editing ? "Edit contact" : "Create contact"}
          </SheetTitle>
          <SheetDescription>
            {editing
              ? "Update the contact profile and relationship details."
              : "Add a complete contact profile without leaving the contacts list."}
          </SheetDescription>
        </SheetHeader>
        <ContactForm
          contact={contact}
          onCancel={() => handleOpenChange(false)}
          onSubmit={onSubmit}
          onSuccess={onSuccess}
          onDirtyChange={handleDirtyChange}
        />
      </SheetContent>
    </Sheet>
  );
}
