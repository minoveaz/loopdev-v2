# ERP Core — Products API contracts

## Control

| Field | Value |
|---|---|
| Run | `MOD-CORE-20261024-001` |
| Phase | `04-api` |
| Status | `partial` |
| Parent | `03-access` |
| Domain input | `domain-model.md` |
| Access input | `access-model.md` |
| Runtime changes | None |

These are client-agnostic logical contracts for Products and its category
hierarchy. They are not HTTP routes, DTO implementations or approval to
change the legacy catalog interface. Existing catalog IDs and the shared
`EntityRef<"catalog_item">` remain compatibility constraints. No API, schema,
event bus or endpoint was implemented in this phase.

## Contract decision status

| ID | Contract decision | Status | Evidence / impact |
|---|---|---|---|
| `API-ERP-001` | Products is the user-facing master; keep legacy catalog IDs and CRM entity references stable during migration. | `confirmed` | Approved product/module decisions and `resolveReference` implementation. |
| `API-ERP-002` | Commands derive organization scope and actor from authenticated context; clients do not choose tenant authority. | `confirmed` | `access-model.md` and Platform RLS contract. |
| `API-ERP-003` | Product/category/variant logical commands and DTOs use the approved conceptual model rather than exposing `CatalogItem.type` as the new product class. | `assumed` | `DOM-ERP-009` confirms only legacy `service` maps automatically; other legacy values remain drafts until explicit class review. |
| `API-ERP-004` | Mutations carry optimistic concurrency version and create/retry idempotency metadata where duplicate effects are possible. | `assumed` | Domain expects concurrency/audit, but version fields are absent from current types/schema. |
| `API-ERP-005` | Lists use bounded, stable pagination and client-neutral filters/sort. | `assumed` | Current adapter returns arrays and does not define pagination or sorting. |
| `API-ERP-006` | Category management is a first-class logical command/query surface within Products. | `confirmed` | User-approved category management and `REQ-ERP-PRODUCT-CATEGORIES`; persistence/transport remain undefined. |
| `API-ERP-007` | Existing offer, price-book and price-entry operations remain supported only as compatibility contracts until their ownership and validation rules are approved. | `assumed` | Current adapter/schema exist; target transaction and sensitivity rules remain open. |
| `API-ERP-008` | ProductPartyRole, availability and eligibility are not promised by the future remote API until their domain/persistence ownership is resolved. | `confirmed` | Local adapter returns or stores them, but Supabase adapter/migration have no remote tables. |
| `API-ERP-009` | Domain events are proposed contracts only; publish only after actor/version/audit and consumer ownership are approved. | `confirmed` | No product/category events are implemented. |
| `API-ERP-010` | Remote mutation delivery is blocked until the `catalog.read` DELETE RLS gap and `catalog.write`/`catalog.manage` mismatch are resolved. | `confirmed` | `access-model.md`; deployment status of the migration is unverified. |
| `API-ERP-011` | API transport style and canonical routes are open; Products and categories use organization scope, not workspace scope. | `open` | User confirmed organization-wide product/category scope; do not infer routes from current adapter methods. |

## Command and query catalog

The names below describe domain operations, not REST routes or RPC names.
Requests are authenticated and organization-scoped. A direct URL and an
adapter call follow the same authorization and not-found masking behavior.

