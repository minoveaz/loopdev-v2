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
| `SYNC-ERP-002` | Local catalog data is available only in an explicitly selected demo mode; browser storage is not a secure or remote-synchronized source of truth, and storage failures must be surfaced rather than reported as saves. | `confirmed` | The user approved a separate local demo mode; current shared storage still hides failures and must be corrected for this adapter. |
| `SYNC-ERP-003` | Remote Supabase reads/writes do not fall back to local fixtures when the remote service is unavailable. | `confirmed` | UUID-scoped calls use `supabaseCatalogAdapter`; errors are surfaced. |
| `SYNC-ERP-004` | No offline queue or remote mutation replay exists for Products today. | `confirmed` | No queue, idempotency or version contract in the current catalog adapter/schema. |
| `SYNC-ERP-005` | Remote Products reads and mutations require an online connection and authoritative server response; no offline write queue is provided in this release. | `confirmed` | User approved remote online-only behavior; an offline state is an explicit unavailable/error state, not a cached success. |
| `SYNC-ERP-006` | Remote Products data is not cached for offline reads in this release. | `confirmed` | User approved no offline cache; local demo data is a separate runtime mode and is never a remote fallback. |
| `SYNC-ERP-007` | Product business lifecycle (`draft`, `active`, `archived`), connectivity, entity sync state and mutation state are independent. | `confirmed` | Existing product status does not represent sync state. |
| `SYNC-ERP-008` | Product/category mutations require `expectedVersion`; stale updates return a conflict. Create retries use an idempotency key; master data never uses last-write-wins. | `confirmed` | User approved remote writes with shared audit; this contract is required before implementation and is not present in current schema. |
| `SYNC-ERP-009` | Local fixture/demo data is never automatically uploaded or merged into an organization’s remote records. | `confirmed` | Current seeds are deterministic demo records and have no identity/migration protocol. |
| `SYNC-ERP-010` | Notes, Files, Activity, Tasks, Relations and Document Intelligence use their shared Platform sync/persistence boundaries. | `confirmed` | Products stores only references and must not create parallel queues. |
| `SYNC-ERP-011` | Adapter selection is explicit runtime configuration (`local_demo` or `supabase`), never inferred from organization ID shape; missing/invalid configuration fails closed. | `confirmed` | User approved a local demo mode separate from Supabase; current proxy uses ID shape and must be replaced. |
| `SYNC-ERP-012` | Category synchronization and legacy `categoryKey` migration wait for category scope, identity and lifecycle decisions. | `confirmed` | No category entity/store/table or migration exists. |

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
| Local storage errors | `storage.get` catches errors and returns the seed; `storage.set` catches quota/storage errors and ignores them. | The demo adapter must surface read/write failures and never report a failed persistence operation as saved. This is not a production offline store. |
| Local/demo authority | Store contains seeded organization/workspace data and filters by organization/workspace in adapter code. Browser storage is user-controlled and not an authorization boundary. | Never trust local visibility for tenant security; no local data should be treated as server-authoritative. |
| Adapter selection | `catalogAdapter` selects local for any non-UUID organization ID and Supabase for UUIDs. | A real non-UUID ID could route to local data; replace with explicit `local_demo`/`supabase` configuration and fail closed for missing or invalid mode. |
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
| List/get product | Reads localStorage-backed store/seed only in explicit `local_demo` mode | Online Supabase query only | No remote cache; offline returns explicit unavailable state. | Business status + connectivity + entity `synced`/`local_only` |
| Search/filter product | In-memory filtering only in explicit demo mode | Bounded online query with stable cursor | No remote cache; never present demo fixtures as a remote fallback. | Connectivity and request state, separate from business status |
| Create product | Writes demo fixture store and surfaces storage failure | Online command with permission, version/idempotency and audit enforcement | Remote mutation is disabled while offline; no queue. | Mutation `sending`/`acknowledged` or explicit `rejected`; no optimistic success |
| Update product | Writes demo fixture store and surfaces storage failure | Online conditional update with `expectedVersion` | Remote mutation is disabled while offline; no queue. | Version conflict is explicit; no last-write-wins |
| Archive/restore | Legacy local status patch; target restore always returns product/SKU to `draft` | Direct status update; target transition enforcement and versioning are missing | Online acknowledgement required; no queue or optimistic success. | Preserve business state separately from connectivity and mutation state |
| Delete product/offer/variant/price | Legacy adapter physically removes local records | Legacy adapter issues physical delete; SQL cascades may remove children | No hard-delete operation in this release; archive/restore only on both adapters. | Not available |
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
   entries; retain their IDs and references. Resolve physical delete/cascade
   and transaction snapshot policy before migration.
8. **Reconcile in dry run:** compare counts, IDs, foreign keys, uniqueness,
   status, scope and representative resolved CRM references. Require
   explicit mismatch reports and approval before cutover.
9. **Cut over without dual-write:** use a single authoritative write path.
   Keep an immutable pre-migration snapshot and a documented rollback that
   restores the prior contract without deleting newly created records.
10. **Verify after cutover:** re-run tenant isolation, CRUD/lifecycle,
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

1. Platform owner must approve the shared audit contract before remote
   mutations are enabled.
2. The forward permission/RLS migration must be applied and verified in the
   deployed database; this review could not authenticate to the linked
   Supabase project.
3. Production category/workspace data must pass the dry-run mapping and
   visibility review before migration.
4. Remote mutation implementation must add expected-version checks,
   idempotency and audit atomically; none exists in the current adapter/schema.

## Handoff

**Status: `partial`.** The first-release sync policy is explicit: remote
Products are online-only with no offline cache or mutation queue; local demo
data is selected explicitly and is never a remote fallback. Runtime mode,
storage error handling, versions, idempotency, audit, RLS and production
migration remain implementation tasks. Do not enable remote writes until the
forward migrations are applied and verified, and do not migrate categories or
workspace scope before the approved dry run.
