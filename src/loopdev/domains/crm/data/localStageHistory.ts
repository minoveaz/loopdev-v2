import { createLocalStore } from "@/lib/localStore";
import type { CRMOpportunityStageHistory } from "../adapter/types";

export const localCrmStageHistoryStore = createLocalStore<CRMOpportunityStageHistory>({
  key: "loopdev:crm:opportunity-stage-history",
  idPrefix: "crm_stage_history",
  seed: [],
});
