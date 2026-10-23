import type { UpdatePlatformProfileInput } from "./account-profile";
export {
  createPlatformAvatarReference,
  getPlatformAvatarFileId,
  isPlatformAvatarReference,
} from "./account-profile";
export type { UpdatePlatformProfileInput } from "./account-profile";

export type PlatformRole = "owner" | "admin" | "agent" | "editor" | "viewer";

export interface PlatformUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: PlatformUser;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  status: "active" | "suspended";
  createdAt: string;
}

export type WorkspaceSuiteKey =
  | "marketing"
  | "crm"
  | "operations"
  | "communications"
  | "health"
  | "quant"
  | "finance";

export type WorkspaceStatus = "active" | "disabled" | "archived";

export interface Workspace {
  id: string;
  organizationId: string;
  suiteKey: WorkspaceSuiteKey;
  status: WorkspaceStatus;
  slug: string;
  name: string;
  createdAt: string;
}

export interface TenantContextSnapshot {
  activeOrganizationId: string;
  activeWorkspaceId: string | null;
  organization: Organization;
  workspace: Workspace | null;
  userRole: PlatformRole;
  permissions: string[];
  isSuperAdmin: boolean;
}

export interface PasswordResetResult {
  sent: boolean;
  deliveryChannel: "provider" | "smtp" | "inbucket_dev" | "admin_cli_bypass";
  message: string;
}

export type AuthErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_SESSION_EXPIRED"
  | "AUTH_USER_NOT_FOUND"
  | "AUTH_WEAK_PASSWORD"
  | "AUTH_EMAIL_SERVICE_UNAVAILABLE"
  | "TENANT_NOT_FOUND"
  | "TENANT_ACCESS_DENIED"
  | "TENANT_SUSPENDED"
  | "AUTH_STORAGE_ERROR"
  | "AUTH_NETWORK_ERROR"
  | "AUTH_OPERATION_UNSUPPORTED"
  | "AUTH_VALIDATION_ERROR"
  | "AUTH_VERSION_CONFLICT"
  | "AUTH_REAUTH_REQUIRED"
  | "AUTH_MFA_FACTOR_NOT_FOUND";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  status?: number;
  details?: Record<string, unknown>;
}

export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: AuthError };

export interface SignInWithPasswordInput {
  email: string;
  password: string;
}

export interface SignUpWithPasswordInput {
  email: string;
  password: string;
  fullName?: string;
}

export interface PasswordResetInput {
  email: string;
}

export interface UpdatePasswordInput {
  newPassword: string;
}

export type AuthAssuranceLevel = "aal1" | "aal2" | null;
export type AuthMfaFactorStatus = "verified" | "unverified";

export function isAuthAssuranceLevel(value: unknown): value is AuthAssuranceLevel {
  return value === null || value === "aal1" || value === "aal2";
}

export interface AuthMfaFactor {
  id: string;
  type: "totp";
  status: AuthMfaFactorStatus;
  friendlyName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AuthSecurityStatus {
  userId: string;
  email: string;
  emailVerified: boolean;
  pendingEmailChange: string | null;
  mfaFactors: AuthMfaFactor[];
  currentAssuranceLevel: AuthAssuranceLevel;
  nextAssuranceLevel: AuthAssuranceLevel;
  signOutOtherSessionsAvailable: boolean;
}

export interface RequestEmailChangeInput {
  newEmail: string;
}

export interface RequestEmailChangeResult {
  currentEmail: string;
  newEmail: string;
  status: "pending_confirmation";
}

export interface BeginTotpEnrollmentInput {
  friendlyName?: string;
}

export interface TotpEnrollment {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}

export interface VerifyTotpInput {
  factorId: string;
  code: string;
}

export interface RemoveTotpFactorInput {
  factorId: string;
}

export type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | "USER_UPDATED";

export interface PlatformAuthStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface AuthPort {
  getSession(): Promise<AuthSession | null>;
  onAuthStateChange(callback: (event: AuthChangeEvent, session: AuthSession | null) => void): () => void;
  signInWithPassword(credentials: SignInWithPasswordInput): Promise<AuthResult<AuthSession>>;
  signUpWithPassword(credentials: SignUpWithPasswordInput): Promise<AuthResult<AuthSession>>;
  signOut(): Promise<AuthResult<void>>;
  signOutOtherSessions(): Promise<AuthResult<void>>;
  requestPasswordReset(input: PasswordResetInput): Promise<AuthResult<PasswordResetResult>>;
  updatePassword(input: UpdatePasswordInput): Promise<AuthResult<void>>;
  getSecurityStatus(): Promise<AuthResult<AuthSecurityStatus>>;
  requestEmailChange(input: RequestEmailChangeInput): Promise<AuthResult<RequestEmailChangeResult>>;
  beginTotpEnrollment(input?: BeginTotpEnrollmentInput): Promise<AuthResult<TotpEnrollment>>;
  verifyTotp(input: VerifyTotpInput): Promise<AuthResult<void>>;
  removeTotpFactor(input: RemoveTotpFactorInput): Promise<AuthResult<void>>;
  updateProfile(input: UpdatePlatformProfileInput): Promise<AuthResult<PlatformUser>>;
}

export interface TenantContextPort {
  getTenantContext(): TenantContextSnapshot | null;
  onTenantContextChange(callback: (context: TenantContextSnapshot | null) => void): () => void;
  listOrganizations(): Promise<AuthResult<Organization[]>>;
  selectOrganization(organizationId: string): Promise<AuthResult<TenantContextSnapshot>>;
  listWorkspaces(organizationId: string): Promise<AuthResult<Workspace[]>>;
  selectWorkspace(workspaceId: string | null): Promise<AuthResult<TenantContextSnapshot>>;
  purgeCaches(): Promise<void>;
}
