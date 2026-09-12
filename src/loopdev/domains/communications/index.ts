import { localCommunicationsAdapter } from "./adapter/local";
import type { CommunicationsAdapter } from "./types";

export * from "./types";
export * from "./conversation-context";
export { localCommunicationsAdapter };
export { localCommunicationAgents, localCommunicationChannels, localCommunicationsStore } from "./data/localCommunications";
export * from "./hooks/use-communications";

export interface CommunicationsDomainAdapter {
  communications: CommunicationsAdapter;
}

export const communicationsAdapter: CommunicationsDomainAdapter = {
  communications: localCommunicationsAdapter,
};
