import {
  CommunicationsAdapterError,
  type CollaborationAgent,
  type CollaborationPresenceState,
  type ComposerMode,
  type CommunicationSendResult,
  type CommunicationMessage,
  type CommunicationChannelAccount,
  type CommunicationsAdapter,
  type CommunicationsContext,
  type ConversationDetail,
  type ConversationFilters,
  type ConversationListResult,
  type ConversationStatus,
  type ConversationSummary,
} from "../types";
import {
  localCommunicationChannels,
  localCommunicationsStore,
} from "../data/localCommunications";

function assertScope(context: CommunicationsContext): void {
  if (
    context.organizationId !== "local-development-organization" && context.userId !== "local-development-user"
    || context.workspaceId !== "local-workspace"
  ) {
    throw new CommunicationsAdapterError("The active communications scope is not available.", "INVALID_SCOPE");
  }
}

function actorFor(context: CommunicationsContext, name?: string): CollaborationAgent {
  return {
    userId: context.userId,
    name: name ?? (context.userId === "local-development-user" ? "Local operator" : context.userId),
    role: context.userId === "local-development-user" ? "supervisor" : "agent",
  };
}

function copyChannels(): CommunicationChannelAccount[] {
  return localCommunicationChannels.map((channel) => ({
    ...channel,
    capabilities: { ...channel.capabilities },
  }));
}

function matchesQuery(summary: ConversationSummary, query: string): boolean {
  if (!query) return true;
  return [
    summary.contact.displayName,
    summary.contact.phone ?? "",
    summary.contact.email ?? "",
    summary.preview ?? "",
  ].some((value) => value.toLocaleLowerCase().includes(query));
}

function sortByActivity(left: ConversationSummary, right: ConversationSummary): number {
  return new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime();
}

function toResult(items: ConversationSummary[]): ConversationListResult {
  const channelUnreadCounts: ConversationListResult["channelUnreadCounts"] = {};
  items.forEach((item) => {
    channelUnreadCounts[item.channel] = (channelUnreadCounts[item.channel] ?? 0) + item.unreadCount;
  });
  return {
    items: items.map((item) => ({ ...item, contact: { ...item.contact } })),
    total: items.length,
    unreadCount: items.reduce((sum, item) => sum + item.unreadCount, 0),
    channelUnreadCounts,
  };
}

function assertExpectedVersion(summary: ConversationSummary, expectedVersion: number): void {
  if (summary.version !== expectedVersion) {
    const modifier = summary.collaboration?.lastModifiedBy?.name;
    throw new CommunicationsAdapterError(
      modifier
        ? `Conversation changed by ${modifier}. Refresh and try again.`
        : "Conversation changed. Refresh and try again.",
      "CONFLICT",
    );
  }
}

function assertStatusTransition(current: ConversationStatus, next: ConversationStatus): void {
  const allowed: Record<ConversationStatus, ConversationStatus[]> = {
    open: ["open", "pending", "snoozed", "closed"],
    pending: ["pending", "open", "snoozed", "closed"],
    snoozed: ["snoozed", "open", "closed"],
    closed: ["closed", "open"],
  };
  if (!allowed[current].includes(next)) {
    throw new CommunicationsAdapterError(
      `A ${current} conversation cannot be changed directly to ${next}.`,
      "INVALID_STATUS_TRANSITION",
    );
  }
}

function actionContext(conversationId: string): {
  detail: ConversationDetail;
  account: CommunicationChannelAccount;
} {
  const detail = localCommunicationsStore.getDetail(conversationId);
  if (!detail) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
  const account = localCommunicationChannels.find((item) => item.id === detail.summary.accountId);
  if (!account) throw new CommunicationsAdapterError("Communication account is unavailable.", "CHANNEL_UNAVAILABLE");
  return { detail, account };
}

