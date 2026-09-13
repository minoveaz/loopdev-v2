# CRM Pipeline Implementation Plan

## Inputs

- Product definition: `docs/06-product/crm/pipeline/`
- Design run: `MOD-CRM-PIPELINE-20260913-001`
- Track: pending design approval
- Main issue: pending plan phase
- Approved by: pending
- Approval date: pending

## Environment baseline

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/Documents/Proyectos/loopdev-v2` |
| Checkout type | branch |
| Branch | `feature/crm-v2-foundation` |
| Base branch | `develop` |
| HEAD | `c80b814` |
| Runtime URL | `http://localhost:8081/app/sales-crm/pipeline` |
| Runtime port | 8081 (not running during intake) |
| Working tree | clean before workspace initialization |

## Ordered work breakdown

| ID | Phase | Issue | Type | Task | Dependencies | Files/areas | Validation | Definition of done |
|---|---|---:|---|---|---|---|---|---|
| AUD-01 | 01-design | pending | audit | Complete context and architecture baseline | none | product docs, route, adapter | source and runtime audit | design checkpoint complete |
| AUD-02 | 06-plan | pending | audit | Architecture boundary audit | AUD-01 | module layers and imports | dependency review | boundaries accepted |
| AUD-03 | 06-plan | pending | audit | Responsibility audit | AUD-01 | UI, hooks, domain, adapters | SRP/cohesion review | ownership matrix complete |
| AUD-04 | 06-plan | pending | audit | Refactor safety audit | AUD-01 | tests and behavior | before/after plan | rollback and regression evidence defined |
| BUILD-01 | 07-build | pending | build | Implement approved gaps only | AUD-02, AUD-03, AUD-04 | CRM Pipeline surfaces | targeted tests and runtime | acceptance criteria pass |
| VERIFY-01 | 08-verify | pending | verify | Verify route, states, permissions and regressions | BUILD-01 | pipeline and consumers | test/runtime/accessibility evidence | evidence matrix complete |
| REVIEW-01 | 09-review | pending | review | Issue structural and release verdict | VERIFY-01 | implementation workspace | review gate | ready or tracked gaps |

## Mandatory audits

- [x] Environment truth audit (runtime blocked).
- [x] Platform reuse audit (initial baseline).
- [ ] Legacy-flow audit: classify old component/view references as
  informational and map required behavior to current Rivera/LoopDev v2
  primitives; do not create parallel legacy paths.
- [ ] Route and runtime audit.
- [ ] Surface-state audit.
- [ ] Accessibility and i18n audit.
- [ ] Security and rollback audit.
- [ ] Architecture boundary audit.
- [ ] Responsibility audit.
- [ ] Refactor safety audit.

## Risks and blockers

| ID | Risk/blocker | Impact | Owner | Mitigation | Status |
|---|---|---|---|---|---|
| BLOCK-001 | Runtime `localhost:8081` was not running during intake | Functional and visual evidence was initially unavailable | Delivery | Start Vite from canonical checkout | resolved |
| RISK-001 | Existing source implements only part of the approved UX surface | Scope requires additional table/detail/create work | Product/Tech Lead | Include all approved pilot surfaces in plan | open |
