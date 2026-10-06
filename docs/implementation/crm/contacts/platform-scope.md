---
platform_scope:
  desktop_web: required
  mobile_web: required
  ios: planned
  android: planned
status: blocked
owner: delivery
---

# Contacts platform scope

| Surface | In scope? | Route/runtime | Owner | Decision/evidence |
|---|---|---|---|---|
| Desktop web | Yes | `/app/sales-crm/contacts` | CRM owner | Required by product baseline |
| Mobile web / Expo Web | Yes | `/app/sales-crm/contacts` | CRM owner | Required for parity; verification pending |
| iOS | Planned | Expo native target | Mobile owner | Physical runtime evidence pending |
| Android | Planned | Expo native target | Mobile owner | Physical runtime evidence pending |

## Deferred or unsupported capabilities

| Capability | Reason | Risk | Owner | Follow-up |
|---|---|---|---|---|
| Native runtime verification | No physical-device evidence in historical run | Native regressions remain unknown | Mobile owner | Add to approved implementation plan |
| Complete desktop/mobile parity | Capability ledger not yet approved | Behavior may diverge | CRM owner | Resolve in discovery and design |