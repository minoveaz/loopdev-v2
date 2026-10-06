---
platform_scope:
  desktop_web: required
  mobile_web: required
  ios: planned
  android: planned
status: blocked
owner: Communications
---

# Platform scope — CRM Communications

## Surface decision

| Surface | In scope? | Route/runtime | Owner | Decision/evidence |
|---|---|---|---|---|
| Desktop web | Yes | `src/loopdev/pages/crm/Communications.tsx`; runtime journey not verified | Communications | `README.md` documents the inbox scope; authenticated organization and actor context still require runtime evidence. |
| Mobile web / Expo Web | Yes | `apps/mobile/components/communications/`; runtime journey not verified | Communications | Mobile inbox is partial; no parity or outbound dispatch claim is made. |
| iOS | Planned | No native runtime evidence | Communications | Deferred until mobile web scope and authenticated behavior are verified. |
| Android | Planned | No native runtime evidence | Communications | Deferred until mobile web scope and authenticated behavior are verified. |

## Shared contract decisions

| Concern | Shared source | Desktop adaptation | Mobile adaptation | Evidence |
|---|---|---|---|---|
| Domain and lifecycle | `docs/06-product/communications/` and `src/loopdev/domains/communications/` | Inbox and outbound message surface | Partial inbox and conversation context components | `README.md`; runtime/regression evidence remains blocked. |
| Navigation and deep links | `src/routes/LoopdevRoutes.tsx` and `apps/mobile/App.tsx` | Communications route | Mobile communications components | Direct-route behavior has not been captured. |
| Permissions and tenant scope | Authenticated Supabase adapter and database RLS policies | Organization/actor context must be verified | Organization/actor context must be verified | Authenticated same-tenant journey remains an explicit release blocker. |
| Offline and synchronization | Communications adapters and collaboration state | No offline parity claim | No offline parity claim | Recovery and synchronization evidence is not captured. |

## Deferred or unsupported surfaces

| Surface/capability | Reason | Risk | Owner | Follow-up issue |
|---|---|---|---|---|
| Native iOS and Android | Native runtime scope is planned, not implemented/verified | Platform parity is incomplete | Communications | Capture only after mobile web verification and product approval. |
| Outbound dispatch policy | Server-side worker, kill switch, and template policy require runtime proof | Messages could bypass operational controls if unverified | Communications | Resolve the blockers recorded in `README.md` and `review.md`. |
