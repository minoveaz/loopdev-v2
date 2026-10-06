---
platform_scope:
  desktop_web: required
  mobile_web: required
  ios: planned
  android: planned
status: blocked
owner: Platform
---

# Platform scope — CRM Foundation Parity

## Surface decision

| Surface | In scope? | Route/runtime | Owner | Decision/evidence |
|---|---|---|---|---|
| Desktop web | Yes | Shared Platform adapters and CRM consumers; authenticated runtime not verified for Tasks, Timeline, and Catalog | Platform | `README.md` records the remaining adapter parity blocker. |
| Mobile web / Expo Web | Yes | `apps/mobile/`; offline transition/recovery and native/runtime route evidence not captured | Platform | Mobile Files safeguards are implemented; broader parity remains blocked. |
| iOS | Planned | No native runtime evidence | Platform | Deferred pending shared web parity and runtime verification. |
| Android | Planned | No native runtime evidence | Platform | Deferred pending shared web parity and runtime verification. |

## Shared contract decisions

| Concern | Shared source | Desktop adaptation | Mobile adaptation | Evidence |
|---|---|---|---|---|
| Domain and lifecycle | `packages/contracts/` and `src/loopdev/domains/platform/` | Platform adapters and CRM consumers | `apps/mobile/adapters/` | `README.md`; module runtime verification remains incomplete. |
| Navigation and deep links | `src/routes/LoopdevRoutes.tsx` and `apps/mobile/App.tsx` | Shared Platform routes | Mobile navigation and screens | Direct native/runtime route evidence is still open. |
| Permissions and tenant scope | Authenticated Supabase adapters and RLS policies | Tasks, Timeline, and Catalog authenticated smoke required | Tenant-scoped Files reads are implemented; remaining adapters need verification | Blocker FP-001 in `README.md`. |
| Offline and synchronization | Local adapters and mobile Files cache | Local fallback exists for selected capabilities | Recovery and synchronization transitions are not verified | Blocker FP-003 in `README.md`. |

## Deferred or unsupported surfaces

| Surface/capability | Reason | Risk | Owner | Follow-up issue |
|---|---|---|---|---|
| Native iOS and Android parity | Native runtime scope remains planned | Platform-specific behavior may diverge | Platform | Capture after desktop/mobile web parity is verified. |
| Tasks, Timeline, and Catalog authenticated runtime | Authenticated tenant read/write smoke evidence remains open | Tenant isolation and adapter parity are not release-verified | Platform | Resolve FP-001 in `README.md`. |
