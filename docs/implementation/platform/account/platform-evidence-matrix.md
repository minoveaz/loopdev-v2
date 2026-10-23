# Platform evidence matrix

This matrix began as a discovery baseline. The `07-build` section below records
the current implementation evidence; it does not claim complete Account
operation or device parity. User decisions approve identical operation
semantics across desktop web, mobile web, iOS and Android.

On 2026-10-23, the user deferred all iOS/Android device acceptance and
prioritized desktop development. This is a scheduling deferral, not a removal
of native platforms from the approved scope; native tasks remain incomplete
and no device parity is claimed. Billing remains disabled by user decision.

| Capability/operation | Domain parity | Desktop renderer/action | Mobile renderer/action | iOS | Android | Status | Owner | Gap/next action |
|---|---|---|---|---|---|---|---|---|
| Account menu: `open_profile_destination`, `open_account_settings_destination`, `open_security_destination`, `open_billing_destination` | `partial` — shared destination IDs and authenticated access meaning exist; Billing availability is explicitly disabled until provider/commercial readiness | `partial` — Profile, personal Preferences and Security link to canonical LoopDev routes; Billing remains visible but disabled in account menu/sidebar/command palette and its page route is removed | `partial` — Profile, Preferences and Security are reachable through responsive web navigation; Billing is disabled and not registered as a route | `partial` — Profile, Preferences and Security destinations are connected from native account surfaces; Billing is visible but disabled; component navigation tests and Expo iOS bundle pass, but device navigation is not runtime-verified | `partial` — same native destinations and gates; component navigation tests and Expo Android bundle pass, but device navigation is not runtime-verified | PARTIAL | Platform Delivery | Keep Billing disabled until provider/commercial decision and server authority are approved; capture iOS/Android destination journeys; do not infer native runtime behavior from bundle exports |
| Profile: read/update global display name and avatar | `partial` — shared Auth/Profile adapter composes canonical `avatarUrl` updates with user-owned Files upload, signed preview and cleanup; all 16 RLS tests pass on an isolated local stack | `implemented` — Profile reads the authenticated user, updates only the canonical name, previews private avatars through signed URLs, and supports upload/removal; responsive controls and 10 operation/state tests pass | `implemented` — same shared operations at narrow viewports; 44px minimum touch targets, focus-visible actions and logical RTL positioning covered by component/routing tests | `partial` — native Profile route, name/avatar operations and signed preview use shared Auth/Files adapters; 7 operation/state tests and iOS export pass, but device navigation, safe area, keyboard, touch and picker permissions are unverified | `partial` — same Expo renderer and operations; 7 operation/state tests and Android export pass, but device navigation, safe area, keyboard, touch and picker permissions are unverified | PARTIAL | Platform Profile/Preferences | Keep `ACCOUNT-PROFILE-NATIVE` in progress until iOS and Android device acceptance is captured; keep signed preview URLs temporary |
| Personal preferences: language, timezone, appearance, personal notifications | `implemented` — shared versioned/idempotent Supabase adapter, user-bound durable queue and owner-only RLS migration; 12 pgTAP tests pass on an isolated local stack; all three pending migrations applied to the authorized Dev project and the RPC is present in PostgREST | `implemented` — canonical personal route, replace-style legacy redirect, six-locale copy, synced/pending/offline/conflict/error/sign-in states; focused component and route tests pass | `implemented` — same responsive renderer and operations; mobile-width test covers all fields, 44px target controls, native-select absence and RTL language behavior | `partial` — native Preferences screen and six operations are implemented; component tests, TypeScript and Expo iOS bundle pass; per-OS restart, identity, safe-area, back, touch and locale device journeys remain unverified | `partial` — same Expo screen and operations; component tests, TypeScript and Expo Android bundle pass; per-OS restart, identity, safe-area, back, touch and locale device journeys remain unverified | PARTIAL | Platform Profile/Preferences | Keep `ACCOUNT-PREFS-NATIVE` in progress until iOS and Android runtime acceptance is captured; appearance remains device-local |
| Security: password/email, TOTP MFA, sign out other sessions | `partial` — provider-backed password/email/TOTP/security-state contracts and other-session sign-out exist | `partial` — renderer uses AuthPort; 9 focused component tests cover operations and provider outcomes; authenticated deep link, reload and legacy redirect were observed on 2026-10-23; no mutation was submitted and structured E4 evidence remains outstanding | `partial` — renderer has 7 focused operation/error tests; Expo Web route, account-menu navigation, refresh, legacy redirect, back and invalid-email rejection were runtime-checked; no successful provider mutation was performed | `partial` — screen and operations are implemented and iOS bundle exports; no simulator/device runtime available | `partial` — screen and operations are implemented and Android bundle exports; no simulator/device runtime available | PARTIAL | Platform Auth | Complete structured desktop/mobile-web operation evidence; iOS/Android device acceptance is deferred by the user; no device inventory, SMS MFA or per-session revocation |
| Organization Billing: read plan/invoices, manage payment methods, upgrade/downgrade/cancel | `not_tested` — organization ownership/Owner-Admin permissions approved; provider contract pending | `missing` — seeded plan/payment/invoice data and local mutations only | `missing` — same mock page; no responsive action test | `missing` — no native destination/action | `missing` — no native destination/action | PARTIAL | Billing/Finance + Platform | Compare provider options; define customer mapping, entitlement source and lifecycle |
| Organization settings: preserve existing org/member operations outside personal Account | `partial` — current tenant adapter and focused tests exist; not full runtime certification | `/app/settings` is a LoopDev route and organization/member settings use SettingsAdapter; adapter tests cover tenant isolation/owner protection | Same route/component adaptation; no separate responsive operation parity claim in this discovery | `not_applicable to this Account scope` | `not_applicable to this Account scope` | PARTIAL | Platform Settings owner | Reuse current Settings domain; do not duplicate in personal Account |

