export const COMMUNICATION_CHANNELS = [
  "whatsapp",
  "email",
  "instagram",
  "facebook_messenger",
  "sms",
  "phone",
  "livechat",
] as const;

export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export type ChannelConnectionState =
  | "connected"
  | "disconnected"
  | "pending"
  | "error"
  | "coming_soon"
  | "disabled";

export type ConversationStatus = "open" | "pending" | "snoozed" | "closed";
export type ConversationAssigneeFilter = "all" | "mine" | "unassigned";

export type MessageDirection = "inbound" | "outbound" | "internal";
export type MessageDeliveryStatus = "queued" | "sent" | "delivered" | "read" | "failed";
export type ComposerMode = "reply" | "internal_note";
export type CollaborationPresenceState = "viewing" | "idle" | "offline";

export interface CollaborationAgent {
  userId: string;
  name: string;
  role?: "agent" | "supervisor";
  avatarUrl?: string | null;
}

export interface ConversationPresence {
  userId: string;
  name: string;
  state: CollaborationPresenceState;
  lastSeenAt: string;
  expiresAt: string;
}

export interface DraftingIndicator {
  userId: string;
  name: string;
  mode: ComposerMode;
  startedAt: string;
  expiresAt: string;
}

export interface ComposerLock {
  userId: string;
  name: string;
  mode: "reply";
  acquiredAt: string;
  expiresAt: string;
  takenOverFromUserId?: string;
}

export interface HandoffRequest {
  requestedByUserId: string;
  requestedByName: string;
  requestedToUserId: string;
  requestedToName: string;
  requestedAt: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
}

export interface ConversationCollaboration {
  assignee: CollaborationAgent | null;
  collaborators: CollaborationAgent[];
  watchers: CollaborationAgent[];
  presence: ConversationPresence[];
  drafting: DraftingIndicator[];
  composerLock: ComposerLock | null;
  handoff: HandoffRequest | null;
  lastModifiedBy: CollaborationAgent | null;
}

export interface CommunicationAuditEvent {
  id: string;
  conversationId: string;
  action:
    | "read"
    | "star"
    | "status"
    | "claim"
    | "assign"
    | "transfer"
    | "unassign"
    | "handoff"
    | "collaborator"
    | "watcher"
    | "presence"
    | "drafting"
    | "lock"
    | "message";
  actor: CollaborationAgent;
  occurredAt: string;
  sequence: number;
  details?: string;
}

export interface CommunicationCapabilities {
  canReply: boolean;
  canAddInternalNote: boolean;
  supportsTemplates: boolean;
  supportsAttachments: boolean;
  supportsRichContent: boolean;
  supportsVoice: boolean;
}

export interface CommunicationChannelAccount {
  id: string;
  channel: CommunicationChannel;
  label: string;
  state: ChannelConnectionState;
  statusMessage: string;
  policyState?: "enabled" | "disabled";
  capabilities: CommunicationCapabilities;
}

export interface CommunicationsContext {
  organizationId: string;
  workspaceId: string;
  userId: string;
}

export interface CommunicationContactSummary {
  id: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  identityStatus: "verified" | "pending_identity_review";
}

export interface ConversationSummary {
  id: string;
  organizationId: string;
  workspaceId: string;
  accountId: string;
  channelId: string;
  channel: CommunicationChannel;
  contact: CommunicationContactSummary;
  status: ConversationStatus;
  assignedToUserId: string | null;
  assignedToName: string | null;
  unreadCount: number;
  starred: boolean;
  preview: string | null;
  lastMessageAt: string | null;
  lastActivityAt: string;
  lastInboundAt: string | null;
  windowExpiresAt: string | null;
  version: number;
  collaboration?: ConversationCollaboration;
}

export interface CommunicationMessage {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  body: string;
  authorName: string;
  occurredAt: string;
  deliveryStatus: MessageDeliveryStatus | null;
  sequence?: number;
}

export interface ConversationDetail {
  summary: ConversationSummary;
  messages: CommunicationMessage[];
  internalNotes: CommunicationMessage[];
  collaboration?: ConversationCollaboration;
  auditTrail?: CommunicationAuditEvent[];
}

export interface CommunicationSendResult {
  message: CommunicationMessage;
  summary: ConversationSummary;
}

export interface ConversationFilters {
  channel?: CommunicationChannel | "all";
  status?: ConversationStatus | "all";
  assignee?: ConversationAssigneeFilter;
  unreadOnly?: boolean;
  starredOnly?: boolean;
  query?: string;
}

