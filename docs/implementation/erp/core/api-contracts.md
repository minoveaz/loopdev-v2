# ERP Core — Products API contracts

## Control

| Field | Value |
|---|---|
| Run | `MOD-CORE-20261024-001` |
| Phase | `04-api` |
| Status | `partial` (Products Files contract ratified in build attempt 15; adapter implementation remains pending) |
| Parent | `03-access` |
| Domain input | `domain-model.md` |
| Access input | `access-model.md` |
| Runtime changes | None |

These are client-agnostic logical contracts for Products, variants,
categories, per-unit costs, physical attributes and reusable media
assignments. They are not HTTP routes, DTO implementations or approval to
change the legacy catalog interface. Existing catalog IDs and the shared
`EntityRef<"catalog_item">` remain compatibility constraints. No API, schema,
event bus or endpoint was implemented in this phase.

Build attempt 15 ratified the shared Files consumer contract: server-validated
product images, finalized-file registration, reusable multi-assignment,
Platform-owned renditions/retention/orphan recovery, and signed previews with
a 300-second maximum lifetime. These semantics do not mean the Products
adapter or generic organization-scoped remote Files adapter is implemented.
Products RLS and audit controls are deployed with all write controls disabled.
No HTTP endpoint or signed-URL runtime behavior changed in this contract
ratification.

## Contract decision status

