# ERP Core — Products synchronization model

## Control

| Field | Value |
|---|---|
| Run | `MOD-CORE-20261024-001` |
| Phase | `05-sync` |
| Status | `partial` |
| Parent | `04-api` |
| Domain input | `domain-model.md` |
| Access input | `access-model.md` |
| API input | `api-contracts.md` |
| Runtime changes | None |

This defines observed local/remote behavior and a safe synchronization
contract proposal. It does not implement an offline queue, select persistence
infrastructure, or authorize migration of real local data.

## Decision status

| ID | Rule | Status | Evidence / consequence |
|---|---|---|---|
| `SYNC-ERP-001` | Synthetic/demo organizations use seeded local catalog stores; UUID organization IDs select the Supabase adapter. | `confirmed` | `CatalogAdapter` proxy chooses the adapter by ID shape, not by an explicit runtime mode. |
| `SYNC-ERP-002` | Local catalog mutations persist through browser `localStorage`; this is demo/local persistence, not a secure or remote-synchronized source of truth. | `confirmed` | `createLocalStore` uses `storage`; storage silently falls back on read errors and ignores write/quota errors. |
| `SYNC-ERP-003` | Remote Supabase reads/writes do not fall back to local fixtures when the remote service is unavailable. | `confirmed` | UUID-scoped calls use `supabaseCatalogAdapter`; errors are surfaced. |
| `SYNC-ERP-004` | No offline queue or remote mutation replay exists for Products today. | `confirmed` | No queue, idempotency or version contract in the current catalog adapter/schema. |
| `SYNC-ERP-005` | Real remote mutations require online authorization and server acknowledgement; do not queue them offline until access, version and idempotency contracts are implemented. | `assumed` | Safe default given unresolved policy gaps and no version field; offline write product policy remains open. |
| `SYNC-ERP-006` | Offline remote reads may use a previously authorized cache only with explicit stale state and tenant/permission invalidation. | `open` | No remote catalog cache or staleness policy exists. |
| `SYNC-ERP-007` | Product business lifecycle (`draft`, `active`, `archived`), connectivity, entity sync state and mutation state are independent. | `confirmed` | Existing product status does not represent sync state. |
| `SYNC-ERP-008` | Product/category changes use the API idempotency, optimistic-version and event contracts when approved; no last-write-wins for master data. | `assumed` | `API-ERP-004` remains assumed; actual fields and persistence are absent. |
| `SYNC-ERP-009` | Local fixture/demo data is never automatically uploaded or merged into an organization’s remote records. | `confirmed` | Current seeds are deterministic demo records and have no identity/migration protocol. |
| `SYNC-ERP-010` | Notes, Files, Activity, Tasks, Relations and Document Intelligence use their shared Platform sync/persistence boundaries. | `confirmed` | Products stores only references and must not create parallel queues. |
| `SYNC-ERP-011` | Adapter selection must ultimately be explicit runtime configuration, not inferred from organization ID shape. | `open` | Current proxy can route any non-UUID organization ID to local fixtures. |
| `SYNC-ERP-012` | Category synchronization and legacy `categoryKey` migration wait for category scope, identity and lifecycle decisions. | `confirmed` | No category entity/store/table or migration exists. |

## Current storage and adapter boundaries

