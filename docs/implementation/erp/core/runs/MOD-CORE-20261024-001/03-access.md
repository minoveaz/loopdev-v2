# Phase 03 — Products access design

## Attempt 11 — Revalidation after refreshed discovery

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:03-access` |
| Parent phase | `02-domain` (attempt 11, completed) |
| Status | `completed` (analysis outcome: `partial`) |
| Environment | `feature/erp-core-capabilities`, HEAD `2e7faf367aa0b13a735492e9878390cc7e5a3621`; no code, schema or remote data changes |

Revalidated the role/action/scope matrix against current Product Owner
decisions, Platform authorization references, domain ownership and the current
migration chain. Existing semantics remain: organization membership is the
tenant boundary; `catalog.write` is the canonical general write permission;
purchase costs use separate owner/admin-only permissions; remote mutations
require the approved append-only Platform audit event in the same transaction.
The Product Owner-approved shared Files boundary is retained, with lifecycle
and acceptance gaps explicit.

The source audit distinguishes three layers that had been conflated:
product-media Storage paths have forward hardening and authenticated object
deletion is denied; the original product-media asset/assignment SQL still
uses `FOR ALL` and grants table `DELETE`; and the shared audit table/function
exist but Products mutation call sites and atomicity tests are missing. Full
deployed ERP schema/RLS state and authorized legacy-data review remain
unavailable. This revalidation performed no remote access or mutation.

| Validation | Result |
|---|---|
| `npm run test:delivery` | Passed: 34 tests |
| `npm run validate:delivery-ledgers` | Passed: 8 ledgers |
| `npm run validate:multiplatform` | Passed |

Open decisions and precise closure evidence are recorded in the
`Open decisions / gate` table in `access-model.md`. Remote Products writes
remain blocked.

## Identity

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:03-access` |
| Skill | `access-design` |
| Parent phase | `02-domain` |
| Track | ERP Core |
| Issue(s) | #36 |
| Status | `completed` (analysis outcome: `partial`) |

## Objective

Define Products roles, actions and scopes; reuse Platform authorization
contracts; identify current local/remote policy mismatches and required
isolation tests without implementing policies or application code.

## Inputs

- `discovery.md`, `domain-model.md`, `design.md` and `delivery-ledger.json`
- `docs/03-platform/backend/MULTI_TENANCY_STRATEGY.md`
- `docs/03-platform/backend/DATABASE_SECURITY_RLS.md`
- Platform permissions, membership lifecycle and workspace migrations
- ERP catalog local/Supabase adapters, migration and adapter tests
- `docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md`

## Actions

- Mapped existing organization roles to the catalog read/manage permissions,
  explicitly distinguishing baseline grants from target assumptions.
- Defined organization/workspace scope, assignment, sensitive-data, audit and
  shared Platform inheritance rules.
- Inspected the generated ERP RLS policy and recorded the read-only delete
  gap, with deployment status left unverified.
- Specified RLS requirements and tests for deep links, revoked permissions,
  cross-tenant references, bulk actions, exports, attachments and offline
  replay.
- Kept all implementation and policy changes out of scope.

## Outputs

- `access-model.md`
- `runs/MOD-CORE-20261024-001/03-access.json`

## Acceptance criteria

- [x] Role/action/scope matrix and rule statuses are documented.
- [x] RLS, audit, sensitive-data and shared Platform requirements are explicit.
- [x] Required authorization and tenant-isolation tests are enumerated.
- [x] Existing gaps and deployment uncertainty are recorded without claiming
  runtime verification.
- [x] No production code or database policy was changed.

## Validation evidence

| Command or check | Result | Evidence path/link |
|---|---|---|
| `npm run test:delivery` | passed; 34 tests | CLI output |
| `npm run validate:delivery-ledgers` | passed; 8 ledgers checked | CLI output |
| `npm run validate:multiplatform` | passed | CLI output |
| `npm run validate:module-runs` | passed; 110 checkpoint files checked, 36 archived legacy records | CLI output |
| `git diff --check` | passed | CLI output |
| Manual source/evidence review | passed; current Storage, media-table, audit and deployed-state gaps distinguished | `access-model.md`, current migration chain |

## Environment

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Branch | `feature/erp-core-capabilities` |
| HEAD | `cb2b35d30c87f7b3d4e42fbfcc1fe9390f624387` |
| Runtime URL | None |
| Runtime port | None |

## Decisions, failures and handoff

- Decisions: `ACC-ERP-001`, `002`, `004`, `009` and `010` confirmed;
  `ACC-ERP-003`, `005` and `007` assumed; `ACC-ERP-006` and `008` open.
