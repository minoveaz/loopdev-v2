import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
});
