# ERP Core Capability Map Discovery

## Document control

| Field | Value |
|---|---|
| Module | ERP Core Capability Map |
| Suite | ERP |
| Run ID | `MOD-CORE-20261024-001` |
| User request | Define a cross-sector SME ERP capability map, separate ERP from Platform, CRM and public channels, and prioritize MiauCraft before Inhand. |
| Product definition | `docs/06-product/products/PRODUCT_CATALOG_GLOBAL_TRACK.md`; first release is approved as Products and categories only, desktop/mobile web, remote online-only. |
| Discovery status | `partial` |
| Owner | @loopdev-io (Product Owner) |

## Problem and objective

- Business problem: LoopDev has an implemented ERP entry point and a product catalog foundation, but the product boundary and current/future ERP capabilities are not documented as one approved map. Two new commerce clients expose distinct operating models: MiauCraft keeps Shopify; Inhand starts with a LoopDev-owned commerce backend.
- Primary objective: Establish an evidence-based, sector-neutral SME capability map across Platform, CRM, ERP and public channels. The first validated release is Products and categories only; Shopify, Inhand commerce and other ERP modules are follow-up work.
- Success measure: Every candidate capability has an owner, product classification, existing-state evidence, consumers, platform scope and a next decision/action; no user-specific flow duplicates shared Platform or CRM data.
- Explicit boundary: This is discovery for the ERP core roadmap, not approval to build a complete ERP, accounting suite, storefront builder, or every capability found in market references.

## Actors and outcomes

| Actor | Job to be done | Outcome | Permissions/constraints |
|---|---|---|---|
| LoopDev product owner | Bound ERP capability ownership and release sequence | Products and categories are the first approved release | Cross-sector SME target confirmed; approval does not authorize later modules |
| Products administrator/operator | Maintain product records, SKUs, categories, offers and prices | Organization-wide product master on desktop/mobile web | Requires `catalog.read` or `catalog.write`; remote mode is online-only and audited |
| MiauCraft administrator/operator (follow-up) | Keep Shopify as its sales system while considering later administration integration | No Shopify workflow is included in this release | Entity ownership and write permissions require client discovery |
| Inhand operator/customer (follow-up) | Use a future LoopDev commerce backend and public storefront | No Inhand order/storefront workflow is included in this release | Market, tax, fulfillment, payment and returns remain future discovery |
| CRM user | Manage customer relationships and sales context | CRM remains owner of customer identity/history | ERP references CRM-owned records; no CRM integration work is in this release |
| SME sales, purchasing, inventory and finance operators (future) | Execute later sector-neutral workflows | Follow-up module candidates only | Roles and country-specific obligations require separate approval |

## Expected domain capabilities

