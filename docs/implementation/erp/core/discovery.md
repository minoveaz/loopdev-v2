# ERP Core Capability Map Discovery

## Document control

| Field | Value |
|---|---|
| Module | ERP Core Capability Map |
| Suite | ERP |
| Run ID | `MOD-CORE-20261024-001` |
| User request | Define a cross-sector SME ERP capability map, separate ERP from Platform, CRM and public channels, and prioritize MiauCraft before Inhand. |
| Product definition | `docs/06-product/products/PRODUCT_CATALOG_GLOBAL_TRACK.md`; user confirmed a cross-sector SME target, while the first release scope remains open. |
| Discovery status | `partial` |
| Owner | Product / ERP; accountable individual to be assigned |

## Problem and objective

- Business problem: LoopDev has an implemented ERP entry point and a product catalog foundation, but the product boundary and current/future ERP capabilities are not documented as one approved map. Two new commerce clients expose distinct operating models: MiauCraft keeps Shopify; Inhand starts with a LoopDev-owned commerce backend.
- Primary objective: Establish an evidence-based, sector-neutral SME capability map across Platform, CRM, ERP and public channels. Prioritize MiauCraft as the first client case and Inhand as a later native-commerce case.
- Success measure: Every candidate capability has an owner, product classification, existing-state evidence, consumers, platform scope and a next decision/action; no user-specific flow duplicates shared Platform or CRM data.
- Explicit boundary: This is discovery for the ERP core roadmap, not approval to build a complete ERP, accounting suite, storefront builder, or every capability found in market references.

## Actors and outcomes

| Actor | Job to be done | Outcome | Permissions/constraints |
|---|---|---|---|
| LoopDev product owner | Decide what belongs to ERP and its release sequence | Approved cross-sector ERP capability map and bounded MVP | Cross-sector SME target confirmed; module sequencing and MVP remain to be approved |
| MiauCraft administrator/operator | Continue selling with Shopify while using LoopDev for agreed administration and operational context | Shopify remains the sales system; LoopDev adds selected connected workflows | Data ownership and write permissions must be explicit per entity |
| Inhand commerce operator | Run a new physical-goods business using LoopDev's commerce backend | Manage products, orders and a single stock location; use an external payment provider | Tax, fulfillment, shipping and returns scope remains open |
| Inhand storefront customer | Browse and purchase through Inhand's public storefront | Responsive customer-facing purchase journey backed by LoopDev contracts | Public channel is distinct from the authenticated ERP administration surface |
| CRM user | Manage customer relationships and sales context | Customer identity and interactions remain available in CRM | ERP references CRM-owned customer records rather than creating a parallel customer master |
| ERP administrator | Configure products and, later, operational modules | Tenant-scoped ERP configuration | Organization scope, permission checks and audit behavior apply |
| SME sales, purchasing, inventory and finance operators | Execute sector-neutral operational workflows | Connected order-to-cash, procure-to-pay and inventory/finance views where applicable | Exact role templates and country-specific obligations remain open |

## Expected domain capabilities

