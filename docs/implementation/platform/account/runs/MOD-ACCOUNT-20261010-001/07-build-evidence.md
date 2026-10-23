# Phase 07 — Build

## Identity

| Field | Value |
|---|---|
| Run ID | `MOD-ACCOUNT-20261010-001` |
| Span ID | `MOD-ACCOUNT-20261010-001:07-build` |
| Skill | `module-build` |
| Parent phase | `06-plan` |
| Track | `tracks/active/platform/2026-10-11-platform-account-pages.md` |
| Issue | [#33](https://github.com/minoveaz/loopdev-v2/issues/33) |
| Status | `running; native Profile and Preferences renderers have component evidence, iOS/Android runtime acceptance pending` |

## Objective and scope

This build record is chronological: earlier status statements below describe
the state at the time they were recorded and are superseded by later dated
increments in this file.

The approved ledger contains completed, ready and blocked work across Account.
Profile Files, desktop Profile, responsive mobile-web Profile and the shared
Preferences contract are complete. Preferences sync has shared web/mobile
adapters, an identity-scoped durable queue and a Supabase migration; focused
unit and isolated pgTAP tests pass. `ACCOUNT-PREFS-SYNC` and
`ACCOUNT-PREFS-DESKTOP` are complete in the ledger. The mobile-web Preferences
renderer is implemented; native Preferences device acceptance is still
incomplete.
Both Security renderer tasks remain ready. The desktop authenticated,
read-only route journey is now observed, but full operation-level E4 evidence
is not attributed to a clean commit and native device runtime evidence remains
unavailable. Operation parity is not claimed.

## Environment

| Field | Value |
|---|---|
| Repository | `minoveaz/loopdev-v2` |
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Checkout type | In-place branch checkout |
| Branch / base | `feature/platform-account-pages` / `develop` |
| HEAD | `af5e511506339ef1f96e85e9248fe0feee427516` |
| Working tree | Modified; existing plan-phase changes were preserved |
| Web runtime URL | `http://127.0.0.1:8080/app/account/profile` (current repository Vite process; HTTP 200 app shell, signed-in interaction not tested) |
| Expo Web runtime URL | Not running in this validation; Web, iOS and Android bundles exported |
| Expo export paths | `/tmp/loopdev-account-profile-final-export-20261011` (Web, iOS and Android) |

Expo export output is build evidence only, not device runtime evidence. The
Vite process on port 8080 was verified as this repository's process; port 5173
was not used as current evidence because it belongs to a different checkout.

## Completed tasks

| Task | Evidence and outcome |
|---|---|
| `ACCOUNT-NAV-CONTRACT` | Added stable shared IDs for Profile, Account Settings, Security and Billing; canonical authenticated `/app/account/*` paths; explicit legacy replace redirects. Focused contract coverage checks all destination IDs, routes and redirect semantics. |
| `ACCOUNT-AUTH-HARDEN` | Native Metro targets resolve a SecureStore-backed adapter; web uses browser storage without a memory credential fallback. Mobile Auth returns provider outcomes for password update, reset and sign-out, resolves active memberships/permissions from Supabase, rejects unknown role mappings, and clears old in-memory tenant context before loading a new identity. Focused tests cover provider errors, storage errors, no-membership access, unknown roles, restoration errors and stale-context clearing. |
| `ACCOUNT-PROFILE-CONTRACT` | Added a shared update input and opaque `loopdev-file://<uuid>` avatar reference; the authenticated user's canonical `full_name`/`avatar_url` metadata is updated with input validation, stale-version conflict detection and provider error propagation. Web and mobile adapters map only private references into `PlatformUser.avatarUrl`; mobile notifies `USER_UPDATED`. Files upload, authorization and signed-URL resolution remain a separate blocked task. |
| `ACCOUNT-AUTH-CONTRACT` | AuthPort now exposes provider-backed security status, email-change request, password change, TOTP enrollment/verification/removal and other-session sign-out. Web/mobile operations are bound to the current provider user; Supabase step-up errors map to `AUTH_REAUTH_REQUIRED`, pending email is never shown as active, and only TOTP factors are surfaced. |
| `ACCOUNT-AUTH-SESSIONS` | Desktop and mobile adapters use Supabase `signOut({ scope: "others" })`, preserve the active session and surface provider errors; no device inventory or Auth-table writes are added. |

## Security renderer implementation (acceptance still open)

| Task | Code delivered | Runtime and operation evidence | Remaining gate |
|---|---|---|---|
| `ACCOUNT-SECURITY-DESKTOP` | `Security.tsx` renders provider-owned status and wires password change, email-change request, TOTP lifecycle, step-up and sign-out-other-sessions through AuthPort. `/app/account/security` is protected; the legacy path redirects with replace semantics; Topbar points to the canonical route. | 9 focused component tests passed. The prior route/refresh/legacy checks used `http://127.0.0.1:5173`; an authenticated deep link and reload were observed at `http://127.0.0.1:8080` on 2026-10-11. | No live provider mutation was attempted. The task remains `ready`: full operation-level E4 evidence is not structured against a clean commit. |
| `ACCOUNT-SECURITY-NATIVE` | `MobileSecurityScreen` and account-sheet navigation are implemented for Expo Web/iOS/Android, using shared AuthPort operations and existing mobile UI primitives. Root Vitest maps React Native imports to isolated test shims; Expo production resolution is unchanged. | 7 focused mobile screen operation/error tests passed. Expo Web account navigation, status read, refresh, legacy redirect, back behavior and invalid-email rejection were checked at `http://localhost:8081`. No account-changing operation was submitted. All three Expo bundles exported. | No iOS simulator or Android device was available; bundle exports do not count as device runtime evidence. The task remains `ready`. |

The TOTP enrollment secret remains transient screen state, pending email is
shown only after a provider result, and the interface does not fabricate a
device/session inventory. Successful and error provider outcomes are covered
by desktop and mobile component tests. Structured E4/E5 evidence remains
outstanding.

### Desktop Security check — 2026-10-11

| Command or runtime check | Result |
|---|---|
| `npm run test -- src/test/platform/account/security-page.test.tsx src/test/platform/account/mobile-security-page.test.tsx src/test/platform/account/preferences-routing.test.tsx` | Passed: 3 files, 21 tests |
| `npm run typecheck` | Passed |
| `npm run smoke:routes` | Passed: 10 desktop and 6 mobile routes |
| Browser: `http://127.0.0.1:8080/app/account/security` | Protected route redirected to `/pages/login`; authenticated provider state was not available |

No password, email, MFA or session operation was submitted. This verifies
route protection and automated component behavior only; it does not satisfy
`ACCOUNT-SECURITY-DESKTOP`'s E4 authenticated journey criteria. The task
remains `ready`.

### Authenticated desktop Security read-only journey — 2026-10-11

| Check | Observed result |
|---|---|
| Direct authenticated route | `http://127.0.0.1:8080/app/account/security` loaded without redirecting to login |
| Provider-owned status | The page displayed a verified email state and reported that TOTP was not enabled |
| Refresh | Reloading the protected route retained the authenticated page and provider status |
| Visual inspection | Security cards and controls rendered in the LoopDev shell; mutation forms remained untouched |
| Mutations | None. Password, email, MFA and other-session actions were not submitted |

This is a read-only runtime observation, not complete operation-level E4
acceptance. The checkout remains modified, so no structured delivery-evidence
record is attributed to `HEAD`; the Security desktop task remains `ready`.

## Validation evidence

| Command | Result |
|---|---|
| `npm run test -- src/test/platform/account/navigation-contract.test.ts src/test/platform/account/mobile-auth.test.ts` | Passed: 13 tests |
| `npm run test:multiplatform-contracts` | Passed: 10 tests |
| `npm run typecheck` | Passed |
| `npm run validate:mobile-boundaries && npm run validate:contracts && npm run validate:multiplatform` | Passed: all three validators |
| `cd apps/mobile && npx tsc --noEmit` | Passed |
| `npm run test -- src/test/platform/account/profile-contract.test.ts src/test/platform/account/mobile-auth.test.ts src/test/platform/auth-port.test.ts` | Passed: 3 files, 23 tests |
| `npm run typecheck && cd apps/mobile && npx tsc --noEmit` | Passed |
| `npm run validate:delivery-ledgers` | Passed: 7 ledgers checked |
| `git diff --check` | Passed |
| `npm run test -- src/test/platform/account/auth-security-contract.test.ts src/test/platform/account/mobile-auth.test.ts src/test/platform/auth-port.test.ts` | Passed: 3 files, 30 tests |
| `npm run typecheck && cd apps/mobile && npx tsc --noEmit` | Passed |
| `npm run validate:contracts && npm run validate:mobile-boundaries` | Passed: both validators |
| `cd apps/mobile && npx expo-doctor` | Passed: 21/21 checks |
| `cd apps/mobile && npx expo export --platform web --output-dir /tmp/loopdev-account-build-07-20261011` | Passed: Web bundle exported |
| `cd apps/mobile && npx expo export --platform all --output-dir /tmp/loopdev-account-build-07-all-20261011` | Passed: Web, Android and iOS bundles exported |
| `npm run test -- src/test/platform/account/security-page.test.tsx` | Passed: 1 file, 9 tests |
| `npm run typecheck` | Passed after Security routes and desktop renderer |
| `cd apps/mobile && npx tsc --noEmit && npx expo-doctor` | Passed: TypeScript and 21/21 Expo checks |
| `npm run smoke:routes && npm run validate:mobile-boundaries` | Passed: 6 desktop and 6 mobile routes; mobile boundary validation passed |
| `cd apps/mobile && npx expo export --platform all --output-dir /tmp/loopdev-account-security-final-export` | Passed: Web, iOS and Android bundles exported |
| `npm run test -- src/test/platform/account/security-page.test.tsx src/test/platform/account/mobile-security-page.test.tsx` | Passed: 2 files, 16 tests (9 desktop, 7 mobile) |
| `npm run validate:delivery-ledgers` | Passed: 7 ledgers checked after Security file/evidence references were recorded; approved task statuses remain `ready` |
| `npm run validate:module-runs` | Passed: 95 checkpoint files checked (36 archived legacy records) |
| `npm run validate:delivery-evidence` | Passed: 0 structured evidence files checked; E4 evidence remains outstanding, so Security tasks remain `ready` |
| `git diff --check` | Passed after implementation and evidence edits |
| `npm run test:delivery` | Passed: 27 delivery workflow regression tests |
| `npm run validate:delivery-ledgers && npm run validate:module-runs && npm run validate:contracts && npm run validate:mobile-boundaries` | Passed: all four validators |
| `git diff --check` | Passed |

The first `npm run test:multiplatform-contracts` attempt failed because the
platform-neutral storage wrapper statically imported React Native and Vite
could not parse `import typeof` from the nested React Native package. The
native implementation was moved behind Metro's `.native.ts` resolution;
the root wrapper now imports no native package. The same test passed after
this correction.

## Acceptance and remaining scope

- `ACCOUNT-NAV-CONTRACT`: `PASS`; shared route meaning is defined. Security
  and Profile/Preferences destinations consume it on desktop/web and Expo;
  Billing remains disabled and non-routable.
- `ACCOUNT-AUTH-HARDEN`: `PASS` for the mobile adapter and native storage
  boundary. The provider session can remain persisted if membership loading
  fails; the adapter surfaces the error and does not grant a tenant context.
  Recovery should be retried or explicitly signed out.
- Mobile native bundles were produced, but no iOS/Android device session or
  runtime URL was used. Do not claim device/runtime or Account operation
  parity.
- Profile Files, desktop and mobile-web renderers are complete; the native
  Profile renderer and operations are implemented, with device acceptance
  still outstanding.
- Security desktop and native renderer implementation is present, but the
  corresponding approved ledger tasks remain `ready` until acceptance evidence
  is complete. No clean-commit structured E4 evidence or iOS/Android device
  run is available.
- Native Preferences component operations are implemented, but iOS/Android
  device acceptance remains outstanding; Billing remains blocked on its
  provider/commercial decision. `07-build` remains open and cannot hand off to
  `08-verify`.

## Decisions, failures and handoff

- Decisions: Expo supports light, dark and system appearance with device-local
  persistence, as approved; Metro platform-specific file resolution preserves
  the approved native SecureStore requirement and avoids loading React Native
  in root Vite tests.
- Remaining blockers: native Profile and Preferences OS-device acceptance and
  Billing provider/commercial decisions still block their dependent work.
  Automatic queue backoff/cross-tab coordination is residual work. The
  TOTP-only MFA choice is resolved.
- Likely origin: `06-plan` deliberately retained those gates; this is a
  pending external handoff, not a build defect.
- Resolved validation failure: the initial multiplatform contract test could
  not parse a static React Native dependency; platform-specific resolution
  corrected it and the rerun passed.
- User-approved scope change: security session management is limited to
  provider-backed sign-out of all other sessions. Do not show device inventory
  or individual revoke actions. The shared AuthPort and desktop/mobile
  adapters expose `signOutOtherSessions`; the current session remains active.
  Supabase errors are surfaced, and local-development mode explicitly reports
  the provider-only operation as unsupported.
- `npm run test -- src/test/platform/account/mobile-auth.test.ts src/test/platform/auth-port.test.ts`
  — passed, 19 tests.
- `npm run typecheck` — passed.
- `cd apps/mobile && npx tsc --noEmit` — passed.
- `ACCOUNT-PROFILE-CONTRACT` — passed: 23 focused tests across web/mobile/auth
  contracts, web and mobile typechecks, delivery-ledger validation, and
  whitespace checks. A first focused run exposed Vite's lack of `@contracts`
  alias resolution for a runtime helper import; the adapter and test now use
  the direct shared contract module path and the rerun passed.
- `ACCOUNT-AUTH-CONTRACT` and `ACCOUNT-AUTH-SESSIONS` — passed: 30 tests,
  web/mobile typechecks, contract and mobile-boundary validators. The user
  confirmed TOTP-only MFA; SMS is excluded and provider AAL policy remains
  authoritative.
- Next handoff at this checkpoint: continue only with ledger-ready tasks.
  Native Profile and Preferences OS-device acceptance remain outstanding.
  This handoff predates the native Profile implementation recorded below.
  Preserve the Security
  implementation, complete its structured
  desktop/mobile-web journeys and verify iOS/Android on devices when available.
  Keep both Security tasks `ready` until their evidence gates are satisfied;
  continue `07-build` only for ledger
  tasks that become ready after their dependencies/decisions are resolved.
  Do not claim build completion or operation parity.

## Profile Files increment — 2026-10-11

The user approved reusing Platform Files for private user-owned avatars:
`PlatformUser.avatarUrl` remains the canonical opaque `loopdev-file://<uuid>`
reference; display URLs are signed for five minutes and never persisted. The
avatar is not organization-owned, and no Account-specific storage model or
offline upload queue was introduced.

| Field | Value |
|---|---|
| Repository / checkout | `/Users/minoveaz/.copilot/repos/loopdev-v2`, in-place branch |
| Branch / base / HEAD | `feature/platform-account-pages` / `develop` / `af5e511506339ef1f96e85e9248fe0feee427516` |
| Working tree | Modified; pre-existing and current changes preserved |
| Runtime | No web/mobile runtime started for this E2 adapter increment; no runtime URL/port |
| Remote migration at this Profile-Files checkpoint | Not deployed; no remote database was modified at that point |

`ACCOUNT-PROFILE-FILES` now has a shared Files port and Supabase adapter used
by desktop and Expo adapters. Ownership is derived from the active Supabase
session; the database creates the upload-session UUID used in the
`users/<user-id>/avatars/<file-id>` path. Upload validates JPEG/PNG/WebP
signatures and the 5 MB limit, creates version/session metadata, signs previews
for 300 seconds, soft-deletes normal removals, and physically removes an
unassociated new object on Auth update failure. Cleanup failures are returned
explicitly. The Profile adapter updates only canonical `avatarUrl`, removes a
previous asset only after Auth confirms the replacement, and exposes failed
cleanup state.

| Command | Result |
|---|---|
| `npm run test -- src/test/platform/account/profile-adapter.test.ts` | Passed: 1 file, 11 tests covering validation, owner scope, upload cleanup, signed preview, soft deletion, orphan discard and Auth/profile compensation |
| `npm run typecheck` | Passed |
| `cd apps/mobile && npx tsc --noEmit` | Passed |
| `npm run validate:mobile-boundaries && npm run validate:contracts && npm run validate:multiplatform` | Passed: all three validators |
| `cd apps/mobile && npx expo-doctor` | Passed: 21/21 checks |
| `cd apps/mobile && npx expo export --platform all --output-dir /tmp/loopdev-private-avatar-export-final-20261011` | Passed: Web, Android and iOS bundles exported; this is build evidence, not device runtime evidence |
| `npx supabase test db supabase/tests/database/012_platform_private_user_files.sql --workdir /tmp/loopdev-private-files-test-20261011` | Passed: 16 pgTAP tests on an isolated temporary Supabase stack initialized from the repository migrations; the existing local database was not modified |

Changed implementation artifacts: `packages/contracts/src/private-user-files.ts`,
`packages/contracts/src/private-user-files-supabase.ts`,
`packages/contracts/src/profile-avatar-adapter.ts`,
`src/loopdev/domains/files/adapter/private-user-files-supabase.ts`,
`src/loopdev/domains/platform/adapter/profile-avatar.ts`,
`apps/mobile/adapters/private-user-files.ts`,
`apps/mobile/adapters/profile-avatar.ts`,
`src/test/platform/account/profile-adapter.test.ts`,
`supabase/migrations/20261011100000_platform_private_user_files.sql` and
`supabase/tests/database/012_platform_private_user_files.sql`.

**`ACCOUNT-PROFILE-FILES` acceptance is complete** for the shared adapter and
database policy scope. Its RLS test passed on a clean isolated local Supabase
stack; no remote migration was deployed, and the existing local database was
left unchanged. Desktop and responsive mobile-web Profile renderers consumed
the adapter at this checkpoint. Native Profile implementation and device
acceptance status are updated in the later dated increment below.

## Profile desktop renderer — 2026-10-11

Implemented `ACCOUNT-PROFILE-DESKTOP` at `/app/account/profile` using the
canonical Auth profile and private Files adapters. The page reads only the
authenticated user's profile, keeps email read-only, updates only the
allowlisted display name, uploads through Files, resolves short-lived signed
previews, and confirms avatar removal. Version conflicts preserve unsaved
input and offer a reload; missing sessions, load failures, upload errors and
previous-file cleanup failures remain visible. The old Rivera mock/local
storage Profile is no longer reachable; `/account/profile` replace-redirects
to the protected canonical route. Topbar, command menu and app navigation now
target the canonical destination.

| Command/check | Result |
|---|---|
| `npm run test -- src/test/platform/account/profile-page.test.tsx` | Passed: 10 operation/state tests |
| `npm run test -- src/test/platform/account/profile-routing.test.tsx` | Passed: 3 direct/legacy/back-history route tests |
| `npm run typecheck` | Passed |
| `npm run i18n:check` | Passed |
| `npm run validate:mobile-boundaries && npm run validate:contracts && npm run validate:multiplatform` | Passed: all three validators |
| Browser: `http://127.0.0.1:5173/app/account/profile` | Protected route redirected the unauthenticated browser to `/pages/login`; a logged-in browser journey was unavailable |

The Profile copy is localized in all six web locales. Ten component tests
cover authenticated read, loading/retry, missing-session access, name save,
version conflict/reload, signed avatar preview, removal cleanup warning and
pending upload, mobile target/focus/RTL behavior and file validation failure.
No successful live Auth/Files mutation was attempted.
`ACCOUNT-PROFILE-DESKTOP` and `ACCOUNT-PROFILE-MOBILE-WEB` are complete in the
ledger. Native Profile status is updated in the later dated increment below;
no multiplatform operation parity or authenticated browser mutation is
claimed.

## Profile mobile-web adaptation — 2026-10-11

The responsive mobile-web route reuses the desktop Profile page and shared
Auth/Files semantics; no duplicate mobile data or upload flow was introduced.
Inputs and primary/mobile action targets are at least 44 CSS px high, including
avatar selection/removal, save, conflict reload and the removal confirmation.
The avatar trigger uses logical inline-end positioning, and actions remain
native keyboard-focusable controls with visible focus rings. The file input is
programmatically opened by the visible, labelled button and removed from the
tab order to avoid a visually hidden focus stop.

| Command/check | Result |
|---|---|
| `npm run test -- src/test/platform/account/profile-page.test.tsx src/test/platform/account/profile-routing.test.tsx` | Passed: 2 files, 13 tests (10 Profile operation/state cases and 3 route/history cases) |
| `npm run typecheck` | Passed |
| `npm run i18n:check` | Passed |
| `npm run smoke:routes` | Passed: route manifest registration; runtime route evidence is stated separately |
| Browser: `http://127.0.0.1:5173/app/account/profile` | Redirected to login because the browser had no authenticated session; no signed-in visual or provider mutation was available |

The RTL component case verifies logical inline positioning and mobile target
classes with a `dir="rtl"` container. Route tests cover direct canonical entry,
protected legacy replacement and browser-back history behavior. Direct entry
models refresh/deep-link routing; an authenticated hard-refresh visual journey
was unavailable. `ACCOUNT-PROFILE-MOBILE-WEB` is complete at E3; this does not
establish iOS/Android renderer or runtime parity.

## Account Preferences contract — 2026-10-11

The user authorized continuing personal Account Settings and confirmed these
sync rules: queued changes stay bound to their original account across
sign-out/restart and are replayed only after that same account reauthenticates;
legacy local notification values are not imported; concurrent patches to
different fields may merge, while a collision on the same field must surface a
conflict. Appearance remains device-local per the approved design.

Added a shared contract for the six web-supported languages, validated IANA
timezones, the existing notification channel/type shape, stable preference
operation IDs, versioned/idempotent patches, sync/mutation states and explicit
error codes. The notification catalog shape reuses existing product controls;
old local values are not promoted to server truth.

| Command | Result |
|---|---|
| `npm run test -- src/test/platform/account/preferences-contract.test.ts` | Passed: 8 contract validation/merge tests |
| `npm run typecheck` | Passed |
| `npm run validate:contracts` | Passed: 23 contract files checked |
| `npm run validate:delivery-ledgers` | Passed after `ACCOUNT-PREFS-CONTRACT` moved to `done` |

`ACCOUNT-PREFS-CONTRACT` is complete. The Preferences sync increment below
supersedes the earlier sync-blocked handoff.

## Account Preferences sync increment — 2026-10-12

Implemented a shared Preferences sync adapter with Auth-subject verification,
versioned/idempotent RPC mutations, field-path conflict detection, explicit
same-field conflicts, a user-keyed durable web queue and native queue storage
through `mobileAuthStorage`. Pending mutations retain their original user ID
and are not read or replayed for another account. Legacy notification values
are not imported. Added a Supabase migration with owner-only RLS, defaults,
allowlisted validation, idempotency snapshots and pgTAP coverage for owner
isolation, disjoint-field merge and same-field conflict.

| Command | Result |
|---|---|
| `npm run test -- src/test/platform/account/preferences-sync.test.ts` | Passed: 7 adapter/queue tests |
| `npm run test -- src/test/platform/account/preferences-contract.test.ts src/test/platform/account/preferences-sync.test.ts` | Passed: 2 files, 15 tests |
| `npm run typecheck` | Passed |
| `cd apps/mobile && npx tsc --noEmit` | Passed |
| `npm run validate:mobile-boundaries` | Passed |

## Native Profile renderer increment — 2026-10-11

`ACCOUNT-PROFILE-NATIVE` now has a native Expo screen connected from the
account sheet and More screen. The screen reads the authenticated user,
updates the canonical display name, selects and uploads an avatar through
`mobileProfileAvatarAdapter`, displays a signed private-file preview and
confirms avatar removal. Picker options are isolated behind the mobile
image-picker adapter; camera and microphone permissions are disabled.

The task remains `in_progress`. Component tests and bundle exports verify the
shared native implementation compiles and behaves through its mocked
renderer, but do not verify iOS/Android back gestures, safe areas, keyboard,
touch accessibility, system photo-picker permissions or identity changes on
real OS runtimes.

| Command or runtime check | Result |
|---|---|
| `npm run test -- src/test/platform/account` | Passed: 18 files, 128 tests |
| `npm run typecheck && cd apps/mobile && npx tsc --noEmit` | Passed |
| `cd apps/mobile && npx expo-doctor` | Passed: 21/21 checks |
| `cd apps/mobile && npx expo export --platform all --output-dir /tmp/loopdev-account-profile-final-export-20261011` | Passed: Web, iOS and Android bundles exported |
| `npm run validate:mobile-boundaries && npm run validate:delivery-ledgers && npm run validate:module-runs && npm run validate:contracts && npm run i18n:check && npm run smoke:routes && git diff --check` | Passed: all checks |
| `GET http://127.0.0.1:8080/app/account/profile` | Passed: HTTP 200 app shell; authenticated Profile behavior was not exercised |
| `xcrun simctl` / `adb` availability | Not available on this host; device acceptance remains open |

The operation inventory marks native Profile navigation, read, display-name
update and avatar change as implemented because source, operation tests and
both native bundle exports now exist. Overall renderer/operation parity remains
partial; no device parity or task completion is claimed.
| Browser runtime at `http://127.0.0.1:8080/account/billing` and `http://127.0.0.1:8080/app/account/billing` | Passed: both render not-found at the requested URL; neither redirects |
| `npm run validate:contracts` | Passed: 24 contract files checked |
| `git diff --check` | Passed |
| `npx supabase start --workdir /tmp/loopdev-preferences-isolated-20261012 --exclude gotrue,realtime,storage-api,imgproxy,kong,mailpit,postgrest,postgres-meta,studio,edge-runtime,logflare,vector,supavisor` | Passed: fresh isolated PostgreSQL stack applied all repository migrations; only the temporary database service was started |
| `npx supabase db reset --workdir /tmp/loopdev-preferences-isolated-20261012 --no-seed` | Passed: corrected migration reapplied on the isolated database |
| `npx supabase test db supabase/tests/database/013_platform_user_preferences.sql --workdir /tmp/loopdev-preferences-isolated-20261012` | Passed: 12 pgTAP tests for subject ownership, direct-write isolation, idempotency, disjoint-field merge, conflict and validation |

`ACCOUNT-PREFS-SYNC` is `done` with isolated SQL/RLS evidence. The initial
pgTAP run exposed ambiguous PL/pgSQL variable references; the migration was
corrected and all 12 tests then passed. No migration was applied to staging or
production.

### Authorized Dev deployment — 2026-10-11

After explicit user approval and a dry run, applied the three pending
migrations to the repository's authorized Dev project `sukjcsylkljiyvfklxvj`:
the Document Intelligence storage-path policy fix, private user Files support,
and Preferences schema/RPC. Remote migration history now records all three.
`to_regprocedure('public.get_user_preferences()')` returned true, and an
anonymous PostgREST request returned `42501 permission denied for function`
rather than `PGRST202`; this confirms the RPC is in the schema cache and that
anonymous execution remains disallowed. A `pgrst` schema reload notification
was also sent after deployment.

The browser canvas had no authenticated user session and was redirected to
`/pages/login`, so authenticated preference loading was not runtime-verified
here. Refresh the already-authenticated browser session to confirm the
Preferences screen loads. Native device acceptance, automatic retry/backoff
and cross-tab queue coordination remain outstanding.

## Account Preferences desktop renderer — 2026-10-12

Implemented the desktop personal Preferences page at
`/app/account/settings`, keeping organization settings at `/app/settings`.
Topbar and command-menu links use the canonical account destination and
`/account/settings` uses the approved replace redirect. Language and timezone
use the shared Preferences adapter and established Select controls; personal
notification switches use the same versioned mutation contract and synchronize
the existing notification-feed hook only from returned preference values.
Appearance remains device-local. The page renders loading, sign-in, provider
error, pending, offline, conflict and confirmed states, with retry/discard and
explicit conflict choices. All six supported languages include translated UI.

| Command or runtime check | Result |
|---|---|
| `npm run test -- src/test/platform/account/preferences-page.test.tsx src/test/platform/account/preferences-routing.test.tsx src/test/platform/account/preferences-sync.test.ts src/test/platform/account/preferences-contract.test.ts` | Passed: 4 files, 31 tests (12 page, 3 routing, 8 sync, 8 contract) |
| `npm run typecheck` | Passed |
| `npm run i18n:check` | Passed |
| `npm run validate:delivery-ledgers` | Passed: 7 ledgers checked after recording task evidence |
| `npm run validate:contracts` | Passed: 24 contract files, 2 stable IDs |
| `npm run smoke:routes` | Passed: 10 desktop and 6 mobile routes in manifest |
| `git diff --check` | Passed |
| `curl -sS -o /tmp/account-settings-route.html -w '%{http_code} %{url_effective}\n' -L http://127.0.0.1:5173/app/account/settings` | Passed: route served with HTTP 200; protected route redirected to `/pages/login` because no authenticated runtime session was available |

The route suite covers direct canonical entry, legacy replacement and the
separate organization route. Component tests cover remote reads and mutations,
device-local appearance, pending recovery/discard, offline feedback, explicit
conflict resolution, sign-in and provider-error retry. The browser runtime
confirmed the authentication gate, not an authenticated visual mutation.
`ACCOUNT-PREFS-DESKTOP` is `done` at the approved E3 evidence level.
Native OS operation parity is not claimed complete until per-device acceptance
evidence is captured.

## Account Preferences native renderer

Evidence updated 2026-10-12.

Implemented the Expo Preferences destination at `/app/account/settings`,
opened from the account sheet and the More screen. Language, time zone and
personal notifications use the shared authenticated, versioned Preferences
adapter; appearance remains local to this installation and applies light, dark
or system mode. The Expo app now opts into automatic system appearance, uses
adaptive native colors for shared surfaces/text/status tokens, and applies
those tokens to its shell, account surfaces, header, bottom navigation,
navigation drawer, modal, cards, buttons and command palette. The account
screen no longer exposes an independent quick-language toggle. The screen
supports all six contract languages and RTL; settings route handling includes
the native back path. Shared locale JSON is reused as data; the mobile-boundary
validator explicitly permits only those JSON dictionaries, not executable
`src/` modules.

| Command or runtime check | Result |
|---|---|
| `cd apps/mobile && npm ci` | Passed: installed 570 locked packages; npm reported 25 dependency audit advisories (7 moderate, 17 high, 1 critical); no audit-driven dependency changes were made |
| `npm run test -- src/test/platform/account` | Passed: 17 files, 115 tests |
| `npx vitest run src/test/platform/account/mobile-preferences-routing.test.tsx src/test/platform/account/mobile-preferences-page.test.tsx src/test/platform/account/mobile-theme.test.tsx src/test/platform/account/mobile-i18n.test.tsx` | Passed: 4 files, 13 tests |
| `npm run typecheck && cd apps/mobile && npx tsc --noEmit` | Passed |
| `cd apps/mobile && npx expo-doctor` | Passed: 21/21 checks |
| `cd apps/mobile && npx expo export --platform all --output-dir /tmp/loopdev-account-preferences-final-export-20261012` | Passed: Web, iOS and Android bundles exported; bundle export is not device-runtime evidence |
| `npm run validate:mobile-boundaries && npm run i18n:check` | Passed: mobile has no executable `src/` imports; locale review reports no visible-text candidates |
| `node --test scripts/test/delivery-state-machine.test.mjs` | Passed: 24 tests |
| `npm run validate:delivery-ledgers && npm run validate:module-runs` | Passed: 7 delivery ledgers and 95 checkpoint files checked |
| `git diff --check` | Passed |
| `xcrun simctl list devices booted` | Not available: this host has no `simctl` developer tool |
| `adb devices -l` | Not available: `adb` is not installed |

The component suite covers canonical navigation from the account sheet and
More screen; loading, preference reads/mutations, pending/offline/conflict
states; local appearance persistence/system reset; language restoration and
RTL. Type checks and Expo exports verify the shared renderer compiles for
both native targets. They do not prove the ledger's per-OS acceptance:
restart recovery and identity binding on device, safe-area behavior, hardware
back, touch interaction and locale changes still require iOS/Android runtime
journeys. Therefore `ACCOUNT-PREFS-NATIVE` remains `in_progress`; no native
device parity or task completion is claimed.

## Account Billing disabled gate

On 2026-10-11, the user confirmed Billing should not be used yet. The shared
Account destination now marks Billing disabled. It remains visible but
non-interactive in the desktop account menu, desktop sidebar and mobile
account sheet. The command menu also lists it as disabled, while routable
navigation excludes its path.
The Rivera mock Billing route was removed, so direct visits to both billing
paths display not-found without redirecting elsewhere. Billing provider,
commercial and server-authority tasks remain blocked; no Billing operations
were implemented.

| Command | Result |
|---|---|
| `npm run test -- src/test/platform/account/navigation-contract.test.ts src/test/platform/account/preferences-routing.test.tsx src/test/platform/account/mobile-preferences-routing.test.tsx src/test/topbar-system-mode.test.tsx src/test/sidebar-drawer.test.tsx` | Passed: 5 files, 23 tests, including disabled desktop/command-menu/mobile semantics and both direct Billing paths remaining on not-found |
| `npm run typecheck` | Passed |
| `cd apps/mobile && npx tsc --noEmit` | Passed |
| `npm run validate:mobile-boundaries` | Passed |

## Desktop priority and native acceptance deferral — 2026-10-23

The user directed that iOS and Android device tests remain pending for now
while development proceeds on the desktop application. This defers acceptance
work only: native platform scope and operation-parity requirements remain
unchanged, and the native Profile/Preferences tasks remain `in_progress`.
Billing remains disabled and outside active implementation, as confirmed by
the user.

Desktop Security checks run in this checkout:

| Command or runtime check | Result |
|---|---|
| `npm run test -- src/test/platform/account/security-page.test.tsx` | Passed: 1 file, 9 tests |
| `npm run smoke:routes` | Passed: 10 desktop and 6 mobile routes registered; static route validation only |
| `npm run typecheck` | Passed |
| Authenticated browser journey at `http://127.0.0.1:8080/app/account/security` | Security status rendered; reload retained the route; legacy `/account/security` redirected to the canonical route; no account-changing operation was submitted |

`ACCOUNT-SECURITY-DESKTOP` remains `ready`, not `done`: its E4 operation-level
evidence has not been structured and no provider-backed mutation was attempted.
Native device acceptance remains explicitly deferred; do not infer native
parity from exports or component tests.

## Preferences locale initialization correction — 2026-10-23

The user reported that `/app/account/settings` switched to English despite the
application being in Spanish. The cause was the server creating an unchosen
English default and the renderer applying every server language as an explicit
choice. The approved behavior is to initialize the server language from the
current app locale only while no language choice has been initialized; an
explicitly saved server choice remains authoritative.

The shared adapter now passes the current locale to the read RPC, the desktop
and Expo renderers supply their current locale, and a migration adds the
one-time initialization marker plus preservation of explicit language updates.
The user clarified that the global Topbar selector must also drive the Account
Settings page. For authenticated sessions it now persists the selected
language through the shared Preferences adapter before changing the global
i18n locale, so the server read on route remount cannot restore a stale value.
Regression coverage verifies first-read Spanish initialization and Topbar
language persistence. This does not change the user's deferred iOS/Android
device-acceptance decision; only mobile TypeScript was checked.

| Command or runtime check | Result |
|---|---|
| `npm run test -- src/test/platform/account/preferences-page.test.tsx src/test/platform/account/preferences-sync.test.ts` | Passed: 2 files, 24 tests |
| `npm run test -- src/test/topbar-system-mode.test.tsx src/test/platform/account/preferences-page.test.tsx` | Passed: 2 files, 21 tests, including global language persistence |
| `npm run typecheck` | Passed |
| `cd apps/mobile && npx tsc --noEmit` | Passed; no iOS/Android device tests were run |
| `npm run i18n:check` | Passed: no visible-text candidates |
| `npx supabase migration up --linked` | Passed: applied `20261023100000_platform_user_preferences_initial_language.sql` to the linked Dev project; no staging project was selected |
| Authenticated browser: `http://127.0.0.1:8080/app/account/settings` | Passed: selected Español, confirmed preferences were up to date, reloaded the route, and verified it remained in Spanish |
| Local pgTAP | Not run: local Supabase requires Docker, which is unavailable |

The initial browser locale had already been persisted as English by the
previous behavior, so Español was selected once as an explicit account
preference. That choice now survives reload. The fresh, uninitialized Spanish
locale path is covered by the component/adapter regressions, but was not
reproduced end-to-end with a clean user/browser state. The global selector's
write-before-locale behavior is covered by a component test; a live click was
not exercised because the selector is hidden at the browser canvas's narrow
viewport. Do not claim the new SQL suite passed; it has not been run against
an isolated database.

## PR #35 CI corrections — 2026-10-23

Commit `ef85eb13e8e0db084f390b27749729f8f20773d3` corrects the failing
lint, quick-test and mobile-quality checks without including the separate
local CRM/Tasks work. Filename validation still rejects path separators and
ASCII control characters, now without `no-control-regex`; a NUL filename
regression is covered. The mobile locale test expects all six supported
languages. Root Vitest resolves `lucide-react-native` to a test-only icon stub,
so the root test job does not depend on the mobile installation layout. The
mobile Expo SDK was aligned to `~57.0.31` as required by Expo Doctor.

| Command or runtime check | Result |
|---|---|
| `npm test -- src/test/platform/account/profile-adapter.test.ts src/test/mobile/mobile-i18n.test.ts src/test/platform/account/mobile-preferences-routing.test.tsx` | Passed: 3 files, 18 tests |
| `npm run test:quality` | Passed: 96 files, 531 tests |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed |
| `npm run test:multiplatform-contracts` | Passed: 1 file, 10 tests |
| `cd apps/mobile && npm ci` | Passed: 576 packages installed; npm reported 6 audit advisories (5 high, 1 critical), not addressed in this CI repair |
| `cd apps/mobile && npx tsc --noEmit` | Passed |
| `cd apps/mobile && npx expo-doctor` | Passed: 21/21 checks |
| `cd apps/mobile && npx expo export --platform web --output-dir /tmp/loopdev-mobile-web` | Passed: Web bundle exported |
| `npm run validate:mobile-boundaries && npm run validate:contracts && npm run validate:multiplatform && npm run i18n:check && npm run validate:delivery-ledgers && npm run validate:module-runs` | Passed: all six validators |
| `http://127.0.0.1:8080/app/account/settings` | Passed: local route returned HTTP 200 |
| `git diff --cached --check` | Passed before commit |

The run remains open and the PR remains a draft: local checks pass, but the
remote CI rerun must be inspected after publishing this correction. This is
not iOS/Android device acceptance; those tests remain deferred as directed.

## PR #35 CI environment follow-up — 2026-10-23

The GitHub rerun after `90e2670` still failed in two environment-specific
checks. Root typecheck followed test imports into `apps/mobile` although the
code-quality job installed only root dependencies. The mobile install used
npm 10, while the lockfile generated by local npm 11 omitted its required
`@floating-ui/dom@1.8.0` entry. The workflow now installs mobile dependencies
in code-quality and caches both lockfiles; the mobile lockfile was regenerated
with npm 10.9.4. These corrections are committed as
`bde345bb834a5fe14861f64ccb6df9e5cea324d2`.

| Command or check | Result |
|---|---|
| GitHub Actions run `40022170267` after `90e2670` | Failed: root typecheck lacked mobile dependencies; npm 10 rejected the missing `@floating-ui/dom@1.8.0`; component tests and desktop build passed |
| `cd apps/mobile && npx --yes npm@10.9.4 ci` | Passed: clean npm 10 install |
| `npm run test:quality && npm run test:multiplatform-contracts` | Passed: 96 files/531 tests and 1 file/10 tests |
| `npm run lint && npm run typecheck` | Passed with mobile dependencies installed |
| `cd apps/mobile && npx tsc --noEmit && npx expo-doctor && npx expo export --platform web --output-dir /tmp/loopdev-mobile-web` | Passed: mobile types, Expo Doctor 21/21 and Web export |

The corrected commits have not yet been pushed for another GitHub run. Keep
the PR in draft until remote checks and the existing Account verification
gates are satisfied; native device testing remains deferred.