- Detected failure: the current catalog migration's `FOR ALL` policy uses
  `catalog.read` in `USING`; read-only deletion is possible by policy
  semantics. Deployment state is unverified.
- Likely origin: `supabase/migrations/20260928160000_erp_catalog_foundation.sql`.
- Next handoff: `04-api`; do not permit implementation or remote mutation
  until the RLS gap and permission-key mismatch are resolved.

---

## Attempt 7 — Cost permissions and reusable product media

### Identity

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:03-access` |
| Skill | `access-design` |
| Parent phase | `02-domain` |
| Issue | #36 |
| Status | `completed` (access outcome: `partial`) |
| Branch / HEAD | `feature/erp-core-capabilities` / `2e7faf367aa0b13a735492e9878390cc7e5a3621` |
| Runtime | Not started; no runtime evidence was claimed |
| Validation timestamp | `2026-10-25T10:45:54Z` |

### Objective and inputs

Reconcile the access model with approved per-unit purchase costs, separate
`catalog.cost.read` / `catalog.cost.manage` permissions, the Product media
scope, the shared Files boundary, organization-wide Products and the active
catalog/RLS baseline.

### Decisions and access outcomes

- Confirmed that only `owner` and `admin` receive both cost permissions by
  default; `agent` and `viewer` receive neither. Cost visibility is not
  implied by `catalog.read`, and cost mutation is not implied by
  `catalog.write`.
- Preserved `catalog.write` as the canonical general Products write
  permission; the deployed-migration state and old `catalog.manage` mapping
  remain unverified and require a forward migration.
- Confirmed that organization membership and permission checks govern all
  workspaces; workspace-specific Products authorization is outside this
  release.
- Separated access to product/SKU assignments from access to shared Platform
  Files and Storage. Association actions use catalog permissions; file bytes,
  upload, preview and purge must follow the Platform Files contract. Current
  Storage policy replacement is not accepted as an approved shared contract.
- Recorded that cost reads/writes must be field-level, tenant-checked,
  reauthorized during direct queries and background replay, and excluded from
  ordinary product projections, logs, activity and exports.
- Added authorization test cases for owner/admin cost access, agent/viewer
  denial, list/detail/search leaks, stale caches, revoked membership, cross-
  organization parent links, media signed URLs and delete prevention.

### Open decisions, failures and risks

- Platform must approve how shared Files authorizes product-media upload,
  preview, assignment, retention and purge. The existing Files metadata RLS
  is active-membership based and has no `files.*` permission key; no ERP-local
  replacement is proposed.
- The current cost RLS uses broad `catalog.write`, and the new cost keys do
  not yet exist in Platform's type or permission catalog.
- The product-media migration uses `FOR ALL` write policies and replaces
  shared Storage policies; catalog writers can reach delete paths. Deployment
  status is unverified.
- The foundation migration's `FOR ALL` policy still gives `catalog.read`
  users a delete path by `USING` semantics. Remote writes remain blocked
  pending forward policy/audit migration and deployed-state verification.
- Platform has not approved an append-only audit contract; legacy data dry
  run and schema deployment state remain unavailable.

### Validation and evidence

| Command or check | Result | Evidence |
|---|---|---|
| `npm run delivery:validate` | Passed | 108 checkpoint files checked; 36 archived legacy records |
| `npm run validate:delivery-ledgers` | Passed | 8 ledgers checked |
| `npm run validate:multiplatform` | Passed | Multiplatform delivery validation passed |
| `npm run validate:module-runs` | Passed | 108 checkpoint files checked; 36 archived legacy records |
| `npm run test:delivery` | Passed | 30 tests passed |
| Inline Python ERP JSON/SVG/Markdown-link check | Passed | 10 run JSON files, 12 wireframes, 20 Markdown documents |
| `git diff --check` | Passed | No whitespace errors |

Source evidence includes `src/loopdev/domains/platform/types.ts`,
`src/loopdev/domains/catalog/adapter/local.ts`,
`src/loopdev/domains/catalog/adapter/product-media-supabase.ts`,
`supabase/migrations/20260928160000_erp_catalog_foundation.sql`,
`supabase/migrations/20261024180000_erp_product_details_and_references.sql`,
`supabase/migrations/20261025100000_erp_product_media_library.sql`, and the
Platform Files metadata/Storage migrations.

### Handoff

**Status: `partial`.** The access decisions for costs and Products are
specified; shared Files authorization, audit approval, deployed RLS state and
legacy-data review remain explicit blockers. Continue to API contract design
with cost fields explicitly permission-gated and remote write behavior
disabled until Platform's cross-cutting contracts are approved.
