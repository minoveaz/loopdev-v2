# Account domain model analysis

## Identity and status

| Field | Value |
|---|---|
| Run / span | `MOD-ACCOUNT-20261010-001` / `MOD-ACCOUNT-20261010-001:02-domain` |
| Parent | `01-design`, after approved `01-visual-design` |
| Parent artifact | `docs/implementation/platform/account/design.md` |
| Product baseline | `discovery.md` §3–6, §10, §14 |
| Status | `partial` — ownership boundaries are clear; provider and retention policies remain open |
| Scope | Domain ownership, entities, relationships, lifecycle and events only |

The approved product boundary is four separate capabilities: global personal
profile, user-owned preferences, Auth-owned security, and organization-owned
billing. This analysis does not create those contracts or claim that the
proposed models exist in runtime.

Decision labels mean: **confirmed** is directly approved by the user or an
existing authoritative contract; **assumed** is the smallest safe domain
proposal; **open** needs an owner decision before it becomes a contract.

## Entity and relationship model

| Entity / projection | Owner and source of truth | Identity, scope and cardinality | Required / derived data | Local fixture and remote identity |
|---|---|---|---|---|
| `PlatformUser` / Auth identity and profile fields | Platform Auth owns identity; existing `PlatformUser` in `packages/contracts/src/auth-port.ts` is the canonical shared user/profile projection (**confirmed by user**) | Stable Auth `user.id`; one user may participate in many organization memberships (**confirmed**) | `fullName` and `avatarUrl` remain the only authoritative name/avatar fields; credentials and tokens remain Auth-owned. A shared update operation may be added without creating a second profile aggregate | Tests may use a synthetic stable `userId`; remote identity is Auth subject/user ID. Account must not create a second identity or profile record |
| `UserPreferences` | Platform Preferences capability, proposed; no shared synchronized preference contract exists (**open**) | One synchronized preference aggregate per `userId` (**confirmed**) | Language, IANA timezone and personal notification preferences (**confirmed** fields); exact locale/notification catalogs and validation bounds remain open | Fixture keyed by `userId`; remote key should remain stable across organization switches |
| `DeviceAppearance` | Client/device configuration, not a shared Account aggregate (**assumed**) | At most one current theme per app installation/device; not shared across devices unless explicitly approved | Theme selection and local update metadata; exact supported theme values reuse the existing theme contract | Local app configuration only; do not create a server entity or use appearance as synchronized user data by default |
| Auth credentials, email change, MFA factor and session | Platform Auth/provider; `AuthPort` is the current shared boundary, though it does not expose all approved operations (**confirmed ownership; capabilities open**) | Provider-owned resources associated with a user; zero or more factors/sessions | Provider status and opaque references only; never model passwords, OTP/seed, access/refresh tokens or payment details in Account | Test provider fakes only; remote IDs are opaque provider references. Do not mirror provider credentials or lifecycle as Account-owned records |
| Organization membership | Platform Tenant Context / Settings; existing `SettingsUser` is organization-scoped (**confirmed**) | Many-to-many user/organization via membership; must not be copied into Profile or Preferences | Organization ID, user ID, role and membership status belong to the existing Settings/Tenant model | Reuse existing local/supabase Settings adapter fixtures; remote identity remains organization and member IDs |
| `BillingCustomerLink` | Billing/Finance backend, proposed; no Billing contract/provider chosen (**open**) | Organization-to-provider customer mapping. At most one active mapping per `(provider, organizationId)` is a proposal; migration/history cardinality is open | `organizationId`, provider key, opaque provider customer reference, mapping revision/status | No fake customer IDs outside tests; remote identity uses organization ID plus provider customer reference, never email matching |
| `SubscriptionSummary` | Billing provider is financial authority; LoopDev projection is proposed (**assumed**) | Belongs to a Billing customer/organization. Whether an organization can have multiple concurrent subscriptions is open | Opaque provider subscription reference, plan reference, provider status, period dates and cancellation fields only when supplied by provider | Fixtures are isolated provider-contract test data; remote identity is provider subscription ref scoped to customer/org |
| `InvoiceSummary` | Billing provider is financial/tax authority (**assumed**) | Zero or more invoices per Billing customer/organization; list is read-only from Account (**confirmed operation boundary**) | Opaque invoice reference, provider status, dates and minimal amount/currency summary; hosted/download links are short-lived and not persisted | Never use demo invoices as fallback; remote identity is provider invoice ref scoped to customer/org |
| `PaymentMethodSummary` | Payment provider only (**confirmed boundary**) | Zero or more provider-owned methods per Billing customer | Display-safe provider summary only (for example brand/last four when applicable); no PAN/CVC/token secret in LoopDev | Fixture only in provider tests; remote identity is opaque provider method ref; no client-side durable copy |
| Audit record | Shared Platform audit capability if available; no Account-specific audit entity is approved (**open**) | User or organization scope follows the source command; not an Account-owned aggregate | Minimal actor/action/scope/outcome/correlation metadata; exclude credentials, OTP, tokens and payment secrets | Reuse a verified Platform audit contract; do not create `AccountAuditRecord` until owner and retention are defined |

