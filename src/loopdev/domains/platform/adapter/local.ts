import { isScopeVisible, PlatformAdapterError } from "../types";
import type {
  EntityRef,
  EntityScope,
  OrganizationContext,
  OrganizationId,
  PlatformPermission,
  PlatformPermissionSet,
} from "../types";
import type { PlatformAdapter } from "./index";
import { createLocalPlatformWorkAdapter } from "./work";
import { localOrganizationEntitlementsAdapter } from "../entitlements";
import { createSupabaseTimelineAdapter } from "./supabase-timeline";
import { localAnalyticsAdapter, supabaseAnalyticsAdapter, supabaseAnalyticsConfigured } from "../analytics";
import type { AnalyticsAdapter } from "../analytics";

export const LOCAL_ORGANIZATION_ID = "local-development-organization";
export const LOCAL_WORKSPACE_ID = "local-workspace";

const localContext: OrganizationContext = {
  tenantId: "local-development-tenant",
  organizationId: LOCAL_ORGANIZATION_ID,
  workspaceId: LOCAL_WORKSPACE_ID,
  brandId: null,
  userId: "local-development-user",
  membershipStatus: "active",
};
const localPermissionSet: PlatformPermissionSet = {
  organizationId: LOCAL_ORGANIZATION_ID,
  permissions: [
    "organization.read",
    "workspace.read",
    "catalog.read",
    "catalog.write",
    "catalog.cost.read",
    "catalog.cost.manage",
    "crm.read",
    "crm.write",
    "crm.assign",
    "work.read",
    "work.write",
    "work.assign",
    "notifications.read",
  ],
};

let activeContext = { ...localContext };

function currentScope(): EntityScope {
  return {
    organizationId: activeContext.organizationId,
    workspaceId: activeContext.workspaceId,
    brandId: activeContext.brandId,
  };
}

function hasLocalPermission(permission: PlatformPermission, scope: EntityScope): boolean {
  if (scope.organizationId !== localPermissionSet.organizationId) return false;
  return localPermissionSet.permissions.includes(permission) || localPermissionSet.permissions.includes("admin");
}

const localWorkDependencies = {
  getScope: currentScope,
  getUserId: () => activeContext.userId,
  hasPermission: (permission: "work.read" | "work.write" | "work.assign", scope: EntityScope) =>
    hasLocalPermission(permission, scope),
};

export const localPlatformWorkAdapter = createLocalPlatformWorkAdapter(localWorkDependencies);
export const platformWorkAdapter = createSupabaseTimelineAdapter(localPlatformWorkAdapter);

export const localPlatformAdapter: PlatformAdapter = {
  entitlements: localOrganizationEntitlementsAdapter,
  getOrganizationContext() {
    return { ...activeContext };
  },

  setOrganizationContext(context) {
    activeContext = { ...context };
  },

  getScope: currentScope,

  getPermissionSet(organizationId: OrganizationId = activeContext.organizationId) {
    return organizationId === localPermissionSet.organizationId
      ? { ...localPermissionSet, permissions: [...localPermissionSet.permissions] }
      : { organizationId, permissions: [] };
  },

  hasPermission(permission: PlatformPermission, scope = currentScope()) {
    return hasLocalPermission(permission, scope);
  },

  assertPermission(permission, scope = currentScope()) {
    if (scope.organizationId !== activeContext.organizationId) {
      throw new PlatformAdapterError("The active organization does not match the requested scope.", "invalid-scope");
    }
    if (!hasLocalPermission(permission, scope)) {
      throw new PlatformAdapterError("You do not have permission for this organization.", "forbidden");
    }
  },

  canAccessEntity(ref: EntityRef, scope = currentScope()) {
    return hasLocalPermission("organization.read", scope) && isScopeVisible(ref.scope, scope);
  },

  work: platformWorkAdapter,
  analytics: {
    async getMetric(metricId, filters) {
      const remoteScope = /^[0-9a-f-]{36}$/i.test(filters.scope.organizationId);
      if (remoteScope) {
        if (!supabaseAnalyticsConfigured) {
          return { success: false, error: { code: "UNAVAILABLE", message: "Remote analytics is not configured for this tenant." } };
        }
        return supabaseAnalyticsAdapter.getMetric(metricId, filters);
      }
      return localAnalyticsAdapter.getMetric(metricId, filters);
    },
    async getTimeSeries(metricId, filters, interval) {
      const remoteScope = /^[0-9a-f-]{36}$/i.test(filters.scope.organizationId);
      if (remoteScope) {
        if (!supabaseAnalyticsConfigured) {
          return { success: false, error: { code: "UNAVAILABLE", message: "Remote analytics is not configured for this tenant." } };
        }
        return supabaseAnalyticsAdapter.getTimeSeries(metricId, filters, interval);
      }
      return localAnalyticsAdapter.getTimeSeries(metricId, filters, interval);
    },
    getBreakdown(metricId, filters) {
      const remoteScope = /^[0-9a-f-]{36}$/i.test(filters.scope.organizationId);
      if (remoteScope && supabaseAnalyticsConfigured) {
        return supabaseAnalyticsAdapter.getBreakdown(metricId, filters);
      }
      if (remoteScope) {
        return Promise.resolve({ success: false, error: { code: "UNAVAILABLE", message: "Remote analytics is not configured for this tenant." } });
      }
      return localAnalyticsAdapter.getBreakdown(metricId, filters);
    },
  } satisfies AnalyticsAdapter,
};
