import { localPlatformAdapter } from "./local";
import type {
  EntityRef,
  EntityScope,
  OrganizationContext,
  OrganizationId,
  PlatformPermission,
  PlatformPermissionSet,
  WorkspaceId,
} from "../types";

export interface PlatformAdapter {
  getOrganizationContext(): OrganizationContext;
  setOrganizationContext(context: OrganizationContext): void;
  getScope(): EntityScope;
  getPermissionSet(organizationId?: OrganizationId): PlatformPermissionSet;
  hasPermission(permission: PlatformPermission, scope?: EntityScope): boolean;
  assertPermission(permission: PlatformPermission, scope?: EntityScope): void;
  canAccessEntity(ref: EntityRef, scope?: EntityScope): boolean;
}

export const platformAdapter: PlatformAdapter = localPlatformAdapter;
export { localPlatformAdapter } from "./local";

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
