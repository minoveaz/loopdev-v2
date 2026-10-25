# ERP Core — Products synchronization model

## Control

| Field | Value |
|---|---|
| Run | `MOD-CORE-20261024-001` |
| Phase | `05-sync` |
| Status | `partial` (revalidated in attempt 11 against refreshed access and API contracts) |
| Parent | `04-api` |
| Domain input | `domain-model.md` |
| Access input | `access-model.md` |
| API input | `api-contracts.md` |
| Runtime changes | None |

This defines observed local/remote behavior and a safe synchronization
contract proposal. It does not implement an offline queue, select persistence
infrastructure, or authorize migration of real local data.

Attempt 11 revalidated the synchronization contract against access and API
attempt 11. The shared Files boundary and append-only Platform audit semantics
are approved; detailed Files finalization/preview/lifecycle behavior,
product-media metadata-table enforcement, Products audit integration and
transaction-atomicity evidence remain open. Remote Products costs and media
remain online-only, without a local queue or remote-data fallback.

## Decision status

| ID | Rule | Status | Evidence / consequence |
|---|---|---|---|
| `SYNC-ERP-001` | Catalog adapter selection is explicit: `local_demo` or `supabase`; missing/invalid mode fails closed and is never inferred from organization ID shape. | `confirmed` | `catalog/adapter/index.ts` selects by `VITE_CATALOG_ADAPTER_MODE`; runtime configuration is currently absent, so the adapter rejects rather than choosing fixtures. |
| `SYNC-ERP-002` | Local demo data is not a secure or remotely synchronized source of truth; Product catalog storage failures must be surfaced rather than reported as saves. | `confirmed` | Core catalog stores opt into strict persistence; Product-media asset/assignment stores still use best-effort persistence and can suppress failures. |
| `SYNC-ERP-003` | Remote Supabase reads/writes do not fall back to local fixtures when the remote service is unavailable. | `confirmed` | Explicit `supabase` mode uses `supabaseCatalogAdapter`; errors are surfaced. |
| `SYNC-ERP-004` | No offline queue or remote mutation replay exists for Products today. | `confirmed` | No queue, idempotency or version contract in the current catalog adapter/schema. |
| `SYNC-ERP-005` | Remote Products reads and mutations require an online connection and authoritative server response; no offline write queue is provided in this release. | `confirmed` | User approved remote online-only behavior; an offline state is an explicit unavailable/error state, not a cached success. |
| `SYNC-ERP-006` | Remote Products data is not cached for offline reads in this release. | `confirmed` | User approved no offline cache; local demo data is a separate runtime mode and is never a remote fallback. |
| `SYNC-ERP-007` | Product business lifecycle (`draft`, `active`, `archived`), connectivity, entity sync state and mutation state are independent. | `confirmed` | Existing product status does not represent sync state. |
| `SYNC-ERP-008` | Product/category mutations require `expectedVersion`; stale updates return a conflict. Create retries use an idempotency key; master data never uses last-write-wins. | `confirmed` | User approved remote writes with shared audit; this contract is required before implementation and is not present in current schema. |
| `SYNC-ERP-009` | Local fixture/demo data is never automatically uploaded or merged into an organization’s remote records. | `confirmed` | Current seeds are deterministic demo records and have no identity/migration protocol. |
| `SYNC-ERP-010` | Notes, Files, Activity, Tasks, Relations and Document Intelligence use their shared Platform sync/persistence boundaries. | `confirmed` | Products stores only references and must not create parallel queues. |
| `SYNC-ERP-011` | Adapter selection is explicit runtime configuration (`local_demo` or `supabase`), never inferred from organization ID shape; missing/invalid configuration fails closed. | `confirmed` | Explicit selection and fail-closed behavior are implemented; the current runtime lacks `VITE_CATALOG_ADAPTER_MODE`, so it cannot load either adapter. |
| `SYNC-ERP-012` | Category synchronization and legacy `categoryKey` migration wait for category scope, identity and lifecycle decisions. | `confirmed` | No category entity/store/table or migration exists. |
| `SYNC-ERP-013` | Product costs are permission-sensitive remote data: no offline cache, queued mutation or replay; every read/write requires current server authorization. | `confirmed` | Owner/admin-only default grants are approved; permission revocation must invalidate any protected in-memory projection. |
| `SYNC-ERP-014` | Product/SKU gallery order changes only through an online, atomic full-gallery command with expected assignment versions; no last-write-wins or automatic merge. | `confirmed` | Manual per-gallery ordering is approved; current media assignments have no position/version fields. |
| `SYNC-ERP-015` | Product media upload and preview remain in the shared Files synchronization/lifecycle boundary; Products queues no file bytes or signed URLs. | `open` | The shared Files ownership boundary is approved; upload/finalization, signed-preview authorization, retention and orphan-recovery semantics remain to be implemented and accepted by Platform. |
| `SYNC-ERP-016` | Registering an asset and attaching it are separate recoverable steps; attach failure never deletes a reusable Platform File. | `confirmed` | Matches the API contract; any orphan cleanup is Platform-owned and must not remove a file with other references. |
| `SYNC-ERP-017` | A cost or media mutation with an ambiguous network outcome is retried only with the same idempotency key after online reconnection; a conflict is refreshed and resolved explicitly. | `confirmed` | No queue is used in this release; the rule prevents duplicate cost writes or gallery assignments if a caller retries. |

