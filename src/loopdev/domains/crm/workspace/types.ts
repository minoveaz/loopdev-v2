import type {
  CRMContact,
  CRMLead,
  CRMOpportunity,
  CRMLeadMutationResult,
  CRMUpdateLeadInput,
} from "../adapter/types";
import type {
  CreateNoteInput,
  CreateTaskInput,
} from "@/loopdev/domains/platform/adapter";
import type { NoteRecord, TaskRecord, TimelineEvent } from "@/loopdev/domains/platform";

export interface CRMWorkspaceContext {
  organizationId: string;
  workspaceId: string;
  userId: string;
}

export interface CRMWorkspacePermissions {
  canRead: boolean;
  canWrite: boolean;
  canAssign: boolean;
}

export interface CRMWorkspace {
  contact: CRMContact;
  leads: CRMLead[];
  opportunities: CRMOpportunity[];
  tasks: TaskRecord[];
  notes: NoteRecord[];
  timeline: TimelineEvent[];
  permissions: CRMWorkspacePermissions;
}

export interface CRMWorkspaceAdapter {
  getWorkspace(context: CRMWorkspaceContext, contactId: string): Promise<CRMWorkspace | null>;
  createTask(context: CRMWorkspaceContext, input: Omit<CreateTaskInput, "scope" | "organizationId" | "workspaceId">): Promise<TaskRecord>;
  createNote(context: CRMWorkspaceContext, input: Omit<CreateNoteInput, "scope" | "organizationId" | "workspaceId">): Promise<NoteRecord>;
  updateLead(
    context: CRMWorkspaceContext,
    leadId: string,
    input: Omit<CRMUpdateLeadInput, "organizationId">,
  ): Promise<CRMLeadMutationResult>;
  assignTask(context: CRMWorkspaceContext, taskId: string, assignedUserId: string | null, expectedVersion: number): Promise<TaskRecord>;
}

export const CRM_WORKSPACE_LOCAL_CONTEXT: CRMWorkspaceContext = {
  organizationId: "local-development-organization",
  workspaceId: "local-workspace",
  userId: "local-development-user",
};
