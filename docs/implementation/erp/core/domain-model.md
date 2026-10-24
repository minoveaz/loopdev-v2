# ERP Core — Domain Model

## Control

| Field | Value |
|---|---|
| Run | `MOD-CORE-20261024-001` |
| Phase | `02-domain` |
| Status | `partial` |
| Parent | `01-visual-design` |
| Product definition | `design.md`, `discovery.md`, approved Products master decisions |
| Runtime changes | None |

This analysis defines domain semantics for Products and its category hierarchy.
It does not define screens, authorization, API DTOs, synchronization policy or
implementation tasks. Open decisions are explicit; current source is baseline
evidence, not the target contract.

> **Invalidated for updated scope:** `CR-ERP-PRODUCT-EDITOR-COST-REFERENCE`
> adds a non-accounting purchase-cost reference and structured physical fields.
> Revisit cost ownership/currency/inheritance and product-versus-SKU attribute
> ownership before treating this domain analysis as plan-ready.

## Decision status

| ID | Rule | Status | Classification | Evidence / consequence |
|---|---|---|---|---|
| `DOM-ERP-001` | Use one Products master for finished products, raw materials/components and services. | `confirmed` | Domain invariant | `ERP-DEC-005`; semimanufactured items remain outside scope until Manufacturing discovery. |
| `DOM-ERP-002` | Item class is independent of purchase, sale and inventory-tracking uses. | `confirmed` | Domain invariant | User-confirmed master model; do not derive uses from the class or category. |
| `DOM-ERP-003` | The product base has one general primary category; each separately managed/sold variant/SKU has its own primary category, which may differ from the base and sibling variants. | `confirmed` | Domain invariant | User confirmed a general product category plus independently assigned SKU-level categories. The current `categoryKey` is not a hierarchy contract. |
| `DOM-ERP-004` | Finished products carry buy, make or both sourcing; raw materials/components are buy-only for now; services have no sourcing; variants inherit the product's value. | `confirmed` | Domain invariant | User confirmed class-specific sourcing rules for the current scope; revisit raw-material sourcing during Manufacturing discovery. |
| `DOM-ERP-005` | A variant is a specific product managed or sold separately, with its own SKU distinct from sibling variants; descriptive attributes alone do not create variants. | `confirmed` | Domain invariant | User confirmed that each variant is a specific product with a different SKU. |
| `DOM-ERP-006` | Each variant/SKU has its own primary category, independently assigned and allowed to differ from the product base and sibling variants; it does not inherit the base category. | `confirmed` | Domain invariant | User selected “Cada variante/SKU tiene su propia categoría” and “Sí; el producto base tiene una categoría general y cada SKU puede tener otra propia”. |
| `DOM-ERP-007` | Products and categories are shared across workspaces at organization scope; category parents, children and product assignments stay within the same organization. | `confirmed` | Domain/persistence constraint | User chose organization-wide products and categories. Handling legacy non-null `workspaceId` values remains a migration question. |
| `DOM-ERP-008` | Products, variants and categories have LoopDev-generated, immutable internal keys distinct from SKU/name and unique across the organization. SKU is unique across the organization after trimming outer whitespace and comparing case-insensitively; stored SKU preserves entered case. | `confirmed` | Domain invariant/persistence constraint | User confirmed key generation and organization-wide scope for all three keys, plus SKU comparison/storage semantics. Existing SQL does not yet enforce SKU or internal-key uniqueness. |
| `DOM-ERP-009` | Map legacy `service` to Service; keep `physical_product`, `digital_product`, `subscription`, `coverage`, `package` and `fee` as drafts until an explicit class review. Never guess an ambiguous class. | `confirmed` | Migration rule | User confirmed that only the legacy `service` type maps automatically; the other listed values remain drafts pending review. Legacy category-key mapping remains open. |
| `DOM-ERP-010` | A draft product or SKU may omit its category, but it must have one before activation. | `confirmed` | Domain invariant/UI validation | User selected: “Se puede guardar como borrador sin categoría; debe asignarse antes de activar”. |
| `DOM-ERP-011` | Category archive preserves existing assignments and disallows new ones; permanent deletion is prohibited; restore re-enables assignment when the parent is active; reparenting moves the subtree and preserves assignments without cycles; a parent cannot be archived while it has active children. | `confirmed` | Domain invariant/persistence constraint | User confirmed archive, restore, reparent and parent/child archival behavior. |
| `DOM-ERP-012` | Finished products support buy/make/both; raw materials/components support buy only for now; services have no sourcing value. | `confirmed` | Domain rule | User confirmed these class-specific rules; reconsider raw-material sourcing in future Manufacturing discovery. `make` remains intent only, not manufacturing execution. |
| `DOM-ERP-013` | `OrganizationCatalog` is migration-only and is not a target business entity or product-ownership boundary. | `confirmed` | Ownership/migration rule | User chose to retire the grouping as a business entity while preserving it as legacy migration input. |
| `DOM-ERP-014` | Commercial price currency is owned by each `PriceBook`; migrate the legacy `OrganizationCatalog` currency into the applicable price books. | `confirmed` | Ownership/migration rule | User decision: “En cada PriceBook”. Reconcile legacy `Offer.currency`; `PriceEntry` inherits the book currency and legacy mismatches require explicit migration handling. |
| `DOM-ERP-015` | Preserve each legacy `categoryKey` as migration provenance; do not auto-assign a target category. Produce a mapping review from actual records, and keep unmapped products/SKUs in draft until an authorized category assignment is made. | `assumed` | Migration rule | Safe planning rule; exact source values and mappings require a reviewed data inventory before migration. |
| `DOM-ERP-016` | Locale and channel fields from `OrganizationCatalog` are not Products fields in the first release. Preserve them as migration provenance and defer ownership to future localization/channel work. | `confirmed` | Ownership/scope rule | User approved Products and categories only for this release, deferring Shopify, Inhand and other modules. |
| `DOM-ERP-017` | Each `PriceEntry` uses its `PriceBook` currency and cannot have a different currency. | `confirmed` | Commercial data invariant | User decision: “la entrada hereda la moneda del PriceBook”. Legacy entry currency is compatibility/migration evidence, not an independent target value. |
| `DOM-ERP-018` | `Offer` has no independent currency; any offer price uses the currency of the associated `PriceBook`. | `confirmed` | Commercial data invariant | User decision: Offer uses the PriceBook currency; currency belongs to books and their price entries, not to Offer. |
| `DOM-ERP-019` | Products and categories are organization-wide. During migration, set target `workspace_id` to null and retain the legacy workspace ID only as provenance; require a dry-run report before applying the visibility expansion. | `confirmed` | Ownership/migration rule | Organization-wide visibility was user-approved; production data and the migration report have not been inspected. |
| `DOM-ERP-020` | Products, variants, offers, price books, price entries and categories are archive-only; permanent deletion is not exposed in this release. | `confirmed` | Lifecycle invariant | User approved no permanent deletion across the module; category archival rules remain as specified in `DOM-ERP-011`. |
| `DOM-ERP-021` | Restoring an archived product or SKU always returns it to `draft`; restoring never reactivates it, and activation guards must pass again. | `confirmed` | Lifecycle invariant | Product Owner selected “Volver siempre a borrador” during blocker resolution. |

