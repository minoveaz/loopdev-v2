# Phase 08 — Verification snapshot: ERP Products

## Identity and outcome

| Field | Value |
|---|---|
| Run | `MOD-CORE-20261024-001` |
| Span | `MOD-CORE-20261024-001:08-verify` |
| Skill | `module-verify` |
| Formal phase status | `blocked` |
| Evidence snapshot | `partial` |
| Parent | No approved `06-plan` or completed formal `07-build` checkpoint exists |
| Product issue | [#36](https://github.com/minoveaz/loopdev-v2/issues/36) |
| Requirement matrix | `docs/implementation/erp/core/requirement-evidence-matrix.md` |

This snapshot answers whether the first-release requirements are supported by
observable evidence. It does not advance the blocked run to review or release.
The Product Catalog implementation and PR #38 were merged to `develop`, but
Git delivery and passing tests do not satisfy the module completion gates.

## Environment

| Field | Value |
|---|---|
| Repository | `minoveaz/loopdev-v2` |
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Checkout | In-place branch checkout |
| Branch | `feature/erp-core-capabilities` |
| Base branch | `develop` |
| HEAD | `2e7faf367aa0b13a735492e9878390cc7e5a3621` |
| Working tree | Clean at verification start; this checkpoint and matrix are documentation-only follow-ups |
| Runtime | `http://localhost:8080/app/erp/products`; Vite PID 32300, serving from this repository |
| Runtime result | HTTP 200 from the SPA only; authentication, data interaction and authorization were not verified |
| Mobile runtime | No distinct mobile viewport/journey evidence collected |
| Timestamp | `2026-10-25T09:52:00Z` |

## Requirement evidence

The detailed requirement matrix is the output artifact. Summary:

| Requirement area | Evidence status | Finding |
|---|---|---|
| Product/SKU foundation and generated identifiers | `PARTIAL` | Product records, variants and immutable generated identifiers have source and focused tests; authenticated remote operation and commercial parity remain unverified. |
| Hierarchical categories | `FAIL` | Flat category references and quick creation exist; the required category tree manager and lifecycle operations do not. |
| Product/variant media | `PARTIAL` | Upload, assignment, preview, alt text and detach exist with local tests and a Supabase adapter; no reusable library UI, file normalization or authenticated/mobile evidence. |
| Purchase-cost reference | `PARTIAL` | Product-level UI and adapters exist; SKU-level workflow and approved cost-specific access/audit policy are incomplete. |
| Access, tenant isolation and audit | `FAIL` | The foundation migration has a documented `catalog.read`/DELETE policy risk; forward policy verification and shared append-only audit are release blockers. |
| Desktop/mobile web parity | `NOT_TESTED` | No authenticated desktop or mobile-web operation journey was performed. |
| Module plan/release gates | `FAIL` | Ledger is `draft`, the only task is blocked, and no approved `06-plan` checkpoint exists. |
| Shopify and Inhand commerce | `NOT_APPLICABLE` | Explicit follow-up scope, not a blocker for this Products release. |

## Validation

| Command/check | Result | Notes |
|---|---|---|
| `npm test -- src/test/catalog/catalog-adapter.test.ts src/test/erp/product-record-pages.test.tsx src/test/erp/product-sku-manager.test.tsx src/test/erp/product-list-table.test.tsx src/test/erp/product-media.test.tsx src/test/erp/products-capability.test.ts src/test/crm/opportunities/opportunities-page.test.tsx` | PASS — 7 files, 35 tests | Focused Products, media and CRM compatibility tests. |
| `npm run typecheck` | PASS | App and Node TypeScript projects. |
| `npm run validate:delivery-ledgers` | PASS — 8 ledgers | Structural ledger validation only. |
| `npm run validate:multiplatform` | PASS | Structural validation; does not establish runtime operation parity. |
| `npm run validate:module-runs` | PASS — 107 checkpoint files before this snapshot | Traceability JSON validation, not functional completion. |
| `npm run test:quality` | PASS — 100 files, 555 tests (recorded in prior PR CI) | Historical full-suite evidence on the implementation/fix revision; this snapshot reran the focused set. |
| `supabase db lint --local` | BLOCKED in the build evidence | Local PostgreSQL was unavailable at `127.0.0.1:54322`. |
| `curl` of `/app/erp/products` on port 8080 | HTTP 200 | SPA response only. No authenticated journey was available. |

## Visual, accessibility and platform evidence

- The approved conceptual product/SKU and media compositions are not runtime
  screenshots. The media addendum received separate conceptual approval on
  2026-10-25; authenticated upload/reuse behavior and runtime comparison remain
  unverified.
- Desktop and mobile web are both required. Responsive source and the
  multiplatform validator do not prove operation parity; mobile touch, keyboard,
  focus, screen-reader, RTL and narrow viewport journeys remain untested.
- iOS and Android remain explicitly deferred for this release.
- The media gallery uses equal square preview frames with `object-contain`.
  Upload code stores the original file and does not produce normalized image
  dimensions or ecommerce/social derivatives.

## Detected failures and likely origin

| Detected by | Finding | Likely origin |
|---|---|---|
| `module-verify` | Category-tree, media reuse/normalization, cost-access and authenticated platform evidence are incomplete. | `null`; the run lacks an approved module plan and several implementation decisions/tasks are still open, so a single implementation origin cannot be assigned confidently. |
| `module-verify` | Known catalog RLS read/delete risk and missing shared audit block release readiness. | Access/design and database migration boundary; documented in `access-model.md`, not re-tested against a live database here. |

## Exact next handoff

1. Reconcile the product/media visual, domain, access, API and sync artifacts
   with the currently implemented code and approved first-release scope.
2. Approve a complete `06-plan` with explicit category, media, cost, RLS/audit,
   migration, rollback and desktop/mobile operation tasks.
3. Implement the category tree and complete media library/reuse experience;
   decide whether upload must create standardized image derivatives.
4. Finalize cost visibility and SKU-level behavior, fix and verify RLS, and
   deliver the shared append-only audit contract before enabling remote writes.
5. Run authorized legacy-data inventory/dry-run, then authenticated
   organization-scoped desktop and mobile web journeys, including responsive,
   accessibility and error/forbidden states.
6. Re-run formal verification and module review. Keep issue #36 open until all
   applicable requirements have evidence or explicit owner-approved gaps.

**Verification state: `blocked`.** No production code, database or remote state
was changed during this verification.

## Attempt 2 — Focused purchase-cost permission verification

This is a narrow continuation for `REQ-ERP-COST-REFERENCE`; it does not
reopen or complete the blocked module-wide verification.

| Field | Value |
|---|---|
| Timestamp | `2026-10-27T21:18:30Z` |
| Checkout | `/Users/minoveaz/.copilot/repos/loopdev-v2`, branch `feature/erp-products-web-management` |
| HEAD | `1bc95a77557dbf89e49c203f66e127bab951ffd0` |
| Working tree | Pre-existing `docs/implementation/erp/core/README.md` modification; preserved |
| Runtime | No app listening on ports 8080 or 5174; no authenticated UI journey |

**Authorization evidence:** the forward migration registers distinct
`catalog.cost.read` and `catalog.cost.manage` permissions, grants both to
owners/admins, removes both from agents/viewers, and creates cost-table
operation policies using read for `SELECT` and manage for writes. The write
RPC independently checks `catalog.cost.manage`; the Supabase adapter reads
only the cost-reference table and writes through that RPC. The access model
records a prior read-only remote role/RLS verification. That remote state was
not queried again during this attempt.

**Detected gap:** the product form and SKU manager use successful cost reading
as the indicator that cost editing is available. If a user has read but not
manage, the UI permits editing; the product/SKU save occurs before the
cost-specific RPC, so a denied cost mutation can leave the record save
committed. The current tests do not cover split read/manage grants or an
`agent` with `catalog.write` directly invoking the cost RPC. No production
code was changed.

| Validation | Result |
|---|---|
| `npm test -- src/test/catalog/catalog-adapter.test.ts src/test/erp/product-record-pages.test.tsx src/test/erp/product-sku-manager.test.tsx` | PASS — 3 files, 28 tests |
| `curl` on ports 8080 and 5174 | NOT RUNNABLE — neither app process was listening. |
| `npm run validate:module-runs` | PASS — 110 checkpoint files |
| `npm run validate:multiplatform` | PASS — structural matrix validation only |
| `git diff --check` and checkpoint JSON parse | PASS |

**Cost verification state: `PARTIAL`.** Source and previously recorded
database evidence support the server-side split permissions, but UI behavior
for split grants, direct negative-role RPC coverage and authenticated runtime
behavior remain unverified. Exact next actions: gate editing on
`catalog.cost.manage`, prevent partial product/SKU persistence when cost
mutation is denied, and add the agent-with-`catalog.write` RPC test. This
verification does not authorize those remediations.

### Database rerun after Docker became available

At `2026-10-27T21:18:30Z`, the dedicated
`supabase/tests/database/017_erp_product_cost_reference.sql` suite passed all
10 assertions. The broader run of migrations/tests 014–018 completed 111
assertions with 5 failures, all in
`015_erp_products_operation_rls.sql` tests 47 and 49–52. Those failures occur
in product-media audit actor cases and report `organization access denied`;
the cost test 017 passed within the same broader run. No remote database was
used or modified.

### Attempt 4 — Purchase-cost implementation and remote-state check

The local remediation now implements the approved split: mutations require
both `catalog.cost.read` and `catalog.cost.manage`; product/SKU saves are
independent from cost saves; product cost is suppressed when active SKUs exist;
and SKU costs remain independent. The focused UI/adapter suite passes, and the
isolated test database passed 22 pgTAP assertions against the forward
migration.

Environment: `/Users/minoveaz/.copilot/repos/loopdev-v2`, in-place branch
`feature/erp-products-web-management`, `HEAD
1bc95a77557dbf89e49c203f66e127bab951ffd0`. Vite served
`http://127.0.0.1:5173` with HTTP 200; direct navigation to a Products edit URL
redirected to `/pages/login`. No authenticated route/operation journey was
performed.

Read-only queries to the linked `loopdev-platform-dev` project found:

- Cost `SELECT` RLS requires `catalog.cost.read`.
- Cost `INSERT` and `UPDATE` policies require `catalog.cost.manage` only.
- The deployed RPC checks `catalog.cost.manage` but not `catalog.cost.read`;
  the new internal RPC core is absent.
- One global and one organization write-control row are enabled.

No remote migration, data write or write-control change was made. This
contradicts earlier checkpoint evidence that reported the controls disabled;
the current live read-only result is recorded here and the deployment state
must be treated as enabled.

| Validation | Result |
|---|---|
| `npm test -- src/test/erp/product-record-pages.test.tsx` | PASS — 10 tests. |
| Targeted catalog/Product/SKU Vitest run | PASS — 3 files, 31 tests. |
| `npm run typecheck`, `npm run i18n:check`, `npm run build` | PASS. |
| Isolated local cost pgTAP after the forward migration | PASS — 22 assertions. |
| Live linked-project read-only policy/RPC/control queries | PASS — confirmed mismatch and enabled controls; no writes. |
| Direct browser route | PARTIAL — unauthenticated redirect to login; no authorized runtime behavior verified. |

**Cost verification state: `PARTIAL`.** Local code and regression evidence
address the UI/adapter and database-contract gaps. The linked deployment still
allows manage-only cost mutations while write controls are enabled, so the
security fix is not active remotely. Do not deploy or toggle controls without
separate authorization. Exact next actions: reconcile the deployed control
state with its owner; obtain deployment authorization; apply and recheck the
forward migration; then verify the desktop flow in an authenticated session.
