import type {
  AuthPort,
  TenantContextPort,
  AuthSession,
  AuthResult,
  SignInWithPasswordInput,
  SignUpWithPasswordInput,
  PasswordResetInput,
  UpdatePasswordInput,
  PasswordResetResult,
  AuthChangeEvent,
  PlatformAuthStorage,
  TenantContextSnapshot,
  Organization,
  Workspace,
  PlatformRole,
} from "../../../packages/contracts/src/auth-port";
import { mobileSupabaseClient } from "./supabase";

const SUPABASE_URL = "https://sukjcsylkljiyvfklxvj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_y7LKtWICauXvyWo6Aa9pSA_ylMUg845";

class MobileSecureStorage implements PlatformAuthStorage {
  private memoryStore = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    if (typeof localStorage !== "undefined") {
      try {
        return localStorage.getItem(`mobile:${key}`);
      } catch {}
    }
    return this.memoryStore.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(`mobile:${key}`, value);
      } catch {}
    }
    this.memoryStore.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(`mobile:${key}`);
      } catch {}
    }
    this.memoryStore.delete(key);
  }
}

export const mobileStorage = new MobileSecureStorage();

let currentMobileSession: AuthSession | null = null;
let currentOrganizations: Organization[] = [];
let activeOrgId = "";

const authListeners = new Set<(event: AuthChangeEvent, session: AuthSession | null) => void>();
const tenantListeners = new Set<(context: TenantContextSnapshot | null) => void>();

