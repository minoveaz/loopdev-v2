# Platform evidence matrix — CRM Leads

| Requirement | Desktop web evidence | Mobile web evidence | Shared contract | Status | Owner | Gap/next action |
|---|---|---|---|---|---|---|
| Lead listing and search | `src/loopdev/pages/crm/Leads.tsx` | `apps/mobile/components/MobileLeadsScreen.tsx` | `docs/06-product/crm/CRM_MULTIPLATFORM_PARITY_ROADMAP.md` | PARTIAL | CRM Delivery | Capture authenticated desktop and mobile journeys, including loading, empty, error, and tenant-scoped states. |
| Pipeline stage browsing | `src/loopdev/components/crm/LeadKanbanBoard.tsx` | `apps/mobile/components/MobileLeadsScreen.tsx` stage filters | `docs/06-product/crm/CRM_MULTIPLATFORM_PARITY_ROADMAP.md` | PARTIAL | CRM Delivery | Verify stage parity and update behavior in an authenticated runtime journey. |
| Lead quick inspection | `src/loopdev/components/crm/LeadQuickPreviewDrawer.tsx` | `apps/mobile/components/MobileLeadDetailScreen.tsx` | `docs/06-product/crm/CRM_MULTIPLATFORM_PARITY_ROADMAP.md` | PARTIAL | CRM Delivery | Record responsive and direct-route behavior with tenant authorization evidence. |
| Speed-dial actions | `src/loopdev/pages/crm/LeadDetail.tsx` | `apps/mobile/components/MobileLeadDetailScreen.tsx` | `docs/06-product/crm/CRM_MULTIPLATFORM_PARITY_ROADMAP.md` | NOT_TESTED | CRM Delivery | Capture actual `tel:` and `mailto:` action journeys on supported desktop and mobile browsers. |
| Lead conversion | `src/loopdev/pages/crm/LeadDetail.tsx` conversion action | `apps/mobile/components/MobileLeadDetailScreen.tsx` conversion action | `docs/06-product/crm/CRM_MULTIPLATFORM_PARITY_ROADMAP.md` | NOT_TESTED | CRM Delivery | Supply the blocked E4 conversion journey and verify resulting customer/deal relations. |
| Lead creation | `src/loopdev/pages/crm/Leads.tsx` | `apps/mobile/components/MobileCreateLeadScreen.tsx` | `docs/06-product/crm/CRM_MULTIPLATFORM_PARITY_ROADMAP.md` | NOT_TESTED | CRM Delivery | Capture the blocked E4 creation journey, validation errors, and persisted tenant-scoped record. |

## Runtime snapshot

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/Documents/Proyectos/loopdev-v2` |
| Checkout type | `branch` |
| Branch and HEAD | `feature/crm-v2-foundation` at `b04b36e` |
| Desktop URL/port | Not started for this validation |
| Mobile URL/port | Not started for this validation |
| Validation timestamp | `2026-10-06T19:52:46Z` |

## Validation commands

| Command | Result | Evidence | Notes |
|---|---|---|---|
| `npm run validate:mobile-boundaries` | PASS | Successful local run at `2026-10-06T19:52:46Z` | Repository boundary check; it does not substitute for the pending UI journeys above. |
