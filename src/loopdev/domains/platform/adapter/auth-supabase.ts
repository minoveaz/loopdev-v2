import { createClient, type SupabaseClient, type Session, type AuthChangeEvent as SupabaseAuthChangeEvent } from "@supabase/supabase-js";
import type {
  AuthPort,
  AuthSession,
  AuthResult,
  SignInWithPasswordInput,
  SignUpWithPasswordInput,
  PasswordResetInput,
  UpdatePasswordInput,
  PasswordResetResult,
  AuthChangeEvent,
  PlatformAuthStorage,
  Workspace,
} from "@contracts/auth-port";

export class BrowserLocalStorageAdapter implements PlatformAuthStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Storage quota or disabled cookies
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Storage quota or disabled cookies
    }
  }
}

export interface SupabaseAuthAdapterConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  storage?: PlatformAuthStorage;
  supabaseClient?: SupabaseClient;
}

export const DEFAULT_SUPABASE_URL = "https://sukjcsylkljiyvfklxvj.supabase.co";
export const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_y7LKtWICauXvyWo6Aa9pSA_ylMUg845";

export class SupabaseAuthAdapter implements AuthPort {
  private client: SupabaseClient | null = null;
  private storage: PlatformAuthStorage;
  private listeners: Set<(event: AuthChangeEvent, session: AuthSession | null) => void> = new Set();
  private isDevelopmentFallback = false;

  constructor(config: SupabaseAuthAdapterConfig = {}) {
    this.storage = config.storage ?? new BrowserLocalStorageAdapter();
    const isTest = typeof process !== "undefined" && (process.env?.NODE_ENV === "test" || process.env?.VITEST);
    const envUrl = !isTest && typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL ? import.meta.env.VITE_SUPABASE_URL : undefined;
    const envKey = !isTest && typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined;
    const url = config.supabaseUrl || envUrl || (!isTest ? DEFAULT_SUPABASE_URL : undefined);
    const key = config.supabaseAnonKey || envKey || (!isTest ? DEFAULT_SUPABASE_ANON_KEY : undefined);

    if (config.supabaseClient) {
      this.client = config.supabaseClient;
    } else if (url && key) {
      this.client = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } else {
      // Development mode fallback when real Supabase environment credentials are not present
      this.isDevelopmentFallback = true;
    }

    if (this.client) {
      this.client.auth.onAuthStateChange((event: SupabaseAuthChangeEvent, session: Session | null) => {
        const mappedEvent = this.mapSupabaseEvent(event);
        const mappedSession = session ? this.mapSession(session) : null;
        for (const listener of this.listeners) {
          try {
            listener(mappedEvent, mappedSession);
          } catch (e) {
            console.error("Auth listener error", e);
          }
        }
      });
    }
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public async getUserOrganizations(userId?: string): Promise<Array<{ id: string; name: string; slug: string; role: string }>> {
    if (this.client) {
      try {
        if (userId) {
          const { data: memberships, error } = await this.client
            .from("organization_memberships")
            .select("organization_id, role, organizations (id, name, slug)")
            .eq("user_id", userId);

          if (!error && Array.isArray(memberships) && memberships.length > 0) {
            const orgs = memberships
              .map((m: any) => {
                const o = m.organizations;
                if (!o) return null;
                return {
                  id: o.id || m.organization_id,
                  name: o.name || "Organización",
                  slug: o.slug || "org",
                  role: m.role || "member",
                };
              })
              .filter(Boolean) as Array<{ id: string; name: string; slug: string; role: string }>;
            if (orgs.length > 0) return orgs;
          }
        }

      } catch {
        return [];
      }

      return [];
    }

    return [
      { id: "80fce911-57c5-4a83-809f-78df6a3736f7", name: "LoopDev", slug: "loopdev", role: "admin" },
      { id: "31bf9e13-7ba4-46e9-9b47-cccd0a0baa3e", name: "Estar Protegidos", slug: "estar-protegidos", role: "admin" },
    ];
  }

  public async getUserWorkspaces(userId: string, organizationId: string): Promise<Workspace[]> {
    if (!this.client) return [];

    const { data, error } = await this.client
      .from("workspaces")
      .select("id, organization_id, slug, name, is_default, created_at")
      .eq("organization_id", organizationId)
      .order("is_default", { ascending: false })
      .order("name");

    if (error || !Array.isArray(data)) return [];

    return data.map((workspace) => ({
      id: workspace.id,
      organizationId: workspace.organization_id,
      slug: workspace.slug,
      name: workspace.name,
      isDefault: Boolean(workspace.is_default),
      createdAt: workspace.created_at,
    }));
  }

  private mapSupabaseEvent(event: SupabaseAuthChangeEvent): AuthChangeEvent {
    switch (event) {
      case "SIGNED_IN":
        return "SIGNED_IN";
      case "SIGNED_OUT":
        return "SIGNED_OUT";
      case "TOKEN_REFRESHED":
        return "TOKEN_REFRESHED";
      case "USER_UPDATED":
        return "USER_UPDATED";
      default:
        return "USER_UPDATED";
    }
  }

  private mapSession(session: Session): AuthSession {
    const isSuperAdmin = Boolean(
      session.user.app_metadata?.is_super_admin ||
      session.user.app_metadata?.role === "owner" ||
      session.user.user_metadata?.is_super_admin
    );

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + 3600 * 1000,
      user: {
        id: session.user.id,
        email: session.user.email ?? "",
        fullName: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
        avatarUrl: session.user.user_metadata?.avatar_url ?? null,
        isSuperAdmin,
        createdAt: session.user.created_at,
        updatedAt: session.user.updated_at ?? session.user.created_at,
      },
    };
  }

