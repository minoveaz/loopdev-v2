import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import CommunicationsSettings from "@/loopdev/pages/settings/Communications";
import { localCommunicationsStore } from "@/loopdev/domains/communications/data/localCommunications";

describe("Communications settings", () => {
  it("shows local channel health and keeps future adapters unconnected", async () => {
    localCommunicationsStore.reset();
    render(
      <MemoryRouter initialEntries={["/app/settings/communications"]}>
        <CommunicationsSettings />
      </MemoryRouter>,
    );

    expect(await screen.findByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getAllByText("Prepared · not connected").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Templates" })).toBeInTheDocument();
    expect(screen.getByText("Communications kill-switch")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Enable communications kill-switch" })).toBeInTheDocument();
  });
});
