# CRM Overview — Sales Operating Dashboard

## References

- Product truth: `docs/06-product/crm/README.md`, `docs/06-product/crm/CRM_SUITE_CONTRACT_ALIGNMENT.md`
- Track context: `tracks/active/crm/2026-09-09-loopdev-v2-crm-frontend.md`
- Run: `MOD-CRM-20260927-001`
- Route: `/app/sales-crm/overview`

## Status

| Field | Value |
|---|---|
| Status | `blocked_release_readiness` |
| Current phase | `OVR-10_RERUN_COMPLETE_BLOCKED_BROWSER_EVIDENCE` |
| Architecture quality | `PASS_WITH_DEBT` (browser-level authenticated state capture remains partial) |
| Checkout | canonical branch checkout, dirty changes preserved |
| Production code changed | Yes — OVR-07 and approved OVR-08 remote integration |
| Commits/push/PR | None |

## Scope

The approved redesign turns the route into a focused Sales Operating Dashboard:
remote tenant-scoped KPIs, pipeline health, compact task summary, and one
authoritative business-activity summary. It removes the full Tasks workspace,
duplicate Timeline/Activities surfaces, default Notes/Attachments, fixed demo
relations, and document-extraction noise.

## Artifacts

- `discovery.md` — approved discovery and current-state audit.
- `design.md` — complete module-design specification.
- `architecture-design.md` — target boundaries, ownership and platform decisions.
- `domain-model.md`, `access-design.md`, `api-contracts.md`, `sync-design.md` — helper decisions.
- `implementation-plan.md` — dependency-aware work breakdown; no execution started.
- `visual-design.md` — normative Rivera-compatible dashboard composition,
  responsive behavior, accessibility, route/deep-link behavior and legacy
  replacement matrix.
- `view-state-matrix.md` — desktop/mobile state coverage and recovery rules.
- `requirement-evidence-matrix.md` — acceptance/evidence plan.
- `platform-scope.md`, `platform-evidence-matrix.md` — multiplatform scope and evidence.
- `phase-evidence.md` — design/plan gate evidence.
- `runs/MOD-CRM-20260927-001/` — run and phase checkpoints, including `07-build.json`, `08-verify.json` and `10-review-rerun.json`.

## Gate

Design, visual, implementation and OVR-08 approval were supplied by the user
for this run. OVR-07 local-first UX and OVR-08 remote analytics/RLS integration
are implemented and validated in the canonical checkout. Authenticated API/RLS
smoke evidence passes; browser-level authenticated state capture remains
unavailable. The run is stopped after the OVR-10 rerun with a `BLOCKED`
classification; no commit, push or PR was created. Final human release
approval is still required.

## OVR-10 verdict

**BLOCKED / partial technical readiness, not release-ready.** The verified
runtime is `http://127.0.0.1:8080` (PID 13144), and the manifest now matches
that process. HTTP route probes, authenticated API smoke, typecheck, lint,
i18n check, focused tests, build and diff check pass. Browser-level
authenticated evidence is unavailable. Do not infer loading, success, empty,
error, forbidden, stale/offline, responsive/mobile, i18n/RTL, deep-link
authorization, tenant/team/brand isolation or cache-revocation behavior from
source/tests/HTTP probes alone. The exact limitation is recorded in
`runs/MOD-CRM-20260927-001/10-review-rerun.json`; final human release approval
remains required.
