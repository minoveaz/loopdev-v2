# Phase 07 — Local-first dashboard UX evidence

## Identity

| Field | Value |
|---|---|
| Run ID | `MOD-CRM-20260927-001` |
| Span | `MOD-CRM-20260927-001:07-build` |
| Skills | `module-build` |
| Status | `completed` for local UX; stopped at next gate |

## Objective

Implement only the approved local-first Overview composition and remove
conflicting legacy surfaces without extending backend/API scope.


## Inputs/actions

- Preserved the canonical checkout's unrelated dirty changes.
- Replaced the legacy Overview composition with four KPIs, pipeline health,
  read-only task summary and one allowlisted business-activity summary.
- Removed Overview-owned full Tasks, Notes, Attachments, duplicate Timeline,
  duplicate Activities and fixed Relations/demo references.
- Added analytics read-cache/retry support and pure activity/task state helpers.

## Acceptance

- [x] Scope excludes full Tasks, duplicate Timeline/Activities, default Notes/Attachments, fixed relations and extraction noise.
- [x] Remote KPI/pipeline contracts and tenant/RLS expectations defined.
- [x] Surface states, local-first migration, i18n/accessibility and rollback defined.
- [x] Platform reuse and architecture boundaries explicit.
- [x] Dependency-aware plan and evidence matrix created.
- [x] Canonical KPI catalogue is represented in the Overview.
- [x] Task rows are read-only and deep-link to Tasks.
- [x] Activity allowlist excludes technical and extraction events and deduplicates source references.
- [x] Legacy Overview surfaces are absent and covered by regression assertions.
- [x] Typecheck, focused lint, focused tests, production build and diff check pass.
- [ ] Runtime authenticated route evidence and remote RLS/freshness evidence (OVR-08/OVR-10).

## Validation evidence

| Command | Result | Evidence |
|---|---|---|
| `npm run typecheck` | PASS | compiler output exit 0 |
| `npx eslint src/loopdev/pages/crm/Overview.tsx src/loopdev/domains/crm/overview.ts src/loopdev/domains/platform/analytics/hooks.ts src/test/crm/overview/dashboard.test.ts` | PASS | exit 0 |
| `npx vitest run src/test/crm/overview/dashboard.test.ts` | PASS | 3 tests |
| `npm run build` | PASS | 3865 modules transformed |
| `git diff --check` | PASS | no whitespace errors |

The earlier analysis order was `02-domain → 03-api → 04-access → 05-sync`.
This build changed only the approved Overview UX files and preserved unrelated
dirty source changes. No issue, commit, push or pull request was created.

## Current-code reconciliation

- `Overview.tsx` now uses remote-ready Analytics metric/breakdown hooks and
  shared Platform Tasks/Activity read contracts only.
- Tasks uses the remote adapter for UUID tenants; this is a Platform Tasks
  dependency, not an Overview-local mutation path.
- Activity filtering is now covered by a business-event allowlist and
  extraction-noise regression test.
- Attachments remain contextual and the future shared Storage capability, not an
  Overview-owned surface.
- Repository-wide module-run validation remains a pre-existing traceability
  baseline gap; this run's checkpoints pass direct JSON parsing.

## Environment evidence

| Field | Value |
|---|---|
| Repository | `/Users/minoveaz/Documents/Proyectos/loopdev-v2` |
| Branch | `feature/crm-v2-foundation` |
| HEAD | `e9ca052069a5693412e1979adc17763a1c3300f2` |
| Working tree | modified; unrelated dirty changes preserved |
| Runtime | not used as evidence |

## OVR-08 remote Analytics/RLS verification

Implemented in the approved canonical checkout without resetting unrelated dirty
changes:

- UUID organization scopes are remote-only; unavailable remote configuration
  fails closed instead of returning local/demo fixtures.
- Remote analytics maps organization/workspace/brand scope predicates and
  explicit auth, forbidden/RLS, invalid-filter, schema and unavailable errors.
- Remote results expose `generatedAt`, `freshUntil` (60 seconds) and
  `sourceVersion`; cache data is usable for at most five minutes and then
  becomes an error/retry state.
- Existing CRM, Tasks and Platform Timeline RLS policies were reused; no unsafe
  policy or additional migration was required for this phase.
- Focused tests cover remote scope mapping, RLS/error mapping, freshness/cache,
  partial failures and dashboard regression.

