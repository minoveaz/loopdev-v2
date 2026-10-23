import { createClient, type SupabaseClient, type Session, type AuthChangeEvent as SupabaseAuthChangeEvent } from "@supabase/supabase-js";
import type {
  AuthPort,
  AuthSession,
  AuthResult,
  AuthError,
  AuthErrorCode,
  PlatformUser,
  AuthAssuranceLevel,
  AuthSecurityStatus,
  AuthMfaFactor,
  RequestEmailChangeInput,
  RequestEmailChangeResult,
  BeginTotpEnrollmentInput,
  TotpEnrollment,
  VerifyTotpInput,
  RemoveTotpFactorInput,
  SignInWithPasswordInput,
  SignUpWithPasswordInput,
  PasswordResetInput,
  UpdatePasswordInput,
  UpdatePlatformProfileInput,
  PasswordResetResult,
  AuthChangeEvent,
  PlatformAuthStorage,
  Workspace,
  WorkspaceStatus,
  WorkspaceSuiteKey,
} from "@contracts/auth-port";
import { isPlatformAvatarReference } from "../../../../../packages/contracts/src/account-profile";
import { isAuthAssuranceLevel } from "../../../../../packages/contracts/src/auth-port";

function mapSupabaseAuthError(error: unknown, fallback: AuthErrorCode): AuthError {
  const details = typeof error === "object" && error !== null ? error as Record<string, unknown> : {};
  const providerCode = typeof details.code === "string" ? details.code : "";
  const code: AuthErrorCode =
    ["insufficient_aal", "mfa_verification_required", "reauthentication_needed"].includes(providerCode)
      ? "AUTH_REAUTH_REQUIRED"
      : providerCode === "mfa_factor_not_found"
        ? "AUTH_MFA_FACTOR_NOT_FOUND"
        : fallback;
  const message = typeof details.message === "string" ? details.message : "Authentication provider request failed.";
  const status = typeof details.status === "number" ? details.status : undefined;
  return { code, message, ...(status === undefined ? {} : { status }) };
}

function authFailure<T>(code: AuthErrorCode, message: string): AuthResult<T> {
  return { success: false, error: { code, message } };
}

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

const WORKSPACE_SUITE_KEYS: readonly WorkspaceSuiteKey[] = [
  "marketing",
  "crm",
  "operations",
  "communications",
  "health",
  "quant",
  "finance",
];
const WORKSPACE_STATUSES: readonly WorkspaceStatus[] = ["active", "disabled", "archived"];

function isWorkspaceSuiteKey(value: unknown): value is WorkspaceSuiteKey {
  return typeof value === "string" && (WORKSPACE_SUITE_KEYS as readonly string[]).includes(value);
}

