import { beforeEach, describe, expect, it } from "vitest";
import { localCommunicationsAdapter } from "@/loopdev/domains/communications/adapter/local";
import { localCommunicationsStore } from "@/loopdev/domains/communications/data/localCommunications";
import { COMMUNICATIONS_LOCAL_CONTEXT } from "@/loopdev/domains/communications/types";

describe("Communications local collaboration", () => {
  beforeEach(() => localCommunicationsStore.reset());

  it("supports claim, transfer, unassign and explicit handoff with optimistic versions", async () => {
    const claimed = await localCommunicationsAdapter.claimConversation(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      3,
    );
    expect(claimed.assignedToUserId).toBe(COMMUNICATIONS_LOCAL_CONTEXT.userId);
    const transferred = await localCommunicationsAdapter.transferConversation(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      "owner-sam",
      "Sam Rivera",
      claimed.version,
    );
    expect(transferred.collaboration?.assignee).toMatchObject({ userId: "owner-sam", name: "Sam Rivera" });
    const handoff = await localCommunicationsAdapter.requestHandoff(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      "owner-maya",
      "Maya Chen",
      transferred.version,
    );
    expect(handoff.collaboration?.handoff).toMatchObject({ requestedToUserId: "owner-maya", status: "pending" });
    const unassigned = await localCommunicationsAdapter.unassignConversation(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      handoff.version,
    );
    expect(unassigned.assignedToUserId).toBeNull();
    await expect(localCommunicationsAdapter.claimConversation(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      3,
    )).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("keeps collaborators and watchers separate from ownership", async () => {
    const detail = await localCommunicationsAdapter.getConversation(COMMUNICATIONS_LOCAL_CONTEXT, "conversation-aria");
    const collaborator = await localCommunicationsAdapter.addConversationCollaborator(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      { userId: "owner-sam", name: "Sam Rivera", role: "agent" },
      detail!.summary.version,
    );
    const watcher = await localCommunicationsAdapter.addConversationWatcher(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      { userId: "owner-sam", name: "Sam Rivera", role: "agent" },
      collaborator.version,
    );
    expect(watcher.assignedToUserId).toBeNull();
    expect(watcher.collaboration?.collaborators).toHaveLength(2);
    expect(watcher.collaboration?.watchers).toHaveLength(2);
  });

  it("expires presence and drafting indicators according to their TTL", async () => {
    const detail = await localCommunicationsAdapter.getConversation(COMMUNICATIONS_LOCAL_CONTEXT, "conversation-aria");
    await localCommunicationsAdapter.setPresence(COMMUNICATIONS_LOCAL_CONTEXT, "conversation-aria", "viewing", 1_000);
    await localCommunicationsAdapter.setDrafting(COMMUNICATIONS_LOCAL_CONTEXT, "conversation-aria", "reply", 1_000);
    expect((await localCommunicationsAdapter.getConversation(COMMUNICATIONS_LOCAL_CONTEXT, "conversation-aria"))?.collaboration?.drafting).toHaveLength(1);
    localCommunicationsStore.setReferenceNow("2026-09-10T18:00:02.000Z");
    const expired = await localCommunicationsAdapter.getConversation(COMMUNICATIONS_LOCAL_CONTEXT, "conversation-aria");
    expect(expired?.collaboration?.presence.some((item) => item.userId === COMMUNICATIONS_LOCAL_CONTEXT.userId)).toBe(false);
    expect(expired?.collaboration?.drafting).toHaveLength(0);
    expect(detail).not.toBeNull();
  });

  it("enforces soft composer locks, supervisor takeover and idempotent ordered sends", async () => {
    const agentContext = { ...COMMUNICATIONS_LOCAL_CONTEXT, userId: "owner-maya" };
    const agentDetail = await localCommunicationsAdapter.getConversation(agentContext, "conversation-aria");
    const locked = await localCommunicationsAdapter.acquireComposerLock(agentContext, "conversation-aria", agentDetail!.summary.version);
    await expect(localCommunicationsAdapter.acquireComposerLock(
      { ...COMMUNICATIONS_LOCAL_CONTEXT, userId: "owner-daniel" },
      "conversation-aria",
      locked.summary.version,
    )).rejects.toMatchObject({ code: "CONFLICT" });
    const takenOver = await localCommunicationsAdapter.takeoverComposerLock(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      locked.summary.version,
    );
    const first = await localCommunicationsAdapter.sendReply(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      "Idempotent reply",
      takenOver.summary.version,
      "send-1",
    );
    const retry = await localCommunicationsAdapter.sendReply(
      COMMUNICATIONS_LOCAL_CONTEXT,
      "conversation-aria",
      "Idempotent reply",
      0,
      "send-1",
    );
    expect(retry.message.id).toBe(first.message.id);
    expect((await localCommunicationsAdapter.getConversation(COMMUNICATIONS_LOCAL_CONTEXT, "conversation-aria"))?.messages.at(-1)?.sequence).toBe(first.message.sequence);
    expect((await localCommunicationsAdapter.getConversation(COMMUNICATIONS_LOCAL_CONTEXT, "conversation-aria"))?.auditTrail?.some((event) => event.action === "message")).toBe(true);
  });
});