## Entities and relationships

| Entity | Owner / source of truth | Scope | Key domain attributes | Relationships and cardinality |
|---|---|---|---|---|
| `Organization` | Shared Platform | Canonical organization | Stable organization ID | One organization owns many products, categories, variants and commercial records. |
| `Product` (technical identity: `CatalogItem`) | ERP Products | Organization-wide; workspace is not a target ownership boundary | Stable ID, LoopDev-generated immutable internal key distinct from SKU, name, description, approved item class, independent operational uses, class-valid sourcing rule, general primary category, lifecycle status | The internal key is generated by LoopDev, is not editable or derived from SKU, and is unique across the organization. Finished product sourcing is `buy`, `make` or `both`; raw material/component sourcing is `buy` for now; service sourcing is null. One product belongs to one organization and has one general category; it may have zero or many variants, offers and price entries. A legacy `catalogId` is migration provenance only, not a target relationship. |
| `ProductCategory` (new conceptual entity) | ERP Products | Organization-wide, shared across workspaces | Stable ID, LoopDev-generated immutable organization-unique key distinct from visible name, name, optional parent ID, lifecycle status, timestamps and concurrency version | A category has zero or one parent and zero or many children; it may be assigned to product bases and variants. Parent links must remain within the organization and must not form cycles. |
| `ProductVariant` (technical identity: `CatalogVariant`) | ERP Products | Same organization as its product | Stable ID, LoopDev-generated immutable internal key distinct from own SKU, name, attributes, primary category, lifecycle status | Exactly one parent product; zero or many offers/price entries. Internal key is unique across the organization. Sourcing is derived from the parent; category is assigned independently. |
| `Offer` | ERP Products | Organization/workspace; attached to one product | Key, name, billing model, unit, validity and status | One product has zero or many offers; an offer can be referenced by price entries. Published transaction snapshots must not mutate retroactively. Offer has no independent currency; its price entries use their respective PriceBook currencies (`DOM-ERP-018`). |
| `PriceBook` / `PriceEntry` | ERP Products | Organization/workspace | Book-owned currency/status/validity; entry amount, unit, quantity bounds and validity | Each price book owns its currency, and each entry is denominated in that currency. Legacy `PriceEntry.currency` is not independent target data; any legacy mismatch must be surfaced for explicit migration handling, without implying FX conversion. An entry may reference a product, offer or variant under current code; mutually valid reference combinations remain open. |
| `OrganizationCatalog` | Legacy migration source only; no target business owner | Legacy organization/workspace scope | Existing ID, key, name, kind, status and legacy field values retained only as migration evidence | Not a target entity or ownership boundary. Migrate currency into applicable PriceBooks (`DOM-ERP-014`); locale and channel field owners remain open (`DOM-ERP-016`). |
| CRM `Contact` / customer identity | CRM | CRM-owned scope | CRM identity and relationship history | Products/order references may point to CRM IDs; ERP must not duplicate the customer master or CRM history. |
| `ProductPartyRole` | ERP Products, current support contract | Organization and optional workspace | Product/offer reference, role, party reference/name, validity and status | Optional product/offer association; party master ownership and whether this capability remains in Products are not approved. |
| `CatalogAvailability` | ERP Products, current support contract | Organization and optional workspace | Product/offer reference, channels, markets, validity and status | Optional product/offer availability; publication/channel ownership remains outside approved first-release scope. |
| `CatalogEligibility` | ERP Products, current support contract | Organization and optional workspace | Product/offer reference, rule key, description and status | Optional product/offer eligibility rule; rule execution and consumers are not approved. |

