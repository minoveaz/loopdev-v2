# ERP Core Architecture and Design

## Document control

| Field | Value |
|---|---|
| Module | Cross-sector ERP Core capability map |
| Product definition | `design.md`; `docs/06-product/products/PRODUCT_CATALOG_GLOBAL_TRACK.md` |
| Run ID | `MOD-CORE-20261024-001` |
| Track | Products/categories first release approved; implementation track pending plan approval |
| Design checkpoint | `runs/MOD-CORE-20261024-001/01-design.json` |
| Owner | @loopdev-io (Product Owner); Platform audit owner pending assignment |
| Status | `Products/categories plus non-accounting purchase-cost reference approved; updated domain/access/API/sync audits and plan approval required before build` |

## Target architecture

### Context and boundaries

- **Suite and bounded context:** ERP suite. Products is the existing partial
  context and the only first-release module. Suppliers is a separate ERP
  context; Shopify, Inhand, Sales, Procurement, Inventory, Finance and
  Reporting are deferred from this release.
- **Owned responsibilities:** ERP-owned operational records and rules after
  each module is approved; source of truth must be declared per entity and
  channel.
- **Explicitly out of scope:** CRM relationship history, Platform
  collaboration primitives, provider secrets, public storefront rendering
  inside authenticated ERP, and statutory accounting before jurisdiction
  approval.
- **Current routes:** `/app/erp/overview` and legacy
  `/app/erp/product-catalog`. The canonical target is `/app/erp/products`;
  this route and its compatibility redirect are not implemented yet. Other
  module routes are proposals only.
- **Consumers:** CRM, Communications, future ERP contexts and public channels
  through stable IDs and versioned contracts.
- **Consumed Platform capabilities:** organization/membership, authorization,
  Notes, Files, Tasks, Activity, Relations, Document Intelligence Core where
  approved, Rivera UI and shell.
- **Products presentation:** the approved product/SKU record and create/edit
  flows are full pages; AppDrawer is limited to quick auxiliary-reference
  creation/preview. The purchase-cost reference is a separate sensitive
  product capability, not a sales-price field.

### Layer map

| Layer | Responsibilities | Files/areas | Allowed dependencies | Forbidden dependencies |
|---|---|---|---|---|
| Presentation | ERP route pages and view composition | `src/loopdev/pages/erp/`, `src/routes/LoopdevRoutes.tsx` | Application hooks and shared UI | Domain rules, SQL, credentials |
| Application | Command/query orchestration and permission-aware use cases | Proposed ERP application/domain hooks | Domain and ports | React rendering and transport details |
| Domain | Product/service, supplier, sales, inventory, procurement and finance invariants per approved context | Existing `src/loopdev/domains/catalog/` is the current technical implementation for Products; the confirmed item classes, independent operational uses, product-base and SKU-level categories, and variant sourcing inheritance are design decisions, not implemented contracts | Value objects, domain events, ports | UI, Supabase client, provider SDK |
| Ports/contracts | Stable commands, queries, errors, events and capability semantics | Existing catalog types and operation IDs remain compatibility contracts; future canonical Products contracts proposed under `packages/contracts/src/` | Domain and adapter interfaces | Platform-specific renderers |
| Adapters/infrastructure | Local/remote persistence and provider integrations | Existing catalog adapters; future adapters proposed | Ports, auth/RLS and provider SDKs server-side | Direct UI dependencies on provider implementations |

### Dependency direction

```text
Presentation → Application → Domain → Ports ← Adapters
```

| Exception | Reason | Risk | Approval | Follow-up |
|---|---|---|---|---|
| Existing Products UI-to-catalog-adapter paths may not follow the target layering | Preserve current behavior until source audit identifies a safe refactor | Domain and transport may diverge | Not approved as a new pattern | Audit per capability before implementation |

## Responsibility matrix

| Concern | Authoritative owner | Consumers | Must not contain | Evidence |
|---|---|---|---|---|
| UI rendering | ERP presentation | ERP operators | Business rules or provider policy | Current route/source review; visual gate pending |
| Use cases/orchestration | ERP application layer | ERP UI, integrations | Page components or storage implementation | Proposed; later tests required |
| Domain rules/invariants | Owning ERP bounded context | Other contexts through contracts | Cross-context database writes | Domain phase pending |
| Persistence | Adapter/infrastructure | Domain ports | UI components | Products module currently uses catalog-named local adapter + partial Supabase evidence |
| API/transport | ERP contracts and server adapters | Web, mobile web, public channel | Provider semantics in clients | API phase pending |
| Authorization/tenant scope | Platform + server/RLS enforcement | All ERP contexts | ERP-local tenant/membership or UI-only checks | Policy docs exist; source/runtime evidence needed |
| Synchronization/conflicts | Shared semantic contract; provider adapter owns mapping | Clients and external channels | Renderer-local merge/source-of-truth rules | Sync phase pending |
| Shared Platform capability | Platform | ERP records/workspaces | Local clone of notes/files/tasks/timeline | Platform UI reference and current exports |

