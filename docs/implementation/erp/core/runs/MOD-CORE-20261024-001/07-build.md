# Phase 07 — Build: generated product identifiers

## Identity

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:07-build` |
| Skill | `module-build` |
| Parent phase | `06-plan` is absent; the run remains blocked before planning |
| Track | `ERP-IDENTIFIERS-001` |
| Issue(s) | `minoveaz/loopdev-v2#37` |
| Status | `blocked` |

## Objective

Implement LoopDev-generated, numeric, immutable product and variant keys/SKUs
for the explicitly approved task, without approving unrelated ERP scope or
remote rollout.

## Inputs

- Approved task `ERP-IDENTIFIERS-001` and its task-scoped approval in
  `delivery-ledger.json`.
- Existing product, variant, local-adapter, Supabase-adapter and migration
  contracts.
- Current checkout and working tree recorded below.

## Actions

- Removed user-supplied key/SKU fields from product and variant create/update
  contracts; reject runtime attempts to patch either identifier.
- Generate organization-scoped numeric identifiers in the local adapter;
  omit client-supplied identifiers from Supabase writes so database triggers
  assign them.
- Added a migration for stable UUID generation, numeric internal keys, numeric
  LoopDev SKUs, organization-level key uniqueness and parent-SKU handling.
- Updated product/variant forms, fixtures, translations and focused tests to
  show generated identifiers as read-only.

## Outputs

- Product and variant adapter, UI, fixture, translation and test changes.
- `supabase/migrations/20261025000000_erp_system_generated_identifiers.sql`.
- The task remains `blocked` pending migration validation and phase-state
  reconciliation; no database migration was applied remotely.

## Acceptance criteria

- [x] UUIDs remain technical identifiers; numeric keys and SKUs are generated
      and direct users cannot edit them.
- [x] Local adapter and form behavior pass focused adapter/component tests.
- [ ] Migration lint and PostgreSQL execution pass.
- [ ] Authenticated desktop and mobile-web journeys are verified.
- [ ] Formal 06-plan/07-build checkpoints are accepted by the delivery state
      machine.

## Validation evidence

| Command or check | Result | Evidence path/link |
|---|---|---|
| `npm test -- src/test/catalog/catalog-adapter.test.ts src/test/erp/product-record-pages.test.tsx src/test/erp/product-sku-manager.test.tsx src/test/erp/product-list-table.test.tsx` | Passed: 4 files, 25 tests | Focused test output |
| `npm run typecheck` | Passed | Application and Node TypeScript checks |
| `npm run build` | Passed; large-chunk warning remains | Build output |
| `npm run i18n:check` | Passed: no visible-text candidates | i18n checker |
| `npm run validate:delivery-ledgers` | Passed: 8 ledgers checked | Ledger validator |
| `supabase db lint --local` | Blocked: connection refused at `127.0.0.1:54322` | Local Postgres is not running |
| `npm run validate:module-runs` | Failed on 7 existing run-state errors | Invalid visual-design checkpoint and unapproved visual-design gate in completed phases |
| `npm run validate:delivery-evidence` | Passed: 0 evidence files checked | No registered phase evidence files |
| `http://localhost:8080/app/erp/products/new` | HTTP 200 only | SPA response; no authenticated interaction evidence |

## Environment

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Checkout type | branch |
| Branch | `feature/erp-core-capabilities` |
| HEAD | `2fe79082039b24eb771879dad3ca79a59dba6d21` |
| Working tree | Modified; includes this task and pre-existing ERP changes |
| Runtime URL | `http://localhost:8080/app/erp/products/new` |
| Runtime port | `8080` |

## Decisions, failures and handoff

- Decisions: task-scoped approval authorizes only automatic identifiers; the
  trusted future external-SKU integration and remote rollout remain out of
  scope.
- Detected failure: the migration could not be linted because local PostgreSQL
  is unavailable. The module run also has no 06-plan checkpoint and its current
  state-machine validation fails on existing visual-design evidence/gate
  inconsistencies.
- Likely origin: local database service is stopped; the run's visual-design
  addendum and approval state predate this task's scoped implementation.
- Next handoff: start local Supabase/PostgreSQL and validate the migration;
  reconcile the visual-design approval and 06-plan checkpoint before marking
  this task done or claiming module/release readiness.
