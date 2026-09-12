import type {
  CollaborationAgent,
  CommunicationAuditEvent,
  CommunicationChannelAccount,
  CommunicationMessage,
  ConversationCollaboration,
  ConversationDetail,
  ConversationSummary,
} from "../types";

const now = "2026-09-10T18:00:00.000Z";
let localMessageSequence = 0;
let localAuditSequence = 0;
let localReferenceNow = now;
const idempotentMessages = new Map<string, { message: CommunicationMessage; summary: ConversationSummary }>();

export const localCommunicationAgents: CollaborationAgent[] = [
  { userId: "local-development-user", name: "Local operator", role: "supervisor" },
  { userId: "owner-maya", name: "Maya Chen", role: "agent" },
  { userId: "owner-daniel", name: "Daniel Ortiz", role: "agent" },
  { userId: "owner-sam", name: "Sam Rivera", role: "agent" },
];

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
  { id: "message-aria-demo-early-1", conversationId: "conversation-aria", direction: "inbound", body: "We would like to review the workspace setup with the operations team.", authorName: "Aria Blackwood", occurredAt: "2026-09-05T08:40:00.000Z", deliveryStatus: null },
  { id: "message-aria-demo-early-2", conversationId: "conversation-aria", direction: "outbound", body: "Absolutely. I will prepare a short walkthrough for everyone.", authorName: "Maya Chen", occurredAt: "2026-09-05T09:12:00.000Z", deliveryStatus: "read" },
  { id: "message-aria-demo-early-3", conversationId: "conversation-aria", direction: "inbound", body: "The team is available on Monday afternoon.", authorName: "Aria Blackwood", occurredAt: "2026-09-06T14:05:00.000Z", deliveryStatus: null },
  { id: "message-aria-demo-early-4", conversationId: "conversation-aria", direction: "outbound", body: "Monday afternoon works. I have reserved the review slot.", authorName: "Maya Chen", occurredAt: "2026-09-06T14:32:00.000Z", deliveryStatus: "delivered" },
  { id: "message-aria-demo-early-5", conversationId: "conversation-aria", direction: "inbound", body: "Sharing the agenda before the review.", authorName: "Aria Blackwood", occurredAt: "2026-09-07T10:18:00.000Z", deliveryStatus: null, contentType: "document", contentMetadata: { name: "review-agenda.pdf", size: "420 KB", mimeType: "application/pdf" } },
  { id: "message-aria-demo-early-6", conversationId: "conversation-aria", direction: "outbound", body: "Received. I will add the implementation status to the agenda.", authorName: "Maya Chen", occurredAt: "2026-09-07T10:46:00.000Z", deliveryStatus: "read" },
  { id: "message-aria-demo-1", conversationId: "conversation-aria", direction: "inbound", body: "Hi Maya, I wanted to share a little more context before our review.", authorName: "Aria Blackwood", occurredAt: "2026-09-08T09:12:00.000Z", deliveryStatus: null },
  { id: "message-aria-demo-2", conversationId: "conversation-aria", direction: "outbound", body: "Of course, Aria. I will review everything and make sure the team is aligned.", authorName: "Maya Chen", occurredAt: "2026-09-08T09:28:00.000Z", deliveryStatus: "read" },
  { id: "message-aria-demo-3", conversationId: "conversation-aria", direction: "inbound", body: "The main priority is keeping the onboarding flow simple for new operators.", authorName: "Aria Blackwood", occurredAt: "2026-09-08T10:05:00.000Z", deliveryStatus: null },
  { id: "message-aria-demo-4", conversationId: "conversation-aria", direction: "outbound", body: "That matches our plan. We will include a short checklist and a guided first task.", authorName: "Maya Chen", occurredAt: "2026-09-08T10:26:00.000Z", deliveryStatus: "delivered" },
  { id: "message-aria-demo-5", conversationId: "conversation-aria", direction: "inbound", body: "Voice message", authorName: "Aria Blackwood", occurredAt: "2026-09-08T11:14:00.000Z", deliveryStatus: null, contentType: "audio", contentMetadata: { durationSeconds: 42 } },
  { id: "message-aria-demo-6", conversationId: "conversation-aria", direction: "outbound", body: "Thanks, I will listen to it before the afternoon sync.", authorName: "Maya Chen", occurredAt: "2026-09-08T11:42:00.000Z", deliveryStatus: "read" },
  { id: "message-aria-demo-7", conversationId: "conversation-aria", direction: "inbound", body: "The first screen should show the workspace status and the latest activity.", authorName: "Aria Blackwood", occurredAt: "2026-09-09T08:45:00.000Z", deliveryStatus: null },
  { id: "message-aria-demo-8", conversationId: "conversation-aria", direction: "outbound", body: "I have added that to the review checklist for tomorrow.", authorName: "Maya Chen", occurredAt: "2026-09-09T09:20:00.000Z", deliveryStatus: "read" },
  { id: "message-aria-demo-9", conversationId: "conversation-aria", direction: "inbound", body: "Onboarding flow preview", authorName: "Aria Blackwood", occurredAt: "2026-09-09T10:08:00.000Z", deliveryStatus: null, contentType: "image", contentMetadata: { name: "onboarding-flow.png", size: "1.1 MB", mimeType: "image/png" } },
  { id: "message-aria-demo-10", conversationId: "conversation-aria", direction: "outbound", body: "Perfect. The navigation is much clearer in this version.", authorName: "Maya Chen", occurredAt: "2026-09-09T10:34:00.000Z", deliveryStatus: "delivered" },
  { id: "message-aria-demo-11", conversationId: "conversation-aria", direction: "inbound", body: "Latest requirements", authorName: "Aria Blackwood", occurredAt: "2026-09-09T13:16:00.000Z", deliveryStatus: null, contentType: "document", contentMetadata: { name: "workspace-requirements.pdf", size: "2.4 MB", mimeType: "application/pdf" } },
  { id: "message-aria-demo-12", conversationId: "conversation-aria", direction: "outbound", body: "Received. I will compare it with the current workspace configuration.", authorName: "Maya Chen", occurredAt: "2026-09-09T13:48:00.000Z", deliveryStatus: "read" },
  { id: "message-aria-demo-13", conversationId: "conversation-aria", direction: "inbound", body: "One last detail: the team needs the new flow ready for Monday.", authorName: "Aria Blackwood", occurredAt: "2026-09-10T09:06:00.000Z", deliveryStatus: null },
  { id: "message-aria-demo-14", conversationId: "conversation-aria", direction: "outbound", body: "Understood. We are still on track for Monday morning.", authorName: "Maya Chen", occurredAt: "2026-09-10T09:32:00.000Z", deliveryStatus: "read" },
  { id: "message-aria-demo-15", conversationId: "conversation-aria", direction: "inbound", body: "Updated requirements", authorName: "Aria Blackwood", occurredAt: "2026-09-10T12:24:00.000Z", deliveryStatus: null, contentType: "document", contentMetadata: { name: "requirements-v2.docx", size: "864 KB", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } },
  { id: "message-aria-demo-16", conversationId: "conversation-aria", direction: "outbound", body: "Great. I will keep the review thread open for your follow-up.", authorName: "Maya Chen", occurredAt: "2026-09-10T12:50:00.000Z", deliveryStatus: "delivered" },
  { id: "message-aria-demo-17", conversationId: "conversation-aria", direction: "inbound", body: "Review meeting location", authorName: "Aria Blackwood", occurredAt: "2026-09-10T13:16:00.000Z", deliveryStatus: null, contentType: "location", contentMetadata: { locationLabel: "LoopDev HQ · 100 Market Street" } },
  { id: "message-aria-demo-18", conversationId: "conversation-aria", direction: "outbound", body: "Short product walkthrough", authorName: "Maya Chen", occurredAt: "2026-09-10T13:42:00.000Z", deliveryStatus: "delivered", contentType: "video", contentMetadata: { name: "product-walkthrough.mp4", durationSeconds: 28, size: "8.6 MB" } },
  { id: "message-aria-demo-19", conversationId: "conversation-aria", direction: "inbound", body: "Prototype link", authorName: "Aria Blackwood", occurredAt: "2026-09-10T14:08:00.000Z", deliveryStatus: null, contentType: "link", contentMetadata: { name: "LoopDev onboarding prototype", url: "https://example.com/loopdev-prototype" } },
  { id: "message-aria-1", conversationId: "conversation-aria", direction: "inbound", body: "Hi Maya, checking in on the workspace rollout.", authorName: "Aria Blackwood", occurredAt: "2026-09-10T16:42:00.000Z", deliveryStatus: null },
  { id: "message-aria-2", conversationId: "conversation-aria", direction: "outbound", body: "Hi Aria! We are ready for the next review. What would you like us to prepare?", authorName: "Maya Chen", occurredAt: "2026-09-10T17:02:00.000Z", deliveryStatus: "read" },
  { id: "message-aria-3", conversationId: "conversation-aria", direction: "internal", body: "Follow up with the implementation team before tomorrow's review.", authorName: "Maya Chen", occurredAt: "2026-09-10T17:20:00.000Z", deliveryStatus: null },
  { id: "message-aria-4", conversationId: "conversation-aria", direction: "inbound", body: "I attached the updated requirements document.", authorName: "Aria Blackwood", occurredAt: "2026-09-10T17:48:00.000Z", deliveryStatus: null, contentType: "document" },
  { id: "message-aria-5", conversationId: "conversation-aria", direction: "inbound", body: "Voice message · 0:42", authorName: "Aria Blackwood", occurredAt: "2026-09-10T17:52:00.000Z", deliveryStatus: null, contentType: "audio" },
  { id: "message-harbor-1", conversationId: "conversation-harbor", direction: "outbound", body: "I have shared the revised proposal for your team.", authorName: "Maya Chen", occurredAt: "2026-09-10T14:55:00.000Z", deliveryStatus: "delivered" },
  { id: "message-harbor-2", conversationId: "conversation-harbor", direction: "inbound", body: "Thanks, I will review the proposal with our team.", authorName: "Tomás Iglesias", occurredAt: "2026-09-10T15:20:00.000Z", deliveryStatus: null },
  { id: "message-unknown-1", conversationId: "conversation-unknown", direction: "inbound", body: "Hello, I have a question about my appointment.", authorName: "Unknown WhatsApp number", occurredAt: "2026-09-09T12:10:00.000Z", deliveryStatus: null },
  { id: "message-closed-1", conversationId: "conversation-closed", direction: "inbound", body: "Can we confirm the timing for next week?", authorName: "Naomi Ferrer", occurredAt: "2026-09-07T09:10:00.000Z", deliveryStatus: null },
  { id: "message-closed-2", conversationId: "conversation-closed", direction: "outbound", body: "That works for me. Thank you!", authorName: "Daniel Ortiz", occurredAt: "2026-09-07T09:30:00.000Z", deliveryStatus: "read" },
];