  async getSession(): Promise<AuthSession | null> {
    if (this.client) {
      const { data, error } = await this.client.auth.getSession();
      if (error || !data.session) return null;
      return this.mapSession(data.session);
    }

    // Local dev fallback session stored in PlatformAuthStorage
    const raw = await this.storage.getItem("loopdev.local_auth_session");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (parsed.expiresAt < Date.now()) {
        await this.storage.removeItem("loopdev.local_auth_session");
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: AuthSession | null) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  async signInWithPassword(credentials: SignInWithPasswordInput): Promise<AuthResult<AuthSession>> {
    if (this.client) {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error || !data.session) {
        return {
          success: false,
          error: {
            code: "AUTH_INVALID_CREDENTIALS",
            message: error?.message || "Invalid credentials provided.",
            status: error?.status,
          },
        };
      }

      const session = this.mapSession(data.session);
      return { success: true, data: session };
    }

    // Development Mode Fallback
    if (!credentials.email.includes("@")) {
      return {
        success: false,
        error: {
          code: "AUTH_INVALID_CREDENTIALS",
          message: "Please enter a valid email address.",
        },
      };
    }

    const isSuperAdmin = credentials.email.startsWith("admin@");
    const mockSession: AuthSession = {
      accessToken: `mock-jwt-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
      expiresAt: Date.now() + 3600 * 1000 * 24 * 7,
      user: {
        id: isSuperAdmin ? "usr_super_admin_001" : "usr_regular_001",
        email: credentials.email,
        fullName: credentials.email.split("@")[0].replace(/\b\w/g, (c) => c.toUpperCase()),
        avatarUrl: null,
        isSuperAdmin,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    await this.storage.setItem("loopdev.local_auth_session", JSON.stringify(mockSession));
    for (const listener of this.listeners) {
      listener("SIGNED_IN", mockSession);
    }

    return { success: true, data: mockSession };
  }

  async signUpWithPassword(credentials: SignUpWithPasswordInput): Promise<AuthResult<AuthSession>> {
    if (this.client) {
      const { data, error } = await this.client.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName || credentials.email.split("@")[0],
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: {
            code: "AUTH_INVALID_CREDENTIALS",
            message: error.message,
          },
        };
      }

      if (!data.session) {
        // Confirmation email required by Supabase auth configuration
        const pendingUser = {
          accessToken: "",
          refreshToken: "",
          expiresAt: 0,
          user: {
            id: data.user?.id ?? "usr_pending",
            email: data.user?.email ?? credentials.email,
            fullName: credentials.fullName ?? credentials.email.split("@")[0],
            avatarUrl: null,
            isSuperAdmin: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
        return { success: true, data: pendingUser };
      }

      const session = this.mapSession(data.session);
      return { success: true, data: session };
    }

    // Development Mode Fallback
    if (!credentials.email.includes("@")) {
      return {
        success: false,
        error: {
          code: "AUTH_INVALID_CREDENTIALS",
          message: "Please enter a valid email address.",
        },
      };
    }

    const isSuperAdmin = credentials.email.startsWith("admin@");
    const mockSession: AuthSession = {
      accessToken: `mock-jwt-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
      expiresAt: Date.now() + 3600 * 1000 * 24 * 7,
      user: {
        id: isSuperAdmin ? "usr_super_admin_001" : `usr_reg_${Date.now().toString(36)}`,
        email: credentials.email,
        fullName: credentials.fullName || credentials.email.split("@")[0].replace(/\b\w/g, (c) => c.toUpperCase()),
        avatarUrl: null,
        isSuperAdmin,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    await this.storage.setItem("loopdev.local_auth_session", JSON.stringify(mockSession));
    for (const listener of this.listeners) {
      listener("SIGNED_IN", mockSession);
    }

    return { success: true, data: mockSession };
  }

  async signOut(): Promise<AuthResult<void>> {
    if (this.client) {
      const { error } = await this.client.auth.signOut();
      if (error) {
        return {
          success: false,
          error: {
            code: "AUTH_STORAGE_ERROR",
            message: error.message,
          },
        };
      }
    } else {
      await this.storage.removeItem("loopdev.local_auth_session");
      for (const listener of this.listeners) {
        listener("SIGNED_OUT", null);
      }
    }

    return { success: true, data: undefined };
  }

  async requestPasswordReset(input: PasswordResetInput): Promise<AuthResult<PasswordResetResult>> {
    if (this.client) {
      const { error } = await this.client.auth.resetPasswordForEmail(input.email);
      if (error) {
        return {
          success: false,
          error: {
            code: "AUTH_EMAIL_SERVICE_UNAVAILABLE",
            message: error.message,
          },
        };
      }

      return {
        success: true,
        data: {
          sent: true,
          deliveryChannel: "smtp",
          message: "Password recovery instructions sent.",
        },
      };
    }

    // Dev environment fallback (DEC-AUTH-004)
    return {
      success: true,
      data: {
        sent: true,
        deliveryChannel: "inbucket_dev",
        message: "Development mode: Reset link captured via local Inbucket or admin CLI bypass.",
      },
    };
  }

  async updatePassword(input: UpdatePasswordInput): Promise<AuthResult<void>> {
    if (input.newPassword.length < 6) {
      return {
        success: false,
        error: {
          code: "AUTH_WEAK_PASSWORD",
          message: "Password must be at least 6 characters.",
        },
      };
    }

    if (this.client) {
      const { error } = await this.client.auth.updateUser({ password: input.newPassword });
      if (error) {
        return {
          success: false,
          error: {
            code: "AUTH_SESSION_EXPIRED",
            message: error.message,
          },
        };
      }
    }

    return { success: true, data: undefined };
  }
}

const authGlobal = globalThis as typeof globalThis & {
  __loopdevDefaultWebAuthAdapter?: SupabaseAuthAdapter;
};

export const defaultWebAuthAdapter = authGlobal.__loopdevDefaultWebAuthAdapter ??= new SupabaseAuthAdapter({
  supabaseUrl: DEFAULT_SUPABASE_URL,
  supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY,
});
