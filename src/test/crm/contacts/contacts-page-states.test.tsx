import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SalesCRMContacts from "@/loopdev/pages/crm/Contacts";

describe("Contacts page states", () => {
  it("renders the page and its loading or data surface", () => {
    render(
      <MemoryRouter initialEntries={["/app/sales-crm/contacts"]}>
        <SalesCRMContacts />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Contacts" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