| ID | Contract decision | Status | Evidence / impact |
|---|---|---|---|
| `API-ERP-001` | Products is the user-facing master; keep legacy catalog IDs and CRM entity references stable during migration. | `confirmed` | Approved product/module decisions and `resolveReference` implementation. |
| `API-ERP-002` | Commands derive organization scope and actor from authenticated context; clients do not choose tenant authority. | `confirmed` | `access-model.md` and Platform RLS contract. |
| `API-ERP-003` | Product/category/variant logical commands and DTOs use the approved conceptual model rather than exposing `CatalogItem.type` as the new product class. | `assumed` | `DOM-ERP-009` confirms only legacy `service` maps automatically; other legacy values remain drafts until explicit class review. |
| `API-ERP-004` | Every update/archive/restore carries `expectedVersion`; creates carry an idempotency key; stale versions fail without mutation. | `confirmed` | Required by the approved online remote-write and shared-audit policy; fields are absent from current schema and must be implemented. |
| `API-ERP-005` | Lists use cursor pagination with a default page size of 50, a maximum of 100 and stable `(created_at, id)` ordering. | `confirmed` | Current adapter returns arrays; pagination is a new, bounded contract for both web renderers. |
| `API-ERP-006` | Category management is a first-class logical command/query surface within Products. | `confirmed` | User-approved category management and `REQ-ERP-PRODUCT-CATEGORIES`; persistence/transport remain undefined. |
| `API-ERP-007` | Offers, price books and price entries are in Products scope; every `catalog.read` role can read sales prices. Purchase costs use separate `catalog.cost.read` and `catalog.cost.manage` gates. | `confirmed` | User approved sales-price visibility for all readers and owner/admin-only default grants for the distinct cost permissions; margin and export remain out of scope. |
| `API-ERP-008` | ProductPartyRole, availability and eligibility are not promised by the future remote API until their domain/persistence ownership is resolved. | `confirmed` | Local adapter returns or stores them, but Supabase adapter/migration have no remote tables. |
| `API-ERP-009` | Domain events are proposed contracts only; publish only after actor/version/audit and consumer ownership are approved. | `confirmed` | No product/category events are implemented. |
| `API-ERP-010` | Remote mutations require operation-specific RLS, explicit adapter mode, optimistic versions and an atomic Platform audit event; costs require their dedicated read/manage permissions and no Products entity has a DELETE operation. | `confirmed` | Forward migrations and audit controls are deployed and verified on the development database; global and organization write controls remain off pending recovery and data gates. |
| `API-ERP-011` | Preserve the existing adapter boundary and Supabase persistence transport; use organization scope only and keep remote operations online-only. | `confirmed` | This avoids introducing a new HTTP API surface for the Products-only first release. |
| `API-ERP-012` | Product/SKU create and update commands do not accept user-supplied internal keys or SKUs. The authoritative adapter generates numeric values; a trusted future integration may import an external SKU through a separate server-side boundary. | `confirmed` | User-approved rule; the integration boundary and provenance transport are future work. |
| `API-ERP-013` | Purchase costs are separate per purchasable unit, returned only through an explicitly authorized cost query/projection and never embedded in ordinary Product DTOs. | `confirmed` | Domain and access decisions require no inheritance, explicit ISO currency and owner/admin-only default cost permissions. Currency precision and history remain open. |
| `API-ERP-014` | Product and SKU media galleries may contain multiple assignments with manually controlled per-gallery order. | `confirmed` | Product Owner confirmed manual ordering; the current schema lacks a position field and needs a versioned, atomic reorder contract. |
| `API-ERP-015` | Product media references finalized Platform Files; upload/preview/signed access remains owned by Files, while Product owns same-organization assignments and contextual alt text. | `confirmed` | `PlatformFilesPort` is the consumer contract. Platform Files owns upload/finalization, content validation, 1600/400 max-edge renditions, 300-second maximum signed previews, retention and orphan recovery. ERP owns tags and product/SKU assignments; detach never deletes the reusable File. Runtime adapter integration remains a separate task. |
| `API-ERP-016` | Product and SKU request/response DTOs carry optional unit-specific physical attributes in kg/cm without inheritance. | `confirmed` | Domain decision confirmed; field activation guards and numeric precision remain open. |
| `API-ERP-017` | Cost amounts use canonical base-10 decimal strings in JSON to avoid binary floating-point loss. | `assumed` | Currency-specific scale and validation limits remain open. |
| `API-ERP-018` | Cost history/source, durable event/outbox semantics and currency-specific cost precision are not finalized. | `open` | Shared asset tags are ERP-owned; rendition dimensions are approved and encoding/quality remain Platform policy. Resolve remaining cost/event decisions separately. |

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
| `GetPurchaseCost` | Query | Product ID and optional SKU ID | Cost reference or no current cost | Requires `catalog.cost.read`; lookup scope follows the purchasable unit. Unauthorized callers receive no cost values or existence hints. Do not embed cost in `GetProduct` or ordinary lists. |
| `SetPurchaseCost` / `ClearPurchaseCost` | Command | Product ID and optional SKU ID, explicit ISO currency and amount for set, `expectedVersion`, idempotency key | Updated cost reference/version or cleared state | Requires `catalog.cost.manage`; one product cost only when no managed SKUs exist, otherwise one independent value per purchasable SKU with no inheritance or FX conversion. |
| `ListProductMedia` / `ListProductMediaAssets` | Query | Product ID and optional SKU ID, asset filters and cursor | Ordered assignments or a bounded page of reusable organization assets | Requires catalog read for associations and the Platform Files policy for bytes/previews; the gallery order is per target. |
| `RegisterProductMediaAsset` | Command | Finalized same-organization Platform `fileId`, idempotency key | Reusable Product media asset reference | Does not upload bytes. Asset tags/common metadata ownership remains open with Platform. Retry is idempotent; failure must not delete a shared Platform File. |
| `AttachProductMedia` | Command | Asset ID, product ID, optional SKU ID, alt text, idempotency key | Assignment appended to that target's gallery | Requires catalog write and independent Files access; reject cross-organization IDs and SKU/product mismatch. |
| `UpdateProductMediaAssignment` | Command | Assignment ID, contextual alt text, `expectedVersion` | Updated assignment and version | Requires catalog write; changing alt text affects only this assignment. Position can change only through the atomic gallery operation below. |
| `ReorderProductMedia` | Command | Product ID and optional SKU ID, full ordered assignment ID list, each assignment's expected version, idempotency key | Updated ordered gallery | Requires catalog write; all current assignments for that target must be represented and updated atomically. Concurrent attach/reorder returns `MEDIA_ORDER_CONFLICT`; other galleries are unchanged. |
| `DetachProductMedia` | Command | Assignment ID, `expectedVersion`, idempotency key | Detached assignment or not-found | Requires catalog write; preserves the reusable asset and Platform File. |
| `GetProductMediaPreview` | Query | Asset ID, product/SKU context and `original`, `large` or `thumbnail` rendition | Platform File preview source with `expiresAt` and effective rendition | Recheck parent-record and Files authorization at request time; signed URL lifetime is at most 300 seconds; never return or persist a public URL. |
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
| `Product` | `id`, LoopDev-generated immutable numeric organization-unique `key` distinct from numeric `sku`, `name`, `productClass`, `purchasable`, `sellable`, `inventoryTracked`, nullable `sourcing`, optional `physicalAttributes`, general `primaryCategoryId`, `status` | `sku`, `organizationId`, optional legacy `workspaceId`, `version`, `createdAt`, `updatedAt` | UUID remains the stable technical identity. Key and LoopDev-origin SKU are generated by the authoritative adapter and not accepted from direct users. A trusted future integration may import an external SKU without changing UUID/key and must retain provenance. Finished products allow `buy`, `make` or `both`; raw materials/components allow `buy` only for now; services require null sourcing. Draft category may be absent; category is required before activation. Cost is never part of this DTO. |
| `CreateProductRequest` | `name`, `productClass`, operational uses, class-valid nullable `sourcing`; optional `physicalAttributes`; general category optional for drafts | UUID, key, SKU, actor and organization are server-controlled; never accept client authority for scope | Enforce class-specific sourcing; require a general category before activation; no untyped `metadata` until allowlist schema exists. Physical attributes are optional and use kg/cm without implicit conversion. |
| `UpdateProductRequest` | Mutable product patch, optional `physicalAttributes` patch and `expectedVersion` | UUID, key, SKU, scope and timestamps server-controlled | Do not allow ID, key, SKU, organization, workspace, cost or audit fields in patch. |
| `ProductCategory` | `id`, LoopDev-generated immutable organization-unique `key`, `name`, `parentCategoryId`, `status` | `organizationId`, optional `workspaceId`, `version`, timestamps | Parent must be in scope; no cycles. |
| `CreateProductCategoryRequest` | `name`, optional parent ID | Scope and actor from auth; key generated server-side | Draft category support remains open. |
| `MoveProductCategoryRequest` | Category ID, destination parent ID or root, `expectedVersion` | Resulting scope/version server-controlled | Reject self/descendant moves; define behavior for categories assigned to products before implementation. |
| `ProductVariant` | `id`, `productId`, LoopDev-generated immutable numeric organization-unique `key` distinct from numeric `sku`, `name`, attributes, category field, optional `physicalAttributes`, status | SKU, scope, inherited sourcing, version and timestamps | UUID remains stable. Direct-user creation omits key/SKU and receives generated values; direct-user updates cannot change either. A future trusted integration may import an external SKU without changing UUID/key and must retain provenance. Category and physical attributes are assigned independently and may differ from the product base; drafts may omit category, but activation requires it. |
| `PhysicalAttributes` | Optional `weightKg`, `lengthCm`, `widthCm`, `heightCm` | Owning product/SKU identity and version | Values belong to exactly one managed unit; no product-to-SKU inheritance. Reject non-finite or negative values; physical shipping-package measurements are outside this contract. |
| `ProductCostReference` | Unit identity (`catalogItemId` and optional `variantId`), canonical base-10 decimal amount as a string, ISO currency, `expectedVersion` on mutation | Cost reference ID, organization, actor, version and timestamps | No reference means no current cost; amount is non-null when a reference exists and zero is distinct from unset. Separate query/projection requires `catalog.cost.read`; mutations require `catalog.cost.manage`. Owner/admin receive both by default. Never include in ordinary Product DTOs. Cost history, source and currency-specific decimal scale remain open. |
| `ProductMediaAsset` | Stable asset ID, `fileId`, filename/type/size derived from Platform Files | Organization, lifecycle/version and canonical file metadata from Files | References one finalized same-organization Platform File; no bytes or public URL in ERP payloads. Tag ownership is open. |
| `ProductMediaAssignment` | Assignment ID, asset ID, product ID, optional SKU ID, contextual `altText`, non-negative gallery `position` | Organization, version, timestamps and same-organization relationship validation | One file can have many assignments; position is independent per product/SKU gallery. Detach preserves the asset and shared File. |
| `ReorderProductMediaRequest` | Product ID, optional SKU ID, full ordered assignment-ID array, expected assignment versions, idempotency key | Organization/actor from authentication; returned assignment versions | Must exactly cover the current target gallery and apply atomically; stale assignment/version set returns `MEDIA_ORDER_CONFLICT`. |
| `Page<T>` | `items`, `nextCursor` | `totalCount` only if computed safely and needed | Cursor format is opaque; never expose tenant data in cursor contents. |
| `PlatformAuditEvent` | Event ID, organization, actor, entity type/ID, action, changed field names, entity version, timestamp and correlation ID | Server-derived tenant/actor/time; immutable append-only record | The shared Platform table/function and semantics are approved. Persist in the same database transaction as each Products mutation; include no field values, secrets or unrestricted metadata, including purchase-cost amounts/currencies. Products call sites and transaction-atomicity tests are still missing. |

