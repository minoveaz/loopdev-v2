import type {
  CommunicationChannelAccount,
  CommunicationMessage,
  ConversationDetail,
  ConversationSummary,
} from "../types";

const now = "2026-09-10T18:00:00.000Z";
let localMessageSequence = 0;

export const localCommunicationChannels: CommunicationChannelAccount[] = [
  {
    id: "account-whatsapp-local",
    channel: "whatsapp",
    label: "WhatsApp · Operations",
    state: "connected",
    statusMessage: "Connected for inbound conversations",
    policyState: "enabled",
    capabilities: {
      canReply: true,
      canAddInternalNote: true,
      supportsTemplates: true,
      supportsAttachments: false,
      supportsRichContent: false,
      supportsVoice: false,
    },
  },
  {
    id: "account-email-local",
    channel: "email",
    label: "Email",
    state: "coming_soon",
    statusMessage: "Adapter prepared · connection required",
    capabilities: {
      canReply: false,
      canAddInternalNote: true,
      supportsTemplates: false,
      supportsAttachments: false,
      supportsRichContent: false,
      supportsVoice: false,
    },
  },
  ...([
    ["instagram", "Instagram"],
    ["facebook_messenger", "Messenger"],
    ["sms", "SMS"],
    ["phone", "Phone"],
    ["livechat", "Live chat"],
  ] as const).map(([channel, label]) => ({
    id: `account-${channel}-local`,
    channel,
    label,
    state: "coming_soon" as const,
    statusMessage: "Prepared for a future channel adapter",
    capabilities: {
      canReply: false,
      canAddInternalNote: true,
      supportsTemplates: false,
      supportsAttachments: false,
      supportsRichContent: false,
      supportsVoice: false,
    },
  })),
];

const contact = (
  id: string,
  displayName: string,
  phone: string | null,
  email: string | null,
  identityStatus: "verified" | "pending_identity_review" = "verified",
) => ({ id, displayName, phone, email, identityStatus });

const localSummaries: ConversationSummary[] = [
  {
    id: "conversation-aria",
    organizationId: "local-development-organization",
    workspaceId: "local-workspace",
    accountId: "account-whatsapp-local",
    channelId: "whatsapp",
    channel: "whatsapp",
    contact: contact("crm_cust_1", "Aria Blackwood", "+1 555 0100", "aria.blackwood@example.com"),
    status: "open",
    assignedToUserId: null,
    assignedToName: null,
    unreadCount: 2,
    starred: true,
    preview: "I can send the updated requirements this afternoon.",
    lastMessageAt: "2026-09-10T17:48:00.000Z",
    lastActivityAt: "2026-09-10T17:48:00.000Z",
    lastInboundAt: "2026-09-10T17:48:00.000Z",
    windowExpiresAt: "2026-09-11T17:48:00.000Z",
    version: 3,
  },
  {
    id: "conversation-harbor",
    organizationId: "local-development-organization",
    workspaceId: "local-workspace",
    accountId: "account-whatsapp-local",
    channelId: "whatsapp",
    channel: "whatsapp",
    contact: contact("crm_cust_2", "Tomás Iglesias", "+1 555 0101", "tomas.iglesias@example.com"),
    status: "pending",
    assignedToUserId: "owner-maya",
    assignedToName: "Maya Chen",
    unreadCount: 0,
    starred: false,
    preview: "Thanks, I will review the proposal with our team.",
    lastMessageAt: "2026-09-10T15:20:00.000Z",
    lastActivityAt: "2026-09-10T15:20:00.000Z",
    lastInboundAt: "2026-09-10T15:20:00.000Z",
    windowExpiresAt: "2026-09-11T15:20:00.000Z",
    version: 2,
  },
  {
    id: "conversation-unknown",
    organizationId: "local-development-organization",
    workspaceId: "local-workspace",
    accountId: "account-whatsapp-local",
    channelId: "whatsapp",
    channel: "whatsapp",
    contact: contact("crm_pending_1", "Unknown WhatsApp number", "+1 555 0102", null, "pending_identity_review"),
    status: "open",
    assignedToUserId: null,
    assignedToName: null,
    unreadCount: 1,
    starred: false,
    preview: "Hello, I have a question about my appointment.",
    lastMessageAt: "2026-09-09T12:10:00.000Z",
    lastActivityAt: "2026-09-09T12:10:00.000Z",
    lastInboundAt: "2026-09-09T12:10:00.000Z",
    windowExpiresAt: "2026-09-10T12:10:00.000Z",
    version: 1,
  },
  {
    id: "conversation-closed",
    organizationId: "local-development-organization",
    workspaceId: "local-workspace",
    accountId: "account-whatsapp-local",
    channelId: "whatsapp",
    channel: "whatsapp",
    contact: contact("crm_cust_3", "Naomi Ferrer", "+1 555 0103", "naomi.ferrer@example.com"),
    status: "closed",
    assignedToUserId: "owner-daniel",
    assignedToName: "Daniel Ortiz",
    unreadCount: 0,
    starred: false,
    preview: "That works for me. Thank you!",
    lastMessageAt: "2026-09-07T09:30:00.000Z",
    lastActivityAt: "2026-09-07T09:30:00.000Z",
    lastInboundAt: "2026-09-07T09:30:00.000Z",
    windowExpiresAt: null,
    version: 4,
  },
];

