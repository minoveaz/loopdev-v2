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
| `API-ERP-004` | Every update/archive/restore carries `expectedVersion`; creates carry an idempotency key; stale versions fail without mutation. | `confirmed` | Required by the approved online remote-write and shared-audit policy; fields are absent from current schema and must be implemented. |
| `API-ERP-005` | Lists use cursor pagination with a default page size of 50, a maximum of 100 and stable `(created_at, id)` ordering. | `confirmed` | Current adapter returns arrays; pagination is a new, bounded contract for both web renderers. |
| `API-ERP-006` | Category management is a first-class logical command/query surface within Products. | `confirmed` | User-approved category management and `REQ-ERP-PRODUCT-CATEGORIES`; persistence/transport remain undefined. |
| `API-ERP-007` | Offers, price books and price entries are in Products scope; every `catalog.read` role can read sales prices, and all mutations use `catalog.write`. | `confirmed` | User approved Products/categories as the first release and sales-price visibility for all readers; cost/margin fields and export are excluded. |
| `API-ERP-008` | ProductPartyRole, availability and eligibility are not promised by the future remote API until their domain/persistence ownership is resolved. | `confirmed` | Local adapter returns or stores them, but Supabase adapter/migration have no remote tables. |
| `API-ERP-009` | Domain events are proposed contracts only; publish only after actor/version/audit and consumer ownership are approved. | `confirmed` | No product/category events are implemented. |
| `API-ERP-010` | Remote mutations require operation-specific RLS (`catalog.read` for SELECT, `catalog.write` for INSERT/UPDATE, no DELETE), explicit adapter mode, optimistic versions and an atomic Platform audit event. | `confirmed` | Policy is approved; the forward migration and deployed-state verification are not yet complete. |
| `API-ERP-011` | Preserve the existing adapter boundary and Supabase persistence transport; use organization scope only and keep remote operations online-only. | `confirmed` | This avoids introducing a new HTTP API surface for the Products-only first release. |
| `API-ERP-012` | Product/SKU create and update commands do not accept user-supplied internal keys or SKUs. The authoritative adapter generates numeric values; a trusted future integration may import an external SKU through a separate server-side boundary. | `confirmed` | User-approved rule; the integration boundary and provenance transport are future work. |

## Command and query catalog

The names below describe domain operations, not REST routes or RPC names.
Requests are authenticated and organization-scoped. A direct URL and an
adapter call follow the same authorization and not-found masking behavior.

