# Account Access Design

## Identity and status

| Field | Value |
|---|---|
| Run / span | `MOD-ACCOUNT-20261010-001` / `MOD-ACCOUNT-20261010-001:03-access` |
| Parent | `02-domain` |
| Domain source | `domain-model.md` |
| Product baseline | `discovery.md` §2–6, §10, §14 |
| Status | `partial` — user/tenant boundaries are defined; permission keys, audit coverage and provider details remain open |
| Scope | Authorization semantics, data scopes, sensitive fields, RLS requirements and security evidence; no implementation |

Rule status is `confirmed` when approved by the user or present in an authoritative contract, `assumed` for the safest proposal, and `open` when an owner decision or provider evidence is required. UI visibility is never authorization.

## Role and action matrix

`Owner` and `Admin` refer to active organization membership roles in the database. Auth client role labels are not sufficient to authorize billing. A platform administrator is not an exception to the approved Owner/Admin billing boundary unless they also hold an active Owner/Admin membership in the selected organization.

| Actor | Read/update own PlatformUser profile | Read/update own synchronized preferences | Own Auth security operations | Read organization billing | Mutate organization billing |
|---|---:|---:|---:|---:|---:|
| Unauthenticated | Deny (`confirmed`) | Deny (`confirmed`) | Deny (`confirmed`) | Deny (`confirmed`) | Deny (`confirmed`) |
| Authenticated user with a live session | Allow own user ID only (`confirmed`) | Allow own user ID only (`confirmed`) | Allow own subject only, subject to provider/step-up support (`confirmed` boundary; provider capabilities open) | Deny unless an active Owner/Admin membership exists (`confirmed`) | Deny unless an active Owner/Admin membership exists (`confirmed`) |
| Active organization Owner | Same self-only scope | Same self-only scope | Same self-only scope | Active organization only (`confirmed`) | Active organization only (`confirmed`) |
| Active organization Admin | Same self-only scope | Same self-only scope | Same self-only scope | Active organization only (`confirmed`) | Active organization only (`confirmed`) |
| Active Agent/Editor or Viewer | Same self-only scope | Same self-only scope | Same self-only scope | Deny (`confirmed`) | Deny (`confirmed`) |
| Pending, suspended or revoked membership | Self-service remains tied to the live Auth identity (`assumed`); no tenant data | Self-service remains tied to the live Auth identity (`assumed`); no tenant data | Own subject only while provider session remains valid (`assumed`) | Deny (`confirmed`) | Deny (`confirmed`) |
| Platform administrator without active Owner/Admin membership in selected org | Same self-only scope | Same self-only scope | Same self-only scope | Deny (`confirmed` interpretation of Owner/Admin-only policy) | Deny (`confirmed` interpretation of Owner/Admin-only policy) |

There is no Account-specific role inheritance, team/workspace delegation, profile administration, cross-user Auth operation, or billing export entitlement approved. Organization Settings and membership keep their existing permission contracts; Account must not widen them.

## Scope and enforcement rules

| Rule | Status | Enforcement boundary |
|---|---|---|
| Profile reads/updates resolve the user from the verified Auth subject; clients cannot choose another `userId` | `confirmed` | Shared Auth/Profile operation and provider |
| `PlatformUser.fullName/avatarUrl` remain the only canonical profile fields; no local profile table or duplicate authority | `confirmed` | Shared contract; allowlisted mutation fields |
| Personal Preferences scope is the authenticated user and persists across organization changes | `confirmed` | Shared preference service / future self-scoped persistence |
| Password, email, MFA and session actions target only the authenticated subject | `confirmed` | Auth provider; reauthentication/AAL and confirmation state are provider-enforced |
| Billing operations use organization identity from trusted tenant context and re-check active membership and exact `owner`/`admin` role on every request | `confirmed` | Server operation and database policy; never trust route state, client-supplied role or JWT role label alone |
| Billing data, invoice links and mutations remain scoped to the selected organization; a platform administrator does not bypass Owner/Admin | `confirmed` | Billing server and data policy; no cross-tenant fallback |
| Membership, role or tenant changes invalidate sensitive client state and cancel/ignore stale in-flight results | `confirmed` | Web/native adapters, route guards and query/cache layer |
| Offline profile/preference mutation is reauthorized for the same user on sync; no Security/Billing mutation is queued for later execution | `confirmed` | Sync handler and operation contract |
| Billing permission-key names and whether to add keys to the shared permission catalog | `open` — Platform owner | Do not reuse broad `organization.manage` as a substitute for Billing-specific authorization |
| Access to self-service Account when an Auth session survives suspended/revoked organization membership | `assumed` — Platform Auth | Never grant tenant data; confirm sign-in/session lifecycle with Auth owner |

