import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
import { localCommunicationsAdapter } from "./local";
import {
  CommunicationsAdapterError,
  type CollaborationAgent,
  type CollaborationPresenceState,
  type ComposerMode,
  type CommunicationChannelAccount,
  type CommunicationMessage,
  type CommunicationsAdapter,
  type CommunicationsContext,
  type ConversationCollaboration,
  type ConversationDetail,
  type ConversationFilters,
  type ConversationListResult,
  type ConversationStatus,
  type ConversationSummary,
} from "../types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCAL_ORGANIZATION_ID = "local-development-organization";
const LOCAL_WORKSPACE_ID = "local-workspace";

function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isLocal(context: CommunicationsContext): boolean {
  return context.organizationId === LOCAL_ORGANIZATION_ID || !isUuid(context.organizationId);
}

function clientOrThrow() {
  const client = defaultWebAuthAdapter.getClient();
  if (!client) throw new CommunicationsAdapterError("Supabase is not configured for the active organization.", "INVALID_SCOPE");
  return client;
}

function actor(context: CommunicationsContext, name?: string): CollaborationAgent {
  return { userId: context.userId, name: name ?? context.userId, role: "agent" };
}

function emptyCollaboration(): ConversationCollaboration {
  return {
    assignee: null,
    collaborators: [],
    watchers: [],
    presence: [],
    drafting: [],
    composerLock: null,
    handoff: null,
    lastModifiedBy: null,
  };
}

function collaborationFromRow(value: unknown): ConversationCollaboration {
  if (!value || typeof value !== "object") return emptyCollaboration();
  const parsed = value as Partial<ConversationCollaboration>;
  return {
    ...emptyCollaboration(),
    ...parsed,
    collaborators: parsed.collaborators ?? [],
    watchers: parsed.watchers ?? [],
    presence: parsed.presence ?? [],
    drafting: parsed.drafting ?? [],
  };
}

function auditFromRow(value: unknown, conversationId: string) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ConversationDetail["auditTrail"][number] => Boolean(item && typeof item === "object" && item.conversationId === conversationId));
}

function connectionState(status: string): CommunicationChannelAccount["state"] {
  if (status === "connected" || status === "disconnected" || status === "pending" || status === "error") return status;
  return "error";
}

function accountFromRow(row: any): CommunicationChannelAccount {
  const metadata = row.provider_metadata && typeof row.provider_metadata === "object" ? row.provider_metadata : {};
  return {
    id: row.id,
    channel: row.channel,
    label: metadata.label ?? row.external_account_id ?? row.channel,
    state: connectionState(row.status),
    statusMessage: metadata.statusMessage ?? row.last_error_code ?? row.status,
    policyState: row.outbound_enabled === false ? "disabled" : "enabled",
    capabilities: {
      canReply: row.outbound_enabled !== false && metadata.capabilities?.canReply !== false,
      canAddInternalNote: metadata.capabilities?.canAddInternalNote !== false,
      supportsTemplates: metadata.capabilities?.supportsTemplates === true,
      supportsAttachments: metadata.capabilities?.supportsAttachments === true,
      supportsRichContent: metadata.capabilities?.supportsRichContent === true,
      supportsVoice: metadata.capabilities?.supportsVoice === true,
    },
  };
}

function messageFromRow(row: any, directionOverride?: CommunicationMessage["direction"]): CommunicationMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    direction: directionOverride ?? row.direction,
    body: row.body ?? "",
    authorName: row.author_name ?? row.author?.full_name ?? row.direction,
    occurredAt: row.created_at,
    deliveryStatus: row.status ?? null,
    contentType: row.content_type ?? "text",
    contentMetadata: row.content_metadata ?? undefined,
  };
}

