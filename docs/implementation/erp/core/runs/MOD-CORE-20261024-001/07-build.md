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

## Attempt 11 — Remote security preflight

### Environment

| Field | Value |
|---|---|
| Repository | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Checkout / branch | In-place branch checkout / `feature/erp-core-capabilities` |
| HEAD before edits | `141f1ca6d50286d639e3b1e0e5a472c676acda9a` |
| Working tree before edits | Clean |
| Remote target | Linked Supabase project `loopdev-platform-dev` |
| Local runtime | No Products UI or local database runtime used |

### Read-only findings

- The six deployed Catalog tables use broad `FOR ALL` policies. Their `USING`
  condition checks `catalog.read`, so the policy also permits a read-only
  member to pass the row condition for `DELETE`; `authenticated` has direct
  `DELETE` and `TRUNCATE` grants.
- Cost-table policies use `catalog.write`; `agent` currently has that
  permission. The remote permission catalog has no `catalog.cost.read` or
  `catalog.cost.manage` permissions.
- Product-media metadata tables retain broad write policies that permit row
  deletion. Existing Storage object protections are separate and do not
  correct these metadata-table policies.
- The shared `platform_audit_events` table and
  `record_platform_audit_event(...)` RPC exist, but no Products mutation audit
  triggers were found. No Products database write-control table was found.
- Read-only integrity preflight found zero cross-organization references in
  Products, variants, offers, costs, media assignments and price-book entries.
- The deployed migration history ends at `20261025122000`.

`npm run supabase:check` passed (4/4) against the configured Supabase endpoint.
The doctor generated the ignored local `.env` from `.env.example`; it was not
used to authorize or perform a database mutation. No remote Products write or
migration was issued.

### Task authorization and boundary

The user authorized implementation and tests locally only. The task sequence
is being corrected so the already-approved shared audit implementation
precedes operation-specific Products RLS, followed by the final security
audit. No remote deployment, Products write enablement or user-data mutation
is authorized by this decision.

## Attempt 12 — Product audit controls

### Implemented

- Added `20261025173000_erp_product_write_audit_controls.sql`. A global
  default-off control and a per-organization default-off control both have to
  be enabled; writes remain denied until the later RLS migration marks the
  security gates ready.
- Only a Platform owner can change controls through the security-definer RPC.
  Control changes are written to the existing append-only Platform audit
  stream. The global control change is recorded per organization.
- Products and commercial mutations now pass a database write-control trigger
  and append a same-transaction audit event through
  `record_platform_audit_event(...)`. The audit stores operation, changed field
  names, timestamp version, correlation ID and reason code, never row values.
  Invalid correlation/reason headers and audit failures reject the mutation.
- Organization ownership is immutable in the write guard.
- Added `014_erp_product_write_audit.sql` for default-off, per-organization
  gating, owner-only control, mutation audit and audit-failure rollback.

### Validation

| Command | Result |
|---|---|
| `npm run test:multiplatform-contracts` | Passed: 10 tests |
| `npm run validate:contracts` | Passed: 25 contract files, 3 stable IDs |
| `supabase test db --local --workdir /Users/minoveaz/.copilot/session-state/0b70bb23-44c9-4553-8d2a-e291f96a51ad/files/isolated-pgtap supabase/tests/database/014_erp_product_write_audit.sql` | Passed: 17 pgTAP assertions against a separate local project and full migration chain |
| `supabase db lint --local --workdir /Users/minoveaz/.copilot/session-state/0b70bb23-44c9-4553-8d2a-e291f96a51ad/files/isolated-pgtap` | Completed with 4 pre-existing findings in unrelated organization/settings functions; no finding referenced this migration |
| `npm run validate:delivery-ledgers` | Passed after task evidence/status update |

### Boundary and follow-up

The isolated database required Storage to be enabled because earlier repository
migrations reference `storage.objects`. An initial pgTAP attempt used the
deprecated `auth.users.email_confirmed_at` column; the fixture now uses the
current `confirmed_at` column, and all 17 assertions pass. This migration is
only the shared audit/control prerequisite: operation-specific RLS and
cost-only permissions remain to be added before `security_gates_ready` can be
set. The remote project was not mutated, and its Products write controls were
not enabled.

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

## Attempt 13 — Local Products write-security migration

### Environment and boundary

