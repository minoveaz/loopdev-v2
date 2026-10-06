---
title: Legacy to LoopDev v2 documentation map
status: current-governance
owner: platform
---

# Legacy to LoopDev v2 documentation map

This map keeps historical vocabulary traceable while directing delivery to
current V2 authorities. Archived material is evidence of history only; it is
not an implementation source or approval.

| Legacy or archive reference | Current V2 authority |
| --- | --- |
| `docs/06-product/archive/**` | `docs/06-product/README.md`, the applicable active suite README, and the active track |
| `tracks/closed/**` | The corresponding `tracks/active/**` track, or no current authority if none exists |
| Legacy CRM handoffs, audits, and UX references | `docs/06-product/crm/README.md`, `CRM_FRONTEND_CLOSURE_MATRIX.md`, and `CRM_UI_COMPONENT_PROTOCOL.md` |
| `CRM_COMPONENT_CATALOG.md` historical rows | Current routes, source/tests, closure matrix, and active implementation checkpoints |
| `/sales-crm/*` and `apps/loopdev-os` route vocabulary | `/app/sales-crm/*` and the current `src/loopdev/pages/crm` route evidence |
| `packages/contracts` or legacy backend-first references | Current V2 domain/adapters and approved product contracts; verify implementation before claiming runtime support |
| Legacy shared-component names | `docs/03-platform/frontend/PLATFORM_V2_UI_REFERENCE.md` plus the importing source and tests |
| Legacy shell terminology | `docs/03-platform/frontend/PLATFORM_V2_SHELL_REFERENCE.md` plus current route/source evidence |

## Route and status rules

- A legacy route name may explain historical evidence, but it does not make
  that route active.
- An archived contract may explain intent or past decisions, but cannot
  authorize a new implementation.
- Current route, runtime, and implementation claims require source/test or
  checkpoint evidence in the V2 checkout.
- If the map does not identify a current authority, classify the item as
  unresolved and pause the delivery gate rather than guessing.

Read `V2_DOCUMENTATION_SOURCE_OF_TRUTH.md` before using this map.
