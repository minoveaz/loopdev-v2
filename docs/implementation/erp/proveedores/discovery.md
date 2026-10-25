# ERP Suppliers Discovery

## Document control

| Field | Value |
|---|---|
| Module | Proveedores |
| Suite | ERP |
| Run ID | `MOD-PROVEEDORES-20261025-001` |
| User request | Start phase 2 of the supplier delivery pilot, including a benchmark of other SaaS products. |
| Product definition | `docs/06-product/products/PRODUCT_CATALOG_GLOBAL_TRACK.md`; `docs/implementation/erp/core/discovery.md` |
| Discovery status | `partial` — product direction approved; country-specific tax rules and implementation contracts remain accountable follow-ups. |
| Owner | Product owner decision pending |
| Environment | `feature/erp-proveedores`, HEAD `ffd9bd16d01438f8dc3efd25be4b646861988476`; working tree modified before this discovery. |
| Platforms | Responsive web (desktop and mobile web) is in scope; native iOS/Android apps are excluded for now. |

## User-confirmed product direction (2026-10-25)

- A Supplier is an ERP-owned commercial entity from which the organization buys products, raw materials, components, or services and pays for delivered value.
- A Supplier may be a company/organization or an individual service provider.
- Suppliers do not belong in CRM by default. CRM integration and supplier listings in CRM are out of scope unless a later user need establishes otherwise.
- One LoopDev product may be supplied by multiple suppliers. Supplier-to-product association is therefore many-to-many; supplier-specific item identity must not replace the LoopDev product master.
- Supplier-provided catalogs must be brought into LoopDev Products through manual item entry, with CSV import as an optional, reviewed path. CSV is not mandatory for the workflow.
- The Supplier master must carry the legal, tax, purchasing, receiving and payee setup needed downstream for purchase orders, receipt into inventory and supplier payment. Payment and inventory transactions remain their own ERP records.
- Supplier tax and bank/payment details are in scope for the Supplier master. The user confirmed that anyone with access to Suppliers may view these fields; changes remain auditable and use the same management permissions as supplier maintenance.
- The same user profiles that can access Products should access Suppliers. Keep the existing role population; whether to use separate supplier permission keys with equivalent grants is a design decision.
- Web is the target: responsive desktop/mobile web is included; native mobile applications are not.

This user direction supersedes earlier discovery assumptions that CRM contact
linking was a likely MVP dependency or that mobile-web delivery should be
deferred.

## Problem and objective

- Business problem: The ERP roadmap explicitly deferred Suppliers and Procurement after the Products foundation. LoopDev has a product-party role named `supplier`, but no independent supplier directory, route, or supplier domain. A product role is not enough to establish a reusable supplier identity or purchasing lifecycle.
- Primary objective: Establish a sourced, current-state baseline and a bounded proposal for an independent ERP Suppliers module, so product and design decisions can be made before implementation.
- Success measure: Three official SaaS references are compared; existing LoopDev ownership, routes, contracts, and gaps are evidenced; candidate scope and unresolved decisions are explicit; no benchmark feature is silently approved.
- Explicit boundary: This is discovery only. It does not approve an MVP, domain model, API, persistence schema, permissions, migrations, Procurement, or production implementation. The delivery ledger remains `draft`.

## Actors and outcomes

| Actor | Job to be done | Outcome | Permissions/constraints |
|---|---|---|---|
| Purchasing operator (confirmed product actor) | Maintain supplier relationships and the products/services each supplier offers | Find a supplier, review its offered items and maintain supplier-product links | Same user profiles as Products; operations still need design. |
| Product operator (confirmed product actor) | Keep LoopDev's internal product master correct while adding supplier-sourced items | Create a new product or link a supplier item to an existing LoopDev product | Product Catalog remains owner of internal products and SKUs. |
| Organization administrator | Control who can see and maintain supplier data | Tenant-scoped, auditable access | Same role population as Products; exact permission-key mapping remains a design decision. |
| Finance / Accounts Payable | Maintain supplier tax/payee setup and later reconcile invoices and payments | Identify the legal supplier, use verified payee instructions and settle supplier liabilities | Tax/bank fields are visible to the same users as Suppliers; changes need audit, and payment transactions remain Finance-owned. |

## Expected domain capabilities

