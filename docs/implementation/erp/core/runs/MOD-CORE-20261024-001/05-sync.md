# Phase 05 — Products synchronization design

## Attempt 11 — Revalidation after access and API refresh

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:05-sync` |
| Parent phase | `04-api` (attempt 11, completed) |
| Status | `completed` (analysis outcome: `partial`) |
| Environment | `feature/erp-core-capabilities`, HEAD `2e7faf367aa0b13a735492e9878390cc7e5a3621`; contract/evidence changes only |

Rechecked adapter selection and persistence behavior against the current
source. Catalog mode selection is already explicit and fails closed when
`VITE_CATALOG_ADAPTER_MODE` is unset; core catalog stores use strict
persistence, while Product-media asset/assignment stores still use the
best-effort default. Product media still uploads/creates shared Files and ERP
metadata in one adapter operation, generates remote signed URLs directly and
may remove a File during cleanup. These differ from the approved shared Files
boundary and separate finalized-file registration contract.

The shared Files boundary and append-only audit semantics are approved.
Detailed media table/preview/retention behavior, Products audit call sites
and same-transaction rollback evidence remain open. The sync policy stays
online-only for remote data, with no offline cache or mutation queue; no local
demo fallback, remote migration or production write was authorized.

## Identity

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:05-sync` |
| Skill | `sync-design` |
| Parent phase | `04-api` |
| Track | ERP Core |
| Issue(s) | #36 |
| Status | `completed` (analysis outcome: `partial`) |

## Objective

Record the current local/remote persistence boundary and define a safe
reconciliation, offline, retry, conflict and migration contract without
implementing storage or backend infrastructure.

## Inputs

- `discovery.md`, `domain-model.md`, `access-model.md` and `api-contracts.md`
- Catalog adapter interface, local stores, Supabase adapter and tests
- `src/lib/localStore.ts` and `src/lib/storage.ts`
- ERP catalog foundation migration
- `docs/03-platform/governance/MULTIPLATFORM_DELIVERY_CONTRACT.md`

## Actions

- Traced adapter selection, local persistence, seed fallback, remote routing
  and remote error behavior.
- Separated business, connectivity, entity-sync and mutation state.
- Defined operation/offline behavior, idempotent retry, conflict/recovery and
  tenant-change rules as proposals.
- Added a staged migration/reconciliation plan that preserves legacy IDs,
  leaves ambiguous product types in draft for review, and requires an approved
  mapping for legacy category references.
- Identified storage and routing risks; kept code and infrastructure unchanged.

## Outputs

- `sync-model.md`
- `runs/MOD-CORE-20261024-001/05-sync.json`

## Acceptance criteria

- [x] Local entities/storage boundaries and current gaps are evidenced.
- [x] Operation matrix distinguishes local/demo, remote and offline behavior.
- [x] Retry, idempotency, conflict, permission-change and tenant-change rules
  are defined or explicitly open.
- [x] Migration, rollback/reconciliation and multiplatform test cases are
  documented.
- [x] No production code, schema, queue or runtime data was changed.

## Validation evidence

| Command or check | Result | Evidence path/link |
|---|---|---|
| `npm run test:delivery` | passed; 34 tests | CLI output |
| `npm run validate:delivery-ledgers` | passed; 8 ledgers checked | CLI output |
| `npm run validate:multiplatform` | passed | CLI output |
| `npm run validate:module-runs` | passed; 110 checkpoint files checked, 36 archived legacy records | CLI output |
| `git diff --check` | passed | CLI output |
| Manual adapter/access review | passed; explicit mode, strict catalog persistence, best-effort media persistence, Files/audit gates distinguished | `sync-model.md`, current adapters, `access-model.md` |

## Environment

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Branch | `feature/erp-core-capabilities` |
| HEAD | `cb2b35d30c87f7b3d4e42fbfcc1fe9390f624387` |
| Runtime URL | None |
| Runtime port | None |

## Decisions, failures and handoff

- Decisions: explicit adapter mode, online-only remote behavior, no
  local-to-remote fixture merge, owner/admin-only cost handling and
  version/idempotency semantics are confirmed; specific Files lifecycle
  behavior remains open.
- Detected failure: Product-media local stores still suppress persistence
  failures; media adapters bypass finalized Files operations and may delete
  shared files during compensation; remote RLS and Products audit atomicity
  remain unverified/incomplete.
- Likely origin: existing Product-media implementation predates the approved
  shared Files lifecycle and current versioned Products contract.
- Next handoff: `06-plan` may sequence implementation work, but remote
  mutation, data migration and cutover remain gated on RLS, Files lifecycle,
  audit atomicity and authorized legacy-data evidence.

---

## Attempt 7 — Product costs, media and gallery synchronization

### Identity

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:05-sync` |
| Skill | `sync-design` |
| Parent phase | `04-api` |
| Track | ERP Core |
| Issue(s) | #36 |
| Status | `completed` (analysis outcome: `partial`) |

### Objective

Reconcile the existing synchronization design with the completed Products API
contracts for per-unit sensitive costs, reusable Platform Files and manually
ordered product/SKU galleries.

### Inputs and actions

- Compared discovery, domain, access and API contracts with the existing local
  and Supabase catalog/media adapters, localStorage helper and migrations.
- Distinguished observed ID-shape adapter selection and swallowed storage
  errors from the approved explicit runtime-mode and failure-reporting target.
- Defined costs as online-only, current-permission-checked data with no
  offline cache, queue or replay; permission changes invalidate the protected
  projection.
- Defined gallery reordering as an online, atomic full-set mutation with
  expected assignment versions, same-key retries and explicit refresh and
  user reconciliation on conflicts.
- Kept upload, preview, signed URL expiry and safe orphan cleanup in shared
  Platform Files; Products must not delete shared files as compensation.
- Added migration, recovery and cross-platform test scenarios for costs,
  ordering, upload failures, preview expiry and authorization changes.

### Outputs and decisions

- Updated `sync-model.md` with the operation/offline matrix, state model,
  retries, conflict policy, migration risks, and cost/media tests.
- Confirmed `SYNC-ERP-001`–`014`, `016` and `017`; kept
  `SYNC-ERP-015` open pending Platform's Files authorization, finalization,
  retention and orphan-recovery approval.
- Detected failure `SYNC-ERP-002`: the current media adapter bypasses the
  shared finalized Files boundary, can remove shared files during cleanup,
  lacks gallery order/version recovery, and the shared storage helper
  suppresses persistence errors.
- Likely origin: baseline Products media implementation predating the
  approved shared Files and versioned Products contract; confidence 9/10.

### Validation evidence

Validation commands and results are recorded in `05-sync.json`; no runtime,
offline, Supabase deployment or migration behavior was tested.

### Handoff

**Status: `partial`.** Proceed to `06-plan` with Platform Files/audit approvals,
cost permission/RLS work, deployed migration-state review and authorized
legacy-data dry run as explicit dependencies/blockers. No code or schema was
changed, and no offline queue or remote migration was authorized.
