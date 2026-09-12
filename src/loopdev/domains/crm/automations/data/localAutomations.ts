import { createLocalStore } from "@/lib/localStore";
import type { CRMAutomation, CRMEvent, CRMExecutionLog } from "../types";

export const localCrmAutomationsStore = createLocalStore<CRMAutomation>({
  key: "loopdev:crm:automations",
  idPrefix: "crm_automation",
  seed: [],
});

export const localCrmEventsStore = createLocalStore<CRMEvent>({
  key: "loopdev:crm:automation-events",
  idPrefix: "crm_event",
  seed: [],
});

export const localCrmExecutionLogStore = createLocalStore<CRMExecutionLog>({
  key: "loopdev:crm:automation-execution-log",
  idPrefix: "crm_execution",
  seed: [],
});

export const localCrmAutomationStore = localCrmAutomationsStore;
export const localCrmAutomationEventsStore = localCrmEventsStore;
export const localCrmAutomationExecutionLogStore = localCrmExecutionLogStore;