| Concern | Current behavior | Sync implication |
|---|---|---|
| Local product storage | `localCatalogItemsStore` uses `createLocalStore` with namespace `rivera:loopdev:catalog:items`; local catalogs, offers, variants and prices have separate namespaces. | Browser-local deterministic fixtures and mutations are separate from remote records. Each tab keeps its own in-memory store cache; there is no storage-event reconciliation, sync queue or server reconciliation. |
| Local storage errors | `storage.get` catches errors and returns the seed; `storage.set` catches quota/storage errors and ignores them. | A mutation can appear successful in the current page while failing to survive reload. This is not durable-write evidence and must be fixed or surfaced before local-first production use. |
| Local/demo authority | Store contains seeded organization/workspace data and filters by organization/workspace in adapter code. Browser storage is user-controlled and not an authorization boundary. | Never trust local visibility for tenant security; no local data should be treated as server-authoritative. |
| Adapter selection | `catalogAdapter` selects local for any non-UUID organization ID and Supabase for UUIDs. | A real non-UUID ID could route to local data; selection must use explicit runtime configuration before migration/release. |
| Remote storage | Supabase adapter maps six `erp_*` tables for UUID-scoped organizations. | Remote operations are direct; there is no offline cache, local outbox or retry queue. |
| Remote failure | Supabase adapter maps authorization and service errors to `CatalogAdapterError`; it does not use local data as fallback. | Preserve visible errors; never convert a remote outage/denial into a local success. |
| Category storage | No local category store, remote category table or category adapter methods. Product has nullable `categoryKey` string. | Category hierarchy cannot sync until identity, scope and migration decisions are approved. |
| Shared Platform data | Shared collaboration/document capabilities have separate Platform adapters/contracts. | Keep their sync state and recovery in Platform; Products references entities but does not copy files or add upload queues. |

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

| Operation | Current local/demo behavior | Current remote behavior | Offline target proposal | State dimensions to show |
|---|---|---|---|---|
| List/get product | Reads localStorage-backed store/seed by synthetic organization | Queries Supabase for UUID organization | Allow last-authorized read-only snapshot only if a cache is later approved; clearly mark stale. | Business status + connectivity + entity `synced`/`local_only` |
| Search/filter product | In-memory filtering of local records | Server query filters organization/workspace/status; array response, no cursor | Read only from available snapshot; never imply completeness if stale/partial. | Connectivity and snapshot freshness, separate from business status |
| Create product | Writes local fixture store | Direct Supabase insert | Do not queue remote create until idempotency, class mapping, category rule and authorization are resolved. | Mutation `sending`/`acknowledged` or explicit `rejected`; current local-only remains marked |
| Update product | Writes local fixture store with timestamp | Direct Supabase update without version check | Do not queue by default; a future offline edit must retain base version and conflict on stale write. | Mutation `retry_wait` only for transient failures; `conflict` on version mismatch |
| Archive/restore | Local status patch; restore to draft is tested | Direct status update; no approved transition enforcement | Network required until transition policy and concurrency are implemented. | Business state separate from sync state |
| Delete product/offer/variant/price | Physically removes local record | Physical remote delete; database cascades may remove children | Not an offline operation; target design prefers archive and blocks hard delete until retention is approved. | Mutation rejected/blocked, not a local tombstone masquerading as success |
| Category list/create/move/archive | Not supported | Not supported | No local or remote category synchronization until category model and scope are approved. | Not applicable today; future state mirrors the independent dimensions above |
| Resolve product reference | Looks up local product/offer/variant IDs or key | Resolves remote references | Offline resolution is only from a valid tenant-partitioned snapshot and may be stale. | Return explicit stale/not-found state; never guess a legacy mapping |
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

## Migration and reconciliation plan

1. **Establish source of truth:** decide whether each organization uses
   Supabase or an approved local-first mode. Replace ID-shape adapter
   selection with explicit runtime configuration before enabling real tenant
   data.
2. **Inventory remote data:** snapshot the current catalog tables and scope;
   preserve stable IDs. Verify which migrations are deployed and do not infer
   production data from local fixtures.
3. **Validate tenant and references:** detect cross-organization/workspace
   parent links, required-but-null `catalog_id`, duplicate keys/SKUs and
   unsupported references. Produce a review report before any write.
4. **Map legacy product classes:** create a reviewed mapping for every
   `CatalogItem.type`; do not guess ambiguous values. Keep unmapped records in
   draft with their original type available for review, and require an
   assigned class before activation.
5. **Map categories:** review actual `category_key` values and obtain
   approved category tree/IDs. Do not synthesize parent-child relationships
   from strings. Backfill category IDs only after domain scope and FK policy
   are approved.
6. **Preserve commercial records:** validate offers, variants, books and
   entries; retain their IDs and references. Resolve physical delete/cascade
   and transaction snapshot policy before migration.
7. **Reconcile in dry run:** compare counts, IDs, foreign keys, uniqueness,
   status, scope and representative resolved CRM references. Require
   explicit mismatch reports and approval before cutover.