### Entity continuity and lifecycle

This matrix separates current fixture/schema evidence from target domain
policy. No legacy cascade or physical-delete behavior is endorsed as the new
contract.

| Entity | Local fixture strategy | Remote identity / migration | Ownership scope | Archive, delete and restore | Cross-module events |
|---|---|---|---|---|---|
| `Organization` | Reuse shared Platform organization fixtures. | Preserve `organizations.id`; Platform-owned migration. | Canonical Platform tenant. | ERP cannot delete or restore the organization; follow Platform lifecycle. | Consume shared organization lifecycle changes; do not emit a duplicate ERP organization event. |
| `Product` | Reuse `localCatalogItemsStore` as legacy local baseline; migrate fixture shape only after class mapping is approved. | Preserve `erp_catalog_items.id`; map `category_key` only after reviewing actual data. | Organization-wide target; decide how to migrate legacy non-null workspace IDs. | Archive should preserve references; restore destination/revalidation and hard-delete policy remain open. | Proposed `erp.product.*` events; consumers are approved projections/references only. |
| `ProductCategory` | No category store or fixture exists; add after key-scope and authorization decisions. | New stable category ID/table required; legacy `category_key` is an opaque value, not a category identity. | Organization-wide, confirmed by `DOM-ERP-007`; categories can be assigned to product bases and variants. | Archive preserves current assignments and prohibits new ones; permanent deletion is prohibited; restore requires an active parent; reparent moves the subtree; archiving is blocked while active children remain. | Proposed category-change event for Products projections; no current event implementation. |
| `ProductVariant` | Reuse `localCatalogVariantsStore` as legacy local baseline. | Preserve `erp_catalog_variants.id`; do not infer variant IDs from product attributes. | Inherit the parent product's organization scope; migrate legacy workspace IDs explicitly. | Current physical delete/cascade is legacy behavior; target archive/restore and parent-archive constraints remain open. | Proposed `erp.product-variant.changed`; inventory consumers are future/approval-gated. |
| `Offer` | Reuse `localCatalogOffersStore` as legacy baseline. | Preserve `erp_catalog_offers.id`. | Organization-wide with its product. | Archive/restore only; no permanent delete in this release. | No cross-module event publication is required for this release. |
| `PriceBook` | Reuse `localCatalogPriceBooksStore` as legacy baseline. | Preserve `erp_price_books.id`. | Organization-wide. | Archive/restore only; no permanent delete in this release. | No cross-module event publication is required for this release. |
| `PriceEntry` | Reuse `localCatalogPriceEntriesStore` as legacy baseline. | Preserve `erp_price_entries.id`; retain references only after validation of legacy combinations. | Organization-wide and consistent with its price book and referenced records. | Archive/restore only; no permanent delete in this release. | No cross-module event publication is required for this release. |
| `OrganizationCatalog` | Read legacy `localOrganizationCatalogsStore` only for migration; do not add a target domain store. | Preserve `erp_catalogs.id` as migration evidence until source records and fields are mapped. | Legacy organization/workspace values are provenance only; products remain organization-scoped. | Legacy status/delete behavior is not target lifecycle policy; migrate required data before retiring the source. | No target event; currency moves to PriceBooks while locale/channel ownership remains open in `DOM-ERP-016`. |
| CRM `Contact` | Reuse CRM-owned fixtures and adapters. | Preserve CRM contact identity; no ERP-owned copy or migration. | CRM/Platform scope. | CRM owns retention and deletion; ERP retains only policy-approved references/snapshots. | Consume CRM identity/reference events where contracted; ERP must not emit contact-master events. |
| `ProductPartyRole` | Local store exists in catalog fixtures. | No table was found in the reviewed foundation migration; remote identity/migration is unresolved. | Current type carries organization/workspace; role/party ownership is unresolved. | Current target lifecycle and retention are not established; do not treat adapter CRUD as policy. | No approved event; out of approved scope until owner/consumer is decided. |
| `CatalogAvailability` | Local store exists in catalog fixtures. | No table was found in the reviewed foundation migration; remote identity/migration is unresolved. | Current type carries organization/workspace; channel/market ownership is unresolved. | Current status exists in the type; archive/delete/restore policy and publication effects are unresolved. | No approved event; channel publication remains out of scope. |
| `CatalogEligibility` | Local store exists in catalog fixtures. | No table was found in the reviewed foundation migration; remote identity/migration is unresolved. | Current type carries organization/workspace; rule ownership is unresolved. | Current status exists in the type; rule retention and restore behavior are unresolved. | No approved event; execution and consumers remain out of scope. |

