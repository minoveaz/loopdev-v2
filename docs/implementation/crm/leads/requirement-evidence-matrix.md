# Requirement Evidence Matrix: CRM Leads

The delivery ledger is canonical for requirement IDs and scope. This matrix
keeps its IDs verbatim; runtime evidence below describes the historical run and
does not promote its approvals to verified evidence.

| Requirement ID | Requirement | Classification | Ledger platforms | Implementation references | Historical evidence state |
|---|---|---|---|---|---|
| `LEADS-REQ-LIST` | Authorized lead listing and dual-mode table/kanban view | `REQUIRED_MVP` | desktop_web, mobile_web, ios, android | `src/loopdev/pages/crm/Leads.tsx`; `apps/mobile/components/MobileLeadsScreen.tsx` | `PARTIAL` — source and run claims exist; no pinned platform journey records |
| `LEADS-REQ-PREVIEW` | Quick preview drawer without full page navigation | `REQUIRED_MVP` | desktop_web | `src/loopdev/components/crm/LeadQuickPreviewDrawer.tsx` | `PARTIAL` — component is referenced; no requirement-specific runtime result |
| `LEADS-REQ-SPEED-DIAL` | Mobile 1-tap speed dial actions | `REQUIRED_MVP` | mobile_web, ios, android | `apps/mobile/components/MobileLeadsScreen.tsx` | `NOT_TESTED` — E4 journey missing for all required platforms |
| `LEADS-REQ-QUALIFICATION` | BANT qualification and interactive stage stepper | `REQUIRED_MVP` | desktop_web, mobile_web, ios, android | `src/loopdev/pages/crm/Leads.tsx`; `apps/mobile/components/MobileLeadDetailScreen.tsx` | `PARTIAL` — source and run claims exist; no pinned platform journey records |
| `LEADS-REQ-CONVERT` | Convert qualified lead to commercial deal / opportunity | `REQUIRED_MVP` | desktop_web, mobile_web, ios, android | `src/loopdev/pages/crm/Leads.tsx`; `apps/mobile/components/MobileLeadDetailScreen.tsx` | `NOT_TESTED` — E4 tasks remain blocked; no platform journeys |

## ID reconciliation

The prior matrix used `LEADS-REQ-KANBAN`, `LEADS-REQ-DETAIL` and
`LEADS-REQ-CREATE`, which are absent from the ledger. Kanban is represented by
`LEADS-CAP-KANBAN` under `LEADS-REQ-LIST`; detail qualification is
`LEADS-REQ-QUALIFICATION`. Lead creation has no standalone ledger requirement
and is not counted as a separate delivery acceptance item until the ledger is
changed through its approved change-request process.

Historical run: `runs/MOD-LEADS-20260917-001/`. Its disposition is recorded in
[`DELIVERY_HISTORICAL_RUN_DISPOSITIONS.md`](../../../03-platform/governance/DELIVERY_HISTORICAL_RUN_DISPOSITIONS.md).
