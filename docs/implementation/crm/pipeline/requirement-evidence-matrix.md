# CRM Pipeline Requirement Evidence Matrix

The delivery ledger is canonical for requirement IDs. Evidence classifications
below describe the current historical record and do not convert its run-level
approval claims into verified acceptance.

| Requirement ID | Product definition | Implementation references | Historical evidence | Status | Gap/next action |
|---|---|---|---|---|---|
| `PIPELINE-REQ-BOARD` | Stage board and forecast totals | `src/loopdev/pages/crm/Pipeline.tsx` | Historical run reports broad tests; no pinned per-platform evidence | `PARTIAL` | Record platform-scoped tests and journeys against an approved source snapshot |
| `PIPELINE-REQ-MUTATION` | Stage transition with optimistic locking | `src/loopdev/pages/crm/Pipeline.tsx`; `src/loopdev/domains/crm/adapter/local.ts` | Historical run reports broad tests; no requirement/platform evidence records | `PARTIAL` | Record concurrency and mutation results for each required platform |
| `PIPELINE-REQ-REOPEN` | Protected terminal-stage reopen with reason | `src/loopdev/pages/crm/Pipeline.tsx` | No linked machine-readable result | `NOT_TESTED` | Add required authorization/reason tests and platform evidence |
| `PIPELINE-REQ-SPEED-DIAL` | Mobile 1-tap commercial speed dial | Mobile Pipeline renderer in `apps/mobile/` | E4 task is blocked; no structured journeys | `NOT_TESTED` | Capture a passed journey on mobile_web, iOS and Android, or approve a scope change |
| `PIPELINE-REQ-DETAIL` | Opportunity detail workstation and notes | `src/loopdev/pages/crm/Pipeline.tsx`; `apps/mobile/components/MobileOpportunityDetailScreen.tsx` | Historical run reports broad tests; no pinned per-platform evidence | `PARTIAL` | Record detail, notes and navigation results against the source snapshot |

## Historical phase-gate discrepancy

`runs/MOD-CRM-PIPELINE-20260913-002/` is the coherent phase record and pauses at
`WAITING_VISUAL_DESIGN_APPROVAL`; its visual-design checkpoint says approval is
pending. The later `runs/MOD-PIPELINE-20260918-001/` manifest reports
verification/release approvals, while the current ledger is blocked on the
speed-dial E4 journey and the contemporaneous platform scope marks iOS/Android
as planned. The later run therefore remains `UNVERIFIED`; it does not supersede
the earlier visual-design gate or authorize resuming implementation.

See [`DELIVERY_HISTORICAL_RUN_DISPOSITIONS.md`](../../../03-platform/governance/DELIVERY_HISTORICAL_RUN_DISPOSITIONS.md)
for the evidence-backed disposition and preserved-record policy.