| Capability | Classification | Expected behavior | Priority |
|---|---|---|---|
| Supplier master and P2P setup | `REQUIRED_MVP` | ERP-owned supplier identity includes legal/tax identity, role-based contacts and addresses, purchase defaults and verified payee instructions needed by downstream Procurement, Inventory and Finance. | User-confirmed end-to-end readiness |
| Supplier assortment / supplier-product link | `REQUIRED_MVP` | Represent one supplier offering many LoopDev products and one LoopDev product sourced from many suppliers; preserve a separate supplier item identity. | Confirmed many-to-many relationship |
| Supplier catalog intake | `REQUIRED_MVP` | Support manual supplier-item entry; an optional CSV import may add multiple supplier items through preview, matching and review. Import must not silently overwrite canonical Product data. | Manual baseline and optional CSV confirmed; CSV format and rollout remain for design |
| Supplier-specific commercial data | `REQUIRED_MVP` | SupplierItem links the supplier's reference/name to a LoopDev Product/variant and stores purchasing UOM/conversion and default price/currency, with quantity breaks and lead time where supplied. | Required to prepare accurate purchase lines; exact optional fields need design |
| Purchase and payment lifecycle | `REQUIRED_FOLLOW_UP` | Purchase Orders, Purchase Receipts/Inventory movements, Purchase Invoices and Payments consume Supplier and SupplierItem data; each transaction captures its own date, quantities, destination, actual receipt and settlement facts. | Required downstream ERP outcome; keep transaction ownership in Procurement, Inventory and Finance |
| CRM relationship | `OUT_OF_SCOPE` | Suppliers are ERP commercial counterparties; do not create or link CRM records by default. Revisit only for an explicit cross-suite use case. | User decision |
| Tenant, access, audit and platform integration | `PLATFORM_REUSE` | Reuse organization scope and existing Products role grants; use shared Platform capabilities only where supplier workflows need them. | Same role population confirmed; permission mapping remains open |

## Inputs, outputs and events

### Inputs

- Entities: Organization scope; Supplier; LoopDev `CatalogItem`/variant; supplier-provided item and supplier-to-product association; future purchase documents.
- Commands (candidate only): List/search/view/create/update/deactivate suppliers; manage role-based contacts/addresses, purchasing defaults, tax profile and verified payee accounts; view the supplier's assortment; add supplier items manually or import an optional reviewed CSV; match an item to a LoopDev Product/variant; start Product creation; update/deactivate supplier links. Purchase orders, receipts, inventory postings, invoices and payment executions remain commands of their owning modules.
- External/Platform data: Organization membership and the same role population as Products; LoopDev product catalog; supplier-provided product/service data. CRM is not a dependency.

### Outputs

- Read models: Tenant-scoped supplier directory/detail and the supplier's offered items, with links to canonical LoopDev products.
- Mutations: Maintain Supplier; capture supplier item data; link a supplier item to one internal product or create an internal product through Products; preserve multiple supplier links to one product.
- User-visible outcomes: Users can see which supplier offers a product and which internal product a supplier catalog entry represents, without duplicating or silently overwriting the LoopDev product master.

### Events

| Event | Producer | Consumers | Payload/invariants | Idempotency/audit |
|---|---|---|---|---|
| Supplier created/updated/deactivated (proposed event) | ERP Suppliers | Supplier assortment and future Procurement | Stable supplier ID and organization scope; do not include full tax/bank values in broadly delivered event payloads. | Audit/versioning and event delivery semantics require design. |
| Supplier-product link changed (proposed event) | ERP supplier assortment; ownership open | Products and future Procurement | Stable supplier ID, supplier-item ID, catalog item/variant reference, organization scope. | Idempotency, effective dates and history require design. |
| Supplier catalog intake completed (proposed event) | Supplier catalog intake | ERP Products and supplier assortment | Source file/batch reference, review outcome, created/matched item IDs; never silently overwrites the product master. | Import retry and duplicate behavior require design if file import is approved. |

## Entities, relationships and lifecycle

| Entity | Owner | Relationships | States | Invariants |
|---|---|---|---|---|
| Supplier | ERP / Suppliers (confirmed ownership direction) | Many role-tagged contacts/addresses, SupplierItems, purchasing/accounting defaults and future transaction references | Active, inactive or on-hold lifecycle to design | Legal/tax identity and payment setup are part of the master; all Supplier readers may view tax/bank data per user direction; changes must be audited; no CRM mirror. |
| SupplierItem / SupplierProduct | ERP Supplier assortment, linked to Products | One Supplier; one internal `CatalogItem` or variant; supplier SKU/name, purchase UOM/conversion, default price/currency and lead-time/quantity terms | Active/deactivated or dated validity to design | Many suppliers may offer one LoopDev product; one supplier may offer many products. Keep LoopDev Product identity canonical; snapshot terms on each order. |
| `CatalogItem` / variant | ERP / Products | SupplierItem associations; may be supplied by multiple suppliers | Existing product lifecycle | Products remains the canonical internal identity/SKU. Supplier data must not overwrite it without an explicit reviewed update. |
| `ProductPartyRole` (existing) | ERP Product Catalog | Product-bound party label with `partyKey`/`partyName` | Existing local records | Not a supplier master or many-to-many operational contract; read-only adapter method and empty remote implementation. |
| Purchase Order / Receipt / Invoice / Payment | Procurement / Inventory / Finance bounded contexts | Supplier, SupplierItem, internal product, warehouses, tax and payment instructions | Not modeled in this supplier directory | Transaction facts belong to transaction records; the Supplier profile supplies defaults and references but does not hold per-order/receipt/payment history. |

