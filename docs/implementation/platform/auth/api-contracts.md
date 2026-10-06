# Platform Auth & Tenant Context API and Port Contracts

## Document Control

| Field | Value |
|---|---|
| Module | Auth & Tenant Context |
| Product definition | `docs/implementation/platform/auth/HANDOFF.md` |
| Run ID | `MOD-AUTH-20260914-001` |
| Phase | `04-api` |
| Skill | `api-contracts` |
| Contract Path | `packages/contracts/src/auth-port.ts` |
| Status | `completed` |

---

## 1. Canonical Port Interfaces

The module exposes two primary decoupled contracts:
1. **`AuthPort`**: Manages authentication credentials, sessions, password recovery, and auth state change subscriptions.
2. **`TenantContextPort`**: Manages organization listing, tenant selection, workspace context, role mapping, and cache eviction.

```ts
export interface AuthPort {
  getSession(): Promise<AuthSession | null>;
  onAuthStateChange(callback: (event: AuthChangeEvent, session: AuthSession | null) => void): () => void;
  signInWithPassword(credentials: SignInWithPasswordInput): Promise<AuthResult<AuthSession>>;
  signOut(): Promise<AuthResult<void>>;
  requestPasswordReset(input: PasswordResetInput): Promise<AuthResult<PasswordResetResult>>;
  updatePassword(input: UpdatePasswordInput): Promise<AuthResult<void>>;
}

export interface TenantContextPort {
  getTenantContext(): TenantContextSnapshot;
  onTenantContextChange(callback: (context: TenantContextSnapshot) => void): () => void;
  listOrganizations(): Promise<AuthResult<Organization[]>>;
  selectOrganization(organizationId: string): Promise<AuthResult<TenantContextSnapshot>>;
  listWorkspaces(organizationId: string): Promise<AuthResult<Workspace[]>>;
  selectWorkspace(workspaceId: string | null): Promise<AuthResult<TenantContextSnapshot>>;
  purgeCaches(): Promise<void>;
}
```

---

## 2. DTO Specifications

```ts
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

export interface Workspace {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  isDefault: boolean;
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
```

---

## 3. Error Catalog

```ts
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
```

---

## 4. Operation & Capability Map

| Operation | Inputs | Success Output | Error Codes | Notes |
|---|---|---|---|---|
| `signInWithPassword` | `email`, `password` | `AuthSession` | `AUTH_INVALID_CREDENTIALS`, `AUTH_NETWORK_ERROR` | Authenticates against identity provider |
| `signOut` | None | `void` | `AUTH_STORAGE_ERROR` | Flushes session and executes `purgeCaches` |
| `requestPasswordReset` | `email` | `PasswordResetResult` | `AUTH_EMAIL_SERVICE_UNAVAILABLE`, `AUTH_USER_NOT_FOUND` | Accommodates dev mode without SMTP |
| `updatePassword` | `newPassword` | `void` | `AUTH_WEAK_PASSWORD`, `AUTH_SESSION_EXPIRED` | Sets new password via recovery callback |
| `listOrganizations` | None | `Organization[]` | `AUTH_SESSION_EXPIRED`, `TENANT_ACCESS_DENIED` | Super Admin receives full platform directory |
| `selectOrganization` | `organizationId` | `TenantContextSnapshot` | `TENANT_NOT_FOUND`, `TENANT_ACCESS_DENIED` | Triggers atomic purge and binds tenant |
| `purgeCaches` | None | `void` | None | Flushes React Query and memory stores |

---

## 5. Platform Storage Boundary Contract

To support mobile web, iOS, and Android without importing desktop-specific DOM APIs (`window.localStorage`):

```ts
export interface PlatformAuthStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
```
- **Desktop Web Adapter**: Uses browser `localStorage` or in-memory cookie storage.
- **Mobile Adapter (`apps/mobile`)**: Uses `expo-secure-store` / native Keychain, preventing unencrypted token storage.

