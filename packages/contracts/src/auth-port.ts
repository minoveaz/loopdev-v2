export type PlatformRole = "owner" | "admin" | "editor" | "viewer";

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
  deliveryChannel: "smtp" | "inbucket_dev" | "admin_cli_bypass";
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
  | "AUTH_NETWORK_ERROR";

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
  requestPasswordReset(input: PasswordResetInput): Promise<AuthResult<PasswordResetResult>>;
  updatePassword(input: UpdatePasswordInput): Promise<AuthResult<void>>;
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
