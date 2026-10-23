# Phase 05 — Synchronization design

## Identity

| Field | Value |
|---|---|
| Run ID | `MOD-ACCOUNT-20261010-001` |
| Span ID | `MOD-ACCOUNT-20261010-001:05-sync` |
| Skill | `sync-design` |
| Parent phase | `04-api` |
| Track | Not created; deferred to `module-plan` |
| Issue(s) | None |
| Status | `completed`; result `partial` because queue, provider and migration policies remain open |

## Objective

Define Account local storage ownership, offline eligibility, mutation states,
retry/conflict behavior, migration and recovery across desktop web, mobile
web, iOS and Android.

## Inputs

- `docs/implementation/platform/account/discovery.md`
- `docs/implementation/platform/account/design.md`
- `docs/implementation/platform/account/domain-model.md`
- `docs/implementation/platform/account/access-design.md`
- `docs/implementation/platform/account/api-contracts.md`
- `docs/implementation/platform/auth/sync-design.md`
- `src/loopdev/domains/settings/adapter/local.ts`
- `src/loopdev/domains/settings/adapter/supabase.ts`
- `src/hooks/use-notification-prefs.tsx`
- `src/hooks/use-theme.tsx`
- `apps/mobile/adapters/offlineQueue.ts`

## Actions

- Separated connectivity, business, entity-sync and mutation state.
- Defined offline rules for Profile, Preferences, appearance, Security and
  Billing.
- Inspected existing local Settings/preferences/theme state and the generic
  mobile mutation queue; treated them as baseline, not proof of safe Account
  sync.
- Defined version conflict resolution, retries, identity/tenant eviction,
  legacy local preference migration and multiplatform recovery tests.

## Outputs

- `docs/implementation/platform/account/sync-design.md`
- `docs/implementation/platform/account/runs/MOD-ACCOUNT-20261010-001/05-sync.json`

## Acceptance criteria

- [x] Connectivity, business, entity sync and mutation states are separate.
- [x] Online/offline behavior is stated for every Account operation.
- [x] Retries, idempotency, version conflict, permission rejection and
  reconciliation are explicit.
- [x] Migration, reload, tenant/identity switch, reinstall and rollback risks
  are recorded.
- [x] Web/native adaptations preserve one semantic sync policy.
- [x] No storage, queue, provider or production code was implemented.

## Validation evidence

| Command or check | Result | Evidence path/link |
|---|---|---|
| Source review | Passed | Auth sync, Settings adapters, current theme/notification hooks and offline queue inspected |
| `npm run delivery:validate` | Passed | 93 checkpoint files checked; 36 archived legacy records |
| `npm run validate:module-runs` | Passed | 93 checkpoint files checked; 36 archived legacy records |
| `npm run validate:multiplatform` | Passed | Multiplatform delivery validation passed |
| `git diff --check` | Passed | No whitespace errors |

## Environment

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Branch | `feature/platform-account-pages` |
| HEAD | `af5e511506339ef1f96e85e9248fe0feee427516` |
| Runtime URL | Not started |
| Runtime port | Not started |

## Decisions, failures and handoff

- Decisions: only user Preferences may queue offline mutations; Profile stays
  an in-memory draft, appearance stays device-local, and Security/Billing
  remain online-only.
- Detected failure: none. The current generic mobile offline queue is not yet
  safe for Account use because its payload store is not intrinsically bound to
  the authenticated subject and assumes web localStorage or process memory;
  this remains an explicit shared capability gap.
- Likely origin: `null` — no Account queue was implemented.
- Next handoff: `06-plan`; include Platform queue/storage hardening, provider
  capability validation, migration and cross-platform recovery tasks, while
  preserving unresolved owner decisions.
- State: `partial`.
