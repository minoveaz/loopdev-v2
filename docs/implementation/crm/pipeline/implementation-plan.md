# CRM Pipeline Implementation Plan

## Inputs and gate

- Product definition: `docs/06-product/crm/pipeline/`
- Approved design/discovery run: `MOD-CRM-PIPELINE-20260913-002`
- Specialized analysis: `domain-model.md`, `access-design.md`, `api-contracts.md`, `sync-design.md`
- Track: `WAITING_VISUAL_DESIGN_APPROVAL`
- Visual-design approval: pending; no specialized-analysis handoff, plan
  approval, phase issues or production implementation may start
- Legacy component/view documentation: informational only

## Environment baseline

| Field | Value |
|---|---|
| Repository | `minoveaz/loopdev-v2` |
| Path | `/Users/minoveaz/Documents/Proyectos/loopdev-v2` |
| Checkout / branch | branch / `feature/crm-v2-foundation` |
| Base | `develop` |
| HEAD | `c03a5d812fb72a97b4e0d90866d0415cef7395de` |
| Working tree | documentation changes only |
| Runtime | `http://localhost:8081/app/sales-crm/pipeline` (HTTP 200) |

## Scope and reuse rules

The approved pilot covers Kanban, Opportunity table, detail, manual creation, qualified Lead conversion, authorized stage movement/reopen, shared Activity/Notes/Tasks/Relations and local-first conflict preparation. Forecasting, AI, quotes, documents, billing and external integrations remain out of scope.

Reuse the current Rivera template, shared LoopDev controls (`Select`, `Command`, `Popover`, `Calendar`, tables, drawers, status primitives), existing CRM routes/hooks/adapters and Platform contracts. Do not create legacy parallel views, a module-local timeline, notes editor, task system, uploader, document processor, or authorization model.

## Current-state inventory and target boundary

Existing `Pipeline.tsx`, `Opportunities.tsx`, `OpportunityDetail.tsx`, CRM hooks, local adapter/stores and pipeline tests provide partial baseline behavior. The target preserves the adapter boundary and adds evidence-backed product/origin, activity health, permission states, cursor reads, manual idempotency, full surface-state coverage and responsive/accessibility evidence. Presentation → hooks/application → typed CRM contracts → local/remote adapter remains the dependency direction.

## Ordered work breakdown

Visual design is a mandatory predecessor to this plan. See
`visual-design.md`, `view-state-matrix.md` and
`runs/MOD-CRM-PIPELINE-20260913-002/01-visual-design.json`. The existing
specialized analysis below is preserved as prior evidence but cannot be
approved or executed until the visual gate passes.

