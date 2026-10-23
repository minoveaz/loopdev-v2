# Account area discovery

## Document control

| Field | Value |
|---|---|
| Module | Platform Account area |
| Suite | Platform |
| Run ID | `MOD-ACCOUNT-20261010-001` |
| User request | Replace the account-menu Profile, Account Settings, Security and Billing Rivera template/mock destinations with LoopDev-native destinations; discovery only. |
| Product definition | No approved Platform Account product definition was found under `docs/06-product/platform/account/` (the directory does not exist). |
| Discovery status | `complete` |
| Owner | Platform Delivery; capability owners remain Platform Profile/Preferences, Platform Auth, and Billing/Finance. |
| Repository baseline | `/Users/minoveaz/.copilot/repos/loopdev-v2`, branch `develop`, HEAD `af5e511506339ef1f96e85e9248fe0feee427516`; branch checkout; clean before workspace initialization. |

**PLATFORM_SCOPE**

- `desktop_web`: required
- `mobile_web`: required
- `ios`: required
- `android`: required

Desktop and mobile web are required by the Multiplatform Delivery Contract.
The user approved all four surfaces with the same account operations and
platform-adapted interfaces. Native routes and operations are currently
missing; this is an implementation gap, not a deferred platform decision.

## 1. Problem and objective

- **Business problem:** The signed-in account menu directs users to four
  Rivera sample pages. Those pages display and mutate demo/local state rather
  than authoritative LoopDev account, identity or subscription records. This
  makes the account entry point appear functional without establishing who
  owns the data, where mutations persist, or which permissions apply.
- **Primary objective:** Discover the expected LoopDev-native account
  destinations and their boundaries, compare them with current desktop,
  mobile-web and native behavior, and identify the decisions needed before
  design.
- **Success measure:** The four destinations use stable shared operation
  semantics on desktop web, mobile web, iOS and Android; personal and
  organization ownership is explicit; and all changes use authoritative
  contracts rather than Rivera demo state.
- **Explicit boundary:** This run only discovers. It does not design pages or
  APIs, choose product capabilities beyond the user's destination request,
  plan implementation, create issues, change production code, or approve
  billing/auth/security policy.

The user approved all four areas for the MVP, each with separate ownership:
global personal profile, personal preferences, personal authentication
security, and organization-owned billing. The sample behavior itself remains
non-authoritative. Provider capability, provider choice, and implementation
contracts must be validated during design; account deletion is not approved.

## 2. Actors and outcomes

| Actor | Job to be done | Outcome | Permissions/constraints |
|---|---|---|---|
| Signed-in member | View and manage global personal profile | Display name and avatar stay associated with the user across organizations | Self-service profile is user-owned; authentication email/credentials belong in Security |
| Signed-in member | Set personal application preferences | User-synced language, timezone and notifications, with device-adapted appearance | Language, timezone and notifications synchronize by user; appearance may adapt per device |
| Signed-in member | Manage personal authentication security | Review security status; change password/email, manage MFA and sign out other sessions | Auth provider owns credentials/session authority; provider support and safe reauthentication must be validated |
| Organization owner/admin | Review and manage organization subscription/billing | View plan/invoices, manage payment methods, upgrade/downgrade or cancel | Billing belongs to the active organization; only Owner/Admin may see or manage it. Provider is intentionally deferred to design comparison |
| Organization owner/admin | Manage workspace/organization settings and membership | Organization-scoped configuration and member administration | Existing `/app/settings` capability is tenant-oriented and distinct from personal Account Settings |
| Platform Delivery / product owner | Decide module boundary and follow-up platform scope | A coherent approved product definition and accountable owners | Must resolve the open decisions recorded below before a safe design handoff |

## 3. Expected domain capabilities

