import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SalesCRMLeads from "@/loopdev/pages/crm/Leads";
import { localCrmLeadsStore } from "@/loopdev/domains/crm/data/localLeads";
import { localCrmOpportunitiesStore } from "@/loopdev/domains/crm/data/localOpportunities";
import { localLoopdevAdapter } from "@/loopdev/domains/crm/adapter/local";

describe("Leads page", () => {
  beforeEach(() => {
    localCrmLeadsStore.reset();
    localCrmOpportunitiesStore.reset();
  });

  it("converts a qualified lead through the adapter and reports success", async () => {
    render(
      <MemoryRouter initialEntries={["/app/sales-crm/leads"]}>
        <SalesCRMLeads />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getAllByText("Enterprise expansion").length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByText("Enterprise expansion")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Create opportunity" }));

    const dialog = await screen.findByRole("dialog", { name: "Create opportunity" });
    fireEvent.change(within(dialog).getByLabelText("Product or interest key"), {
      target: { value: "enterprise-plan" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create opportunity" }));

    await waitFor(() => expect(within(dialog).getByText("Opportunity created.")).toBeInTheDocument());
    const opportunities = await localLoopdevAdapter.crm.listOpportunities({ organizationId: "local-development-organization" });
    expect(opportunities.some((opportunity) => opportunity.productKey === "enterprise-plan" && opportunity.origin === "lead_conversion")).toBe(true);
  });

  it("opens the system conversion dialog and cancels without creating an opportunity", async () => {
    render(
      <MemoryRouter initialEntries={["/app/sales-crm/leads"]}>
        <SalesCRMLeads />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getAllByText("Enterprise expansion").length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByText("Enterprise expansion")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Create opportunity" }));
    const dialog = await screen.findByRole("dialog", { name: "Create opportunity" });
    expect(within(dialog).getByRole("heading", { name: "Create opportunity" })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Create opportunity" })).not.toBeInTheDocument());
    expect(localCrmOpportunitiesStore.list().filter((opportunity) => opportunity.origin === "lead_conversion")).toHaveLength(0);
  });

  it("protects dirty conversion details with the shared discard confirmation", async () => {
    render(
      <MemoryRouter initialEntries={["/app/sales-crm/leads"]}>
        <SalesCRMLeads />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getAllByText("Enterprise expansion").length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByText("Enterprise expansion")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Create opportunity" }));
    const dialog = await screen.findByRole("dialog", { name: "Create opportunity" });
    fireEvent.change(within(dialog).getByLabelText("Opportunity name"), { target: { value: "Changed details" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    const discardDialog = await screen.findByRole("alertdialog");
    expect(within(discardDialog).getByRole("heading", { name: "Discard opportunity details?" })).toBeInTheDocument();
    fireEvent.click(within(discardDialog).getByRole("button", { name: "Discard" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Create opportunity" })).not.toBeInTheDocument());
  });

  it("renders the contractual desktop columns and deterministic saved views", async () => {
    render(
      <MemoryRouter initialEntries={["/app/sales-crm/leads"]}>
        <SalesCRMLeads />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getAllByText("Enterprise expansion").length).toBeGreaterThan(0));
    for (const label of ["Contact", "Status", "Source", "Interest / Product", "Owner", "Score", "Last activity", "Next activity", "Opportunity"]) {
      expect(screen.getByRole("columnheader", { name: label })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("combobox", { name: "Saved view" }));
    expect(screen.getByRole("option", { name: "My leads" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Qualified" }));
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Saved view" })).toHaveTextContent("Qualified"));
  });

  it("keeps the lead preview closed until a lead is selected", async () => {
    render(
      <MemoryRouter initialEntries={["/app/sales-crm/leads"]}>
        <SalesCRMLeads />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getAllByText("Enterprise expansion").length).toBeGreaterThan(0));
    expect(screen.queryByText("Lead preview")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Enterprise expansion")[0]);
    expect(await screen.findByText("Lead preview")).toBeInTheDocument();
  });

  it("opens the shared drawer from a row and restores focus when it closes", async () => {
    render(
      <MemoryRouter initialEntries={["/app/sales-crm/leads"]}>
        <SalesCRMLeads />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getAllByText("Enterprise expansion").length).toBeGreaterThan(0));
    const row = screen.getAllByRole("row", { name: /Open lead for/ })[0];
    fireEvent.click(row);

    expect(await screen.findByRole("dialog", { name: /Lead$/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(document.activeElement).toBe(row));
  });

  it("supports visible selection and honest supported/unsupported actions", async () => {
    render(
      <MemoryRouter initialEntries={["/app/sales-crm/leads"]}>
        <SalesCRMLeads />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getAllByText("Enterprise expansion").length).toBeGreaterThan(0));
    const selectAll = screen.getAllByRole("checkbox", { name: "Select all visible leads" })[0];
    fireEvent.click(selectAll);
    expect(screen.getByRole("region", { name: "Bulk lead actions" })).toHaveTextContent("selected");
    expect(screen.getByRole("button", { name: "Assign to Maya Chen" })).toBeInTheDocument();
  });
});