function assertConnected(account: CommunicationChannelAccount, action: "reply" | "note"): void {
  if (account.state === "disconnected") {
    throw new CommunicationsAdapterError(
      "The WhatsApp account is disconnected. Replies and internal notes are disabled.",
      "ACCOUNT_DISCONNECTED",
    );
  }
  if (account.state === "disabled") {
    throw new CommunicationsAdapterError(
      `${account.label} actions are disabled by channel policy.`,
      "POLICY_DISABLED",
    );
  }
  if (account.state !== "connected") {
    throw new CommunicationsAdapterError(
      account.state === "coming_soon"
        ? `${account.label} is coming soon and has no local actions.`
        : `${account.label} is not connected. Provider actions are disabled until the account is ready.`,
      "CHANNEL_UNAVAILABLE",
    );
  }
  if (action === "reply" && (account.policyState === "disabled" || !account.capabilities.canReply)) {
    throw new CommunicationsAdapterError(
      "Replies are disabled by channel policy. Reading and internal notes remain available.",
      "POLICY_DISABLED",
    );
  }
  if (action === "note" && !account.capabilities.canAddInternalNote) {
    throw new CommunicationsAdapterError("Internal notes are disabled for this channel.", "POLICY_DISABLED");
  }
}

function assertBody(body: string): string {
  const normalized = body.trim();
  if (!normalized) throw new CommunicationsAdapterError("Enter a message before sending.", "VALIDATION_ERROR");
  return normalized;
}

function sendLocalMessage(
  conversationId: string,
  body: string,
  expectedVersion: number | undefined,
  direction: "outbound" | "internal",
  actor: CollaborationAgent,
  idempotencyKey?: string,
  content?: Pick<CommunicationMessage, "contentType" | "contentMetadata">,
): CommunicationSendResult {
  const { detail, account } = actionContext(conversationId);
  if (idempotencyKey) {
    const previous = localCommunicationsStore.getIdempotentMessage(conversationId, idempotencyKey);
    if (previous) return previous;
  }
  if (direction === "outbound" && detail.collaboration?.composerLock
    && detail.collaboration.composerLock.userId !== actor.userId) {
    throw new CommunicationsAdapterError(
      `${detail.collaboration.composerLock.name} owns the reply composer.`,
      "CONFLICT",
    );
  }
  assertConnected(account, direction === "outbound" ? "reply" : "note");
  if (expectedVersion !== undefined) assertExpectedVersion(detail.summary, expectedVersion);
  const normalizedBody = assertBody(body);
  if (direction === "outbound" && detail.summary.windowExpiresAt
    && new Date(detail.summary.windowExpiresAt).getTime() <= new Date(localCommunicationsStore.referenceNow).getTime()) {
    throw new CommunicationsAdapterError(
      "The WhatsApp conversation window expired. An approved template is required; free-text replies are disabled.",
      "TEMPLATE_REQUIRED",
    );
  }
  const result = localCommunicationsStore.appendMessage(conversationId, {
    conversationId,
    direction,
    body: normalizedBody,
    authorName: direction === "internal" ? "Local operator" : "Local operator",
    deliveryStatus: direction === "outbound" ? "queued" : null,
    ...content,
  }, actor, idempotencyKey);
  if (!result) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
  return result;
}

async function mutateParticipants(
  context: CommunicationsContext,
  conversationId: string,
  expectedVersion: number,
  action: "collaborator" | "watcher",
  update: (collaboration: NonNullable<ConversationDetail["collaboration"]>) => NonNullable<ConversationDetail["collaboration"]>,
): Promise<ConversationSummary> {
  const detail = localCommunicationsStore.getDetail(conversationId);
  if (!detail) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
  assertExpectedVersion(detail.summary, expectedVersion);
  const updated = localCommunicationsStore.updateCollaboration(conversationId, update, actorFor(context), action);
  if (!updated) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
  return updated;
}