function isWorkspaceStatus(value: unknown): value is WorkspaceStatus {
  return typeof value === "string" && (WORKSPACE_STATUSES as readonly string[]).includes(value);
}

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
                  role: m.role || "viewer",
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
      .select("id, organization_id, suite_key, status, slug, name, created_at")
      .eq("organization_id", organizationId)
      .order("name");

    if (error) throw new Error(`Unable to load organization workspaces: ${error.message}`);
    if (!Array.isArray(data)) throw new Error("Unable to load organization workspaces: invalid response.");

    return data.map((workspace) => {
      if (!isWorkspaceSuiteKey(workspace.suite_key) || !isWorkspaceStatus(workspace.status)) {
        throw new Error(`Organization workspace ${workspace.id} has an unsupported suite or status.`);
      }

      return {
        id: workspace.id,
        organizationId: workspace.organization_id,
        suiteKey: workspace.suite_key,
        status: workspace.status,
        slug: workspace.slug,
        name: workspace.name,
        createdAt: workspace.created_at,
      };
    });
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
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + 3600 * 1000,
      user: this.mapUser(session.user),
    };
  }

  private mapUser(user: Session["user"]): PlatformUser {
    const isSuperAdmin = Boolean(
      user.app_metadata?.is_super_admin ||
      user.app_metadata?.role === "owner" ||
      user.user_metadata?.is_super_admin
    );
    const avatarUrl = user.user_metadata?.avatar_url;

    return {
      id: user.id,
      email: user.email ?? "",
      fullName: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      avatarUrl: isPlatformAvatarReference(avatarUrl) ? avatarUrl : null,
      isSuperAdmin,
      createdAt: user.created_at,
      updatedAt: user.updated_at ?? user.created_at,
    };
  }

  private profileError(code: AuthError["code"], message: string): AuthResult<PlatformUser> {
    return { success: false, error: { code, message } };
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

  async signOutOtherSessions(): Promise<AuthResult<void>> {
    if (!this.client) {
      return {
        success: false,
        error: {
          code: "AUTH_OPERATION_UNSUPPORTED",
          message: "Signing out other sessions requires an authentication provider.",
        },
      };
    }

    const { data, error: sessionError } = await this.client.auth.getSession();
    if (sessionError || !data.session) {
      return {
        success: false,
        error: {
          code: "AUTH_SESSION_EXPIRED",
          message: sessionError?.message ?? "An active session is required.",
        },
      };
    }

    const { error } = await this.client.auth.signOut({ scope: "others" });
    if (error) {
      return {
        success: false,
        error: {
          code: "AUTH_NETWORK_ERROR",
          message: error.message,
        },
      };
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
      return authFailure("AUTH_WEAK_PASSWORD", "Password must be at least 6 characters.");
    }

    if (!this.client) {
      return authFailure("AUTH_OPERATION_UNSUPPORTED", "Password updates require an authentication provider.");
    }

    try {
      const { data: current, error: readError } = await this.client.auth.getUser();
      if (readError || !current.user) {
        return authFailure("AUTH_SESSION_EXPIRED", readError?.message ?? "An active session is required.");
      }
      const { error } = await this.client.auth.updateUser({ password: input.newPassword });
      if (error) {
        return { success: false, error: mapSupabaseAuthError(error, "AUTH_SESSION_EXPIRED") };
      }
    } catch (error) {
      return { success: false, error: mapSupabaseAuthError(error, "AUTH_NETWORK_ERROR") };
    }

    return { success: true, data: undefined };
  }

  async getSecurityStatus(): Promise<AuthResult<AuthSecurityStatus>> {
    if (!this.client) {
      return authFailure("AUTH_OPERATION_UNSUPPORTED", "Security status requires an authentication provider.");
    }
    try {
      const { data: userData, error: userError } = await this.client.auth.getUser();
      if (userError || !userData.user) {
        return authFailure("AUTH_SESSION_EXPIRED", userError?.message ?? "An active session is required.");
      }

      const [factorResult, assuranceResult] = await Promise.all([
        this.client.auth.mfa.listFactors(),
        this.client.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (factorResult.error) return { success: false, error: mapSupabaseAuthError(factorResult.error, "AUTH_NETWORK_ERROR") };
      if (assuranceResult.error) return { success: false, error: mapSupabaseAuthError(assuranceResult.error, "AUTH_NETWORK_ERROR") };
      if (!factorResult.data || !assuranceResult.data) {
        return authFailure("AUTH_NETWORK_ERROR", "The provider returned incomplete security status.");
      }

      const currentLevel = assuranceResult.data.currentLevel;
      const nextLevel = assuranceResult.data.nextLevel;
      if (!isAuthAssuranceLevel(currentLevel) || !isAuthAssuranceLevel(nextLevel)) {
        return authFailure("AUTH_NETWORK_ERROR", "The provider returned an unsupported assurance level.");
      }

      const mfaFactors: AuthMfaFactor[] = factorResult.data.all
        .filter((factor) => factor.factor_type === "totp")
        .map((factor) => ({
          id: factor.id,
          type: "totp",
          status: factor.status,
          friendlyName: factor.friendly_name ?? null,
          createdAt: factor.created_at ?? null,
          updatedAt: factor.updated_at ?? null,
        }));

      return {
        success: true,
        data: {
          userId: userData.user.id,
          email: userData.user.email ?? "",
          emailVerified: Boolean(userData.user.email_confirmed_at),
          pendingEmailChange: userData.user.new_email ?? null,
          mfaFactors,
          currentAssuranceLevel: currentLevel,
          nextAssuranceLevel: nextLevel,
          signOutOtherSessionsAvailable: true,
        },
      };
    } catch (error) {
      return { success: false, error: mapSupabaseAuthError(error, "AUTH_NETWORK_ERROR") };
    }
  }

  async requestEmailChange(input: RequestEmailChangeInput): Promise<AuthResult<RequestEmailChangeResult>> {
    const newEmail = input.newEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return authFailure("AUTH_VALIDATION_ERROR", "Enter a valid email address.");
    }
    if (!this.client) {
      return authFailure("AUTH_OPERATION_UNSUPPORTED", "Email changes require an authentication provider.");
    }

    try {
      const { data: current, error: readError } = await this.client.auth.getUser();
      if (readError || !current.user) {
        return authFailure("AUTH_SESSION_EXPIRED", readError?.message ?? "An active session is required.");
      }
      const { data, error } = await this.client.auth.updateUser({ email: newEmail });
      if (error) return { success: false, error: mapSupabaseAuthError(error, "AUTH_NETWORK_ERROR") };
      if (!data.user || data.user.id !== current.user.id) {
        return authFailure("AUTH_SESSION_EXPIRED", "The active user changed during the email update.");
      }
      return {
        success: true,
        data: {
          currentEmail: data.user.email ?? current.user.email ?? "",
          newEmail: data.user.new_email ?? newEmail,
          status: "pending_confirmation",
        },
      };
    } catch (error) {
      return { success: false, error: mapSupabaseAuthError(error, "AUTH_NETWORK_ERROR") };
    }
  }

  async beginTotpEnrollment(input: BeginTotpEnrollmentInput = {}): Promise<AuthResult<TotpEnrollment>> {
    const friendlyName = input.friendlyName?.trim();
    if (friendlyName && friendlyName.length > 64) {
      return authFailure("AUTH_VALIDATION_ERROR", "Authenticator name must be 64 characters or fewer.");
    }
    if (!this.client) {
      return authFailure("AUTH_OPERATION_UNSUPPORTED", "MFA enrollment requires an authentication provider.");
    }

    try {
      const { data: current, error: readError } = await this.client.auth.getUser();
      if (readError || !current.user) {
        return authFailure("AUTH_SESSION_EXPIRED", readError?.message ?? "An active session is required.");
      }
      const { data, error } = await this.client.auth.mfa.enroll({
        factorType: "totp",
        ...(friendlyName ? { friendlyName } : {}),
      });
      if (error) return { success: false, error: mapSupabaseAuthError(error, "AUTH_NETWORK_ERROR") };
      if (data.type !== "totp" || !data.totp.qr_code || !data.totp.secret || !data.totp.uri) {
        return authFailure("AUTH_NETWORK_ERROR", "The provider returned incomplete TOTP enrollment data.");
      }
      return {
        success: true,
        data: {
          factorId: data.id,
          qrCode: data.totp.qr_code,
          secret: data.totp.secret,
          uri: data.totp.uri,
        },
      };
    } catch (error) {
      return { success: false, error: mapSupabaseAuthError(error, "AUTH_NETWORK_ERROR") };
    }
  }

  async verifyTotp(input: VerifyTotpInput): Promise<AuthResult<void>> {
    if (!input.factorId.trim() || !/^\d{6}$/.test(input.code.trim())) {
      return authFailure("AUTH_VALIDATION_ERROR", "A TOTP factor and six-digit code are required.");
    }
    if (!this.client) {
      return authFailure("AUTH_OPERATION_UNSUPPORTED", "MFA verification requires an authentication provider.");
    }

    try {
      const { data: current, error: readError } = await this.client.auth.getUser();
      if (readError || !current.user) {
        return authFailure("AUTH_SESSION_EXPIRED", readError?.message ?? "An active session is required.");
      }
      const { data: factors, error: factorsError } = await this.client.auth.mfa.listFactors();
      if (factorsError) return { success: false, error: mapSupabaseAuthError(factorsError, "AUTH_NETWORK_ERROR") };
      if (!factors?.all.some((factor) => factor.id === input.factorId && factor.factor_type === "totp")) {
        return authFailure("AUTH_MFA_FACTOR_NOT_FOUND", "The TOTP factor is not available to the authenticated user.");
      }

      const { error } = await this.client.auth.mfa.challengeAndVerify({
        factorId: input.factorId,
        code: input.code.trim(),
      });
      if (error) return { success: false, error: mapSupabaseAuthError(error, "AUTH_VALIDATION_ERROR") };
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: mapSupabaseAuthError(error, "AUTH_NETWORK_ERROR") };
    }
  }

  async removeTotpFactor(input: RemoveTotpFactorInput): Promise<AuthResult<void>> {
    if (!input.factorId.trim()) {
      return authFailure("AUTH_VALIDATION_ERROR", "A TOTP factor is required.");
    }
    if (!this.client) {
      return authFailure("AUTH_OPERATION_UNSUPPORTED", "MFA management requires an authentication provider.");
    }

    try {
      const { data: current, error: readError } = await this.client.auth.getUser();
      if (readError || !current.user) {
        return authFailure("AUTH_SESSION_EXPIRED", readError?.message ?? "An active session is required.");
      }
      const { data: factors, error: factorsError } = await this.client.auth.mfa.listFactors();
      if (factorsError) return { success: false, error: mapSupabaseAuthError(factorsError, "AUTH_NETWORK_ERROR") };
      if (!factors?.all.some((factor) => factor.id === input.factorId && factor.factor_type === "totp")) {
        return authFailure("AUTH_MFA_FACTOR_NOT_FOUND", "The TOTP factor is not available to the authenticated user.");
      }

      const { data, error } = await this.client.auth.mfa.unenroll({ factorId: input.factorId });
      if (error) return { success: false, error: mapSupabaseAuthError(error, "AUTH_NETWORK_ERROR") };
      if (data.id !== input.factorId) {
        return authFailure("AUTH_NETWORK_ERROR", "The provider did not confirm the requested factor removal.");
      }
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: mapSupabaseAuthError(error, "AUTH_NETWORK_ERROR") };
    }
  }

  async updateProfile(input: UpdatePlatformProfileInput): Promise<AuthResult<PlatformUser>> {
    const allowedKeys = new Set(["fullName", "avatarUrl", "expectedUserUpdatedAt", "mutationId"]);
    if (Object.keys(input).some((key) => !allowedKeys.has(key))) {
      return this.profileError("AUTH_VALIDATION_ERROR", "The profile update contains unsupported fields.");
    }

    const updatesName = input.fullName !== undefined;
    const updatesAvatar = input.avatarUrl !== undefined;
    const fullName = input.fullName?.trim();
    if (!input.mutationId.trim() || (!updatesName && !updatesAvatar)) {
      return this.profileError("AUTH_VALIDATION_ERROR", "A mutation ID and at least one profile field are required.");
    }
    if (updatesName && (!fullName || fullName.length > 120)) {
      return this.profileError("AUTH_VALIDATION_ERROR", "Name must contain between 1 and 120 characters.");
    }
    if (input.avatarUrl !== undefined && input.avatarUrl !== null && !isPlatformAvatarReference(input.avatarUrl)) {
      return this.profileError("AUTH_VALIDATION_ERROR", "Avatar must reference a private Files asset.");
    }
    if (!this.client) {
      return this.profileError("AUTH_OPERATION_UNSUPPORTED", "Profile updates require an authentication provider.");
    }

    const { data: current, error: readError } = await this.client.auth.getUser();
    if (readError || !current.user) {
      return this.profileError("AUTH_SESSION_EXPIRED", readError?.message ?? "An active session is required.");
    }
    if (input.expectedUserUpdatedAt && input.expectedUserUpdatedAt !== current.user.updated_at) {
      return this.profileError("AUTH_VERSION_CONFLICT", "The profile changed since it was loaded. Refresh and try again.");
    }

    const userMetadata = { ...current.user.user_metadata };
    if (updatesName) userMetadata.full_name = fullName;
    if (updatesAvatar) userMetadata.avatar_url = input.avatarUrl;

    const { data, error } = await this.client.auth.updateUser({ data: userMetadata });
    if (error || !data.user) {
      return this.profileError("AUTH_NETWORK_ERROR", error?.message ?? "The provider did not confirm the profile update.");
    }

    return { success: true, data: this.mapUser(data.user) };
  }

}

const authGlobal = globalThis as typeof globalThis & {
  __loopdevDefaultWebAuthAdapter?: SupabaseAuthAdapter;
};

const deploymentSupabaseUrl =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL
    ? import.meta.env.VITE_SUPABASE_URL
    : DEFAULT_SUPABASE_URL;
const deploymentSupabaseAnonKey =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : DEFAULT_SUPABASE_ANON_KEY;

export const defaultWebAuthAdapter = authGlobal.__loopdevDefaultWebAuthAdapter ??= new SupabaseAuthAdapter({
  supabaseUrl: deploymentSupabaseUrl,
  supabaseAnonKey: deploymentSupabaseAnonKey,
});