| Capability | Classification | Expected behavior | Priority |
|---|---|---|---|
| Four account-menu destinations | `REQUIRED_MVP` | Each account-menu action opens the corresponding LoopDev-native capability on desktop web, mobile web, iOS and Android | Same operations on all platforms; renderer adapts without changing meaning |
| Personal profile | `REQUIRED_MVP` | Read/update the user's global display name and avatar | Authentication identity and organization membership remain separate |
| Personal account preferences | `REQUIRED_MVP` | Manage user-synced language, timezone and personal notifications; appearance may adapt per device | Organization settings stay in `/app/settings` |
| Authentication/security surface | `REQUIRED_MVP` + `PLATFORM_REUSE` | Reuse AuthPort/provider for password/email, MFA and session review/revocation | Confirm provider operations and reauthentication support in design; account deletion excluded |
| Organization billing/subscription | `REQUIRED_MVP` | Owner/Admin can view the active organization's plan and invoices, manage payment methods, upgrade/downgrade or cancel | Compare providers in design; no vendor or pricing policy selected yet |
| Organization/workspace settings | `PLATFORM_REUSE` | Keep organization name, locale/timezone, membership, invitations and role/status controls on the existing tenant settings path | Do not duplicate `/app/settings` |

The `PLATFORM_REUSE` classification for AuthPort and organization settings is
an integration decision, not a claim that the requested pages are implemented
or that AuthPort currently covers every security-screen action.

## 4. Inputs, outputs and events

No Account-area capability contract was found. The following are discovery
candidates, not approved command/event schemas.

### Inputs

- Authenticated `PlatformUser` and `AuthSession` from
  `packages/contracts/src/auth-port.ts`.
- User-owned profile, preferences and security records; authoritative
  persistence and profile/preferences contracts remain design work.
- Active organization and authorization from Tenant Context for billing;
  customer/provider mapping is not yet defined.
- Approved commands: update display name/avatar; update user-synced language,
  timezone and notifications; adapt appearance per device; change
  password/email; manage MFA and sessions; view subscription/invoices, manage
  payment methods, upgrade/downgrade and cancel the active organization's
  subscription.
- Account deletion and sample-only commands not listed above are not approved.

### Outputs

- Read models: authenticated profile, personal preferences and security
  status; organization subscription, payment-method summary and invoices for
  authorized Owner/Admin users.
- Mutations: approved self-service profile/preferences/security actions and
  Owner/Admin billing actions for the active organization. No authoritative
  mutation can currently be inferred from the Rivera pages.
- User-visible outcomes: explicit success, validation, forbidden, loading,
  error, pending, offline and conflict behavior from the eventual shared
  contracts. The current demo toast/local-storage outcomes are not
  authoritative.

### Events

| Event | Producer | Consumers | Payload/invariants | Idempotency/audit |
|---|---|---|---|---|
| Auth/session changes | Existing AuthPort | AuthProvider, route guard, client adapters | Existing auth contract; no new Account event proposed | Preserve AuthPort behavior; never emit a false success from local UI state |
| Profile/preference changes | Not identified | Shell, mobile clients, relevant product modules | Profile and syncable preferences are user-owned; appearance may remain device-adapted | Versioning/conflict and audit policy to define in design |
| Subscription/payment/invoice lifecycle | Not identified; provider comparison belongs to design | Entitlement consumers, organization billing surface, finance/support | Subscription belongs to the active organization; Owner/Admin authorization | Provider webhook idempotency, cancellation lifecycle and billing audit to define in design |

## 5. Entities, relationships and lifecycle

| Entity | Owner | Relationships | States | Invariants / discovery status |
|---|---|---|---|---|
| `PlatformUser` / authenticated identity | Platform Auth | One identity may have organization memberships | Auth lifecycle in `auth-port.ts` | Current shared contract exists; editable profile fields and verified email semantics are not defined by this request |
| Personal profile | Platform Profile/Preferences | Global user identity; not scoped to active organization | Not defined | User-approved display name and avatar; storage, image limits, verification, versioning and retention are design details |
| Personal preference set | Platform Profile/Preferences | User preference set syncs across clients; appearance may be device-adapted | Not defined | Language, timezone and notifications are user-synced; do not mix tenant settings |
| Auth credential/session/MFA factor | Platform Auth/provider | Belongs to authenticated user; sessions belong to devices/clients | Auth types and events partly defined in AuthPort | Password/email, MFA and provider-supported sign-out of other sessions are in scope; individual session inventory/revocation are excluded by approved scope change |
| Organization settings and membership | Platform Settings / Tenant Context | Organization → users/memberships | Current Settings domain has active/pending/suspended members | Existing adapter and route are organization-scoped; reuse it and do not duplicate in personal Account Settings |
| Subscription/customer/billing profile/invoice/payment method | Billing/Finance; customer is the active organization | Organization → subscription, payer details, payment methods and invoices | Not defined in LoopDev Account contracts | Only Owner/Admin may view or manage; upgrades, downgrades and cancellation are in scope; provider and lifecycle details belong to design |