### Attribute ownership

- Product classification has exactly one conceptual value: `finished_product`,
  `raw_material_component` or `service`. This is not the same field as the
  runtime `CatalogItem.type`; its mapping is unresolved.
- `purchasable`, `sellable` and `inventoryTracked` are independent product
  uses. Any combinations not meaningful for a particular class require an
  explicit domain rule rather than hidden UI coupling.
- Sourcing is product-owned and variants derive it; they do not override it.
  Finished products allow `buy | make | both`; raw materials/components allow
  `buy` only for now; services have no sourcing value. This describes sourcing
  intent, not a bill of materials, work order or manufacturing lifecycle.
  Revisit raw-material sourcing during Manufacturing discovery.
- A product has one primary category. The category hierarchy is taxonomy only;
  it does not encode class, sourcing, channel publication or stock state.
- A separately managed/sold variant has its own SKU and identity. Color,
  dimensions or other descriptive attributes are not variants unless the
  business manages/sells that combination separately.

## Lifecycle and transitions

Current product and variant status values are `draft`, `active` and `archived`.
The adapter accepts arbitrary status patches rather than enforcing a transition
machine; the following target transitions are proposals, not runtime behavior.

| Entity | From → to | Status | Guard / invariant |
|---|---|---|---|
| Product | new → `draft` | `assumed` | Current local adapter defaults new items to draft; remote SQL also defaults to draft. |
| Product | `draft` → `active` | `assumed` | Required identity, class, general category and valid operational configuration; category may be omitted in draft but is required before activation. Other activation guards remain open. |
| Product | `draft` / `active` → `archived` | `assumed` | Archive must not delete historical references or published transaction snapshots. |
| Product | `archived` → `draft` | `confirmed` | Product Owner decision: restore always returns to draft; activation guards must pass again before it can become active. |
| Variant | `draft` ↔ `active` → `archived`; `archived` → `draft` | `confirmed` | Product Owner decision: restore always returns the SKU to draft; its category, parent and activation guards must pass again before activation. |
| Category | new → `active` | `assumed` | Proposed category lifecycle uses `active` and `archived`; draft categories are not yet specified. |
| Category | `active` → `archived` | `confirmed` | Archiving preserves existing product/SKU assignments; reject new assignments to the archived category and block archiving while active child categories remain. |
| Category | `archived` → `active` | `confirmed` | Restore re-enables new assignments if the category's parent is active; root categories have no parent guard. |
| Category | permanent delete | `confirmed` | Prohibited; use archive to preserve category history and product/SKU references. |
| Category | reparent | `confirmed` | Move the category and its descendants together; preserve product/SKU assignments; reject cycles and cross-organization parents. |