| Capability | Classification | Expected behavior | Priority |
|---|---|---|---|
| Global product/service catalog | `REQUIRED_MVP` | Own one sector-neutral product master for finished products, raw materials/components and services; distinguish item class from independently combinable purchasing, selling and inventory-tracking uses; give each product a LoopDev-generated, immutable internal key unique within the organization and distinct from its SKU; give each variant an immutable generated key distinct from SKU and unique within the organization; give the product base a general category and each separately managed/sold SKU its own category and organization-unique SKU; allow finished products buy/make/both sourcing, raw materials/components buy only for now, and no sourcing for services; inherit sourcing in variants. | Foundation; existing partial implementation; proposed classification/category model is not implemented |
| Product category hierarchy | `REQUIRED_MVP` | Manage a hierarchical category tree inside Products and assign one primary category to each product; categories do not encode item class or sourcing. | Foundation; category key exists, but category entity/tree management is missing |
| Catalog pricing and availability | `REQUIRED_MVP` | Maintain price books, prices and commercial availability with scope and validity. Distinguish catalog availability from physical on-hand stock. | Foundation; verify contract and remote parity |
| Channel integration boundary | `REQUIRED_MVP` | Connect a channel adapter to ERP contracts while defining source of truth, external IDs, sync, errors and recovery per entity. | MiauCraft first |
| Shopify integration for MiauCraft | `REQUIRED_FOLLOW_UP` | Keep Shopify as the public sales platform; expose only the agreed Shopify data and operations in LoopDev. The exact initial sync set and permitted writes remain open. | First client delivery after discovery/design |
| Sales orders and commerce lifecycle | `REQUIRED_FOLLOW_UP` | Represent a native LoopDev order lifecycle for Inhand and an explicitly external/synchronized order view for MiauCraft if approved. | Inhand after MiauCraft pilot |
| Basic inventory for Inhand | `REQUIRED_FOLLOW_UP` | Track physical stock for one warehouse and define reservation/adjustment rules needed to prevent overselling. | Inhand first-release candidate |
| CRM customer relationship | `PLATFORM_REUSE` | Link ERP orders and channel records to CRM-owned customers/contacts where identity is confidently resolved; preserve CRM ownership of relationship history. | Cross-suite |
| Procurement and supplier purchasing | `OPEN_DECISION` | Decide whether purchase orders, receipts and supplier workflows belong in the ERP roadmap and for which target customers. | Not approved |
| Fulfillment, shipping, returns and refunds | `OPEN_DECISION` | Define the boundary between order management and fulfillment, including carrier integration and returns policy. | Not approved; especially open for Inhand |
| Billing and accounting | `OPEN_DECISION` | Decide whether ERP owns invoicing/ledger/accounting or integrates with specialist systems; payment-provider status is not accounting. | Not approved |
| Public storefront renderer | `OUT_OF_SCOPE` | Shopify remains MiauCraft's storefront. Inhand's custom storefront is a separate customer-facing channel consuming ERP commerce contracts, not an ERP admin page. | Separate channel scope |
| Shared Platform capabilities | `PLATFORM_REUSE` | Reuse organization scope, authorization, activity, files, notes, tasks and common UI/adapters; extend Platform only with an approved cross-suite gap. | Required integration rule |
| Sales and order management | `OPEN_DECISION` | Candidate cross-sector workflow for quotations, orders and fulfillment handoff; exact relationship with CRM opportunities and external channels remains to be designed. | Candidate capability; release sequence open |
| Procurement and supplier purchasing | `OPEN_DECISION` | Candidate purchase requests/orders and receipt workflow, separate from CRM relationship history. | Candidate capability; release sequence open |
| Inventory and stock operations | `OPEN_DECISION` | Candidate inventory ledger and location-aware availability for organizations that hold physical goods; service-only businesses may not enable it. | Candidate capability; release sequence open |
| Finance and billing | `OPEN_DECISION` | Candidate invoices and payment reconciliation; statutory accounting, tax and ledger ownership are not approved. | Candidate capability; jurisdiction and provider decisions open |
| Operational reporting | `OPEN_DECISION` | Candidate operational reports across ERP-owned transactions, respecting source ownership and tenant permissions. | Candidate capability; initial measures and export rules open |
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
- Approved scope: global catalog foundation; ERP is a separate product surface; target customers are SMEs across sectors; MiauCraft remains on Shopify and is the first client case; Inhand is the later native-backend case with physical goods, one warehouse and external payment processing.
- Explicit exclusions: the existing global catalog work excludes orders, inventory, billing/finance, procurement, payment processing, logistics and broad transactional systems. The cross-sector target does not approve every module for the first release; detailed scope remains open.
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
| ERP capability map and suite ownership | Separate Platform, CRM, ERP and channel responsibilities | User request; issue #36 | No comprehensive approved map found | `MISSING` | Current route/product docs show catalog foundation only | Approve the capability map and ERP product boundary |
| Product/service catalog | Sector-neutral product master with agreed item classes, operational uses, hierarchical categories, sourcing and separate-SKU variants | Global Product Catalog track; `ERP-DEC-005` | ERP routes, typed domain, local store, adapter, migration and local tests; no class/category-tree/sourcing implementation evidence | `EXISTS_PARTIALLY` | Source/test evidence above; user-confirmed concepts recorded in `CR-ERP-PRODUCT-MASTER-MODEL` | Preserve legacy contract; ambiguous class mappings must not be guessed and remain drafts pending review; verify remote behavior and map the missing master concepts in `02-domain`/`04-api` |
| Product category management | Hierarchical category tree managed within Products; one general category on the product base and an independently assigned category on each SKU variant; drafts may omit categories but active items require one; category keys are generated, immutable and organization-unique | User-confirmed product model; `ERP-DEC-005`, `DOM-ERP-006`, `DOM-ERP-010`, `DOM-ERP-011`, `DOM-ERP-008` | `CatalogItem.categoryKey` exists, but no category entity, hierarchy or variant-category field/management operations were found | `EXISTS_PARTIALLY` | `src/loopdev/domains/catalog/types.ts`; scoped source review; user decisions recorded in `domain-model.md` | Category lifecycle and key scope are defined; resolve legacy `categoryKey` mapping before planning, then implement base/SKU category ownership and activation validation |
| Catalog remote persistence | Organization-scoped remote catalog | Product track says no Supabase integration; current code and migration include partial Supabase support | Six tables exist in migration; some remote reads are stubs; no runtime evidence collected | `EXISTS_BUT_CONFLICTS` | `supabase_catalog_foundation` migration and `supabaseCatalogAdapter` | Update source-of-truth product evidence after verifying deployed schema and runtime |
| Catalog authorization parity | Same least-privilege actions for local and remote adapters | Platform access/RLS policies | Supabase migration grants `catalog.read`/`catalog.manage`; local adapter calls `catalog.read`/`catalog.write` | `EXISTS_BUT_CONFLICTS` | `local.ts`, `supabase.ts`, ERP migration | Resolve canonical permission IDs before adding new ERP operations |
| Shopify integration for MiauCraft | Connected management path while Shopify remains sales platform | User direction; issue #36 | No Shopify connector, connection domain or sync evidence found | `MISSING` | No Shopify source/adapter in inspected runtime | Discover data/operation ownership, then design connector and sync policy |
| Sales orders / order lifecycle | Native Inhand order ownership and explicit external order projection for MiauCraft | User direction for Inhand; MiauCraft details open | No ERP order domain/routes/migration found; CRM quotes exist separately | `MISSING` | Scoped source/migration search | Define lifecycle, source-channel model and CRM linkage |
| Inventory | Single-warehouse physical stock for Inhand; no replacement of Shopify stock without approval | User direction for Inhand | No ERP inventory domain/route/migration found | `MISSING` | Scoped source/migration search | Define stock ledger, reservations and reconciliation before design |
| Procurement/supplier orders | Potential ERP capability | Market baseline only; no client requirement confirmed | No implementation evidence found | `NOT_TESTED` | No approved source/consumer | Decide whether to include in broader ERP roadmap |
| Finance/accounting | Potential ERP capability; payment status is not general ledger | Market baseline only; no client requirement confirmed | No ERP accounting module evidence found | `NOT_TESTED` | No approved product definition | Decide whether to own finance or integrate specialist systems |
| CRM customer relationships | ERP references customer identity and CRM history | CRM product/docs | CRM contacts, Customer 360 and quote references exist | `EXISTS_PARTIALLY` | CRM routes and catalog reference test | Define shared party/customer ID and permissions; do not duplicate CRM master |
| Public storefront | Shopify for MiauCraft; independent storefront consumer for Inhand | User direction | No Inhand public commerce storefront identified in ERP routes | `MISSING` as a separate channel | Current ERP routes are authenticated admin surfaces | Scope storefront separately from ERP admin and secure its API |