| Validation | Result | Evidence |
|---|---|---|
| `npm run typecheck` | PASS | exit 0 |
| `npm run lint` | PASS | exit 0 |
| focused Vitest | PASS | 10 tests |
| focused ESLint | PASS | exit 0 |
| `npm run build` | PASS | 3865 modules transformed |
| `git diff --check` | PASS | no whitespace errors |
| `curl -I http://127.0.0.1:8081/app/sales-crm/overview` | PASS | HTTP 200 |
| `npm run smoke:crm-authenticated` | PASS | authenticated organization/task/opportunity/timeline RLS path and cleanup |

Browser-level authenticated loading/empty/error/forbidden/deep-link evidence
was not captured; this is recorded as `PARTIAL`, not as release evidence.

## OVR-09 — Activity/task migration and final validation

| Field | Value |
|---|---|
| Run ID | `MOD-CRM-20260927-001` |
| Span | `MOD-CRM-20260927-001:09-ovr-09` |
| Status | `partial`; stopped at release/readiness gate |
| Scope | authoritative Activity summary, read-only Tasks summary/deep links, freshness and final validation |

### Implementation and migration evidence

- Overview reads shared Platform `usePlatformActivities` and
  `usePlatformTasks`; no Overview-owned mutation queue or duplicate Timeline,
  Notes, Attachments, Relations, Tasks workspace or Document Intelligence
  extraction surface was added.
- Activity summary is allowlisted to calls, emails, meetings, notes, tasks,
  assignments, stage changes, conversions and closures, then deduplicated by
  `(sourceType, sourceId)` and sorted newest-first.
- Remote UUID organizations use the Supabase Platform timeline/task read model
  only; non-UUID development scopes use deterministic local adapters. Remote
  timeline reads now apply organization, workspace and brand predicates.
- Shared Tasks/Activity reads cache authorized snapshots for 60 seconds and
  retain them for at most five minutes as stale data. Overview remains
  read-only; task rows deep-link to Tasks for all mutations.
- No schema/database migration was required. Existing CRM/Tasks/Timeline RLS
  policies and the uncommitted analytics migration remain unchanged by OVR-09.

### Validation evidence

| Command | Result | Evidence |
|---|---|---|
| `npm run typecheck` | PASS | exit 0 |
| `npm run lint` | PASS | exit 0 |
| `npx vitest run src/test/crm/overview/dashboard.test.ts src/test/platform/platform-work.test.ts src/test/platform/analytics.test.ts` | PASS | 3 files, 18 tests |
| `npm run build` | PASS | 3865 modules transformed |
| `git diff --check` | PASS | no whitespace errors |
| `npm run smoke:crm-authenticated` | PASS | authenticated organization, contact/task/opportunity/timeline RLS path and cleanup |
| `curl -I --max-time 10 http://127.0.0.1:8081/app/sales-crm/overview` | NOT_AVAILABLE | port 8081 was not serving during final validation |

### Requirement reconciliation

- Activity allowlist, exclusion of technical/Document Intelligence events,
  source deduplication and chronological summary: **PASS**.
- Tasks read-only/deep links and no Overview mutation path: **PASS**.
- Tenant scope and UUID fail-closed routing: **PASS** in focused adapter tests
  and authenticated smoke; team/brand browser evidence: **PARTIAL**.
- Partial/forbidden/error/empty states and i18n/navigation contracts: **PARTIAL**;
  source and regression coverage exist, but authenticated browser capture was
  unavailable.
- 60-second cache, five-minute stale bound, manual retry and no offline
  mutations: **PASS** in code/tests; offline/browser evidence: **PARTIAL**.
- Reconciliation with Contacts, Leads, Opportunities, Pipeline and Tasks:
  **PASS** by shared route composition and focused regression coverage; no
  broad redesign performed.

### Migration, rollback and residual debt

- Migration: adapter-by-adapter cutover is complete for the Overview consumer;
  no data migration or feature flag was introduced.
- Rollback: prior composition can be restored without deleting source records;
  validation failure would keep OVR-09/OVR-10 open and invalidate dependent
  evidence. No git history rewrite or revert was performed.
- Residual debt: authenticated browser screenshots/flows for all state variants,
  responsive mobile, i18n/RTL and direct deep-link permission behavior remain
  open. These are release-readiness evidence gaps, not unverified claims of
  compliance.