### Domain invariants and validation boundaries

| Rule | Kind | Status | Notes |
|---|---|---|---|
| Product class, operational uses and sourcing are separate dimensions; finished products allow `buy | make | both`, raw materials/components allow `buy` for now, and services have no sourcing value. | Domain invariant | Confirmed | No class-derived purchase/sale/inventory flags; reconsider raw-material sourcing during Manufacturing discovery. |
| Product base and each SKU variant have one primary category; category tree is acyclic and in the same organization scope. | Domain invariant | Confirmed | Category itself has no runtime representation yet. |
| Product has a LoopDev-generated, immutable internal key distinct from the SKU; it is unique across the organization and changing SKU does not change it. | Domain invariant + persistence constraint | Confirmed | User-confirmed. |
| Each variant has a LoopDev-generated, immutable internal key distinct from its SKU and unique across the organization. | Domain invariant + persistence constraint | Confirmed | User-confirmed. |
| Each category has a LoopDev-generated, immutable internal key distinct from its visible name and unique across the organization. | Domain invariant + persistence constraint | Confirmed | User-confirmed; persistence must enforce uniqueness. |
| Variant belongs to exactly one product and carries its own SKU when separately managed/sold; trim outer whitespace on write, preserve entered case, and compare uniqueness organization-wide without case sensitivity. | Domain invariant + persistence constraint | Confirmed | User confirmed organization-wide uniqueness and SKU storage/comparison semantics. |
| Each variant/SKU has its own category, which may differ from the product base and sibling variants; category is not inherited. | Domain invariant | Confirmed | User-confirmed category ownership. |
| A draft product or SKU may omit its category; category is required before activation. | Domain invariant + UI validation | Confirmed | User-confirmed lifecycle rule in `DOM-ERP-010`. |
| Archiving a category preserves current product/SKU assignments but prevents new assignments; it is blocked while active child categories remain. | Domain invariant | Confirmed | User-confirmed archive and parent/child behavior. |
| Categories cannot be permanently deleted; archive is the only removal lifecycle. | Domain invariant | Confirmed | User selected archive-only category lifecycle. |
| A restored category is assignable again only when its parent is active. | Domain invariant | Confirmed | User-confirmed restore rule. |
| Moving a category moves its subtree, preserves assignments, and cannot create cycles. | Domain invariant + persistence constraint | Confirmed | User-confirmed category reparent behavior. |
| Product, variant and category internal keys are LoopDev-generated, immutable, and unique across the organization. | Domain invariant + persistence constraint | Confirmed | User-confirmed key generation and scope; persistence must enforce uniqueness. |
| Category parent cannot be self or descendant; category references must resolve within scope. | Domain invariant + persistence constraint | Assumed | Reject cycles and cross-scope references; exact database enforcement belongs to API/data design. |
| Authorization to read or mutate a product/category. | Authorization condition | Out of this phase | Define in `03-access`; domain invariants apply after authorization. |
| Optimistic version and auditable actor for mutations. | Persistence/audit constraint | Open | Product design calls for versioned entities; current `Entity` and SQL expose only ID and timestamps, no version/actor field. |