function contactFromRow(row: any) {
  const contact = row.contact ?? row.crm_contacts ?? {};
  const displayName = [contact.preferred_name, contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.phone || contact.email || "Unknown contact";
  return {
    id: contact.id ?? row.contact_id,
    displayName,
    phone: contact.phone ?? null,
    email: contact.email ?? null,
    identityStatus: contact.identity_status === "pending_identity_review" ? "pending_identity_review" as const : "verified" as const,
  };
}

function summaryFromRow(row: any): ConversationSummary {
  const channel = row.channel_record ?? row.communication_channels ?? {};
  const account = row.account ?? row.communication_accounts ?? {};
  const collaboration = collaborationFromRow(row.collaboration);
  const assigneeId = row.assigned_to_user_id ?? collaboration.assignee?.userId ?? null;
  const assigneeName = collaboration.assignee?.name ?? null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    workspaceId: row.workspace_id ?? "",
    accountId: channel.account_id ?? row.account_id ?? account.id,
    channelId: row.channel_id,
    channel: row.channel,
    contact: contactFromRow(row),
    status: row.status,
    assignedToUserId: assigneeId,
    assignedToName: assigneeName,
    unreadCount: row.unread_count ?? 0,
    starred: Boolean(row.starred),
    preview: row.preview ?? null,
    lastMessageAt: row.last_activity_at ?? row.updated_at ?? null,
    lastActivityAt: row.last_activity_at ?? row.updated_at,
    lastInboundAt: row.last_inbound_at ?? null,
    windowExpiresAt: row.window_expires_at ?? null,
    version: row.version ?? 1,
    collaboration,
  };
}

function communicationError(error: any): CommunicationsAdapterError {
  if (error instanceof CommunicationsAdapterError) return error;
  if (error?.code === "42501") return new CommunicationsAdapterError(error.message ?? "You do not have permission for this communication.", "FORBIDDEN");
  if (error?.code === "23505") return new CommunicationsAdapterError("This communication already exists.", "CONFLICT");
  return new CommunicationsAdapterError(error?.message ?? "The communications operation failed.", "VALIDATION_ERROR");
}

function assertStatusTransition(current: ConversationStatus, next: ConversationStatus): void {
  const allowed: Record<ConversationStatus, ConversationStatus[]> = {
    open: ["open", "pending", "snoozed", "closed"],
    pending: ["pending", "open", "snoozed", "closed"],
    snoozed: ["snoozed", "open", "closed"],
    closed: ["closed", "open"],
  };
  if (!allowed[current].includes(next)) throw new CommunicationsAdapterError(`A ${current} conversation cannot be changed directly to ${next}.`, "INVALID_STATUS_TRANSITION");
}

function assertBody(body: string): string {
  const value = body.trim();
  if (!value) throw new CommunicationsAdapterError("Enter a message before sending.", "VALIDATION_ERROR");
  return value;
}

async function fetchDetail(context: CommunicationsContext, conversationId: string): Promise<ConversationDetail | null> {
  const client = clientOrThrow();
  let query = client.from("communication_conversations").select("*, contact:crm_contacts(*), channel_record:communication_channels(*), account:communication_accounts(*)").eq("id", conversationId).eq("organization_id", context.organizationId);
  if (isUuid(context.workspaceId)) query = query.or(`workspace_id.is.null,workspace_id.eq.${context.workspaceId}`);
  const { data: row, error } = await query.maybeSingle();
  if (error) throw error;
  if (!row) return null;
  const [messagesResult, notesResult] = await Promise.all([
    client.from("communication_messages").select("*").eq("conversation_id", conversationId).eq("organization_id", context.organizationId).order("created_at", { ascending: true }),
    client.from("communication_internal_notes").select("*").eq("conversation_id", conversationId).eq("organization_id", context.organizationId).order("created_at", { ascending: true }),
  ]);
  if (messagesResult.error) throw messagesResult.error;
  if (notesResult.error) throw notesResult.error;
  const summary = summaryFromRow(row);
  return {
    summary,
    messages: (messagesResult.data ?? []).map((message: any) => messageFromRow(message)),
    internalNotes: (notesResult.data ?? []).map((note: any) => messageFromRow({ ...note, conversation_id: note.conversation_id, created_at: note.created_at, status: null, body: note.body, author_name: note.author_name }, "internal")),
    collaboration: summary.collaboration,
    auditTrail: auditFromRow(row.audit_trail, conversationId),
  };
}

