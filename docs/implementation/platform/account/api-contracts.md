# Account API and Port Contracts

## Identity and status

| Field | Value |
|---|---|
| Run / span | `MOD-ACCOUNT-20261010-001` / `MOD-ACCOUNT-20261010-001:04-api` |
| Parent | `03-access` |
| Domain source | `domain-model.md` |
| Access source | `access-design.md` |
| Status | `partial` — stable client-agnostic operation semantics are proposed; Auth and Billing provider details remain open |
| Scope | Commands, queries, DTOs, errors, idempotency, versioning, events and cross-platform consumers; no endpoints or code |

The existing `AuthPort` and `PlatformUser` are the shared starting point.
`PlatformUser.fullName/avatarUrl` remain canonical. Account must not add a
parallel `UserProfile`, expose provider tokens in Account DTOs, or accept
caller-selected `userId` or `organizationId` as authority. Concrete HTTP paths
and provider SDK calls are transport/adapter decisions for an approved plan.

## Current contract baseline

| Capability | Existing evidence | Gap / status |
|---|---|---|
| Identity projection | `packages/contracts/src/auth-port.ts` defines `PlatformUser` with `id`, `email`, `fullName`, `avatarUrl`, timestamps | Fields exist; authenticated update operation is missing (`EXISTS_PARTIALLY`) |
| Auth password | `AuthPort.updatePassword` and `UpdatePasswordInput` exist | Password change exists in the port, but provider/adapter behavior and reauthentication requirements need verification |
| Email, MFA, sign-out-other-sessions | Current `AuthPort` has no operation for these security features | Sign-out-other-sessions is approved via Supabase's supported `others` scope; email/MFA remain provider-backed work |
| User-synchronized preferences | No shared contract; existing hooks cover pieces of theme/notification UI | Missing as a coherent user-owned remote contract |
| Organization Settings | Existing permission-checked Settings SQL functions and adapter | Reuse; Account must not duplicate organization settings/membership |
| Billing | No Account/Billing contract, adapter or Billing-specific permission keys were found | Missing; seller is LoopDev, initially operating from Spain (`DEC-ACCOUNT-014`); provider, commercial and tax/invoicing terms remain open |
| Files/avatar | Platform Files metadata/storage exists, but no verified user-avatar relation/contract | Reuse only after Files owner confirms user-scope rules; no avatar upload contract assumed here |

## Command and query catalog

All operations are client-agnostic. Web and native adapters use the same
semantic operation names and result/error meanings. `authenticated subject`
means a subject verified from the active Auth session, not a DTO field.

| Operation | Domain owner | Input scope | Result | Retry / idempotency |
|---|---|---|---|---|
| `read_profile` | Platform Auth/Profile | Authenticated subject only | `PlatformProfileDto` | Safe retry; no list pagination |
| `update_profile` (proposed `AuthPort` extension) | Platform Auth/Profile | Authenticated subject; allowlisted `fullName`, `avatarUrl` patch only | Updated `PlatformProfileDto` or validation/forbidden/conflict | Assignment is semantically idempotent; retry same field values. Use `expectedUserUpdatedAt` only if provider supports conditional update |
| `read_preferences` | Platform Preferences | Authenticated subject and optional current app-language hint | `UserPreferencesDto` | Safe retry; the hint initializes an unchosen language only and is ignored after an explicit user choice |
| `patch_preferences` | Platform Preferences | Authenticated subject; allowlisted preference fields | Updated preferences/version | Same mutation ID is replay-safe; `expectedVersion` detects stale writes |
| `read_security_status` | Platform Auth/provider | Authenticated subject only | Sanitized security status | Safe retry; provider capability open |
| `update_password` | Existing `AuthPort.updatePassword` | Authenticated subject; provider-required reauth | Provider-confirmed outcome | Do not blindly repeat after timeout; re-read session/security state unless provider documents idempotent retry |
| `request_email_change` | Platform Auth/provider | Authenticated subject, requested email, provider-required reauth | `pending_confirmation` status; current email remains active until provider confirms | Same mutation key; provider request idempotency/reconciliation capability open |
| `get_security_status` | Platform Auth/provider | Authenticated subject only | Verified email state, pending email change, sanitized TOTP factor summaries, current/next assurance level and sign-out capability | Safe provider read; never expose session tokens or other users' factors |
| `begin_totp_enrollment` / `verify_totp` / `remove_totp_factor` | Platform Auth/provider | Authenticated subject and factor reference from that subject's provider response; provider-enforced AAL step-up | TOTP-only enrollment material returned once for setup; subsequent status contains factor ID/type/status only | Supabase challenge/verify and unenroll; map `insufficient_aal` to `AUTH_REAUTH_REQUIRED`; do not persist enrollment secret |
| `sign_out_other_sessions` | Platform Auth/provider | Authenticated subject; no caller-supplied session/device reference | Provider-confirmed `AuthResult<void>`; current session remains active | Safe to retry; return explicit provider errors; do not claim individual device inventory or revocation |
| `read_billing_overview` | Billing/Finance server | Selected organization resolved from trusted tenant context; active Owner/Admin | Organization subscription summary and permitted plan choices | Safe retry; no client-supplied customer identity |
| `list_billing_invoices` | Billing/Finance server | Same authorized organization; cursor and bounded page size | Invoice summary page | Safe retry; cursor bound to organization and actor scope |
| `list_billing_payment_methods` | Billing/Finance server/provider | Same authorized organization | Display-safe method summaries | Safe retry; no PAN/CVC/token |
| `change_billing_plan` | Billing/Finance server/provider | Same authorized organization, target plan, idempotency key and optional expected version | Provider-confirmed state or pending outcome | Reuse same key for retries; deduplicate server/provider request |
| `request_subscription_cancellation` | Billing/Finance server/provider | Same authorized organization, idempotency key | Accepted/pending request and current provider state | Reuse same key; do not infer effect date or mark canceled from command acceptance |
| `create_payment_method_management_session` | Billing/Finance server/provider | Same authorized organization and allowlisted return destination | Short-lived URL plus expiry | Do not cache; provider-specific idempotency open; reauthorize before every issue |