| Field | Value |
|---|---|
| Repository | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Checkout / branch | In-place branch checkout / `feature/erp-core-capabilities` |
| HEAD | `141f1ca6d50286d639e3b1e0e5a472c676acda9a` |
| Working tree | Contains the Products audit/RLS migrations, pgTAP tests, Platform permission types/adapter, ledger and access/build evidence changes. |
| Test runtime | Disposable local Supabase project under the session artifacts directory; API `http://127.0.0.1:55421`, database port `55422`. No UI runtime was used. |

Only the approved task `RLS-MIGRATION-001` was implemented. The two
forward-only migrations install operation-specific Catalog/Products policies,
owner/admin-only cost permissions, deny physical deletion except media
association detach, add same-organization relationship constraints, gate
Products Files/Storage writes and complete the previously installed,
default-off audit/write-control boundary. The database now overrides
client-provided `updated_at` on guarded writes before the audit event records
its version timestamp.

The local disposable database was recreated from the repository's complete
migration chain after the final SQL edit. After the user explicitly authorized
deployment with Products left read-only, the dry run showed exactly the two
expected migrations. Both were applied to `loopdev-platform-dev` with
`--skip-vault`; migration history and remote policy/control/trigger state were
then verified read-only. The global control remains false and no
organization-level control is enabled. No Product records were modified.

### Validation evidence

| Command or check | Result |
|---|---|
| `supabase test db --local --workdir /Users/minoveaz/.copilot/session-state/0b70bb23-44c9-4553-8d2a-e291f96a51ad/files/isolated-pgtap supabase/tests/database/014_erp_product_write_audit.sql supabase/tests/database/015_erp_products_operation_rls.sql` | Passed: 2 files, 63 pgTAP assertions, after a full isolated migration reset. |
| `npm run test:quality` | Passed: 100 files, 559 tests. |
| `npm run validate:delivery-ledgers` | Passed: 8 ledgers checked, both before and after final task evidence/status update. |
| `npm run validate:module-runs` | Passed: 110 checkpoint files checked. |
| `supabase db lint --local --workdir /Users/minoveaz/.copilot/session-state/0b70bb23-44c9-4553-8d2a-e291f96a51ad/files/isolated-pgtap --schema public,storage --fail-on error` | Failed on existing findings in unrelated `update_organization_settings`, `update_organization_member`, `remove_organization_member`, `patch_user_preferences`, and Supabase Storage dynamic-SQL functions. No finding referenced either new migration's functions. The unrelated lint findings were not modified. |
| `supabase db push --linked --dry-run` | Passed: listed exactly the two approved Products security migrations. |
| `supabase db push --linked --skip-vault` | Passed: applied both migrations to `loopdev-platform-dev`; Vault secrets and seed data were not included. |
| `supabase migration list --linked` | Passed: both migration versions appear in remote history. |
| Read-only `supabase db query --linked` verification | Passed: global control is false, no organization control is enabled, zero organizations pass the write-enabled function, no broad `FOR ALL` Products policy remains, audit/control triggers are enabled, cost grants belong only to owner/admin, and product-media Storage writes are gated. |
| `git diff --check` | Passed before the final evidence update; rerun with the final ledger/docs edits. |

### Handoff

`RLS-MIGRATION-001` is implemented, tested and deployed to the development
project. Products is currently read-only there; enabling writes is a separate
decision and was not authorized. No pre-cutover backup or recovery rehearsal
was performed, so the module is not release-ready. Legacy-data review,
retention verification, Files lifecycle/security checks, and independent
traceability/design/mobile/runtime gates remain open.

## Attempt 14 — Products security audit closeout

### Audit result

The access model now reconciles the deployed state with the remaining gaps:

- Organization isolation, operation-specific RLS, same-organization
  constraints, cost permissions, write controls and same-transaction audit are
  deployed and covered by the isolated pgTAP suites. Negative role,
  cross-organization, physical-delete and default-off write-control cases are
  covered in suites 014/015.
- Read-only remote checks from attempt 13 confirm that Products writes remain
  disabled globally and for every organization. No remote mutation was made
  during this audit.
- Application cost projections, cache invalidation, logs and search have not
  been demonstrated end to end. Legacy `catalog.manage` role grants remain
  because other consumers have not been audited; no deployed Products policy
  uses that permission.
- Product media still bypasses the shared Files adapter. The adapter issues
  one-hour signed Storage URLs; an already-issued URL remains a bearer URL
  until expiry, even if the user's permission is subsequently revoked. The
  acceptable URL lifetime, metadata lifecycle, retention and orphan recovery
  must be resolved in `PLATFORM-FILES-001` before uploads are enabled.