async function saveConversation(context: CommunicationsContext, current: ConversationDetail, patch: Record<string, unknown>, action?: ConversationDetail["auditTrail"][number]["action"], details?: string): Promise<ConversationSummary> {
  const client = clientOrThrow();
  const collaboration = current.summary.collaboration ?? emptyCollaboration();
  const auditTrail = current.auditTrail ?? [];
  const nextAudit = action ? [...auditTrail, { id: crypto.randomUUID(), conversationId: current.summary.id, action, actor: actor(context), occurredAt: new Date().toISOString(), sequence: auditTrail.length + 1, details }] : auditTrail;
  const { data, error } = await client.from("communication_conversations").update({
    ...patch,
    collaboration,
    audit_trail: nextAudit,
    version: current.summary.version + 1,
    updated_at: new Date().toISOString(),
  }).eq("id", current.summary.id).eq("organization_id", context.organizationId).eq("version", current.summary.version).select("*").maybeSingle();
  if (error) throw error;
  if (!data) throw new CommunicationsAdapterError("Conversation changed. Refresh and try again.", "CONFLICT");
  return summaryFromRow({ ...current.summary, ...data, contact: current.summary.contact, collaboration });
}

async function mutateCollaboration(context: CommunicationsContext, conversationId: string, expectedVersion: number | undefined, update: (value: ConversationCollaboration) => ConversationCollaboration, action: ConversationDetail["auditTrail"][number]["action"], details?: string): Promise<ConversationDetail> {
  const current = await fetchDetail(context, conversationId);
  if (!current) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
  if (expectedVersion !== undefined && current.summary.version !== expectedVersion) throw new CommunicationsAdapterError("Conversation changed. Refresh and try again.", "CONFLICT");
  const collaboration = update(current.summary.collaboration ?? emptyCollaboration());
  await saveConversation(context, current, { collaboration }, action, details);
  const next = await fetchDetail(context, conversationId);
  if (!next) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
  return next;
}

