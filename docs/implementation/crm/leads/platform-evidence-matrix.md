# Platform evidence matrix — CRM Leads

Status describes preserved evidence only. Source files and free-form historical
test claims do not count as platform runtime acceptance evidence.

| Requirement | Desktop web evidence | Mobile web evidence | Shared contract | Status | Owner | Gap/next action |
|---|---|---|---|---|---|---|
| `LEADS-REQ-LIST` — authorized listing, search and views | `src/loopdev/pages/crm/Leads.tsx` exists; no pinned journey | `apps/mobile/components/MobileLeadsScreen.tsx` exists; no pinned journey | `docs/06-product/crm/leads/CRM_LEAD_CONTRACT.md` | PARTIAL | CRM Delivery | Capture authenticated journeys for every required platform against one source snapshot. |
| `LEADS-REQ-PREVIEW` — quick preview | `src/loopdev/components/crm/LeadQuickPreviewDrawer.tsx`; no requirement-level runtime result | Not required by ledger | `docs/06-product/crm/leads/CRM_LEADS_UI_CONTRACT.md` | PARTIAL | CRM Delivery | Add a desktop component or runtime result to the next verified run. |
| `LEADS-REQ-SPEED-DIAL` — mobile actions | Not required by ledger | Mobile renderer exists; no E4 runtime journey | `docs/06-product/crm/leads/CRM_LEAD_CONTRACT.md` | NOT_TESTED | CRM Delivery | Supply E4 journeys on mobile_web, iOS and Android, or approve a scope change. |
| `LEADS-REQ-QUALIFICATION` — BANT and stage stepper | `src/loopdev/pages/crm/Leads.tsx`; no pinned journey | `apps/mobile/components/MobileLeadDetailScreen.tsx`; no pinned journey | `docs/06-product/crm/leads/CRM_LEAD_CONTRACT.md` | PARTIAL | CRM Delivery | Capture state and mutation behavior on every required platform. |
| `LEADS-REQ-CONVERT` — convert qualified lead | `src/loopdev/pages/crm/Leads.tsx`; E4 task blocked | `apps/mobile/components/MobileLeadDetailScreen.tsx`; E4 task blocked | `docs/06-product/crm/leads/CRM_LEAD_CONTRACT.md` | NOT_TESTED | CRM Delivery | Supply E4 conversion journeys on desktop_web, mobile_web, iOS and Android. |

## Runtime snapshot

| Field | Value |
|---|---|
| Run | `MOD-LEADS-20260917-001` (`UNVERIFIED`) |
| Recorded branch and commit | `feature/crm-v2-foundation` at `8b4d87f` |
| Runtime evidence | No URL or port recorded in the verification checkpoint |
| Validation timestamp | `2026-09-17T20:09:31Z` |

The run's current disposition and limits are documented in
[`DELIVERY_HISTORICAL_RUN_DISPOSITIONS.md`](../../../03-platform/governance/DELIVERY_HISTORICAL_RUN_DISPOSITIONS.md).
