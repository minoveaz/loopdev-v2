export const pipelineStages = [
  { id: "prospecting", label: "Prospecting", terminal: false },
  { id: "qualified", label: "Qualified", terminal: false },
  { id: "proposal", label: "Proposal", terminal: false },
  { id: "negotiation", label: "Negotiation", terminal: false },
  { id: "won", label: "Won", terminal: true },
  { id: "lost", label: "Lost", terminal: true },
] as const;

export type PipelineStageId = (typeof pipelineStages)[number]["id"];

export const pipelineStageLabels = Object.fromEntries(
  pipelineStages.map(({ id, label }) => [id, label]),
) as Record<PipelineStageId, string>;

export const pipelineActions = [
  { id: "list-opportunities", label: "List opportunities" },
  { id: "create-manual-opportunity", label: "Create opportunity" },
  { id: "move-opportunity-stage", label: "Move opportunity" },
  { id: "update-opportunity", label: "Edit opportunity" },
  { id: "reopen-opportunity", label: "Reopen opportunity" },
  { id: "convert-lead", label: "Convert lead" },
] as const;

export const pipelineCapabilityContract = {
  id: "crm.pipeline",
  version: "1.0.0",
  owner: "CRM Platform",
  actions: pipelineActions,
  states: ["loading", "empty", "error", "forbidden", "conflict", "pending", "success"],
  labels: pipelineActions.map(({ id, label }) => ({ id, label })),
  validation: {
    requiredFields: ["contactId", "productKey"],
    stableStageIds: pipelineStages.map(({ id }) => id),
    terminalTransitionsRequireReopen: true,
  },
  navigation: {
    board: "/app/sales-crm/pipeline",
    opportunityDetail: "/app/sales-crm/opportunities/:opportunityId",
  },
  permissions: ["crm.opportunities.read", "crm.opportunities.write", "crm.opportunities.reopen"],
  platforms: {
    desktop_web: { required: true, renderer: "kanban", navigation: "router-link-and-pointer-drag" },
    mobile_web: { required: true, renderer: "stacked-stage-list", navigation: "stack-and-action-sheet" },
    ios: { required: false, renderer: "planned", navigation: "native-stack" },
    android: { required: false, renderer: "planned", navigation: "native-stack" },
  },
} as const;