## Identifier generation and authority

The local adapter generates numeric internal keys and SKUs for newly created
products and variants. Remote persistence generates them authoritatively in the
database; direct-user requests cannot provide or change either value. Existing
UUID primary keys remain stable. A future trusted channel integration may
import an external SKU while preserving the LoopDev key/UUID and recording the
SKU origin; no connector or offline replay is included in this release.

## Current storage and adapter boundaries

| Concern | Current behavior | Sync implication |
|---|---|---|
| Local product storage | `localCatalogItemsStore` uses `createLocalStore` with namespace `rivera:loopdev:catalog:items`; local catalogs, offers, variants and prices have separate namespaces. | Browser-local deterministic fixtures and mutations are separate from remote records. Each tab keeps its own in-memory store cache; there is no storage-event reconciliation, sync queue or server reconciliation. |
| Local storage errors | Core catalog stores use `createCatalogLocalStore(... persistence: "strict")`, whose `getStrict`/`setStrict` surface access, parse and quota failures. The generic helper defaults to best-effort; product-media asset/assignment stores use that default. | Core catalog persistence is truthful, but media-store writes can appear successful after persistence fails. Switch the media stores to an explicit failure-reporting boundary before treating local media as durable. Neither is a production offline store. |
| Local/demo authority | Store contains seeded organization/workspace data and filters by organization/workspace in adapter code. Browser storage is user-controlled and not an authorization boundary. | Never trust local visibility for tenant security; no local data should be treated as server-authoritative. |
| Adapter selection | `catalogAdapter` requires `VITE_CATALOG_ADAPTER_MODE=local_demo` or `supabase` and throws for missing/invalid values. | The ID-shape routing flaw is already removed. Configure the intended runtime explicitly; local demo fixtures are scoped to `local-development-organization` and do not authorize a different authenticated tenant. |
| Remote storage | Supabase adapter maps six `erp_*` tables for UUID-scoped organizations. | Remote operations are direct; there is no offline cache, local outbox or retry queue. |
| Remote failure | Supabase adapter maps authorization and service errors to `CatalogAdapterError`; it does not use local data as fallback. | Preserve visible errors; never convert a remote outage/denial into a local success. |
| Category storage | No local category store, remote category table or category adapter methods. Product has nullable `categoryKey` string. | Category hierarchy cannot sync until identity, scope and migration decisions are approved. |
| Shared Platform data | Shared collaboration/document capabilities have separate Platform adapters/contracts. | Keep their sync state and recovery in Platform; Products references entities but does not copy files or add upload queues. |
| Product-media lifecycle | Current media adapters upload bytes, create shared Files metadata and create the ERP asset in one call; the local adapter removes its File if asset creation throws, Supabase cleanup may delete the File/object, and Supabase code generates signed URLs directly. | This is not the approved target contract: Platform must own upload/finalization/preview and orphan cleanup; Products registers a finalized File, then attaches it separately, and never removes a reusable File as compensation. |

The current local store namespace is not scoped by organization ID and persists
through the general `rivera:` browser storage helper. Local fixtures are
filtered by adapter logic, not protected by server authorization. A production
offline cache must be tenant-partitioned, permission-aware and cleared or
revalidated on tenant changes.

## State model

Never overload product lifecycle with synchronization state:

