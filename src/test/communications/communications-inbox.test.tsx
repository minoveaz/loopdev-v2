import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Communications from "@/loopdev/pages/crm/Communications";
import { localCommunicationsStore } from "@/loopdev/domains/communications/data/localCommunications";

function renderInbox(initialEntries: string[] = ["/app/sales-crm/communications"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/app/sales-crm/communications" element={<Communications />} />
        <Route path="/app/sales-crm/communications/:conversationId" element={<Communications />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Communications Inbox", () => {
  it("renders channel readiness and filters the conversation list by search", async () => {
    localCommunicationsStore.reset();
    renderInbox();

    expect(await screen.findByText("Aria Blackwood")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getAllByTitle("Prepared for a future channel adapter").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText("Search conversations"), { target: { value: "Tomás" } });
    await waitFor(() => {
      expect(screen.getByText("Tomás Iglesias")).toBeInTheDocument();
      expect(screen.queryByText("Aria Blackwood")).not.toBeInTheDocument();
    });
  });

  it("shows an empty state when a filter has no matching conversations", async () => {
    localCommunicationsStore.reset();
    renderInbox();

    await screen.findByText("Aria Blackwood");
    fireEvent.change(screen.getByPlaceholderText("Search conversations"), { target: { value: "not-a-contact" } });
    expect(await screen.findByText("No conversations found")).toBeInTheDocument();
    expect(screen.getByText("Try clearing a filter or search term.")).toBeInTheDocument();
  });

  it("sends a local reply and an internal note with separate composer modes", async () => {
    localCommunicationsStore.reset();
    renderInbox(["/app/sales-crm/communications/conversation-aria"]);

    expect(await screen.findByText("Hi Maya, checking in on the workspace rollout.")).toBeInTheDocument();
    const replyInput = screen.getByPlaceholderText("Write a WhatsApp reply…");
    fireEvent.change(replyInput, { target: { value: "Thanks, Aria." } });
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));
    expect(await screen.findByText("Thanks, Aria.")).toBeInTheDocument();
    expect(screen.getByText("Queued")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Internal note" }));
    const noteInput = screen.getByPlaceholderText("Add an internal note…");
    fireEvent.change(noteInput, { target: { value: "Check the requirements." } });
    fireEvent.click(screen.getByRole("button", { name: "Add internal note" }));
    expect(await screen.findByText("Check the requirements.")).toBeInTheDocument();
  });

  it("disables free-text replies when the WhatsApp window requires a template", async () => {
    localCommunicationsStore.reset();
    renderInbox(["/app/sales-crm/communications/conversation-unknown"]);

    expect(await screen.findByText(/WhatsApp window expired/)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Reply" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send reply" })).toBeDisabled();
  });
});
