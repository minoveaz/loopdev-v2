import { beforeEach, describe, expect, it } from "vitest";
import { EntitlementError, localOrganizationEntitlementsAdapter, localOrganizationEntitlementsStore } from "@/loopdev/domains/platform/entitlements";

const organizationId = "local-development-organization";

describe("local organization entitlements", () => {
  beforeEach(() => localOrganizationEntitlementsStore.reset());

  it("checks feature access and finite limits", () => {
    expect(localOrganizationEntitlementsAdapter.hasFeature(organizationId, "crm.automations")).toBe(true);
    expect(localOrganizationEntitlementsAdapter.canUse(organizationId, "crm.automations", 10)).toBe(true);
    localOrganizationEntitlementsAdapter.consume(organizationId, "crm.automations", 10);
    expect(localOrganizationEntitlementsAdapter.canUse(organizationId, "crm.automations")).toBe(false);
    expect(() => localOrganizationEntitlementsAdapter.assertCanUse(organizationId, "crm.automations")).toThrowError(EntitlementError);
  });

  it("supports disabled features and unlimited limits", () => {
    localOrganizationEntitlementsAdapter.set(organizationId, "crm.contacts", { enabled: false });
    expect(localOrganizationEntitlementsAdapter.hasFeature(organizationId, "crm.contacts")).toBe(false);
    expect(() => localOrganizationEntitlementsAdapter.assertCanUse(organizationId, "crm.contacts")).toThrowError(/not enabled/);
    localOrganizationEntitlementsAdapter.set(organizationId, "crm.contacts", { enabled: true, limit: null, used: 1000 });
    expect(localOrganizationEntitlementsAdapter.canUse(organizationId, "crm.contacts", 100000)).toBe(true);
  });
});