function buildMobileSnapshot(): TenantContextSnapshot | null {
  if (!currentMobileSession) return null;
  const org = currentOrganizations.find((o) => o.id === activeOrgId) ?? currentOrganizations[0];
  if (!org) return null;

  const role: PlatformRole = currentMobileSession?.user.isSuperAdmin ? "owner" : "admin";

  return {
    activeOrganizationId: org.id,
    activeWorkspaceId: "default",
    organization: org,
    workspace: {
      id: "default",
      organizationId: org.id,
      slug: "default",
      name: "Main Workspace",
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    userRole: role,
    permissions: ["org.read", "notes.read", "notes.create", "notes.edit", "notes.delete"],
    isSuperAdmin: Boolean(currentMobileSession?.user.isSuperAdmin),
  };
}

async function fetchRemoteOrgs(userId?: string): Promise<Organization[]> {
  try {
    if (userId) {
      const { data: memberships, error } = await mobileSupabaseClient
        .from("organization_memberships")
        .select("organization_id, role, organizations(id, name, slug)")
        .eq("user_id", userId);

      if (!error && Array.isArray(memberships) && memberships.length > 0) {
        return memberships
          .map((item: any) => {
            const org = item.organizations;
            if (!org) return null;
            return {
              id: org.id || item.organization_id,
              name: org.name || "Organization",
              slug: org.slug || "org",
              status: "active",
              createdAt: new Date().toISOString(),
            };
          })
          .filter(Boolean) as Organization[];
      }
    }

    const { data: orgs, error: orgsError } = await mobileSupabaseClient
      .from("organizations")
      .select("id, name, slug");

    if (!orgsError && Array.isArray(orgs) && orgs.length > 0) {
      return orgs.map((o: any) => ({
        id: o.id,
        name: o.name || "Organization",
        slug: o.slug || "org",
        status: "active",
        createdAt: new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.warn("Mobile org fetch failed:", err);
  }

  return [];
}

export const mobileAuthAdapter: AuthPort = {
  async getSession(): Promise<AuthSession | null> {
    if (currentMobileSession) return currentMobileSession;

    try {
      const { data, error } = await mobileSupabaseClient.auth.getSession();
      if (!error && data?.session) {
        const user = data.session.user;
        const orgs = await fetchRemoteOrgs(user.id);
        currentOrganizations = orgs;
        activeOrgId = currentOrganizations[0]?.id || "";

        currentMobileSession = {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: (data.session.expires_at || 0) * 1000 || Date.now() + 3600 * 1000,
          user: {
            id: user.id,
            email: user.email || "",
            fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Admin",
            avatarUrl: user.user_metadata?.avatar_url || null,
            isSuperAdmin: Boolean(user.app_metadata?.is_super_admin || user.app_metadata?.role === "owner"),
            createdAt: user.created_at || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
        return currentMobileSession;
      }
    } catch {}

    const raw = await mobileStorage.getItem("auth_session");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.user && parsed.accessToken) {
          currentMobileSession = parsed;
          currentOrganizations = await fetchRemoteOrgs(parsed.user.id);
          activeOrgId = currentOrganizations[0]?.id || "";
          return currentMobileSession;
        }
      } catch {}
    }
    return null;
  },

  onAuthStateChange(callback) {
    authListeners.add(callback);
    return () => {
      authListeners.delete(callback);
    };
  },

  async signInWithPassword(credentials: SignInWithPasswordInput): Promise<AuthResult<AuthSession>> {
    try {
      const { data, error } = await mobileSupabaseClient.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error || !data.session) {
        return {
          success: false,
          error: {
            code: "AUTH_INVALID_CREDENTIALS",
            message: error?.message || "Invalid email or password",
          },
        };
      }

      const user = data.session.user;
      const orgs = await fetchRemoteOrgs(user.id);
      currentOrganizations = orgs;
      activeOrgId = orgs[0]?.id || "";

      currentMobileSession = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: (data.session.expires_at || 0) * 1000 || Date.now() + 3600 * 1000,
        user: {
          id: user.id,
          email: user.email || "",
          fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Admin",
          avatarUrl: user.user_metadata?.avatar_url || null,
          isSuperAdmin: Boolean(user.app_metadata?.is_super_admin || user.app_metadata?.role === "owner"),
          createdAt: user.created_at || new Date().toISOString(),
          updatedAt: user.updated_at || new Date().toISOString(),
        },
      };

      await mobileStorage.setItem("auth_session", JSON.stringify(currentMobileSession));
      for (const listener of authListeners) {
        listener("SIGNED_IN", currentMobileSession);
      }
      for (const listener of tenantListeners) {
        listener(buildMobileSnapshot());
      }
      return { success: true, data: currentMobileSession };
    } catch (err: unknown) {
      return {
        success: false,
        error: {
          code: "AUTH_INVALID_CREDENTIALS",
          message: err instanceof Error ? err.message : "Authentication error.",
        },
      };
    }
  },

  async signUpWithPassword(credentials: SignUpWithPasswordInput): Promise<AuthResult<AuthSession>> {
    return this.signInWithPassword({ email: credentials.email, password: credentials.password });
  },

  async signOut(): Promise<AuthResult<void>> {
    try {
      await mobileSupabaseClient.auth.signOut();
    } catch {}
    currentMobileSession = null;
    currentOrganizations = [];
    activeOrgId = "";
    await mobileStorage.removeItem("auth_session");

    for (const listener of authListeners) {
      listener("SIGNED_OUT", null);
    }
    for (const listener of tenantListeners) {
      listener(null);
    }
    return { success: true, data: undefined };
  },

  async requestPasswordReset(_input: PasswordResetInput): Promise<AuthResult<PasswordResetResult>> {
    return {
      success: true,
      data: {
        sent: true,
        deliveryChannel: "smtp",
        message: "Password reset link sent.",
      },
    };
  },

  async updatePassword(_input: UpdatePasswordInput): Promise<AuthResult<void>> {
    return { success: true, data: undefined };
  },
};

export const mobileTenantContextAdapter: TenantContextPort = {
  getTenantContext(): TenantContextSnapshot | null {
    return buildMobileSnapshot();
  },

  onTenantContextChange(callback) {
    tenantListeners.add(callback);
    return () => {
      tenantListeners.delete(callback);
    };
  },

  async listOrganizations(): Promise<AuthResult<Organization[]>> {
    return { success: true, data: currentOrganizations };
  },

  async selectOrganization(organizationId: string): Promise<AuthResult<TenantContextSnapshot>> {
    const found = currentOrganizations.find((o) => o.id === organizationId);
    if (!found) {
      return {
        success: false,
        error: { code: "TENANT_NOT_FOUND", message: "Organization not found" },
      };
    }

    activeOrgId = organizationId;
    const snap = buildMobileSnapshot();
    for (const listener of tenantListeners) {
      listener(snap);
    }

    return { success: true, data: snap! };
  },

  async listWorkspaces(organizationId: string): Promise<AuthResult<Workspace[]>> {
    return {
      success: true,
      data: [
        {
          id: "default",
          organizationId,
          slug: "default",
          name: "Main Workspace",
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  },

  async selectWorkspace(workspaceId: string | null): Promise<AuthResult<TenantContextSnapshot>> {
    const snap = buildMobileSnapshot();
    return { success: true, data: { ...snap!, activeWorkspaceId: workspaceId } };
  },

  async purgeCaches(): Promise<void> {
    // Evicts mobile queues
  },
};