| Capability | Classification | Expected behavior | Priority |
|---|---|---|---|
| Products master, variants, offers and sales prices | `REQUIRED_MVP` | Own one organization-wide master for finished products, raw materials/components and services; preserve agreed class/use/sourcing rules, generated immutable keys, SKU uniqueness, offers, PriceBooks and PriceEntries. | Foundation; current catalog implementation is partial and conflicts with approved behavior |
| Product category hierarchy | `REQUIRED_MVP` | Manage an organization-wide hierarchical category tree inside Products; assign one general category to each product and an independently selected category to each managed/sold SKU. | Existing `categoryKey` is not a category entity/tree; category operations are missing |
| Commercial pricing | `REQUIRED_MVP` | Maintain offers, price books and prices; currency belongs to each PriceBook and every `catalog.read` role sees sales prices. Costs, margins, exports and channel availability are excluded. | Current contract has legacy currency fields and no verified remote parity |
| Channel integration boundary | `REQUIRED_FOLLOW_UP` | Connect a channel adapter to ERP contracts while defining source of truth, external IDs, sync, errors and recovery per entity. | Deferred until after Products/categories |
| Shopify integration for MiauCraft | `REQUIRED_FOLLOW_UP` | Keep Shopify as the public sales platform; expose only data and operations approved by MiauCraft. Exact sync scope and writes remain open. | Deferred until after Products/categories |
| Sales orders and commerce lifecycle | `REQUIRED_FOLLOW_UP` | Define native Inhand order ownership and any later external order projection separately. | Deferred; no order work in this release |
| Basic inventory for Inhand | `REQUIRED_FOLLOW_UP` | Define stock movement/reservation rules for future physical-goods commerce. | Deferred; no inventory work in this release |
| CRM customer relationship | `PLATFORM_REUSE` | Link ERP orders and channel records to CRM-owned customers/contacts where identity is confidently resolved; preserve CRM ownership of relationship history. | Cross-suite |
| Procurement and supplier purchasing | `REQUIRED_FOLLOW_UP` | Keep Suppliers as a separate module; decide its later scope and relationship to Procurement before implementation. | Deferred; no supplier/procurement work in this release |
| Fulfillment, shipping, returns and refunds | `OPEN_DECISION` | Define the boundary between order management and fulfillment, including carrier integration and returns policy. | Not approved; especially open for Inhand |
| Billing and accounting | `REQUIRED_FOLLOW_UP` | Decide whether ERP owns invoicing/ledger/accounting or integrates with specialist systems; payment-provider status is not accounting. | Deferred; not approved for current release |
| Public storefront renderer | `OUT_OF_SCOPE` | Shopify remains MiauCraft's storefront. Inhand's custom storefront is a separate customer-facing channel consuming ERP commerce contracts, not an ERP admin page. | Separate channel scope |
| Shared Platform capabilities | `PLATFORM_REUSE` | Reuse organization scope, authorization, activity, files, notes, tasks and common UI/adapters; extend Platform only with an approved cross-suite gap. | Required integration rule |
| Sales and order management | `REQUIRED_FOLLOW_UP` | Candidate cross-sector workflow for quotations, orders and fulfillment handoff; exact relationship with CRM opportunities and external channels remains to be designed. | Deferred; not first-release scope |
| Procurement and supplier purchasing | `REQUIRED_FOLLOW_UP` | Candidate purchase requests/orders and receipt workflow, separate from CRM relationship history. | Deferred; not first-release scope |
| Inventory and stock operations | `REQUIRED_FOLLOW_UP` | Candidate inventory ledger and location-aware availability for organizations that hold physical goods; service-only businesses may not enable it. | Deferred; not first-release scope |
| Finance and billing | `REQUIRED_FOLLOW_UP` | Candidate invoices and payment reconciliation; statutory accounting, tax and ledger ownership are not approved. | Deferred; jurisdiction and provider decisions remain open |
| Operational reporting | `REQUIRED_FOLLOW_UP` | Candidate operational reports across ERP-owned transactions, respecting source ownership and tenant permissions. | Deferred; measures and export rules require approval |
| Manufacturing, HR/payroll and industry-specific operations | `OUT_OF_SCOPE` | Not part of the initial cross-sector baseline; introduce only through validated market demand and separate approval. | Future product discovery |

## Inputs, outputs and events

### Inputs

- Entities: organization/workspace scope; product master (currently `CatalogItem`), product category, variant, offer, price book and price entry; CRM contact/customer references; external Shopify IDs; future order and inventory references.
- Commands: read/manage catalog; connect/disconnect an external commerce channel; import or reconcile approved data; create or update native Inhand orders; reserve/release/adjust stock only after their policies are approved.
- External/Platform data: Shopify products, variants, prices, availability and orders only as approved by MiauCraft; CRM customer/contact references; organization memberships and permissions; future payment-provider outcomes for Inhand.

### Outputs

- Read models: ERP Products master and category hierarchy, commercial availability, channel connection/sync health; optionally unified order and stock views after contracts are approved.
- Mutations: catalog administration today; future channel synchronization controls and Inhand order/stock operations, each behind explicit ownership and authorization.
- User-visible outcomes: operators can identify which system owns a record, see synchronization/transaction state, and recover actionable failures without silently overwriting another system's data.

### Events

| Event | Producer | Consumers | Payload/invariants | Idempotency/audit |
|---|---|---|---|---|
| `catalog.item.changed` (proposed) | ERP catalog | CRM, Communications and future ERP modules | Stable catalog/item ID, organization scope, version and changed fields; consumers do not become product masters. | Required before cross-module publication; not evidenced as implemented |
| `commerce.channel.sync.received` (proposed) | Channel adapter | ERP integration state and affected catalog/order projections | Provider, external ID, organization, event/version and received time; source-of-truth policy controls application. | Provider event ID / idempotency key, auditable result and retry state |
| `commerce.order.created` (proposed) | Native Inhand order service or imported channel adapter | Inventory, CRM context and later billing/analytics | Stable order ID, source channel, customer reference, lines tied to product/offer versions, currency and lifecycle state. | Must be idempotent; immutable source references and state transition audit |
| `inventory.stock.changed` (proposed) | Inventory module | Storefront availability, order processing and reporting | Organization, location, SKU/variant, quantity delta, reason and version. | Audited ledger entry; concurrency and duplicate delivery rules required |
| `commerce.payment.status.changed` (proposed) | External payment adapter | Inhand order lifecycle | Provider reference and normalized payment outcome; never include raw card data. | Provider reference/idempotency; reconciliation and audit required |