## Module and Platform contracts

| Capability | Decision | Contract | Consumers | Duplicate prohibited? |
|---|---|---|---|---|
| Organization scope | `REUSE` | Organization/membership/RLS references | ERP modules and channels | Yes |
| CRM customer relationships | `REUSE` | CRM contacts and Customer 360 | Sales/finance references | Yes |
| Products | `REUSE` with audit | `CatalogAdapter` and product types (legacy names) | CRM and channels | Yes |
| Notes, Files, Activity, Tasks, Relations | `REUSE` | Current Platform contracts/components | ERP records | Yes |
| Document Intelligence | `REUSE` | Approved Document Intelligence Core handoff | Future invoice/document workflows | Yes |
| Suppliers | `MODULE_SPECIFIC` as an independent context; release priority open | No approved functional contract | Supplier profile is owned by ERP Suppliers; Procurement references its stable ID; CRM contact relationship requires domain review | Yes: do not embed supplier master data in Procurement |
| Sales, Procurement, Inventory, Finance, Reporting | `MODULE_SPECIFIC` | No approved functional contracts | Cross-context contracts TBD | Yes: no UI-owned business rules |
| Provider connection infrastructure | `REUSE`/deferred | No provider integration is in this release; shared boundary needs review before future work | Future Shopify and other providers | Yes: no isolated core per connector |

## Structural quality baseline

- [x] Cohesion/coupling risk: broad "ERP Core" can become a monolith; keep
  candidate bounded contexts independent.
- [x] SRP risk: channel adapters must not own ERP product/order policy.
- [x] Duplication risks identified for CRM identity, Platform collaboration
  and product master data; supplier identity must remain distinct from CRM-owned customer
  relationship history.
- [x] Public contract boundaries and dependency direction documented in
  `design.md`.
- [ ] Mandatory architecture-boundary, responsibility, platform-reuse and
  refactor-safety audits must close before the first implementation task.
- [x] Domain/application behavior must be testable without React or Supabase.
- [x] Tenant, authorization and synchronization ownership documented;
  detailed policies await specialized phases.
- [x] Residual debt: Products remote parity, audit contract, adapter mode and
  legacy permission naming; tracked under issue #36 and the approved plan.

## Refactoring records

| ID | Reason | Behavior preserved | Files/consumers | Risk | Before evidence | After evidence | Rollback | Residual debt |
|---|---|---|---|---|---|---|---|---|
| ARCH-ERP-001 | Separate candidate ERP contexts | Keep modular ownership across a cross-sector product | ERP modules and channels | High if cross-context writes emerge | Discovery source audit | Products/categories first-release scope approved; follow-ups excluded | Restrict writes to owning context; contract tests | Future ERP module boundaries require separate discovery |
| ARCH-ERP-002 | Reconcile Products compatibility/permission mismatch | Avoid local/remote behavior divergence | Products and current CRM references | High | Adapter/migration evidence | Canonical permission decision is `catalog.write`; no implementation yet | Keep remote writes disabled until migration and deployed RLS verification | Forward migration and permission parity |
| ARCH-ERP-003 | Define a sector-neutral Products master without merging operational uses into item class | Preserve one shared master for products, components and services | Products, CRM and future ERP/channel consumers | Medium | `discovery.md` and `CR-ERP-PRODUCT-MASTER-MODEL` | Approved conceptual model; field contracts not implemented | Keep existing catalog model unchanged until domain/API migration is approved | Resolve legacy grouping and map approved concepts in `02-domain` |

## Open decisions and deviations