export const supabaseCommunicationsAdapter: CommunicationsAdapter = {
  async listChannels(context) {
    if (isLocal(context)) return localCommunicationsAdapter.listChannels(context);
    try {
      const { data, error } = await clientOrThrow().from("communication_accounts").select("*").eq("organization_id", context.organizationId).order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(accountFromRow);
    } catch (error) {
      throw communicationError(error);
    }
  },

  async listConversations(context, filters = {}) {
    if (isLocal(context)) return localCommunicationsAdapter.listConversations(context, filters);
    try {
      const client = clientOrThrow();
      let query = client.from("communication_conversations").select("*, contact:crm_contacts(*), channel_record:communication_channels(*), account:communication_accounts(*)").eq("organization_id", context.organizationId).order("last_activity_at", { ascending: false });
      if (isUuid(context.workspaceId)) query = query.or(`workspace_id.is.null,workspace_id.eq.${context.workspaceId}`);
      const { data, error } = await query;
      if (error) throw error;
      let items = (data ?? []).map(summaryFromRow);
      const search = filters.query?.trim().toLowerCase() ?? "";
      items = items.filter((item) => {
        if (filters.channel && filters.channel !== "all" && item.channel !== filters.channel) return false;
        if (filters.status && filters.status !== "all" && item.status !== filters.status) return false;
        if (filters.assignee === "mine" && item.assignedToUserId !== context.userId) return false;
        if (filters.assignee === "unassigned" && item.assignedToUserId !== null) return false;
        if (filters.unreadOnly && item.unreadCount === 0) return false;
        if (filters.starredOnly && !item.starred) return false;
        if (search && ![item.contact.displayName, item.contact.phone ?? "", item.contact.email ?? "", item.preview ?? ""].some((value) => value.toLowerCase().includes(search))) return false;
        return true;
      });
      const channelUnreadCounts: ConversationListResult["channelUnreadCounts"] = {};
      items.forEach((item) => { channelUnreadCounts[item.channel] = (channelUnreadCounts[item.channel] ?? 0) + item.unreadCount; });
      return { items, total: items.length, unreadCount: items.reduce((sum, item) => sum + item.unreadCount, 0), channelUnreadCounts };
    } catch (error) {
      throw communicationError(error);
    }
  },

  async getConversation(context, conversationId) {
    if (isLocal(context)) return localCommunicationsAdapter.getConversation(context, conversationId);
    try { return await fetchDetail(context, conversationId); } catch (error) { throw communicationError(error); }
  },

  async markConversationRead(context, conversationId) {
    if (isLocal(context)) return localCommunicationsAdapter.markConversationRead(context, conversationId);
    const current = await fetchDetail(context, conversationId);
    if (!current) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    try {
      return await saveConversation(context, current, { unread_count: 0, last_read_at: new Date().toISOString() }, "read");
    } catch (error) { throw communicationError(error); }
  },

  async toggleConversationStar(context, conversationId) {
    if (isLocal(context)) return localCommunicationsAdapter.toggleConversationStar(context, conversationId);
    const current = await fetchDetail(context, conversationId);
    if (!current) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    try { return await saveConversation(context, current, { starred: !current.summary.starred }, "star"); } catch (error) { throw communicationError(error); }
  },

  async updateConversationStatus(context, conversationId, status, expectedVersion) {
    if (isLocal(context)) return localCommunicationsAdapter.updateConversationStatus(context, conversationId, status, expectedVersion);
    const current = await fetchDetail(context, conversationId);
    if (!current) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    assertStatusTransition(current.summary.status, status);
    try { return await saveConversation(context, current, { status }, "status", status); } catch (error) { throw communicationError(error); }
  },

  async assignConversation(context, conversationId, assigneeUserId, assigneeName, expectedVersion) {
    if (isLocal(context)) return localCommunicationsAdapter.assignConversation(context, conversationId, assigneeUserId, assigneeName, expectedVersion);
    const current = await fetchDetail(context, conversationId);
    if (!current) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    const collaboration = { ...(current.summary.collaboration ?? emptyCollaboration()), assignee: assigneeUserId ? { userId: assigneeUserId, name: assigneeName ?? assigneeUserId, role: "agent" as const } : null, lastModifiedBy: actor(context) };
    try { return await saveConversation(context, current, { assigned_to_user_id: assigneeUserId, collaboration }, assigneeUserId ? "assign" : "unassign", assigneeName ?? undefined); } catch (error) { throw communicationError(error); }
  },

  async claimConversation(context, conversationId, expectedVersion) {
    return this.assignConversation(context, conversationId, context.userId, context.userId, expectedVersion);
  },
  async transferConversation(context, conversationId, assigneeUserId, assigneeName, expectedVersion) {
    if (isLocal(context)) return localCommunicationsAdapter.transferConversation(context, conversationId, assigneeUserId, assigneeName, expectedVersion);
    return this.assignConversation(context, conversationId, assigneeUserId, assigneeName, expectedVersion);
  },
  async unassignConversation(context, conversationId, expectedVersion) {
    return this.assignConversation(context, conversationId, null, null, expectedVersion);
  },

  async requestHandoff(context, conversationId, requestedToUserId, requestedToName, expectedVersion) {
    if (isLocal(context)) return localCommunicationsAdapter.requestHandoff(context, conversationId, requestedToUserId, requestedToName, expectedVersion);
    const current = await fetchDetail(context, conversationId);
    if (!current) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    try {
      return (await mutateCollaboration(context, conversationId, expectedVersion, (collaboration) => ({ ...collaboration, handoff: { requestedByUserId: context.userId, requestedByName: context.userId, requestedToUserId, requestedToName, requestedAt: new Date().toISOString(), status: "pending" } }), "handoff", `Handoff requested to ${requestedToName}`)).summary;
    } catch (error) { throw communicationError(error); }
  },

  async addConversationCollaborator(context, conversationId, collaborator, expectedVersion) {
    if (isLocal(context)) return localCommunicationsAdapter.addConversationCollaborator(context, conversationId, collaborator, expectedVersion);
    return (await mutateCollaboration(context, conversationId, expectedVersion, (value) => ({ ...value, collaborators: value.collaborators.some((item) => item.userId === collaborator.userId) ? value.collaborators : [...value.collaborators, collaborator], lastModifiedBy: actor(context) }), "collaborator")).summary;
  },
  async removeConversationCollaborator(context, conversationId, userId, expectedVersion) {
    if (isLocal(context)) return localCommunicationsAdapter.removeConversationCollaborator(context, conversationId, userId, expectedVersion);
    return (await mutateCollaboration(context, conversationId, expectedVersion, (value) => ({ ...value, collaborators: value.collaborators.filter((item) => item.userId !== userId), lastModifiedBy: actor(context) }), "collaborator")).summary;
  },
  async addConversationWatcher(context, conversationId, watcher, expectedVersion) {
    if (isLocal(context)) return localCommunicationsAdapter.addConversationWatcher(context, conversationId, watcher, expectedVersion);
    return (await mutateCollaboration(context, conversationId, expectedVersion, (value) => ({ ...value, watchers: value.watchers.some((item) => item.userId === watcher.userId) ? value.watchers : [...value.watchers, watcher], lastModifiedBy: actor(context) }), "watcher")).summary;
  },
  async removeConversationWatcher(context, conversationId, userId, expectedVersion) {
    if (isLocal(context)) return localCommunicationsAdapter.removeConversationWatcher(context, conversationId, userId, expectedVersion);
    return (await mutateCollaboration(context, conversationId, expectedVersion, (value) => ({ ...value, watchers: value.watchers.filter((item) => item.userId !== userId), lastModifiedBy: actor(context) }), "watcher")).summary;
  },

  async setPresence(context, conversationId, state, ttlMs = 60_000) {
    if (isLocal(context)) return localCommunicationsAdapter.setPresence(context, conversationId, state, ttlMs);
    const now = new Date();
    return mutateCollaboration(context, conversationId, undefined, (value) => ({ ...value, presence: [...value.presence.filter((item) => item.userId !== context.userId), { userId: context.userId, name: context.userId, state, lastSeenAt: now.toISOString(), expiresAt: new Date(now.getTime() + ttlMs).toISOString() }] }), "presence", state);
  },
  async setDrafting(context, conversationId, mode, ttlMs = 10_000) {
    if (isLocal(context)) return localCommunicationsAdapter.setDrafting(context, conversationId, mode, ttlMs);
    const now = new Date();
    return mutateCollaboration(context, conversationId, undefined, (value) => ({ ...value, drafting: mode ? [...value.drafting.filter((item) => item.userId !== context.userId), { userId: context.userId, name: context.userId, mode, startedAt: now.toISOString(), expiresAt: new Date(now.getTime() + ttlMs).toISOString() }] : value.drafting.filter((item) => item.userId !== context.userId) }), "drafting", mode ?? "stopped");
  },
  async acquireComposerLock(context, conversationId, expectedVersion, ttlMs = 30_000) {
    if (isLocal(context)) return localCommunicationsAdapter.acquireComposerLock(context, conversationId, expectedVersion, ttlMs);
    const now = new Date();
    const current = await fetchDetail(context, conversationId);
    if (!current) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    if (current.summary.collaboration?.composerLock && current.summary.collaboration.composerLock.userId !== context.userId) throw new CommunicationsAdapterError(`${current.summary.collaboration.composerLock.name} owns the reply composer.`, "CONFLICT");
    return mutateCollaboration(context, conversationId, expectedVersion, (value) => ({ ...value, composerLock: { userId: context.userId, name: context.userId, mode: "reply", acquiredAt: now.toISOString(), expiresAt: new Date(now.getTime() + ttlMs).toISOString() } }), "lock");
  },
  async releaseComposerLock(context, conversationId) {
    if (isLocal(context)) return localCommunicationsAdapter.releaseComposerLock(context, conversationId);
    const current = await fetchDetail(context, conversationId);
    if (!current?.summary.collaboration?.composerLock) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    if (current.summary.collaboration.composerLock.userId !== context.userId) throw new CommunicationsAdapterError("Only the composer owner can release this lock.", "FORBIDDEN");
    return mutateCollaboration(context, conversationId, undefined, (value) => ({ ...value, composerLock: null }), "lock", "released");
  },
  async takeoverComposerLock(context, conversationId, expectedVersion) {
    if (isLocal(context)) return localCommunicationsAdapter.takeoverComposerLock(context, conversationId, expectedVersion);
    const current = await fetchDetail(context, conversationId);
    if (!current) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    const previous = current.summary.collaboration?.composerLock;
    return mutateCollaboration(context, conversationId, expectedVersion, (value) => ({ ...value, composerLock: { userId: context.userId, name: context.userId, mode: "reply", acquiredAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30_000).toISOString(), takenOverFromUserId: previous?.userId } }), "lock", previous ? `Taken over from ${previous.name}` : "Taken over");
  },

  async sendReply(context, conversationId, body, expectedVersion, idempotencyKey, content) {
    if (isLocal(context)) return localCommunicationsAdapter.sendReply(context, conversationId, body, expectedVersion, idempotencyKey, content);
    return sendRemoteMessage(context, conversationId, body, "outbound", expectedVersion, idempotencyKey, content);
  },
  async addInternalNote(context, conversationId, body, expectedVersion, idempotencyKey) {
    if (isLocal(context)) return localCommunicationsAdapter.addInternalNote(context, conversationId, body, expectedVersion, idempotencyKey);
    const current = await fetchDetail(context, conversationId);
    if (!current) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    if (expectedVersion !== undefined && current.summary.version !== expectedVersion) throw new CommunicationsAdapterError("Conversation changed. Refresh and try again.", "CONFLICT");
    try {
      const client = clientOrThrow();
      if (idempotencyKey) {
        const previous = await client.from("communication_internal_notes").select("*").eq("organization_id", context.organizationId).eq("conversation_id", conversationId).eq("idempotency_key", idempotencyKey).maybeSingle();
        if (previous.error) throw previous.error;
        if (previous.data) return { message: messageFromRow({ ...previous.data, status: null }, "internal"), summary: current.summary };
      }
      const { data, error } = await client.from("communication_internal_notes").insert({ organization_id: context.organizationId, conversation_id: conversationId, author_id: isUuid(context.userId) ? context.userId : null, author_name: context.userId, body: assertBody(body), idempotency_key: idempotencyKey ?? null }).select("*").single();
      if (error) throw error;
      const next = await fetchDetail(context, conversationId);
      if (!next) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
      return { message: messageFromRow({ ...data, status: null }, "internal"), summary: next.summary };
    } catch (error) { throw communicationError(error); }
  },
};