## Commands and domain events

These describe domain intent only. They are not API DTOs, permission grants or
implemented event contracts.

| Command | Aggregate | Domain effect / guard |
|---|---|---|
| `CreateProduct` | Product | Create one classified product with independent uses and sourcing under an organization scope; sourcing must be null for services, and a draft may omit its general category. |
| `UpdateProduct` | Product | Change mutable master data; preserve stable identity and increment aggregate version once versioning is defined. |
| `ChangeProductStatus` | Product | Apply only approved lifecycle transitions; archive does not erase references. |
| `AssignPrimaryCategory` | Product / ProductVariant | Assign or replace the target's primary category with an active category in the same organization scope. |
| `CreateCategory` / `RenameCategory` | ProductCategory | Create a node with a LoopDev-generated immutable organization-unique key or rename its visible name. |
| `MoveCategory` | ProductCategory | Move the category subtree, preserve product/SKU assignments, and reject cycles or cross-organization parents. |
| `ArchiveCategory` / `RestoreCategory` | ProductCategory | Archive preserves existing product/SKU assignments, prevents new ones, and is blocked while active children remain; permanent deletion is prohibited; restore re-enables assignment when the parent is active. |
| `CreateVariant` / `UpdateVariant` | Product | Create or update a separately managed/sold SKU with a LoopDev-generated immutable internal key and its own category; inherit product sourcing, which is null for services. |

| Event (proposed) | Producer | Minimum payload | Consumers / guarantee |
|---|---|---|---|
| `erp.product.created` | Product | `eventId`, `organizationId`, `productId`, `version`, `occurredAt`, actor reference | Products queries and approved CRM/channel consumers; idempotent by event ID and product version. |
| `erp.product.updated` | Product | Same identity/version envelope plus changed domain fields; exclude secrets and unrelated personal data | Refresh projections and references; consumers do not become product masters. |
| `erp.product.archived` | Product | Product identity, version, archive time and reason code | Prevent new use where appropriate while preserving historical references. |
| `erp.product-category.changed` | ProductCategory | Category ID, parent ID, scope, version, change kind and affected product/variant references/count | Refresh product and SKU filters/forms and category projections; do not imply current event infrastructure exists. |
| `erp.product-variant.changed` | Product | Product and variant IDs, SKU, category ID, version and change kind | Refresh commercial references; inventory consumers are future/approval-gated. |

The shared Platform reference pattern is `EntityRef<"catalog_item">` today.
Notes, Files, Activity, Tasks and Relations should attach through the shared
entity-reference capability when approved; ERP must not define duplicate
platform record types. No product/category domain events are evidenced as
implemented.

## Ownership, versioning, audit and deletion