const localMessages: CommunicationMessage[] = [
  { id: "message-aria-1", conversationId: "conversation-aria", direction: "inbound", body: "Hi Maya, checking in on the workspace rollout.", authorName: "Aria Blackwood", occurredAt: "2026-09-10T16:42:00.000Z", deliveryStatus: null },
  { id: "message-aria-2", conversationId: "conversation-aria", direction: "outbound", body: "Hi Aria! We are ready for the next review. What would you like us to prepare?", authorName: "Maya Chen", occurredAt: "2026-09-10T17:02:00.000Z", deliveryStatus: "read" },
  { id: "message-aria-3", conversationId: "conversation-aria", direction: "internal", body: "Follow up with the implementation team before tomorrow's review.", authorName: "Maya Chen", occurredAt: "2026-09-10T17:20:00.000Z", deliveryStatus: null },
  { id: "message-aria-4", conversationId: "conversation-aria", direction: "inbound", body: "I can send the updated requirements this afternoon.", authorName: "Aria Blackwood", occurredAt: "2026-09-10T17:48:00.000Z", deliveryStatus: null },
  { id: "message-harbor-1", conversationId: "conversation-harbor", direction: "outbound", body: "I have shared the revised proposal for your team.", authorName: "Maya Chen", occurredAt: "2026-09-10T14:55:00.000Z", deliveryStatus: "delivered" },
  { id: "message-harbor-2", conversationId: "conversation-harbor", direction: "inbound", body: "Thanks, I will review the proposal with our team.", authorName: "Tomás Iglesias", occurredAt: "2026-09-10T15:20:00.000Z", deliveryStatus: null },
  { id: "message-unknown-1", conversationId: "conversation-unknown", direction: "inbound", body: "Hello, I have a question about my appointment.", authorName: "Unknown WhatsApp number", occurredAt: "2026-09-09T12:10:00.000Z", deliveryStatus: null },
  { id: "message-closed-1", conversationId: "conversation-closed", direction: "inbound", body: "Can we confirm the timing for next week?", authorName: "Naomi Ferrer", occurredAt: "2026-09-07T09:10:00.000Z", deliveryStatus: null },
  { id: "message-closed-2", conversationId: "conversation-closed", direction: "outbound", body: "That works for me. Thank you!", authorName: "Daniel Ortiz", occurredAt: "2026-09-07T09:30:00.000Z", deliveryStatus: "read" },
];

const initialDetails = localSummaries.map((summary): ConversationDetail => ({
  summary,
  messages: localMessages.filter((message) => message.conversationId === summary.id),
  internalNotes: localMessages.filter((message) => message.conversationId === summary.id && message.direction === "internal"),
}));

function cloneSummary(summary: ConversationSummary): ConversationSummary {
  return { ...summary, contact: { ...summary.contact } };
}

function cloneDetail(detail: ConversationDetail): ConversationDetail {
  return {
    summary: cloneSummary(detail.summary),
    messages: detail.messages.map((message) => ({ ...message })),
    internalNotes: detail.internalNotes.map((message) => ({ ...message })),
  };
}

export const localCommunicationsStore = {
  listSummaries(): ConversationSummary[] {
    return initialDetails.map((detail) => cloneSummary(detail.summary));
  },
  getDetail(id: string): ConversationDetail | null {
    const detail = initialDetails.find((item) => item.summary.id === id);
    return detail ? cloneDetail(detail) : null;
  },
  updateSummary(id: string, update: (summary: ConversationSummary) => ConversationSummary): ConversationSummary | null {
    const detail = initialDetails.find((item) => item.summary.id === id);
    if (!detail) return null;
    detail.summary = update(detail.summary);
    return cloneSummary(detail.summary);
  },
  appendMessage(
    conversationId: string,
    message: Omit<CommunicationMessage, "id" | "occurredAt">,
  ): { message: CommunicationMessage; summary: ConversationSummary } | null {
    const detail = initialDetails.find((item) => item.summary.id === conversationId);
    if (!detail) return null;
    const occurredAt = new Date().toISOString();
    const nextMessage: CommunicationMessage = {
      ...message,
      id: `message-local-${++localMessageSequence}`,
      occurredAt,
    };
    detail.messages.push(nextMessage);
    if (nextMessage.direction === "internal") detail.internalNotes.push(nextMessage);
    detail.summary = {
      ...detail.summary,
      preview: nextMessage.body,
      lastMessageAt: occurredAt,
      lastActivityAt: occurredAt,
      version: detail.summary.version + 1,
    };
    return { message: { ...nextMessage }, summary: cloneSummary(detail.summary) };
  },
  reset(): void {
    localMessageSequence = 0;
    initialDetails.splice(0, initialDetails.length, ...localSummaries.map((summary) => ({
      summary: cloneSummary(summary),
      messages: localMessages.filter((message) => message.conversationId === summary.id).map((message) => ({ ...message })),
      internalNotes: localMessages.filter((message) => message.conversationId === summary.id && message.direction === "internal").map((message) => ({ ...message })),
    })));
  },
  referenceNow: now,
};