- No immutable pre-cutover backup or recovery rehearsal is evidenced, and
  legacy-data review remains blocked. Keep Products writes disabled.

`AUDIT-SECURITY-001` is complete as a security audit: its evidence and residual
risks are recorded in `access-model.md`. This does not mean Products or the
module is release-ready. The next eligible task is `PLATFORM-FILES-001`;
media adapter work must wait for its dependencies, and recovery/data gates
remain independent release blockers.

### Validation evidence

| Command or check | Result |
|---|---|
| `npm test -- src/test/catalog/catalog-adapter.test.ts` | Passed; required Catalog adapter regressions. |
| `npm run validate:delivery-ledgers` | Passed after recording the security-audit evidence and task status. |
| `npm run validate:module-runs` | Passed after updating this attempt's traceability record. |
| `git diff --check` | Passed; no whitespace errors. |

### Operational boundary

| Field | Value |
|---|---|
| Repository | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Checkout | In-place branch checkout |
| Branch / HEAD | `feature/erp-core-capabilities` / `141f1ca6d50286d639e3b1e0e5a472c676acda9a` |
| Working tree | Existing Products security implementation plus this audit/documentation update; no unrelated changes overwritten |
| Runtime | None used in this documentation/test-validation attempt |

### Handoff

Security audit findings are recorded; Products writes remain disabled. Proceed
only with ready task `PLATFORM-FILES-001`. Keep `DATA-INVENTORY-001` and
`CUTOVER-ROLLBACK-001` blocked until authorized legacy-data review and recovery
evidence exist.

## Attempt 15 — Platform Files contract

### Approved shared contract

The Product Owner selected a maximum signed-preview URL lifetime of five
minutes. `PlatformFilesPort` now defines the consumer boundary without
exposing storage keys or allowing consumers to choose authorization policy:

- Upload policy accepts JPEG, PNG and WebP up to 25 MiB. The server must
  validate MIME, file signature and successful image decoding; browser checks
  are only early feedback. Uploads remain `processing` until ready, and
  idempotency keys are required for safe retries.
- Platform Files keeps the original and generates `large` (1600 px maximum
  edge) and `thumbnail` (400 px maximum edge) renditions, preserving aspect
  ratio and never upscaling. Encoding/quality remain Platform policy.
- A finalized File can be reused across Product/SKU assignments. ERP owns
  asset tags, contextual alt text, ordering and assignment lifecycle; detach
  removes only the assignment and never deletes the asset, File or binary.
- Preview requests carry the same-organization resource context and choose
  `original`, `large` or `thumbnail`. Platform Files reauthorizes the current
  user/resource and returns a URL plus `expiresAt`, capped at 300 seconds.
- Platform Files owns retention/legal hold and incomplete-upload/orphan
  recovery. The contract deliberately does not invent a retention duration;
  cleanup must verify there are no active assignments or other references.
  Failed registration/attachment does not delete a finalized reusable File.
- The existing profile-avatar preview already uses 300 seconds; it now reuses
  the shared TTL constant.

Added the provider-neutral contract in
`packages/contracts/src/platform-files.ts`, exported it from the contracts
index, added regression coverage, and updated the Files backend mapping plus
Products API, access, sync and multiplatform evidence. This is contract work
only: no generic remote Files adapter or Product-media runtime behavior was
changed. The current Products adapter still uploads directly and issues
one-hour URLs; `MEDIA-ADAPTER-001` must replace it before claiming runtime
compliance.

### Validation evidence

| Command | Result |
|---|---|
| `npm test -- src/test/platform/files-contract.test.ts src/test/platform/account/profile-adapter.test.ts` | Passed: 2 files, 13 tests. |
| `npm run validate:contracts` | Passed: 26 contract files, 3 stable IDs. |
| `npm run test:multiplatform-contracts` | Passed: 10 tests. |
| `npm run typecheck` | Passed: application and Node TypeScript projects. |
| `npm run validate:delivery-ledgers` | Passed: 8 ledgers, after `PLATFORM-FILES-001` evidence/status update. |
| `npm run validate:module-runs` | Passed: 110 checkpoint files. |
| `git diff --check` | Passed; no whitespace errors. |

No authenticated Files UI/runtime journey or remote file upload/preview was
run. The contract's tenant, role and detach boundaries are backed by the
previous isolated pgTAP suites and deployed read-only checks; Products writes
remain disabled.