The `read_preferences` transport may include `p_initial_language`, a supported
locale from the current app UI. It is only a first-choice initialization hint:
the server ignores it once the user has explicitly initialized a language, and
it never changes the authenticated subject or authorization scope. Legacy
no-argument reads retain the server fallback.

For authenticated web sessions, the global Topbar language selector persists
its selection through `patch_preferences` before updating the application
locale. Account Settings uses the same preference, so switching languages from
the Topbar remains effective when the route reloads; unauthenticated sessions
continue to use the local app-language setting.

Profile update does not change `email`; email changes are Auth security
commands. Billing entitlements are not written by the Account client and are
not granted from a plan-change response before the authoritative Billing
projection confirms them.

## Request and response DTO semantics

| DTO | Fields | Rules |
|---|---|---|
| `PlatformProfileDto` | `userId`, `fullName`, `avatarUrl`, `updatedAt` | `userId` comes from Auth; no organization field; `avatarUrl` is optional/null and requires the approved Files policy before mutation is enabled |
| `UpdatePlatformProfileInput` | `fullName?`, `avatarUrl?`, `expectedUserUpdatedAt?`, `mutationId` | At least one allowlisted field; reject extra fields. `expectedUserUpdatedAt` is enforced only where provider supports compare-and-set; otherwise concurrency behavior must be documented as last-confirmed-write |
| `UserPreferencesDto` | `userId`, `language`, `timeZone`, `personalNotifications`, `version`, `updatedAt` | Global user scope; device appearance is deliberately separate unless product later approves sync |
| `PatchUserPreferencesInput` | allowlisted preference patch, `expectedVersion`, `mutationId` | Unknown keys rejected; locale/timezone catalogs and notification shape remain open |
| `AuthSecurityStatus` | authenticated `userId`, email/verified state, pending email change, TOTP factor summaries, current/next assurance level, sign-out capability | Derived only from the active provider subject; no secrets, tokens, raw response, phone factors or other user's information |
| `AuthMfaFactor` | opaque factor ID, `totp`, provider status, friendly name and safe timestamps | Only provider-confirmed factors; SMS and other factor types are not offered |
| `TotpEnrollment` | factor ID, QR representation, secret and URI | Returned only after provider enrollment for immediate setup; never persisted, logged or included in later status responses |
| Session capability | `signOutOtherSessionsAvailable` derived from the provider adapter | No device/session inventory, access/refresh token, IP or device fingerprint |
| `BillingOverviewDto` | `organizationId`, provider-neutral plan/subscription summary, status, current period/cancellation data when authoritative, available plan summaries | `organizationId` is resolved by server; no billing customer email matching or provider secret |
| `InvoiceSummaryDto` | opaque invoice ID, safe invoice number, status, issue/due/paid dates, amount/currency summary, optional short-lived download link | Link is generated only after authorization and has explicit expiry; tax/legal fields require Finance decision |
| `PaymentMethodSummaryDto` | opaque provider reference, method type, brand/last-four/expiry only when returned safely | Never PAN, CVC, secret token or raw provider payload |