## Runtime snapshot

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Checkout type | Branch checkout |
| Branch and HEAD | `feature/platform-account-pages` — `af5e511506339ef1f96e85e9248fe0feee427516` |
| Working tree | Modified; pre-existing and current phase changes preserved |
| Desktop URL/port | `http://127.0.0.1:8080/app/account/security` (authenticated deep link and reload observed; no account mutation submitted) |
| Mobile URL/port | `http://127.0.0.1:8080/app/account/profile` (same responsive web route; authenticated browser journey unavailable) |
| Validation timestamp | 2026-10-11 |

## Parity summary

| Capability | `domain` parity | `renderer` parity | `operations` parity |
|---|---|---|---|
| Account destinations | `partial` | `partial` | `partial` |
| Profile | `partial` | `partial` | `partial` |
| Personal preferences | `partial` | `partial` | `partial` |
| Security | `partial` | `partial` | `partial` |
| Billing | `not_tested` | `partial` | `partial` |

No capability is described as having “multiplatform parity.” Security now has
desktop and Expo renderers, but successful provider operations, structured
journey evidence, and native device runs are still outstanding. Profile is
implemented on desktop and mobile web; its native renderer and operations are
implemented at component level and exported for both OS targets, while native
device acceptance remains outstanding.
Preferences sync is database-verified and desktop/mobile-web renderers are
complete at E3 component evidence. Native Preferences rendering and operation
tests are implemented, but the task remains in progress because the required
per-OS persistence/restart/navigation/touch/locale evidence is unavailable in
this checkout; Billing remains on its separate provider gate.

## `07-build` evidence — 2026-10-11

