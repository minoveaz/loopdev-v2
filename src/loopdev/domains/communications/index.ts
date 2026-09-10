import { localCommunicationsAdapter } from "./adapter/local";
import type { CommunicationsAdapter } from "./types";

export * from "./types";
export { localCommunicationsAdapter };
export { localCommunicationChannels, localCommunicationsStore } from "./data/localCommunications";
export * from "./hooks/use-communications";

export interface CommunicationsDomainAdapter {
  communications: CommunicationsAdapter;
}

export const communicationsAdapter: CommunicationsDomainAdapter = {
  communications: localCommunicationsAdapter,
};