Detailed lifecycle, cancellation effective dates, payment retries, webhook
idempotency, optimistic versioning, audit and recovery contracts remain design
work. They do not block discovery because the ownership, actors and user
operations are now approved.

## 6. Platform and suite integration

| Capability/module | Decision | Consumed contract | Produced data/events | Duplicate prohibited? |
|---|---|---|---|---|
| Rivera account samples under `src/template/rivera/pages/account/` | `REJECTED_DUPLICATE` as a production target; `INFORMATIONAL_ONLY` for current visible baseline | None; these are template pages | Demo/local browser storage and sample data | Yes: do not promote mock handlers or mock entities into LoopDev contracts |
| Shared AuthPort / Tenant Context | `REUSE` for identity, session and tenant context | `packages/contracts/src/auth-port.ts`; current adapters under `src/loopdev/domains/platform/adapter/` | Existing auth and tenant-context events | Yes: do not create account-page-local password/session/tenant rules |
| Organization Settings domain | `REUSE` for organization settings and membership | `src/loopdev/domains/settings/` and `/app/settings` | Organization/member state through SettingsAdapter | Yes: do not duplicate organization/membership management on personal Account Settings |
| Common UI and Rivera baseline | `REUSE_CURRENT_PRIMITIVE` | `PageContainer`, `PageHeader`, `DataCard`, `FormSection`, `SettingsCard` and current shared controls as applicable | Presentation only | Yes: reuse shared primitives; a visible shared component does not prove business behavior |
| Theme and notification preferences | `REUSE` where existing hooks own the relevant setting | `src/hooks/use-theme.tsx`, `src/hooks/use-notification-prefs.ts` | Current theme/notification behavior | Scope and persistence semantics must be verified before Account integration |
| Billing/subscription | `MODULE_SPECIFIC` for organization subscription and billing operations; provider selection deferred to design | No Account/Billing contract or adapter found; generic multiplatform contract only | None identified | Compare provider options during design; do not create a mock/local billing implementation as production capability |
| CRM, Notes, Communications, ERP and other suites | `REUSE` only for current user/context contracts | Auth/Tenant Context where applicable | Account identity may be consumed, but no new CRM business entity/event is proposed | Do not create suite-local profile, auth or billing sources |

## 7. Market/domain baseline

The following is `INDUSTRY_BASELINE`, not approved LoopDev scope:

- Users normally need an identifiable personal-account/profile area and a
  separate place for organization/workspace administration.
- Authentication security controls need authoritative provider semantics and
  may include credential, MFA and session management; local preferences cannot
  represent those controls.
- SaaS billing is customer/subscription/entitlement work with role and payer
  boundaries; it should not be modeled as any signed-in user's personal card
  settings by default.
- Desktop and mobile surfaces may adapt layout and interaction, but must keep
  operation meanings, authorization and lifecycle consistent.

## 8. External benchmark and source register

First-party sources were accessed on **2026-10-10**. They provide bounded
reference patterns only; none authorizes LoopDev scope.