| Task | Implemented evidence | Validation | Scope boundary |
|---|---|---|---|
| `ACCOUNT-NAV-CONTRACT` | `packages/contracts/src/account-navigation.ts` defines stable IDs, protected canonical `/app/account/*` paths and replace-style legacy redirects; contract test covers all four destinations | Focused contract test and root typecheck passed | Account Profile, Preferences and Security consume the shared destinations on desktop; Billing and native Profile/Preferences remain incomplete |
| `ACCOUNT-AUTH-HARDEN` | Mobile Auth uses Expo SecureStore for native Metro targets and browser storage for web; role and permission data are resolved from active server memberships; password/reset/sign-out failures are surfaced; stale in-memory tenant context is cleared before identity membership resolution | 12 focused Auth tests, mobile TypeScript, Expo Doctor, Web/iOS/Android Metro export and boundary validation passed | No device runtime was started; MFA/session inventory and Account Security renderers remain blocked/unimplemented |
| `ACCOUNT-SECURITY-DESKTOP` | Desktop Security renderer at `/app/account/security`; AuthPort-backed password, email-change, TOTP enrollment/verification/removal, step-up and other-session operations; canonical route and legacy redirect wired | 9 focused component tests; root typecheck; route smoke validation passed | Task remains `ready` in the approved ledger: the worktree is modified and E4 evidence has not been committed/structured against a clean commit; no successful live provider mutation was attempted |
| `ACCOUNT-SECURITY-NATIVE` | Expo Security screen and account-menu route implemented for mobile web, iOS and Android. Vitest uses isolated React Native test shims; production Metro behavior is unchanged. | 7 focused mobile screen operation/error tests; mobile TypeScript; Expo Doctor 21/21; Expo Web/iOS/Android export passed; Expo Web navigation/refresh/redirect/back and invalid-email journey checked | Task remains `ready`; no iOS simulator or Android device runtime was available, and no structured native device evidence exists |
| `ACCOUNT-PROFILE-FILES` | Shared private-user Files port/adapters and Auth/Profile orchestration; self-owned `platform_files`, versions and upload sessions; five-minute signed previews; upload validation, compensating orphan discard and policy-aligned soft deletion | 11 focused adapter tests and 16 pgTAP RLS tests passed; desktop, responsive web and Expo native Profile consume the adapters; mobile boundary/contract validators, Expo Doctor 21/21 and Web/iOS/Android bundle export passed. RLS ran on an isolated temporary stack; existing local DB was untouched | Adapter/database task complete. Native device runtime and picker-permission behavior still require iOS/Android acceptance |
| `ACCOUNT-PROFILE-DESKTOP` | Authenticated desktop Profile at `/app/account/profile`; Auth/Files-backed name/avatar operations and protected legacy replace redirect | 10 focused Profile operation/state tests and 3 route/history tests pass; root typecheck and localization validation pass | No authenticated browser mutation; protected route redirects to login when session is absent |
| `ACCOUNT-PROFILE-MOBILE-WEB` | Same Profile semantics at mobile widths; 44px minimum touch targets, keyboard-visible focus, logical inline-end avatar control and confirmation actions | 10 Profile operation/state tests, including pending upload, RTL and touch-target assertions; 3 route/history tests and route manifest validation pass | Uses the responsive web renderer, not the Expo native screen; no signed-in browser visual journey was available |
| `ACCOUNT-PREFS-DESKTOP` | Personal Preferences renderer at `/app/account/settings`; canonical legacy redirect; Topbar and command-menu destinations; shared sync adapter for language, timezone and personal notifications; device-local appearance; organization `/app/settings` remains separate | 12 focused component operation/state tests, 3 direct/legacy/organization route tests; 8 sync tests and 8 contract tests; root typecheck, i18n check, ledger/contract validators and 10-route smoke manifest pass; regression test covers global Topbar language persistence | Authenticated browser confirmed Español survives route reload; global selector persistence is component-tested but not live-clicked because the control is hidden at the browser canvas viewport; updated 18-assertion pgTAP suite remains unrun without Docker |
| `ACCOUNT-PREFS-NATIVE` | Expo Preferences screen is connected from the account sheet and More screen; language/timezone/notification operations use the shared Preferences adapter; appearance stays device-local; six locale codes and RTL are supported; Expo uses automatic system appearance with adaptive native tokens for iOS/Android | Account suite: 17 files/115 tests; focused native Preferences, route, theme and i18n tests: 13; root/mobile typechecks; Expo Doctor 21/21; Web/iOS/Android bundles; mobile boundary, localization, ledger, traceability and diff checks pass | Both bundles compile, but no iOS simulator or Android device is available (`xcrun simctl` and `adb` are missing). Restart recovery, identity binding, safe-area/system-back, touch and locale behavior still need on-device evidence; task remains `in_progress` |

Desktop runtime checks confirmed the protected deep link, refresh behavior and
replace-redirect from `/account/security`. A temporary local session produced
the expected expired-session error without exposing fabricated state. Expo
Web was opened with the development account provided by the app, and the
Security status came from the authenticated provider session. Only invalid
email validation was exercised; no password, email, MFA or session mutation
was submitted. Expo bundle exports prove buildability, not device behavior.