const agent = (userId: string): CollaborationAgent => {
  const found = localCommunicationAgents.find((item) => item.userId === userId);
  return found ? { ...found } : { userId, name: userId, role: "agent" };
};

function initialCollaboration(summary: ConversationSummary): ConversationCollaboration {
  const assignee = summary.assignedToUserId ? agent(summary.assignedToUserId) : null;
  const presence = summary.id === "conversation-aria"
    ? [{
      ...agent("owner-maya"),
      state: "viewing" as const,
      lastSeenAt: "2026-09-10T17:59:00.000Z",
      expiresAt: "2026-09-10T18:05:00.000Z",
    }]
    : [];
  return {
    assignee,
    collaborators: summary.id === "conversation-aria" ? [agent("owner-maya")] : [],
    watchers: summary.id === "conversation-aria" ? [agent("owner-daniel")] : [],
    presence,
    drafting: [],
    composerLock: null,
    handoff: null,
    lastModifiedBy: assignee,
  };
}

const initialDetails = localSummaries.map((summary): ConversationDetail => ({
  summary: { ...summary, collaboration: initialCollaboration(summary) },
  messages: localMessages.filter((message) => message.conversationId === summary.id).map((message, index) => ({ ...message, sequence: index + 1 })),
  internalNotes: localMessages.filter((message) => message.conversationId === summary.id && message.direction === "internal").map((message) => ({ ...message })),
  collaboration: initialCollaboration(summary),
  auditTrail: [],
}));

