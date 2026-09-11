import type { CommunicationsAdapter } from "../types";

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

export type CommunicationsAdapterDependencies = CommunicationsAdapter;

export type { CommunicationsAdapter as LoopdevCommunicationsAdapter };