The proposed domain does not own organization settings, memberships, Auth
credentials, billing-provider state, invoices, payment methods or generic
audit history. It references their stable IDs and consumes their authoritative
contracts. Notes, Tasks, Activity, Relations and Document Intelligence do not
participate in these Account aggregates; Files is relevant only if the avatar
contract establishes a user-owned asset relation.

### Cross-module event relationship

| Entity/capability | Cross-module relationship |
|---|---|
| `PlatformUser` profile fields | A confirmed profile revision may publish `platform.user_profile.updated` for shell/identity consumers; include only the canonical `fullName`/`avatarUrl` projection those consumers are authorized to display |
| `UserPreferences` | A confirmed synced-preference revision may publish `platform.user_preferences.updated` for web/native preference and notification consumers |
| `DeviceAppearance` | Device-local setting only; no shared domain event or cross-device consumer by default |
| Auth credentials, factors and sessions | Reuse AuthPort/provider lifecycle events; Account does not mirror them or publish a second security lifecycle |
| Organization membership | Reuse Tenant Context / Settings ownership and events; Account does not create membership or role events |
| Billing mapping, subscription, invoice and payment-method projections | Billing service consumes verified provider events, updates its projection and publishes approved Billing/entitlement events; Account is a reader/command client, not event authority |
| Audit record | If a shared Platform audit contract is verified, each owner emits into it; Account does not define an audit-event family |

## State transitions

| Aggregate / state | Type | Allowed transition | Trigger / authority | Domain rule and status |
|---|---|---|---|---|
| PlatformUser profile fields | Existing identity projection | Existing `fullName`/`avatarUrl` → confirmed updated fields after accepted profile mutation | Shared Platform Auth/Profile contract | These fields remain canonical; no separate `UserProfile` aggregate is created (**confirmed**). Display-name limits, avatar lifecycle, revision format and stale-write behavior remain **open** |
| Preferences revision `n` | Revision, not lifecycle state | revision `n` → `n+1` after accepted preference patch | Preferences service | Language/timezone/notifications belong to user across organizations (**confirmed**); patch merge/conflict semantics are **open** |
| Device appearance | Device-local value | selected theme → another supported theme | Current device/user choice | No cross-device aggregate or sync event by default (**assumed**); use the existing theme's supported values |
| Email change | Auth provider lifecycle | current → confirmation pending → provider-confirmed email; failed/expired/cancelled request returns to provider-defined state | Auth provider and verified confirmation | Account may show pending status but cannot make the new email active itself (**confirmed boundary**); provider states/recovery are **open** |
| MFA factor | Auth provider lifecycle | TOTP enrollment → provider challenge/verification → verified; provider-authorized removal | Auth provider | User selected TOTP authenticator apps only for initial release; SMS is excluded. Show only provider-confirmed factor state and surface provider AAL step-up requirements (**confirmed**) |
| Auth session | Auth provider lifecycle | current session remains active while provider signs out other sessions | Auth provider | Use only provider-confirmed sign-out-other-sessions; do not display session inventory or infer revocation from client cache (**confirmed scope**) |
| Billing customer mapping | Billing mapping | unlinked → linked after verified provider/customer provisioning; any unlink/relink follows migration policy | Billing backend / verified provider result | Never infer linkage from matching email (**confirmed**); retries must not create duplicate active mapping (**assumed**); relink/history policy is **open** |
| Subscription | Provider lifecycle projection | provider status `S` → provider status `S'` only on verified provider result | Provider webhook or authoritative provider read | Preserve provider state; a request is pending until authoritative confirmation. Canonical status mapping and concurrent-subscription cardinality are **open** |
| Cancellation request | Command outcome, not subscription state | requested → provider accepted/pending → provider-confirmed effective state, or rejected/failed | Billing service/provider | Do not mark subscription canceled on button/action response. Immediate vs period-end effect and reactivation are **open** |
| Invoice / payment method | Provider-owned read projection | Provider-defined status changes only; Account does not mutate lifecycle | Provider | Invoice and method summaries remain tenant-scoped and read-only in Account (**confirmed boundary**); retention and field set are **open** |