| Operation | Kind | Input | Result | Status / notes |
|---|---|---|---|---|
| `ListProducts` | Query | Organization scope, cursor/page, text query, product class, primary category, operational uses, sourcing, status, sort | Bounded page of Products with stable IDs and `nextCursor` | Aggregate legacy records across catalogs during migration; target products are organization-scoped and do not belong to `OrganizationCatalog`. |
| `GetProduct` | Query | Product ID | Product detail or scoped `NOT_FOUND` | Assumed. Direct deep link must not disclose cross-tenant existence. |
| `FindProductByKey` | Query | Stable LoopDev-generated internal product key, distinct from SKU | Product or `NOT_FOUND` | Key is immutable and unique within the organization, independent of SKU. SKU uniqueness is organization-wide after trimming outer whitespace and comparing case-insensitively. |
| `CreateProduct` | Command | Name, SKU, product class, independent uses, class-valid sourcing and optional draft category | Created product with generated key, ID, version and timestamps | LoopDev generates an immutable organization-unique key; clients cannot choose it. Finished products allow `buy`, `make` or `both`; raw materials/components allow `buy` only for now; services require null sourcing. `make` is intent only, not execution. Draft may omit category; require the general category before activation. Ambiguous legacy class mappings remain drafts until reviewed. |
| `UpdateProduct` | Command | Product ID, allowed patch, `expectedVersion` | Updated product and new version | Reject immutable scope/ID fields and unrecognized metadata. |
| `ChangeProductStatus` | Command | Product ID, target status, `expectedVersion` | Updated product state | Allowed transitions and archive/restore validation require domain decision. |
| `ListProductCategories` | Query | Parent/flat mode, status, cursor if needed | Scoped category nodes/tree | Tree serialization, pagination and empty/root representation remain open. |
| `GetProductCategory` | Query | Category ID | Category or scoped `NOT_FOUND` | A category does not exist in current runtime. |
| `CreateProductCategory` | Command | Name, optional parent category ID | Category with generated immutable organization-unique key, ID and version | LoopDev generates the key; validate parent scope and reject cycles. |
| `UpdateProductCategory` | Command | Category ID, allowed patch, `expectedVersion` | Updated category/version | Parent move is separate to make cycle and in-use checks explicit. |
| `MoveProductCategory` | Command | Category ID, new parent ID or root, `expectedVersion` | Updated subtree position/version | Atomic; move descendants, preserve product-base/SKU assignments, reject cycles and cross-organization parents. |
| `ArchiveProductCategory` / `RestoreProductCategory` | Command | Category ID, `expectedVersion` | Updated lifecycle state | Archive preserves current product-base/SKU assignments, blocks new assignments, and is rejected while active child categories remain; permanent deletion is prohibited; restore re-enables assignment if the parent is active. |
| `AssignPrimaryCategory` | Command | Product or variant ID, category ID, `expectedVersion` | Product/version or variant/version | Assign to the product base or a specific SKU; category must be active and in the same organization. |
| `ListVariants` / `CreateVariant` / `UpdateVariant` | Query/command | Product ID, variant data including optional draft category, version/idempotency | Variants or changed variant with generated internal key | LoopDev generates an immutable variant key distinct from SKU and unique within the organization; own SKU required; category is assigned independently, may be omitted in draft and is required before activation. Sourcing inherits from product. |
| `ListOffers` / `CreateOffer` / `UpdateOffer` | Query/command | Product ID, offer data without independent currency, version/idempotency | Offers or changed offer | Offer prices use each associated PriceBook's currency; retire legacy `Offer.currency` from the target DTO. |
| `ListPriceBooks` / `ListPriceEntries` and mutations | Query/command | Filters, book/product/offer/variant IDs, book currency, amount, validity, version | Scoped price records | Currency is owned by each PriceBook and inherited by entries; reconcile legacy Offer.currency and valid reference combinations before implementation. |
| `ResolveProductReference` | Query | Product ID or legacy key plus optional offer/variant IDs | Product, optional offer/variant, shared entity reference | Preserve legacy `catalog_item` identity and return no cross-scope partial matches. |

Physical delete, category merge, bulk import/update, export, party-role CRUD,
availability/eligibility rule execution, channel sync, sales orders and
inventory commands are not approved in this contract.

## Request and response DTO boundaries

All payloads are JSON-compatible and client-neutral, but concrete transport
schemas remain for a later approved plan.

| DTO | Required fields | Server-controlled / response fields | Validation / open rules |
|---|---|---|---|
| `Product` | `id`, LoopDev-generated immutable organization-unique `key` distinct from `sku`, `sku`, `name`, `productClass`, `purchasable`, `sellable`, `inventoryTracked`, nullable `sourcing`, general `primaryCategoryId`, `status` | `organizationId`, optional legacy `workspaceId`, `version`, `createdAt`, `updatedAt` | Internal key is immutable and independent of SKU. Finished products allow `buy`, `make` or `both`; raw materials/components allow `buy` only for now; services require null sourcing. Draft category may be absent; category is required before activation. Trim outer SKU whitespace on write, preserve entered case, and compare organization-wide without case sensitivity. |
| `CreateProductRequest` | `sku`, `name`, `productClass`, operational uses, class-valid nullable `sourcing`; general category optional for drafts | Actor and organization from auth; never accept client authority for these; key generated server-side | Enforce class-specific sourcing; require a general category before activation; no untyped `metadata` until allowlist schema exists. |
| `UpdateProductRequest` | Mutable product patch and `expectedVersion` | Identity/scope and timestamps server-controlled | Do not allow ID, organization, workspace or audit fields in patch. |
| `ProductCategory` | `id`, LoopDev-generated immutable organization-unique `key`, `name`, `parentCategoryId`, `status` | `organizationId`, optional `workspaceId`, `version`, timestamps | Parent must be in scope; no cycles. |
| `CreateProductCategoryRequest` | `name`, optional parent ID | Scope and actor from auth; key generated server-side | Draft category support remains open. |
| `MoveProductCategoryRequest` | Category ID, destination parent ID or root, `expectedVersion` | Resulting scope/version server-controlled | Reject self/descendant moves; define behavior for categories assigned to products before implementation. |
| `ProductVariant` | `id`, `productId`, LoopDev-generated immutable organization-unique `key` distinct from `sku`, `sku`, `name`, attributes, category field, status | Scope, inherited sourcing, version and timestamps | Category is assigned independently and may differ from the product base or sibling variants; drafts may omit it, but activation requires it. Trim outer SKU whitespace on write, preserve entered case, and compare organization-wide without case sensitivity; attribute schema remains open. |
| `Page<T>` | `items`, `nextCursor` | `totalCount` only if computed safely and needed | Cursor format is opaque; never expose tenant data in cursor contents. |
| `DomainEventEnvelope` | `eventId`, `eventType`, aggregate ID/version, organization, occurred time | Actor reference and producer metadata | Version/audit/retention fields need approval; no secrets, raw PII or unrestricted metadata. |

