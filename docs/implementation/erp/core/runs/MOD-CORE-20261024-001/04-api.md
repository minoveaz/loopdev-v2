# Phase 04 — Products API contracts

## Attempt 11 — Revalidation after access and scope refresh

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:04-api` |
| Parent phase | `03-access` (attempt 11, completed) |
| Status | `completed` (analysis outcome: `partial`) |
| Environment | `feature/erp-core-capabilities`, HEAD `2e7faf367aa0b13a735492e9878390cc7e5a3621`; contract/evidence changes only |

Revalidated the Products command, DTO, error, concurrency and event
boundaries against access attempt 11, refreshed discovery and current
migrations. Cost remains a separate owner/admin-only contract and is excluded
from ordinary Product DTOs. The shared Files ownership boundary and
append-only audit semantics are approved; product-media metadata-table and
signed-preview enforcement, Products audit call sites and same-transaction
failure tests remain incomplete. The contract now distinguishes
`AUDIT_UNAVAILABLE` rollback/retry behavior and keeps remote mutations gated
on deployed RLS, audit atomicity and authorized legacy-data evidence.

## Identity

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:04-api` |
| Skill | `api-contracts` |
| Parent phase | `03-access` |
| Track | ERP Core |
| Issue(s) | #36 |
| Status | `completed` (analysis outcome: `partial`) |

## Objective

Define logical Products/category commands, queries, DTO boundaries, errors,
pagination, concurrency and event semantics for future local and remote
adapters, preserving approved product intent and legacy consumer compatibility.

## Inputs

- `discovery.md`, `design.md`, `domain-model.md` and `access-model.md`
- `delivery-ledger.json` and approved visual category-management source
- `CatalogAdapter`, catalog types, local/Supabase adapters and adapter tests
- ERP catalog migration and shared Platform `EntityRef` conventions
- `docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md`

## Actions

- Defined client-agnostic logical query/command contracts without selecting
  transport routes or infrastructure.
- Specified request/response fields, scope authority and validation boundaries.
- Documented terminal/retryable errors, pagination, idempotency, version
  conflicts, transaction boundaries and observability.
- Preserved legacy `catalog_item` references and surfaced adapter/schema
  mismatches as decisions rather than silently normalizing them.
- Recorded proposed product/category events and consumer/platform impact.

## Outputs

- `api-contracts.md`
- `runs/MOD-CORE-20261024-001/04-api.json`

## Acceptance criteria

- [x] Commands, queries, DTO boundaries and error semantics are documented.
- [x] Pagination, idempotency, versioning and transaction boundaries are
  explicit or marked open.
- [x] Events, consumers, retries, authorization and multiplatform behavior are
  covered.
- [x] Legacy contracts, scope blockers and unresolved domain/access decisions
  remain explicit.
- [x] No endpoint, event bus, database schema or production code was changed.

## Validation evidence

| Command or check | Result | Evidence path/link |
|---|---|---|
| `npm run test:delivery` | passed; 34 tests | CLI output |
| `npm run validate:delivery-ledgers` | passed; 8 ledgers checked | CLI output |
| `npm run validate:multiplatform` | passed | CLI output |
| `npm run validate:module-runs` | passed; 110 checkpoint files checked, 36 archived legacy records | CLI output |
| `git diff --check` | passed | CLI output |
| Manual contract/access review | passed; cost, Files and audit gates match access attempt 11 | `api-contracts.md`, `access-model.md` |

## Environment

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Branch | `feature/erp-core-capabilities` |
| HEAD | `cb2b35d30c87f7b3d4e42fbfcc1fe9390f624387` |
| Runtime URL | None |
| Runtime port | None |

## Decisions, failures and handoff

- Decisions: shared cost visibility and audit semantics are confirmed;
  the shared Files boundary is approved. Product-media metadata/signed-preview
  enforcement and cost precision/history remain open.
- Detected failure: current adapters/schema lack cost-specific permission
  enforcement, ordered/versioned media persistence and Products audit
  integration.
- Likely origin: prior implementation predates approved scope amendments;
  exact originating changes are not established.
- Next handoff: `05-sync`; define reauthorization, retry and conflict behavior
  without permitting remote mutation before the RLS and audit gates pass.

---

## Attempt 7 — Costs, physical attributes and ordered product media

