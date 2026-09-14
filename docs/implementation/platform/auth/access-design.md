# Platform Auth & Multi-tenant Context Access Design

## Document Control

| Field | Value |
|---|---|
| Module | Auth & Tenant Context |
| Product definition | `docs/implementation/platform/auth/HANDOFF.md` |
| Run ID | `MOD-AUTH-20260914-001` |
| Phase | `03-access` |
| Skill | `access-design` |
| Status | `completed` |

---

## 1. Multi-tenant Scope & Boundary Rules

1. **Authoritative Tenant Enforcement**:
   - `organizationId` is non-nullable across all platform tables (`organization_memberships`, `workspaces`, `contacts`, `notes`, etc.).
   - All tenant access is verified in PostgreSQL using Row-Level Security (RLS) policies and PostgreSQL helper functions (`auth.uid()`, `has_organization_permission(org_id, perm)`).
   - In frontend clients, `TenantContextPort` ensures the active `organizationId` is automatically bound to data headers, queries, and mutations.

2. **Super Admin / Platform Owner Access Boundary (`DEC-AUTH-003`)**:
   - Super Admins hold global administrative authority defined via JWT claim `is_super_admin: true` in `app_metadata`, or membership role `'owner'` across organizations.
   - **Catalogue Visibility**: `TenantContextPort.listOrganizations()` returns the complete platform directory when `is_super_admin: true`.
   - **Explicit Scope Isolation**: Super Admins must explicitly select an active organization in context. They never execute blind multi-tenant cross-writes; all mutations carry the currently selected `organizationId` with audit logs recording `actingAsSuperAdmin: true`.

3. **Workspace Boundary**:
   - `workspaceId` is an optional sub-tenant partition within an organization.
   - Workspaces cannot cross organization boundaries; foreign workspace access is rejected at database constraint and RLS levels.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Platform Action / Capability | Viewer | Editor | Admin | Owner | Super Admin (Active Org) | Super Admin (Global Directory) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `auth.session.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `auth.session.terminate` | Own | Own | Own | Own | Own / Any | Any |
| `org.view_metadata` | Active Org | Active Org | Active Org | Active Org | Active Org | All Platform Orgs |
| `org.switch` | Joined Orgs | Joined Orgs | Joined Orgs | Joined Orgs | All Platform Orgs | All Platform Orgs |
| `org.update_settings` | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| `org.delete_archive` | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| `member.list` | Active Org | Active Org | Active Org | Active Org | Active Org | All Platform Orgs |
| `member.invite` | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| `member.remove` | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| `workspace.list` | Active Org | Active Org | Active Org | Active Org | Active Org | All Platform Orgs |
| `workspace.create_manage` | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| `cross_tenant.data_access` | **STRICTLY FORBIDDEN** | **STRICTLY FORBIDDEN** | **STRICTLY FORBIDDEN** | **STRICTLY FORBIDDEN** | **STRICTLY FORBIDDEN** | Read Directory Only |

---

## 3. Database RLS Security Policies

### 3.1. `public.organizations`
- **SELECT**:
  ```sql
  (auth.uid() IN (SELECT user_id FROM public.organization_memberships WHERE organization_id = id AND status = 'active'))
  OR ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);
  ```
- **UPDATE**:
  ```sql
  (auth.uid() IN (SELECT user_id FROM public.organization_memberships WHERE organization_id = id AND role IN ('admin', 'owner')))
  OR ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);
  ```

### 3.2. `public.organization_memberships`
- **SELECT**:
  ```sql
  (auth.uid() IN (SELECT user_id FROM public.organization_memberships m WHERE m.organization_id = organization_id))
  OR ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);
  ```
- **INSERT / UPDATE / DELETE**:
  ```sql
  (auth.uid() IN (SELECT user_id FROM public.organization_memberships m WHERE m.organization_id = organization_id AND m.role IN ('admin', 'owner')))
  OR ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);
  ```

---

## 4. Cache Purge & Tenant Eviction Invariant (`DEC-AUTH-005`)

To preserve absolute tenant isolation and prevent cross-tenant memory leakage:

```text
[Tenant Switch / Sign Out Triggered]
             │
             ▼
1. Flush React Query Cache: queryClient.clear()
2. Cancel in-flight HTTP requests and pending mutations
3. Evict local session storage / mobile memory stores
4. Reset TenantContext in-memory snapshot
5. Rehydrate with selected organization context (or redirect to /pages/login on sign out)
```

---

## 5. Security & Isolation Test Cases

1. **Cross-Tenant Query Rejection**: A user with membership in Org A cannot query, read, or mutate data belonging to Org B via Supabase client or API.
2. **Super Admin Tenant Context Isolation**: When a Super Admin selects Org B, queries and mutations are isolated to Org B. Switching to Org C flushes Org B cached data.
3. **Session Revocation Eviction**: When a user's membership is revoked or suspended, subsequent queries return unauthorized (`401`/`403`) and trigger context ejection.
4. **Token Expiration & Refresh Boundary**: Expired access tokens automatically refresh via refresh token; invalid refresh tokens immediately purge state and redirect to login.
5. **Zero Token Leakage in Mobile**: Refresh tokens on iOS and Android are stored exclusively in secure platform storage (Keychain / EncryptedSharedPreferences) and never written to unencrypted AsyncStorage or log outputs.

