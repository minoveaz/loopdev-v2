import { beforeEach, describe, expect, it } from "vitest";
import { localSettingsAdapter } from "@/loopdev/domains/settings";
import { platformAdapter } from "@/loopdev/domains/platform/adapter";

describe("settings adapter", () => {
  beforeEach(() => {
    localStorage.clear();
    platformAdapter.setOrganizationContext({
      tenantId: "tenant-a",
      organizationId: "local-development-organization",
      workspaceId: null,
      brandId: null,
      userId: "user-a",
      membershipStatus: "active",
    });
  });

  it("persists users and organization settings inside the active organization", async () => {
    const initial = await localSettingsAdapter.getSnapshot("local-development-organization");
    const invited = await localSettingsAdapter.inviteUser("local-development-organization", {
      name: "Ana García",
      email: "ana@example.com",
      role: "admin",
    });

    await localSettingsAdapter.updateOrganization("local-development-organization", {
      name: "Acme",
      slug: "acme",
      timezone: "Europe/Madrid",
      locale: "es",
    });

    const next = await localSettingsAdapter.getSnapshot("local-development-organization");
    expect(initial.organization.organizationId).toBe("local-development-organization");
    expect(next.organization.locale).toBe("es");
    expect(next.users.find((user) => user.id === invited.id)?.role).toBe("admin");
  });

  it("rejects a request for a different organization", async () => {
    await expect(localSettingsAdapter.getSnapshot("other-organization")).rejects.toMatchObject({ code: "forbidden" });
  });

  it("protects the owner from suspension and validates invitations", async () => {
    const snapshot = await localSettingsAdapter.getSnapshot("local-development-organization");
    await expect(localSettingsAdapter.updateUserStatus("local-development-organization", snapshot.users[0].id, "suspended"))
      .rejects.toMatchObject({ code: "invalid" });
    await expect(localSettingsAdapter.inviteUser("local-development-organization", { name: "", email: "invalid", role: "member" }))
      .rejects.toMatchObject({ code: "invalid" });
  });
});
