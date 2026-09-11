import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import Communications from "@/loopdev/pages/crm/Communications";
import { localCommunicationsAdapter } from "@/loopdev/domains/communications/adapter/local";
import { localCommunicationsStore } from "@/loopdev/domains/communications/data/localCommunications";
import { COMMUNICATIONS_LOCAL_CONTEXT } from "@/loopdev/domains/communications/types";

function renderInbox(initialEntries: string[] = ["/app/sales-crm/communications"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/app/sales-crm/communications" element={<Communications />} />
        <Route path="/app/sales-crm/communications/:conversationId" element={<Communications />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Communications collaboration UI", () => {
  beforeEach(() => localCommunicationsStore.reset());

  it("exposes ownership filters and assignment indicators", async () => {
    await localCommunicationsAdapter.assignConversation(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      COMMUNICATIONS_LOCAL_CONTEXT.userId,
      "Local operator",
      3,
    );
    renderInbox();
    expect(await screen.findByText("Local operator")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Mine/ }));
    expect(await screen.findByText("Aria Blackwood")).toBeInTheDocument();
    expect(screen.queryByText("Unknown WhatsApp number")).not.toBeInTheDocument();
  });

  it("shows viewing and drafting collaboration state in the thread", async () => {
    renderInbox(["/app/sales-crm/communications/conversation-aria"]);
    expect(await screen.findByText("Hi Maya, checking in on the workspace rollout.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open Conversation Operations" }));
    expect(await screen.findByText("Maya Chen is viewing")).toBeInTheDocument();
    const composer = screen.getByPlaceholderText("Write a WhatsApp reply…");
    fireEvent.change(composer, { target: { value: "Draft for the team" } });
    expect(await screen.findByText("Local operator is drafting a customer reply")).toBeInTheDocument();
  });
});
