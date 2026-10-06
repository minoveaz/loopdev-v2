import { describe, expect, it, vi } from "vitest";
import { SupabaseAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
import { TenantContextAdapter } from "@/loopdev/domains/platform/adapter/tenant-context";
import type { PlatformAuthStorage } from "@contracts/auth-port";

class MemoryStorage implements PlatformAuthStorage {
  private data = new Map<string, string>();
  async getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  async setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  async removeItem(key: string) {
    this.data.delete(key);
  }
}

describe("AuthPort & TenantContextPort Platform Implementation", () => {
  it("authenticates and manages session lifecycle via SupabaseAuthAdapter", async () => {
    const storage = new MemoryStorage();
    const adapter = new SupabaseAuthAdapter({ storage });

    const initialSession = await adapter.getSession();
    expect(initialSession).toBeNull();

    const signInRes = await adapter.signInWithPassword({
      email: "admin@loop.dev",
      password: "secure-password",
    });

    expect(signInRes.success).toBe(true);
    if (!signInRes.success) return;

    expect(signInRes.data.user.email).toBe("admin@loop.dev");
    expect(signInRes.data.user.isSuperAdmin).toBe(true);

    const activeSession = await adapter.getSession();
    expect(activeSession?.user.email).toBe("admin@loop.dev");

    // Sign out cleans storage
    await adapter.signOut();
    const afterSignOut = await adapter.getSession();
    expect(afterSignOut).toBeNull();
  });

  it("handles password recovery in dev mode without SMTP (DEC-AUTH-004)", async () => {
    const storage = new MemoryStorage();
    const adapter = new SupabaseAuthAdapter({ storage });

    const resetRes = await adapter.requestPasswordReset({ email: "user@loop.dev" });
    expect(resetRes.success).toBe(true);
    if (!resetRes.success) return;

    expect(resetRes.data.sent).toBe(true);
    expect(resetRes.data.deliveryChannel).toBe("inbucket_dev");
  });

  it("exposes all organizations for Super Admin / Owner and enforces tenant isolation", async () => {
    const storage = new MemoryStorage();
    const authAdapter = new SupabaseAuthAdapter({ storage });
    await authAdapter.signInWithPassword({ email: "admin@loop.dev", password: "pwd" });

    const purgeSpy = vi.fn();
    const tenantAdapter = new TenantContextAdapter(authAdapter, storage, purgeSpy);

    const orgsRes = await tenantAdapter.listOrganizations();
    expect(orgsRes.success).toBe(true);
    if (!orgsRes.success) return;

    // Super Admin sees multiple organizations
    expect(orgsRes.data.length).toBeGreaterThanOrEqual(2);

    // Switching tenant triggers atomic purge (DEC-AUTH-005)
    const targetOrg = orgsRes.data[1];
    const switchRes = await tenantAdapter.selectOrganization(targetOrg.id);
    expect(switchRes.success).toBe(true);
    expect(purgeSpy).toHaveBeenCalled();
    expect(tenantAdapter.getTenantContext()?.activeOrganizationId).toBe(targetOrg.id);
  });

  it("handles signUp and updatePassword lifecycle cleanly", async () => {
    const storage = new MemoryStorage();
    const adapter = new SupabaseAuthAdapter({ storage });

    const signUpRes = await adapter.signUpWithPassword({
      email: "newuser@loop.dev",
      password: "password123",
      fullName: "New Developer",
    });
    expect(signUpRes.success).toBe(true);
    if (!signUpRes.success) return;
    expect(signUpRes.data.user.email).toBe("newuser@loop.dev");
    expect(signUpRes.data.user.fullName).toBe("New Developer");

    const updateRes = await adapter.updatePassword({ newPassword: "newpassword456" });
    expect(updateRes.success).toBe(true);

    const weakUpdateRes = await adapter.updatePassword({ newPassword: "123" });
    expect(weakUpdateRes.success).toBe(false);
  });
});
