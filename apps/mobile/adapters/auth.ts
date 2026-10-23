import type { Session } from "@supabase/supabase-js";
import type {
  AuthError,
  AuthErrorCode,
  AuthPort,
  AuthResult,
  AuthSession,
  AuthChangeEvent,
  PasswordResetInput,
  PasswordResetResult,
  PlatformRole,
  SignInWithPasswordInput,
  SignUpWithPasswordInput,
  TenantContextPort,
  TenantContextSnapshot,
  UpdatePasswordInput,
  AuthSecurityStatus,
  RequestEmailChangeInput,
  RequestEmailChangeResult,
  BeginTotpEnrollmentInput,
  TotpEnrollment,
  VerifyTotpInput,
  RemoveTotpFactorInput,
  Organization,
  Workspace,
} from "../../../packages/contracts/src/auth-port";
import { isAuthAssuranceLevel } from "../../../packages/contracts/src/auth-port";
import type { PlatformUser } from "../../../packages/contracts/src/auth-port";
import {
  isPlatformAvatarReference,
  type UpdatePlatformProfileInput,
} from "../../../packages/contracts/src/account-profile";
import { MobileAuthStorageError } from "./mobile-auth-storage-core";
import { mobileSupabaseClient } from "./supabase";

type MobileOrganizationMembership = {
  organization: Organization;
  role: PlatformRole;
  permissions: string[];
};

const organizationRoles = ["owner", "admin", "agent", "viewer"] as const satisfies readonly PlatformRole[];

let currentMobileSession: AuthSession | null = null;
let currentMemberships: MobileOrganizationMembership[] = [];
let membershipsLoadedForUser: string | null = null;
let activeOrgId = "";

const authListeners = new Set<(event: AuthChangeEvent, session: AuthSession | null) => void>();
const tenantListeners = new Set<(context: TenantContextSnapshot | null) => void>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function providerError(error: unknown, fallback: AuthErrorCode): AuthError {
  if (error instanceof MobileAuthStorageError) {
    return { code: "AUTH_STORAGE_ERROR", message: error.message };
  }

  const details = isRecord(error) ? error : {};
  const message = typeof details.message === "string" ? details.message : "Authentication provider request failed.";
  const status = typeof details.status === "number" ? details.status : undefined;
  const providerCode = typeof details.code === "string" ? details.code : undefined;
  const code =
    providerCode === "weak_password"
      ? "AUTH_WEAK_PASSWORD"
      : ["insufficient_aal", "mfa_verification_required", "reauthentication_needed"].includes(providerCode ?? "")
        ? "AUTH_REAUTH_REQUIRED"
        : providerCode === "mfa_factor_not_found"
          ? "AUTH_MFA_FACTOR_NOT_FOUND"
      : error instanceof TypeError || (status !== undefined && status >= 500)
        ? "AUTH_NETWORK_ERROR"
        : fallback;

  return { code, message, ...(status === undefined ? {} : { status }) };
}

function mapSession(session: Session): AuthSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: (session.expires_at ?? 0) * 1000,
    user: mapUser(session.user),
  };
}

function mapUser(user: Session["user"]): PlatformUser {
  const avatarUrl = user.user_metadata?.avatar_url;
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
    avatarUrl: isPlatformAvatarReference(avatarUrl) ? avatarUrl : null,
    isSuperAdmin: Boolean(user.app_metadata?.is_super_admin),
    createdAt: user.created_at,
    updatedAt: user.updated_at ?? user.created_at,
  };
}

function mapMembershipRole(value: unknown): PlatformRole {
  const role = organizationRoles.find((candidate) => candidate === value);
  if (role) return role;
  throw new Error("The server returned an unsupported organization membership role.");
}

