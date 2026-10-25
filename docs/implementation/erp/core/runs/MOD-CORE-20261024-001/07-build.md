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
- [x] Local migration lint passes against the configured Docker Supabase database.
- [ ] Authenticated desktop and mobile-web journeys are verified.
- [x] The approved 06-plan checkpoint and current build run pass delivery
      traceability validation; module/release verification remains incomplete.

## Validation evidence

| Command or check | Result | Evidence path/link |
|---|---|---|
| `npm test -- src/test/catalog/catalog-adapter.test.ts src/test/erp/product-record-pages.test.tsx src/test/erp/product-sku-manager.test.tsx src/test/erp/product-list-table.test.tsx src/test/erp/product-media.test.tsx` | Passed: 5 files, 30 tests | Focused test output |
| `npm run typecheck` | Passed | Application and Node TypeScript checks |
| `npm run build` | Passed; large-chunk warning remains | Build output |
| `npm run i18n:check` | Passed: no visible-text candidates | i18n checker |
| `npx eslint .` | Passed | ESLint |
| `npm run validate:delivery-ledgers` | Passed: 8 ledgers checked | Ledger validator |
| `supabase db lint --local` | Passed: no schema errors | Configured Docker Supabase database at `127.0.0.1:54322` |
| `npm test -- src/test/catalog/catalog-adapter.test.ts src/test/erp/product-record-pages.test.tsx src/test/erp/product-sku-manager.test.tsx src/test/erp/product-list-table.test.tsx` | Passed: 4 files, 26 tests | Focused identifier rerun |
| `npm run typecheck` | Passed | Application and Node TypeScript checks |
| `npm run build` | Passed; existing large-chunk warning remains | Production build output |
| `npm run i18n:check` | Passed: no visible-text candidates | i18n checker |
| `supabase db push` and `supabase migration list` | Passed: pending migrations applied and remote/local history aligned | Linked Supabase project |
| `npm run validate:module-runs` | Passed: 107 checkpoint files checked after invalidating checkpoints that predate the media scope | Module-run traceability validator |
| `npm run test:delivery` | Passed: 30 tests | Delivery tests |
| `npm run test:quality` | Passed: 100 files, 555 tests | Full non-visual CI test suite; rerun for refactor-safety audit |
| `npm test -- src/test/crm/opportunities/opportunities-page.test.tsx src/test/crm/pipeline/catalog-reference.test.ts src/test/catalog/catalog-adapter.test.ts` | Passed: 3 files, 14 tests | CRM compatibility regression tests |
| `npm run validate:delivery-evidence` | Passed: 0 evidence files checked | No registered phase evidence files |
| `http://localhost:8080/app/erp/products` | Unauthenticated: redirects to login. Authenticated: renders product list; legacy route redirects to canonical; Overview navigation, back and refresh work. | Local browser runtime; 440x775 viewport; no product data was mutated. Mobile lacks the canonical route and remains blocked. |

## Environment

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Checkout type | branch |
| Branch | `feature/erp-core-capabilities` |
| HEAD | `2e7faf367aa0b13a735492e9878390cc7e5a3621` |
| Working tree | Contains pre-existing ERP planning/traceability, delivery-state-machine, Files policy migration and SQL test changes; no product runtime changes or remote writes were made in this continuation |
| Runtime URL | `http://localhost:8080/app/erp/products` |
| Runtime port | `8080` |

## Decisions, failures and handoff

- Decisions: task-scoped approval authorizes only automatic identifiers; the
  trusted future external-SKU integration and remote rollout remain out of
  scope.
- Platform/DB owner @loopdev-io approved the shared Products audit semantics:
  allowlisted redacted metadata, same-transaction persistence with mutation
  rollback on audit failure, six months active retention and restricted archive
  only for documented exceptions. This is semantic approval only; implementation
  and atomicity tests remain gated by the security audit.
- Platform/DB owner @loopdev-io also approved a database-enforced global and
  per-organization write kill switch (default false) and immutable pre-cutover
  snapshot with forward-only recovery that preserves post-cutover writes.
  These are design approvals only; the control, migrations and recovery
  rehearsal remain unimplemented.
- Detected failure: the first local migration lint attempt could not connect
  because PostgreSQL was stopped; after Docker became available, the configured
  local lint passed with no schema errors. The desktop route guard and
  authenticated navigation were verified in the real local browser. The mobile
  Products route is absent. The owner-approved recovery and write-control
  designs remain to be implemented and tested.
- Likely origin: Docker was stopped during the first lint attempt; mobile has
  not implemented the canonical Products route, and the approved Platform/DB
  safety controls have not yet been built or rehearsed.
- Follow-up regression found by PR CI: CRM callers still send the previous
  string product key after numeric-key migration. The compatibility alias is
  now read from migration metadata by both catalog adapters and covered by
  local CRM/catalog tests.
