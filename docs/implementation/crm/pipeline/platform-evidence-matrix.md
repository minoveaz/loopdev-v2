# CRM Pipeline platform evidence matrix

| Requirement | Desktop web evidence | Mobile web evidence | iOS evidence | Android evidence | Shared contract | Status | Owner | Gap/next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pipeline navigation | `/app/sales-crm/pipeline` (route/tests) | Mobile navigation contract | Planned | Planned | `packages/contracts/src/navigation.ts` | PARTIAL | Platform Delivery | Add mobile pipeline surface |
| Pipeline board behavior | Existing Pipeline route and tests | Not tested | Not tested | Not tested | `packages/contracts/src/navigation.ts` | PARTIAL | CRM Platform | Implement and verify mobile states |
| Permission and tenant scope | `access-design.md` | Not tested | Not tested | Not tested | `docs/06-product/crm/CRM_COMPONENT_CONTRACTS.md` | PARTIAL | Security owner | Verify deep links and mobile mutation guards |

## Runtime snapshot

| Field | Value |
| --- | --- |
| Repository path | `/Users/minoveaz/Documents/Proyectos/loopdev-v2` |
| Checkout type | `branch` |
| Branch and HEAD | `feature/crm-v2-foundation` |
| Desktop URL/port | `http://localhost:8081/app/sales-crm/pipeline` |
| Mobile URL/port | `http://localhost:8082/` |
| Validation timestamp | `2026-09-13` |
