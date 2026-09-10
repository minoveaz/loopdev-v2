import {
  CommunicationsAdapterError,
  type CommunicationSendResult,
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
    context.organizationId !== "local-development-organization"
    || context.workspaceId !== "local-workspace"
  ) {
    throw new CommunicationsAdapterError("The active communications scope is not available.", "INVALID_SCOPE");
  }
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
    throw new CommunicationsAdapterError("Conversation changed. Refresh and try again.", "CONFLICT");
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
): CommunicationSendResult {
  const { detail, account } = actionContext(conversationId);
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
  });
  if (!result) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
  return result;
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
    return detail && detail.summary.organizationId === context.organizationId ? detail : null;
  },

  async markConversationRead(context, conversationId) {
    assertScope(context);
    const updated = localCommunicationsStore.updateSummary(conversationId, (summary) => ({
      ...summary,
      unreadCount: 0,
      version: summary.version + 1,
    }));
    if (!updated) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
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
    return updated;
  },

  async assignConversation(context, conversationId, assigneeUserId, assigneeName, expectedVersion) {
    assertScope(context);
    const updated = localCommunicationsStore.updateSummary(conversationId, (summary) => {
      assertExpectedVersion(summary, expectedVersion);
      return {
        ...summary,
        assignedToUserId: assigneeUserId,
        assignedToName: assigneeName,
        version: summary.version + 1,
      };
    });
    if (!updated) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    return updated;
  },

  async sendReply(context, conversationId, body, expectedVersion) {
    assertScope(context);
    return sendLocalMessage(conversationId, body, expectedVersion, "outbound");
  },

  async addInternalNote(context, conversationId, body, expectedVersion) {
    assertScope(context);
    return sendLocalMessage(conversationId, body, expectedVersion, "internal");
  },
};