## Entities, relationships and lifecycle

| Entity | Owner | Relationships | States | Invariants |
|---|---|---|---|---|
| `OrganizationCatalog` (legacy only) | Migration source; no target business owner | Legacy organization/workspace and current catalog items | Legacy states retained only as migration evidence | Retire as a target entity and product-ownership boundary; migrate currency into applicable PriceBooks and assign locale/channel fields to their target domains |
| `CatalogItem` (technical name; conceptual product master) | ERP / Products | Product category, variants, offers, price entries, CRM references | draft, active, archived | One item class (`finished product`, `raw material/component`, or `service`); purchasing, selling and inventory-tracking uses are independent; finished products allow buy/make/both sourcing; raw materials/components are buy-only for now; services have no sourcing value |
| `ProductCategory` (proposed) | ERP / Products | Parent category, child categories, product bases and SKU variants | active, archived | Hierarchical taxonomy with a LoopDev-generated immutable key distinct from its visible name and unique within the organization; one primary category on the product base and each separately managed/sold SKU; SKU category may differ from its base or siblings; archive preserves assignments but blocks new ones and is blocked while active children remain; restore re-enables assignment if the parent is active; moving a category moves its subtree and preserves assignments without cycles; permanent deletion is prohibited |
| `CatalogVariant` | ERP / Products | Product master, own category, offers/prices and future stock | draft, active, archived | A separately managed/sold variant is a specific product with its own SKU and category; descriptive attributes alone do not create variants; it inherits the product's sourcing rule, which is null for services |
| `Offer` / `PriceBook` / `PriceEntry` | ERP / Products | Product/variant, currency, validity, channel/visibility | draft, active, archived; validity windows | Published transaction snapshots must not change retroactively |
| `ExternalChannelConnection` (proposed) | ERP integration boundary; credential service ownership is open | Organization, provider account, external IDs, sync runs | proposed: pending, active, degraded, disconnected | Secret material not exposed to clients; external identifiers are scoped by provider and organization |
| `SalesOrder` / `OrderLine` (proposed) | ERP for Inhand; external provider for MiauCraft | Customer reference, catalog item/offer/variant version, payment and fulfillment refs | proposed lifecycle requires design | Preserve channel origin, currency/amount snapshots and idempotent transitions |
| `StockLocation` / `StockMovement` / `StockReservation` (proposed) | ERP / Inventory | Organization, SKU/variant, order and location | proposed lifecycle requires design | Stock derives from audited movements; reservations must not make available stock negative |
| CRM `Contact` / customer identity | CRM | ERP orders and channel customer identifiers | Existing CRM lifecycle | ERP must reference the authoritative CRM entity and avoid a parallel customer master |

## Platform and suite integration

| Capability/module | Decision | Consumed contract | Produced data/events | Duplicate prohibited? |
|---|---|---|---|---|
| Organization, membership and tenant scope | `REUSE` | `organization_id`, organization membership and shared permission APIs; RLS patterns in `docs/03-platform/backend/` | Scoped ERP records and permission decisions | Yes; no ERP-local tenant or membership model |
| Catalog / Products | `REUSE` with contract and persistence audit | `src/loopdev/domains/catalog/types.ts` and `CatalogAdapter` | Product, variant, offer and price references | Yes; CRM and channels must not create parallel product masters |
| CRM Contacts / Customer 360 | `REUSE` | CRM contact/customer references and Customer 360 | Customer/order associations and commerce context | Yes; ERP must not own CRM relationship history |
| Notes, Files, Activity, Tasks, Relations | `REUSE` | Current shared Platform contracts and components from platform references | Activity/audit links and entity attachments as approved | Yes; no local editor/uploader/timeline/task capability |
| Shopify channel | `MODULE_SPECIFIC` adapter over shared integration contract | Shopify external resources and agreed ERP mapping (not designed yet) | MiauCraft channel records and synchronization outcomes | No provider-specific clone of ERP's catalog/order domain |
| Inhand storefront | `MODULE_SPECIFIC` consumer/channel | Approved public catalog, availability, cart/order API | Customer purchase commands and order views | Storefront must not become a second source of business rules |
| Billing, Procurement, Inventory | `OPEN_DECISION` | No approved module contracts yet | Future invoices, purchase orders, stock movements | Do not implement local duplicates before ownership is decided |

