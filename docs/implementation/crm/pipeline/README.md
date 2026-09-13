# CRM Pipeline Implementation

## References

- Product definition: `docs/06-product/crm/pipeline/`
- Primary route: `/app/sales-crm/pipeline`
- Existing implementation: `src/loopdev/pages/crm/Pipeline.tsx`
- Existing adapter: `src/loopdev/domains/crm/adapter/local.ts`
- Existing tests: `src/test/crm/pipeline/`
- Run ID: `MOD-CRM-PIPELINE-20260913-002`
- Track: specialized analysis in progress
- Main issue: pending plan phase

## Current status

| Field | Value |
|---|---|
| Status | `in_progress` |
| Current phase | `SPECIALIZED_ANALYSIS` |
| Current issue | Not created until plan approval |
| Branch | `feature/crm-v2-foundation` |
| Commit | `48f6ff2` |
| Runtime | `http://localhost:8081/app/sales-crm/pipeline` running from canonical checkout |
| Last evidence | Discovery and expected-versus-existing matrix completed; HTTP 200 on canonical runtime |

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
| 02 Domain | pending | pending | pending | pending |
| 03 Access | pending | pending | pending | pending |
| 04 API | pending | pending | pending | pending |
| 05 Sync | pending | pending | pending | pending |
| 06 Plan | pending | pending | pending | pending |
| 07 Build | pending | pending | pending | pending |
| 08 Verify | pending | pending | pending | pending |
| 09 Review | pending | pending | pending | pending |

## Decisions and blockers

| ID | Type | Decision/blocker | Status | Evidence |
|---|---|---|---|---|
| DEC-PIPELINE-001 | scope | Treat the existing Kanban as the baseline and implement the complete pilot surface set | confirmed | Product Owner scope selection on 2026-09-13 |
| BLOCK-PIPELINE-001 | environment | Runtime on `localhost:8081` was required before functional/runtime evidence | resolved | Vite started and route returned HTTP 200 |

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
