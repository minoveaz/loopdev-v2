# CRM Overview Requirement Evidence Matrix

| ID | Product/design reference | Evidence required | Status | Gap/next action |
|---|---|---|---|---|
| OVR-01 | `design.md` §7; user decision 2026-09-27 | remote KPI DTO for open pipeline/leads/opportunities/overdue-today tasks + populated/empty/error test; 60s target and 5m maximum freshness | PARTIAL | DTO, focused tests and build pass; authenticated browser state/freshness capture unavailable |
| OVR-02 | `design.md` §7 | pipeline breakdown scoped test + visual state | PARTIAL | scoped analytics tests and Rivera state matrix pass; runtime visual capture unavailable |
| OVR-03 | `design.md` §7; user decision 2026-09-27 | compact read-only task renderer, deep link and permission case; no Overview mutation | PARTIAL | read-only/deep-link regression passes; browser permission/deep-link evidence unavailable |
| OVR-04 | `design.md` §7; user decision 2026-09-27 | allowlist/dedupe test for calls, emails, meetings, notes, tasks, assignments, stage changes, conversions and closures; exclude DI/technical events | PASS | `dashboard.test.ts`; shared Activity adapter and remote timeline read model |
| OVR-05 | `design.md` §7 | state matrix for all panels | PARTIAL | conceptual desktop/mobile matrix and component states exist; authenticated runtime states not captured |
| OVR-06 | `design.md` §7; access decision | RLS selected-team visibility with no cross-team data, deep-link, cache revocation, i18n/RTL evidence; no export MVP | PARTIAL | authenticated API smoke and scope tests pass; browser tenant/team/brand, revocation, i18n/RTL evidence unavailable |
| OVR-07 | approved request | route diff and regression journey | PASS | route composition, legacy-surface removal, typecheck/lint/tests/build and diff check pass |
| OVR-08 | `api-contracts.md` | DTO/error/idempotency contract review | PARTIAL | adapter contract, RLS/error mapping and authenticated smoke pass; runtime/browser freshness evidence unavailable |
| OVR-09 | `sync-design.md`; user decision 2026-09-27 | 60s read cache, stale/offline state, manual retry and explicit rejection of offline mutations | PARTIAL | 60s/5m cache helpers, stale authorized snapshots, retry, read-only Tasks deep link and authenticated RLS smoke pass; browser state capture unavailable |
| OVR-10 | release/readiness gate | real runtime, browser-authenticated routes/states, responsive, i18n/RTL, scope/revocation, cross-module regression, rollback and final verdict | BLOCKED | rerun corrected the manifest to the verified Vite process on 127.0.0.1:8080 and all technical probes pass; browser automation/authenticated UI capture is unavailable, so required visual, responsive, scope and revocation evidence remains NOT_TESTED |

## Release blockers

- Design, plan and visual design approvals are recorded.
- Remote Analytics/RLS evidence and implementation validation remain blockers.
- Direct all-tenant activation is permitted only after tests pass; rollback is
  required if validation fails.

## OVR-09 release/readiness gate

- Migration status: **verified adapter migration**; Overview consumes shared
  Platform Tasks and Activity reads, with UUID organizations routed remote-only
  and non-UUID development scopes remaining local. No database migration was
  added.
- Rollback status: **ready**; restore the prior Overview composition and retain
  source records/caches. No reset, revert, commit, push or PR was performed.
- Residual debt: browser-level authenticated loading/empty/error/forbidden,
  deep-link and responsive/i18n/RTL evidence remains unrecorded; team/brand
  visibility is delegated to RLS and was not browser-proven.
- Next gate: release/readiness review (OVR-10). Keep the phase open until the
  missing visual/runtime evidence is approved or explicitly waived.

## OVR-10 release/readiness review

- Verdict: **BLOCKED** (not release-ready).
- Confirmed evidence: requested branch/HEAD and dirty checkout; actual Vite
  process on `127.0.0.1:8080` (PID 13144) serves HTTP 200 for Overview, Tasks
  and a task-shaped deep-link; typecheck, lint, i18n check, focused tests,
  authenticated CRM smoke, production build and `git diff --check` pass.
- Missing evidence: browser-level authenticated loading/success/empty/error/
  forbidden/stale/offline states, task deep-link authorization, responsive
  mobile behavior, i18n/RTL rendering, tenant/team/brand isolation and cache
  revocation. The runtime URL in `run.json` is stale (`8081`) and does not
  match the verified process (`8080`).
- Blocking findings:
  1. `REVIEW-001` / `VERIFY-002`: runtime identity mismatch (manifest 8081 vs
     process 8080), so runtime evidence cannot be attributed to the declared
     environment.
  2. `REVIEW-002` / `VERIFY-001`: required browser-authenticated release
     evidence is absent; no claim is made for states that were not observed.
- Residual risks: RLS and cache behavior are covered by code/tests/smoke but
  not browser-proven; direct activation for all tenants remains unapproved.
- Rollback: restore the previous Overview composition via a new `git revert`
  only if a future approved release validation fails; no reset, revert, commit,
  push or PR was performed in this review.
- Next action: correct the runtime manifest/process pairing, capture the
  authenticated browser journeys and rerun OVR-10. Final human release
  approval is required after those artifacts pass.

## OVR-10 rerun — 2026-09-27T17:57:30+02:00

- Verdict: **BLOCKED** (partial technical readiness; not release-ready).
- Runtime correction: verified process `node /Users/minoveaz/Documents/Proyectos/loopdev-v2/node_modules/.bin/vite --host 127.0.0.1 --port 8080` (PID 13144); manifest and rerun checkpoint now use `http://127.0.0.1:8080`.
- Technical evidence: typecheck, lint, i18n check, 18 focused tests, authenticated CRM smoke, production build, `git diff --check`, and HTTP 200 probes for Overview, Tasks and a task deep link all pass.
- Browser limitation: no browser automation or authenticated canvas/runtime capability is available. Therefore loading/success/empty/error/forbidden/stale/offline UI, responsive/mobile, i18n/RTL rendering, task deep-link authorization, tenant/team/brand isolation and cache revocation remain **NOT_TESTED**, not inferred.
- Blocking finding: `REVIEW-002` — required browser-authenticated release evidence is unavailable.
- Checkpoint: `runs/MOD-CRM-20260927-001/10-review-rerun.json`.
- Human approval: final release approval remains required after browser evidence is captured or explicitly waived by the responsible approver.

## Known deviations

Current source contains duplicate Platform panels, fixed demo relations and a
full task workspace; this is the baseline to remove, not accepted behavior.