export interface ConversationListResult {
  items: ConversationSummary[];
  total: number;
  unreadCount: number;
  channelUnreadCounts: Partial<Record<CommunicationChannel, number>>;
}

export interface CommunicationsAdapter {
  listChannels(context: CommunicationsContext): Promise<CommunicationChannelAccount[]>;
  listConversations(
    context: CommunicationsContext,
    filters?: ConversationFilters,
  ): Promise<ConversationListResult>;
  getConversation(context: CommunicationsContext, conversationId: string): Promise<ConversationDetail | null>;
  markConversationRead(context: CommunicationsContext, conversationId: string): Promise<ConversationSummary>;
  toggleConversationStar(context: CommunicationsContext, conversationId: string): Promise<ConversationSummary>;
  updateConversationStatus(
    context: CommunicationsContext,
    conversationId: string,
    status: ConversationStatus,
    expectedVersion: number,
  ): Promise<ConversationSummary>;
  assignConversation(
    context: CommunicationsContext,
    conversationId: string,
    assigneeUserId: string | null,
    assigneeName: string | null,
    expectedVersion: number,
  ): Promise<ConversationSummary>;
  claimConversation(context: CommunicationsContext, conversationId: string, expectedVersion: number): Promise<ConversationSummary>;
  transferConversation(
    context: CommunicationsContext,
    conversationId: string,
    assigneeUserId: string,
    assigneeName: string,
    expectedVersion: number,
  ): Promise<ConversationSummary>;
  unassignConversation(context: CommunicationsContext, conversationId: string, expectedVersion: number): Promise<ConversationSummary>;
  requestHandoff(
    context: CommunicationsContext,
    conversationId: string,
    requestedToUserId: string,
    requestedToName: string,
    expectedVersion: number,
  ): Promise<ConversationSummary>;
  addConversationCollaborator(
    context: CommunicationsContext,
    conversationId: string,
    collaborator: CollaborationAgent,
    expectedVersion: number,
  ): Promise<ConversationSummary>;
  removeConversationCollaborator(
    context: CommunicationsContext,
    conversationId: string,
    userId: string,
    expectedVersion: number,
  ): Promise<ConversationSummary>;
  addConversationWatcher(
    context: CommunicationsContext,
    conversationId: string,
    watcher: CollaborationAgent,
    expectedVersion: number,
  ): Promise<ConversationSummary>;
  removeConversationWatcher(
    context: CommunicationsContext,
    conversationId: string,
    userId: string,
    expectedVersion: number,
  ): Promise<ConversationSummary>;
  setPresence(
    context: CommunicationsContext,
    conversationId: string,
    state: CollaborationPresenceState,
    ttlMs?: number,
  ): Promise<ConversationDetail>;
  setDrafting(
    context: CommunicationsContext,
    conversationId: string,
    mode: ComposerMode | null,
    ttlMs?: number,
  ): Promise<ConversationDetail>;
  acquireComposerLock(
    context: CommunicationsContext,
    conversationId: string,
    expectedVersion: number,
    ttlMs?: number,
  ): Promise<ConversationDetail>;
  releaseComposerLock(context: CommunicationsContext, conversationId: string): Promise<ConversationDetail>;
  takeoverComposerLock(
    context: CommunicationsContext,
    conversationId: string,
    expectedVersion: number,
  ): Promise<ConversationDetail>;
  sendReply(
    context: CommunicationsContext,
    conversationId: string,
    body: string,
    expectedVersion?: number,
    idempotencyKey?: string,
  ): Promise<CommunicationSendResult>;
  addInternalNote(
    context: CommunicationsContext,
    conversationId: string,
    body: string,
    expectedVersion?: number,
    idempotencyKey?: string,
  ): Promise<CommunicationSendResult>;
}

export type CommunicationsAdapterErrorCode =
  | "INVALID_SCOPE"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_STATUS_TRANSITION"
  | "VALIDATION_ERROR"
  | "ACCOUNT_DISCONNECTED"
  | "CHANNEL_UNAVAILABLE"
  | "MESSAGE_WINDOW_EXPIRED"
  | "TEMPLATE_REQUIRED"
  | "POLICY_DISABLED";

export class CommunicationsAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: CommunicationsAdapterErrorCode,
  ) {
    super(message);
    this.name = "CommunicationsAdapterError";
  }
}

export const COMMUNICATIONS_LOCAL_CONTEXT: CommunicationsContext = {
  organizationId: "local-development-organization",
  workspaceId: "local-workspace",
  userId: "local-development-user",
};

export const CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  instagram: "Instagram",
  facebook_messenger: "Messenger",
  sms: "SMS",
  phone: "Phone",
  livechat: "Live chat",
};