DTO timestamps use UTC ISO-8601. Transport errors and success envelopes follow
the Platform API standard when selected. Local fixtures use synthetic stable
IDs and never become production fallback data.

## Error catalog

These are stable semantic error codes; exact HTTP mapping is deferred.

| Code | Retryable | Meaning / handling |
|---|---|---|
| `UNAUTHENTICATED` | No | Session absent/expired; clear sensitive view and reauthenticate |
| `FORBIDDEN` | No | Actor lacks self/organization permission; return no protected metadata |
| `NOT_FOUND` | No | Resource absent within authorized scope; do not leak cross-tenant existence |
| `VALIDATION_ERROR` | No | Invalid field, unsupported catalog value or malformed request; return field errors without echoing secrets |
| `OPERATION_UNSUPPORTED` | No | Provider/platform cannot perform the requested operation; never convert to success |
| `REAUTH_REQUIRED` | No, until step-up | Provider requires password/MFA/assurance step-up |
| `VERSION_CONFLICT` | No, after refresh/merge | Caller based mutation on stale `expectedVersion` or provider conditional version |
| `IDEMPOTENCY_CONFLICT` | No | Same mutation key used with different command payload |
| `PROVIDER_UNAVAILABLE` | Yes with backoff | Provider or authoritative backend unavailable; read confirmed state before retrying a non-idempotent command |
| `RATE_LIMITED` | Yes after `retryAfter` | Respect provider/server retry window |
| `PAYMENT_ACTION_REQUIRED` | No until user action | Provider requires an approved confirmation/authentication action |
| `NETWORK_ERROR` | Yes for safe reads/idempotent mutations | Transport unavailable; preserve draft only, do not display authoritative success |

`AuthErrorCode` currently lacks several of these cases. `AuthPort` extension
must map provider errors into stable semantic codes without breaking current
Auth consumers; Account-specific Billing errors belong to the future shared
Billing contract rather than `AuthError`.

The AuthPort security extension now maps provider step-up failures to
`AUTH_REAUTH_REQUIRED` and absent factors to `AUTH_MFA_FACTOR_NOT_FOUND`.
Email remains pending until provider confirmation. Supabase owns whether a
sensitive change needs AAL2; the client never claims the step-up succeeded
unless the provider returns success.

## Pagination, filtering and direct access

- Profile, Preferences and security status are single-resource queries and
  need no pagination.
- Session listing uses an opaque cursor and bounded page size only if the
  selected Auth provider supports stable pagination; otherwise use an
  explicitly bounded provider response and document the limitation.
- Invoice and payment-method lists use an opaque cursor; proposed page size is
  25 by default and 100 maximum (`assumed`, align with Platform API standards
  before implementation). Invoices sort by `issuedAt DESC` with stable
  provider invoice ID tie-breaker. Filters may include provider-confirmed
  status and date range only.
- Cursors are bound server-side to authenticated actor, organization and
  filter set; clients cannot change scope while reusing a cursor.
- Every deep link/query independently authenticates and reauthorizes. Hidden
  routes, cached role claims, stale signed links and local fixture data are
  not access control.

## Concurrency, idempotency and consistency

| Capability | Consistency boundary | Idempotency/version behavior |
|---|---|---|
| Profile | Auth provider is canonical for `PlatformUser.fullName/avatarUrl` | Read after write from provider. Assignment retry is semantically safe. `expectedUserUpdatedAt` is conditional only if provider supports it; do not promise conflict detection otherwise |
| Preferences | One user-scoped patch is atomic at the Preferences owner | Require expected version and mutation ID; duplicate same-key/same-payload returns prior result; key reuse with different payload fails |
| Security | Provider owns state and confirmation lifecycle | Commands return only provider-accepted/pending status; after timeout, reconcile by provider read/event before retry; never enqueue offline |
| Billing | Billing service/provider owns customer, subscription and invoice truth | Every mutation has idempotency key; persist command/provider reference before acknowledging; refresh authoritative state after webhook/read; UI response alone never changes entitlement |

An accepted remote command may succeed while event delivery fails. The owner
must retry/reconcile event publication without repeating the provider-side
effect. Tenant/identity switch clears cached responses, pending cursors and
short-lived portal links. Rollback is a compensating provider operation only
when the provider supports it; otherwise show the authoritative outcome and
provide an explicit recovery path.

