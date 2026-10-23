# Account implementation plan

## Inputs

- Product/discovery: `discovery.md`; no approved product definition exists in `docs/06-product/platform/account/`.
- Design run: `MOD-ACCOUNT-20261010-001`, approved `design.md` and `visual-design.md`; specialist artifacts `domain-model.md`, `access-design.md`, `api-contracts.md`, `sync-design.md`.
- Track: `tracks/active/platform/2026-10-11-platform-account-pages.md`.
- Main issues: completed `06-plan` issue [#32](https://github.com/minoveaz/loopdev-v2/issues/32); active `07-build` issue [#33](https://github.com/minoveaz/loopdev-v2/issues/33).
- Plan approval: user approved on 2026-10-11. `07-build` started only for the two tasks that were `ready`; see `runs/MOD-ACCOUNT-20261010-001/07-build-evidence.md`.

## Scope and assumptions

Deliver the approved Profile, personal Account Settings, Security, and active-organization Billing destinations with the same operation semantics on desktop web, mobile web, iOS, and Android. Keep organization settings at `/app/settings`; use `PlatformUser.fullName/avatarUrl` as the sole canonical profile fields. Account pages are renderers, not owners of Auth, Files, Preferences, or Billing business rules.

Confirmed: LoopDev owns the SaaS, is the seller for subscriptions, and initially operates from Spain. Finance must compare a payment processor model with a provider's Merchant of Record offer and verify commercial, tax/invoicing, domicile, and market terms. The user is not being asked to choose whether LoopDev is the seller. Do not invent provider fees or select a provider.

Open owner decisions are isolated rather than silently assumed: avatar URL resolution and lifecycle; personal notification catalog; Preferences queue durability/recovery; Auth MFA factor policy; Billing permission/audit ownership and Finance's provider/contract recommendation. These decisions block only dependent work. No mock success, fake account data, direct Supabase Auth internal-table writes, Account-local uploader, or duplicate organization settings are permitted.

## Environment baseline at `06-plan`

| Field | Value |
|---|---|
| Repository | `minoveaz/loopdev-v2` |
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Checkout type | In-place branch checkout |
| Branch / base | `feature/platform-account-pages` / `develop` |
| HEAD | `af5e511506339ef1f96e85e9248fe0feee427516` |
| Working tree | Only the Account documentation directory is untracked; no tracked code changes |
| Runtime URL / port | Not started; planning does not require a runtime |
| Platform scope | `desktop_web`, `mobile_web`, `ios`, `android` (all required) |

## Current-state inventory and audits

| Audit | Result and evidence | Implementation consequence |
|---|---|---|
| Environment truth | Branch, commit, remote and status checked during `06-plan`; `git status --short --branch` shows only `?? docs/implementation/platform/account/`. No runtime was started. | Preserve the current branch and do not treat source presence as runtime evidence. |
| Platform reuse | UI/shell/component references and component inventory read. Reuse `AppShell`, `LoopdevShell`, `Topbar`, `ProtectedRoute`, common `PageContainer`, `PageHeader`, `DataCard`, `FormSection`, `Select`, `Switch`, `ThemeOptionCard`, shared feedback controls and native `MobilePageContainer`, `MobileInput`, `MobileSelectSheet`, `MobileButton`, `MobileAvatar`, and native feedback primitives. Files has UI/storage components but no verified user-avatar relation. | Add no duplicate shell, controls, uploader, form primitives or persistence queue. Files reuse remains gated on ownership/storage policy. |
| Legacy-flow | `Topbar.tsx` links `/account/{profile,settings,security,billing}`; `AppRoutes.tsx` binds those routes to Rivera template pages. `MobileAccountSheet.tsx` has the four labels but each press only closes the sheet. | Move account-menu destinations to canonical LoopDev routes; remove demo behavior from production paths only when real capability outcomes are wired. |
| Route/runtime | `/app/account/*` is proposed but unregistered; `/app/*` selects `LoopdevShell`, while old `/account/*` reaches the Rivera branch of `AppShell`. Native `App.tsx` derives `currentPath` from `/app/*`, but the Account sheet has no destination routing. | Plan protected web routes, direct-open/refresh/back and legacy redirects; native stack/deep-link routes must be added and tested on both OSes. |
| Surface-state | `view-state-matrix.md` defines loading, empty, error, forbidden, conflict, offline, pending and confirmed success per operation. | Keep each screen contract-driven; no demo fallback or success toast without authoritative response. |
| Accessibility/i18n | Existing web i18n/RTL and common controls; mobile has its own i18n/native component catalog. Visual specification requires 44px mobile-web targets, native touch sizing, accessible names/status announcements, keyboard/back/safe-area handling and RTL. | Include responsive, touch, keyboard, safe-area, back/deep-link, screen-reader and RTL checks in renderer acceptance. |
| Security/rollback | At the `06-plan` baseline, `apps/mobile/adapters/auth.ts` included successful no-op password update/reset and swallowed remote sign-out errors; `offlineQueue.ts` used unscoped `unknown` payloads, localStorage and in-memory fallback. | `ACCOUNT-AUTH-HARDEN` now repairs mobile Auth truth/storage/role boundaries. Keep the generic queue out of Account work and roll back only to unavailable/disabled destinations, never to fake success. |
| Architecture boundary | AuthPort exists but lacks profile/email/MFA/sign-out-other-sessions contracts; Profile/Preferences and Billing contracts/adapters are absent. Settings already owns `/app/settings`. | Contracts precede adapters/renderers. Auth owns Security, Platform owns Profile/Preferences, Billing/Finance owns organization billing, Account owns navigation/composition only. |
| Responsibility | `architecture-design.md`, `domain-model.md`, `access-design.md`, `api-contracts.md`, and `sync-design.md` assign UI, application, domain, persistence and authorization ownership. | Enforce server/provider authority; no provider SDK, tenant authorization or persistence in page components. |
| Refactor safety | Existing routes/menu and Settings remain behavior to preserve. Current sample implementations are explicitly non-authoritative. | Add regression evidence for old paths, auth guard, `/app/settings`, account-menu destinations and role/cache changes. Do not use feature fallback to Rivera mock pages. |

## Target architecture and suite interaction

```text
Web/native Account renderers
  -> shared capability contracts and application operations
  -> Platform Profile/Preferences, Auth, Tenant Context, Billing server ports
  -> verified adapters/providers and server-side authorization
```

Account renderer ownership is limited to navigation, composition, accessible
states, and invoking shared operations. Contract files under
`packages/contracts/src/` are proposals until approved by Platform owners.
Billing remains owned by Billing/Finance; clients receive a provider-neutral
server contract. Shared semantics, operation IDs and permission meaning must
match across all four clients, while layout and controls adapt per renderer.

| Module/capability | Trigger and shared data | Permission / event boundary | Validation evidence |
|---|---|---|---|
| Auth / ProtectedRoute | Open Account destination, reauthenticate, change credential or MFA | Authenticated subject only; provider confirms sensitive outcomes; no secrets in DTO/cache/log | AuthPort contract, provider integration and unauthorized/step-up tests |
| Tenant Context / Settings | Switch organization or open existing organization settings | Billing re-resolves active organization and Owner/Admin on every server operation; org settings stay at `/app/settings` | Cross-tenant IDOR/role tests; regression that Account does not duplicate member controls |
| Profile / Files | Read/update `PlatformUser.fullName/avatarUrl`; avatar upload only through approved user-owned asset contract | Self-only user scope; storage URL and asset ownership from Files policy | Cross-user denial, avatar lifecycle and profile update component tests |
| Preferences / i18n / Notifications / Theme | Change language, timezone, personal notifications or device appearance | User-scoped sync for language/timezone/notifications; theme can be device-local; queue only after identity-bound storage approval | Shared adapter contract tests, stale/conflict/offline behavior, mobile storage and locale/RTL checks |
| Billing / Finance / entitlements | Read subscription/invoices/payment summary; plan/payment/cancel action | Active org Owner/Admin only; server/provider is authority; entitlement updates only from authoritative read/event | RLS/server IDOR, provider sandbox/webhook idempotency and authorized/forbidden renderer tests |
| Notes | No Account operation/event is approved. Existing semantics: `packages/contracts/src/notes.ts`; web consumer adapter `src/loopdev/domains/platform/adapter/notes-port.ts`; native adapter `apps/mobile/adapters/notes.ts`. | `NOT_APPLICABLE`; Account must not add a note editor or account timeline. | Contract/consumer regressions only if shared contracts change; no Account change is planned. |
| Files / avatar | Current Files scope is `EntityScope`/`EntityRef` (`src/loopdev/domains/files/types.ts`); web hook `src/loopdev/domains/files/hooks/use-files.ts`; mobile organization-scoped file adapter `apps/mobile/adapters/files.ts`. No user-avatar relation/ownership contract was verified. | `REUSE` for an approved avatar asset association only; no Account-local uploader, file contract or organization-file access bypass. | Files owner approves user scope/storage lifecycle; user-scoped authorization tests and existing Files regression suite. |
| Activity / timeline | Shared `ActivityTimelinePort` in `packages/contracts/src/activity-timeline.ts`; web consumer `src/loopdev/domains/platform/adapter/supabase-timeline.ts`; mobile consumer `apps/mobile/adapters/activity-timeline.ts`. | `NOT_APPLICABLE`; no Account-local timeline or audit feed. | No new Activity events or storage; audit requirements remain with shared Platform/Billing owners. |
| Tasks | Shared task semantics in `packages/contracts/src/tasks.ts` and `src/loopdev/domains/platform/types.ts`; web adapter `src/loopdev/domains/platform/adapter/work.ts`; native adapter `apps/mobile/adapters/tasks.ts`. | `NOT_APPLICABLE`; Account must not create an account task system. | No Task contract changes or new Account task consumer. |
| Relations | Shared scoped `EntityRef` in `src/loopdev/domains/platform/types.ts`, consumed by Files, Notes and Tasks; no standalone Account relation contract. | `NOT_APPLICABLE`; Account identity/preferences are not organization record relations. | No new relation type, resolver or duplicate mapping. |
| Document Intelligence | Current lifecycle/event contracts in `src/loopdev/domains/document-intelligence/lifecycle-contracts.ts`; adapters/hooks live under `src/loopdev/domains/document-intelligence/` and mobile adapter under `apps/mobile/adapters/document-intelligence.ts`. | `NOT_APPLICABLE`; Account must not extract identity documents or create a document-processing state. | No Document Intelligence dependency or consumer is planned. |

These contract and consumer paths were inspected in `06-plan`. They are
explicitly classified rather than treated as future dependencies merely
because the repository contains them.

## Ordered work breakdown

Every task is an executable `07-build` ledger item with stable ID, owner,
platforms, dependencies, risk, files/areas, validation and measurable
acceptance criteria. Audit tasks are recorded as complete from the source
inspection in this phase; production tasks remain pending or blocked. The
ledger is the detailed source of truth for this list.

### Mandatory audits, before product implementation

`ACCOUNT-AUDIT-ENV`, `ACCOUNT-AUDIT-REUSE`, `ACCOUNT-AUDIT-LEGACY`,
`ACCOUNT-AUDIT-ROUTES`, `ACCOUNT-AUDIT-STATES`, `ACCOUNT-AUDIT-A11Y`,
`ACCOUNT-AUDIT-SECURITY`, `ACCOUNT-AUDIT-ARCH`, `ACCOUNT-AUDIT-RESP`, and
`ACCOUNT-AUDIT-REFACTOR`. Each has evidence references in the ledger and
acceptance criteria. No audit claims runtime or behavior absent source/test
evidence.

### Shared contracts and server/adapters

1. `ACCOUNT-NAV-CONTRACT` — common destination operation/deep-link meaning.
2. `ACCOUNT-PROFILE-CONTRACT` — canonical `PlatformUser` profile update.
3. `ACCOUNT-PREFS-CONTRACT` — user-synced preference contract.
4. `ACCOUNT-AUTH-CONTRACT` — Auth-owned security operations and honest unsupported states.
5. `ACCOUNT-BILLING-CONTRACT` — provider-neutral Billing/Finance contract.
6. `ACCOUNT-PROFILE-FILES` — profile/avatar adapter, only after Files policy approval.
7. `ACCOUNT-PREFS-SYNC` — durable identity-bound preference sync and migration.
8. `ACCOUNT-AUTH-HARDEN` — remove mobile Auth false-success, unsafe storage/role behavior and swallowed failures.
9. `ACCOUNT-AUTH-SESSIONS` — implement provider-backed sign-out of other sessions; individual session inventory/revocation are excluded by the approved scope change.
10. `ACCOUNT-BILLING-SERVER` — tenant mapping, Owner/Admin server authorization, audit, provider lifecycle/webhooks; blocked until Finance/Platform decisions.

### Renderers

Each capability has explicit desktop-web, mobile-web, and native (`ios` +
`android`) tasks: `ACCOUNT-{PROFILE|PREFS|SECURITY|BILLING}-{DESKTOP|MOBILE-WEB|NATIVE}`.
Each consumes its shared contract and includes navigation/deep-link behavior
and operation-level acceptance. Native tasks require both OS routes, safe
areas, touch/keyboard/back, and secure provider handoff where applicable.

### Focused operation and integration tests

`ACCOUNT-TEST-NAV`, `ACCOUNT-TEST-PROFILE`, `ACCOUNT-TEST-PREFS`,
`ACCOUNT-TEST-SECURITY`, and `ACCOUNT-TEST-BILLING` cover action outcomes, not
only visual presence. High-risk Auth/Billing journeys use E4 evidence; other
operations use focused unit/component/contract tests. The common validator
and release baseline are run after implementation is approved and built.

## Operation parity baseline

The 23 declared operations across Navigation (4), Profile (3), Preferences
(5), Security (6) and Billing (5) remain `missing` on desktop web, mobile web,
iOS and Android in the ledger because no authoritative operation is
implemented. Each missing operation/platform pair is explicitly mapped by
`operation_ids` to renderer tasks with acceptance criteria and required
validation. Plan approval records approved scope and sequencing, not delivery:
the ledger keeps coverage `missing` until implementation evidence exists.
`domain`, `renderer` and `operations` parity remain separate and
unverified/partial. Every required operation must be `implemented` or
explicitly approved `adapted` before `07-build` completes, `08-verify` starts,
or publication begins.

## Acceptance evidence plan

| Scope | Required evidence |
|---|---|
| Shared contract | Contract tests for all operations/errors/state semantics; `npm run validate:contracts`; typecheck |
| Desktop web | Focused component tests for each action; route direct-open/refresh/back and `npm run smoke:routes`; visual/accessibility checks |
| Mobile web | Same operation contract suite; narrow viewport/touch/keyboard/RTL component evidence; mobile navigation and deep-link checks |
| iOS / Android | Native TypeScript and Expo Web bundle; route/deep-link/back/safe-area/keyboard checks; device evidence for Auth/Billing provider handoff before claiming native parity |
| Authorization/synchronization | Subject/tenant/role spoofing denial, identity/tenant-switch cache purge, replay/conflict/retry, identity-bound queue recovery and no offline Security/Billing mutations |
| Account release baseline | `npm run lint`, `npm run typecheck`, `npm run test:quality`, `npm run test:multiplatform-contracts`, `npm run validate:contracts`, `npm run validate:mobile-boundaries`, `npm run validate:multiplatform`, `npm run build`, `cd apps/mobile && npx tsc --noEmit && npx expo-doctor && npx expo export --platform web --output-dir /tmp/loopdev-mobile-web` |

No production test/build/runtime command was run in `06-plan`; those validate
future changes. Planning validation commands and results are recorded in the
phase checkpoint.

## Risks, blockers and decisions

| ID | Decision/blocker | Owner | Effect / next action |
|---|---|---|---|
| `DEC-ACCOUNT-008` | Provider and processor-vs-MoR commercial model, precise domicile, tax/invoicing responsibilities and terms | Product + Finance | Compare official terms/costs for LoopDev operating from Spain and buyer markets; Finance recommends. No vendor or unverified tariff in code. |
| `DEC-ACCOUNT-009` | Session operation scope | User | Use Supabase's supported sign-out `others` scope; no individual session inventory/revocation or Auth internal-table writes. |
| `DEC-ACCOUNT-010` | Avatar Files lifecycle, preference catalog/migration, Billing cancellation/entitlement and audit-retention policies | Platform capability owners + Product/Finance | Resolve owners and write approved contracts; block only the dependent task. |
| `DEC-ACCOUNT-011` | Platform ownership/approval for Preferences and Auth shared extensions; Billing permission/audit contract | Platform owner | Confirm contract consumers and versioning before contract implementation. |
| `SYNC-ACCOUNT-QUEUE-MIGRATION` | Durable same-user preference queue, logout/restart recovery and import of legacy local settings | Platform Sync + Product | Do not reuse the current generic mobile queue; approve storage, principal binding, retry and migration behavior. |
| Mobile Auth safety | Existing mobile adapter contains no-op password/reset success, swallowed remote sign-out and storage/role risks | Platform Auth/Mobile | Remediate and test before native Security/Billing; maintain explicit errors. |
| Operation baseline | Required operations are missing on every platform, but each is mapped to operation-level renderer work | Platform Delivery + capability owners | Preserve `missing` through planning/build; require implemented or approved-adapted coverage before build completion, verification or publication. |

## Issue execution policy and current gate

The `06-plan` issue records the plan phase and its acceptance evidence. The
`07-build` issue [#33](https://github.com/minoveaz/loopdev-v2/issues/33) links
the ledger tasks, task-level owner blockers and dependencies. Plan approval
may preserve `missing` operation states only
because every required operation/platform pair is mapped to task-level
acceptance and validation; it does not authorize claiming parity. No build
phase starts without that approval and phase issue. Current plan state:
**approved and complete**. The `07-build` issue exists and the phase has
started for `ACCOUNT-NAV-CONTRACT` and `ACCOUNT-AUTH-HARDEN`; both tasks now
have evidence and are `done`. The remaining Account task states are tracked only in the approved delivery
ledger; use its live task counts rather than copying a stale number here.
The phase is not complete,
operation coverage remains missing where renderer operations are not yet
implemented, and no dependent work may start until its blockers are resolved.
