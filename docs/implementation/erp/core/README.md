# ERP Core Capability Map

## References

- Product definition: `docs/06-product/products/PRODUCT_CATALOG_GLOBAL_TRACK.md`; first release approved as Products and categories only
- Track: current ERP implementation workspace; plan approval remains pending
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
| Status | `plan_in_progress` |
| Current phase | Revised visual gate approved conceptually; prepare the minimal executable plan for the full-page product/SKU editor |
| Current issue | #36 |
| Branch | `feature/erp-core-capabilities` |
| Commit | `0024978` |
| Pull request | None |
| Last evidence | @loopdev-io approved full-page product/SKU pages, quick-reference drawers and unit purchase-cost reference on 2026-10-24. Runtime visual comparison remains pending. |

## Scope

### Platform scope

| Surface | Scope | Owner | Evidence |
|---|---|---|---|
| Desktop web | Required | @loopdev-io (Product Owner) | User-approved first-release scope |
| Mobile web | Required | @loopdev-io (Product Owner) | User-approved first-release scope; operations still need evidence |
| iOS | Deferred | @loopdev-io (Product Owner) | User approved web desktop/mobile only |
| Android | Deferred | @loopdev-io (Product Owner) | User approved web desktop/mobile only |

### Included

- Deliver Products and categories, including variants, offers, sales prices,
  structured physical attributes and a non-accounting unit purchase-cost
  reference per product/SKU.
- Use full pages for product/SKU records and editing; use drawers for quick
  auxiliary-reference creation. Keep category-tree management in its dedicated
  Products view.
- Keep Suppliers independent but defer it, Shopify, Inhand commerce and all other ERP modules.
- Require online access for remote reads/writes; keep local demo mode explicit and separate.
- Use organization-wide scope, archive/restore only, `catalog.read` for sales-price visibility and `catalog.write` for mutations.

### Excluded

- Approval or implementation of a full ERP, general ledger, advanced procurement/WMS or a generic storefront builder.
- Manufacturing; revisit only through future discovery and product approval.
- Replacing Shopify for MiauCraft or processing payment-card data in LoopDev.
- Shopify integration, Inhand storefront/orders, Suppliers, Sales, Procurement,
  Inventory, Finance, Reporting, native apps, offline remote cache/queue,
  exports, accounting/inventory valuation, manufacturing cost, margin
  calculations and permanent deletion in this release.

## Phase index

| Phase | Issue | Status | Checkpoint | Evidence |
|---|---:|---|---|---|
| 00-discovery | #36 | `completed` (`partial` handoff) | `runs/MOD-CORE-20261024-001/00-discovery.json` | `discovery.md`, `delivery-ledger.json`, platform matrices |
| 01-design | #36 | `approved` | `runs/MOD-CORE-20261024-001/01-design.json` | `design.md`, `architecture-design.md` |
| 01-visual-design | #36 | `approved` (full-page product/SKU, record page, reference drawers) | `runs/MOD-CORE-20261024-001/01-visual-design.json` | `visual-design.md`, `view-state-matrix.md`, updated desktop/mobile SVGs under `wireframes/` |
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
mobile. The Product Owner approved the conceptual visual source on 2026-10-24;
runtime comparison remains pending implementation. Semimanufactured items and
manufacturing operations remain deferred. The approved release boundary is
Products and categories with a unit purchase-cost reference and physical
attributes; accounting valuation and margin calculations remain excluded.
Product/SKU forms and records now use full pages; auxiliary quick creation uses
drawers. `VD-ERP-013` remains resolved. Cost permissions, inheritance/units and
full brand/tag management need task-level analysis. Specialized domain/access/
API/sync evidence must be reconciled before implementation.

The previous drawer form wireframes are superseded by the page compositions
linked from `visual-design.md`. The Product Owner approved the revised visual
direction on 2026-10-24; runtime comparison remains a post-implementation gate.

## Decisions and blockers

