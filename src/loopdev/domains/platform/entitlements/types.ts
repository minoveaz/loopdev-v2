export type OrganizationEntitlementKey =
  | "crm.automations"
  | "crm.automation.executions"
  | "crm.contacts"
  | "crm.opportunities";

export type OrganizationEntitlementPermission = "entitlements.read" | "entitlements.write";

export interface OrganizationEntitlement {
  id: string;
  organizationId: string;
  key: OrganizationEntitlementKey;
  enabled: boolean;
  limit: number | null;
  used: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationEntitlementsAdapter {
  hasPermission(organizationId: string, permission: OrganizationEntitlementPermission): boolean;
  assertPermission(organizationId: string, permission: OrganizationEntitlementPermission): void;
  list(organizationId: string): Promise<OrganizationEntitlement[]>;
  get(organizationId: string, key: OrganizationEntitlementKey): OrganizationEntitlement | undefined;
  hasFeature(organizationId: string, key: OrganizationEntitlementKey): boolean;
  canUse(organizationId: string, key: OrganizationEntitlementKey, amount?: number): boolean;
  assertCanUse(organizationId: string, key: OrganizationEntitlementKey, amount?: number): void;
  consume(organizationId: string, key: OrganizationEntitlementKey, amount?: number): OrganizationEntitlement;
  set(organizationId: string, key: OrganizationEntitlementKey, patch: Partial<Pick<OrganizationEntitlement, "enabled" | "limit" | "used">>): OrganizationEntitlement;
}