## Supplier master field inventory for purchase-to-pay readiness

The user has expanded the requirement: Supplier must hold the master data and
defaults needed to place purchase orders, receive goods into inventory and
later pay the supplier. This does **not** mean putting individual order,
receipt or payment transactions into the Supplier record. Those remain in
Procurement, Inventory and Finance.

| Record/group | Minimum fields | Requiredness / rules |
|---|---|---|
| Supplier identity | Stable internal supplier ID; supplier kind (`organization/business` or `individual`); legal/registered name; country of registration/residence; commercial/trading name when different | Required; individuals and organizations are both confirmed. Legal name, kind and country are the payee identity baseline. |
| Legal/tax identity | Tax jurisdiction; applicable tax/registration identifier(s) such as VAT/GST/TIN; tax category and withholding/reporting classification where the jurisdiction requires them | Required conditionally for compliant purchasing, invoices and payments; fields must be jurisdiction-aware rather than assuming one country's tax model. |
| Supplier lifecycle | Active/inactive/on-hold status; hold reason/scope and optional release date; created/updated actor and timestamps | Required controls; exact transitions and whether holds block orders, receipts, invoices or payments must be designed. Preserve history rather than deleting a referenced supplier. |
| Addresses | One or more typed addresses: registered/legal, billing, purchase-order, ship-from/dispatch, remit-to/payment and returns; country/region, address lines, city, postal code; primary/default per purpose | Required address roles for the relevant downstream workflow; do not assume one address serves all purposes. |
| Contacts | Multiple contacts with role (`purchasing`, `receiving/logistics`, `accounts_payable/invoices`, `remittance`), name, email, phone, preferred flag and active state | Required role coverage; each role may reuse one contact, but separate contacts must be supported. |
| Purchasing defaults | Default purchase currency; payment-terms reference; preferred supplier price list/offer source; default order contact/address; delivery terms/Incoterm and general lead-time default where applicable | Required defaults where the organization uses them; a purchase order may override and must snapshot its chosen values. |
| Tax defaults | Supplier tax category, purchase tax/withholding profile and jurisdiction-specific reporting flags | Conditional on country and company policy; visible under the confirmed Supplier access policy, with edits audited. |
| Payee/payment instructions | Beneficiary/account-holder name; payment method; one or more supplier bank accounts with bank country/name, account number or IBAN, routing/branch code where applicable, SWIFT/BIC where applicable, account currency, preferred account, active/verification status and change audit | Bank transfer requires a verified account; payment methods without bank transfer need their own instructions. Bank changes must be auditable; verification/approval rules remain for design. |
| Finance mapping | Per buying legal entity/company, references to payable and advance accounts or equivalent Finance configuration; remittance/invoice delivery contact and electronic invoice identifier where legally required | Conditional on the Finance model and jurisdiction; store references to chart-of-accounts setup, not arbitrary account-name text. |
| SupplierItem / supplier offer | Supplier item name and supplier SKU/reference/barcode; linked LoopDev Product and optional variant; purchase UOM and conversion to stock UOM; default unit price and currency; minimum quantity/quantity break; lead time; validity dates; active state | Required supplier-to-product association for accurate order lines and stock mapping. Commercial terms may be absent only when entered on each order; the choice must be explicit. |

### Data that belongs on downstream transaction records

| Transaction | Capture on the transaction, not as mutable Supplier fields |
|---|---|
| Purchase Order | Buyer/company, order and required-by dates, supplier and selected order/remit addresses, item/variant, ordered quantity, purchase UOM/conversion, price/discount/tax snapshots, destination company warehouse, source requisition/quotation, approval and order status. |
| Purchase Receipt / inventory movement | Actual posting date/time, supplier delivery note, accepted/rejected quantity, actual receiving and reject warehouses, lot/serial/expiry, inspection result, discrepancy and source PO. The warehouse is LoopDev's, not the supplier's. |
| Supplier Invoice / payment | Supplier invoice number/date, matched PO/receipt, invoice totals/taxes/due dates, payment amount/date/currency, selected verified bank account or other payment method, payment reference, approval and settlement status. |