### Suite interaction matrix

| Módulo origen | Módulo destino | Interacción | Trigger | Datos compartidos | Permisos |
|---|---|---|---|---|---|
| ERP Products | CRM | CRM references products/offers in opportunities and customer context | User selects a catalog item | Catalog/item/offer/variant IDs and version references | `catalog.read` plus CRM record permissions; reconcile permission naming before expansion |
| Shopify adapter | ERP Products / Commerce | Import or reconcile approved channel records | Webhook, scheduled pull or operator action (mechanism open) | Provider ID, external ID, organization, payload version, sync outcome | Organization membership and integration-management permission (contract open) |
| ERP Orders (future) | CRM | Link a sale to an existing customer record | Native order creation or approved channel import | CRM contact ID and external customer ID | CRM read/link permission plus ERP order scope |
| ERP Orders (future) | ERP Inventory (future) | Reserve/release stock and publish order status | Approved order transition | SKU/variant, location, quantity, order ID | ERP order and inventory permissions; audited |
| ERP Commerce API (future) | Inhand public storefront | Read published products/availability and submit purchase commands | Customer browse/checkout | Public-safe catalog fields, availability, cart/order/payment references | Public endpoint policy and abuse protection require design; no admin permissions exposed |

## Market/domain baseline

| Reference capability | Why expected | Relevant to MVP? | Evidence/source |
|---|---|---:|---|
| Product and price master used by downstream sales/inventory | Common foundation for multiple operational processes | Yes; LoopDev already has a catalog foundation | Odoo Sales and Products documentation; LoopDev global catalog track |
| Sales order linked to delivery and invoicing | Common flow from quote/order to fulfillment and finance | Partly; external MiauCraft orders and native Inhand orders need different ownership | Odoo Sales documentation; SAP Business One process overview |
| Inventory movements affected by sales and purchase documents | Prevents stock drift between operations | Yes for Inhand's initial single warehouse; not a MiauCraft replacement | Microsoft Business Central inventory documentation |
| Procurement, finance, warehouse depth and analytics | Mature ERP breadth | Not approved for current MVP | SAP Business One and Odoo docs; product decision required |

## External benchmark and source register

| Reference | Source URL | Accessed | Observed capability/pattern | Classification | LoopDev applicability | Tradeoff / do not copy |
|---|---|---|---|---|---|---|
| Odoo Sales | https://www.odoo.com/documentation/19.0/applications/sales/sales.html | 2026-10-24 | Sales covers quotation-to-order, delivery/invoicing, product variants, pricing, returns and channel connectors. | `INDUSTRY_BASELINE` | Check the lifecycle between catalog, order and channel without making each connector a separate product model. | Odoo's breadth and mature workflows are not an MVP checklist; do not reproduce every feature or channel connector. |
| Odoo Inventory | https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory.html | 2026-10-24 | Product/warehouse management, replenishment, shipping/receiving, reservations, traceability and inventory valuation are distinct operational capabilities. | `TRANSFERABLE_PATTERN` | Separate catalog availability from inventory, and stock balance from movements/reservations. | Multi-warehouse, advanced routing, valuation and manufacturing are not required for Inhand's first single-warehouse scope. |
| Microsoft Dynamics 365 Business Central | https://learn.microsoft.com/en-us/dynamics365/business-central/inventory-manage-inventory | 2026-10-24 | Inventory entries connect to sales/purchase documents, locations, adjustments, reservations and item traceability; inventory costs reconcile with the general ledger. | `TRANSFERABLE_PATTERN` | Model audited stock changes and connect transactions through stable references. | Do not make financial ledger integration or advanced traceability a prerequisite for the initial commerce slice. |
| SAP Business One | https://learning.sap.com/courses/managing-logistics-in-sap-business-one/introducing-sap-business-one | 2026-10-24 | The SMB ERP framing integrates finance, sales, purchasing, inventory, partner management, service, production and analytics. | `INDUSTRY_BASELINE` | Use end-to-end process integration to test ERP boundaries, not isolated page lists. | Avoid a single all-owning ERP module and broad parity scope; keep ownership modular and sequence by validated customer needs. |

### Findings by classification

- `INDUSTRY_BASELINE`: shared master data, sales/order lifecycle, inventory effects, purchasing, financial posting, and reports are commonly connected in mature ERP products.
- `TRANSFERABLE_PATTERN`: keep a catalog distinct from inventory; connect transactions with immutable source IDs; represent stock changes as auditable movements; build adapter boundaries around external channels.
- `DIFFERENTIATOR_OPPORTUNITY`: make system-of-record and sync ownership visible to operators, rather than silently presenting a blended record.
- `NOT_RELEVANT` for the immediate client scope: manufacturing/MRP, advanced warehouse routing, statutory accounting, multi-company consolidation and predictive planning.
- `UNVERIFIED`: no market feature is treated as a LoopDev implementation or as approved product scope.