| Operation | Kind | Input | Result | Status / notes |
|---|---|---|---|---|
| `ListProducts` | Query | Organization scope, cursor/page, text query, product class, primary category, operational uses, sourcing, status, sort | Bounded page of Products with stable IDs and `nextCursor` | Aggregate legacy records across catalogs during migration; target products are organization-scoped and do not belong to `OrganizationCatalog`. |
| `GetProduct` | Query | Product ID | Product detail or scoped `NOT_FOUND` | Assumed. Direct deep link must not disclose cross-tenant existence. |
| `FindProductByKey` | Query | Stable LoopDev-generated internal product key, distinct from SKU | Product or `NOT_FOUND` | Key is immutable and unique within the organization, independent of SKU. SKU uniqueness is organization-wide after trimming outer whitespace and comparing case-insensitively. |
| `CreateProduct` | Command | Name, product class, independent uses, class-valid sourcing and optional draft category | Created product with generated numeric key and SKU, UUID, version and timestamps | LoopDev generates immutable organization-unique key and SKU; clients cannot choose them. Finished products allow `buy`, `make` or `both`; raw materials/components allow `buy` only for now; services require null sourcing. `make` is intent only, not execution. Draft may omit category; require the general category before activation. Ambiguous legacy class mappings remain drafts until reviewed. |
| `UpdateProduct` | Command | Product ID, allowed mutable patch, `expectedVersion` | Updated product and new version | Reject key, SKU, UUID, scope and audit fields, plus unrecognized metadata. |
| `ChangeProductStatus` | Command | Product ID, target status, `expectedVersion` | Updated product state | Restore always returns an archived product/SKU to `draft`; activating it again re-runs the applicable required-field, category and parent guards. |
| `ListProductCategories` | Query | Parent/flat mode, status, cursor if needed | Scoped category nodes/tree | Tree serialization, pagination and empty/root representation remain open. |
| `GetProductCategory` | Query | Category ID | Category or scoped `NOT_FOUND` | A category does not exist in current runtime. |
| `CreateProductCategory` | Command | Name, optional parent category ID | Category with generated immutable organization-unique key, ID and version | LoopDev generates the key; validate parent scope and reject cycles. |
| `UpdateProductCategory` | Command | Category ID, allowed patch, `expectedVersion` | Updated category/version | Parent move is separate to make cycle and in-use checks explicit. |
| `MoveProductCategory` | Command | Category ID, new parent ID or root, `expectedVersion` | Updated subtree position/version | Atomic; move descendants, preserve product-base/SKU assignments, reject cycles and cross-organization parents. |
| `ArchiveProductCategory` / `RestoreProductCategory` | Command | Category ID, `expectedVersion` | Updated lifecycle state | Archive preserves current product-base/SKU assignments, blocks new assignments, and is rejected while active child categories remain; permanent deletion is prohibited; restore re-enables assignment if the parent is active. |
| `AssignPrimaryCategory` | Command | Product or variant ID, category ID, `expectedVersion` | Product/version or variant/version | Assign to the product base or a specific SKU; category must be active and in the same organization. |
| `ListVariants` / `CreateVariant` / `UpdateVariant` | Query/command | Product ID, variant data without user-supplied key/SKU, optional draft category, version/idempotency | Variants or changed variant with generated numeric internal key and SKU | LoopDev generates an immutable variant key distinct from SKU and unique within the organization; SKU is generated for direct-user creates and cannot be changed by direct-user updates. Category is assigned independently, may be omitted in draft and is required before activation. Sourcing inherits from product. |
| `ListOffers` / `CreateOffer` / `UpdateOffer` | Query/command | Product ID, offer data without independent currency, version/idempotency | Offers or changed offer | Offer prices use each associated PriceBook's currency; retire legacy `Offer.currency` from the target DTO. |
| `ListPriceBooks` / `ListPriceEntries` and mutations | Query/command | Filters, book/product/offer/variant IDs, book currency, amount, validity, version | Scoped price records | Currency is owned by each PriceBook and inherited by entries; reconcile legacy Offer.currency and valid reference combinations before implementation. |
| `ResolveProductReference` | Query | Product ID or legacy key plus optional offer/variant IDs | Product, optional offer/variant, shared entity reference | Preserve legacy `catalog_item` identity and return no cross-scope partial matches. |

Permanent delete, category merge, bulk import/update, export, party-role CRUD,
availability/eligibility rule execution, channel sync, sales orders and
inventory commands are not part of this release. Products records use
archive/restore only.

## Request and response DTO boundaries

All payloads are JSON-compatible and client-neutral, but concrete transport
schemas remain for a later approved plan.

