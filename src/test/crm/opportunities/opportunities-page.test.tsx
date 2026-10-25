import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SalesCRMOpportunities from "@/loopdev/pages/crm/Opportunities";
import { localCrmOpportunitiesStore, localCrmOpportunityLinesStore } from "@/loopdev/domains/crm/data/localOpportunities";
import { I18nProvider } from "@/i18n";

describe("Opportunities page", () => {
  beforeEach(() => {
    localCrmOpportunitiesStore.reset();
    localCrmOpportunityLinesStore.reset();
  });

  it("creates a manual opportunity from a contact and catalog item", async () => {
    render(<I18nProvider><MemoryRouter initialEntries={["/app/sales-crm/opportunities"]}><SalesCRMOpportunities /></MemoryRouter></I18nProvider>);

    await waitFor(() => expect(screen.getAllByText("Enterprise expansion").length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole("button", { name: "New opportunity" }));
    const dialog = await screen.findByRole("dialog", { name: "New opportunity" });
    fireEvent.click(within(dialog).getByRole("combobox", { name: "Search contact" }));
    const ariaRecords = await screen.findAllByText("Aria Blackwood");
    fireEvent.click(ariaRecords[ariaRecords.length - 1]);
    fireEvent.change(within(dialog).getByLabelText("Opportunity name"), { target: { value: "New catalog deal" } });
    fireEvent.click(within(dialog).getByRole("combobox", { name: "Catalog item" }));
    const enterpriseItems = await screen.findAllByText("Enterprise plan (1)");
    fireEvent.click(enterpriseItems[enterpriseItems.length - 1]);
    fireEvent.click(within(dialog).getByRole("button", { name: "Create opportunity" }));

    await waitFor(() => expect(localCrmOpportunitiesStore.list().some((item) => item.name === "New catalog deal")).toBe(true));
    expect(localCrmOpportunityLinesStore.list().some((line) => line.label === "Enterprise plan")).toBe(true);
  });
});
