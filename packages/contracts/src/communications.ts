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
export type ChannelConnectionState = "connected" | "disconnected" | "pending" | "error" | "coming_soon" | "disabled";
export type ConversationStatus = "open" | "pending" | "snoozed" | "closed";
export type ConversationAssigneeFilter = "all" | "mine" | "unassigned";
export type MessageDirection = "inbound" | "outbound" | "internal";
export type MessageDeliveryStatus = "queued" | "sent" | "delivered" | "read" | "failed";
export type ComposerMode = "reply" | "internal_note";
export type CollaborationPresenceState = "viewing" | "idle" | "offline";

export interface CollaborationAgent { userId: string; name: string; role?: "agent" | "supervisor"; avatarUrl?: string | null; }
export interface ConversationPresence { userId: string; name: string; state: CollaborationPresenceState; lastSeenAt: string; expiresAt: string; }
export interface DraftingIndicator { userId: string; name: string; mode: ComposerMode; startedAt: string; expiresAt: string; }
export interface ComposerLock { userId: string; name: string; mode: "reply"; acquiredAt: string; expiresAt: string; takenOverFromUserId?: string; }
export interface HandoffRequest { requestedByUserId: string; requestedByName: string; requestedToUserId: string; requestedToName: string; requestedAt: string; status: "pending" | "accepted" | "declined" | "cancelled"; }
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
  action: "read" | "star" | "status" | "claim" | "assign" | "transfer" | "unassign" | "handoff" | "collaborator" | "watcher" | "presence" | "drafting" | "lock" | "message";
  actor: CollaborationAgent;
  occurredAt: string;
  sequence: number;
  details?: string;
}
export interface CommunicationCapabilities { canReply: boolean; canAddInternalNote: boolean; supportsTemplates: boolean; supportsAttachments: boolean; supportsRichContent: boolean; supportsVoice: boolean; }
export interface CommunicationChannelAccount { id: string; channel: CommunicationChannel; label: string; state: ChannelConnectionState; statusMessage: string; policyState?: "enabled" | "disabled"; capabilities: CommunicationCapabilities; }
export interface CommunicationsContext { organizationId: string; workspaceId: string; userId: string; }
export interface CommunicationContactSummary { id: string; displayName: string; phone: string | null; email: string | null; identityStatus: "verified" | "pending_identity_review"; }
export interface ConversationSummary {
  id: string; organizationId: string; workspaceId: string; accountId: string; channelId: string; channel: CommunicationChannel;
  contact: CommunicationContactSummary; status: ConversationStatus; assignedToUserId: string | null; assignedToName: string | null;
  unreadCount: number; starred: boolean; preview: string | null; lastMessageAt: string | null; lastActivityAt: string; lastInboundAt: string | null;
  windowExpiresAt: string | null; version: number; collaboration?: ConversationCollaboration;
}
export interface CommunicationMessage {
  id: string; conversationId: string; direction: MessageDirection; body: string; authorName: string; occurredAt: string;
  deliveryStatus: MessageDeliveryStatus | null;
  contentType?: "text" | "document" | "audio" | "image" | "video" | "location" | "link" | "catalog_item";
  contentMetadata?: { name?: string; size?: string; mimeType?: string; durationSeconds?: number; url?: string; locationLabel?: string; catalogItemId?: string; catalogItemKey?: string; catalogItemType?: string; catalogPrice?: string; catalogCurrency?: string; };
  sequence?: number;
}
export interface ConversationDetail { summary: ConversationSummary; messages: CommunicationMessage[]; internalNotes: CommunicationMessage[]; collaboration?: ConversationCollaboration; auditTrail?: CommunicationAuditEvent[]; }
export interface CommunicationSendResult { message: CommunicationMessage; summary: ConversationSummary; }
export interface ConversationFilters { channel?: CommunicationChannel | "all"; status?: ConversationStatus | "all"; assignee?: ConversationAssigneeFilter; unreadOnly?: boolean; starredOnly?: boolean; query?: string; }
export interface ConversationListResult { items: ConversationSummary[]; total: number; unreadCount: number; channelUnreadCounts: Partial<Record<CommunicationChannel, number>>; }

export const COMMUNICATIONS_LOCAL_CONTEXT: CommunicationsContext = {
  organizationId: "local-development-organization",
  workspaceId: "local-workspace",
  userId: "local-development-user",
};
