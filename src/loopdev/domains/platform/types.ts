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