These boundaries keep the Supplier profile reusable while preserving an
auditable order → receipt/stock → invoice/payable → payment trail. Never
duplicate transaction history as editable fields on the Supplier card.

## Platform and suite integration

| Capability/module | Decision | Consumed contract | Produced data/events | Duplicate prohibited? |
|---|---|---|---|---|
| Organization and tenancy | `REUSE` candidate | Shared `EntityScope` / organization scope and existing tenant context; final persistence policy requires access design. | A possible tenant-scoped supplier entity. | Yes; do not introduce a second organization or membership model. |
| ERP Product Catalog | `REUSE` with boundary decision | `CatalogItem`, `ProductPartyRole`, and `CatalogAdapter` in `src/loopdev/domains/catalog/`. | Possible stable supplier references on products. | Do not treat a free-text party role as the supplier master. |
| CRM | `OUT_OF_SCOPE` by default | No CRM contract is required for supplier identity or assortment. | None in the current direction. | Do not create suppliers as CRM contacts or surface supplier records in CRM without a new use case. |
| Platform permissions | Reuse existing Products role population | Existing organization permission matrix; Products currently uses `catalog.read` / `catalog.write`. | Same users should access Suppliers; mapping to supplier-specific permission keys remains open. | Yes; do not add new user profiles or a local authorization model. |
| Platform Notes, Tasks, Activity, Files | Reuse only if an approved supplier task needs them | Shared Platform contracts/components. | Linked records only if approved. | Yes; no local clone or duplicate primitive. |
| Procurement / Inventory / Finance | Required downstream consumers; their transaction records remain separate | Purchase-order, stock-receipt and AP/payment contracts remain to be designed by their owning modules. | Supplier identity, SupplierItem offers, tax/purchasing defaults and payee instructions. | Do not duplicate PO, receipt, invoice or payment history on Supplier. |

## Market/domain baseline

| Reference capability | Why expected | Relevant to MVP? | Evidence/source |
|---|---|---:|---|
| Supplier identity, addresses and buying defaults | ERPNext and Business Central separate the durable supplier/payee record from its documents and reuse supplier defaults for purchasing. | Required Supplier master baseline; adapt to LoopDev and local jurisdictions. | ERPNext Supplier; Business Central Register New Vendors. |
| Supplier tax and payee setup | ERPNext documents tax IDs/categories/withholding and company-specific payable accounts; Business Central documents multiple vendor bank accounts, preferred account and approval/monitoring for sensitive changes. | Required for the requested P2P readiness, with jurisdiction-aware fields, broad Supplier-reader visibility and auditable changes. | ERPNext Supplier; Business Central Set up vendor bank accounts. |
| Supplier-specific product offers | Odoo's supplier pricelist supports supplier/product identity, minimum quantity, unit price, lead time and multiple suppliers per product. | Required data to prepare accurate purchase lines; selected terms must be snapshotted on the PO. | Odoo Purchase — Import vendor pricelist. |
| Purchase, receipt and payment document boundaries | ERPNext separates a purchase commitment, physical receipt/stock movement, supplier invoice/payable and payment; each has different dates, quantities, warehouses and accounting effects. | Required connected ERP outcomes; these are separate transaction records, not fields to mutate on Supplier. | ERPNext Purchase Order and Purchase Receipt. |

## External benchmark and source register

Research must use three to five relevant references and record access dates.

