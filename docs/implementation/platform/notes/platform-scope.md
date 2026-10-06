---
platform_scope:
  desktop_web: required
  mobile_web: required
  ios: planned
  android: planned
status: design
owner: Platform
---

# Platform scope

## Surface decision

| Surface | In scope? | Route/runtime | Owner | Decision/evidence |
| --- | --- | --- | --- | --- |
| Desktop web | Yes | `http://127.0.0.1:8082/app/sales-crm/contacts/:contactId` | Platform | Existing Customer 360 surface; operation parity pending port |
| Mobile web / Expo Web | Yes | `http://127.0.0.1:8083/app/sales-crm/contacts/:contactId` | Platform | Existing mobile surface; Notes count only |
| iOS | Planned | future native build | Platform | No native source/build evidence in this run |
| Android | Planned | future native build | Platform | No native source/build evidence in this run |

## Shared contract decisions

| Concern | Shared source | Desktop adaptation | Mobile adaptation | Evidence |
| --- | --- | --- | --- | --- |
| Domain and lifecycle | `packages/contracts/src/notes.ts` (planned) | Platform panel via adapter | Mobile list/editor via adapter | Design artifact |
| Navigation and deep links | Customer 360 contact route | Existing contact detail | Existing mobile contact detail | Design artifact |
| Permissions and tenant scope | NotesPort plus server authority | Reflect results | Reflect results | Access phase |
| Offline and synchronization | Shared sync result contract | Local adapter | Mobile local adapter | Sync phase |

## Deferred or unsupported surfaces

| Surface/capability | Reason | Risk | Owner | Follow-up issue |
| --- | --- | --- | --- | --- |
| iOS/Android renderer | No native source/build in scope | Future parity gap | Platform | Follow-up in approved plan |
| Remote API | This run defines contract only | Persistence migration risk | Platform | Follow-up in API/sync plan |