Legacy inputs must use a named compatibility mapper. Unknown `CatalogItem.type`
values must fail with `LEGACY_TYPE_UNMAPPED`; never silently coerce a
subscription, coverage, package, digital product or fee into one of the three
approved product classes.

## Error catalog and retry semantics

| Code | Meaning | Retry |
|---|---|---|
| `VALIDATION_ERROR` | Invalid field, status transition, parent/category relation or unsupported combination | Terminal until corrected |
| `FORBIDDEN` | Caller lacks permission or current scope | Terminal; do not retry without permission change |
| `NOT_FOUND` | Record missing or intentionally masked because it is outside caller scope | Terminal |
| `INVALID_SCOPE` | Organization/workspace/parent references are inconsistent | Terminal |
| `CONFLICT` | Key/SKU duplicate, category in use, invalid move, or state conflict | Terminal after user resolves current state |
| `VERSION_CONFLICT` | `expectedVersion` is stale | Refresh and reconcile; never auto-overwrite |
| `IDEMPOTENCY_KEY_REUSED` | Same idempotency key is sent with a different request payload | Terminal; caller must use a new key |
| `LEGACY_TYPE_UNMAPPED` | Legacy type has no approved product-class mapping | Terminal; migration decision required |
| `RATE_LIMITED` | Caller or tenant exceeded a published limit | Retry only after `retryAfter` |
| `SERVICE_UNAVAILABLE` | Temporary backend or dependency failure | Retry with bounded backoff and the same idempotency key |
| `INTERNAL_ERROR` | Unexpected failure with a correlation ID | Retry only for idempotent commands; surface the failure, never use a success-shaped fallback |

Authorization failures and masked cross-tenant not-found responses must not
include record names, counts, metadata or existence hints. API error messages
are safe for clients; detailed diagnostics are correlated server-side without
logging full sensitive payloads.

## Filtering, pagination and sorting

- The current adapter returns whole arrays; no unbounded list is an approved
  future API behavior.
- **Assumed target:** cursor pagination with opaque continuation tokens,
  bounded page size and stable ordering by an allowlisted field plus ID as a
  deterministic tiebreaker. The exact size, sort fields and cursor contract
  remain open with Platform (`VD-ERP-004`).
- Filters are explicit and typed: status, product class, primary category,
  operational-use flags, sourcing and normalized text query. Archived records
  require an explicit authorized filter.
- A category-tree query must bound depth/node count or use a paged flat query
  when the tree can exceed practical response limits. Limits remain open.
- Organization/workspace scope is never a user-controlled filter that widens
  authorization. Server policy applies before pagination/counting.
- Desktop, mobile web and future native adapters consume the same query
  semantics; renderer-specific endpoints or permission catalogs are forbidden.

## Concurrency, idempotency and consistency

- **Assumed:** updates and status/category moves include `expectedVersion`;
  stale writes return `VERSION_CONFLICT` with no partial mutation.
- **Assumed:** create commands, bulk effects and external side effects accept
  an idempotency key scoped to organization and command. Replaying the same
  key and same normalized payload returns the original result; a different
  payload conflicts.
- Create/update of one aggregate is atomic. Category move, cycle detection and
  assignment integrity are one consistency boundary. Cross-aggregate bulk
  operations are not in scope until explicit all-or-nothing/partial-result
  semantics are approved.
- Never hard-delete a product/category with dependent records under this
  contract. Archive/restore are commands and must preserve references.