8. **Cut over without dual-write:** use a single authoritative write path.
   Keep an immutable pre-migration snapshot and a documented rollback that
   restores the prior contract without deleting newly created records.
9. **Verify after cutover:** re-run tenant isolation, CRUD/lifecycle,
   category/reference parity, mobile query semantics and recovery tests.
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
- Keep retry/resolve actions explicit and accessible on desktop and mobile;
  reconnecting must not silently overwrite server changes.

## Multiplatform and recovery tests

These are future implementation tests; this design phase ran no offline,
remote, browser-storage or mobile runtime tests.

| ID | Scenario | Expected result |
|---|---|---|
| `SYNC-TEST-001` | Reload after local demo edit with storage available. | Local demo value reloads, remains clearly local-only and is never uploaded. |
| `SYNC-TEST-002` | `localStorage` read/write failure or quota exhaustion. | No false saved/synced claim; explicit storage failure or recoverable warning is surfaced. |
| `SYNC-TEST-003` | Remote UUID tenant offline during list/read. | No local fixture fallback; return cached/stale data only if an approved cache exists, otherwise explicit unavailable state. |
| `SYNC-TEST-004` | Remote create/update loses connectivity after server commit. | Retry with the same idempotency key; return the original result without duplicate record. |
| `SYNC-TEST-005` | Replay after permission revocation or membership suspension. | Reauthorize on server, reject mutation, invalidate protected cache and present recovery guidance. |
| `SYNC-TEST-006` | Two clients update a product/category at the same version. | One succeeds; stale version becomes explicit conflict; no last-write-wins. |
| `SYNC-TEST-007` | Switch organization with pending mutation or cached list. | No cross-tenant replay/display; queue partition remains isolated and cache is invalidated. |
| `SYNC-TEST-008` | Reinstall/clear browser storage with local unsynced data. | No claim of guaranteed recovery; communicate or export local draft if that policy is approved. |
| `SYNC-TEST-009` | Retry validation, forbidden, scope or legacy-mapping error. | No automatic retry; mutation remains rejected until user/domain resolution. |
| `SYNC-TEST-010` | Retry transient network/rate-limit error. | Bounded backoff, same idempotency key, observable attempts and terminal surfaced failure after limit. |
| `SYNC-TEST-011` | Migrate legacy category/type rows with duplicates and unmapped values to product-base and SKU category ownership; detect duplicate organization-wide SKUs. | Dry run reports conflicts; no destructive coercion; IDs remain stable; category assignment ownership is explicit and duplicate SKUs are reported. |
| `SYNC-TEST-012` | Product references a Platform File/Note/Document Intelligence result after revocation. | Platform owns sync and authorization; Products does not expose cached protected content. |
| `SYNC-TEST-013` | Desktop/mobile/native adapters reconnect with same queued command. | Same business semantics and idempotency; only storage/lifecycle adaptation may differ. |

## Risks and open decisions

1. Choose product offline-read requirements and whether any remote mutations
   may be queued. Default is no queued remote writes until access/version/
   idempotency work is complete.
2. Replace ID-shape adapter routing before a real organization can use local
   fixtures by accident.
3. Decide whether localStorage is acceptable for demo drafts and what failure
   signal replaces the current swallowed storage errors.
4. Resolve legacy type/category mapping, treatment of old non-null workspace
   IDs and remote identity before migration; preserve the confirmed general
   product-base category plus independently assigned variant/SKU categories.
5. Resolve the RLS delete flaw and permission-key mismatch before remote
   writes or replay.
6. Define product/category versions, event durability and idempotency keys
   before mutation queues or event consumers.
7. Confirm offline behavior for desktop/mobile web and whether iOS/Android
   remain deferred.
8. Define data retention, cache invalidation, logout and reinstall recovery
   for sensitive commercial data.

## Handoff

**Status: `partial`.** The current split localStorage/Supabase behavior,
missing queue/version/category contracts, operation matrix, conflict policy,
migration steps and recovery tests are documented. There is no production
offline synchronization guarantee today. Safe follow-up is to reconcile
domain/access/API decisions before planning; do not implement a queue,
category migration or remote mutation replay from this draft alone.