| ID | Type | Decision/blocker | Status | Evidence |
|---|---|---|---|---|
| ERP-DEC-001 | Confirmed | ERP targets cross-sector SMEs; client-specific work does not define the first release | Confirmed | Issue #36 |
| ERP-DEC-002 | Deferred | Inhand commerce remains a later client-specific discovery; prior direction is not first-release scope | User-approved release boundary | `discovery.md` |
| ERP-DEC-003 | Confirmed | Suppliers is a standalone module, separate from Procurement, but deferred from this release; manufacturing is deferred | User confirmation | `design.md` |
| ERP-DEC-004 | Confirmed | The existing catalog-facing ERP module is named Products; product/service records are the direct list entry point; catalog-named contracts remain compatible | User instruction / `CR-ERP-PRODUCTS-MODULE` | `design.md`, `architecture-design.md` |
| ERP-DEC-005 | Confirmed | One Products master distinguishes finished goods, raw materials/components and services; class is independent from purchase/sale/inventory uses; categories are hierarchical; finished products allow buy/make/both sourcing, raw materials/components allow buy only for now, and services have no sourcing; variants inherit product sourcing | User confirmation / `CR-ERP-PRODUCT-MASTER-MODEL` and `domain-model.md` | `design.md`, `architecture-design.md`, `visual-design.md` |
| VD-ERP-013 | Confirmed | Category management is a dedicated view within Products with visible return navigation | User confirmation | `visual-design.md`, `wireframes/erp-product-categories.svg` |
| VIS-ERP-GATE-001 | Confirmed | Full conceptual visual source approved; runtime screenshot comparison remains post-implementation | User approval via explicit gate confirmation | `runs/MOD-CORE-20261024-001/01-visual-design.json` |
| ACC-ERP-RISK-001 | High-priority gap | ERP migration's all-operations RLS policy uses `catalog.read` in `USING`, which permits read-only deletion by policy semantics; deployment state is unverified | `access-model.md`, `supabase/migrations/20260928160000_erp_catalog_foundation.sql` |
| ERP-A-003 | Resolved | Variants inherit sourcing, but each SKU has its own category; drafts may omit it, active items may not | Confirmed by the user; reflected in `domain-model.md` and `api-contracts.md` |
| ERP-DEC-007 | Confirmed | SKU is unique across the organization after trimming outer whitespace and comparing case-insensitively; stored SKU preserves entered case | User decision; product, variant and category keys are generated, immutable and organization-unique |
| DOM-ERP-008 | Confirmed | Product, variant and category keys are LoopDev-generated, immutable and unique within the organization; SKUs are also organization-unique with trim/case-insensitive comparison | User decision |
| ERP-OD-001 | Resolved | ERP targets SMEs across sectors, not only MiauCraft and Inhand | User confirmation | `discovery.md` |
| ERP-OD-006 | Resolved | First release is Products and categories only; other ERP modules and commerce integrations follow later | User approved | `discovery.md`, `design.md` |
| ERP-OD-007 | Resolved for this release | Suppliers is independent but deferred; its later scope/timing remain future discovery | User approved | `discovery.md`, `design.md` |
| ERP-DEC-008 | Confirmed | `OrganizationCatalog` is migration-only, not a target business entity or product-ownership boundary | User decision; preserve legacy records for migration |
| ERP-DEC-009 | Confirmed | Commercial price currency belongs to each `PriceBook`; migrate legacy catalog currency into applicable books | User decision; `domain-model.md` |
| ERP-OD-008 | Resolved for this release | Preserve legacy locale/channel values as migration provenance; destination ownership is deferred | User approved | `domain-model.md`, `discovery.md` |
| DOM-ERP-009 | Confirmed | Only legacy `service` maps automatically; all other listed catalog item types remain drafts pending explicit review | User decision; `domain-model.md` |
| DOM-ERP-015 | Open | How legacy `categoryKey` references map to organization-scoped product categories | `domain-model.md` |
| DOM-ERP-016 | Open | Where legacy `OrganizationCatalog` locale and channel fields belong | `domain-model.md` |
| DOM-ERP-017 | Confirmed | Each `PriceEntry` uses its `PriceBook` currency | User decision; `domain-model.md` |
| DOM-ERP-018 | Confirmed | `Offer` has no independent currency; offer prices use the associated `PriceBook` currency | User decision; `domain-model.md` |
| ERP-CF-001 | Execution gate | Reconcile product documentation with the existing remote adapter and verify deployed schema/runtime | Plan task | `discovery.md`, `implementation-plan.md` |
| ERP-CF-002 | Resolved decision | `catalog.write` is canonical; a forward RLS/permission migration and deployed-state verification remain required | User approved | `access-model.md`, `api-contracts.md` |
| ACC-ERP-011 | Platform dependency | Append-only shared Platform audit is required before remote writes; Platform owner must approve its contract | Owner approval pending | `access-model.md`, `implementation-plan.md` |
| MIG-ERP-001 | Data-access dependency | Actual legacy category/workspace/currency data requires an authorized inventory and dry run before migration | Remote access unavailable | `sync-model.md`, `implementation-plan.md` |

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
| 2026-10-24 | Bounded the first release to Products/categories on desktop and mobile web; deferred Shopify, Inhand, Suppliers, native apps and other ERP modules; confirmed online-only remote access and archive-only lifecycle | `CR-ERP-PRODUCTS-FIRST-RELEASE` | @loopdev-io |