| Reference | Source URL | Accessed | Observed capability/pattern | Classification | LoopDev applicability | Tradeoff / do not copy |
|---|---|---|---|---|---|---|
| ERPNext — Supplier | https://docs.frappe.io/erpnext/supplier | 2026-10-25 | Supplier is a durable record used across RFQs, purchase orders, receipts, invoices and payments. The guide also describes supplier group/type, currency/price list/payment terms, and related contacts/addresses. | `INDUSTRY_BASELINE` | Confirms supplier identity and P2P defaults as reusable setup patterns; adapt fields to LoopDev and applicable jurisdictions. | Do not copy the ERPNext form or its accounting model wholesale; keep transaction history in owning modules. |
| Odoo 19 — Import vendor pricelist | https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/purchase/products/pricelist.html | 2026-10-25 | A vendor-price row ties a vendor to an internal product and supports vendor item reference, minimum quantity, price, lead time and sequence. CSV/XLSX import/export supports multiple vendor rows per product; an external ID prevents import duplicates. | `TRANSFERABLE_PATTERN` | Supports an optional reviewed CSV path and informs SupplierItem fields; CSV columns and commercial fields remain LoopDev design choices. | Odoo's purchase module and field set are not LoopDev requirements; do not silently treat imported supplier data as the canonical product master. |
| Microsoft Dynamics 365 Business Central — Register a new vendor | https://learn.microsoft.com/en-us/dynamics365/business-central/purchasing-how-register-new-vendors | 2026-10-25 | Vendors have a durable card and may use templates; multiple remit-to addresses and vendor-specific purchase settings are documented. | `INDUSTRY_BASELINE` | Confirms reusable vendor identity, role-based addresses and purchasing defaults distinct from documents. | Defer templates and number-series behavior until validated; do not mirror its form layout. |
| Microsoft Dynamics 365 Business Central — Set up vendor bank accounts | https://learn.microsoft.com/en-us/dynamics365/business-central/purchasing-how-set-up-vendors-bank-accounts | 2026-10-25 | Supports multiple vendor bank accounts, a preferred payment account, sensitive-field monitoring and an approval workflow for bank-account changes. | `TRANSFERABLE_PATTERN` | Supplier bank instructions need verification, change history and auditable management under the user-confirmed broad visibility policy. | Do not copy its permission model; do not silently accept or overwrite changed payout details. |
| ERPNext — Purchase Order and Purchase Receipt | https://docs.frappe.io/erpnext/purchase-order; https://docs.frappe.io/erpnext/purchase-receipt | 2026-10-25 | Purchase orders snapshot supplier, dates, items, quantities, rates, taxes, terms and destination warehouse; receipts separately record actual accepted/rejected quantities, warehouses and stock effects. | `INDUSTRY_BASELINE` | Confirms these are downstream transaction records that consume Supplier and SupplierItem defaults, not editable Supplier master fields. | Do not collapse PO, receipt, invoice and payment lifecycle into the Supplier form. |

All references are official product documentation. Observations describe the documented products, not a claim that the same capabilities are universally required.

## LoopDev differentiation hypotheses

Do not add these to MVP without product approval.

| Hypothesis | User value | Product behavior changed | Platform/domain impact | Complexity | Validation experiment | Decision |
|---|---|---|---|---|---|---|
| Keep LoopDev Product as the canonical product while mapping each supplier's catalog entry | Avoid duplicate product masters and retain supplier-specific references | Supplier item is linked to an existing internal product or goes through Products creation/review | Product/Supplier ownership boundary, match/duplicate rules, source traceability | High | Walk through real supplier catalogs and map same/different products, pack sizes and variants. | `explore` |
| Let buyers compare multiple suppliers for a product without making one supplier the exclusive source | Improve sourcing resilience and preserve choice | One internal product can link to multiple supplier items; supplier offers provide defaults while each PO snapshots selected terms | SupplierItem relation, Procurement selection, historical price snapshots | Medium | Validate how users select an offer when quantity, price, lead time or currency differs. | `explore` |
| Provide a reviewed supplier-catalog intake instead of blind overwrite | Reduce manual transcription while protecting product data quality | Preview, match, create/link and confirm a supplied list; CSV/XLSX is one candidate | Import parsing, idempotency, duplicate resolution, audit and product ownership | High | Test sample catalogs from intended suppliers and measure volume/error rate. | `explore` |
| Reuse the Products role population while keeping permission semantics explicit | Make supplier access familiar without creating separate user profiles | Existing product users can access supplier surfaces; authorization still enforces organization scope | Permission mapping (`catalog.*` reuse vs supplier-specific keys) | Medium | Compare existing roles and grant matrix; validate desired read/write behavior with an organization admin. | `explore` |

## Product definition currently approved

- Product documents: `docs/implementation/erp/core/discovery.md`; `docs/implementation/erp/core/design.md`; `docs/06-product/products/PRODUCT_CATALOG_GLOBAL_TRACK.md`.
- Approved intent from the user: ERP-owned commercial Supplier entity; supplier catalog items become LoopDev Products; many suppliers may offer one internal product; no CRM integration by default; same user profiles as Products can view the Supplier record and its tax/bank data; responsive web, no native mobile app. The Supplier master supports purchase, receipt and future payment setup, while transaction workflows remain separate.
- Approved implementation scope: None. The delivery ledger remains `draft`; these directions authorize continued discovery and design, not build tasks or schema/API choices.
- Explicit exclusions for this slice: CRM supplier records/listings; native iOS/Android; purchase orders, receipts, invoices, payables and payment execution as Supplier-owned transactions.
- Existing approvals: `supplier-pilot` permits discovery/proposal for `erp/Proveedores`, slice `supplier-directory`. Desktop and responsive mobile web are the target; product acceptance and build approval remain pending.