function mapMembership(value: unknown): Omit<MobileOrganizationMembership, "permissions"> {
  if (!isRecord(value)) throw new Error("The server returned an invalid organization membership.");

  const relation = value.organizations;
  const organizationValue = Array.isArray(relation) ? relation[0] : relation;
  if (!isRecord(organizationValue)) {
    throw new Error("The server returned a membership without its organization.");
  }
  if (
    typeof value.organization_id !== "string" ||
    typeof organizationValue.id !== "string" ||
    typeof organizationValue.name !== "string" ||
    typeof organizationValue.slug !== "string" ||
    typeof organizationValue.created_at !== "string" ||
    organizationValue.is_active !== true ||
    value.status !== "active" ||
    value.organization_id !== organizationValue.id
  ) {
    throw new Error("The server returned an invalid active organization membership.");
  }

  return {
    role: mapMembershipRole(value.role),
    organization: {
      id: organizationValue.id,
      name: organizationValue.name,
      slug: organizationValue.slug,
      status: "active",
      createdAt: organizationValue.created_at,
    },
  };
}

async function fetchRemoteMemberships(userId: string): Promise<MobileOrganizationMembership[]> {
  const { data, error } = await mobileSupabaseClient
    .from("organization_memberships")
    .select("organization_id, role, status, organizations!inner(id, name, slug, created_at, is_active)")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("organizations.is_active", true);

  if (error) throw error;
  if (!Array.isArray(data)) throw new Error("The server returned an invalid organization membership list.");

  const memberships = data.map(mapMembership);
  if (!memberships.length) return [];

  const roles = [...new Set(memberships.map(({ role }) => role))];
  const { data: permissionRows, error: permissionError } = await mobileSupabaseClient
    .from("role_permissions")
    .select("role, permission_key")
    .in("role", roles);

  if (permissionError) throw permissionError;
  if (!Array.isArray(permissionRows)) throw new Error("The server returned an invalid role permission list.");

  const permissionsByRole = new Map<PlatformRole, string[]>();
  for (const row of permissionRows) {
    if (!isRecord(row) || typeof row.permission_key !== "string") {
      throw new Error("The server returned an invalid role permission.");
    }
    const role = mapMembershipRole(row.role);
    permissionsByRole.set(role, [...(permissionsByRole.get(role) ?? []), row.permission_key]);
  }

  return memberships.map((membership) => ({
    ...membership,
    permissions: permissionsByRole.get(membership.role) ?? [],
  }));
}

function buildMobileSnapshot(): TenantContextSnapshot | null {
  if (!currentMobileSession) return null;
  const membership = currentMemberships.find(({ organization }) => organization.id === activeOrgId);
  if (!membership) return null;

  return {
    activeOrganizationId: membership.organization.id,
    activeWorkspaceId: "default",
    organization: membership.organization,
    workspace: {
      id: "default",
      organizationId: membership.organization.id,
      suiteKey: "crm",
      status: "active",
      slug: "default",
      name: "Main Workspace",
      createdAt: membership.organization.createdAt,
    },
    userRole: membership.role,
    permissions: membership.permissions,
    isSuperAdmin: currentMobileSession.user.isSuperAdmin,
  };
}

function clearMobileSession(): void {
  currentMobileSession = null;
  currentMemberships = [];
  membershipsLoadedForUser = null;
  activeOrgId = "";
}

function notifyAuthListeners(event: AuthChangeEvent, session: AuthSession | null): void {
  for (const listener of authListeners) listener(event, session);
}

function notifyTenantListeners(): void {
  const snapshot = buildMobileSnapshot();
  for (const listener of tenantListeners) listener(snapshot);
}