| Dimension | Values | Meaning |
|---|---|---|
| Business state | `draft`, `active`, `archived` | Whether the product is usable in business workflows. |
| Connectivity | `online`, `offline`, `service_unavailable` | Current ability to reach the authoritative remote service. |
| Entity sync state | `local_only`, `synced`, `dirty`, `conflict`, `rejected`, `unknown` | Relationship between a local representation and authoritative remote version. `local_only` applies to fixtures until a real migration is approved. |
| Mutation state | `none`, `queued`, `sending`, `retry_wait`, `acknowledged`, `conflict`, `rejected`, `cancelled` | State of one attempted mutation, not the product lifecycle. No mutation queue exists today. |
| Platform File state | Platform-owned upload/finalization/preview lifecycle | Products may register only a finalized same-organization File; it does not mirror or queue the File's bytes or signed preview URL. |

Proposed future mutation transitions, pending approval:

```text
queued → sending → acknowledged
                  ↘ retry_wait → sending
                  ↘ conflict
                  ↘ rejected
queued → cancelled
```

Only server acknowledgement marks a remote mutation `acknowledged`/entity
`synced`. A transient network failure may enter `retry_wait`; authorization,
validation, scope and stale-version failures are not automatic retries.
`retry_wait` must be bounded with backoff and jitter; exact limits remain open.

## Operation and offline matrix

| Operation | Current local/demo behavior | Current remote behavior | First-release offline behavior | State dimensions to show |
|---|---|---|---|---|
| List/get product | Explicit `local_demo` mode reads local fixtures; if `VITE_CATALOG_ADAPTER_MODE` is unset or invalid, the operation rejects rather than selecting data by organization ID shape. | Explicit `supabase` mode performs an online Supabase query only. | No remote cache; offline returns explicit unavailable state. | Business status + connectivity + entity `synced`/`local_only` |
| Search/filter product | In-memory filtering for local fixtures under explicit `local_demo` mode. | Online Supabase query; bounded cursor behavior is a target contract, not current adapter behavior. | No remote cache; never present demo fixtures as a remote fallback. | Connectivity and request state, separate from business status |
| Create product | Writes strict local fixture store; storage/serialization failure rejects rather than claiming a save. | Online command path has no complete target version/idempotency/audit enforcement yet. | Remote mutation is disabled while offline; no queue. | Mutation `sending`/`acknowledged` or explicit `rejected`; no optimistic success |
| Update product | Writes strict local fixture store; storage/serialization failure rejects rather than claiming a save. | Online update has no target `expectedVersion` check yet. | Remote mutation is disabled while offline; no queue. | Version conflict is explicit; no last-write-wins |
| Archive/restore | Legacy local status patch; target restore always returns product/SKU to `draft` | Direct status update; target transition enforcement and versioning are missing | Online acknowledgement required; no queue or optimistic success. | Preserve business state separately from connectivity and mutation state |
| Delete product/offer/variant/price | Legacy adapter physically removes local records | Legacy adapter issues physical delete; SQL cascades may remove children | No hard-delete operation in this release; archive/restore only on both adapters. | Not available |
| Cost read/write/clear | Local demo adapter uses local stores; permission must still be checked and this is not a remote snapshot. | Current queries/writes lack dedicated cost permission and version semantics. | No remote cache or queue. Offline cost reads/writes are unavailable; online access rechecks `catalog.cost.read/manage`. | Cost visibility + connectivity + request/mutation state; never infer sync state from product status |
| Category list/create/move/archive | Not supported | Not supported | No local or remote category synchronization until category model and scope are approved. | Not applicable today; future state mirrors the independent dimensions above |
| Media upload / register asset | Current adapters upload bytes and create Files metadata plus the ERP asset in one adapter call; local media stores use best-effort persistence, and remote code directly writes Storage/metadata. | Requires online Files/storage access; current code has no shared finalized-upload contract. | No Products queue. Files owns upload retry and orphan cleanup; Products registers only a finalized file and keeps every failed step visible. | File upload state is Platform-owned; Product mutation state starts only at asset registration |
| Attach / detach / update alt text | Local assignment store mutation; current storage errors may be hidden. | Online Supabase mutation; no expected version or durable idempotency yet. | No offline queue; preserve uploaded reusable asset if attach fails. | Assignment mutation and shared File lifecycle remain separate |
| Reorder product/SKU gallery | No position field or ordering command exists. | No position/version field or atomic reorder command exists. | Online atomic full-gallery command only; stale membership/version requires refresh and explicit reorder resubmission. | Gallery membership/version conflict is separate from connectivity |
| Product media preview | Local Files adapter returns preview source. | Supabase adapter generates a one-hour signed URL directly, outside a generic Files preview operation. | No cached signed URL or offline preview; request a fresh Platform preview after reauthorizing. | Platform Files controls preview authorization, availability and expiry |
| Resolve product reference | Looks up local product/offer/variant IDs or key | Resolves remote references | No remote cache; offline resolution is unavailable. Never guess a legacy mapping. | Connectivity/request state, not business status |
| Shared Files/Notes/Tasks/Document Intelligence | Shared Platform adapters | Platform-owned remote contracts | Reuse Platform queues, permission checks and recovery; do not enqueue through Products. | Platform-owned state plus parent-record access |

