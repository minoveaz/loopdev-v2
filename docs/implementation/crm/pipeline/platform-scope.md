---
platform_scope:
  desktop_web: required
  mobile_web: required
  ios: planned
  android: planned
status: paused
owner: Platform Delivery
---

# CRM Pipeline platform scope

| Surface | In scope? | Route/runtime | Owner | Decision/evidence |
| --- | --- | --- | --- | --- |
| Desktop web | Yes | `/app/sales-crm/pipeline` | CRM | Existing route and Rivera runtime |
| Mobile web / Expo Web | Yes | Mobile shell preview | Mobile | Launchpad mobile foundation |
| iOS | Planned | Native build not started | Mobile | Follow-up after mobile web parity |
| Android | Planned | Native build not started | Mobile | Follow-up after mobile web parity |

## Shared contract decisions

| Concern | Shared source | Desktop adaptation | Mobile adaptation | Evidence |
| --- | --- | --- | --- | --- |
| Domain and lifecycle | CRM pipeline domain artifacts | Kanban/table density | Touch-safe cards and navigation | `domain-model.md` |
| Navigation and deep links | Shared navigation contract | React Router route | Mobile shell route state | `packages/contracts/src/navigation.ts` |
| Permissions and tenant scope | Access design | Route and action guards | Same semantics with adapted UI | `access-design.md` |
| Offline and synchronization | Sync design | Local adapter | Mobile policy to be verified | `sync-design.md` |

## Deferred surfaces

| Surface/capability | Reason | Risk | Owner | Follow-up |
| --- | --- | --- | --- | --- |
| iOS/Android native pipeline | Native app delivery has not started | Mobile parity may drift | Mobile | Create native pilot issue |
