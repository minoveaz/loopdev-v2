# CRM Overview Implementation Plan

## Inputs and baseline

- Product: `docs/06-product/crm/`
- Design: `design.md`, run `MOD-CRM-20260927-001`
- Branch: `feature/crm-v2-foundation`, base `develop`, HEAD `e9ca052069a5693412e1979adc17763a1c3300f2`
- Checkout: `/Users/minoveaz/Documents/Proyectos/loopdev-v2`, branch checkout, dirty; unrelated dirty changes preserved
- Runtime: not started/verified in this planning run

## Ordered work breakdown

| ID | Phase | Issue | Dependencies | Areas | Validation / definition of done |
|---|---|---:|---|---|---|
| OVR-00 | environment-truth-audit | pending approval | none | checkout/runtime | branch, HEAD, dirty diff and served route recorded; no mixed checkout |
| OVR-01 | platform-reuse-audit | pending approval | OVR-00 | Analytics, Tasks, Activity, Notes, Files, Relations, DI | every reuse decision evidenced; duplicate list closed |
| OVR-02 | architecture-boundary-audit | pending approval | OVR-01 | page/hooks/adapters/contracts | dependency direction, SRP and forbidden imports documented |
| OVR-03 | responsibility-audit | pending approval | OVR-02 | UI/application/domain/infrastructure | owners and consumers mapped; no page business logic |
| OVR-04 | refactor-safety-audit | pending approval | OVR-03 | current Overview | before snapshot, removal list, rollback and regression tests |
| OVR-05 | domain/access/api/sync contracts | pending approval | OVR-01..04 | helper artifacts, Analytics contract | open decisions resolved or explicitly approved; DTO/RLS/sync cases pass review |
| OVR-06 | visual-design | pending approval | OVR-05 | Rivera desktop/mobile wireframes/states | visual gate approved before implementation planning closes |
| OVR-07 | local-first dashboard UX | pending implementation approval | OVR-06 | `Overview.tsx`, hooks, i18n | canonical four KPIs, pipeline/activity/task read-only composition and all states; component tests |
| OVR-08 | remote analytics integration | completed; verification partial | OVR-05, OVR-07 | Analytics adapters/Supabase | RLS-scoped DTOs, 60-second target/5-minute maximum freshness, errors, latency evidence |
| OVR-09 | activity/task migration | pending implementation approval | OVR-07, OVR-08 | Platform consumers | allowlisted activity, read-only tasks with deep link, no duplicate/legacy surfaces |
| OVR-10 | verification and activation | pending implementation approval | OVR-09 | tests, docs, rollback | acceptance matrix PASS/PARTIAL, responsive/a11y/i18n/security evidence; activate all tenants only after tests, rollback on validation failure |

No issues are created until design and plan approvals; each executable phase
then receives one `.github/ISSUE_TEMPLATE/module-phase.md` issue.

## Mandatory audits

Environment, Platform reuse, legacy-flow, route/runtime, surface-state,
operation parity, renderer-action, accessibility/i18n, security/rollback,
architecture-boundary, responsibility and refactor-safety audits are required.

## Operation parity

| Capability | Desktop web | Mobile web | iOS | Android | Test |
|---|---|---|---|---|---|
| KPI read/filter/refresh | planned | adapted stacked/filter sheet | planned | planned | component/journey |
| Pipeline health/deep link | planned | adapted scroll | planned | planned | component |
| Task summary/open | planned | adapted rows | planned | planned | component/journey |
| Activity summary/open | planned | adapted rows | planned | planned | component |

## Risks and blockers

| ID | Risk | Mitigation | Status |
|---|---|---|---|
| R-01 | remote adapter/RLS not runtime-proven | OVR-08 scoped tests and smoke | open |
| R-03 | dirty checkout may contain unrelated changes | preserve, fingerprint, no reset | controlled |
| R-04 | activity taxonomy may include extraction events | explicit allowlist and test | controlled |
| R-05 | mobile/native ownership unclear | mark planned with owner | open |

**State:** `partial` — resolved product decisions recorded; runtime evidence and
implementation approval remain pending. No production work started.

**Exact next gate:** `WAITING_IMPLEMENTATION_APPROVAL`, immediately before
`OVR-07` production implementation. Issue setup may be performed only if the
delivery workflow requires it; no production code, commit, push or PR is
authorized by this artifact.