Legacy inputs must use a named compatibility mapper. Unknown `CatalogItem.type`
values must fail with `LEGACY_TYPE_UNMAPPED`; never silently coerce a
subscription, coverage, package, digital product or fee into one of the three
approved product classes.

## Error catalog and retry semantics

| Code | Meaning | Retry |
|---|---|---|
| `VALIDATION_ERROR` | Invalid field, status transition, parent/category relation or unsupported combination | Terminal until corrected |
| `FORBIDDEN` | Caller lacks permission or current scope | Terminal; do not retry without permission change |
| `COST_FORBIDDEN` | Caller lacks field-level cost read/manage permission | Terminal; response does not reveal whether a cost reference exists or return its amount/currency |
| `NOT_FOUND` | Record missing or intentionally masked because it is outside caller scope | Terminal |
| `INVALID_SCOPE` | Organization/workspace/parent references are inconsistent | Terminal |
| `CONFLICT` | Key/SKU duplicate, category in use, invalid move, or state conflict | Terminal after user resolves current state |
| `VERSION_CONFLICT` | `expectedVersion` is stale | Refresh and reconcile; never auto-overwrite |
| `IDEMPOTENCY_KEY_REUSED` | Same idempotency key is sent with a different request payload | Terminal; caller must use a new key |
| `LEGACY_TYPE_UNMAPPED` | Legacy type has no approved product-class mapping | Terminal; migration decision required |
| `MEDIA_FILE_UNAVAILABLE` | Platform File is missing, outside scope, not finalized or not an allowed image | Terminal; do not disclose which check failed across tenant boundaries |
| `MEDIA_ORDER_CONFLICT` | Gallery membership/order changed or expected assignment version is stale | Refresh the target gallery and submit a new full order; no partial reorder |
| `AUDIT_UNAVAILABLE` | The shared append-only audit event could not be persisted and the domain mutation was rolled back | Retry with the same idempotency key only after a transient failure; otherwise surface the failure and correlation ID |
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
- Product-media library queries use the same bounded cursor rules; gallery
  assignments are returned in explicit `position` order with assignment ID as
  a deterministic tiebreaker.
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
- Product-media reordering validates the complete current assignment set and
  all expected assignment versions, then writes the full order atomically.
  Concurrent attach, detach or reorder returns `MEDIA_ORDER_CONFLICT`; no
  assignment is moved to another gallery. Uploading/registering a File and
  attaching it are separate operations; an attach failure never deletes the
  reusable Platform File.
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
| `catalog.product-media.changed` | Product/SKU media asset attached, detached, alt text or order changed | Organization ID, product ID, optional SKU ID, asset/File/assignment IDs, version, change kind and position; omit file bytes, signed/public URLs and alt-text contents | Discovery-proposed organization-scoped event; only authorized Product projections consume it. No automatic channel publication. |

