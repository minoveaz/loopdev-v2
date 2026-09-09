import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { CRMContact, CRMContactMutationResult } from "@/loopdev/domains/crm/adapter";
import { ContactForm, type ContactFormValues } from "./ContactForm";

interface ContactFormDrawerProps {
  open: boolean;
  contact?: CRMContact | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ContactFormValues) => Promise<CRMContactMutationResult>;
  onSuccess: (contact: CRMContact) => void;
}

export function ContactFormDrawer({
  open,
  contact,
  onOpenChange,
  onSubmit,
  onSuccess,
}: ContactFormDrawerProps) {
  const editing = Boolean(contact);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
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
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
          onSuccess={onSuccess}
        />
      </SheetContent>
    </Sheet>
  );
}
