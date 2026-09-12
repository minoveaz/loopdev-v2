import { describe, expect, it } from "vitest";
import { buildConversationContext, type ConversationDetail } from "@/loopdev/domains/communications";

describe("Conversation Context", () => {
  it("builds customer milestones for Copilot without treating agent media as customer context", () => {
    const detail = {
      summary: {
        id: "conversation-1",
        contact: { id: "contact-1", displayName: "Aria", phone: null, email: null, identityStatus: "verified" },
        channel: "whatsapp",
        status: "open",
      },
      messages: [
        { id: "inbound-text", conversationId: "conversation-1", direction: "inbound", body: "Hello", authorName: "Aria", occurredAt: "2026-09-10T09:00:00Z", deliveryStatus: null, contentType: "text" },
        { id: "outbound-document", conversationId: "conversation-1", direction: "outbound", body: "Here is the document", authorName: "Maya", occurredAt: "2026-09-10T09:05:00Z", deliveryStatus: "sent", contentType: "document", contentMetadata: { name: "reply.pdf" } },
        { id: "inbound-document", conversationId: "conversation-1", direction: "inbound", body: "Signed copy attached", authorName: "Aria", occurredAt: "2026-09-10T09:10:00Z", deliveryStatus: null, contentType: "document", contentMetadata: { name: "signed-contract.pdf" } },
      ],
    } as ConversationDetail;

    const context = buildConversationContext(detail);

    expect(context.milestones.map((milestone) => milestone.type)).toEqual(["conversation_started", "document_received"]);
    expect(context.milestones[1].searchableText).toContain("signed-contract.pdf");
  });
});
