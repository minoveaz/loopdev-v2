import { localPlatformAdapter } from "./local";
import type { OrganizationEntitlementsAdapter } from "../entitlements";
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
import type { AnalyticsAdapter } from "../analytics";
export {
  PlatformWorkAdapterError,
  type AppendTimelineInput,
  type CreateActivityInput,
  type CreateAttachmentInput,
  type CreateNotificationInput,
  type CreateNoteInput,
  type CreateTaskInput,
  type CreateTaskTemplateInput,
  type PlatformActivityListParams,
  type PlatformAttachmentListParams,
  type PlatformNotificationListParams,
  type PlatformNoteListParams,
  type PlatformPage,
  type PlatformScopeParams,
  type PlatformTaskListParams,
  type PlatformTaskTemplateListParams,
  type PlatformTimelineListParams,
  type UpdateNoteInput,
  type UpdateTaskInput,
  type UpdateTaskTemplateInput,
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
  entitlements: OrganizationEntitlementsAdapter;
  work: PlatformWorkAdapter;
  analytics: AnalyticsAdapter;
}

export const platformAdapter: PlatformAdapter = localPlatformAdapter;
export { localPlatformAdapter } from "./local";
export { localPlatformWorkAdapter, platformWorkAdapter } from "./local";
export { createDesktopNotesPort } from "./notes-port";

export { PlatformAdapterError } from "../types";

export type { EntityRef, EntityScope, OrganizationContext, OrganizationId, PlatformPermission, PlatformPermissionSet, WorkspaceId };
