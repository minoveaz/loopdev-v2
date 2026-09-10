import { localOrganizationEntitlementsStore } from "../data/localEntitlements";
import type {
  OrganizationEntitlement,
  OrganizationEntitlementKey,
  OrganizationEntitlementsAdapter,
} from "../types";

export class EntitlementError extends Error {
  constructor(message: string, public readonly code: "forbidden" | "limit-exceeded") {
    super(message);
    this.name = "EntitlementError";
  }
}

function findEntitlement(organizationId: string, key: OrganizationEntitlementKey): OrganizationEntitlement | undefined {
  return localOrganizationEntitlementsStore.list().find((item) => item.organizationId === organizationId && item.key === key);
}

function hasLocalPermission(organizationId: string, permission: "entitlements.read" | "entitlements.write"): boolean {
  return organizationId === "local-development-organization"
    && (permission === "entitlements.read" || permission === "entitlements.write");
}

function assertLocalCanUse(organizationId: string, key: OrganizationEntitlementKey, amount: number): OrganizationEntitlement {
  const entitlement = findEntitlement(organizationId, key);
  if (!entitlement) throw new EntitlementError(`The ${key} entitlement is not configured.`, "forbidden");
  if (!entitlement.enabled) throw new EntitlementError(`The ${key} entitlement is not enabled.`, "forbidden");
  if (entitlement.limit !== null && entitlement.used + amount > entitlement.limit) {
    throw new EntitlementError(`The ${key} entitlement limit has been reached.`, "limit-exceeded");
  }
  return entitlement;
}

export const localOrganizationEntitlementsAdapter: OrganizationEntitlementsAdapter = {
  hasPermission(organizationId, permission) {
    return hasLocalPermission(organizationId, permission);
  },

  assertPermission(organizationId, permission) {
    if (!hasLocalPermission(organizationId, permission)) {
      throw new EntitlementError(`The ${permission} permission is not available.`, "forbidden");
    }
  },

  async list(organizationId) {
    return localOrganizationEntitlementsStore.list().filter((item) => item.organizationId === organizationId);
  },

  get(organizationId, key) {
    return findEntitlement(organizationId, key);
  },

  hasFeature(organizationId, key) {
    return Boolean(findEntitlement(organizationId, key)?.enabled);
  },

  canUse(organizationId, key, amount = 1) {
    const entitlement = findEntitlement(organizationId, key);
    return Boolean(entitlement?.enabled && (entitlement.limit === null || entitlement.used + amount <= entitlement.limit));
  },

  assertCanUse(organizationId, key, amount = 1) {
    assertLocalCanUse(organizationId, key, amount);
  },

  consume(organizationId, key, amount = 1): OrganizationEntitlement {
    const current = assertLocalCanUse(organizationId, key, amount);
    return localOrganizationEntitlementsStore.update(current.id, { used: current.used + amount }) ?? current;
  },

  set(organizationId, key: OrganizationEntitlementKey, patch) {
    const current = findEntitlement(organizationId, key);
    if (current) return localOrganizationEntitlementsStore.update(current.id, patch) ?? current;
    return localOrganizationEntitlementsStore.create({
      organizationId,
      key,
      enabled: patch.enabled ?? false,
      limit: patch.limit ?? null,
      used: patch.used ?? 0,
    });
  },
};