## Queue, idempotency and retry policy

No Products mutation queue exists. If a queue is approved later:

- Persist mutation ID, organization, actor, aggregate ID, operation, normalized
  payload hash, `expectedVersion`, idempotency key, creation time and attempt
  state. Store only fields approved for offline retention.
- Partition queued work by organization and user. A tenant switch must never
  replay work under a different organization; require reauthentication and
  reauthorization at replay.
- Generate one idempotency key per logical mutation and reuse it for every
  retry. Same key plus same normalized payload returns the prior outcome;
  same key plus different payload is a terminal conflict.
- Retry only timeouts, network loss, rate limits and explicitly retryable
  server failures. Respect `Retry-After`, use bounded exponential backoff with
  jitter, and stop after a configured policy limit.
- Treat permission revocation, membership suspension, invalid scope,
  validation failure and version conflict as terminal until user action.
  Surface rejection and preserve a recoverable local draft where allowed.
- Do not report queued work as saved or synced. The UI needs separate
  `pending`, `conflict`, `rejected` and `synced` feedback.
- Do not retry unboundedly or silently fall back to local fixture data after a
  Supabase failure.
- Do not cache remote purchase costs, protected Files metadata, signed preview
  URLs or unpublished media mutations for offline use in this release.
- If Platform audit persistence fails, the Products transaction must roll back
  and return `AUDIT_UNAVAILABLE`; retry only with the same idempotency key
  after a transient failure, never by presenting a local save as success.
- A gallery reorder retry must reuse the same idempotency key and complete
  ordered assignment/version set. If membership or versions conflict, refresh
  the target gallery and require explicit user reconciliation; never merge by
  last-write-wins.
- A timed-out attach may have committed. Retry with the same idempotency key;
  if its result remains ambiguous, refresh assignments before offering
  another attach. Never compensate by deleting the shared File.
- If upload succeeds but registration or attachment fails, preserve the
  Platform File and surface the failed step. Platform owns discovery and safe
  cleanup of genuinely unreferenced files.

## Conflict and reconciliation policy

1. **Product/category master:** no last-write-wins. Compare local base version,
   server version and changed fields; present a conflict for explicit user
   resolution. Revalidate category, class, SKU/key and status invariants.
2. **Category tree moves:** serialize or version-check moves. Reject cycles,
   stale parent references, deleted/archived parents and cross-scope changes.
3. **Commercial prices/offers:** do not merge amounts or validity windows
   automatically. Require explicit resolution and preserve transaction
   snapshots.
4. **Authorization changed:** discard any stale permission grant, invalidate
   cached protected data, reject queued writes at replay and audit the
   rejection without disclosing the full payload.
5. **Server rejection:** retain a recoverable local draft only in an approved
   tenant/user partition; mark it rejected and expose field/error details safe
   for that user. Never show a success-shaped result.
6. **Partial sync:** each aggregate mutation has its own result; dependent
   operations do not run until their parent is acknowledged. Category
   hierarchy and product assignment changes that must be atomic are one
   server consistency boundary.
7. **Reload/reinstall:** current localStorage data may survive reload but is
   not guaranteed if storage fails or the browser is cleared. No recovery
   promise exists today; production offline edits need explicit persistence
   and export/recovery policy before launch.
8. **Shared File lifecycle:** if upload/finalization succeeds but Product asset
   registration or assignment fails, preserve the Platform File and surface
   the failed operation. Platform—not Products—determines whether and when an
   unreferenced File is safe to clean up.

## Migration and reconciliation plan

1. **Establish source of truth:** use explicit `local_demo` or `supabase`
   runtime configuration. Missing or invalid configuration fails closed;
   adapter selection never depends on ID shape.