function cloneSummary(summary: ConversationSummary): ConversationSummary {
  return {
    ...summary,
    contact: { ...summary.contact },
    collaboration: summary.collaboration ? cloneCollaboration(summary.collaboration) : undefined,
  };
}

function cloneCollaboration(collaboration: ConversationCollaboration): ConversationCollaboration {
  return {
    ...collaboration,
    assignee: collaboration.assignee ? { ...collaboration.assignee } : null,
    collaborators: collaboration.collaborators.map((item) => ({ ...item })),
    watchers: collaboration.watchers.map((item) => ({ ...item })),
    presence: collaboration.presence.map((item) => ({ ...item })),
    drafting: collaboration.drafting.map((item) => ({ ...item })),
    composerLock: collaboration.composerLock ? { ...collaboration.composerLock } : null,
    handoff: collaboration.handoff ? { ...collaboration.handoff } : null,
    lastModifiedBy: collaboration.lastModifiedBy ? { ...collaboration.lastModifiedBy } : null,
  };
}

function cloneDetail(detail: ConversationDetail): ConversationDetail {
  return {
    summary: cloneSummary(detail.summary),
    messages: [...detail.messages].sort((left, right) => (left.sequence ?? 0) - (right.sequence ?? 0)).map((message) => ({ ...message })),
    internalNotes: detail.internalNotes.map((message) => ({ ...message })),
    collaboration: detail.collaboration ? cloneCollaboration(detail.collaboration) : undefined,
    auditTrail: detail.auditTrail?.map((event) => ({ ...event, actor: { ...event.actor } })),
  };
}

