export type OrganizationId = string;
export type WorkspaceId = string;

export interface EntityScope {
  organizationId: OrganizationId;
  workspaceId?: WorkspaceId | null;
  brandId?: string | null;
}

export interface EntityRef<EntityType extends string = string> {
  entityType: EntityType;
  entityId: string;
  scope: EntityScope;
}

/**
 * Shared work and collaboration contracts.
 *
 * These records intentionally live in Platform rather than CRM. CRM is the
 * first consumer, but the same references can be used by Projects, Support,
 * Documents and the future mobile client.
 */
export type PlatformVisibility = "private" | "team" | "organization";
export type PlatformRecordStatus = "active" | "archived";
export type TaskStatus = "open" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type TaskRelationType = "contact" | "lead" | "opportunity" | "task" | "note" | string;
export type ActivityType =
  | "task"
  | "note"
  | "stage_change"
  | "assignment"
  | "conversion"
  | "reopen"
  | "attachment"
  | "notification"
  | string;
export type ActivityActorType = "user" | "system";
export type ActivityOrigin = "task" | "note" | "entity" | "customer_360" | "system" | string;
export type ActivitySourceType = "task" | "note" | "activity" | "event" | "attachment" | string;

export interface PlatformPermissions {
  canRead: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canModerate: boolean;
}

export interface PlatformRecordBase {
  id: string;
  scope: EntityScope;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  visibility: PlatformVisibility;
  permissions: PlatformPermissions;
}

export interface TaskRecord extends PlatformRecordBase {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  ownerId: string | null;
  assignedUserId: string | null;
  dueAt: string | null;
  relation: EntityRef<TaskRelationType>;
  completedAt: string | null;
}

export interface TaskTemplateRecord extends PlatformRecordBase {
  key: string;
  name: string;
  description: string;
  defaultPriority: TaskPriority;
  defaultDueDays: number | null;
  relationTypes: Array<"contact" | "lead" | "opportunity" | string>;
}

export interface NoteRecord extends PlatformRecordBase {
  status: PlatformRecordStatus;
  relation: EntityRef<TaskRelationType>;
  authorId: string;
  body: string;
}

export interface ActivityRecord {
  id: string;
  scope: EntityScope;
  relation: EntityRef<TaskRelationType> | null;
  type: ActivityType;
  actorId: string | null;
  ownerId?: string | null;
  actorType: ActivityActorType;
  origin: ActivityOrigin;
  sourceType: ActivitySourceType;
  sourceId: string;
  summary: string;
  metadata: Record<string, string>;
  visibility?: PlatformVisibility;
  permissions?: PlatformPermissions;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  scope: EntityScope;
  relation: EntityRef<TaskRelationType> | null;
  type: ActivityType;
  actorId: string | null;
  ownerId?: string | null;
  actorType: ActivityActorType;
  origin: ActivityOrigin;
  sourceType: ActivitySourceType;
  sourceId: string;
  dedupeKey: string;
  summary: string;
  metadata: Record<string, string>;
  visibility?: PlatformVisibility;
  permissions?: PlatformPermissions;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export type AttachmentStatus = "pending" | "ready" | "failed" | "deleted";

export interface AttachmentRecord extends PlatformRecordBase {
  status: PlatformRecordStatus;
  relation: EntityRef<TaskRelationType>;
  fileName: string;
  mimeType: string;
  byteSize: number;
  storageKey: string | null;
  uploadedById: string;
  attachmentStatus: AttachmentStatus;
}

export type NotificationStatus = "unread" | "read" | "archived";

export interface NotificationRecord {
  id: string;
  scope: EntityScope;
  recipientUserId: string;
  actorId: string | null;
  type: ActivityType;
  title: string;
  body: string;
  relation: EntityRef<TaskRelationType> | null;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
}

export type OrganizationMembershipStatus = "active" | "pending" | "suspended";

export interface OrganizationContext {
  tenantId: string;
  organizationId: OrganizationId;
  workspaceId: WorkspaceId | null;
  brandId: string | null;
  userId: string | null;
  membershipStatus: OrganizationMembershipStatus;
}

export type PlatformPermission =
  | "organization.read"
  | "workspace.read"
  | "catalog.read"
  | "catalog.write"
  | "crm.read"
  | "crm.write"
  | "crm.assign"
  | "work.read"
  | "work.write"
  | "work.assign"
  | "notifications.read"
  | "admin"
  | "sensitive.read";

export interface PlatformPermissionSet {
  organizationId: OrganizationId;
  permissions: readonly PlatformPermission[];
}

export function isScopeVisible(recordScope: EntityScope, requestedScope: EntityScope): boolean {
  if (recordScope.organizationId !== requestedScope.organizationId) return false;
  if (recordScope.workspaceId == null) return true;
  return recordScope.workspaceId === requestedScope.workspaceId;
}
