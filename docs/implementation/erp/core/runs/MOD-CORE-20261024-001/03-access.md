# Phase 03 — Products access design

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
| `npm run delivery:validate` | passed; 102 checkpoint files checked | CLI output |
| `npm run validate:delivery-ledgers` | passed; 8 ledgers checked | CLI output |
| `npm run validate:multiplatform` | passed | CLI output |
| `npm run test:delivery` | passed; 27 tests | CLI output |
| Python ERP JSON/SVG/Markdown-link check | passed; 7 JSON, 5 SVG, all local links resolve | CLI output |

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