### Sensitive data and operations

- Auth email, factor status, session/device metadata and provider references
  are visible only to the authenticated subject. Passwords, OTP/seeds,
  access/refresh tokens and recovery secrets never enter Account DTOs, caches,
  telemetry or logs.
- `fullName` and `avatarUrl` are self-editable profile fields. Whether the
  Auth provider permits edits for SSO-managed identities, and whether
  `avatarUrl` must reference a verified user-owned Files asset, remain open.
- Billing summaries are visible only to active Owner/Admin members of the
  selected organization. Expose only provider-approved payment summaries;
  never PAN, CVC, reusable payment tokens or permanent unrestricted invoice
  URLs. Temporary invoice/portal URLs must be issued after authorization and
  must not be cached across tenant or role changes.
- Account does not approve user-data export, account deletion, cross-user
  support impersonation, bulk billing export, or attachment/Document
  Intelligence access.

## RLS and server requirements

The current repository has reusable authorization primitives in
`supabase/migrations/20260807000000_platform_core_permissions.sql` and
`20260915000000_platform_security_hardening.sql`: permission lookups,
`has_organization_permission`, active-membership and role helpers, plus
append-only organization audit events. Settings mutations demonstrate
permission-checked `SECURITY DEFINER` functions in
`20260927110000_settings_management.sql`. These are baseline patterns, not
proof that Account or Billing policies already exist.

1. Do not write directly to `auth.users` or expose service-role credentials.
   Profile changes must pass through the shared authenticated provider/Platform
   operation, with a server/provider-derived subject and an allowlist of
   `fullName` and `avatarUrl`.
2. If synchronized Preferences are persisted in a client-accessible table,
   enable RLS and constrain select/insert/update to `user_id = auth.uid()`.
   Do not accept a caller-selected user ID; deletion follows the Platform
   privacy/retention policy.
3. Billing tables and functions must require an active membership in the
   requested organization and the exact Owner/Admin roles for both read and
   mutation. Apply the same constraint in `USING` and `WITH CHECK` or inside
   every server function; constrain every related invoice, subscription,
   customer and payment-method reference to that organization mapping.
4. Do not grant Billing access through `is_platform_administrator()` alone or
   a broad organization/settings permission. If a trusted server role bypasses
   RLS, the endpoint must independently authenticate the actor, resolve
   membership/role, enforce tenant scope and emit audit evidence before using
   elevated credentials.
5. Reuse the existing Platform permission catalog and audit capability where
   the owner confirms the contract. Proposed Billing permission keys are not
   approved. Never allow a browser/mobile client to create arbitrary audit
   events or to alter an audit record.
6. Storage policy for profile avatars must bind the object to the Auth user and
   prevent another user from overwriting or reading private originals. The
   Files owner must confirm the public/private URL model, validation, deletion
   and signed URL policy before avatar mutation is enabled.

## Audit requirements

| Operation | Minimum audit requirement | Status |
|---|---|---|
| Profile/preferences update | Reuse an approved user-scoped Platform audit event or provider record; include actor, changed field names, outcome and correlation ID, never old/new secret values | `open` — no user-scoped audit contract verified |
| Password/email/MFA/session operation | Use provider security audit/event where supported; record command outcome and opaque subject/resource reference, never credentials or factor secrets | `assumed`; confirm provider audit evidence in Auth phase |
| Billing plan/payment/cancellation mutation and denied cross-tenant attempt | Append actor, organization, action, provider resource reference, outcome, timestamp and correlation ID to shared organization audit; exclude payment secrets and full URLs | `confirmed` requirement; reuse path must be validated before implementation |
| Reads and short-lived invoice/portal links | Do not create a new Account-local audit store; record access only where shared Billing/Finance policy requires it | `open` — Finance/Platform audit owner |

## Security test cases