| Concern | Domain decision |
|---|---|
| Source of truth | Platform owns Organization and membership. ERP Products owns product master, category taxonomy, variants and product commercial records. CRM owns contact/customer identity and relationship history. External channels remain owners of their external records until a source-of-truth policy is approved. |
| Local fixtures | The per-entity continuity matrix records current stores and missing category fixtures. Reuse is baseline only; do not add or reshape fixtures in this phase. |
| Remote identity/migration | Preserve existing IDs per entity where possible. `category_key` is an unreferenced string; map only after reviewing actual organization data. Do not infer parent/child structure or merge keys automatically. |
| Ownership scope | `organizationId` is canonical. Products and categories are organization-wide per `DOM-ERP-007`; legacy `workspaceId` values require explicit migration handling and do not define target visibility. |
| Version/audit | Current base `Entity` contains ID and timestamps only. Product design expects optimistic concurrency and auditability, but version, actor, reason and event persistence are not present; define them before concurrent remote mutations. |
| Product/variant delete and restore | Current adapter supports hard delete; SQL cascades from items to offers/variants/prices. The local test archives an item and restores it to draft. Target policy is not approved; proposed default is archive when referenced and hard-delete only never-published, unreferenced drafts. |
| Category archive, delete and restore | No runtime category entity exists. Permanent deletion is prohibited; archive preserves existing assignments, blocks new ones, and is blocked while active children remain; restore re-enables assignment if the parent is active. Never rely on database cascade to silently remove product history. |

## Existing implementation and conflicts

| Evidence | Current behavior | Domain consequence |
|---|---|---|
| `src/loopdev/domains/catalog/types.ts` | `CatalogItem.type` includes `physical_product`, `service`, `subscription`, `coverage`, `package`, `digital_product` and `fee`; product has nullable `categoryKey`; variant has key/SKU/attributes but no category or sourcing. | Preserve legacy IDs and original type evidence; do not guess mappings for ambiguous types. Leave those records in draft until their class is assigned. |
| `src/types/index.ts` | Shared `Entity` has `id`, `createdAt` and `updatedAt`; no version or actor fields. | Optimistic concurrency/audit are target requirements to resolve, not existing guarantees. |
| `supabase/migrations/20260928160000_erp_catalog_foundation.sql` | `erp_catalog_items.category_key` is nullable text without FK; catalog ID is SQL `NOT NULL`; item key unique by organization/catalog; variant key unique by organization/item; SKU is not unique; foreign keys cascade delete. | The new category relationship and target delete semantics require migration/data review. |
| `src/loopdev/domains/catalog/adapter/local.ts` and `adapter/supabase.ts` | Item/variant status is patchable; local and remote delete are physical; Supabase adapter has no category methods/table; local adapter has no category store. | No category lifecycle, validation or event behavior is implemented. |
| `src/test/catalog/catalog-adapter.test.ts` | Tests item archive, restore to draft and hard delete; tests variant create/update/delete. | This is legacy behavior evidence, not approval of target lifecycle or cascade semantics. |

## Open questions and risks

1. Define whether the approved purchase-cost reference belongs to a standalone
   product or to each separately managed SKU, whether a product value is a
   default for new SKUs, its currency/source/history, and its value object.
2. Define ownership and inheritance of physical weight/dimensions between
   product and SKU, including supported units and validation.
3. Decide whether brands and tags are controlled organization-scoped reference
   entities or free-form values; current strings do not establish a target
   contract.
4. Review actual legacy `category_key` values and approve their target
   category mapping before migration; unmapped records remain drafts
   (`DOM-ERP-015`).
5. Verify the migration's deployed state before applying a forward migration;
   the remote connection could not be authenticated during this blocker review.
6. Review any mismatched legacy `PriceEntry.currency` without silently
   converting values; target entries use their `PriceBook` currency
   (`DOM-ERP-017`).

## Handoff

**Status: `partial; invalidated by approved scope change`.** Product and category rules, archive-only lifecycle,
organization-wide target scope, legacy provenance handling, and the approved
Products release boundary are captured, but cost reference and physical-field
ownership need a domain rerun. Exact category mappings and legacy currency
mismatches still require a reviewed data inventory; no production data should
be migrated before that dry run. No production code, schema or test was
changed in this domain phase.
