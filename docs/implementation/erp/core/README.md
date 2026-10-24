# ERP Core Capability Map

## References

- Product definition: `docs/06-product/products/PRODUCT_CATALOG_GLOBAL_TRACK.md` plus user-confirmed cross-sector SME target; first release remains open
- Track: pending first-release approval; create the canonical ERP track after product scope is approved
- Run ID: `MOD-CORE-20261024-001`
- Main issue: [minoveaz/loopdev-v2#36](https://github.com/minoveaz/loopdev-v2/issues/36)
- Multiplatform contract: `docs/03-platform/governance/MULTIPLATFORM_DELIVERY_CONTRACT.md`
- Platform scope: `platform-scope.md`
- Platform evidence: `platform-evidence-matrix.md`
- Discovery: `discovery.md`
- Product and architecture design: `design.md`, `architecture-design.md` (draft)
- Domain model: `domain-model.md`
- Access model: `access-model.md`
- API contracts: `api-contracts.md`
- Synchronization model: `sync-model.md`
- Delivery ledger: `delivery-ledger.json`

## Current status

| Field | Value |
|---|---|
| Status | `blocked_on_decisions` |
| Current phase | `05-sync` completed with a partial handoff; do not start `06-plan` until open decisions and access blockers are resolved |
| Current issue | #36 |
| Branch | `feature/erp-core-capabilities` |
| Commit | `8204d0b` |
| Pull request | None |
| Last evidence | Visual gate approved; domain, access, API and sync analyses are complete with documented partials and blockers, 2026-10-24 |

## Scope

### Platform scope

| Surface | Scope | Owner | Evidence |
|---|---|---|---|
| Desktop web | Required | ERP product owner (individual pending) | Current ERP routes exist |
| Mobile web | Required | ERP product owner (individual pending) | Mobile operations still need evidence |
| iOS | Planned; not approved | Owner pending | Native client applicability is open |
| Android | Planned; not approved | Owner pending | Native client applicability is open |

### Included

- Map ERP capabilities and boundaries with Platform, CRM and public channels.
- Treat Products as the ERP master-data module; the current catalog-named
  implementation is legacy technical evidence whose persistence/permission
  behavior still needs verification.
- Treat Suppliers as an independent ERP module; its functional scope, priority and delivery date remain open.
- Prioritize discovery/design of MiauCraft's Shopify-connected path.
- Place Inhand's native backend after the MiauCraft pilot.

### Excluded

- Approval or implementation of a full ERP, general ledger, advanced procurement/WMS or a generic storefront builder.
- Manufacturing; revisit only through future discovery and product approval.
- Replacing Shopify for MiauCraft or processing payment-card data in LoopDev.

## Phase index

| Phase | Issue | Status | Checkpoint | Evidence |
|---|---:|---|---|---|
| 00-discovery | #36 | `completed` (`partial` handoff) | `runs/MOD-CORE-20261024-001/00-discovery.json` | `discovery.md`, `delivery-ledger.json`, platform matrices |
| 01-design | #36 | `approved` | `runs/MOD-CORE-20261024-001/01-design.json` | `design.md`, `architecture-design.md` |
| 01-visual-design | #36 | `approved` | `runs/MOD-CORE-20261024-001/01-visual-design.json` | `visual-design.md`, `view-state-matrix.md`, five SVGs under `wireframes/` |
| 02-domain | #36 | `completed` (`partial` analysis) | `runs/MOD-CORE-20261024-001/02-domain.json` | `domain-model.md`, `runs/MOD-CORE-20261024-001/02-domain.md` |
| 03-access | #36 | `completed` (`partial` analysis) | `runs/MOD-CORE-20261024-001/03-access.json` | `access-model.md`, `runs/MOD-CORE-20261024-001/03-access.md` |
| 04-api | #36 | `completed` (`partial` analysis) | `runs/MOD-CORE-20261024-001/04-api.json` | `api-contracts.md`, `runs/MOD-CORE-20261024-001/04-api.md` |
| 05-sync | #36 | `completed` (`partial` analysis) | `runs/MOD-CORE-20261024-001/05-sync.json` | `sync-model.md`, `runs/MOD-CORE-20261024-001/05-sync.md` |
| 10-git | #36 | `deviated` (local checkpoint only; release gate pending) | `runs/MOD-CORE-20261024-001/10-git.json` | `8204d0ba4211d3e37a5f048248f7c7b41de4dfec` |

## Visual gate

The visual source audits the implemented ERP routes and reusable Platform
components, including the actual form composition and tests. The first SVG
palette/sidebar proposal was rejected; the current revision maps the light
HSL tokens, sidebar, navigation and card surfaces to current LoopDev source.
After the Product Owner's Products-module decision, the revised flow makes
products/services the direct list entry point and removes the standalone
catalog index from the proposed navigation. Existing catalog data structures,
IDs and routes remain compatibility evidence; no production code or data was
changed. The visual source now presents finished products,
raw materials/components and services in one Products master, with independent
purchase/sale/inventory uses, one primary hierarchical category, and
finished products allow buy/make/both sourcing, raw materials/components allow
buy only for now, and services have no sourcing; variants inherit product
sourcing. Categories are managed within
Products; the list opens a dedicated category-management view with a visible
return path, confirmed by the Product Owner and wireframed for desktop and
mobile. The Product Owner approved the full conceptual visual source on
2026-10-24; runtime comparison remains pending implementation.
Semimanufactured items and manufacturing operations remain deferred. The
visual source does not wireframe Sales, Purchasing, Inventory, Finance or
Shopify integration as committed first-release scope. Suppliers is a separate
candidate module, but its priority and delivery date remain open and it is not
included in these wireframes. `VD-ERP-013` is resolved; other visual/domain
decisions remain documented for their owning phases. Specialized analysis
completed `02-domain` through `05-sync` with partial handoffs. The run is
waiting for the decisions and access risks listed in the analysis artifacts;
do not start `module-plan` until those blockers are resolved.

## Decisions and blockers

| ID | Type | Decision/blocker | Status | Evidence |
|---|---|---|---|---|
| ERP-DEC-001 | Confirmed | Define ERP core map before client-specific implementation; prioritize MiauCraft then Inhand | Confirmed | Issue #36 |
| ERP-DEC-002 | Confirmed | Inhand starts with physical goods, native LoopDev backend, one warehouse and external payments | Confirmed | Issue #36 |
| ERP-DEC-003 | Confirmed | Suppliers is a standalone module, separate from Procurement; priority/date remain open; manufacturing is deferred | User confirmation | `design.md` |
| ERP-DEC-004 | Confirmed | The existing catalog-facing ERP module is named Products; product/service records are the direct list entry point; catalog-named contracts remain compatible | User instruction / `CR-ERP-PRODUCTS-MODULE` | `design.md`, `architecture-design.md` |
| ERP-DEC-005 | Confirmed | One Products master distinguishes finished goods, raw materials/components and services; class is independent from purchase/sale/inventory uses; categories are hierarchical; finished products allow buy/make/both sourcing, raw materials/components allow buy only for now, and services have no sourcing; variants inherit product sourcing | User confirmation / `CR-ERP-PRODUCT-MASTER-MODEL` and `domain-model.md` | `design.md`, `architecture-design.md`, `visual-design.md` |
| VD-ERP-013 | Confirmed | Category management is a dedicated view within Products with visible return navigation | User confirmation | `visual-design.md`, `wireframes/erp-product-categories.svg` |
| VIS-ERP-GATE-001 | Confirmed | Full conceptual visual source approved; runtime screenshot comparison remains post-implementation | User approval via explicit gate confirmation | `runs/MOD-CORE-20261024-001/01-visual-design.json` |
| ACC-ERP-RISK-001 | High-priority gap | ERP migration's all-operations RLS policy uses `catalog.read` in `USING`, which permits read-only deletion by policy semantics; deployment state is unverified | `access-model.md`, `supabase/migrations/20260928160000_erp_catalog_foundation.sql` |
| ERP-A-003 | Resolved | Variants inherit sourcing, but each SKU has its own category; drafts may omit it, active items may not | Confirmed by the user; reflected in `domain-model.md` and `api-contracts.md` |
| ERP-DEC-007 | Confirmed | SKU is unique across the organization after trimming outer whitespace and comparing case-insensitively; stored SKU preserves entered case | User decision; product, variant and category keys are generated, immutable and organization-unique |
| DOM-ERP-008 | Confirmed | Product, variant and category keys are LoopDev-generated, immutable and unique within the organization; SKUs are also organization-unique with trim/case-insensitive comparison | User decision |
| ERP-OD-001 | Resolved | ERP targets SMEs across sectors, not only MiauCraft and Inhand | User confirmation | `discovery.md` |
| ERP-OD-006 | Open | Which modules make up the first validated cross-sector ERP release | Open | `discovery.md`, `design.md` |
| ERP-OD-007 | Open | Supplier module scope, priority and release timing | Open | `design.md`, `architecture-design.md` |
| ERP-DEC-008 | Confirmed | `OrganizationCatalog` is migration-only, not a target business entity or product-ownership boundary | User decision; preserve legacy records for migration |
| ERP-DEC-009 | Confirmed | Commercial price currency belongs to each `PriceBook`; migrate legacy catalog currency into applicable books | User decision; `domain-model.md` |
| ERP-OD-008 | Open | Where legacy `OrganizationCatalog` locale and channel fields belong | `design.md`, `architecture-design.md` |
| DOM-ERP-009 | Confirmed | Only legacy `service` maps automatically; all other listed catalog item types remain drafts pending explicit review | User decision; `domain-model.md` |
| DOM-ERP-015 | Open | How legacy `categoryKey` references map to organization-scoped product categories | `domain-model.md` |
| DOM-ERP-016 | Open | Where legacy `OrganizationCatalog` locale and channel fields belong | `domain-model.md` |
| DOM-ERP-017 | Confirmed | Each `PriceEntry` uses its `PriceBook` currency | User decision; `domain-model.md` |
| DOM-ERP-018 | Confirmed | `Offer` has no independent currency; offer prices use the associated `PriceBook` currency | User decision; `domain-model.md` |
| ERP-CF-001 | Contradiction | Products documentation vs catalog-named Supabase adapter/migration evidence | Open | `discovery.md` |
| ERP-CF-002 | Contradiction | Legacy `catalog.write` vs `catalog.manage` permission identifiers | Open | `discovery.md` |

## Platform impact

| Capability | Decision | Consumers | Tests affected | Migration |
|---|---|---|---|---|
| Products module | Reuse; verify contracts and remote persistence | ERP, CRM, Communications, future channels | Catalog-named adapter, CRM product references, RLS | Resolve documentation/runtime and permission mismatch before extension; migrate route with a legacy redirect |
| Organization and permissions | Reuse shared Platform | Every ERP module and connected channel | Platform authorization and isolation tests | Use `organization_id`; no parallel tenant model |
| Notes, Files, Activity, Tasks and Relations | Reuse shared Platform capabilities | ERP record workspaces when approved | Current Platform contract tests | No module-local duplicates |

## Change log

| Date | Change | Run/commit | Approved by |
|---|---|---|---|
| 2026-10-24 | Initialized ERP core discovery after reorienting issue #36 | `MOD-CORE-20261024-001` | User direction; implementation scope pending |
| 2026-10-24 | Renamed the user-facing module from Catalog to Products and made the product/service list the direct entry point; kept legacy contracts, data and routes compatible | `CR-ERP-PRODUCTS-MODULE` | @loopdev-io |
| 2026-10-24 | Confirmed a unified Products master with item classes, independent operational uses, hierarchical primary categories, product-level sourcing and separately managed variants with their own SKU | `CR-ERP-PRODUCT-MASTER-MODEL` | @loopdev-io |
| 2026-10-24 | Confirmed a dedicated category-management view within Products and added desktop/mobile wireframe evidence | `VD-ERP-013` | @loopdev-io |
