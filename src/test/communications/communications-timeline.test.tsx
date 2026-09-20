import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConversationTimelineRail } from "@/loopdev/components/communications/ConversationTimelineRail";
import type { CommunicationMessage } from "@/loopdev/domains/communications";
import { I18nProvider } from "@/i18n";

const messages: CommunicationMessage[] = [
  {
    id: "message-text",
    conversationId: "conversation-test",
    direction: "inbound",
    body: "Hello",
    authorName: "Customer",
    occurredAt: "2026-09-10T10:00:00.000Z",
    deliveryStatus: null,
  },
  {
    id: "message-document",
    conversationId: "conversation-test",
    direction: "inbound",
    body: "Attached document",
    authorName: "Customer",
    occurredAt: "2026-09-10T10:05:00.000Z",
    deliveryStatus: null,
    contentType: "document",
  },
];

describe("ConversationTimelineRail", () => {
  it("renders semantic content markers and jumps to the related message", () => {
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    render(
      <I18nProvider>
        <div id="conversation-message-message-text" />
        <div id="conversation-message-message-document" />
        <ConversationTimelineRail messages={messages} />
      </I18nProvider>,
    );

    expect(screen.getByRole("complementary", { name: "Conversation timeline" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Document/ }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
  });
});