**Next handoff:** `OVR-10_RELEASE_READINESS_REVIEW`; approval or explicit waiver
is required for the missing browser/runtime evidence before release review can
close.

## Decisions/failures/handoff

- Decisions: direct activation after tests; no exports or offline mutations;
  missing remote read models remain unavailable rather than local/demo fallback.
- Detected failure: no authenticated runtime/RLS evidence was run in this UX phase.
- Likely origin: OVR-08 remote integration is explicitly downstream.
- Residual debt: task/activity hooks do not yet expose complete stale/offline
  metadata; analytics cache is implemented, but remote 60s/5m freshness is not
  runtime-proven.
- Next handoff: `WAITING_OVR-09_APPROVAL` for activity/task migration and final
  verification only; do not begin automation or enterprise work.

## 01-visual-design gate evidence

| Field | Value |
|---|---|
| Span | `MOD-CRM-20260927-001:01-visual-design` |
| Source | `visual-design.md` |
| State matrix | `view-state-matrix.md` |
| Desktop evidence | `runs/MOD-CRM-20260927-001/visual-desktop.svg` |
| Mobile evidence | `runs/MOD-CRM-20260927-001/visual-mobile.svg` |
| Platform scope | desktop web and mobile web required; iOS/Android planned |
| Production changes | OVR-07 Overview UX only |
| Runtime comparison | `NOT_RUN`; authenticated runtime evidence is deferred to OVR-08/OVR-10 |
| Gate result | `APPROVED_BY_USER` |
| Open decisions | Exact aggregate-versus-read-model threshold and native parity ownership |

## OVR-10 release/readiness review

| Field | Value |
|---|---|
| Span | `MOD-CRM-20260927-001:10-review` |
| Status | `blocked` |
| Verdict | `BLOCKED` / not release-ready |
| Architecture quality | `PASS_WITH_DEBT` |
| Runtime identity | Process `node .../vite --host 127.0.0.1 --port 8080` (PID 13144); manifest still declares 8081 |
| Route probes | HTTP 200 for `/app/sales-crm/overview`, `/app/sales-crm/tasks` and a task deep-link on 8080 |
| Validation | typecheck, lint, i18n check, focused tests (18), authenticated CRM smoke, build and diff check passed |
| Browser evidence | unavailable; no browser automation/authenticated UI capture in this environment |
| Blocking codes | `REVIEW-001`/`VERIFY-002` runtime mismatch; `REVIEW-002`/`VERIFY-001` absent required browser evidence |
| Release classification | `BLOCKED` |
| Next handoff | Correct runtime identity, capture authenticated browser flows and rerun OVR-10; then obtain final human release approval |

## OVR-10 rerun — `MOD-CRM-20260927-001:10-review-rerun`

| Field | Value |
|---|---|
| Status | `blocked` |
| Verdict | `BLOCKED` / partial technical readiness |
| Architecture quality | `PASS_WITH_DEBT` |
| Timestamp | `2026-09-27T17:57:30+02:00` to `2026-09-27T17:58:22+02:00` |
| Checkout | `/Users/minoveaz/Documents/Proyectos/loopdev-v2`, branch `feature/crm-v2-foundation`, HEAD `e9ca052069a5693412e1979adc17763a1c3300f2`, dirty changes preserved |
| Runtime | `http://127.0.0.1:8080`, PID `13144`, `node /Users/minoveaz/Documents/Proyectos/loopdev-v2/node_modules/.bin/vite --host 127.0.0.1 --port 8080` |
| Routes | Overview, Tasks and task deep link returned HTTP 200 |
| Validation | typecheck, lint, i18n check, 18 focused tests, authenticated CRM smoke, build and diff check passed |
| Browser evidence | `NOT_AVAILABLE`: no browser automation or authenticated canvas/runtime capability; no browser claims made |
| Requirement classification | `OVR-10=PARTIAL`, `OVR-06=PARTIAL`, `OVR-09=PARTIAL`; release remains `BLOCKED` |
| Blocking finding | `REVIEW-002`: browser-authenticated state, responsive/mobile, i18n/RTL, direct-link authorization, tenant/team/brand scope and cache revocation remain unobserved |
| Checkpoint | `runs/MOD-CRM-20260927-001/10-review-rerun.json` |
| Next handoff | Provide browser-level authenticated evidence, then obtain final human release approval |