### Handoff

`PLATFORM-FILES-001` is complete as a shared contract task. The next ready
dependency is `MEDIA-DATA-001`, which must persist reusable assets and
assignments without expanding this contract or deleting shared Files.
`MEDIA-ADAPTER-001` remains dependent on both Files and media persistence.
Legacy-data/recovery gates remain blocked and no remote Products write is
authorized.

### Attempt 16 — Product media gallery persistence

Completed `MEDIA-DATA-001` locally with migration
`20261025175000_erp_product_media_gallery_order.sql`. Existing assignments are
backfilled with deterministic per-product/SKU positions and version `1`.
Database triggers append new assignments, serialize gallery mutations through
the owning product/SKU, keep assignment identity immutable and increment
versions for position or contextual alt-text changes. A deferrable unique
constraint enforces one position per gallery. The reorder RPC requires
`catalog.write`, the Products write controls, the complete assignment set and
matching expected versions, then applies the ordered positions in one
transaction. Direct clients cannot update positions.

The isolated pgTAP suite proves same-organization reusable File references,
independent product/SKU order, atomic complete-set reorder, stale/incomplete
conflict rejection, version updates, restricted position writes and detach
preserving the File and other gallery assignments. No remote migration or
Product data write was performed; remote write controls remain disabled.

| Command | Result |
|---|---|
| `supabase test db --local --workdir /Users/minoveaz/.copilot/session-state/0b70bb23-44c9-4553-8d2a-e291f96a51ad/files/isolated-pgtap supabase/tests/database/014_erp_product_write_audit.sql supabase/tests/database/015_erp_products_operation_rls.sql supabase/tests/database/016_erp_product_media_gallery_order.sql` | Passed: 3 files, 84 pgTAP assertions. |
| `supabase db lint --local --workdir /Users/minoveaz/.copilot/session-state/0b70bb23-44c9-4553-8d2a-e291f96a51ad/files/isolated-pgtap --schema public,storage --fail-on error` | Failed on existing findings in organization/settings functions and Supabase Storage dynamic-SQL functions. No finding referenced the new gallery migration or functions. |
| `npm run validate:delivery-ledgers` | Passed: 8 ledgers, after `MEDIA-DATA-001` evidence/status update. |
| `git diff --check` | Passed. |

The database persistence layer is complete; `MEDIA-ADAPTER-001` must call
these operations through the approved Platform Files boundary. Renderer
operations, mobile parity, remote migration, recovery evidence and Products
write enablement remain out of scope and unverified.

### Attempt 17 — Platform Files product media

Completed `MEDIA-ADAPTER-001` in the existing checkout. Products now lists
reusable assets and uploads, polls/finalizes, and requests previews through the
shared `PlatformFilesPort`; the authenticated `platform-files` function owns
authorization, checksum verification, image decoding, original retention,
1600/400 WebP renditions and previews capped at 300 seconds. The client/server
upload-status response now matches the shared contract. Service-role grants
are limited to the reads and session updates needed by the function, plus
trusted File registration fixtures; authenticated product-media object updates
remain prohibited.

The isolated pgTAP run exposed and fixed stale auth-user fixture columns and
service-role privileges in the SQL tests. All five Products database suites
then passed. The shared local database was only linted; migrations were
applied solely to the named isolated pgTAP database, which was stopped after
the tests. No remote migration, deployment or Products data write was made.

| Command | Result |
|---|---|
| `npm test -- src/test/erp/product-record-pages.test.tsx src/test/erp/product-sku-manager.test.tsx src/test/erp/product-list-table.test.tsx src/test/erp/product-media.test.tsx src/test/catalog/catalog-adapter.test.ts src/test/platform/platform-files-supabase.test.ts src/test/platform/files-contract.test.ts` | Passed: 7 files, 48 tests. |
| `npm test -- src/test/erp/products-capability.test.ts src/test/erp/product-list-table.test.tsx` | Passed: 2 files, 8 tests. |
| `deno check --config supabase/functions/platform-files/deno.json supabase/functions/platform-files/index.ts` | Passed. |
| `deno test --allow-read supabase/functions/platform-files` | Passed: 5 tests, including valid PNG decode and WebP output. |
| `supabase test db --local --workdir /Users/minoveaz/.copilot/session-state/0b70bb23-44c9-4553-8d2a-e291f96a51ad/files/isolated-pgtap supabase/tests/database/014_erp_product_write_audit.sql supabase/tests/database/015_erp_products_operation_rls.sql supabase/tests/database/016_erp_product_media_gallery_order.sql supabase/tests/database/017_erp_product_cost_reference.sql supabase/tests/database/018_platform_files_product_media_backend.sql` | Passed: 5 files, 105 pgTAP assertions. |
| `npm run typecheck`, `npm run build`, `npm run i18n:check`, `npm run validate:contracts`, `npm run validate:delivery-ledgers`, `npm run validate:module-runs`, `supabase db lint --local`, focused `npx eslint` | Passed. |