| Reference | Source URL | Accessed | Observed capability/pattern | Classification | LoopDev applicability | Tradeoff / do not copy |
|---|---|---|---|---|---|---|
| GitHub account settings and sessions | [Managing user account settings](https://docs.github.com/en/account-and-profile/how-tos/account-settings); [Viewing and managing your sessions](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/viewing-and-managing-your-sessions) | 2026-10-10 | Official account settings cover personal account controls; session docs describe reviewing devices and revoking unrecognized sessions | `INDUSTRY_BASELINE`, `TRANSFERABLE_PATTERN` | Keep personal account controls and security/session operations attached to the user identity; use provider-backed session semantics | Do not copy GitHub-specific navigation, repository security features, or claim device inventory unless LoopDev Auth can provide it |
| Slack profile/preferences and workspace billing | [Your profile & preferences](https://slack.com/help/categories/360000047906-Your-profile-preferences); [Manage your Slack plan and billing details](https://slack.com/help/articles/218915087-Manage-your-Slack-plan-and-billing-details) | 2026-10-10 | Slack separates personal profile/preferences from workspace administration; its billing guide assigns billing controls to workspace owners and eligible upgraded-workspace members, and documents plan, payment method and billing-history actions | `INDUSTRY_BASELINE`, `TRANSFERABLE_PATTERN` | Validate separate personal and organization-owned surfaces, with billing authorization tied to the paying workspace/customer | Do not copy Slack's role policy, feature packaging, or assume LoopDev's payer is an organization owner |
| Stripe customer portal | [Provide a customer portal to your customers](https://docs.stripe.com/customer-management) | 2026-10-10 | Provider-hosted portal can expose configured billing information, payment methods, subscriptions and invoices; configuration limits available actions and portal sessions are temporary | `INDUSTRY_BASELINE`, `TRANSFERABLE_PATTERN` | Billing may be a controlled integration/portal boundary rather than an invented local CRUD domain; configuration is part of authorization/product policy | Do not assume Stripe is LoopDev's provider, expose a privileged client secret, or enable upgrades/cancellations by default |

## 9. LoopDev differentiation hypotheses

These are bounded hypotheses, **not MVP scope**.

| Hypothesis | User value | Product behavior changed | Platform/domain impact | Complexity | Validation experiment | Decision |
|---|---|---|---|---|---|---|
| Explicit scope labels on account surfaces | Users know whether a value belongs to themselves, an organization or a payer | Show ownership/role context before edits and route organization changes to `/app/settings` | Shared identity/tenant context; renderer labels and permission-aware navigation | Low-medium | Task-test with members and organization owners; ask them to identify owner and impact before saving | `explore` |
| Truthful security status and session controls | Users do not mistake a local demo toggle for real account protection | Only show MFA/session actions when AuthPort/provider has authoritative state and completion events | Extend/reuse AuthPort; audit/revocation semantics; desktop/mobile contract parity | Medium-high | Compare current user mental model with provider-backed prototype; measure false confidence and task success | `explore` |
| Preference portability with explicit local exceptions | Preferences behave predictably when users switch devices without hiding which settings are device-specific | Distinguish user-synced preferences from device-local presentation controls | Preference contract, sync/versioning and native storage adaptations | Medium | Cross-device and offline prototype test for language/theme/notification continuity | `explore` |
| Billing actions constrained by actual entitlement and payer | Prevents unauthorized plan/payment changes and removes misleading sample pricing | Present only provider/customer-authorized billing actions and link to provider-managed flows where appropriate | Billing owner, entitlement source, provider, server authorization, audit/webhook contract | High | Role-based prototype test with payer/admin/member personas before selecting billing MVP | `explore` |

## 10. Product definition currently approved

- **Product documents:** No approved product definition for `Platform Account`
  or these four account destinations was found in `docs/06-product`. The user
  approved the following scope in conversation on 2026-10-10.
- **Approved scope:** All four areas are in the MVP with the same operations
  on desktop web, mobile web, iOS and Android; platform renderers may adapt
  their interaction without changing semantics.
- **Profile:** Global personal profile with editable display name and avatar.
  Credentials remain in Security.
- **Account Settings:** Personal preferences only: language, timezone,
  appearance and personal notifications. Language, timezone and notifications
  sync by user across devices; appearance may adapt per device. Organization
  settings remain in `/app/settings`.
- **Security:** Personal identity security, including password/email changes,
  MFA and session/device review and revocation. Account deletion is not
  approved. The provider-backed operation set must be confirmed in design.
- **Billing:** Subscription, invoices and payment methods belong to the active
  organization. Only Owner/Admin may view or manage them. Viewing plan/invoices,
  managing payment methods, upgrading, downgrading and cancellation are in
  scope. Provider comparison is explicitly deferred to design.
- **Explicit exclusions:** Account deletion, duplication of organization
  settings in Account, unapproved auth controls (including SSO/passkeys),
  sample prices or payment data, and any assumption that Rivera mock behavior
  is authoritative.
- **Existing product artifacts:** Auth/Settings artifacts and active Platform
  tracks are implementation context, not approval for additional scope.
- **Relevant active track:** `tracks/active/platform/2026-09-09-loopdev-v2-monorepo-multitenancy.md`
  records a future Auth/tenant and billing foundation at a broad architectural
  level; it is not an Account product definition or billing approval.
- **Existing Platform Settings context:**
  `docs/implementation/platform/settings/SETTINGS_MVP_DELIVERY.md` describes
  organization settings, users/invitations and explicitly excludes billing.
  It is implementation context, not the requested personal Account product
  definition.
- **Existing Auth context:**
  `docs/implementation/platform/auth/` contains a previous run's discovery,
  handoff and implementation records. Treat its prior run metadata as
  historical context; verify present capabilities against current contracts,
  adapters, routes and tests in this checkout.

### Legacy reference policy

| Legacy/reference | Informational meaning | Current reuse target | Decision |
|---|---|---|---|
| Rivera `/account/profile`, `/account/settings`, `/account/security`, `/account/billing` and their page files | Current account-menu destinations and illustrative sample content; handlers use mock/local browser state | Use current app shell, shared controls/common page primitives, AuthPort and applicable Platform Settings hooks/adapters | `INFORMATIONAL_ONLY` |
| Rivera profile avatar toast and seeded mock profile data | Sample fields and mock interaction only | No upload or profile data contract identified yet | `REJECTED_DUPLICATE` |
| Rivera local password/MFA/session/account-deletion state | Sample interactions; not identity-provider evidence | Existing AuthPort/provider boundary, subject to capability confirmation | `REUSE_CURRENT_PRIMITIVE` |
| Rivera billing plans, seeded payment methods/invoices and local mutations | Sample prices/customer data; not a billing provider or contract | No current LoopDev billing domain; use only a future approved billing contract/provider | `REJECTED_DUPLICATE` |
| Legacy/sample “workspace” values in personal Account Settings | May combine personal preference and tenant configuration | Current `/app/settings` + SettingsAdapter for organization-owned settings; user-owned preference contract TBD | `REUSE_CURRENT_PRIMITIVE` |
| General `SAAS_*` references, if encountered | Proposed/non-runtime material under the source-of-truth policy | None until verified by current source or approved intent | `INFORMATIONAL_ONLY` |

## 11. Existing LoopDev implementation

| Area | Existing route/code/doc | Behavior observed | Evidence |
|---|---|---|---|
| Desktop account menu | `src/components/layout/Topbar.tsx` | Signed-in menu includes Profile, Account Settings, Security and Billing links; top bar is rendered by authenticated `AppShell` | `Topbar.tsx`; `AppShell.tsx` |
| Desktop routes | `src/routes/AppRoutes.tsx` | Four `/account/*` paths lazy-load `@/template/rivera/pages/account/{Profile,Settings,Security,Billing}` within the protected shell route tree | `AppRoutes.tsx`; `ProtectedRoute.tsx` |
| Profile template | `src/template/rivera/pages/account/Profile.tsx` | Prefills from mock user/defaults, saves profile values to `account:profile` browser storage; avatar handler shows a mock toast | `Profile.tsx` |
| Account Settings template | `src/template/rivera/pages/account/Settings.tsx` | Stores settings under `account:settings`; mixes workspace name/landing page with density, theme, locale, timezone, date and notification preferences | `Settings.tsx`; theme and notification hooks also exist |
| Security template | `src/template/rivera/pages/account/Security.tsx` | Password, MFA, session revoke and delete-account actions mutate local/mock state; delete signs out after clearing browser storage | `Security.tsx`; `use-auth.tsx` |
| Billing template | `src/template/rivera/pages/account/Billing.tsx` | Includes hard-coded plan/prices, payment methods and invoices; mutations and billing details persist in local browser storage | `Billing.tsx`; no LoopDev billing adapter/contract/provider implementation found in `src/`, `packages/`, `apps/mobile/` or `supabase/` |
| LoopDev organization settings | `/app/settings`; `src/loopdev/pages/Settings.tsx`; `src/loopdev/domains/settings/` | Organization name/slug/timezone/locale and organization member invitation/role/status/removal use SettingsAdapter and tenant context | `LoopdevRoutes.tsx`, `Settings.tsx`, settings domain; `src/test/settings/settings-adapter.test.ts` covers tenant persistence/isolation/owner protection |
| Shared identity and tenant context | `packages/contracts/src/auth-port.ts`; `src/hooks/use-auth.tsx`; `src/routes/ProtectedRoute.tsx`; platform adapters | AuthPort exposes session, sign-in/out, reset/update password and tenant context; protected routes redirect missing sessions. It does not establish the full profile/MFA/session-list/billing contracts | Current contract, hook, adapter and route guard; focused tests in `src/test/platform/auth-port.test.ts` and `src/test/auth/login.test.tsx` |
| Mobile-web surface | Shared `Topbar`, `AppShell`, routes and responsive page components | Account menu links remain in the web app shell and point to the same mock route implementations; a distinct mobile-specific operation contract/test was not found | `AppShell.tsx`, `Topbar.tsx`, `AppRoutes.tsx`, shell reference |
| Native mobile account surface | `apps/mobile/components/MobileAccountSheet.tsx`, `MobileAccountScreen.tsx`; `apps/mobile/LoopdevRoutes.tsx` | The sheet renders the four account labels, but each row's `onPress` only closes the sheet. The account screen has Profile and Preferences rows without handlers. Native route exports are empty in `LoopdevRoutes.tsx` | Current native source |
| Focused page tests | `src/test/` | No focused account Profile/Settings/Security/Billing page or account-navigation operation tests were found. Existing auth and organization-settings tests do not verify these screens | Test inventory; see `src/test/auth/`, `src/test/platform/`, `src/test/settings/` |
| Shared presentation | `src/components/common/` | PageContainer, PageHeader, DataCard, FormSection, SettingsCard and shared form primitives exist; their presence is not behavioral evidence | `PLATFORM_V2_UI_REFERENCE.md` and source paths |

No account-page browser/runtime journey or test was run during this discovery.
Source inspection is evidence of the current implementation shape, not
behavioral compliance.

## 12. Expected-versus-existing matrix

| Capability | Expected | Product source | Existing implementation | Baseline status | Evidence | Next action |
|---|---|---|---|---|---|---|
| Profile destination | LoopDev-native global profile with display name/avatar | User-approved scope (2026-10-10); menu link | Rivera Profile route; seeded mock fields and browser-storage save | `EXISTS_BUT_CONFLICTS` | `Topbar.tsx`, `AppRoutes.tsx`, `Profile.tsx` | Design authoritative user-owned profile contract and web/native adapters |
| Personal account settings destination | LoopDev-native personal preferences, distinct from org settings | User-approved scope (2026-10-10); route link | Rivera Settings mixes workspace name/landing with user-like display, locale and notification settings; `/app/settings` separately owns organization settings | `EXISTS_BUT_CONFLICTS` | Rivera Settings and `src/loopdev/pages/Settings.tsx`; `SETTINGS_MVP_DELIVERY.md` | Design cross-device preference persistence and per-device appearance adaptation |
| Security destination | LoopDev-native security surface backed by AuthPort/provider | User-approved scope (2026-10-10); route link; existing AuthPort context | Rivera sample with local password/MFA/session/delete state; AuthPort supports core session/password methods but no account UI proof for the other operations | `EXISTS_PARTIALLY` | Rivera Security, AuthPort contract/hook and tests | Verify provider operations/re-authentication and design shared web/native contract |
| Billing destination | Organization-owned LoopDev-native billing for Owner/Admin | User-approved scope (2026-10-10); route link; no current billing product source | Rivera demo plans, sample invoices/payment methods, browser-local mutations; no LoopDev billing contract, adapter or provider evidence found | `EXISTS_BUT_CONFLICTS` | Rivera Billing; code/contract/migration search | Compare provider options in design; define lifecycle, entitlements, authorization and invoice data |
| Desktop navigation | Four account actions route to native surfaces under protected shell | User request plus `Topbar.tsx` | Links and protected routes exist but resolve to Rivera templates | `EXISTS_PARTIALLY` | `Topbar.tsx`, `AppRoutes.tsx`, `ProtectedRoute.tsx` | Preserve route access semantics while product surfaces are approved |
| Mobile-web operations | Same shared account actions and meanings on responsive web | Multiplatform Delivery Contract | Shared Topbar/routes/pages exist, but actions remain template/local-state behavior; no focused mobile operation tests | `EXISTS_PARTIALLY` | AppShell/Topbar/routes; no page tests found | Define and verify operation-level parity separately from responsive visibility |
| Native account actions | Same operations as web, with renderer adaptations on iOS and Android | User-approved scope (2026-10-10); Multiplatform Delivery Contract | Labels exist in bottom sheet, but row press closes only; Account screen rows have no handlers and native route elements are empty | `EXISTS_PARTIALLY` | `MobileAccountSheet.tsx`, `MobileAccountScreen.tsx`, native `LoopdevRoutes.tsx` | Design native navigation, accessibility, secure storage and operation adapters |
| Organization settings | Preserve tenant-scoped org/member administration outside personal Account Settings | Existing `SETTINGS_MVP_DELIVERY.md` and active Platform/tenancy context | `/app/settings` with SettingsAdapter and tenant-scoped tests | `EXISTS_PARTIALLY` | Settings page/domain/test and delivery evidence | Reuse; do not duplicate or relabel this as personal account settings |

## 13. MVP, follow-up and out-of-scope boundaries

### MVP

- LoopDev-native Profile, Account Settings, Security and Billing destinations
  with operation parity across desktop web, mobile web, iOS and Android.
- Global user profile with display name/avatar; personal preferences for
  language, timezone, appearance and notifications; Auth-owned password/email,
  MFA and session operations; organization-owned billing with plan/invoice
  viewing, payment-method management, upgrades, downgrades and cancellation.
- Only organization Owner/Admin may view or manage Billing.
- Reuse AuthPort, Tenant Context, existing organization settings and common
  UI primitives where the relevant operation belongs to them.
- User-synced language, timezone and notifications; appearance may adapt per
  device. Organization settings remain in `/app/settings`.
- Do not count the current Rivera sample behavior as LoopDev functionality.

### Design-phase decisions

- Compare billing providers; no vendor is selected in discovery.
- Verify Auth provider support for email/password changes, MFA, sessions and
  revocation across web and native; do not simulate unsupported actions.
- Define preference conflict/offline behavior, account profile storage and
  avatar limits, billing cancellation timing, entitlement updates and invoices.

### Out of scope for this run

- UI implementation, API/domain contract implementation, migration, provider
  selection or detailed commercial/auth policy changes.
- Organization settings/member management already owned by the existing
  Platform Settings capability.
- Copying Rivera demo data/actions or creating parallel LoopDev account
  storage for the sake of filling all sample controls.
- GitHub issues, commits, pushes, pull requests or production changes.

## 14. Contradictions, assumptions and open decisions

| ID | Type | Finding | Impact | Owner | Resolution |
|---|---|---|---|---|---|
| DEC-ACCOUNT-001 | `confirmed` | The four surfaces are in the MVP but remain separate capabilities: personal Profile, personal Account Settings, Auth Security and organization Billing | Prevents merging personal, auth and tenant data into one domain | User/product owner | Confirmed in conversation 2026-10-10; design may choose coordinated workspace breakdown without merging domains |
| DEC-ACCOUNT-002 | `confirmed` | Account Settings means personal language, timezone, appearance and notifications; organization settings remain `/app/settings` | Prevents duplicate tenant settings and cross-tenant mutation | User/product owner | Confirmed in conversation 2026-10-10 |
| DEC-ACCOUNT-003 | `confirmed` | Profile is global to the user, with display name/avatar; credentials belong in Security | Establishes user ownership across organization switches | User/product owner | Confirmed in conversation 2026-10-10 |
| DEC-ACCOUNT-004 | `confirmed` | Security covers personal password/email, MFA and session/device review/revocation; account deletion is excluded | Establishes AuthPort/provider reuse and required security operations | User/product owner | Confirmed in conversation 2026-10-10; provider feasibility is a design validation |
| DEC-ACCOUNT-005 | `confirmed` | Billing belongs to the active organization; only Owner/Admin can view/manage; plan changes, payment methods, invoices and cancellation are in scope | Establishes tenant isolation and authorization boundaries | User/product owner | Confirmed in conversation 2026-10-10 |
| DEC-ACCOUNT-006 | `confirmed` | Desktop web, mobile web, iOS and Android must support the same operations with adapted UX | Native app work is required, not deferred | User/product owner | Confirmed in conversation 2026-10-10; native routes are currently missing |
| DEC-ACCOUNT-007 | `confirmed` | Language, timezone and notifications sync by user; appearance may adapt per device | Defines preference ownership and cross-device expectations | User/product owner | Confirmed in conversation 2026-10-10 |
| DEC-ACCOUNT-008 | `open_decision` | Billing provider and processor-vs-MoR commercial terms are not selected; LoopDev is the confirmed seller and will initially operate from Spain (`DEC-ACCOUNT-014`) | Provider APIs, fees, invoicing/tax responsibilities and hosted flows influence contracts and lifecycle | Billing/Finance owner TBD | Compare viable provider offerings for LoopDev's Spain launch; keep provider-neutral contracts, verify compatibility with LoopDev's confirmed seller role, and require explicit approval for any change to that role |
| DEC-ACCOUNT-009 | `open_decision` | Current AuthPort/provider capability for MFA and session/device revocation is not proven across native clients | Required operations could exceed current adapters | Platform Auth owner | Validate in design; if unsupported, define an approved platform extension rather than mock success |
| DEC-ACCOUNT-010 | `open_decision` | Detailed owner assignment, lifecycle policies, persistence, conflict/offline behavior and billing entitlement source remain unspecified | Detailed architecture and acceptance criteria cannot be finalized yet | Platform capability owners | Resolve in module-design; these do not prevent a safe design handoff |
| DEC-ACCOUNT-014 | `confirmed` | LoopDev is the legal entity that owns the SaaS and is the seller for subscriptions; LoopDev will initially operate from Spain | Determines provider eligibility; tax/invoicing obligations and precise legal domicile still require Finance verification | User | Confirmed by user on 2026-10-11; evaluate providers for LoopDev's Spain launch and do not make the user choose a reseller model |

### Discovery status

Discovery is `complete`: product decisions establish enough scope, ownership,
roles and platform coverage for a safe `module-design` handoff. Remaining
provider and feasibility questions are explicit design inputs, not discovery
blockers.

## 15. Handoff to module-design

- **Exact handoff:** `MOD-ACCOUNT-20261010-001:00-discovery` is complete and
  ready for `01-design`. This turn updated the discovery from the user's
  explicit decisions on 2026-10-10. Do not treat an unselected billing
  provider or unverified Auth capability as implemented. The user confirmed
  LoopDev as the legal SaaS owner and seller entity, initially operating from
  Spain, on 2026-10-11.
- **Target architecture questions:** Define independent Profile/Preferences,
  Auth Security and Billing capability contracts and their shared navigation;
  compare billing providers and map authoritative identity/customer sources.
- **UX questions:** Design equivalent operations for web and native with
  accessible platform adaptations, pending/error/forbidden states, and clear
  active-organization billing context.
- **Domain questions:** Define profile/avatar persistence, synchronized
  preferences and per-device appearance, MFA/session lifecycle, organization
  subscription lifecycle, cancellation timing, invoices and entitlements.
- **Platform reuse/extension questions:** Reuse AuthPort, Tenant Context,
  SettingsAdapter, theme/notification hooks and shared primitives. Any new
  shared capability/contract requires impact analysis and explicit approval;
  no Platform extension is approved.
- **Required decisions before planning:** Module-design must recommend domain
  ownership, provider options, AuthPort extensions (if needed), full lifecycle,
  server-enforced billing authorization, web/native adaptation and evidence
  criteria. Obtain separate approval for any new shared Platform contract.
- **Discovery state:** `complete`.
