import { describe, expect, it } from "vitest";
import { isScopeVisible, localPlatformAdapter, platformAdapter } from "@/loopdev/domains/platform";

describe("local Platform foundation", () => {
  it("provides an organization/workspace scope without exposing storage to consumers", () => {
    expect(platformAdapter.getScope()).toEqual({
      organizationId: "local-development-organization",
      workspaceId: "local-workspace",
      brandId: null,
    });
    expect(platformAdapter.hasPermission("catalog.read")).toBe(true);
    expect(platformAdapter.hasPermission("sensitive.read")).toBe(false);
  });

  it("keeps entity access scoped to the active organization and workspace", () => {
    const scope = platformAdapter.getScope();
    expect(platformAdapter.canAccessEntity({
      entityType: "catalog_item",
      entityId: "shared-item",
      scope: { organizationId: scope.organizationId, workspaceId: null },
    })).toBe(true);
    expect(platformAdapter.canAccessEntity({
      entityType: "catalog_item",
      entityId: "other-item",
      scope: { organizationId: "other-development-organization", workspaceId: null },
    })).toBe(false);
    expect(isScopeVisible(
      { organizationId: scope.organizationId, workspaceId: "workspace-health" },
      { organizationId: scope.organizationId, workspaceId: "local-workspace" },
    )).toBe(false);
  });

  it("exposes the local adapter as the replaceable platform boundary", () => {
    expect(localPlatformAdapter).toBe(platformAdapter);
    expect(platformAdapter.getPermissionSet().organizationId).toBe("local-development-organization");
  });
});
