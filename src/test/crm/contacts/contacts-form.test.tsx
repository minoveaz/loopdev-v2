import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "@/loopdev/components/crm/contacts/ContactForm";
import { ContactFormDrawer } from "@/loopdev/components/crm/contacts/ContactFormDrawer";
import type { CRMContact, CRMContactMutationResult } from "@/loopdev/domains/crm/adapter";

const contact: CRMContact = {
  id: "contact-1",
  organizationId: "local-development-organization",
  firstName: "Ada",
  lastName: "Lovelace",
  secondLastName: null,
  preferredName: null,
  email: "ada@example.com",
  secondaryEmail: null,
  phone: "+1 555 0100",
  secondaryPhone: null,
  preferredChannel: "email",
  preferredLanguage: "English",
  documentType: "PASSPORT",
  documentNumber: "P-100",
  birthDate: "1815-12-10",
  gender: "Female",
  addressLine1: null,
  addressLine2: null,
  city: "London",
  stateProvince: null,
  postalCode: null,
  country: "UK",
  companyName: "Analytical Engines",
  jobTitle: "Mathematician",
  department: null,
  attributes: {},
  identityStatus: "verified",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  archivedAt: null,
};

const success: CRMContactMutationResult = { status: "success", contact };

function renderForm(
  onSubmit: (values: Record<string, unknown>) => Promise<CRMContactMutationResult>,
  selectedContact?: CRMContact | null,
) {
  return render(
    <ContactForm
      contact={selectedContact}
      onCancel={vi.fn()}
      onSubmit={onSubmit}
      onSuccess={vi.fn()}
    />,
  );
}

describe("ContactForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("submits a new contact with the entered values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(success);
    renderForm(onSubmit);

    fireEvent.change(screen.getByLabelText("First name *"), { target: { value: "Grace" } });
    fireEvent.change(screen.getByLabelText("Primary email"), { target: { value: "grace@example.com" } });
    fireEvent.change(screen.getByLabelText("Primary phone"), { target: { value: "+1 555 0101" } });
    fireEvent.click(screen.getByRole("button", { name: "Create contact" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      firstName: "Grace",
      email: "grace@example.com",
      phone: "+1 555 0101",
    });
  });

  it("loads and submits edited contact values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(success);
    renderForm(onSubmit, contact);

    const firstName = screen.getByLabelText("First name *");
    expect(firstName).toHaveValue("Ada");
    fireEvent.change(firstName, { target: { value: "Augusta" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ firstName: "Augusta", documentNumber: "P-100" });
  });

  it("blocks invalid submission and shows field errors", async () => {
    const onSubmit = vi.fn().mockResolvedValue(success);
    renderForm(onSubmit);

    fireEvent.click(screen.getByRole("button", { name: "Create contact" }));

    expect(await screen.findByText("First name is required.")).toBeVisible();
    expect(screen.getAllByText("Email or phone is required.")).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each([
    ["forbidden", "Permission denied: You cannot edit this contact."],
    ["conflict", "Conflict: The contact changed before it could be updated."],
    ["server-error", "Server error: Please try again later."],
  ] as const)("renders the %s response distinctly", async (status, message) => {
    const onSubmit = vi.fn().mockResolvedValue({ status, message } as CRMContactMutationResult);
    renderForm(onSubmit);

    fireEvent.change(screen.getByLabelText("First name *"), { target: { value: "Updated" } });
    fireEvent.change(screen.getByLabelText("Primary email"), { target: { value: "updated@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Create contact" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });
});

describe("ContactFormDrawer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("asks before discarding changes and restores focus to the trigger", async () => {
    const onSubmit = vi.fn().mockResolvedValue(success);
    const trigger = document.createElement("button");
    trigger.textContent = "New contact";
    document.body.appendChild(trigger);
    trigger.focus();

    function TestDrawer() {
      const [open, setOpen] = useState(true);
      return (
        <ContactFormDrawer
          open={open}
          contact={null}
          onOpenChange={setOpen}
          onSubmit={onSubmit}
          onSuccess={vi.fn()}
          restoreFocusRef={{ current: trigger }}
        />
      );
    }

    const view = render(<TestDrawer />);

    fireEvent.change(screen.getByLabelText("First name *"), { target: { value: "Ada" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    const discardDialog = screen.getByRole("alertdialog");
    expect(within(discardDialog).getByRole("heading", { name: "Discard contact changes?" })).toBeInTheDocument();
    fireEvent.click(within(discardDialog).getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Discard" }));
    await waitFor(() => expect(document.activeElement).toBe(trigger));

    view.unmount();
    trigger.remove();
  });
});
