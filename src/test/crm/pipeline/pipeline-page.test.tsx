import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SalesCRMPipeline from "@/loopdev/pages/crm/Pipeline";
import { localCrmOpportunitiesStore } from "@/loopdev/domains/crm/data/localOpportunities";
import { I18nProvider } from "@/i18n";

describe("Pipeline page", () => {
  beforeEach(() => {
    localCrmOpportunitiesStore.reset();
  });

  it("renders stage columns and moves an opportunity", async () => {
    render(
      <I18nProvider><MemoryRouter initialEntries={["/app/sales-crm/pipeline"]}>
        <SalesCRMPipeline />
      </MemoryRouter></I18nProvider>,
    );

    expect(screen.getByRole("heading", { name: "Pipeline" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Enterprise expansion")).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Prospecting" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Negotiation" })).toBeInTheDocument();

    const actions = screen.getByRole("button", { name: "Opportunity actions for Enterprise expansion" });
    fireEvent.pointerDown(actions, { button: 0 });
    fireEvent.pointerUp(actions, { button: 0 });
    fireEvent.click(await screen.findByRole("menuitem", { name: "Negotiation" }));

    await waitFor(() => expect(screen.getByText("Stage updated.")).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Negotiation" })).toBeInTheDocument();
  });
});