The first `test:multiplatform-contracts` attempt exposed a Vite parse failure
because the shared mobile storage wrapper statically imported React Native
modules. Storage now uses Metro's `.native.ts` resolution for native secure
storage while the platform-neutral `.ts` wrapper contains only the web path.
The failing test passed after that change. This fix preserves browser
behavior and avoids loading React Native from root Vite tests.

## Visual component audit for `01-visual-design`

| View/zone | Desktop/mobile web source-backed component | Current template evidence / prohibited reuse | iOS/Android evidence |
|---|---|---|---|
| Shell, page heading, content width | `AppShell`, `Topbar`, `PageHeader`, `AppBreadcrumbs`, `PageContainer` | `/account/*` legacy paths are replaced by canonical `/app/account/*` LoopDev routes using the shared shell. Billing has no registered page route. | Expo/React Native has its own navigation/rendering; Profile, Preferences and Security destinations are connected; device behavior is unverified |
| Profile | `PageContainer`, `PageHeader`, `DataCard`, `Avatar`, `Input`, `Label`, `Button`, `ConfirmDialog` | Authenticated Auth/Files adapters, mobile-web 44px controls and RTL positioning; template mock defaults and local-storage upload are not reused | `MobileProfileScreen` uses Auth/Files adapters for name/avatar operations; signed preview/picker/remove tests pass; device runtime is unverified |
| Preferences | `DataCard`, `Select`, `Switch` | Desktop renderer uses authenticated shared Preferences operations; template mock defaults/workspace fields and old notification local values are not imported | `MobilePreferencesScreen` uses the shared Preferences adapter and device-local appearance; component/route tests pass, with OS acceptance pending |
| Security | `DataCard`, `Input`, `Button`, `Dialog`, `ConfirmDialog`, shared feedback components | Existing template Security's TOTP/session/device controls mutate mock/local state; they are evidence only for presentation, not behavior | Native Security destination and AuthPort operations are implemented and component-tested; provider mutation/device acceptance remains unverified |
| Billing | `DataCard`, empty-state component, shared table/button/confirmation primitives when authorized data exists | Existing template Billing seeds plans, prices, payment methods, tax/address and invoices; none are reused or shown as real data | No native Billing destination or operation |
| Avatar upload | Shared private-user Files/Profile adapter defines validation, ownership, signed preview and cleanup; desktop and native pickers call it | `FilePicker`/`FilesDropzone` remain presentation evidence only and are not wired to the approved private Files adapter | Expo image-library selection, signed preview, upload, removal and cleanup are component-tested; device permission behavior remains unverified |
| Native screens/controls | N/A — keep the web and native renderers distinct | Web controls do not import into React Native | `MobilePageContainer`, `MobilePageHeader`, `MobileCard`, `MobileInput`, `MobileSelectSheet`, `MobileButton`, `MobileAvatar`, `MobileEmptyState`, `MobileLoadingState` and `MobileConfirmDialog` render Profile, Preferences and Security; Billing remains disabled/non-routable |
| Native tokens | N/A — web semantic tokens are in `src/index.css` | Rivera web `--primary: hsl(234 80% 58%)` | Preserve current `apps/mobile/theme/tokens.ts` per user's decision; native token difference is expected and not a visual blocker |
| Native avatar image | N/A — `UserAvatar` supports web identity rendering | Web `UserAvatar` and native `MobileAvatar` display profile image/fallback; shared private upload adapter is consumed by both renderers | `MobileAvatar` displays signed previews; library picker and Profile/Files adapter operations pass component tests; native device verification remains outstanding |

The web component crosswalk is intentionally anchored in direct route
consumers rather than screenshots or inventory names alone. The UI reference
lists `SettingsCard` as reusable, while the account-template pages examined
actually import `DataCard`; the wireframes therefore use `DataCard`. The user
confirmed the native renderer keeps its own component/token system; source
verified native primitives and per-view compositions are recorded in
`native-compositions.md`. Operation evidence and remaining gaps are recorded
in the matrices above and below.

## Validation and supplemental source audit

