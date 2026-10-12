# CRM Pipeline platform evidence matrix

Rows use the canonical delivery-ledger requirement IDs. Status reflects
preserved evidence; generic historical test summaries are not treated as
platform-specific acceptance results.

| Requirement | Desktop web evidence | Mobile web evidence | iOS evidence | Android evidence | Shared contract | Status | Owner | Gap/next action |
|---|---|---|---|---|---|---|---|---|
| `PIPELINE-REQ-BOARD` — stage board and forecast totals | `src/loopdev/pages/crm/Pipeline.tsx`; historical tests reported without requirement link | Mobile surface referenced; no pinned result | Not tested | Not tested | `packages/contracts/src/pipeline-capability.ts` | PARTIAL | CRM Platform | Record scoped renderer tests for every ledger-required platform. |
| `PIPELINE-REQ-MUTATION` — stage change with optimistic locking | `src/loopdev/pages/crm/Pipeline.tsx`; no scoped result | Mobile task exists; no pinned result | Not tested | Not tested | `packages/contracts/src/pipeline-capability.ts` | PARTIAL | CRM Platform | Record conflict and mutation tests per required platform. |
| `PIPELINE-REQ-REOPEN` — protected reopen with reason | No requirement-linked result | Mobile task exists; no pinned result | Not tested | Not tested | `packages/contracts/src/pipeline-capability.ts` | NOT_TESTED | CRM Platform | Verify permission and non-empty reason behavior per required platform. |
| `PIPELINE-REQ-SPEED-DIAL` — mobile contact actions | Not required by ledger | E4 task blocked; no structured journey | E4 task blocked; no structured journey | E4 task blocked; no structured journey | `packages/contracts/src/pipeline-capability.ts` | NOT_TESTED | CRM Platform | Capture passed E4 journeys on all required platforms, or approve a scope change. |
| `PIPELINE-REQ-DETAIL` — detail workstation and notes | Desktop route exists; no scoped result | `apps/mobile/components/MobileOpportunityDetailScreen.tsx`; no pinned result | Not tested | Not tested | `packages/contracts/src/pipeline-capability.ts` | PARTIAL | CRM Platform | Record detail, notes and navigation results on the ledger-required platforms. |

## Runtime snapshot

| Field | Value |
|---|---|
| Run | `MOD-PIPELINE-20260918-001` (`UNVERIFIED`) |
| Recorded branch and commit | `feature/crm-v2-foundation` at `9158813` |
| Runtime claims elsewhere in the workspace | `http://localhost:8081/app/sales-crm/pipeline` and `http://localhost:8082/` appear in earlier Pipeline records dated 2026-09-13; the audited 2026-09-18 run itself records no runtime URL or port. |
| Validation timestamp | `2026-09-18T11:04:42Z` |

The scope disagreement with `MOD-CRM-PIPELINE-20260913-002` and the historical
run disposition are documented in
[`DELIVERY_HISTORICAL_RUN_DISPOSITIONS.md`](../../../03-platform/governance/DELIVERY_HISTORICAL_RUN_DISPOSITIONS.md).