### Legacy reference policy

Legacy documentation and component/view inventories are informational
evidence, not implementation authority. They must not result in new legacy
components, routes or parallel views. Map any still-required behavior to the
current Rivera template, shared LoopDev primitives and existing LoopDev v2
modules.

| Legacy reference | Informational meaning | Current reuse target | Decision |
|---|---|---|---|
| `docs/06-product/products/PRODUCT_CATALOG_GLOBAL_TRACK.md` phase 9 text mentioning suppliers on product detail | Historical ambition/capability-map context; current phase 9 notes only local ProductPartyRole and no real remote party resolution. | Current ERP Product Catalog contract plus a future Supplier reference, if approved. | `INFORMATIONAL_ONLY` |

## Existing LoopDev implementation

| Area | Existing route/code/doc | Behavior observed | Evidence |
|---|---|---|---|
| ERP entry point | `src/loopdev/pages/erp/Overview.tsx`; `/app/erp/overview` | ERP overview shows product/service catalog counts and links to the product catalog. No supplier section is present. | `Overview.tsx`; `src/routes/LoopdevRoutes.tsx`. |
| Product Catalog | `src/loopdev/pages/erp/ProductCatalog.tsx`; ERP products route | Manages catalog records and links to detail; it is not a supplier directory. | `ProductCatalog.tsx`; `src/loopdev/domains/catalog/adapter/index.ts`. |
| Product-party roles | `src/loopdev/domains/catalog/types.ts`, `adapter/index.ts`, `adapter/local.ts` | `ProductPartyRole` is attached to `catalogItemId`, with role values including `supplier`; API currently exposes listing, not create/update/delete. | `catalog-adapter.test.ts` covers local role listing. |
| Remote ProductPartyRole | `src/loopdev/domains/catalog/adapter/supabase.ts` | `listProductPartyRoles()` currently returns an empty array; remote party persistence/resolution is not implemented. | Supabase adapter line 158; not a remote supplier master. |
| Supplier text on products | `src/loopdev/pages/erp/ProductCatalog.tsx` | Physical product form stores a free-text `provider` under catalog item metadata; service form also has a provider text field. This is not a reusable supplier identity or link. | Product form and item metadata serialization. |
| Product cost reference | `src/loopdev/domains/catalog/types.ts`; `erp_product_cost_references` migration and adapter | Existing cost reference is scoped to organization + product + optional variant, with one row per product/variant and no supplier ID. It cannot record distinct offers/costs per supplier. | Catalog type/adapter; `supabase/migrations/20261024180000_erp_product_details_and_references.sql`. |
| Authorization | Catalog adapter and organization permission matrix | Catalog currently checks `catalog.read` and `catalog.write`; no Supplier contract exists. User requires the same profiles that access Products to access Suppliers. | `src/loopdev/domains/catalog/adapter/local.ts`; `supabase/migrations/20260807000000_platform_core_permissions.sql`. |
| Routes and navigation | `src/routes/LoopdevRoutes.tsx`; `src/loopdev/navigation.ts` | No Suppliers route/navigation entry was found in the current ERP surface. | Direct route/navigation inspection. |

## Expected versus existing

