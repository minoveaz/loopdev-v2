import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import SalesCRMContacts from "@/loopdev/pages/crm/Contacts";

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

describe("Contacts navigation", () => {
  it("navigates a contact row to Customer 360", async () => {
    render(
      <MemoryRouter initialEntries={["/app/sales-crm/contacts"]}>
        <SalesCRMContacts />
        <LocationProbe />
      </MemoryRouter>,
    );

    const row = await screen.findByRole("row", { name: /Aria Blackwood/i });
    fireEvent.click(row);
    expect(screen.getByTestId("location")).toHaveTextContent("/app/sales-crm/contacts/crm_cust_1");
  });

  it("moves between cursor pages and exposes page-size controls", async () => {
    render(
      <MemoryRouter initialEntries={["/app/sales-crm/contacts"]}>
        <SalesCRMContacts />
      </MemoryRouter>,
    );

    await screen.findByRole("row", { name: /Aria Blackwood/i });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByRole("row", { name: /Niamh O'Connor/i });
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Contacts per page" })).toHaveValue("10");

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    await screen.findByRole("row", { name: /Aria Blackwood/i });
  });

  it("refreshes the active list after creating a contact", async () => {
    const firstName = `Refresh ${Date.now()}`;
    const email = `${firstName.replace(/\s+/g, ".").toLowerCase()}@example.com`;

    render(
      <MemoryRouter initialEntries={["/app/sales-crm/contacts"]}>
        <SalesCRMContacts />
      </MemoryRouter>,
    );

    await screen.findByRole("button", { name: "New contact" });
    fireEvent.click(screen.getByRole("button", { name: "New contact" }));
    fireEvent.change(screen.getByLabelText("First name *"), { target: { value: firstName } });
    fireEvent.change(screen.getByLabelText("Primary email"), { target: { value: email } });
    fireEvent.click(screen.getByRole("button", { name: "Create contact" }));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Create contact" })).not.toBeInTheDocument();
    });
    expect(await screen.findAllByText(firstName)).not.toHaveLength(0);
    expect(await screen.findAllByText(email)).not.toHaveLength(0);
  });
});