| Command | Result | Evidence | Notes |
|---|---|---|---|
| `npm run validate:delivery-ledgers` | `PASS` | `Delivery ledger validation passed: 7 ledger(s) checked.` | Attempt 1 first reported `DISC-LEDGER-001` for an incorrect `.ts` reference; the path was corrected to the existing `.tsx` file, the same run resumed at attempt 2, and validation passed |
| `npm run delivery:validate` | `PASS` | `Module run validation passed: 90 checkpoint file(s) checked (36 archived legacy record(s)).` | Revalidated after visual approval and domain checkpoint update |
| `npm run validate:multiplatform` | `PASS` | `Multiplatform delivery validation passed.` | Operation matrix statuses and section boundary conform to the validator |
| Profile component and route tests | `PASS` | 10 desktop/mobile-web operation/state tests, 3 web route tests, 7 native operation/state tests and 2 native destination tests pass | Native OS device acceptance and authenticated browser mutation remain unverified |
| Browser route check | `PARTIAL` | `http://127.0.0.1:8080/app/account/profile` returned HTTP 200 for the Vite app shell; authenticated interaction was not tested | Component tests cover the authenticated surface; do not claim live provider mutation evidence |
| `01-visual-design` source/component audit | Approved | See `visual-design.md` §1.1/§4, `native-compositions.md` and this component matrix | User approved the visual package on 2026-10-10; native component/token decision is resolved |

## Native Profile increment — 2026-10-11

`MobileProfileScreen` now consumes the shared Auth/Profile/Private Files
adapters for reading the current user, editing the display name, selecting and
uploading an avatar, displaying its signed preview and confirming removal.
Account-sheet and More-screen navigation reach the canonical native Profile
destination. The shared action semantics are implemented for both Expo OS
targets and recorded as `implemented` in `delivery-ledger.json`; renderer and
overall operation parity remain `partial` until OS-level acceptance is
captured.

| Surface | Evidence | Status / remaining gap |
|---|---|---|
| iOS | 7 focused Profile operation/state tests; Expo iOS bundle export; shared React Native screen and image-library adapter | `PARTIAL` — no simulator/device run; safe area, OS back, keyboard, touch and picker permission behavior remain unverified |
| Android | 7 focused Profile operation/state tests; Expo Android bundle export; shared React Native screen and image-library adapter | `PARTIAL` — no emulator/device run; system back, insets, keyboard, touch and picker permission behavior remain unverified |
| Navigation | Account-sheet and More-screen tests cover Profile destination; Expo App route and return-path code are present | `PARTIAL` — runtime navigation/deep-link and system-back behavior still require device exercise |
| Session/accessibility lifecycle | Screen observes Auth session changes and clears cached preview when identity changes; accessible labels/alerts are component-tested | `PARTIAL` — identity switching, VoiceOver/TalkBack, focus/keyboard and touch sizing not tested on device |

## Preferences locale initialization correction — 2026-10-23

Desktop and shared-adapter regression tests cover using the current app locale
only for an uninitialized server preference, while preserving an explicitly
saved language. The authenticated global Topbar language selector now persists
its choice through the same shared Preferences mutation before changing app
i18n, keeping the route and global selector in sync. The corrective migration
`20261023100000_platform_user_preferences_initial_language.sql` was applied to
the linked `loopdev-platform-dev` project (not staging). The authenticated
`/app/account/settings` route was switched to Español and remained in Spanish
after reload. Because the browser had already persisted English from the
previous behavior, the initial Spanish-locale seed path was not reproduced
end-to-end with a clean browser/account. The updated pgTAP suite was not run:
local Supabase still requires Docker. iOS/Android device acceptance remains
deferred as directed.

## CI correction checkpoint — 2026-10-23

The Account CI correction is committed as
`ef85eb13e8e0db084f390b27749729f8f20773d3` on
`feature/platform-account-pages`. The desktop Account Settings route returned
HTTP 200 at `http://127.0.0.1:8080/app/account/settings`. The mobile package
installs cleanly, Expo Doctor passes 21/21 checks, mobile TypeScript passes and
the Expo Web bundle exports. These are build and component-test results only;
they do not establish iOS/Android device behavior or operation parity. The
user's device-test deferral and the existing native acceptance gaps remain
unchanged.

The follow-up to that checkpoint is committed as
`bde345bb834a5fe14861f64ccb6df9e5cea324d2`. npm 10.9.4 now completes a clean
mobile install from the lockfile, and the code-quality workflow installs
mobile dependencies before root typecheck. Local tests, lint, typechecks,
Expo Doctor and Expo Web export pass. GitHub Actions run `40023190783` passed
on PR head `a9ecf9b5bac1ac6f2d9d7218e031da753153b503`; this does not change
native device acceptance status.