| ID | Scenario | Expected result |
|---|---|---|
| ACC-ACL-01 | Anonymous user opens each desktop/mobile web route or iOS/Android deep link | Redirect/deny; no Account data in response, screen state or logs |
| ACC-ACL-02 | User tampers with `userId` while reading/updating `PlatformUser` profile or preferences | Request is bound to Auth subject or rejected; another user's data remains unchanged |
| ACC-ACL-03 | Owner, Admin, Agent/Editor and Viewer request their own profile/security operations | Only self operations are allowed; organization role does not grant access to another user's Auth data |
| ACC-ACL-04 | Owner/Admin and Agent/Viewer open Billing for the active organization | Only active Owner/Admin can read or mutate; others receive forbidden without billing metadata |
| ACC-ACL-05 | Owner/Admin substitutes another `organizationId`, subscription, invoice, payment method or provider customer reference | Server/RLS rejects the request; no foreign record or signed URL is returned |
| ACC-ACL-06 | Pending, suspended or revoked member calls Billing RPC/API directly | Denied even if the client retains a previous role claim or cached route |
| ACC-ACL-07 | Platform administrator without active Owner/Admin membership attempts Billing | Denied under the confirmed Owner/Admin-only rule |
| ACC-ACL-08 | User's role/membership is downgraded or revoked while a Billing screen is open or a request is in flight | Access is rechecked; cache is purged and stale response cannot render or commit |
| ACC-ACL-09 | Switch from organization A to B while invoice/plan request, query, or portal link is in flight | Response remains scoped to A and is discarded after switch; no link/cache leaks to B |
| ACC-ACL-10 | Two Owner/Admin actors perform plan/cancel actions concurrently or replay a request | Server reauthorizes each request; idempotency prevents duplicate effect; provider-confirmed state wins |
| ACC-ACL-11 | Client requests unapproved bulk/export, account deletion, or cross-user profile operation | Rejected as unsupported/forbidden; no partial data is returned |
| ACC-ACL-12 | Avatar upload attempts another user's object path, invalid content, or unauthorized public URL | Storage policy rejects foreign write/read; type/size and ownership checks run before URL is attached |
| ACC-ACL-13 | Account contains a link to a File attachment or Document Intelligence result | No data is exposed unless a separate authorized relation and same-scope policy are approved; current Account has no such integration |
| ACC-ACL-14 | Offline profile/preferences mutation syncs after logout, identity switch, or membership/permission change | Drop or reject unless reauthenticated as the original user and reauthorized; Security/Billing mutations are never queued |
| ACC-ACL-15 | Native app uses stale locally mapped role (including current non-superadmin-to-admin mapping) | Server denies unauthorized Billing; native client cannot elevate role through local state |
| ACC-ACL-16 | User changes email, removes final MFA factor, or signs out other sessions without provider-required step-up | Provider denies or requests reauthentication; UI must not report success |
| ACC-ACL-17 | Unauthorized cross-tenant read or forbidden Billing mutation occurs | Denial is recorded through the shared audit/security mechanism without secrets or unnecessary PII |

## Open decisions and risks

| Item | Owner | Safe boundary |
|---|---|---|
| Add `billing.read` / `billing.manage` (or approved equivalents) to shared permission catalog versus exact role check in Billing service | Platform owner + Billing/Finance | Enforce only confirmed Owner/Admin roles; do not ship broad `organization.manage` as Billing authorization |
| Whether a Platform administrator may act as Owner/Admin for a selected organization | Product + Platform Auth | Strict deny unless the actor has active Owner/Admin membership |
| Provider support for profile-field edits on SSO-managed users, reauthentication, MFA/session controls and security audit | Platform Auth | Hide unsupported actions and return explicit `operation_unsupported`; no simulated success |
| User-scoped audit contract/retention for profile, preferences and Auth operations | Platform audit + Privacy | No Account-local audit table; minimize sensitive data |
| Avatar object ownership, signed/public URL model, validation and erasure | Platform Files/Profile | Keep avatar optional; do not accept arbitrary external or cross-user asset references |
| Access to personal Account after org membership suspension | Platform Auth | Self data never implies membership access; do not expose tenant information |
| Billing audit coverage for reads, exports and provider portal access | Billing/Finance | No export/bulk operation; mutation and denial audit must be preserved |

**Risks:** `PlatformUser` role labels and database membership roles differ
(`editor` versus `agent`); the mobile adapter currently maps non-superadmin
users to `admin`. Neither label may authorize a server operation. The existing
permission catalog does not include Billing-specific permissions, and no
Account/Billing RLS or provider implementation was found. The Account design
therefore specifies target authorization behavior, not current compliance.

## Handoff

The authorization boundary is defined enough for `04-api` to specify
authenticated subject binding, organization scoping, explicit forbidden and
unsupported errors, and server-side rechecks. This result is **partial**:
permission-key naming, special platform-admin handling, audit coverage,
avatar policy and provider support require their named owners. No code,
database policy, contract, fixture or migration was changed.