function findDetail(id: string): ConversationDetail | undefined {
  return initialDetails.find((item) => item.summary.id === id);
}

function syncSummary(detail: ConversationDetail): void {
  detail.summary = {
    ...detail.summary,
    assignedToUserId: detail.collaboration?.assignee?.userId ?? null,
    assignedToName: detail.collaboration?.assignee?.name ?? null,
    collaboration: detail.collaboration ? cloneCollaboration(detail.collaboration) : undefined,
  };
}

function pruneExpired(detail: ConversationDetail): void {
  if (!detail.collaboration) return;
  const current = new Date(localReferenceNow).getTime();
  detail.collaboration.presence = detail.collaboration.presence.filter((item) => new Date(item.expiresAt).getTime() > current);
  detail.collaboration.drafting = detail.collaboration.drafting.filter((item) => new Date(item.expiresAt).getTime() > current);
  if (detail.collaboration.composerLock && new Date(detail.collaboration.composerLock.expiresAt).getTime() <= current) {
    detail.collaboration.composerLock = null;
  }
}

export const localCommunicationsStore = {
  listSummaries(): ConversationSummary[] {
    return initialDetails.map((detail) => {
      pruneExpired(detail);
      syncSummary(detail);
      return cloneSummary(detail.summary);
    });
  },
  getDetail(id: string): ConversationDetail | null {
    const detail = findDetail(id);
    if (detail) {
      pruneExpired(detail);
      syncSummary(detail);
    }
    return detail ? cloneDetail(detail) : null;
  },
  updateSummary(id: string, update: (summary: ConversationSummary) => ConversationSummary): ConversationSummary | null {
    const detail = findDetail(id);
    if (!detail) return null;
    pruneExpired(detail);
    detail.summary = update(detail.summary);
    syncSummary(detail);
    return cloneSummary(detail.summary);
  },
  updateCollaboration(
    id: string,
    update: (collaboration: ConversationCollaboration) => ConversationCollaboration,
    actor: CollaborationAgent,
    action: CommunicationAuditEvent["action"],
    versionBump = true,
    details?: string,
  ): ConversationSummary | null {
    const detail = findDetail(id);
    if (!detail || !detail.collaboration) return null;
    pruneExpired(detail);
    detail.collaboration = update(cloneCollaboration(detail.collaboration));
    detail.collaboration.lastModifiedBy = { ...actor };
    if (versionBump) detail.summary.version += 1;
    syncSummary(detail);
    this.recordAudit(id, action, actor, details);
    return cloneSummary(detail.summary);
  },
  recordAudit(
    conversationId: string,
    action: CommunicationAuditEvent["action"],
    actor: CollaborationAgent,
    details?: string,
  ): CommunicationAuditEvent | null {
    const detail = findDetail(conversationId);
    if (!detail) return null;
    if (detail.collaboration) {
      detail.collaboration.lastModifiedBy = { ...actor };
      syncSummary(detail);
    }
    const event: CommunicationAuditEvent = {
      id: `audit-local-${localAuditSequence + 1}`,
      conversationId,
      action,
      actor: { ...actor },
      occurredAt: localReferenceNow,
      sequence: ++localAuditSequence,
      details,
    };
    detail.auditTrail = [...(detail.auditTrail ?? []), event];
    return { ...event, actor: { ...event.actor } };
  },
  getAuditTrail(id: string): CommunicationAuditEvent[] {
    return (findDetail(id)?.auditTrail ?? []).map((event) => ({ ...event, actor: { ...event.actor } }));
  },
  appendMessage(
    conversationId: string,
    message: Omit<CommunicationMessage, "id" | "occurredAt">,
    actor: CollaborationAgent = agent("local-development-user"),
    idempotencyKey?: string,
  ): { message: CommunicationMessage; summary: ConversationSummary } | null {
    const detail = findDetail(conversationId);
    if (!detail) return null;
    if (idempotencyKey) {
      const existing = idempotentMessages.get(`${conversationId}:${idempotencyKey}`);
      if (existing) return { message: { ...existing.message }, summary: cloneSummary(existing.summary) };
    }
    const occurredAt = new Date().toISOString();
    const nextMessage: CommunicationMessage = {
      ...message,
      id: `message-local-${++localMessageSequence}`,
      occurredAt,
      sequence: Math.max(0, ...detail.messages.map((item) => item.sequence ?? 0)) + 1,
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
    syncSummary(detail);
    this.recordAudit(conversationId, "message", actor, nextMessage.direction);
    const result = { message: { ...nextMessage }, summary: cloneSummary(detail.summary) };
    if (idempotencyKey) idempotentMessages.set(`${conversationId}:${idempotencyKey}`, result);
    return result;
  },
  getIdempotentMessage(conversationId: string, idempotencyKey: string): { message: CommunicationMessage; summary: ConversationSummary } | null {
    const existing = idempotentMessages.get(`${conversationId}:${idempotencyKey}`);
    return existing
      ? { message: { ...existing.message }, summary: cloneSummary(existing.summary) }
      : null;
  },
  setReferenceNow(value: string): void {
    localReferenceNow = value;
  },
  reset(): void {
    localMessageSequence = 0;
    localAuditSequence = 0;
    idempotentMessages.clear();
    localReferenceNow = now;
    initialDetails.splice(0, initialDetails.length, ...localSummaries.map((summary) => ({
      summary: { ...cloneSummary(summary), collaboration: initialCollaboration(summary) },
      messages: localMessages.filter((message) => message.conversationId === summary.id).map((message, index) => ({ ...message, sequence: index + 1 })),
      internalNotes: localMessages.filter((message) => message.conversationId === summary.id && message.direction === "internal").map((message) => ({ ...message })),
      collaboration: initialCollaboration(summary),
      auditTrail: [],
    })));
  },
  get referenceNow(): string {
    return localReferenceNow;
  },
};
