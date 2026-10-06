# Platform evidence matrix

| Capability/operation | Domain parity | Desktop renderer/action | Mobile renderer/action | iOS | Android | Status | Owner | Gap/next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Task list, detail, and updates | Shared task model in `packages/contracts/src/tasks.ts` and `src/loopdev/domains/tasks/types.ts` | `src/loopdev/pages/crm/Tasks.tsx` and shared task workspace components | `apps/mobile/components/MobileTasksScreen.tsx` | Planned; native runtime not verified | Planned; native runtime not verified | PARTIAL | Platform Tasks | Capture authenticated cross-platform list/detail/update journeys, including tenant authorization and offline recovery. |
| Task creation and assignment | Shared task adapter contracts; persistence parity is unverified | `src/loopdev/components/crm/tasks/QuickTaskModal.tsx` | `apps/mobile/components/MobileTasksScreen.tsx`; creation/assignment parity not verified | Planned; native runtime not verified | Planned; native runtime not verified | NOT_TESTED | Platform Tasks | Verify create/assign flows against the same organization and actor context on desktop and mobile. |

`PASS` requires verified domain, renderer and operations on every required
platform. A shared port, a visible section or a registered route alone does not
prove action parity.

## Runtime snapshot

| Field | Value |
| --- | --- |
| Repository path | `/Users/minoveaz/Documents/Proyectos/loopdev-v2` |
| Checkout type | `branch` |
| Branch and HEAD | `feature/crm-v2-foundation` at `b04b36e` |
| Desktop URL/port | Not started for this validation |
| Mobile URL/port | Not started for this validation |
| Validation timestamp | `2026-10-06T19:52:46Z` |

## Validation commands

| Command | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `npm run validate:mobile-boundaries` | PASS | Successful local run at `2026-10-06T19:52:46Z` | Architecture boundary check only; functional journeys remain unverified. |