## LoopDev differentiation hypotheses

These are exploration hypotheses only; none is approved for MVP.

| Hypothesis | User value | Product behavior changed | Platform/domain impact | Complexity | Validation experiment | Decision |
|---|---|---|---|---|---|---|
| Per-entity source-of-truth visibility | Operators know where edits must happen and avoid conflicting data | Show provider ownership and sync state beside imported data | Shared integration contract, audit and ERP channel adapter | Medium | Walk MiauCraft operators through product/order discrepancies and record resolution time/errors | `explore` |
| One commerce contract with explicit native/external modes | Reuse business concepts without forcing Shopify to behave like Inhand's native backend | ERP consumers access stable catalog/order references while adapters preserve provider ownership | ERP domains plus channel ports and CRM consumer impact | High | Contract review against one Shopify and one native Inhand scenario before implementation | `explore` |
| Progressive ERP depth | Smaller companies start with core catalog/orders/one location and add modules only when needed | Reveal and enable capabilities by module readiness, not one fixed ERP suite | Entitlements, navigation and module lifecycle if approved | Medium | Validate the ERP map with MiauCraft and Inhand and compare must-have vs deferred workflows | `explore` |
| Actionable sync/stock recovery | Operators resolve mismatches without engineering intervention | Provide explicit failed/pending/reconciled states and safe retry actions | Integration state, idempotency, audit and inventory ledger | High | Prototype recovery cases using duplicate/out-of-order Shopify events and stock contention | `explore` |

## Product definition currently approved

