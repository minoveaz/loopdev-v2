import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Communications from "@/loopdev/pages/crm/Communications";
import { localCommunicationsStore } from "@/loopdev/domains/communications/data/localCommunications";
import { localPlatformTasksStore } from "@/loopdev/domains/platform";

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

function openContext(view: "CRM Context" | "Operations") {
  fireEvent.click(screen.getByRole("button", { name: view === "CRM Context" ? "Open CRM workspace" : "Open Conversation Operations" }));
  fireEvent.click(screen.getByRole("tab", { name: view }));
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

  it("sends a direct customer reply and keeps internal notes in Operations", async () => {
    localCommunicationsStore.reset();
    renderInbox(["/app/sales-crm/communications/conversation-aria"]);

    expect(await screen.findByText("Hi Maya, checking in on the workspace rollout.")).toBeInTheDocument();
    const replyInput = screen.getByPlaceholderText("Write a WhatsApp reply…");
    fireEvent.change(replyInput, { target: { value: "Thanks, Aria." } });
    fireEvent.click(await screen.findByRole("button", { name: "Send reply" }));
    expect(await screen.findByText("Thanks, Aria.")).toBeInTheDocument();
    expect(screen.getByText("Queued")).toBeInTheDocument();

    expect(screen.queryByRole("tab", { name: "Internal note" })).not.toBeInTheDocument();
    openContext("Operations");
    const noteInput = await screen.findByPlaceholderText("Add a private conversation note…");
    fireEvent.change(noteInput, { target: { value: "Check the requirements." } });
    fireEvent.click(await screen.findByRole("button", { name: "Add internal note" }));
    await waitFor(() => expect(screen.getByText("Check the requirements.")).toBeInTheDocument());
  });

  it("disables free-text replies when the WhatsApp window requires a template", async () => {
    localCommunicationsStore.reset();
    renderInbox(["/app/sales-crm/communications/conversation-unknown"]);

    expect(await screen.findByText(/WhatsApp window expired/)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Customer reply to Unknown WhatsApp number" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send reply" })).toBeDisabled();
  });

  it("opens and closes the contextual CRM workspace without losing the thread", async () => {
    localCommunicationsStore.reset();
    renderInbox(["/app/sales-crm/communications/conversation-aria"]);

    expect(await screen.findByText("Hi Maya, checking in on the workspace rollout.")).toBeInTheDocument();
    openContext("CRM Context");

    expect(await screen.findByRole("heading", { name: "CRM Workspace" })).toBeInTheDocument();
    expect(screen.getAllByText("Aria Blackwood").length).toBeGreaterThan(1);
    expect(screen.queryByRole("heading", { name: "Conversation Operations" })).not.toBeInTheDocument();
    expect(screen.queryByText("Audit trail")).not.toBeInTheDocument();
    expect(screen.queryByText("Conversation internal notes")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close CRM workspace" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "CRM Workspace" })).not.toBeInTheDocument());
    expect(screen.getByText("Hi Maya, checking in on the workspace rollout.")).toBeInTheDocument();
  });

  it("opens and closes Conversation Operations without losing the customer thread", async () => {
    localCommunicationsStore.reset();
    renderInbox(["/app/sales-crm/communications/conversation-aria"]);

    expect(await screen.findByText("Hi Maya, checking in on the workspace rollout.")).toBeInTheDocument();
    openContext("Operations");
    expect(await screen.findByRole("heading", { name: "Conversation Operations" })).toBeInTheDocument();
    expect(screen.getByText("Audit trail")).toBeInTheDocument();
    expect(screen.getByText("Conversation internal notes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close Conversation Operations" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Conversation Operations" })).not.toBeInTheDocument());
    expect(screen.getByText("Hi Maya, checking in on the workspace rollout.")).toBeInTheDocument();
  });

  it("navigates workspace tabs and runs contextual task and note actions", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(() => ({
      matches: true,
      media: "(min-width: 1024px)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList);
    localCommunicationsStore.reset();
    localPlatformTasksStore.reset();
    renderInbox(["/app/sales-crm/communications/conversation-aria"]);

    await screen.findByText("Hi Maya, checking in on the workspace rollout.");
    openContext("CRM Context");
    expect(await screen.findByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("tab", { name: "Lead" }));
    expect(await screen.findByText("Lead details")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Work" }));
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByLabelText("Task title"), { target: { value: "Call Aria tomorrow" } });
    fireEvent.click(screen.getByRole("button", { name: "Save task" }));
    expect(await screen.findByText("Call Aria tomorrow")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close CRM workspace" }));
    vi.restoreAllMocks();
  });

  it("supports mobile-style thread back navigation without losing filters", async () => {
    localCommunicationsStore.reset();
    renderInbox();

    await screen.findByText("Aria Blackwood");
    fireEvent.change(screen.getByPlaceholderText("Search conversations"), { target: { value: "Aria" } });
    await screen.findByText("Aria Blackwood");
    fireEvent.click(screen.getByText("Aria Blackwood"));

    expect(await screen.findByRole("button", { name: "Back to conversations" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to conversations" }));
    expect(await screen.findByPlaceholderText("Search conversations")).toHaveValue("Aria");
    expect(screen.getByText("Aria Blackwood")).toBeInTheDocument();
  });
});
