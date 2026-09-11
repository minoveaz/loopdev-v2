import type {
  CommunicationMessage,
  ConversationDetail,
  ConversationSummary,
} from "./types";

export type ConversationMilestoneType =
  | "conversation_started"
  | "document_received"
  | "audio_received"
  | "image_received"
  | "video_received"
  | "location_received"
  | "link_received";

export interface ConversationMilestone {
  id: string;
  conversationId: string;
  type: ConversationMilestoneType;
  source: "customer";
  messageId: string;
  occurredAt: string;
  summary: string;
  searchableText: string;
  metadata: CommunicationMessage["contentMetadata"];
}

export interface ConversationContext {
  conversationId: string;
  contact: ConversationSummary["contact"];
  channel: ConversationSummary["channel"];
  status: ConversationSummary["status"];
  messages: CommunicationMessage[];
  milestones: ConversationMilestone[];
}

const milestoneTypeByContentType: Record<
  Exclude<NonNullable<CommunicationMessage["contentType"]>, "text">,
  Exclude<ConversationMilestoneType, "conversation_started">
> = {
  document: "document_received",
  audio: "audio_received",
  image: "image_received",
  video: "video_received",
  location: "location_received",
  link: "link_received",
};

function getContentSummary(message: CommunicationMessage): string {
  const metadata = message.contentMetadata;
  if (message.contentType === "document") return `Customer sent document ${metadata?.name ?? "without a filename"}.`;
  if (message.contentType === "audio") return `Customer sent an audio message${metadata?.durationSeconds ? ` (${metadata.durationSeconds}s)` : ""}.`;
  if (message.contentType === "image") return "Customer sent an image.";
  if (message.contentType === "video") return "Customer sent a video.";
  if (message.contentType === "location") return `Customer shared location${metadata?.locationLabel ? `: ${metadata.locationLabel}` : ""}.`;
  if (message.contentType === "link") return `Customer shared a link${metadata?.url ? `: ${metadata.url}` : ""}.`;
  return message.body;
}

function buildMilestones(messages: CommunicationMessage[]): ConversationMilestone[] {
  const inboundMessages = messages.filter((message) => message.direction === "inbound");
  const firstInbound = inboundMessages[0];
  const milestones: ConversationMilestone[] = [];

  if (firstInbound) {
    milestones.push({
      id: `milestone-start-${firstInbound.id}`,
      conversationId: firstInbound.conversationId,
      type: "conversation_started",
      source: "customer",
      messageId: firstInbound.id,
      occurredAt: firstInbound.occurredAt,
      summary: "Conversation started with the customer.",
      searchableText: firstInbound.body,
      metadata: firstInbound.contentMetadata,
    });
  }

  inboundMessages.forEach((message) => {
    if (!message.contentType || message.contentType === "text") return;
    milestones.push({
      id: `milestone-${message.id}`,
      conversationId: message.conversationId,
      type: milestoneTypeByContentType[message.contentType],
      source: "customer",
      messageId: message.id,
      occurredAt: message.occurredAt,
      summary: getContentSummary(message),
      searchableText: [message.body, message.contentMetadata?.name, message.contentMetadata?.url, message.contentMetadata?.locationLabel]
        .filter(Boolean)
        .join(" "),
      metadata: message.contentMetadata,
    });
  });

  return milestones;
}

export function buildConversationContext(detail: ConversationDetail): ConversationContext {
  return {
    conversationId: detail.summary.id,
    contact: detail.summary.contact,
    channel: detail.summary.channel,
    status: detail.summary.status,
    messages: detail.messages,
    milestones: buildMilestones(detail.messages),
  };
}
