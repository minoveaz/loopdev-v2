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

Implement LoopDev-generated numeric, immutable product and variant keys/SKUs,
and the approved product/variant media experience. This implementation does
not imply that the full module plan, access model or release gates are approved.

## Inputs

- Approved task `ERP-IDENTIFIERS-001` and its task-scoped approval in
  `delivery-ledger.json`.
- Existing product, variant, local-adapter, Supabase-adapter and migration
  contracts.
- Approved product/variant media scope in `CR-ERP-PRODUCT-MEDIA-001`.
- Current checkout and working tree recorded below.

## Actions

- Removed user-supplied key/SKU fields from product and variant create/update
  contracts; reject runtime attempts to patch either identifier.
- Generate organization-scoped numeric identifiers in the local adapter;
  omit client-supplied identifiers from Supabase writes so database triggers
  assign them.
- Preserve legacy CRM product-key references through the migration's
  `loopdevIdentifierMigration.previousKey` metadata while keeping generated
  numeric keys as the current product identifiers.
- Added a migration for stable UUID generation, numeric internal keys, numeric
  LoopDev SKUs, organization-level key uniqueness and parent-SKU handling.
- Updated product/variant forms, fixtures, translations and focused tests to
  show generated identifiers as read-only.
- Added product and variant media adapters, a gallery with uncropped square
  previews, and persistent Supabase Storage metadata/associations.

## Outputs

- Product and variant adapter, UI, fixture, translation and test changes.
- Product media adapter, gallery page, product form preview and tests.
- Catalog key-compatibility lookup for local and Supabase adapters, plus CRM
  regression coverage for migrated legacy keys.
- Identifier migrations, including
  `supabase/migrations/20261025000000_erp_system_generated_identifiers.sql`.
- Media migration:
  `supabase/migrations/20261025100000_erp_product_media_library.sql`.
- Both migrations were applied to the linked Supabase project and verified
  against remote migration history. The overall module run remains blocked
  pending product-media visual evidence, access/deployment reconciliation and
  formal plan/build/verification gates.

## Acceptance criteria

- [x] UUIDs remain technical identifiers; numeric keys and SKUs are generated
      and direct users cannot edit them.
- [x] Product, variant and media adapter/component behavior passes focused
      tests.
- [x] The identifier and media migrations were applied remotely and the
      linked migration history was verified.
- [ ] Local migration lint passes; local PostgreSQL was unavailable.
- [ ] Authenticated desktop and mobile-web journeys are verified.
- [ ] Formal 06-plan/07-build checkpoints are accepted by the delivery state
      machine.

## Validation evidence

| Command or check | Result | Evidence path/link |
|---|---|---|
| `npm test -- src/test/catalog/catalog-adapter.test.ts src/test/erp/product-record-pages.test.tsx src/test/erp/product-sku-manager.test.tsx src/test/erp/product-list-table.test.tsx src/test/erp/product-media.test.tsx` | Passed: 5 files, 30 tests | Focused test output |
| `npm run typecheck` | Passed | Application and Node TypeScript checks |
| `npm run build` | Passed; large-chunk warning remains | Build output |
| `npm run i18n:check` | Passed: no visible-text candidates | i18n checker |
| `npx eslint .` | Passed | ESLint |
| `npm run validate:delivery-ledgers` | Passed: 8 ledgers checked | Ledger validator |
| `supabase db lint --local` | Blocked: connection refused at `127.0.0.1:54322` | Local Postgres is not running |
| `supabase db push` and `supabase migration list` | Passed: pending migrations applied and remote/local history aligned | Linked Supabase project |
| `npm run validate:module-runs` | Passed: 107 checkpoint files checked after invalidating checkpoints that predate the media scope | Module-run traceability validator |
| `npm run test:delivery` | Passed: 30 tests | Delivery tests |
| `npm run test:quality` | Passed: 100 files, 555 tests | Full non-visual CI test suite |
| `npm test -- src/test/crm/opportunities/opportunities-page.test.tsx src/test/crm/pipeline/catalog-reference.test.ts src/test/catalog/catalog-adapter.test.ts` | Passed: 3 files, 14 tests | CRM compatibility regression tests |
| `npm run validate:delivery-evidence` | Passed: 0 evidence files checked | No registered phase evidence files |
| `http://localhost:8080/app/erp/products/new` | HTTP 200 only | SPA response; no authenticated interaction evidence |

## Environment

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Checkout type | branch |
| Branch | `feature/erp-core-capabilities` |
| HEAD | `cab0863351c652d0892dc61a5acbbda4abb02c95` |
| Working tree | Modified with the legacy-key compatibility fix and regression tests; validated locally before the follow-up commit |
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
- Follow-up regression found by PR CI: CRM callers still send the previous
  string product key after numeric-key migration. The compatibility alias is
  now read from migration metadata by both catalog adapters and covered by
  local CRM/catalog tests.
- Next handoff: reconcile invalidated run checkpoints, add visual evidence for
  the approved product-media scope, and resolve access/legacy-data blockers
  before marking this task done or claiming module/release readiness.