## Invariants, validation and authorization boundaries

| Rule | Classification | Status | Domain statement |
|---|---|---|---|
| Canonical profile fields are global to one authenticated user, not an organization | Invariant | `confirmed` | `organizationId` is not an ownership key; `PlatformUser.fullName/avatarUrl` remain the single authoritative name/avatar fields |
| Credentials/email security state belong to Auth, not Profile | Ownership invariant | `confirmed` | A profile update cannot mutate Auth credentials or verification state |
| Preferences for language, timezone and notifications synchronize by user; appearance may be local | Ownership invariant | `confirmed` | Tenant selection does not fork a synchronized preference aggregate |
| Organization membership/settings are reused | Ownership invariant | `confirmed` | Do not duplicate `SettingsUser`, organization role or organization preference data in Account |
| Billing reads/mutations target the active organization and authoritative customer mapping | Domain scope invariant | `confirmed` | Provider customer lookup must use the organization mapping, never a client-supplied payer identity |
| Billing is restricted to Owner/Admin | Authorization condition, not aggregate invariant | `confirmed` | Enforce on each server operation; domain model does not make role a billing entity state |
| Stale profile/preferences writes cannot silently replace newer state | Persistence/concurrency constraint | `assumed` | Use a revision/precondition; exact merge granularity belongs to sync/API design |
| Avatar reference must resolve to an authorized user-owned asset | Cross-domain invariant | `open` | Files/Profile contract, storage scope, image limits and deletion behavior are not defined |
| Locale and timezone values must be valid and supported | Domain validation | `confirmed` | Use the existing six-locale catalog; initialize an unchosen language from the current app locale, then preserve the explicit server choice. Timezone catalog/version remains open |
| Password/MFA/session secrets never enter Account aggregates or logs | Security data invariant | `confirmed` | Provider holds secret material; Account may consume sanitized provider projections |
| Billing provider event identity is unique for replay handling | Persistence constraint | `assumed` | Event idempotency is required, but provider event schema and storage are API/sync work |
| No `AccountAuditRecord` without shared Platform ownership | Platform reuse invariant | `open` | First verify a reusable audit contract and its retention/immutability rules |

Client form validation is not a domain invariant and cannot authorize a
command. Role enforcement is an authorization condition. Unique provider
mapping/revision checks are persistence constraints. Those responsibilities
must remain separate in later access/API/sync analysis.

## Commands and domain events

| Command / event | Owner | Minimum semantic data | Idempotency / consumer rule | Status |
|---|---|---|---|---|
| `UpdateUserProfile` | Shared Platform Auth/Profile contract (extension approved by user) | Authenticated `userId`, allowlisted `fullName` and/or `avatarUrl` patch, expected revision if supported | Command key/revision prevents duplicate or stale overwrite; shell/product consumers read the canonical `PlatformUser` projection | Shared update operation is approved in principle; exact contract, storage and concurrency rules remain design work |
| `PatchUserPreferences` | Proposed Preferences service | Authenticated `userId`, allowlisted preference patch, expected revision | Replay-safe mutation ID; consumers ignore duplicate/older revision | Command is a design candidate |
| Password/email/MFA/session commands | Auth provider / AuthPort extension | Provider-supported request and authenticated subject; no caller-supplied user override | Provider request ID where available; publish state only from provider confirmation | Account must not create a parallel command model |
| Plan/cancel/payment-method commands | Billing/Finance service and provider | Active `organizationId`, authenticated actor, provider-owned refs, idempotency key | Verify tenant mapping and provider result; no UI-generated entitlement change | Provider and lifecycle contract are open |
| `platform.user_profile.updated` | Profile service outbox | `eventId`, `userId`, revision, changed field names, `occurredAt`; include only authorized display projection if a consumer requires it | Deduplicate by `eventId`; ignore older revision; consumers include shell and product identity display | Candidate, not implemented |
| `platform.user_preferences.updated` | Preferences service outbox | `eventId`, `userId`, revision, changed preference keys and `occurredAt` | Deduplicate by event/mutation ID and revision; consumers include web/native preference and notification adapters | Candidate, not implemented |
| Auth lifecycle events | Auth provider/AuthPort | Auth subject, event/status and opaque provider ref only | Existing `AuthChangeEvent` covers sign-in/out, token refresh and user update; MFA/email/session events require verified provider support | Reuse/extend Auth, do not duplicate in Account |
| Billing lifecycle events | Verified provider webhook → Billing projection/outbox | Provider event ID, organization/customer mapping, provider resource ref, status/version and effective time | Verify signature, persist/deduplicate before acknowledging, then update projection and notify consumers | Candidate; provider contract open |