| DTO | Required fields | Server-controlled / response fields | Validation / open rules |
|---|---|---|---|
| `Product` | `id`, LoopDev-generated immutable numeric organization-unique `key` distinct from numeric `sku`, `name`, `productClass`, `purchasable`, `sellable`, `inventoryTracked`, nullable `sourcing`, general `primaryCategoryId`, `status` | `sku`, `organizationId`, optional legacy `workspaceId`, `version`, `createdAt`, `updatedAt` | UUID remains the stable technical identity. Key and LoopDev-origin SKU are generated by the authoritative adapter and not accepted from direct users. A trusted future integration may import an external SKU without changing UUID/key and must retain provenance. Finished products allow `buy`, `make` or `both`; raw materials/components allow `buy` only for now; services require null sourcing. Draft category may be absent; category is required before activation. |
| `CreateProductRequest` | `name`, `productClass`, operational uses, class-valid nullable `sourcing`; general category optional for drafts | UUID, key, SKU, actor and organization are server-controlled; never accept client authority for scope | Enforce class-specific sourcing; require a general category before activation; no untyped `metadata` until allowlist schema exists. |
| `UpdateProductRequest` | Mutable product patch and `expectedVersion` | UUID, key, SKU, scope and timestamps server-controlled | Do not allow ID, key, SKU, organization, workspace or audit fields in patch. |
| `ProductCategory` | `id`, LoopDev-generated immutable organization-unique `key`, `name`, `parentCategoryId`, `status` | `organizationId`, optional `workspaceId`, `version`, timestamps | Parent must be in scope; no cycles. |
| `CreateProductCategoryRequest` | `name`, optional parent ID | Scope and actor from auth; key generated server-side | Draft category support remains open. |
| `MoveProductCategoryRequest` | Category ID, destination parent ID or root, `expectedVersion` | Resulting scope/version server-controlled | Reject self/descendant moves; define behavior for categories assigned to products before implementation. |
| `ProductVariant` | `id`, `productId`, LoopDev-generated immutable numeric organization-unique `key` distinct from numeric `sku`, `name`, attributes, category field, status | SKU, scope, inherited sourcing, version and timestamps | UUID remains stable. Direct-user creation omits key/SKU and receives generated values; direct-user updates cannot change either. A future trusted integration may import an external SKU without changing UUID/key and must retain provenance. Category is assigned independently and may differ from the product base or sibling variants; drafts may omit it, but activation requires it; attribute schema remains open. |
| `Page<T>` | `items`, `nextCursor` | `totalCount` only if computed safely and needed | Cursor format is opaque; never expose tenant data in cursor contents. |
| `PlatformAuditEvent` | Event ID, organization, actor, entity type/ID, action, changed field names, entity version, timestamp and correlation ID | Server-derived tenant/actor/time; immutable append-only record | Persist in the same database transaction as the mutation; include no field values, secrets or unrestricted metadata. |

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
- Use opaque cursor tokens with page size default 50 and maximum 100. Default
  ordering is `(created_at, id)`; any alternate sort field is allowlisted and
  paired with `id` as a deterministic tiebreaker.
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

- Updates, archive/restore and category moves include `expectedVersion`;
  stale writes return `VERSION_CONFLICT` with no partial mutation. Increment
  the version atomically with each successful change.
- Create commands accept an idempotency key scoped to organization and
  command. Replaying the same key and normalized payload returns the original
  result; a different payload conflicts. There is no offline replay in this
  release.
- Create/update of one aggregate is atomic. Category move, cycle detection and
  assignment integrity are one consistency boundary. Cross-aggregate bulk
  operations are not in scope until explicit all-or-nothing/partial-result
  semantics are approved.
- Never hard-delete a Products entity. Archive/restore are commands and must
  preserve references; direct SQL DELETE is denied for every Products table.
- If events are published, state change and durable event publication must be
  consistent (transactional outbox or equivalent); mechanism is open.
- No optimistic success, local fallback or silent retry after a remote
  authorization/validation error. Retry only transient failures with bounded
  backoff and idempotency.
- Every successful remote mutation writes an append-only Platform audit event
  in the same transaction. Record organization, actor, entity, action,
  changed field names, version, timestamp and correlation ID; omit field
  values. If the audit write fails, roll back the business mutation.

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

- The user approved an append-only audit capability in Platform as a
  prerequisite to remote Products writes. Platform must approve the shared
  contract and owning migration before the Products implementation task can
  consume it. Activity remains user-facing context and is not an audit log.

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
| iOS / Android | Excluded from this first release by approved scope; future clients must consume the same DTOs and errors. |
| Offline | Remote reads/writes are unavailable offline. Do not use a local fixture fallback, cached remote data or queued mutations. |

## Risks and open decisions

1. Platform owner must approve the append-only audit contract and its
   transaction/retention semantics.
2. Apply and verify the forward RLS/permission migration; this review could
   not authenticate to the linked Supabase database.
3. Confirm existing remote migration state and actual data through an
   authorized, read-only inventory before migration dry run.
4. Review actual legacy category keys and currency mismatches before mapping;
   no value conversion or category inference is permitted.

## Handoff

**Status: `partial`.** Products commands, version/idempotency rules,
pagination, errors, archive-only lifecycle, price visibility, online-only
behavior and shared audit requirements are defined. Implementation remains
blocked on Platform approval/implementation of the audit contract, forward
RLS migration and verification of deployed database state. Actual data must
pass a category/workspace dry run before migration. The sync analysis is
recorded in `sync-model.md`; `06-plan` remains gated by unresolved
domain/access decisions.