| ID | Type | Dependencies | Affected areas | Risk | Validation / definition of done |
|---|---|---|---|---|---|
| VIS-01 | visual gate | discovery/design | `visual-design.md`, `view-state-matrix.md`, `wireframes/` | high | Explicit visual approval; all surfaces/states/breakpoints/a11y/reuse evidence |
| AUD-ENV | audit | VIS-01 | checkout, branch, runtime | low | Environment metadata and route smoke recorded; no mismatch |
| AUD-PLATFORM | audit | AUD-ENV | Platform inventory; Activity, Notes, Tasks, Relations, Customer 360; Rivera primitives | high | Reuse matrix names existing contracts/consumers; duplicate capabilities rejected |
| AUD-LEGACY | audit | AUD-PLATFORM | legacy docs, current routes/views | medium | Every legacy reference mapped to current surface or rejected; no new legacy path |
| AUD-ROUTE | audit | AUD-ENV | route registry, navigation, deep links | medium | Canonical board/list/detail/create URLs and direct authorization tested |
| AUD-STATE | audit | AUD-ROUTE | board/table/detail/form/card | high | loading, empty, error, forbidden, stale, conflict, offline, pending and success evidence |
| AUD-A11Y | audit | AUD-ROUTE | keyboard movement, menus, portals, responsive, i18n/RTL | high | Keyboard alternative to drag/drop, focus/announcements, mobile/tablet and locale checks |
| AUD-SEC | audit | AUD-PLATFORM | RLS, sensitive fields, audit, flags, rollback | critical | Cross-tenant/deep-link/cache/queue/export/attachment tests and rollback evidence |
| AUD-BOUNDARY | audit | AUD-PLATFORM | presentation/application/domain/adapter imports | high | Architecture boundary report; forbidden UI/storage/transport dependencies absent |
| AUD-RESP | audit | AUD-BOUNDARY | page, hooks, adapter, shared components | medium | Responsibility/SRP/cohesion matrix; shared capability ownership explicit |
| AUD-REFACTOR | audit | AUD-RESP | existing tests and behavior | high | Before/after regression set, rollback point and residual debt recorded |
| DOM-01 | domain | AUD-PLATFORM | Opportunity, Stage, Line, StageHistory and health projection | high | Stable IDs, lifecycle invariants and event payloads match `domain-model.md` |
| ACCESS-01 | permissions | AUD-SEC | role policy, RLS/read models, audit | critical | Matrix and escalation cases pass outside UI; shared Platform policies reused |
| API-01 | contract | DOM-01, ACCESS-01 | adapter ports and future transport DTOs | high | Commands, cursor reads, errors, idempotency/version/event contracts reviewed |
| SYNC-01 | sync | API-01 | local adapter, durable queue boundary, reconciliation | critical | Separate state model; offline/reload/retry/conflict/permission/migration cases pass |
| UI-01 | frontend | AUD-PLATFORM, AUD-STATE, AUD-A11Y, API-01 | current Rivera Pipeline board/card and shared controls | high | Product/origin/health/indicators/actions use shared primitives; no business rules in card |
| SURF-01 | frontend | UI-01, API-01 | list/table/detail/manual create routes | high | Approved routes, cursor filters, relation surfaces, form validation/idempotency and responsive states pass |
| TEST-01 | tests | DOM-01, ACCESS-01, API-01, SYNC-01, SURF-01 | `src/test/crm/pipeline/` and integration suites | high | Targeted adapter/page/contract/accessibility tests plus runtime UAT evidence pass |
| MIG-01 | migration | DOM-01, SYNC-01, ACCESS-01 | local-to-remote identity mapping and seed stages | critical | Additive/reversible migration, duplicate conversion handling and rollback evidence |
| VERIFY-01 | verify | TEST-01, MIG-01, AUD-REFACTOR | full requirement/evidence matrix | high | No required capability lacks evidence; unresolved items explicitly blocked |

Implementation starts only after plan approval and phase issue creation with acceptance criteria/dependencies. This document itself does not authorize production changes.

## Suite interaction matrix

| Module/capability | Trigger | Shared data/events | Permission | Evidence |
|---|---|---|---|---|
| Contacts / Customer 360 | open relation, create/manual link | Contact identity; `opportunity.created` | Contact + tenant scope | relation/deep-link tests |
| Leads | qualified conversion | Lead status and conversion event | conversion permission; unique tuple | idempotent replay/concurrency tests |
| Activity / Timeline | create, move, reopen, assignment | shared activity and immutable stage history | record scope | event projection/history tests |
| Notes / Tasks | follow-up from card/detail | relation refs and shared queues | shared Platform policy | consumer integration tests |
| Catalog/reference data | product selection | stable `productKey`/catalog IDs | workspace scope | cross-tenant reference tests |
| Shared UI/Rivera | board/table/form states | tokens, controls, drawers, status | action affordances reflect permission | visual/accessibility/runtime evidence |

## Decisions and blockers

- Confirmed: reuse Rivera/shared LoopDev/Platform surfaces; existing implementation is baseline evidence, not compliance proof.
- Confirmed: no production code, issue, commit, push or PR in this run.
- Open: exact authorization claim names, archive retention/restore policy, health thresholds, final cursor encoding and stage-config MVP boundary.
- Blocker: explicit visual-design approval is required before specialized
  analysis handoff and plan approval; no implementation phase or issue
  execution may start.

## Acceptance evidence plan

Run targeted CRM adapter/page tests, typecheck/lint/build as impacted, module-run validation/reporting, direct runtime smoke, keyboard/responsive/accessibility checks, cross-tenant/RLS and optimistic conflict tests, migration rollback evidence and requirement matrix review. A clean build alone does not close behavior or authorization evidence.

## State

`complete` as a preserved plan artifact; delivery is stopped at
`WAITING_VISUAL_DESIGN_APPROVAL`.