| Capability | Expected | Product source | Existing implementation | Baseline status | Evidence | Next action |
|---|---|---|---|---|---|---|
| Supplier directory and identity | ERP-owned commercial party with list/search/detail and maintenance actions | User-confirmed direction; ERP core docs previously deferred Suppliers | No supplier domain, directory route, or supplier adapter found | `MISSING` | `src/routes/LoopdevRoutes.tsx`; `src/loopdev/navigation.ts`; ERP overview | Design a bounded Supplier master and lifecycle; no CRM mirror. |
| Supplier assortment / many-to-many | Many suppliers can offer the same internal product; each supplier can offer many products/services | User-confirmed direction | ProductPartyRole is product-bound; no supplier-item link exists | `MISSING` | ProductPartyRole types/adapters; no Supplier adapter | Design a supplier-item mapping and whether it attaches to product or variant. |
| CRM supplier records | No CRM relationship or supplier listing by default | User-confirmed direction | No supplier integration found | `NOT_APPLICABLE` | User direction | Keep CRM out unless a separate cross-suite use case is approved. |
| Supplier authorization | Same user profiles as Products, with organization-scoped read/manage behavior and server-side enforcement | User-confirmed role population; shared platform authorization standards | Catalog permission checks exist; supplier-specific policies do not | `EXISTS_PARTIALLY` | Catalog local adapter; platform permissions migration | Map Supplier actions to the existing Products role population and define policy. |
| Supplier P2P master setup | Legal/tax identity, role-based contacts/addresses, purchasing defaults, finance mapping and verified payee instructions; tax/bank visibility follows the same access as Suppliers | User-confirmed purchase–receive–pay readiness; field inventory in discovery | No supplier-specific model or UI found | `MISSING` | No Suppliers route/domain found; benchmark above | Design jurisdiction-aware fields, edit permissions, verification and audit; reconcile field visibility with ERP core access policy. |
| Supplier-specific commercial terms | SupplierItem links supplier SKU/item to Product/variant and stores purchasing unit/conversion, price/currency, minimum quantity and lead-time/validity where applicable | User-confirmed need to place purchase orders and load received stock; Odoo informs the pattern | Existing ProductCostReference has no supplier identity | `MISSING` | Catalog cost reference and Odoo source register | Define required versus optional offer terms and snapshot behavior on PO. |
| Procurement transactions | Separate purchase, receipt, invoice and payment records consume Supplier master and SupplierItem | ERP P2P outcome; transaction ownership remains Procurement, Inventory and Finance | No supplier purchasing flow found in this module scope | `MISSING` | Core ERP discovery; benchmark source register | Discover and implement the transaction workflows in their owning module slices. |

## Scope boundaries

### Current product direction — design baseline, not build approval

- ERP-owned supplier master: list/search/detail, create/update, and a lifecycle action to stop selecting a supplier; exact archive/restore semantics remain open.
- Supplier assortment: a many-to-many link between suppliers and canonical LoopDev Products, including supplier-provided items that may be linked to an existing product or used to start product creation.
- Manual SupplierItem entry is the baseline; CSV import is an optional reviewed path, not a prerequisite. Define the CSV columns, matching, error report and rollout in design; never silently overwrite canonical Product data.
- Responsive web (desktop and mobile web); no native iOS/Android app work.
- Same user profiles as Products; tenant authorization, audit, lifecycle, duplicate/conflict behavior, and precise permission-key mapping remain for design.
- SupplierItem must support purchase unit/conversion and offer defaults; exact requiredness, Product-versus-variant matching, and validity/quantity-break policy remain open.

### Follow-up

- Procurement: supplier quotation requests, purchase orders, purchase receipts or service acceptance, returns/credits, and purchase history.
- Accounts Payable/Finance transactions: supplier invoices, due dates, payment execution and reconciliation. Tax and bank/payee master data are part of Supplier; invoices and settlements remain separate Finance records.
- Automated supplier catalog import/sync, external supplier IDs, versioning, reconciliation, and large-volume duplicate resolution if volume justifies it.
- Supplier contacts/addresses as child records (not CRM links) if the workflow needs multiple contacts, ordering addresses, or service locations.
- Notes, documents, activity, tasks and templates only after actual user need and Platform-reuse validation.

### Out of scope

- No CRM supplier master or CRM supplier listing by default.
- No purchase order, goods receipt, invoice/payables, payment execution or reconciliation as transactions in this Supplier slice; the tax and payee setup needed by those consumers remains part of Supplier master data.
- No native mobile app work or unreviewed bulk import that overwrites the LoopDev product master.
- No production implementation, schema migration, route, API contract, permission grant, or task authorization from this discovery.
- No replication of benchmark product screens or features by default.

## Contradictions, assumptions and open decisions