### Identity

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:04-api` |
| Skill | `api-contracts` |
| Parent phase | `03-access` |
| Issue | #36 |
| Status | `completed` (analysis outcome: `partial`) |
| Branch / HEAD | `feature/erp-core-capabilities` / `2e7faf367aa0b13a735492e9878390cc7e5a3621` |
| Runtime | Not started; no runtime evidence was claimed |

### Objective and inputs

Extend the logical client-neutral API contracts for the approved Products
scope: cost per purchasable unit and its own currency, optional physical
attributes by managed unit, reusable product/SKU media, manual gallery order,
and owner/admin-only cost permissions. Preserve existing catalog references
and keep shared Files/audit contracts as Platform-owned dependencies.

### Decisions and contract outcomes

- Kept costs out of ordinary Product list/detail DTOs. Added separate
  `GetPurchaseCost`, `SetPurchaseCost` and `ClearPurchaseCost` contracts gated
  by `catalog.cost.read` / `catalog.cost.manage`, with the approved
  owner/admin-only default role grants.
- Represented cost amounts as canonical base-10 decimal strings in JSON to
  avoid binary floating-point loss; currency-specific scale remains open.
- Modeled physical values as optional `weightKg`, `lengthCm`, `widthCm` and
  `heightCm` on the Product or SKU that owns them; values do not inherit.
- Added logical media queries and commands for listing assets/assignments,
  registering a finalized Platform File, attach/reuse, alt-text update,
  detach, preview and atomic gallery reordering.
- Recorded the Product Owner's confirmed manual per-product/SKU image order
  as `DOM-ERP-031`; reorder requests carry the complete assignment set and
  expected versions, and reject concurrent changes without partial writes.
- Aligned the proposed media event with discovery's
  `catalog.product-media.changed` payload and excluded bytes, URLs and cost
  values.
- Added field-level errors, pagination, authorization, retry/idempotency,
  concurrency and desktop/mobile contract requirements.

### Open decisions, failures and risks

- Platform must approve generic Files upload/preview authorization, signed
  URL lifetime, cross-record access, tags ownership, renditions, retention
  and purge. Product APIs consume Files; they do not upload bytes or delete
  shared files directly.
- `catalog.cost.read/manage` are not yet present in Platform permission types,
  database grants, DTO filtering or cost RLS. Current SQL cost queries use
  broad `catalog.write`.
- Current media assignments have no position/version fields; code and
  migrations also permit physical-delete paths and replace shared Storage
  policies. No runtime or deployed-database state was tested.
- Cost history/source, ISO-currency decimal precision, physical activation
  guards, asset tags and durable event/outbox behavior remain open.
- Remote changes remain blocked on the approved audit contract, forward RLS
  migration and authorized data/deployment review.

### Validation and evidence

| Command or check | Result | Evidence |
|---|---|---|
| `npm run delivery:validate` | passed; 108 checkpoint files, 36 archived legacy records | CLI output |
| `npm run validate:delivery-ledgers` | passed; 8 ledgers | CLI output |
| `npm run validate:multiplatform` | passed | CLI output |
| `npm run validate:module-runs` | passed; 108 checkpoint files, 36 archived legacy records | CLI output |
| `npm run test:delivery` | passed; 30 tests | CLI output |
| `python3 inline ERP JSON/SVG/Markdown-link check` | passed; 13 JSON, 12 SVG, 20 Markdown files; all local links resolve | CLI output |
| `git diff --check` | passed | CLI output |

Evidence includes `api-contracts.md`,
`src/loopdev/domains/catalog/types.ts`,
`src/loopdev/domains/catalog/adapter/index.ts`,
`src/loopdev/domains/catalog/media/types.ts`,
`src/loopdev/domains/catalog/adapter/product-media-supabase.ts`,
`src/loopdev/domains/platform/types.ts`,
`supabase/migrations/20261024180000_erp_product_details_and_references.sql`,
`supabase/migrations/20261025100000_erp_product_media_library.sql` and the
approved domain/access checkpoints.

### Handoff

**Status: `partial`.** Logical contracts now cover costs, physical
attributes and manually ordered media. Continue to `05-sync` with cost
permission revalidation, Platform Files upload/preview and retention, atomic
gallery order, and audit/deployed-RLS blockers explicit. Do not implement API,
schema or production behavior from this helper phase alone.