## Scope boundaries

### MVP

- Complete and approve an evidence-backed ERP capability map and ownership boundary.
- Preserve and verify the existing Product Catalog as the initial ERP foundation; do not assume remote parity until it has runtime evidence.
- Prioritize discovery/design of MiauCraft's Shopify connection while Shopify remains its sales platform.
- Record Inhand's confirmed constraints for the later design: physical products, LoopDev-owned commerce backend, one warehouse and external payments.
- Desktop web and mobile web are required for any user-facing ERP capability; native platforms remain planned pending an accountable scope decision.

### Follow-up

- MiauCraft connector build and pilot after data ownership, sync operations, security and acceptance criteria are approved.
- Inhand order, inventory and checkout/payment-provider integration after MiauCraft's pilot and the Inhand-specific product decisions.
- Procurement, fulfillment, returns, tax/localization, finance and reporting after customer need and product ownership are confirmed.

### Out of scope

- Building a full ERP suite from market feature lists.
- Replacing Shopify or moving MiauCraft's checkout/payments to LoopDev.
- Direct storage or processing of payment-card data by LoopDev.
- Inhand multi-warehouse, advanced WMS, manufacturing, statutory accounting or native apps before approval.
- Rebuilding Platform notes, tasks, files, relations, activity, customer records or shell/navigation locally in ERP.

## Contradictions, assumptions and open decisions