- If events are published, state change and durable event publication must be
  consistent (transactional outbox or equivalent); mechanism is open.
- No optimistic success, local fallback or silent retry after a remote
  authorization/validation error. Retry only transient failures with bounded
  backoff and idempotency.
- Every mutation has a correlation/request ID, organization, actor, command,
  outcome and audit link. Avoid full payload logging and sensitive-field
  disclosure.

## Domain events and consumers

These are proposed semantic names only; no event transport, webhook or
delivery guarantee is implemented.

| Event | Trigger | Minimum safe payload | Consumer contract |
|---|---|---|---|
| `erp.product.created` | Product created | Event ID, product ID, organization ID, version, occurred time, actor reference | Products projections; future CRM/channel consumers only after approval. |
| `erp.product.updated` | Product master changed | Envelope plus changed field names and approved non-sensitive values | Consumers refresh references; no consumer becomes product master. |
| `erp.product.archived` | Product archived | Product ID, version, archive time, reason code | Prevent new use where appropriate; retain historical references. |
| `erp.product-category.changed` | Category created, renamed, moved, archived or restored | Category ID, parent ID, version, change kind, organization scope | Refresh category/product projections; avoid unbounded full entity payloads. |
| `erp.product-variant.changed` | Variant created/changed/archived | Product ID, variant ID, SKU, version, change kind | Future inventory/channel consumers require explicit approval. |
| `erp.product-commercial.changed` | Offer or price entry changed | Product/offer/variant references, book ID, version, effective interval, change kind | Sensitive prices are permission-filtered; no transaction snapshot mutates retroactively. |

Event delivery must be at-least-once with consumer deduplication by `eventId`
if/asynchronous publication is approved. Retry, dead-letter, replay, ordering,
webhook signing and retention policies remain open for the channel-integration
design. Do not send catalog events as a substitute for Platform Activity or
audit records.

## Shared Platform and consumer impact

- Continue to resolve existing CRM references using stable
  `EntityRef<"catalog_item">`; do not introduce `EntityRef<"product">` in this
  phase or break existing deep links.
- Notes, Files, Activity, Tasks, Relations and Document Intelligence are
  consumed through their owning Platform contracts. APIs return references
  only when the caller is authorized for both the entity and the linked
  Platform resource.
- Direct product/category URLs use the same authenticated query and
  cross-tenant not-found behavior as list/detail actions.
- Shopify, public storefront, sales and inventory are not enabled by these
  product contracts. Their commands and events need separate ownership,
  source-of-truth, idempotency and consumer approval.

## Multiplatform impact

| Surface | Contract behavior |
|---|---|
| Desktop web | Same commands, queries, error codes, cursor and version semantics; no assumption of client-only pagination. |
| Mobile web | Same action catalog and authorization; bound response size and keep cursor/retry state across navigation. |
| iOS / Android | Applicability is unapproved; if adopted, use the same DTOs/errors and platform auth tokens, safe-area/deep-link handling and offline replay rules. |
| Offline | No permission bypass; queue only explicitly supported idempotent commands and reauthorize on replay. Conflict responses require user reconciliation. |

## Risks and open decisions

1. Resolve locale/channel ownership for migration-only `OrganizationCatalog`
   and reconcile legacy `Offer.currency` with `PriceBook`.
2. Resolve the API transport and pagination contract with Platform; current
   `DataTable` remote cursor support is open.
3. Define and version entity `version`/actor/audit fields before enforcing
   optimistic concurrency.
4. Resolve `catalog.write` versus `catalog.manage`; remote writes remain
   blocked by the existing read-only DELETE RLS gap and unverified migration
   deployment.
5. Decide category event cardinality and how to refresh product projections
   without exposing private commercial values.
6. Determine whether ProductPartyRole, availability and eligibility are
   supported remote contracts or remain out of scope.
7. Confirm event consumers, delivery/retry/order/retention guarantees before
   channel integration; avoid premature webhooks.
8. Decide whether platform events are sufficient for audit and user-visible
   activity without duplicating the shared Platform model.

## Handoff

**Status: `partial`.** Logical Products commands, DTO boundaries, errors,
pagination, concurrency, events, consumer compatibility and multiplatform
constraints are documented. DTO details and remote mutations remain gated by
open domain/access decisions and the high-priority RLS gap. Safe follow-up:
use these contracts in `05-sync`; do not create endpoints or events until the
scope, legacy mapping and security blockers are resolved. The sync analysis is
recorded in `sync-model.md`; `06-plan` remains gated by unresolved
domain/access decisions.
