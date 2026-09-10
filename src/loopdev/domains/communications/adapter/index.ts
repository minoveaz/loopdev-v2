import type {
  CommunicationChannelAccount,
  CommunicationSendResult,
  CommunicationsAdapter,
  CommunicationsContext,
  ConversationDetail,
  ConversationFilters,
  ConversationListResult,
  ConversationStatus,
  ConversationSummary,
} from "../types";

export type {
  CommunicationChannelAccount,
  CommunicationsAdapter,
  CommunicationsContext,
  ConversationDetail,
  ConversationFilters,
  ConversationListResult,
  ConversationStatus,
  ConversationSummary,
  CommunicationSendResult,
} from "../types";

export interface CommunicationsAdapterDependencies {
  listChannels(context: CommunicationsContext): Promise<CommunicationChannelAccount[]>;
  listConversations(context: CommunicationsContext, filters?: ConversationFilters): Promise<ConversationListResult>;
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
  sendReply(
    context: CommunicationsContext,
    conversationId: string,
    body: string,
    expectedVersion?: number,
  ): Promise<CommunicationSendResult>;
  addInternalNote(
    context: CommunicationsContext,
    conversationId: string,
    body: string,
    expectedVersion?: number,
  ): Promise<CommunicationSendResult>;
}

export type { CommunicationsAdapter as LoopdevCommunicationsAdapter };
