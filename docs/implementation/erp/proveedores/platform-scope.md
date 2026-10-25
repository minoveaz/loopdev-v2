---
platform_scope:
  desktop_web: required
  mobile_web: required
  ios: excluded
  android: excluded
status: approved_with_implementation_decisions
owner: "Product-approved direction; route location confirmed, country tax evidence remains open"
---

# Platform scope

## Surface decision

| Surface | In scope? | Route/runtime | Owner | Decision/evidence |
| --- | --- | --- | --- | --- |
| Desktop web | Yes; responsive ERP web | `ERP > Proveedores` selected; route not implemented | Product direction confirmed; route audit remains | User decision recorded in `runs/MOD-PROVEEDORES-20261025-001/06-plan.json` |
| Mobile web | Yes; responsive web, not a native app | `ERP > Proveedores` selected; route not implemented | Product direction confirmed; route audit remains | User decision recorded in `runs/MOD-PROVEEDORES-20261025-001/06-plan.json` |
| iOS | No; native app excluded for now | Not applicable | Product direction confirmed | User explicitly excluded native mobile development |
| Android | No; native app excluded for now | Not applicable | Product direction confirmed | User explicitly excluded native mobile development |

## Shared contract decisions

| Concern | Shared source | Desktop adaptation | Mobile adaptation | Evidence |
| --- | --- | --- | --- | --- |
| Domain and lifecycle | User approved `active/on_hold/inactive`, no hard delete, Product-or-variant offers and Spain/US/Colombia; exact tax-field rules remain a Finance/Legal task | Same domain operations | Same operations, responsive layouts and touch targets | `discovery.md`; `delivery-ledger.json`; plan checkpoint |
| Navigation and deep links | ERP routes/navigation; location confirmed as `ERP > Proveedores`, route not implemented | ERP navigation entry and directory/detail patterns to be verified against the shell | Responsive ERP navigation; preserve operation availability | `runs/MOD-PROVEEDORES-20261025-001/06-plan.json`; `src/routes/LoopdevRoutes.tsx`; `src/loopdev/navigation.ts` |
| Product ownership and intake | Products owns canonical internal catalog items; Supplier catalog records link to Products | Supplier item can link to existing or start Products create flow | Same behavior adapted to narrow viewport | `src/loopdev/domains/catalog/adapter/index.ts`; `discovery.md` |
| Permissions and tenant scope | Supplier-specific read grant maps to the same Products readers; management maps to Products writers; owner/admin verifies with a separate actor; do not broaden Products `catalog.read` | Server-enforced organization scope and same action semantics | Same authorization and visible action rules | `discovery.md`; plan checkpoint; `../core/access-model.md` |
| Offline and synchronization | Real tax/bank data is server-authoritative and protected; never in clear local storage/cache and unavailable offline; local fixtures synthetic | Non-sensitive data may use approved offline behavior; no sensitive mutation queue | Same sensitive-data restriction; touch-compatible recovery for allowed non-sensitive operations | `discovery.md`; plan checkpoint; multiplatform contract |
| Accessibility and interaction | Shared LoopDev UI patterns; no Supplier renderer exists | Keyboard, focus, loading/empty/error states | Touch targets, viewport behavior, mobile navigation and no horizontal overflow | UI and shell references; module design follow-up |

## Deferred or unsupported surfaces

| Surface/capability | Reason | Risk | Owner | Follow-up issue |
| --- | --- | --- | --- | --- |
| Native iOS and Android | Explicitly excluded by user | Later native work would need its own product approval and platform evidence | Product owner | None |
| Country-specific tax rules | Exact required identifiers, formats and conditional fields need Finance/Legal evidence | Do not invent country-specific legal validation | Finance/Legal | `SUPPLIER-COUNTRY-TAX-RULES` remains blocked |
| Purchase orders, receipts, invoices, payments | Required downstream workflows owned by Procurement, Inventory and Finance, not Supplier-card transactions | If not scoped separately, users may mistake Supplier defaults for actual order, stock, payable or settlement history | Product owner | None |
