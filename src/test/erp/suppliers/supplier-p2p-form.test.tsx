import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { localSupplierP2PStore } from "@/loopdev/domains/suppliers/data/localSupplierP2P";
import { localSuppliersStore } from "@/loopdev/domains/suppliers/data/localSuppliers";
import { SupplierP2PForm } from "@/loopdev/pages/erp/suppliers/SupplierP2PForm";

const organizationId = "local-development-organization";

describe("Supplier P2P full-page form", () => {
  beforeEach(() => {
    localSuppliersStore.reset();
    localSupplierP2PStore.reset();
    vi.stubEnv("VITE_CATALOG_ADAPTER_MODE", "local_demo");
  });

  it("creates identity, contacts, addresses and purchasing defaults without opening a modal", async () => {
    const onSaved = vi.fn();
    render(
      <SupplierP2PForm
        organizationId={organizationId}
        onExit={vi.fn()}
        onSaved={onSaved}
      />,
    );

    fireEvent.change(screen.getByLabelText("Legal name"), { target: { value: "Full setup supplier" } });
    fireEvent.click(screen.getByRole("button", { name: "Add contact" }));
    fireEvent.change(screen.getByLabelText("Contact name"), { target: { value: "Purchasing lead" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "buyer@example.test" } });

    fireEvent.click(screen.getByRole("button", { name: "Add address" }));
    fireEvent.change(screen.getByLabelText("Address label"), { target: { value: "Order office" } });
    fireEvent.change(screen.getByLabelText("City / locality"), { target: { value: "Madrid" } });
    fireEvent.change(screen.getByLabelText("Street address"), { target: { value: "Calle de Prueba 10" } });
    fireEvent.change(screen.getByLabelText("Default currency"), { target: { value: "EUR" } });
    fireEvent.change(screen.getByLabelText("Payment terms"), { target: { value: "NET30" } });
    fireEvent.change(screen.getByLabelText("Finance reference"), { target: { value: "AP-204" } });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Account identifier")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create supplier" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    const record = localSupplierP2PStore.list().find((item) => item.supplierId === onSaved.mock.calls[0][0].id);
    expect(record).toEqual(expect.objectContaining({
      contacts: [expect.objectContaining({ name: "Purchasing lead", email: "buyer@example.test", status: "active" })],
      addresses: [expect.objectContaining({ label: "Order office", locality: "Madrid", status: "active" })],
      purchaseDefaults: expect.objectContaining({
        currency: "EUR",
        paymentTermCode: "NET30",
        financeReference: "AP-204",
      }),
    }));
    expect(screen.getByRole("status")).toHaveTextContent("Supplier setup saved.");
  });

  it("keeps invalid setup in the form and does not create a partial supplier", async () => {
    render(
      <SupplierP2PForm
        organizationId={organizationId}
        onExit={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Legal name"), { target: { value: "Invalid setup supplier" } });
    fireEvent.click(screen.getByRole("button", { name: "Add contact" }));
    fireEvent.change(screen.getByLabelText("Contact name"), { target: { value: "Purchasing lead" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
    fireEvent.click(screen.getByRole("button", { name: "Create supplier" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid email address");
    expect(localSuppliersStore.list().some((supplier) => supplier.legalName === "Invalid setup supplier")).toBe(false);
  });
});
