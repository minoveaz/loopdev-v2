import { beforeEach, describe, expect, it } from "vitest";
import { localCommunicationsAdapter } from "@/loopdev/domains/communications/adapter/local";
import {
  localCommunicationChannels,
  localCommunicationsStore,
} from "@/loopdev/domains/communications/data/localCommunications";
import { COMMUNICATIONS_LOCAL_CONTEXT } from "@/loopdev/domains/communications/types";

describe("Communications local adapter", () => {
  beforeEach(() => localCommunicationsStore.reset());

  it("exposes every prepared channel while only WhatsApp is connected", async () => {
    const channels = await localCommunicationsAdapter.listChannels(COMMUNICATIONS_LOCAL_CONTEXT);
    expect(channels.map((channel) => channel.channel)).toEqual([
      "whatsapp",
      "email",
      "instagram",
      "facebook_messenger",
      "sms",
      "phone",
      "livechat",
    ]);
    expect(channels.find((channel) => channel.channel === "whatsapp")).toMatchObject({
      state: "connected",
      capabilities: { canReply: true },
    });
    expect(channels.find((channel) => channel.channel === "email")).toMatchObject({
      state: "coming_soon",
      capabilities: { canReply: false },
    });
  });

  it("filters conversations by channel, lifecycle, search, unread and starred state", async () => {
    const openUnread = await localCommunicationsAdapter.listConversations(COMMUNICATIONS_LOCAL_CONTEXT, {
      channel: "whatsapp",
      status: "open",
      unreadOnly: true,
    });
    expect(openUnread.items.map((item) => item.id)).toEqual(["conversation-aria", "conversation-unknown"]);

    const starred = await localCommunicationsAdapter.listConversations(COMMUNICATIONS_LOCAL_CONTEXT, { starredOnly: true });
    expect(starred.items.map((item) => item.id)).toEqual(["conversation-aria"]);

    const search = await localCommunicationsAdapter.listConversations(COMMUNICATIONS_LOCAL_CONTEXT, { query: "tomas" });
    expect(search.items[0].contact.displayName).toBe("Tomás Iglesias");
  });

  it("marks a conversation read, toggles starred state and enforces optimistic status updates", async () => {
    const detail = await localCommunicationsAdapter.getConversation(COMMUNICATIONS_LOCAL_CONTEXT, "conversation-aria");
    expect(detail?.messages.some((message) => message.direction === "internal")).toBe(true);
    expect(detail?.internalNotes).toHaveLength(1);
    expect(detail?.summary.unreadCount).toBe(2);

    const read = await localCommunicationsAdapter.markConversationRead(COMMUNICATIONS_LOCAL_CONTEXT, "conversation-aria");
    expect(read.unreadCount).toBe(0);
    const starred = await localCommunicationsAdapter.toggleConversationStar(COMMUNICATIONS_LOCAL_CONTEXT, "conversation-aria");
    expect(starred.starred).toBe(false);

    const pending = await localCommunicationsAdapter.updateConversationStatus(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      "pending",
      starred.version,
    );
    expect(pending).toMatchObject({ status: "pending", version: starred.version + 1 });
    await expect(localCommunicationsAdapter.updateConversationStatus(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      "closed",
      starred.version,
    )).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("creates queued replies and local-only internal notes through the adapter boundary", async () => {
    const detail = await localCommunicationsAdapter.getConversation(COMMUNICATIONS_LOCAL_CONTEXT, "conversation-aria");
    const reply = await localCommunicationsAdapter.sendReply(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      "The updated requirements are welcome.",
      detail!.summary.version,
    );
    expect(reply.message).toMatchObject({
      direction: "outbound",
      body: "The updated requirements are welcome.",
      deliveryStatus: "queued",
    });
    const note = await localCommunicationsAdapter.addInternalNote(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      "Review the requirements before the next call.",
      reply.summary.version,
    );
    expect(note.message).toMatchObject({ direction: "internal", deliveryStatus: null });
    expect((await localCommunicationsAdapter.getConversation(COMMUNICATIONS_LOCAL_CONTEXT, "conversation-aria"))?.internalNotes).toHaveLength(2);
  });

  it("gates replies with explicit policy, account and window errors", async () => {
    await expect(localCommunicationsAdapter.sendReply(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-unknown",
      "Can we help?",
      1,
    )).rejects.toMatchObject({ code: "TEMPLATE_REQUIRED" });

    const account = localCommunicationChannels.find((item) => item.channel === "whatsapp")!;
    const originalState = account.state;
    try {
      account.state = "disconnected";
      await expect(localCommunicationsAdapter.sendReply(
        COMMUNICATIONS_LOCAL_CONTEXT,
        "conversation-aria",
        "This should not send.",
        3,
      )).rejects.toMatchObject({ code: "ACCOUNT_DISCONNECTED" });
    } finally {
      account.state = originalState;
    }
  });

  it("supports assignment and lifecycle transitions with version conflicts", async () => {
    const assigned = await localCommunicationsAdapter.assignConversation(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      COMMUNICATIONS_LOCAL_CONTEXT.userId,
      "Local operator",
      3,
    );
    expect(assigned).toMatchObject({ assignedToUserId: COMMUNICATIONS_LOCAL_CONTEXT.userId, version: 4 });
    const snoozed = await localCommunicationsAdapter.updateConversationStatus(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      "snoozed",
      assigned.version,
    );
    expect(snoozed.status).toBe("snoozed");
    await expect(localCommunicationsAdapter.updateConversationStatus(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      "open",
      assigned.version,
    )).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(localCommunicationsAdapter.updateConversationStatus(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      "pending",
      snoozed.version,
    )).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
  });
});