Read queries and UI outcomes (`loading`, `pending`, `conflict`, `success`) are
not domain events. Domain events are emitted only after authoritative
acceptance/confirmation, not when a client displays a toast or opens a portal.

## Archive, delete, restore and retention

- **Profile:** account deletion is out of scope. Do not expose profile delete
  or restore commands. User-erasure propagation, avatar asset deletion and
  profile retention after Auth identity deletion remain open with Platform
  Privacy/Files.
- **Preferences:** no user-facing delete/restore command. On identity deletion
  or privacy request, erase or anonymize by stable `userId` under the
  Platform retention policy; exact retention and backup behavior are open.
- **Device appearance:** local-only preference can be cleared on logout or
  identity switch to avoid cross-user bleed (**assumed**); restore/import
  behavior is not required.
- **Auth data:** provider owns credential, factor and session deletion,
  revocation and retention semantics. Account must not implement deletion
  against provider internals.
- **Billing:** invoices and financial records are not soft-deleted by Account.
  Provider/Finance retention, legal hold and customer unlink behavior are
  authoritative and open; a customer mapping must not be removed merely
  because a subscription is canceled.
- **Payment data and audit:** LoopDev does not persist PAN/CVC or Auth
  secrets. Reuse shared audit retention once identified; do not invent
  Account-local retention.

## Open domain decisions and risks

| Decision | Status / owner | Safe boundary until resolved |
|---|---|---|
| `DEC-ACCOUNT-008`: Billing provider, processor-vs-MoR terms, tax arrangement and customer migration | `open` — Product/Finance | LoopDev is the confirmed seller operating initially from Spain (`DEC-ACCOUNT-014`); compare provider models for compatibility with that role, keep provider-neutral refs, and do not settle mapping history, canonical statuses or billing entity cardinality |
| `DEC-ACCOUNT-009`: session operation scope | `resolved_with_scope_change` — User | Keep sessions provider-owned; use sign-out-other-sessions only and do not expose device inventory |
| `DEC-ACCOUNT-010`: profile/avatar, preference catalogs, cancellation effective date, entitlement source and audit retention | `open` — Platform capability owners | Keep avatar as opaque optional relation; no irreversible cancellation semantics or invented audit store |
| `DEC-ACCOUNT-011`: ownership and approval for shared Profile/Preferences/Auth contract extensions | `partial` — user approved extending the shared contract for canonical profile fields; Platform owner still needed for Preferences/Auth details | Reuse `PlatformUser.fullName/avatarUrl`; do not create a module-local profile model. Preference and Auth operation extensions remain unapproved |
| `DEC-ACCOUNT-014`: LoopDev owns the SaaS, is the seller for subscriptions and will initially operate from Spain | `confirmed` — User | Provider selection, exact legal domicile, tax/invoicing responsibilities and provider contract terms remain for Finance review |
| Subscription cardinality, billing history/relink and canonical status mapping | `open` — Billing/Finance | Projection reflects provider truth; do not assume exactly one concurrent subscription |
| User deletion and data retention propagation | `open` — Platform Privacy/Auth/Files/Finance | Account deletion remains excluded; preserve records until authoritative policy defines erasure |

**Resolved decision `DEC-ACCOUNT-013`:** the user confirmed that existing
`PlatformUser.fullName/avatarUrl` remain the single source of truth, and
approved extending the shared contract so the profile can edit those fields.
`displayName` and `avatarRef` may describe UI concepts, but must not become
parallel authoritative fields. The avatar asset lifecycle and backing storage
policy remain open.

**Risks:** duplicating Tenant Settings membership, copying Auth state into a
second security model, matching billing customers by email, or storing
provider-owned values as authoritative local aggregates would cause cross-user
or cross-tenant corruption. Current `AuthPort` exposes the canonical
`PlatformUser` fields but has no approved profile-update, Preferences, MFA or
session-list operation; `SettingsAdapter` is organization-scoped and does not
supply those entities. Its current presence is not evidence that the Account
operations exist.

## Handoff

The domain boundaries, user/organization ownership split, provider-owned
security/billing projections and safe event semantics are established enough
to inform access/API/sync contracts. This result is **partial**: the open
decisions above must stay visible and be resolved by the named owner before
their corresponding contract or implementation is approved. No production
code, contract, fixture or migration was changed.
