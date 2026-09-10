import { localPlatformAdapter } from "./local";
import type { PlatformWorkAdapter } from "./work";
import type {
  EntityRef,
  EntityScope,
  OrganizationContext,
  OrganizationId,
  PlatformPermission,
  PlatformPermissionSet,
  WorkspaceId,
} from "../types";
export {
  PlatformWorkAdapterError,
  type AppendTimelineInput,
  type CreateActivityInput,
  type CreateAttachmentInput,
  type CreateNotificationInput,
  type CreateNoteInput,
  type CreateTaskInput,
  type PlatformActivityListParams,
  type PlatformAttachmentListParams,
  type PlatformNotificationListParams,
  type PlatformNoteListParams,
  type PlatformPage,
  type PlatformScopeParams,
  type PlatformTaskListParams,
  type PlatformTimelineListParams,
  type UpdateNoteInput,
  type UpdateTaskInput,
  type PlatformWorkAdapter,
} from "./work";

export interface PlatformAdapter {
  getOrganizationContext(): OrganizationContext;
  setOrganizationContext(context: OrganizationContext): void;
  getScope(): EntityScope;
  getPermissionSet(organizationId?: OrganizationId): PlatformPermissionSet;
  hasPermission(permission: PlatformPermission, scope?: EntityScope): boolean;
  assertPermission(permission: PlatformPermission, scope?: EntityScope): void;
  canAccessEntity(ref: EntityRef, scope?: EntityScope): boolean;
  work: PlatformWorkAdapter;
}

export const platformAdapter: PlatformAdapter = localPlatformAdapter;
export { localPlatformAdapter } from "./local";
export { localPlatformWorkAdapter, platformWorkAdapter } from "./local";

export class PlatformAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: "forbidden" | "invalid-scope",
  ) {
    super(message);
    this.name = "PlatformAdapterError";
  }
}

export type { EntityRef, EntityScope, OrganizationContext, OrganizationId, PlatformPermission, PlatformPermissionSet, WorkspaceId };