- Next handoff: complete local tenant/cost/RLS and audit atomicity evidence,
  implement and rehearse the approved recovery/write controls, and deliver the
  mobile Products route after its dependencies. Keep remote Products writes
  disabled until security, deployed-state, legacy-data and runtime gates pass.

## Attempt 9 continuation — `ADAPTER-MODE-001`

This continuation implements only the ready task whose dependencies are
complete. The other ledger tasks remain gated by their own dependencies or
blockers; starting this independent task does not resolve the broader
`07-build` blockers.

### Actions and outputs

- Replaced organization-ID-shape inference with explicit
  `VITE_CATALOG_ADAPTER_MODE=local_demo|supabase` selection.
- Missing/invalid configuration now rejects Catalog adapter calls. A Supabase
  failure is propagated and never retried against local fixtures.
- Added strict persistence mode for Catalog local stores only. Local storage
  read, parse, serialization and write failures surface; a failed write does
  not update the in-memory cache or notify subscribers. Other `createLocalStore`
  consumers keep best-effort behavior.
- Added explicit-mode, no-fallback, local persistence failure and
  best-effort-compatibility regressions.
- No remote Supabase command, migration, write, deployment or data mutation was
  performed. No UI route or mobile operation was changed or claimed as
  verified.

Changed files:

- `src/loopdev/domains/catalog/adapter/index.ts`
- `src/loopdev/domains/catalog/data/localCatalog.ts`
- `src/lib/storage.ts`
- `src/lib/localStore.ts`
- `src/vite-env.d.ts`
- `src/test/setup.ts`
- `src/test/catalog/catalog-adapter.test.ts`
- `docs/implementation/erp/core/platform-evidence-matrix.md`
- `docs/implementation/erp/core/runs/MOD-CORE-20261024-001/07-build.md`

### Task acceptance

- [x] Only explicitly configured `local_demo` or `supabase` modes are selected;
      missing/invalid configuration fails closed.
- [x] Remote failures do not fall back to local fixtures.
- [x] Catalog local read/write persistence failures surface; unrelated
      best-effort local-store behavior remains unchanged.

### Validation evidence

| Command or check | Result | Evidence path/link |
|---|---|---|
| `npm test -- src/test/catalog/catalog-adapter.test.ts src/test/crm/customer-products-adapter.test.ts src/test/crm/pipeline/catalog-reference.test.ts src/test/crm/opportunities/opportunities-page.test.tsx` | Passed: 4 files, 20 tests | Focused output from this checkout |
| `npm run typecheck` | Passed | Application and Node TypeScript checks |
| `npx eslint src/lib/storage.ts src/lib/localStore.ts src/loopdev/domains/catalog/data/localCatalog.ts src/loopdev/domains/catalog/adapter/index.ts src/vite-env.d.ts src/test/setup.ts src/test/catalog/catalog-adapter.test.ts` | Passed | Focused lint output |
| `npm run test:quality` | Passed: 100 files, 559 tests | Full non-visual quality suite |
| `npm run build` | Passed; pre-existing large-chunk warning remains | Production build output |
| `npm run validate:delivery-ledgers` | Passed: 8 ledgers | Before task status/evidence update; rerun after update |
| `npm run validate:module-runs` | Passed: 110 checkpoint files | Checkpoint schema validation |
| `npm run validate:multiplatform` | Passed | Structural scope/evidence validation only |

### Environment and handoff

| Field | Value |
|---|---|
| Repository | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Checkout / branch | In-place checkout / `feature/erp-core-capabilities` |
| HEAD | `2e7faf367aa0b13a735492e9878390cc7e5a3621` |
| Working tree | Modified pre-existing delivery work plus the task files above |
| Runtime URL / port | `http://localhost:8080/app/erp/products` / `8080`; no runtime journey performed for this adapter-only task |
| Platform scope | `desktop_web`, `mobile_web`; native iOS/Android remain deferred |

Task `ADAPTER-MODE-001` has validation evidence and is complete. The build
phase remains blocked: the security audit, complete mobile route/operation
evidence, deployed Products RLS verification, authorized legacy-data review,
and shared typography decision are not cleared. Preserve the remote-write
restriction and hand off only after a listed task's dependencies are complete.

### Attempt 10 workflow recovery

The delivery CLI detected changed `scope`, `design`, `code` and `tests`
fingerprints during selective blocker resolution. It invalidated the earlier
phase checkpoints and the design, visual-design, plan, verification and
release approvals. Attempt 10 is therefore blocked pending revalidation of
the canonical artifacts and the required gate approvals. This is a workflow
fingerprint/approval gate, not a failed adapter implementation or test. No
additional task was started, and the prior approvals were not re-recorded.

The final `npm run validate:module-runs` rerun detected six inconsistent
checkpoint/gate records: completed visual-design and specialized-analysis/
plan checkpoints still require the now-pending design or visual-design
approvals. Detected by delivery traceability validation (`BUILD-003`); likely
origin is the attempt-10 fingerprint invalidation, not the Catalog adapter
change. The run remains blocked until those artifacts and gates are reconciled.