async function sendRemoteMessage(context: CommunicationsContext, conversationId: string, body: string, direction: "outbound", expectedVersion?: number, idempotencyKey?: string, content?: Pick<CommunicationMessage, "contentType" | "contentMetadata">) {
  const current = await fetchDetail(context, conversationId);
  if (!current) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
  if (expectedVersion !== undefined && current.summary.version !== expectedVersion) throw new CommunicationsAdapterError("Conversation changed. Refresh and try again.", "CONFLICT");
  const account = (await clientOrThrow().from("communication_accounts").select("*").eq("id", current.summary.accountId).eq("organization_id", context.organizationId).single()).data;
  if (!account) throw new CommunicationsAdapterError("Communication account is unavailable.", "CHANNEL_UNAVAILABLE");
  if (account.status !== "connected" || account.outbound_enabled === false) throw new CommunicationsAdapterError("Replies are disabled until the channel account is connected and enabled.", "CHANNEL_UNAVAILABLE");
  if (current.summary.windowExpiresAt && new Date(current.summary.windowExpiresAt).getTime() <= Date.now()) throw new CommunicationsAdapterError("The conversation window expired. An approved template is required.", "TEMPLATE_REQUIRED");
  try {
    const client = clientOrThrow();
    if (idempotencyKey) {
      const previous = await client.from("communication_messages").select("*").eq("organization_id", context.organizationId).eq("conversation_id", conversationId).eq("idempotency_key", idempotencyKey).maybeSingle();
      if (previous.error) throw previous.error;
      if (previous.data) return { message: messageFromRow(previous.data), summary: current.summary };
    }
    const { data, error } = await client.from("communication_messages").insert({ organization_id: context.organizationId, conversation_id: conversationId, direction, status: "queued", body: assertBody(body), content_type: content?.contentType ?? "text", content_metadata: content?.contentMetadata ?? null, author_id: isUuid(context.userId) ? context.userId : null, author_name: context.userId, idempotency_key: idempotencyKey ?? null }).select("*").single();
    if (error) throw error;
    const next = await fetchDetail(context, conversationId);
    if (!next) throw new CommunicationsAdapterError("Conversation not found.", "NOT_FOUND");
    return { message: messageFromRow(data), summary: next.summary };
  } catch (error) { throw communicationError(error); }
}