2. **Inventory remote data:** snapshot catalog tables and scope; preserve
   stable IDs. The linked Supabase migration state could not be verified in
   this review because authentication failed. Do not infer production data
   from local fixtures.
3. **Validate tenant and references:** detect cross-organization/workspace
   parent links, required-but-null `catalog_id`, duplicate keys/SKUs and
   unsupported references. Produce a review report before any write.
4. **Map legacy product classes:** create a reviewed mapping for every
   `CatalogItem.type`; do not guess ambiguous values. Keep unmapped records in
   draft with their original type available for review, and require an
   assigned class before activation.
5. **Map categories:** preserve every legacy `category_key` as provenance and
   produce a dry-run mapping report from actual records. Do not synthesize
   category trees or assign by guess. Unmapped records remain draft until an
   authorized category is assigned; backfill only after owner review.
6. **Normalize workspace scope:** target Products are organization-wide.
   The dry run must show each legacy non-null workspace ID and resulting
   visibility expansion. Preserve the legacy ID as provenance and set the
   target workspace to null only after the report is approved.
7. **Preserve commercial records:** validate offers, variants, books and
   entries and per-purchasable-unit costs; retain IDs, explicit currency and
   references. Do not round amounts through binary floating-point. Resolve
   physical delete/cascade and transaction snapshot policy before migration.
8. **Reconcile Files and galleries:** preserve Platform File IDs and
   organization scope; validate reusable assets, same-organization
   assignments, contextual alt text and the approved manual gallery order.
   Do not copy binary data or remove Files during Products migration.
9. **Reconcile in dry run:** compare counts, IDs, foreign keys, uniqueness,
   status, scope and representative resolved CRM references. Require
   explicit mismatch reports and approval before cutover.
10. **Cut over without dual-write:** use a single authoritative write path.
   Keep an immutable pre-migration snapshot and a documented rollback that
   restores the prior contract without deleting newly created records.
11. **Verify after cutover:** re-run tenant isolation, CRUD/lifecycle,
   category/reference parity, cost-field authorization, gallery ordering,
   Files access, mobile query semantics and recovery tests.
   Remove compatibility mapping only after CRM/channel consumers are
   verified.

The exact migration tool, transaction size, dual-read window and rollback
mechanism are open; no infrastructure choice is made here.

## User-visible synchronization behavior

- Display business status (draft/active/archived) independently from a sync
  indicator.
- If a future local snapshot is shown offline, label its last successful sync
  time and stale/partial status; never imply that an unavailable remote list
  is complete.
- Distinguish unsaved local draft, queued mutation, server-acknowledged save,
  conflict and rejected write. A localStorage write alone is not a remote
  save.
- On tenant switch, permission change, logout or membership revocation,
  invalidate protected caches and prevent queued mutations from crossing
  scope.
- Never retain cost values or signed media preview URLs after access is
  revoked or their Platform authorization/expiry context changes.
- Keep retry/resolve actions explicit and accessible on desktop and mobile;
  reconnecting must not silently overwrite server changes.

## Multiplatform and recovery tests

These are future implementation tests; this design phase ran no offline,
remote, browser-storage or mobile runtime tests.