| ID | Type | Finding | Impact | Owner | Resolution |
|---|---|---|---|---|---|
| DISC-001 | resolved_direction | `ProductPartyRole` supports a local supplier role on a catalog item, but it is not a supplier master; the remote adapter returns no roles. | A new Supplier entity could conflict with free-text/legacy product-party data. | Product + ERP design | User approved SupplierItem drafts that may remain unlinked; a purchasable offer must link to its canonical Product or a variant belonging to it, in the same organization, with a valid purchase-to-stock conversion. Define legacy migration separately; do not auto-promote `ProductPartyRole`. |
| DISC-002 | resolved_scope | A direct Supplier may be a company/organization or an individual service provider. | Entity kind affects legal-name and country semantics, duplicate matching and future payee identification. | Product owner | User confirmed both supplier kinds are in scope. |
| DISC-003 | resolved_scope | No Supplier-to-CRM relationship or CRM supplier listing by default. | A future cross-suite use case would need separate approval and ownership design. | Product owner | User explicitly excluded CRM from the current direction; do not create CRM links by default. |
| DISC-004 | resolved_direction | Supplier lifecycle and delete rules. | Affects discoverability and future transaction eligibility. | Product + domain | User approved `active/on_hold/inactive`, no physical delete, and no rewriting existing PO/receipt/invoice/payment facts. A held or inactive Supplier cannot be selected for a new order; downstream owners retain control of already-open transactions. |
| DISC-005 | open_decision | Identity, contacts, addresses, jurisdiction-aware tax fields and duplicate rules need exact requiredness and validation. | Determines whether Suppliers can identify counterparties and support compliant purchase-to-pay setup across jurisdictions. | Product + ERP design + Finance | User set Spain, the United States and Colombia as initial jurisdictions and approved exact tax-ID duplicates as blocking and normalized-name similarity as warning. Finance/Legal must validate the exact country-specific fields and rules before tax validation is implemented. |
| DISC-006 | resolved_direction | Supplier readers must see tax/bank fields without broadening Products access; management and verification require distinct grants. | The existing Products contract excludes supplier commercial/financial fields from `catalog.read`; remote enforcement must preserve the user's visibility decision without exposing Supplier data through Products permissions. | Product + Platform access owner | User approved a Supplier-specific read grant mapped to the same Products reader population and management mapped to the Products writer population, all organization-scoped. Only owner/admin may verify payee instructions, and the verifier must differ from the editor. Implement server-side grants and immutable audit; do not widen `catalog.read` for Products. |
| DISC-007 | resolved_direction | Supplier persistence and local-first/offline behavior for sensitive data. | Real tax/bank data must not leak through browser caches, offline queues or logs. | Platform + ERP engineering + Security | User approved protected, server-authoritative storage for real tax/bank values; never store them in `localStorage` or clear local cache and do not read, edit or queue them offline. Offline support may cover non-sensitive data; local fixtures remain synthetic. |
| DISC-008 | resolved_scope | Responsive desktop and mobile web are in scope; native iOS and Android are excluded for now. | Web operations need parity evidence in any later approved build; no native app work is authorized. | Product owner | User confirmed responsive web and excluded native apps. |
| DISC-009 | resolved_scope | Supplier master and SupplierItem must supply purchase, receiving and payment setup; purchase orders, actual receipts, invoices and payments remain separate Procurement, Inventory and Finance transactions. | Avoids putting mutable transaction history on Supplier while making it useful to downstream P2P modules. | Product owner | User explicitly requested a supplier file sufficient for purchase orders, inventory receipt and later payment. |
| DISC-010 | resolved_direction | Manual SupplierItem entry is the first-slice baseline; CSV import is optional follow-up. | CSV must use reviewed preview/matching and must never overwrite canonical Products. | Product owner | User approved deferring CSV from the `supplier-directory` slice; any later import requires its own scoped plan and approval. |
| DISC-011 | resolved_direction | Tax/registration identifiers and bank/payment instructions belong in Supplier master; all Supplier readers can view them. | Sensitive-field access must be distinct from Products access, with controlled edits, independent verification and immutable audit. | Product + Finance + Platform | User approved same-reader visibility via a Supplier-specific grant, management by the Products writer population, and independent verification by owner/admin only. The verifier cannot be the editor; audit and protected storage are required. |

## Handoff to module-design

- Target architecture questions: Supplier-owned identity and SupplierItem cardinality; whether SupplierItem links to Product or variant; stable IDs; Finance configuration references; whether product creation is handed off to the existing Products flow.
- UX questions: Legal/tax/payee fields, role-based contacts and addresses, purchase defaults, supplier-item terms; optional CSV template, preview, mapping and error feedback; responsive web adaptation.
- Domain questions: Duplicate matching, lifecycle/reactivation, jurisdiction-specific tax identity, verified bank-account lifecycle, supplier-item UOM/conversion and offer terms, PO snapshots, history and legacy ProductPartyRole compatibility.
- Platform reuse/extension questions: Organization scope and RLS; mapping the same Product role population to Supplier actions; shared Activity/Notes/Files/Tasks only when justified.
- Required decisions before planning: Jurisdiction-specific required fields; permission-policy reconciliation with ERP core access model; Supplier lifecycle and duplicates; SupplierItem UOM/conversion, price/terms and Product-versus-variant policy; CSV format and first-release availability; persistence/offline/conflict/rollback; payee-account verification/change approval and audit.
- Discovery state: `partial` — sufficient for module-design option analysis; not sufficient for task planning or build authorization.