- Product documents: `docs/06-product/products/PRODUCT_CATALOG_GLOBAL_TRACK.md`.
- Approved scope: Products and categories are the first release; desktop and mobile web are required, native iOS/Android are deferred, and remote data is online-only with no offline cache or mutation queue. All other modules, including Shopify integration and Inhand commerce, follow later.
- Explicit exclusions: Shopify, Inhand storefront/orders, Suppliers, Sales, Procurement, Inventory, Finance, Reporting, native apps, offline remote reads/writes, exports, costs/margins and permanent deletion are not part of this release. Existing ERP direction remains a cross-sector roadmap, not approval for an unbounded suite.
- Existing approvals: user direction tracked in [issue #36](https://github.com/minoveaz/loopdev-v2/issues/36); this is scope direction, not approval to implement every candidate ERP capability.

### Legacy reference policy

No legacy ERP route or component inventory was used as implementation authority. The current ERP surface and shared Rivera/LoopDev primitives are the reuse baseline; historical names do not authorize parallel routes or views.

| Legacy reference | Informational meaning | Current reuse target | Decision |
|---|---|---|---|
| Archived ERP/SAAS references, if encountered later | Historical or proposed information only | Current ERP catalog route and Platform primitives after source verification | `INFORMATIONAL_ONLY` |

## Existing LoopDev implementation

| Area | Existing route/code/doc | Behavior observed | Evidence |
|---|---|---|---|
| ERP entry surface | `/app/erp/overview`, `src/loopdev/pages/erp/Overview.tsx` | Shows catalog counts and links to catalog administration; not a transaction dashboard. | `src/routes/LoopdevRoutes.tsx`, `src/loopdev/pages/erp/Overview.tsx` |
| Product catalog UI | `/app/erp/product-catalog` and `:catalogId`; `src/loopdev/pages/erp/ProductCatalog.tsx` | Catalog selection/detail, item management, search and filters. | Route and page source; catalog adapter tests |
| Catalog domain | `src/loopdev/domains/catalog/types.ts`, `adapter/`, `data/localCatalog.ts` | Types cover organization catalogs, items, variants, offers, price books/entries, party roles, availability and eligibility. Local storage is seeded and scope-aware. | Source plus `src/test/catalog/catalog-adapter.test.ts` |
| Remote catalog adapter and schema | `src/loopdev/domains/catalog/adapter/supabase.ts`; `supabase/migrations/20260928160000_erp_catalog_foundation.sql` | Migration creates six catalog/price tables with RLS. Remote adapter implements those tables, but party-role, availability and eligibility reads return empty arrays; runtime/backend execution was not tested in this discovery. | Migration and adapter source |
| CRM product consumption | CRM opportunity/quote catalog references | CRM can reference catalog records; a CRM quotation is not evidence of an ERP order domain. | `docs/06-product/products/PRODUCT_CATALOG_GLOBAL_TRACK.md`, `src/test/crm/pipeline/catalog-reference.test.ts`, `supabase/migrations/20260928120000_crm_quotes.sql` |
| ERP order, inventory, purchasing and accounting modules | No current ERP routes/domain/migrations identified in the inspected active source | No implemented ERP operational transaction module established by the current evidence. | Route source and scoped search of `src/loopdev`, `supabase/migrations` |
| Platform and tenant foundation | Organization-aware contracts, permission adapter and RLS patterns | Reusable direction exists; exact ERP role/action permissions still need a coherent contract. | `docs/03-platform/backend/MULTI_TENANCY_STRATEGY.md`, `DATABASE_SECURITY_RLS.md`, platform domain and migrations |

## Expected versus existing

| Capability | Expected | Product source | Existing implementation | Baseline status | Evidence | Next action |
|---|---|---|---|---|---|---|
| ERP capability map and suite ownership | Separate Platform, CRM, ERP and channel responsibilities; Products/categories is the only first-release slice | User request; issue #36; approved first-release decision | Cross-sector ERP roadmap and bounded first release are documented; no full ERP implementation claimed | `EXISTS_AND_ALIGNS` | `discovery.md`, `design.md`, user-approved `CR-ERP-PRODUCTS-FIRST-RELEASE` | Preserve the boundary; future client/module scope requires separate discovery and approval |
| Product/service catalog | Sector-neutral product master with agreed item classes, operational uses, hierarchical categories, sourcing and separate-SKU variants | Global Product Catalog track; `ERP-DEC-005` | ERP routes, typed domain, local store, adapter, migration and local tests; no class/category-tree/sourcing implementation evidence | `EXISTS_PARTIALLY` | Source/test evidence above; user-confirmed concepts recorded in `CR-ERP-PRODUCT-MASTER-MODEL` | Preserve legacy contract; ambiguous class mappings stay drafts; plan remote verification and the missing master concepts |
| Product category management | Hierarchical category tree managed within Products; one general category on the product base and an independently assigned category on each SKU variant; drafts may omit categories but active items require one | User-confirmed product model; `ERP-DEC-005`, `DOM-ERP-006`, `DOM-ERP-010`, `DOM-ERP-011`, `DOM-ERP-008` | `CatalogItem.categoryKey` exists, but no category entity, hierarchy or variant-category field/management operations were found | `EXISTS_PARTIALLY` | `src/loopdev/domains/catalog/types.ts`; scoped source review; user decisions recorded in `domain-model.md` | Implement the approved category lifecycle and generated keys; run actual legacy-key mapping only after authorized data inventory |
| Catalog remote persistence | Organization-scoped remote catalog | Product track says no Supabase integration; current code and migration include partial Supabase support | Six tables exist in migration; some remote reads are stubs; no runtime evidence collected | `EXISTS_BUT_CONFLICTS` | `supabase_catalog_foundation` migration and `supabaseCatalogAdapter` | Update source-of-truth product evidence after verifying deployed schema and runtime |
| Catalog authorization parity | Same least-privilege actions for local and remote adapters | Platform access/RLS policies | Supabase migration grants `catalog.read`/`catalog.manage`; local adapter calls `catalog.read`/`catalog.write` | `EXISTS_BUT_CONFLICTS` | `local.ts`, `supabase.ts`, ERP migration | Resolve canonical permission IDs before adding new ERP operations |
| Shopify integration for MiauCraft | Later connected administration path while Shopify remains sales platform | User direction; issue #36; deferred release boundary | No Shopify connector, connection domain or sync evidence found | `MISSING` | No Shopify source/adapter in inspected runtime | Defer to separate client discovery after Products/categories |
| Sales orders / order lifecycle | Future Inhand native ownership and explicit external order projection only if approved | User direction for Inhand; deferred release boundary | No ERP order domain/routes/migration found; CRM quotes exist separately | `MISSING` | Scoped source/migration search | Defer lifecycle, source-channel and CRM-linkage design |
| Inventory | Future physical stock scope; no replacement of Shopify stock without approval | User direction for Inhand; deferred release boundary | No ERP inventory domain/route/migration found | `MISSING` | Scoped source/migration search | Defer stock ledger, reservations and reconciliation design |
| Procurement/supplier orders | Potential ERP capability | Market baseline only; no client requirement confirmed | No implementation evidence found | `NOT_TESTED` | No approved source/consumer | Decide whether to include in broader ERP roadmap |
| Finance/accounting | Potential ERP capability; payment status is not general ledger | Market baseline only; no client requirement confirmed | No ERP accounting module evidence found | `NOT_TESTED` | No approved product definition | Decide whether to own finance or integrate specialist systems |
| CRM customer relationships | ERP references customer identity and CRM history | CRM product/docs | CRM contacts, Customer 360 and quote references exist | `EXISTS_PARTIALLY` | CRM routes and catalog reference test | Define shared party/customer ID and permissions; do not duplicate CRM master |
| Public storefront | Shopify for MiauCraft; independent storefront consumer for Inhand | User direction | No Inhand public commerce storefront identified in ERP routes | `MISSING` as a separate channel | Current ERP routes are authenticated admin surfaces | Scope storefront separately from ERP admin and secure its API |

## Scope boundaries

### MVP

- Products and categories only: master records, variants/SKUs, offers, price books/entries and category hierarchy.
- Products and categories are organization-wide; workspace is not a target access boundary.
- Remote reads and writes require an online Supabase response; no remote offline cache or mutation queue.
- Local demo mode is explicit and separate; it never acts as a remote fallback.
- Remote writes require `catalog.write`, operation-specific RLS, optimistic version checks and an append-only shared Platform audit record.
- Desktop web and mobile web are required; native iOS/Android are excluded.

### Follow-up

- MiauCraft Shopify integration after the Products release and client-specific field/source-of-truth decisions.
- Inhand storefront, orders, inventory and external payment coordination after Products and client-specific decisions.
- Suppliers as an independent module, followed by Procurement, fulfillment, returns, tax/localization, Finance and Reporting after customer need and ownership are confirmed.

### Out of scope

- Building a full ERP suite from market feature lists.
- Replacing Shopify or moving MiauCraft's checkout/payments to LoopDev.
- Direct storage or processing of payment-card data by LoopDev.
- Inhand multi-warehouse, advanced WMS, manufacturing, statutory accounting or native apps in this release.
- Rebuilding Platform notes, tasks, files, relations, activity, customer records or shell/navigation locally in ERP.

## Contradictions, assumptions and open decisions

| ID | Type | Finding | Impact | Owner | Resolution |
|---|---|---|---|---|---|
| ERP-OD-001 | `resolved_decision` | The ERP capability map targets SMEs across sectors, not only MiauCraft and Inhand. | Establishes a sector-neutral product direction; does not approve a full ERP suite. | Product owner | Confirmed by the user: “ERP transversal para pymes de distintos sectores desde el inicio.” |
| ERP-DEC-005 | `resolved_decision` | Products uses one item master with classes for finished products, raw materials/components and services; semimanufactured items are deferred until Manufacturing discovery. Operational purchasing, selling and inventory tracking are independent uses. The product base has one general category; each separately managed/sold SKU has its own category, which may differ from the base or sibling variants. Drafts may omit category, but activation requires one. Sourcing is defined on the product and inherited by variants. | Defines the agreed conceptual boundary for Products while leaving implementation contracts and field names to specialized analysis. | Product owner | Confirmed in the user's answers to the product-model questions; SKU-level ownership and category timing were confirmed during domain decisions and are recorded in `domain-model.md`. |
| ERP-A-003 | `resolved_decision` | Variants inherit the product's sourcing rule but have their own independently assigned primary category. | Keeps sourcing consistent at product level while allowing classification of each concrete SKU. | Product owner + ERP domain | User confirmed the product base retains a general category and each variant/SKU can have its own category; `DOM-ERP-006`. |
| ERP-DEC-007 | `resolved_decision` | SKU is unique across the organization after trimming outer whitespace and comparing case-insensitively; stored SKU preserves entered case. | Prevents ambiguity when identifying or referencing a concrete product/SKU across products and workspaces. | Product owner | User selected organization-wide uniqueness and SKU storage/comparison semantics; product, variant and category keys are separately LoopDev-generated, immutable, distinct from SKU/name and organization-unique. |
| ERP-OD-006 | `resolved_decision` | The first release contains Products and categories only; Shopify, Inhand commerce and all other ERP modules are deferred. | Bounds the implementation plan and prevents an unbounded ERP MVP. | Product owner | User selected: “Productos + categorías; Shopify, Inhand y otros módulos después”. |
| ERP-OD-007 | `resolved_decision` | Suppliers remains an independent ERP module but is not in the first release; its later functional scope and timing remain future discovery. | Prevents supplier/procurement work from expanding Products. | Product owner | User selected Products and categories only; other modules follow later. |
| ERP-OD-008 | `resolved_decision` | Locale and channel fields from `OrganizationCatalog` are preserved as migration provenance and are not Products fields in this release. | Avoids assigning migration-only fields to the wrong domain while channel/localization work is deferred. | Product owner | Products/categories-only scope approved; defer destination ownership to future localization/channel work. |
| ERP-CF-001 | `contradiction` | Product Catalog documentation says there is no Supabase integration, while current source has a Supabase adapter and migration for six tables. | Do not assume deployed persistence or enable remote writes until schema/RLS state is verified. | ERP / Platform | Plan a read-only deployed-state check; update implementation evidence and use a forward migration if required. |
| ERP-CF-002 | `resolved_decision` | `catalog.write` is the canonical Products write permission; the deployed SQL/RLS migration must be aligned through a forward migration. | Runtime policy still differs until implementation and deployed-state verification. | Platform access owner | User approved canonical alignment; add the forward migration and permission parity tests in the approved build. |
| ACC-ERP-011 | `open_decision` | A shared append-only Platform audit record is required before remote Products mutations, but the Platform owner must approve the contract and transaction/retention boundary. | Remote writes remain disabled until the shared capability is approved, implemented and verified. | Platform owner (assignment pending) | Complete Platform reuse/audit review, record owner approval, then implement the shared contract before Products mutations. |
| MIG-ERP-001 | `open_decision` | Actual legacy category keys, workspace IDs and currency values are not available in the repository, and remote database access failed authentication. | No mapping or visibility cutover may be inferred or applied without an authorized inventory and review. | Product owner + Platform data owner | Obtain read-only authorized inventory, produce a dry-run report, and keep this task blocked until reviewed. |
| ERP-OD-002 | `open_decision` | MiauCraft's exact Shopify sync scope, field ownership, write operations and handling of orders/customers are not yet confirmed by the client. | Connector data loss/overwrite and CRM duplication risk. | MiauCraft + product owner | Conduct client process and data-mapping discovery; default to read-only until approved. |
| ERP-OD-003 | `open_decision` | Whether ERP owns order lifecycle, fulfillment, returns, tax and invoicing vs integrates external systems. | Defines boundaries and dependencies for native Inhand commerce and future ERP modules. | Product owner + Inhand | Decide per capability before design approval. |
| ERP-OD-004 | `open_decision` | Scope of procurement, accounts payable/receivable, general ledger and financial reporting is unknown. | Prevents safe claim that the ERP core is complete or that accounting is in MVP. | Product owner | Keep out of initial implementation until target segment and compliance needs are known. |
| ERP-OD-005 | `resolved_decision` | iOS and Android are excluded from this first release; desktop and mobile web are in scope. | No native parity is claimed. | Product owner | User selected “Sí, solo web escritorio y móvil”; reconsider native scope in a later release. |
| ERP-A-001 | `assumption` | Shopify is initially the source of truth for MiauCraft sales; LoopDev should not replace the storefront or checkout. | Connector direction and data ownership. | MiauCraft | Confirm per entity during discovery; do not enable writes by assumption. |
| ERP-A-002 | `assumption` | CRM remains the canonical owner of customer relationship history; ERP orders hold a scoped reference. | Cross-suite identity and reporting. | Product / CRM | Validate against CRM contracts and customer data rules during design. |

## Handoff to module-design

- Target architecture questions: preserve modular ERP boundaries while planning only Products/categories; use the existing adapter boundary and require an explicit local-demo or Supabase mode. Reconcile actual remote schema/RLS before remote writes.
- UX questions: use the approved Products/category wireframes as conceptual source; define and test each desktop and mobile-web operation, states, direct route and accessible interaction.
- Domain questions: product class, SKU, category, sourcing, currency, scope and archive-only decisions are confirmed; only actual legacy data mapping remains dependent on a reviewed inventory.
- Platform reuse/extension questions: reuse current organization, authorization, Rivera and shared UI contracts; Platform audit is a required shared extension whose owner must approve the contract before implementation.
- Required decisions before planning: none for Products/categories scope. The audit owner approval and authorized remote-data inventory are task-level blockers, not reasons to expand scope or guess behavior.
- Blocker resolution decisions: first release is Products/categories only; native apps, Shopify, Inhand and other ERP modules are deferred; remote Products are online-only; all records are archive-only; readers can see sales prices/offers; a shared append-only Platform audit record is required before remote writes.
- Discovery state: `partial`