| ID | Scenario | Expected result |
|---|---|---|
| `SYNC-TEST-001` | Reload after local demo edit with storage available. | Local demo value reloads, remains clearly local-only and is never uploaded. |
| `SYNC-TEST-002` | `localStorage` read/write failure or quota exhaustion. | No false saved/synced claim; explicit storage failure or recoverable warning is surfaced. |
| `SYNC-TEST-003` | Remote UUID tenant offline during list/read. | No local fixture fallback or remote cache; return an explicit unavailable state. |
| `SYNC-TEST-004` | Remote create/update loses connectivity after server commit. | Retry with the same idempotency key; return the original result without duplicate record. |
| `SYNC-TEST-005` | Replay after permission revocation or membership suspension. | Reauthorize on server, reject mutation, invalidate protected cache and present recovery guidance. |
| `SYNC-TEST-006` | Two clients update a product/category at the same version. | One succeeds; stale version becomes explicit conflict; no last-write-wins. |
| `SYNC-TEST-007` | Switch organization with pending mutation or cached list. | No cross-tenant replay/display; queue partition remains isolated and cache is invalidated. |
| `SYNC-TEST-008` | Reinstall/clear browser storage with local unsynced data. | No claim of guaranteed recovery; communicate or export local draft if that policy is approved. |
| `SYNC-TEST-009` | Retry validation, forbidden, scope or legacy-mapping error. | No automatic retry; mutation remains rejected until user/domain resolution. |
| `SYNC-TEST-010` | Retry transient network/rate-limit error. | Bounded backoff, same idempotency key, observable attempts and terminal surfaced failure after limit. |
| `SYNC-TEST-011` | Migrate legacy category/type rows with duplicates and unmapped values to product-base and SKU category ownership; detect duplicate organization-wide SKUs. | Dry run reports conflicts; no destructive coercion; IDs remain stable; category assignment ownership is explicit and duplicate SKUs are reported. |
| `SYNC-TEST-012` | Product references a Platform File/Note/Document Intelligence result after revocation. | Platform owns sync and authorization; Products does not expose cached protected content. |
| `SYNC-TEST-013` | Future native adapters reconnect with the same command after an offline queue is separately approved. | Same business semantics and idempotency; native clients remain out of first-release scope and queue semantics are not enabled. |
| `SYNC-TEST-014` | Offline remote user opens or searches product cost. | No cached cost is returned; surface unavailable and recheck `catalog.cost.read` on reconnect. |
| `SYNC-TEST-015` | Cost permission is revoked while a product detail page is open. | Clear the protected cost projection immediately; do not retain it in caches, logs or retry payloads. |
| `SYNC-TEST-016` | Gallery reorder times out after server commit. | Retry with the same idempotency key; return committed order or refresh, never duplicate or move assignments. |
| `SYNC-TEST-017` | Two clients reorder or attach/detach in the same gallery concurrently. | One atomic versioned operation wins; the other receives `MEDIA_ORDER_CONFLICT` and refreshes before user reconciliation. |
| `SYNC-TEST-018` | File upload succeeds but asset registration or media attachment fails. | Preserve the shared File; surface the failed step and let Platform reconciliation own any orphan cleanup. |
| `SYNC-TEST-019` | Signed preview expires, user changes tenant, or Files permission is revoked. | Do not reuse the URL; clear preview and request fresh authorization after reconnect. |
| `SYNC-TEST-020` | Product-media event is delivered twice or out of order after future outbox approval. | Consumer deduplicates by event ID/version and refreshes canonical gallery state; delivery never publishes to a channel. |
| `SYNC-TEST-021` | Platform audit persistence fails during an online Products mutation. | The business mutation rolls back, `AUDIT_UNAVAILABLE` is surfaced with correlation ID, and a transient retry reuses the same idempotency key. |
| `SYNC-TEST-022` | An authenticated product-media association DELETE or cross-organization detach is attempted directly. | RLS denies physical deletion unless an explicitly approved detach operation is used; reusable Files and Storage objects remain intact. |

## Risks and open decisions

1. Shared audit semantics are approved, but Products mutation call sites and
   same-transaction failure/rollback tests must pass before remote mutations
   are enabled.
2. Product-media Storage policy migrations are applied and verified in
   `loopdev-platform-dev`; the broader ERP permission/RLS migration and full
   deployed schema remain unverified.
3. Production category/workspace data must pass the dry-run mapping and
   visibility review before migration.
4. Remote mutation implementation must add expected-version checks,
   idempotency and audit atomically; none exists in the current adapter/schema.
5. The shared Files boundary is approved, but the current media adapter
   bypasses finalized-file registration and generates signed URLs directly;
   metadata-table policies, preview authorization, retention and safe orphan
   recovery remain prerequisites to remote media writes and preview.
6. Product cost fields require owner/admin-only permissions, exact decimal
   representation, no remote offline cache and immediate invalidation on
   permission changes; present SQL/adapter enforcement is insufficient.

## Handoff

**Status: `partial`.** The first-release sync policy is explicit: remote
Products are online-only with no offline cache or mutation queue; local demo
data is selected explicitly and is never a remote fallback. Fail-closed
adapter selection and strict core-catalog persistence are implemented, but
runtime mode is unset and local media persistence remains best-effort.
Versions, idempotency, audit integration, RLS and production migration remain
implementation tasks. The shared Files and audit semantics are approved, but
Files lifecycle/table enforcement and Products audit atomicity evidence remain
open. Do not enable remote writes until forward migrations are applied and
verified, and do not migrate categories or workspace scope before the approved
dry run.