export const localCommunicationsAdapter: CommunicationsAdapter = {
  async listChannels(context) {
    assertScope(context);
    return copyChannels();
  },

  async listConversations(context, filters = {}) {
    assertScope(context);
    const query = filters.query?.trim().toLocaleLowerCase() ?? "";
    let items = localCommunicationsStore.listSummaries().filter((summary) => {
      if (filters.channel && filters.channel !== "all" && summary.channel !== filters.channel) return false;
      if (filters.status && filters.status !== "all" && summary.status !== filters.status) return false;
      if (filters.assignee === "mine" && summary.assignedToUserId !== context.userId) return false;
      if (filters.assignee === "unassigned" && summary.assignedToUserId !== null) return false;
      if (filters.unreadOnly && summary.unreadCount === 0) return false;
      if (filters.starredOnly && !summary.starred) return false;
      return matchesQuery(summary, query);
    });
    items = items.sort(sortByActivity);
    return toResult(items);
  },

  async getConversation(context, conversationId): Promise<ConversationDetail | null> {
    assertScope(context);
    const detail = localCommunicationsStore.getDetail(conversationId);
    return detail && (context.userId === "local-development-user" || detail.summary.organizationId === context.organizationId)
      ? detail
      : null;
  },

  async markConversationRead(context, conversationId) {
    assertScope(context);
    const updated = localCommunicationsStore.updateSummary(conversationId, (summary) => ({
      ...summary,
      unreadCount: 0,
      version: summary.version + 1,
    }));
    if (!updated) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    localCommunicationsStore.recordAudit(conversationId, "read", actorFor(context));
    return updated;
  },

  async toggleConversationStar(context, conversationId) {
    assertScope(context);
    const updated = localCommunicationsStore.updateSummary(conversationId, (summary) => ({
      ...summary,
      starred: !summary.starred,
      version: summary.version + 1,
    }));
    if (!updated) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    localCommunicationsStore.recordAudit(conversationId, "star", actorFor(context));
    return updated;
  },

  async updateConversationStatus(context, conversationId, status, expectedVersion) {
    assertScope(context);
    const updated = localCommunicationsStore.updateSummary(conversationId, (summary) => {
      if (summary.version !== expectedVersion) {
        throw new CommunicationsAdapterError("Conversation changed. Refresh and try again.", "CONFLICT");
      }
      assertStatusTransition(summary.status, status);
      return { ...summary, status, version: summary.version + 1 };
    });
    if (!updated) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    localCommunicationsStore.recordAudit(conversationId, "status", actorFor(context), status);
    return updated;
  },

  async assignConversation(context, conversationId, assigneeUserId, assigneeName, expectedVersion) {
    assertScope(context);
    const detail = localCommunicationsStore.getDetail(conversationId);
    if (!detail) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    assertExpectedVersion(detail.summary, expectedVersion);
    const updated = localCommunicationsStore.updateCollaboration(
      conversationId,
      (collaboration) => ({
        ...collaboration,
        assignee: assigneeUserId
          ? { userId: assigneeUserId, name: assigneeName ?? assigneeUserId, role: assigneeUserId === context.userId ? actorFor(context).role : "agent" }
          : null,
      }),
      actorFor(context),
      assigneeUserId ? "assign" : "unassign",
    );
    if (!updated) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    return {
      ...updated,
      assignedToUserId: assigneeUserId,
      assignedToName: assigneeName,
    };
  },
  async claimConversation(context, conversationId, expectedVersion) {
    return this.assignConversation(context, conversationId, context.userId, actorFor(context).name, expectedVersion);
  },
  async transferConversation(context, conversationId, assigneeUserId, assigneeName, expectedVersion) {
    assertScope(context);
    const detail = localCommunicationsStore.getDetail(conversationId);
    if (!detail) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    assertExpectedVersion(detail.summary, expectedVersion);
    const updated = localCommunicationsStore.updateCollaboration(
      conversationId,
      (collaboration) => ({
        ...collaboration,
        assignee: { userId: assigneeUserId, name: assigneeName, role: "agent" },
        handoff: null,
      }),
      actorFor(context),
      "transfer",
      true,
      `Transferred to ${assigneeName}`,
    );
    if (!updated) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    return { ...updated, assignedToUserId: assigneeUserId, assignedToName: assigneeName };
  },
  async unassignConversation(context, conversationId, expectedVersion) {
    return this.assignConversation(context, conversationId, null, null, expectedVersion);
  },
  async requestHandoff(context, conversationId, requestedToUserId, requestedToName, expectedVersion) {
    assertScope(context);
    const detail = localCommunicationsStore.getDetail(conversationId);
    if (!detail) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    assertExpectedVersion(detail.summary, expectedVersion);
    const updated = localCommunicationsStore.updateCollaboration(
      conversationId,
      (collaboration) => ({
        ...collaboration,
        handoff: {
          requestedByUserId: context.userId,
          requestedByName: actorFor(context).name,
          requestedToUserId,
          requestedToName,
          requestedAt: localCommunicationsStore.referenceNow,
          status: "pending",
        },
      }),
      actorFor(context),
      "handoff",
      true,
      `Handoff requested to ${requestedToName}`,
    );
    if (!updated) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    return updated;
  },
  async addConversationCollaborator(context, conversationId, collaborator, expectedVersion) {
    return mutateParticipants(context, conversationId, expectedVersion, "collaborator", (collaboration) => ({
      ...collaboration,
      collaborators: collaboration.collaborators.some((item) => item.userId === collaborator.userId)
        ? collaboration.collaborators
        : [...collaboration.collaborators, { ...collaborator }],
    }));
  },
  async removeConversationCollaborator(context, conversationId, userId, expectedVersion) {
    return mutateParticipants(context, conversationId, expectedVersion, "collaborator", (collaboration) => ({
      ...collaboration,
      collaborators: collaboration.collaborators.filter((item) => item.userId !== userId),
    }));
  },
  async addConversationWatcher(context, conversationId, watcher, expectedVersion) {
    return mutateParticipants(context, conversationId, expectedVersion, "watcher", (collaboration) => ({
      ...collaboration,
      watchers: collaboration.watchers.some((item) => item.userId === watcher.userId)
        ? collaboration.watchers
        : [...collaboration.watchers, { ...watcher }],
    }));
  },
  async removeConversationWatcher(context, conversationId, userId, expectedVersion) {
    return mutateParticipants(context, conversationId, expectedVersion, "watcher", (collaboration) => ({
      ...collaboration,
      watchers: collaboration.watchers.filter((item) => item.userId !== userId),
    }));
  },
  async setPresence(context, conversationId, state: CollaborationPresenceState, ttlMs = 60_000) {
    assertScope(context);
    const detail = localCommunicationsStore.getDetail(conversationId);
    if (!detail?.collaboration) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    const timestamp = localCommunicationsStore.referenceNow;
    const presence = {
      userId: context.userId,
      name: actorFor(context).name,
      state,
      lastSeenAt: timestamp,
      expiresAt: new Date(new Date(timestamp).getTime() + ttlMs).toISOString(),
    };
    localCommunicationsStore.updateCollaboration(conversationId, (collaboration) => ({
      ...collaboration,
      presence: [...collaboration.presence.filter((item) => item.userId !== context.userId), presence],
    }), actorFor(context), "presence", false, state);
    const next = localCommunicationsStore.getDetail(conversationId);
    if (!next) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    return next;
  },
  async setDrafting(context, conversationId, mode: ComposerMode | null, ttlMs = 10_000) {
    assertScope(context);
    const detail = localCommunicationsStore.getDetail(conversationId);
    if (!detail?.collaboration) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    const timestamp = localCommunicationsStore.referenceNow;
    localCommunicationsStore.updateCollaboration(conversationId, (collaboration) => ({
      ...collaboration,
      drafting: mode
        ? [...collaboration.drafting.filter((item) => item.userId !== context.userId), {
          userId: context.userId,
          name: actorFor(context).name,
          mode,
          startedAt: timestamp,
          expiresAt: new Date(new Date(timestamp).getTime() + ttlMs).toISOString(),
        }]
        : collaboration.drafting.filter((item) => item.userId !== context.userId),
    }), actorFor(context), "drafting", false, mode ?? "stopped");
    const next = localCommunicationsStore.getDetail(conversationId);
    if (!next) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    return next;
  },
  async acquireComposerLock(context, conversationId, expectedVersion, ttlMs = 30_000) {
    assertScope(context);
    const detail = localCommunicationsStore.getDetail(conversationId);
    if (!detail?.collaboration) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    assertExpectedVersion(detail.summary, expectedVersion);
    const lock = detail.collaboration.composerLock;
    if (lock && lock.userId !== context.userId) {
      throw new CommunicationsAdapterError(`${lock.name} is drafting a reply. Take over the composer to continue.`, "CONFLICT");
    }
    const timestamp = localCommunicationsStore.referenceNow;
    const updated = localCommunicationsStore.updateCollaboration(conversationId, (collaboration) => ({
      ...collaboration,
      composerLock: {
        userId: context.userId,
        name: actorFor(context).name,
        mode: "reply",
        acquiredAt: timestamp,
        expiresAt: new Date(new Date(timestamp).getTime() + ttlMs).toISOString(),
      },
    }), actorFor(context), "lock");
    if (!updated) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    const next = localCommunicationsStore.getDetail(conversationId);
    if (!next) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    return next;
  },
  async releaseComposerLock(context, conversationId) {
    assertScope(context);
    const detail = localCommunicationsStore.getDetail(conversationId);
    if (!detail?.collaboration) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    if (detail.collaboration.composerLock?.userId !== context.userId) {
      throw new CommunicationsAdapterError("Only the composer owner can release this lock.", "FORBIDDEN");
    }
    localCommunicationsStore.updateCollaboration(conversationId, (collaboration) => ({ ...collaboration, composerLock: null }), actorFor(context), "lock", false, "released");
    const next = localCommunicationsStore.getDetail(conversationId);
    if (!next) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    return next;
  },
  async takeoverComposerLock(context, conversationId, expectedVersion) {
    assertScope(context);
    const actor = actorFor(context);
    if (actor.role !== "supervisor") throw new CommunicationsAdapterError("Supervisor permission is required to take over the composer.", "FORBIDDEN");
    const detail = localCommunicationsStore.getDetail(conversationId);
    if (!detail?.collaboration) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    assertExpectedVersion(detail.summary, expectedVersion);
    const previous = detail.collaboration.composerLock;
    const timestamp = localCommunicationsStore.referenceNow;
    const updated = localCommunicationsStore.updateCollaboration(conversationId, (collaboration) => ({
      ...collaboration,
      composerLock: {
        userId: context.userId,
        name: actor.name,
        mode: "reply",
        acquiredAt: timestamp,
        expiresAt: new Date(new Date(timestamp).getTime() + 30_000).toISOString(),
        takenOverFromUserId: previous?.userId,
      },
    }), actor, "lock", true, previous ? `Taken over from ${previous.name}` : "Taken over");
    if (!updated) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    const next = localCommunicationsStore.getDetail(conversationId);
    if (!next) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    return next;
  },

  async sendReply(context, conversationId, body, expectedVersion, idempotencyKey, content) {
    assertScope(context);
    return sendLocalMessage(conversationId, body, expectedVersion, "outbound", actorFor(context), idempotencyKey, content);
  },

  async addInternalNote(context, conversationId, body, expectedVersion, idempotencyKey) {
    assertScope(context);
    return sendLocalMessage(conversationId, body, expectedVersion, "internal", actorFor(context), idempotencyKey);
  },
};