| ID | Decision or deviation | Status | Impact | Approver | Resolution/follow-up |
|---|---|---|---|---|---|
| ERP-OD-006 | First-release module set | Resolved | High | Product owner | Products/categories only; all other modules/integrations deferred (`CR-ERP-PRODUCTS-FIRST-RELEASE`) |
| ERP-DEC-004 | The existing catalog-facing ERP module is renamed Products; product/service records become the direct list entry point while catalog-named IDs/contracts remain compatible | Confirmed | High | Product owner | CR-ERP-PRODUCTS-MODULE; visual source updated; runtime route migration remains unimplemented |
| ERP-DEC-005 | One Products master distinguishes finished products, raw materials/components and services; operational uses are independent; the product base has a general category and separately managed variants/SKUs have independently assigned categories; finished products allow buy/make/both sourcing, raw materials/components buy only for now, and services have no sourcing; variants inherit the product's sourcing; semimanufactured items await Manufacturing discovery | Confirmed | High | Product owner | User-confirmed product model; revisit raw-material sourcing during Manufacturing discovery; no runtime field/model changes authorized |
| ERP-DEC-006 | Each separately managed/sold variant is a specific SKU with its own primary category, which may differ from the product base and sibling variants; drafts may omit it, but activation requires it | Confirmed | High | Product owner | User decisions recorded in `domain-model.md`; no category inheritance or runtime field/model changes authorized |
| ERP-DEC-007 | SKU is unique across the organization after trimming outer whitespace and comparing case-insensitively; stored SKU preserves entered case | Confirmed | High | Product owner | User decision recorded in `domain-model.md`; product, variant and category keys are generated, immutable and organization-unique |
| ERP-DEC-008 | `OrganizationCatalog` is legacy migration input only, not a target business entity or Products ownership boundary | Confirmed | High | Product owner | User decision recorded in `domain-model.md`; preserve legacy records while mapping fields and references |
| ERP-DEC-003 | Suppliers is a standalone ERP module, separate from Procurement; manufacturing remains for later discovery | Confirmed | High | Product owner | Supplier priority/date and functional scope remain open; manufacturing is outside the current roadmap |
| ERP-OD-007 | Supplier module priority, release timing and functional scope | Resolved for this release | Medium | Product owner | Suppliers remains separate but deferred; later scope is future discovery |
| ERP-DEC-009 | Commercial price currency is owned by each `PriceBook`; migrate legacy `OrganizationCatalog` currency into applicable books | Confirmed | High | Product owner | User decision recorded in `domain-model.md`; reconcile legacy `Offer.currency` before implementation |
| ERP-OD-008 | Where legacy OrganizationCatalog locale and channel fields belong | Resolved for this release | Low | Product owner | Preserve as migration provenance; defer destination ownership to localization/channel work |
| ERP-DEC-010 | Each `PriceEntry` uses its `PriceBook` currency; it cannot override the book currency | Confirmed | High | Product owner | User decision recorded in `domain-model.md`; legacy entry-currency mismatches need explicit migration handling |
| ERP-DEC-011 | `Offer` has no independent currency; offer prices use the currency of the associated `PriceBook` | Confirmed | High | Product owner | User decision recorded in `domain-model.md`; migrate/retire legacy `Offer.currency` |
| CR-ERP-PRODUCT-EDITOR-COST-REFERENCE | Full-page product/SKU record and editor; non-accounting unit purchase-cost reference and physical attributes | Confirmed | High | Product owner | Approved 2026-10-24; update domain, access, API and sync contracts before plan/build |
| VD-ERP-COST-002 | Cost visibility, currency, source/history and product-to-SKU default behavior | Open | High | Product owner + ERP/Platform | Default deny under `catalog.read`; define sensitive permission and audit semantics |
| VD-ERP-DATA-002 | Full brand/tag reference-data lifecycle and navigation | Open | Medium | Product owner + ERP domain | Quick create is approved; decide controlled values and full manager surface |
| ERP-CF-001 | Products data remote runtime/documentation | Execution gate | High | ERP/Platform | Read-only deployed-state check; reconcile docs/runtime; no remote writes until verified |
| ERP-CF-002 | Products permission compatibility | Resolved decision; implementation pending | High | Platform access owner | Use `catalog.write`; forward-migrate remote grants/RLS and add parity tests |
| ACC-ERP-011 | Shared append-only audit contract | Owner approval pending | Critical | Platform owner (unassigned) | Approve and implement shared contract before Products remote writes |
| MIG-ERP-001 | Legacy data mapping | Data-access pending | High | Product owner + Platform data owner | Obtain authorized inventory and dry-run review before mapping/cutover |
| ERP-OD-002 | MiauCraft Shopify ownership/sync | Open | High | MiauCraft + product owner | Client mapping discovery; default read-only |
| ERP-OD-003 | Inhand market/tax/fulfillment/returns | Open | High | Inhand + product owner | Resolve before native commerce plan |