## Events, webhooks and consumers

| Event/contract | Producer | Minimum payload | Consumers / delivery |
|---|---|---|---|
| `platform.user_profile.updated` | Platform Auth/Profile after canonical user update | `eventId`, `userId`, revision/provider `updatedAt`, changed field names, `occurredAt`; only approved identity projection | Shell, CRM, ERP, Workspace; dedupe by event ID and ignore older revision |
| `platform.user_preferences.updated` | Preferences service after accepted patch | `eventId`, `userId`, version, changed keys, `occurredAt` | Web/native preference, i18n and notification consumers; dedupe by event ID/version |
| Auth email/MFA/session lifecycle | Auth provider/adapter | `eventId`, `userId`, status, opaque provider reference, timestamp | Account security state and Auth session/cache consumers; provider-supported only |
| `billing.subscription.updated` | Billing projection after verified provider webhook or authoritative read | `eventId`, `organizationId`, opaque subscription ref, normalized provider status/version, effective time | Billing UI and entitlement consumers; persist/dedupe before acknowledging provider webhook |
| `billing.subscription.cancel_requested` | Billing service after provider accepts cancellation request | `eventId`, `organizationId`, opaque subscription ref, request/result state and timestamp | Billing UI, audit, entitlement policy; does not mean cancellation is effective |
| `billing.invoice.updated` / `billing.payment_failed` | Verified provider event normalized by Billing | `eventId`, `organizationId`, opaque resource ref, safe status and amount/currency summary as approved | Billing/Finance and notification consumer only if approved; no raw provider payload |

Webhook signature verification, provider event ID uniqueness, transaction
boundary, replay handling, backoff, dead-letter/recovery and provider-to-
organization mapping are mandatory Billing owner responsibilities. Exact
webhook DTOs and provider event catalog remain open until vendor selection.
Events must never contain access/refresh tokens, payment secrets, full
invoice/portal URLs, or unnecessary PII.

## Multiplatform impact

| Client | Contract behavior |
|---|---|
| Desktop web | Calls shared operations through web adapter; route/deep-link and stale query scope are reauthorized |
| Mobile web | Same operations/errors, responsive controls; browser history or cached pages cannot preserve access after sign-out/role loss |
| iOS | Same IDs/DTOs; secure Auth storage and native reauthentication/challenge presentation; offline security/Billing commands prohibited |
| Android | Same IDs/DTOs; secure Auth storage and native reauthentication/challenge presentation; offline security/Billing commands prohibited |

No platform may invent separate operation catalogs or report a mutation as
successful based only on local UI state. Pagination cursors, mutation IDs,
version conflicts and provider `operation_unsupported` outcomes have the same
meaning on all clients.

## Open decisions and risks

| Decision | Owner | Safe boundary |
|---|---|---|
| Auth provider support for profile update, SSO-managed fields, email confirmation, MFA and per-session operations | Platform Auth | Reuse AuthPort; only expose provider-confirmed operations |
| Whether provider update can enforce optimistic version/conditional write and mutation idempotency | Platform Auth | Do not claim CAS; read back authoritative values after updates |
| Avatar Files relation, URL visibility, size/type validation, upload lifecycle and erasure | Platform Files/Profile | Keep optional and do not accept arbitrary URLs until approved |
| Shared Preferences port, catalogs, notification DTO and remote persistence | Platform Preferences | Do not extend local Account-only contract or infer catalogs |
| Billing provider and provider-neutral port ownership, plan catalog, invoice fields, cancellation semantics and entitlement authority | Product, Finance, Billing | LoopDev is the seller entity; Finance reviews provider/commercial and tax terms; no mock prices or subscriptions and no entitlement changes from client command result |
| Billing permission keys and audit coverage | Platform, Billing, Privacy | Keep Owner/Admin authorization; reuse shared permission/audit owners |
| Standard transport envelope, paths, status mapping, retry headers and rate-limit policy | Platform API | Keep transport unspecified; semantic operation contract remains stable |
| Provider webhook authentication and replay store | Billing | No provider-specific webhook schema until vendor chosen |

**State:** `partial`. The command/query semantics, DTO boundaries, common
errors and cross-platform rules can guide further sync analysis. Provider and
policy choices remain explicit; no endpoint, API DTO implementation,
adapter, database object, fixture or production code was changed.
