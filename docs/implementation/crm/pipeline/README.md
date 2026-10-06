# CRM Pipeline Implementation

## References

- Product definition: `docs/06-product/crm/pipeline/`
- Primary route: `/app/sales-crm/pipeline`
- Existing implementation: `src/loopdev/pages/crm/Pipeline.tsx`
- Existing adapter: `src/loopdev/domains/crm/adapter/local.ts`
- Existing tests: `src/test/crm/pipeline/`
- Run ID: `MOD-CRM-PIPELINE-20260913-002`
- Track: `WAITING_VISUAL_DESIGN_APPROVAL`
- Main issue: pending plan phase
- Multiplatform contract: `docs/03-platform/governance/MULTIPLATFORM_DELIVERY_CONTRACT.md`
- Platform scope: `platform-scope.md`
- Platform evidence: `platform-evidence-matrix.md`

## Current status

| Field | Value |
|---|---|
| Status | `PAUSED` |
| Current phase | `WAITING_VISUAL_DESIGN_APPROVAL` (paused for documentation governance) |
| Current issue | Not created until plan approval |
| Branch | `feature/crm-v2-foundation` |
| Commit | `c03a5d8` |
| Runtime | `http://localhost:8081/app/sales-crm/pipeline` running from canonical checkout |
| Last evidence | Rivera baseline inventory, styled/structural SVG evidence and state matrix prepared; specialized analysis artifacts preserved; HTTP 200 on canonical runtime |

## Scope

### Included

- Certify and evolve the existing CRM Pipeline Kanban board.
- Complete the approved pilot surfaces: Kanban, Opportunities table,
  opportunity detail and manual opportunity creation.
- Preserve the existing route, local-first adapter and opportunity stage model.
- Verify architecture boundaries, UX states, permissions, tenant scope,
  optimistic conflicts, terminal-stage reopening and accessible movement.
- Identify gaps against the approved product contract and UX specification.

### Excluded

- Backend or production persistence implementation.
- Forecasting, AI, quotes, documents, billing and external integrations.
- Replacing the existing Kanban with a parallel board implementation.

## Phase index

| Phase | Issue | Status | Checkpoint | Evidence |
|---|---:|---|---|---|
| 01 Design | pending | `approved` | `runs/MOD-CRM-PIPELINE-20260913-002/01-design.json` | Discovery and baseline comparison approved |
| 01 Visual design | pending | `waiting_approval` | `runs/MOD-CRM-PIPELINE-20260913-002/01-visual-design.json` | Normative source, Rivera inventory, styled/structural SVGs and two-level validation; approval pending |
| 02 Domain | pending | `completed` | `runs/MOD-CRM-PIPELINE-20260913-002/02-domain.json` | Domain model and lifecycle invariants |
| 03 Access | pending | `completed` | `runs/MOD-CRM-PIPELINE-20260913-002/03-access.json` | RBAC, RLS, audit and escalation cases |
| 04 API | pending | `completed` | `runs/MOD-CRM-PIPELINE-20260913-002/04-api.json` | Commands, DTOs, errors and events |
| 05 Sync | pending | `completed` | `runs/MOD-CRM-PIPELINE-20260913-002/05-sync.json` | Local-first, conflict and migration policy |
| 06 Plan | pending | `preserved` | `runs/MOD-CRM-PIPELINE-20260913-002/06-plan.json` | Preserved artifact; plan approval blocked by visual gate |
| 07 Build | pending | pending | pending | pending |
| 08 Verify | pending | pending | pending | pending |
| 09 Review | pending | pending | pending | pending |

## Pause state

**PAUSED:** Documentation governance must be reviewed before this run resumes. The
`WAITING_VISUAL_DESIGN_APPROVAL` gate is preserved; visual design remains pending
and must not be marked approved. Read
`docs/03-platform/governance/V2_DOCUMENTATION_SOURCE_OF_TRUTH.md` and
`docs/03-platform/governance/LEGACY_TO_V2_DOCUMENTATION_MAP.md` before resuming. Proposed `SAAS_*` documents
are non-runtime references only.

## Decisions and blockers

| ID | Type | Decision/blocker | Status | Evidence |
|---|---|---|---|---|
| DEC-PIPELINE-001 | scope | Treat the existing Kanban as the baseline and implement the complete pilot surface set | confirmed | Product Owner scope selection on 2026-09-13 |
| BLOCK-PIPELINE-001 | environment | Runtime on `localhost:8081` was required before functional/runtime evidence | resolved | Vite started and route returned HTTP 200 |
| BLOCK-PIPELINE-002 | approval | Implementation plan requires explicit approval before phase issues or production changes | open | `runs/MOD-CRM-PIPELINE-20260913-002/06-plan.json` |
| BLOCK-PIPELINE-003 | approval | Visual design approval is required before specialized analysis/plan approval | open | `runs/MOD-CRM-PIPELINE-20260913-002/01-visual-design.json` |

## Platform impact

| Capability | Decision | Consumers | Tests affected | Migration |
|---|---|---|---|---|
| Activity / stage history | `REUSE` | Pipeline adapter and future timeline | Pipeline mutation and history tests | none in local-first phase |
| Tasks and Notes | `REUSE` | Opportunity detail follow-up flows | Existing CRM platform tests | none |
| Relations / Customer 360 | `REUSE` | Contact and Lead links | CRM integration tests | none |
| Kanban and shared UI primitives | `REUSE` | Pipeline board | Pipeline page tests | none |

## Change log

| Date | Change | Run/commit | Approved by |
|---|---|---|---|
| 2026-09-13 | Initialized delivery workspace and audited existing Pipeline baseline | `MOD-CRM-PIPELINE-20260913-001` | pending |
| 2026-09-13 | Approved discovery/design gate; legacy references constrained to informational evidence and reuse-first implementation | `MOD-CRM-PIPELINE-20260913-002` / `48f6ff2` | Product Owner |
| 2026-09-13 | Completed domain, access, API, sync and plan phases; stopped at plan approval gate | `MOD-CRM-PIPELINE-20260913-002` / `c03a5d8` | pending |
| 2026-09-13 | Added mandatory visual-design subgate and Pipeline visual evidence; stopped without claiming approval | `MOD-CRM-PIPELINE-20260913-002` | pending |
| 2026-09-13 | Paused for documentation governance review; visual-design approval gate preserved | `MOD-CRM-PIPELINE-20260913-002` | pending |