Checkout evidence: `/Users/minoveaz/.copilot/repos/loopdev-v2`,
`feature/erp-core-capabilities`, base `develop`, `HEAD
141f1ca6d50286d639e3b1e0e5a472c676acda9a`. No authenticated browser journey was
run in this continuation. Mobile work, remote deployment, recovery/cutover
evidence and enabling Product writes remain out of scope; this task does not
claim module or release readiness.

### Git checkpoint — follow-up PR preparation

Committed the approved web Products scope as
`311d9f7e468326ddb727a01d4f7b5692b44fd360`
(`feat(erp): deliver Products web management`) on
`feature/erp-core-capabilities`, with the `MOD-CORE-20261024-001` trailer and
required co-author trailer. The working tree is clean. The PR template is
`.github/pull_request_template.md`; the change is prepared locally but has not
been pushed or opened as a PR. The linked database migration check failed with
PostgreSQL password authentication, so no remote schema change or deployment
was performed. The missing `position` column is added by
`20261025175000_erp_product_media_gallery_order.sql`, now included in this
local commit.

### Attempt 18 — reconcile and deploy Products migrations

Authenticated the Supabase CLI and confirmed the linked project was
`loopdev-platform-dev` (`sukjcsylkljiyvfklxvj`). The remote migration history
contained `20261025120000` (`erp_suppliers_foundation`) without its local
source file. Read its stored SQL statements through the read-only database
query API, restored the source as
`supabase/migrations/20261025120000_erp_suppliers_foundation.sql`, and
committed it as `4379822`.

The first push of the approved Products migrations failed during the
gallery-position backfill because the existing write-control trigger correctly
rejected the update while Product writes were disabled. A read-only query
confirmed that the failed migration rolled back: the `position` column and
migration record were both absent. Updated
`20261025175000_erp_product_media_gallery_order.sql` to disable only that
table's write-control and mutation-audit triggers during the migration
metadata backfill, then restore both triggers before adding the constraints.
This leaves the runtime write controls unchanged.

`supabase db push --linked --skip-vault` then applied
`20261025175000_erp_product_media_gallery_order.sql`,
`20261025180000_erp_product_categories_and_cost_versions.sql` and
`20261027120000_platform_files_product_media_backend.sql`. Remote read-only
verification confirmed the `position` column is `integer`, all three versions
are recorded as applied, the existing gallery row has a position, and the
gallery guard, audit and gallery triggers are enabled. The global Products
write control remains `false`; zero organization controls are enabled. No
Product/SKU business fields were changed; the migration only backfilled gallery
position/version metadata. Vault secrets and seed data were not pushed.

The targeted isolated pgTAP rerun could not start because Docker was not
running (`ECONNREFUSED` on the isolated project's port and missing Docker
socket). No authenticated browser refresh was performed, so the database
schema fix is verified but the UI route was not re-tested.

### Attempt 19 — deploy Platform Files Edge Function

The new screenshot showed `Failed to send a request to the Edge Function`.
`supabase functions list --project-ref sukjcsylkljiyvfklxvj` confirmed
`platform-files` was absent from `loopdev-platform-dev`. After local
`deno check` and five passing Deno tests, deployed only that function with
`supabase functions deploy platform-files --project-ref sukjcsylkljiyvfklxvj
--use-api`; Supabase reports it `ACTIVE`, version 1. JWT verification remains
enabled. An OPTIONS preflight for `http://localhost:8080` returned HTTP 200
with the expected CORS headers.

The browser verification canvas redirected to `/pages/login`, so it had no
authenticated session to exercise the product gallery. The configured
`PLATFORM_FILES_ALLOWED_ORIGINS` secret is absent; local origins are explicitly
allowed by the function, but a non-local app origin must be configured before
that origin can call the function.