| ID | Type | Finding | Impact | Owner | Resolution |
|---|---|---|---|---|---|
| ERP-OD-001 | `resolved_decision` | The ERP capability map targets SMEs across sectors, not only MiauCraft and Inhand. | Establishes a sector-neutral product direction; does not approve a full ERP or a specific first-release module set. | Product owner | Confirmed by the user: “ERP transversal para pymes de distintos sectores desde el inicio.” |
| ERP-DEC-005 | `resolved_decision` | Products uses one item master with classes for finished products, raw materials/components and services; semimanufactured items are deferred until Manufacturing discovery. Operational purchasing, selling and inventory tracking are independent uses. The product base has one general category; each separately managed/sold SKU has its own category, which may differ from the base or sibling variants. Drafts may omit category, but activation requires one. Sourcing is defined on the product and inherited by variants. | Defines the agreed conceptual boundary for Products while leaving implementation contracts and field names to specialized analysis. | Product owner | Confirmed in the user's answers to the product-model questions; SKU-level ownership and category timing were confirmed during domain decisions and are recorded in `domain-model.md`. |
| ERP-A-003 | `resolved_decision` | Variants inherit the product's sourcing rule but have their own independently assigned primary category. | Keeps sourcing consistent at product level while allowing classification of each concrete SKU. | Product owner + ERP domain | User confirmed the product base retains a general category and each variant/SKU can have its own category; `DOM-ERP-006`. |
| ERP-DEC-007 | `resolved_decision` | SKU is unique across the organization after trimming outer whitespace and comparing case-insensitively; stored SKU preserves entered case. | Prevents ambiguity when identifying or referencing a concrete product/SKU across products and workspaces. | Product owner | User selected organization-wide uniqueness and SKU storage/comparison semantics; product, variant and category keys are separately LoopDev-generated, immutable, distinct from SKU/name and organization-unique. |
| ERP-OD-006 | `open_decision` | Which ERP modules and operational workflows belong in the first validated release for cross-sector SMEs? | Prevents broad market intent from being mistaken for an unbounded MVP. | Product owner | Design a modular baseline and propose sequencing; validate with target customers before plan approval. |
| ERP-CF-001 | `contradiction` | Product Catalog documentation states there is no Supabase integration, but current source has a Supabase adapter and migration for six tables. | Risks planning against stale product state or assuming deployed persistence that has not been verified. | ERP/platform | Verify migration deployment and runtime; revise product evidence in the appropriate approved source. |
| ERP-CF-002 | `contradiction` | Local catalog checks `catalog.write`, while the SQL/RLS migration defines `catalog.manage` for writes. | Authorization behavior may differ between local and remote adapters. | Platform access owner | Select canonical permission IDs and add contract/parity tests before connector build. |
| ERP-OD-002 | `open_decision` | MiauCraft's exact Shopify sync scope, field ownership, write operations and handling of orders/customers are not yet confirmed by the client. | Connector data loss/overwrite and CRM duplication risk. | MiauCraft + product owner | Conduct client process and data-mapping discovery; default to read-only until approved. |
| ERP-OD-003 | `open_decision` | Whether ERP owns order lifecycle, fulfillment, returns, tax and invoicing vs integrates external systems. | Defines boundaries and dependencies for native Inhand commerce and future ERP modules. | Product owner + Inhand | Decide per capability before design approval. |
| ERP-OD-004 | `open_decision` | Scope of procurement, accounts payable/receivable, general ledger and financial reporting is unknown. | Prevents safe claim that the ERP core is complete or that accounting is in MVP. | Product owner | Keep out of initial implementation until target segment and compliance needs are known. |
| ERP-OD-005 | `open_decision` | iOS/Android support and accountable owners are not decided. | Multiplatform delivery cannot claim native parity. | Product/platform owner | Keep native surfaces planned and assign an owner/follow-up before plan approval. |
| ERP-A-001 | `assumption` | Shopify is initially the source of truth for MiauCraft sales; LoopDev should not replace the storefront or checkout. | Connector direction and data ownership. | MiauCraft | Confirm per entity during discovery; do not enable writes by assumption. |
| ERP-A-002 | `assumption` | CRM remains the canonical owner of customer relationship history; ERP orders hold a scoped reference. | Cross-suite identity and reporting. | Product / CRM | Validate against CRM contracts and customer data rules during design. |

## Handoff to module-design

- Target architecture questions: treat ERP as a modular cross-sector SME suite; separate Products, Sales/Orders, Inventory, Procurement, Finance and Reporting capabilities; keep channel adapters replaceable; reconcile remote catalog and permission contradictions. Preserve `ERP-DEC-005` as the approved Products model and implement independently assigned category ownership for each SKU.
- UX questions: decide which shared ERP overview surfaces are useful beyond catalog counts; distinguish internal ERP administration from public storefront; define mobile operations rather than just responsive rendering.
- Domain questions: define source-of-truth per entity, external IDs, order lifecycle, stock movement/reservation rules and CRM customer identity.
- Platform reuse/extension questions: reuse current organization/RLS and Platform contracts; resolve shared integration credential/connection ownership; do not duplicate CRM or collaboration capabilities.
- Required decisions before planning: confirm the first-release module set; confirm MiauCraft data/sync requirements; decide Inhand's market, tax, shipping, returns and inventory reservation behavior; assign native platform owner or exception.
- Discovery state: `partial`