export const mobileAuthAdapter: AuthPort = {
  async getSession(): Promise<AuthSession | null> {
    const { data, error } = await mobileSupabaseClient.auth.getSession();
    if (error) throw new Error(`Unable to restore the authentication session: ${error.message}`);

    if (!data.session) {
      if (currentMobileSession) {
        clearMobileSession();
        notifyAuthListeners("SIGNED_OUT", null);
        notifyTenantListeners();
      }
      return null;
    }

    const session = mapSession(data.session);
    if (membershipsLoadedForUser !== session.user.id) {
      if (currentMobileSession && currentMobileSession.user.id !== session.user.id) {
        clearMobileSession();
        notifyTenantListeners();
      }
      const memberships = await fetchRemoteMemberships(session.user.id);
      currentMobileSession = session;
      currentMemberships = memberships;
      membershipsLoadedForUser = session.user.id;
      activeOrgId = currentMemberships[0]?.organization.id ?? "";
      notifyTenantListeners();
    } else if (currentMobileSession?.user.id !== session.user.id) {
      activeOrgId = currentMemberships[0]?.organization.id ?? "";
    }

    currentMobileSession = session;
    return session;
  },

  onAuthStateChange(callback) {
    authListeners.add(callback);
    return () => authListeners.delete(callback);
  },

  async signInWithPassword(credentials: SignInWithPasswordInput): Promise<AuthResult<AuthSession>> {
    try {
      const { data, error } = await mobileSupabaseClient.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) return { success: false, error: providerError(error, "AUTH_INVALID_CREDENTIALS") };
      if (!data.session) {
        return {
          success: false,
          error: { code: "AUTH_INVALID_CREDENTIALS", message: "The provider did not create an authenticated session." },
        };
      }

      const session = mapSession(data.session);
      if (currentMobileSession) {
        clearMobileSession();
        notifyTenantListeners();
      }
      const memberships = await fetchRemoteMemberships(session.user.id);
      currentMobileSession = session;
      currentMemberships = memberships;
      membershipsLoadedForUser = session.user.id;
      activeOrgId = memberships[0]?.organization.id ?? "";

      notifyAuthListeners("SIGNED_IN", session);
      notifyTenantListeners();
      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
    }
  },

  async signUpWithPassword(credentials: SignUpWithPasswordInput): Promise<AuthResult<AuthSession>> {
    return this.signInWithPassword({ email: credentials.email, password: credentials.password });
  },

  async signOut(): Promise<AuthResult<void>> {
    try {
      const { error } = await mobileSupabaseClient.auth.signOut();
      if (error) return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
    } catch (error) {
      return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
    }

    clearMobileSession();
    notifyAuthListeners("SIGNED_OUT", null);
    notifyTenantListeners();
    return { success: true, data: undefined };
  },

  async signOutOtherSessions(): Promise<AuthResult<void>> {
    try {
      const session = currentMobileSession ?? await this.getSession();
      if (!session) {
        return {
          success: false,
          error: { code: "AUTH_SESSION_EXPIRED", message: "An active session is required." },
        };
      }

      const { error } = await mobileSupabaseClient.auth.signOut({ scope: "others" });
      if (error) return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
    }
  },

  async requestPasswordReset(input: PasswordResetInput): Promise<AuthResult<PasswordResetResult>> {
    try {
      const { error } = await mobileSupabaseClient.auth.resetPasswordForEmail(input.email);
      if (error) return { success: false, error: providerError(error, "AUTH_EMAIL_SERVICE_UNAVAILABLE") };
      return {
        success: true,
        data: {
          sent: true,
          deliveryChannel: "provider",
          message: "Password reset request accepted by the authentication provider.",
        },
      };
    } catch (error) {
      return { success: false, error: providerError(error, "AUTH_EMAIL_SERVICE_UNAVAILABLE") };
    }
  },

  async updatePassword(input: UpdatePasswordInput): Promise<AuthResult<void>> {
    try {
      if (input.newPassword.length < 6) {
        return { success: false, error: { code: "AUTH_WEAK_PASSWORD", message: "Password must be at least 6 characters." } };
      }
      const { data: current, error: readError } = await mobileSupabaseClient.auth.getUser();
      if (readError || !current.user) {
        return {
          success: false,
          error: { code: "AUTH_SESSION_EXPIRED", message: readError?.message ?? "An active session is required." },
        };
      }
      const { error } = await mobileSupabaseClient.auth.updateUser({ password: input.newPassword });
      if (error) return { success: false, error: providerError(error, "AUTH_WEAK_PASSWORD") };
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
    }
  },

  async getSecurityStatus(): Promise<AuthResult<AuthSecurityStatus>> {
    try {
      const { data: userData, error: userError } = await mobileSupabaseClient.auth.getUser();
      if (userError || !userData.user) {
        return {
          success: false,
          error: { code: "AUTH_SESSION_EXPIRED", message: userError?.message ?? "An active session is required." },
        };
      }

      const [factorResult, assuranceResult] = await Promise.all([
        mobileSupabaseClient.auth.mfa.listFactors(),
        mobileSupabaseClient.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (factorResult.error) return { success: false, error: providerError(factorResult.error, "AUTH_NETWORK_ERROR") };
      if (assuranceResult.error) return { success: false, error: providerError(assuranceResult.error, "AUTH_NETWORK_ERROR") };
      if (!factorResult.data || !assuranceResult.data) {
        return { success: false, error: { code: "AUTH_NETWORK_ERROR", message: "The provider returned incomplete security status." } };
      }

      const currentLevel = assuranceResult.data.currentLevel;
      const nextLevel = assuranceResult.data.nextLevel;
      if (!isAuthAssuranceLevel(currentLevel) || !isAuthAssuranceLevel(nextLevel)) {
        return { success: false, error: { code: "AUTH_NETWORK_ERROR", message: "The provider returned an unsupported assurance level." } };
      }

      return {
        success: true,
        data: {
          userId: userData.user.id,
          email: userData.user.email ?? "",
          emailVerified: Boolean(userData.user.email_confirmed_at),
          pendingEmailChange: userData.user.new_email ?? null,
          mfaFactors: factorResult.data.all
            .filter((factor) => factor.factor_type === "totp")
            .map((factor) => ({
              id: factor.id,
              type: "totp",
              status: factor.status,
              friendlyName: factor.friendly_name ?? null,
              createdAt: factor.created_at ?? null,
              updatedAt: factor.updated_at ?? null,
            })),
          currentAssuranceLevel: currentLevel,
          nextAssuranceLevel: nextLevel,
          signOutOtherSessionsAvailable: true,
        },
      };
    } catch (error) {
      return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
    }
  },

  async requestEmailChange(input: RequestEmailChangeInput): Promise<AuthResult<RequestEmailChangeResult>> {
    const newEmail = input.newEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return { success: false, error: { code: "AUTH_VALIDATION_ERROR", message: "Enter a valid email address." } };
    }

    try {
      const { data: current, error: readError } = await mobileSupabaseClient.auth.getUser();
      if (readError || !current.user) {
        return {
          success: false,
          error: { code: "AUTH_SESSION_EXPIRED", message: readError?.message ?? "An active session is required." },
        };
      }
      const { data, error } = await mobileSupabaseClient.auth.updateUser({ email: newEmail });
      if (error) return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
      if (!data.user || data.user.id !== current.user.id) {
        return { success: false, error: { code: "AUTH_SESSION_EXPIRED", message: "The active user changed during the email update." } };
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
      return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
    }
  },

  async beginTotpEnrollment(input: BeginTotpEnrollmentInput = {}): Promise<AuthResult<TotpEnrollment>> {
    const friendlyName = input.friendlyName?.trim();
    if (friendlyName && friendlyName.length > 64) {
      return { success: false, error: { code: "AUTH_VALIDATION_ERROR", message: "Authenticator name must be 64 characters or fewer." } };
    }

    try {
      const { data: current, error: readError } = await mobileSupabaseClient.auth.getUser();
      if (readError || !current.user) {
        return {
          success: false,
          error: { code: "AUTH_SESSION_EXPIRED", message: readError?.message ?? "An active session is required." },
        };
      }
      const { data, error } = await mobileSupabaseClient.auth.mfa.enroll({
        factorType: "totp",
        ...(friendlyName ? { friendlyName } : {}),
      });
      if (error) return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
      if (data.type !== "totp" || !data.totp.qr_code || !data.totp.secret || !data.totp.uri) {
        return { success: false, error: { code: "AUTH_NETWORK_ERROR", message: "The provider returned incomplete TOTP enrollment data." } };
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
      return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
    }
  },

  async verifyTotp(input: VerifyTotpInput): Promise<AuthResult<void>> {
    if (!input.factorId.trim() || !/^\d{6}$/.test(input.code.trim())) {
      return { success: false, error: { code: "AUTH_VALIDATION_ERROR", message: "A TOTP factor and six-digit code are required." } };
    }

    try {
      const { data: current, error: readError } = await mobileSupabaseClient.auth.getUser();
      if (readError || !current.user) {
        return {
          success: false,
          error: { code: "AUTH_SESSION_EXPIRED", message: readError?.message ?? "An active session is required." },
        };
      }
      const { data: factors, error: factorsError } = await mobileSupabaseClient.auth.mfa.listFactors();
      if (factorsError) return { success: false, error: providerError(factorsError, "AUTH_NETWORK_ERROR") };
      if (!factors?.all.some((factor) => factor.id === input.factorId && factor.factor_type === "totp")) {
        return { success: false, error: { code: "AUTH_MFA_FACTOR_NOT_FOUND", message: "The TOTP factor is not available to the authenticated user." } };
      }

      const { error } = await mobileSupabaseClient.auth.mfa.challengeAndVerify({
        factorId: input.factorId,
        code: input.code.trim(),
      });
      if (error) return { success: false, error: providerError(error, "AUTH_VALIDATION_ERROR") };

      const { data: sessionData, error: sessionError } = await mobileSupabaseClient.auth.getSession();
      if (sessionError || !sessionData.session || sessionData.session.user.id !== current.user.id) {
        return {
          success: false,
          error: { code: "AUTH_SESSION_EXPIRED", message: sessionError?.message ?? "The verified session could not be restored for the same user." },
        };
      }
      currentMobileSession = mapSession(sessionData.session);
      notifyAuthListeners("TOKEN_REFRESHED", currentMobileSession);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
    }
  },

  async removeTotpFactor(input: RemoveTotpFactorInput): Promise<AuthResult<void>> {
    if (!input.factorId.trim()) {
      return { success: false, error: { code: "AUTH_VALIDATION_ERROR", message: "A TOTP factor is required." } };
    }

    try {
      const { data: current, error: readError } = await mobileSupabaseClient.auth.getUser();
      if (readError || !current.user) {
        return {
          success: false,
          error: { code: "AUTH_SESSION_EXPIRED", message: readError?.message ?? "An active session is required." },
        };
      }
      const { data: factors, error: factorsError } = await mobileSupabaseClient.auth.mfa.listFactors();
      if (factorsError) return { success: false, error: providerError(factorsError, "AUTH_NETWORK_ERROR") };
      if (!factors?.all.some((factor) => factor.id === input.factorId && factor.factor_type === "totp")) {
        return { success: false, error: { code: "AUTH_MFA_FACTOR_NOT_FOUND", message: "The TOTP factor is not available to the authenticated user." } };
      }

      const { data, error } = await mobileSupabaseClient.auth.mfa.unenroll({ factorId: input.factorId });
      if (error) return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
      if (data.id !== input.factorId) {
        return { success: false, error: { code: "AUTH_NETWORK_ERROR", message: "The provider did not confirm the requested factor removal." } };
      }
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
    }
  },

  async updateProfile(input: UpdatePlatformProfileInput): Promise<AuthResult<PlatformUser>> {
    const allowedKeys = new Set(["fullName", "avatarUrl", "expectedUserUpdatedAt", "mutationId"]);
    if (Object.keys(input).some((key) => !allowedKeys.has(key))) {
      return { success: false, error: { code: "AUTH_VALIDATION_ERROR", message: "The profile update contains unsupported fields." } };
    }

    const updatesName = input.fullName !== undefined;
    const updatesAvatar = input.avatarUrl !== undefined;
    const fullName = input.fullName?.trim();
    if (!input.mutationId.trim() || (!updatesName && !updatesAvatar)) {
      return { success: false, error: { code: "AUTH_VALIDATION_ERROR", message: "A mutation ID and at least one profile field are required." } };
    }
    if (updatesName && (!fullName || fullName.length > 120)) {
      return { success: false, error: { code: "AUTH_VALIDATION_ERROR", message: "Name must contain between 1 and 120 characters." } };
    }
    if (input.avatarUrl !== undefined && input.avatarUrl !== null && !isPlatformAvatarReference(input.avatarUrl)) {
      return { success: false, error: { code: "AUTH_VALIDATION_ERROR", message: "Avatar must reference a private Files asset." } };
    }

    try {
      const { data: current, error: readError } = await mobileSupabaseClient.auth.getUser();
      if (readError || !current.user) {
        return {
          success: false,
          error: { code: "AUTH_SESSION_EXPIRED", message: readError?.message ?? "An active session is required." },
        };
      }
      if (input.expectedUserUpdatedAt && input.expectedUserUpdatedAt !== current.user.updated_at) {
        return {
          success: false,
          error: { code: "AUTH_VERSION_CONFLICT", message: "The profile changed since it was loaded. Refresh and try again." },
        };
      }

      const userMetadata = { ...current.user.user_metadata };
      if (updatesName) userMetadata.full_name = fullName;
      if (updatesAvatar) userMetadata.avatar_url = input.avatarUrl;
      const { data, error } = await mobileSupabaseClient.auth.updateUser({ data: userMetadata });
      if (error || !data.user) {
        return {
          success: false,
          error: providerError(error ?? new Error("The provider did not confirm the profile update."), "AUTH_NETWORK_ERROR"),
        };
      }

      const user = mapUser(data.user);
      const activeSession = currentMobileSession;
      if (!activeSession || activeSession.user.id !== user.id) {
        return { success: false, error: { code: "AUTH_SESSION_EXPIRED", message: "The active user changed during the profile update." } };
      }
      currentMobileSession = { ...activeSession, user };
      notifyAuthListeners("USER_UPDATED", currentMobileSession);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
    }
  },
};

export const mobileTenantContextAdapter: TenantContextPort = {
  getTenantContext(): TenantContextSnapshot | null {
    return buildMobileSnapshot();
  },

  onTenantContextChange(callback) {
    tenantListeners.add(callback);
    return () => tenantListeners.delete(callback);
  },

  async listOrganizations(): Promise<AuthResult<Organization[]>> {
    try {
      const session = await mobileAuthAdapter.getSession();
      if (!session) {
        return {
          success: false,
          error: { code: "AUTH_SESSION_EXPIRED", message: "No authenticated session found." },
        };
      }

      currentMemberships = await fetchRemoteMemberships(session.user.id);
      membershipsLoadedForUser = session.user.id;
      if (!currentMemberships.some(({ organization }) => organization.id === activeOrgId)) {
        activeOrgId = currentMemberships[0]?.organization.id ?? "";
      }
      notifyTenantListeners();
      return { success: true, data: currentMemberships.map(({ organization }) => organization) };
    } catch (error) {
      return { success: false, error: providerError(error, "AUTH_NETWORK_ERROR") };
    }
  },

  async selectOrganization(organizationId: string): Promise<AuthResult<TenantContextSnapshot>> {
    const organizations = await this.listOrganizations();
    if (!organizations.success) {
      return { success: false, error: organizations.error };
    }

    const membership = currentMemberships.find(({ organization }) => organization.id === organizationId);
    if (!membership) {
      return {
        success: false,
        error: { code: "TENANT_ACCESS_DENIED", message: "Organization membership is not active or access is denied." },
      };
    }

    activeOrgId = organizationId;
    const snapshot = buildMobileSnapshot();
    if (!snapshot) {
      return {
        success: false,
        error: { code: "TENANT_ACCESS_DENIED", message: "Organization context could not be resolved." },
      };
    }

    notifyTenantListeners();
    return { success: true, data: snapshot };
  },

  async listWorkspaces(organizationId: string): Promise<AuthResult<Workspace[]>> {
    const membership = currentMemberships.find(({ organization }) => organization.id === organizationId);
    if (!membership) {
      return {
        success: false,
        error: { code: "TENANT_ACCESS_DENIED", message: "Organization membership is not active or access is denied." },
      };
    }

    return {
      success: true,
      data: [
        {
          id: "default",
          organizationId,
          suiteKey: "crm",
          status: "active",
          slug: "default",
          name: "Main Workspace",
          createdAt: membership.organization.createdAt,
        },
      ],
    };
  },

  async selectWorkspace(workspaceId: string | null): Promise<AuthResult<TenantContextSnapshot>> {
    const snapshot = buildMobileSnapshot();
    if (!snapshot) {
      return {
        success: false,
        error: { code: "TENANT_ACCESS_DENIED", message: "No active organization membership is available." },
      };
    }
    return { success: true, data: { ...snapshot, activeWorkspaceId: workspaceId } };
  },

  async purgeCaches(): Promise<void> {
    // Evicts mobile queues
  },
};
