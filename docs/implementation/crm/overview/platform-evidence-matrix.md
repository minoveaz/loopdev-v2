# Platform evidence matrix — CRM Overview

| Capability/operation | Domain parity | Desktop renderer/action | Mobile renderer/action | iOS | Android | Status | Owner | Gap/next action |
|---|---|---|---|---|---|---|---|---|
| Analytics KPI read | Partial analytics adapter in `src/loopdev/domains/platform/analytics/` | `src/loopdev/pages/crm/Overview.tsx`; remote/RLS behavior not runtime-verified | No overview renderer verified in `apps/mobile/` | Planned | Planned | PARTIAL | CRM Overview | Capture authenticated KPI and RLS evidence; implement or explicitly defer the mobile overview surface. |
| Pipeline breakdown | Partial current CRM analytics adapter | `src/loopdev/pages/crm/Overview.tsx`; health semantics need verification | No overview renderer verified in `apps/mobile/` | Planned | Planned | PARTIAL | CRM Overview | Define and test pipeline health semantics, then capture desktop and mobile behavior. |
| Tasks compact read | Shared task contracts in `packages/contracts/src/tasks.ts` | Overview task summary is not verified; full workspace is out of scope | No compact overview task renderer verified | Planned | Planned | NOT_TESTED | CRM Overview | Specify the compact read contract and verify it without embedding the full task workspace. |
| Activity summary | Shared activity contracts and timeline adapter | Overview activity summary is not verified | No compact overview activity renderer verified | Planned | Planned | NOT_TESTED | CRM Overview | Define activity taxonomy/deduplication and capture the authenticated summary journey. |
| Notes and Files contextual surfaces | Shared Notes/Files contracts | Not part of the default Overview surface | Not part of the default mobile Overview surface | Planned | Planned | N/A | CRM Overview | Keep on record-detail routes; revisit only if Overview scope is approved to include them. |
| Document Intelligence exclusion | Shared document lifecycle events exist | Overview allowlist behavior is not verified | Mobile Overview allowlist behavior is not verified | Planned | Planned | NOT_TESTED | CRM Overview | Add allowlist coverage proving Document Intelligence content is excluded from the Overview summary. |

## Runtime snapshot

| Field | Value |
|---|---|
| Repository | `/Users/minoveaz/Documents/Proyectos/loopdev-v2` |
| Checkout | branch |
| Branch/HEAD | `feature/crm-v2-foundation` / `e9ca052` |
| Runtime | not started in this planning run |
| Validation timestamp | 2026-09-27T17:26:05+02:00 |