Event delivery must be at-least-once with consumer deduplication by `eventId`
if/asynchronous publication is approved. Retry, dead-letter, replay, ordering,
webhook signing and retention policies remain open for the channel-integration
design. Do not send catalog events as a substitute for Platform Activity or
audit records.

## Shared Platform and consumer impact

- The shared append-only Platform audit table/function and semantics are
  approved. Products must add mutation call sites and prove same-transaction
  rollback on audit failure before remote writes are enabled. Activity remains
  user-facing context and is not an audit log.

- Continue to resolve existing CRM references using stable
  `EntityRef<"catalog_item">`; do not introduce `EntityRef<"product">` in this
  phase or break existing deep links.
- Notes, Files, Activity, Tasks, Relations and Document Intelligence are
  consumed through their owning Platform contracts. APIs return references
  only when the caller is authorized for both the entity and the linked
  Platform resource.
- Purchase-cost queries and mutations use `catalog.cost.read` and
  `catalog.cost.manage`; all ordinary Product lists/details omit cost fields.
  The target signed File preview request goes through Platform Files and
  re-checks current parent and file authorization; Products never returns
  public object URLs. The current Products adapter has not yet migrated.
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

1. Verify the approved six-month audit retention/archive operation and preserve
   the default-off write controls until recovery gates pass.
2. Implement the generic remote Files adapter and migrate Products away from
   direct Storage upload/signing; test 300-second URL expiry and current
   authorization checks.
3. Confirm existing remote migration state and actual data through an
   authorized, read-only inventory before migration dry run.
4. Review actual legacy category keys and currency mismatches before mapping;
   no value conversion or category inference is permitted.
5. Implement/persist gallery positions; current media assignments have no
   order/version field.
6. Define currency-specific decimal precision and whether cost history/source
   is required; amounts must not be rounded through binary floating-point.

## Handoff

**Status: `partial`.** Products commands, per-unit costs, unit-specific
physical attributes, manually ordered product/SKU media, version/idempotency
rules, pagination, errors, archive-only lifecycle and online-only behavior
are defined. Products RLS and mutation audit controls are deployed with
writes disabled. Implementation remains blocked on shared Files adapter
integration, recovery/data gates, gallery persistence, currency precision and
runtime/mobile verification. The next sync phase must preserve the approved
Files lifecycle and the five-minute preview-URL maximum.
