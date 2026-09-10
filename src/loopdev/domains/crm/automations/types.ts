export type CRMAutomationEventType =
  | "contact.created"
  | "lead.created"
  | "lead.status_changed"
  | "opportunity.stage_changed"
  | "crm.contact.created"
  | "crm.lead.created"
  | "crm.lead.status_changed"
  | "crm.opportunity.stage_changed";

export type CRMAutomationActionType = "create_task" | "create_note" | "record_activity";

export interface CRMAutomationTrigger {
  eventType: CRMAutomationEventType;
  conditions?: Record<string, string | number | boolean | null>;
}

export interface CRMAutomationAction {
  type: CRMAutomationActionType;
  /** Action settings are intentionally JSON-compatible so a remote adapter can replace this one. */
  payload: Record<string, unknown>;
}

export interface CRMAutomation {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  active: boolean;
  trigger: CRMAutomationTrigger;
  actions: CRMAutomationAction[];
  createdAt: string;
  updatedAt: string;
}

export interface CRMEvent {
  id: string;
  organizationId: string;
  type: CRMAutomationEventType;
  entityType: "contact" | "lead" | "opportunity";
  entityId: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export type CRMExecutionStatus = "succeeded" | "skipped" | "failed";

export interface CRMExecutionLog {
  id: string;
  organizationId: string;
  automationId: string;
  eventId: string;
  idempotencyKey: string;
  status: CRMExecutionStatus;
  actionCount: number;
  error: string | null;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMCreateAutomationInput {
  organizationId: string;
  name: string;
  description?: string;
  active?: boolean;
  trigger: CRMAutomationTrigger;
  actions: CRMAutomationAction[];
}

export interface CRMEmitEventInput {
  organizationId: string;
  type: CRMAutomationEventType;
  entityType: CRMEvent["entityType"];
  entityId: string;
  payload?: Record<string, unknown>;
  idempotencyKey: string;
  occurredAt?: string;
}

export interface CRMExecutionLogParams {
  organizationId: string;
  automationId?: string;
  eventId?: string;
  limit?: number;
}

export interface CRMEventDispatchResult {
  event: CRMEvent;
  executions: CRMExecutionLog[];
  duplicate: boolean;
}

export interface CRMAutomationsAdapter {
  list(organizationId: string): Promise<CRMAutomation[]>;
  create(input: CRMCreateAutomationInput): Promise<CRMAutomation>;
  update(id: string, organizationId: string, patch: Partial<Pick<CRMAutomation, "name" | "description" | "active" | "trigger" | "actions">>): Promise<CRMAutomation | null>;
  remove(id: string, organizationId: string): Promise<boolean>;
  emitEvent(input: CRMEmitEventInput): Promise<CRMEventDispatchResult>;
  listExecutionLog(params: CRMExecutionLogParams): Promise<CRMExecutionLog[]>;
}
