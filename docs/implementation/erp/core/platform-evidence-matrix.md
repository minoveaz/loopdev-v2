# Platform evidence matrix

| Capability/operation | Domain parity | Desktop renderer/action | Mobile renderer/action | iOS | Android | Status | Owner | Gap/next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `erp.visual-composition` | Not applicable: visual source only | Product/SKU/category and media compositions are conceptually approved; the record has a right-column carousel and the product-scoped gallery has an in-context asset selector; no runtime screenshot | Product record media preview stacks above SKU details; gallery selector is full-surface; no runtime screenshot or operation-parity test | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Compare the implemented gallery/selector against the approved source on desktop and mobile; operation parity remains unverified |
| `erp.overview.read` (navigation compatibility; not MVP capability) | Partial: current page reads catalog adapter; no renderer test | Implemented in source at `/app/erp/overview`; loading/error is incomplete | Responsive route; operation evidence missing | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Decide redirect/compatibility behavior in route audit; do not expand scope into dashboard work |
| `catalog.list` (Products list compatibility operation) | Partial: typed adapter/local test; remote path exists but no runtime proof | Canonical `/app/erp/products` route is registered; authenticated shell was exercised, but catalog loading fails closed while adapter mode is unset | Same responsive web route exists; mobile viewport and operation-level evidence are missing | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Configure an authorized explicit runtime mode, then verify organization-wide aggregation and desktop/mobile-web operations without enabling remote writes prematurely |
| `catalog.adapter.mode` (shared persistence selection) | PASS for explicit `local_demo`/`supabase` selection; missing/invalid modes fail closed; local Catalog storage read/write errors reject without mutating cached product state | Shared adapter consumed by desktop web; no renderer operation changed in this task | Shared web adapter implementation, but mobile route/action behavior remains unverified by this task | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Configure `VITE_CATALOG_ADAPTER_MODE` explicitly in each runtime; keep mobile route/operation verification in `PRODUCT-MOBILE-001` |
| `catalog.identifiers.generate` | Local adapter generates organization-scoped numeric keys/SKUs; Supabase migration assigns IDs and guards direct changes; PostgreSQL validation pending | Product and variant forms display generated key/SKU read-only; four focused test files pass | Responsive implementation shares the desktop-web forms; mobile-web interaction not separately verified | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Start local Postgres and lint the migration; verify authenticated desktop/mobile-web interactions. Trusted external-SKU import remains future integration work. |
| `catalog.manage` (legacy aggregate mutator) | Conflicts: local CRUD tests exist; adapters expose physical deletion and lack version/audit | Legacy page exists; no page-level runtime evidence | Missing operation-level evidence | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Replace delete with archive/restore and verify permissions, version, audit, errors and route behavior |
| `catalog.offers.list/manage` | Partial: local/remote adapter and SQL fields exist; runtime and archive parity unverified | Legacy commercial UI exists | Missing operation-level evidence | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Enforce `catalog.read` visibility and `catalog.write` mutations; PriceBook owns currency |
| `catalog.price-books.list/manage` | Partial: adapter/schema exists; no runtime or page-level proof | Legacy commercial UI exists | Missing operation-level evidence | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Verify currency, archive/restore, versions, permissions and desktop/mobile parity |
| `catalog.price-entries.list/manage` | Partial: adapter/schema exists; legacy entry currency conflicts with approved PriceBook ownership | Legacy commercial UI exists | Missing operation-level evidence | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Validate reference combinations and currency inheritance; keep sales prices distinct from purchase-cost reference |
| `catalog.cost-reference.read/manage` | Missing: `catalog.cost.read` and `catalog.cost.manage` selected separately; domain/access/API/sync contracts need reconciliation | Full-page cost section is conceptual; the two permission gates are not implemented | Same; permission enforcement and behavior parity missing | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io | Define manage-without-read behavior, currency, product/SKU ownership and audit; never inherit from `catalog.read` |
| `catalog.categories.list` | Missing: no category entity/tree contract | Missing | Missing | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io | Implement approved model, authorization and operation parity tests |
| `catalog.categories.manage` | Missing: no category entity/tree CRUD contract | Missing; dedicated view is conceptual | Missing; stacked tree/detail view is conceptual | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io | Implement archive/restore/reparent rules, generated keys and focused desktop/mobile tests |
| `catalog.media.library.list` | Missing: no shared media-library or Product media association contract | Contextual selector is wireframed within the product gallery; organization-scoped query/runtime not implemented | Full-surface selector is wireframed; organization-scoped query/runtime and focus behavior not tested | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io + Platform owner | Approve tenant-safe listing, preview and reuse semantics; no standalone library route |
| `catalog.media.upload` | Missing: no generic authenticated organization Files adapter or rendition contract | Gallery upload is wireframed; remote upload and processing lifecycle not implemented | Same upload semantics wireframed; mobile interruptions and operation parity untested | N/A (deferred) | N/A (deferred) | NOT_TESTED | Platform owner | Approve upload, signed preview, validation, audit, original retention and 1600/400 rendition ownership/failure behavior |
| `catalog.media.attach` | Missing: `FileRecord.relation` is singular and local `relate()` replaces it | Missing | Missing | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io + Platform owner | Choose ERP-owned assignment records or approved Platform multi-relation contract; enforce same-organization scope |
| `catalog.media.metadata.manage` | Missing: no reconciled product alt-text or shared rendition metadata contract | Alt text per placement is shown conceptually; implementation absent | Same accessible metadata semantics; runtime parity absent | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io + Platform owner | Confirm alt text is per Product/SKU assignment; define shared rendition metadata and lifecycle before build |
| `catalog.media.detach` | Missing: no Product media lifecycle or shared-file retention policy | Missing | Missing | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io + Platform owner | Define safe detach/archive/delete semantics when one image is reused |
| `catalog.read-availability` (legacy product availability; excluded) | Partial locally; Supabase adapter returns empty list | Source surface exists but remote read is stubbed | Missing operation-level evidence | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io | Keep out of this release unless an approved requirement changes scope |
| `channel.connect` / `channel.sync_approved_data` (follow-up) | Missing: no Shopify connector contract/runtime | Not in release | Not in release | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io + MiauCraft owner | Future discovery after Products/categories |
| `commerce.order.manage` (follow-up) | Missing: no ERP order module found | Not in release | Not in release | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io + Inhand owner | Future discovery; scope is deferred |
| `inventory.single_warehouse.manage` (follow-up) | Missing: no ERP stock module found | Not in release | Not in release | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io + Inhand owner | Future discovery; scope is deferred |
| `payment.coordinate` (follow-up) | Missing: no Inhand payment provider integration | Not in release | Not in release | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io + Inhand owner | Future discovery; no card data in LoopDev |

`PASS` requires verified domain, renderer and operations on every required
platform. A shared port, a visible section or a registered route alone does not
prove action parity.

## Runtime snapshot

| Field | Value |
| --- | --- |
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Checkout type | In-place branch checkout |
| Branch and HEAD | `feature/erp-core-capabilities` / `2e7faf367aa0b13a735492e9878390cc7e5a3621` |
| Working tree | Clean at verification start; documentation-only evidence changes follow |
| Desktop URL/port | `http://localhost:8080/app/erp/products`; route/shell exercised in an authenticated browser; catalog data request currently fails closed because `VITE_CATALOG_ADAPTER_MODE` is unset. No Supabase runtime/write was used. |
| Mobile URL/port | Same responsive web application/route; no separate mobile viewport or operation-parity evidence |
| Validation timestamp | 2026-10-25T09:52:00Z |

## Validation commands

| Command | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Source and route inspection | PASS | `discovery.md` | Source presence is recorded separately from runtime behavior |
| Official benchmark source review | PASS | `discovery.md`, external source register | Odoo, Microsoft Learn, Shopify Help, Adobe Commerce and Bynder product documentation/pages reviewed 2026-10-24–25 |
| Visual source and view/state coverage | PARTIAL | `visual-design.md`, `view-state-matrix.md`, `wireframes/` | Revised full-page product/SKU and record compositions, reference drawer and category view received conceptual approval on 2026-10-24. They are not runtime evidence; post-implementation comparison remains pending. |
| `npm run delivery:validate` | NOT_RUN | — | Run after checkpoint reconciliation. |
| `npm run validate:delivery-ledgers` | PASS — 8 ledgers | Verification snapshot | Structural ledger validation only; does not approve the module plan. |
| `npm run validate:multiplatform` | PASS | Verification snapshot | Structural validation only; does not prove runtime operation parity. |
| `npm run validate:module-runs` | PASS — 107 checkpoints before this snapshot | Verification snapshot | Traceability schema validation; the new blocked verification checkpoint does not close earlier gates. |
| ERP JSON/SVG/link check | NOT_RUN | — | Run after final document edits; not runtime evidence. |

| `npm test -- src/test/catalog/catalog-adapter.test.ts src/test/erp/product-record-pages.test.tsx src/test/erp/product-sku-manager.test.tsx src/test/erp/product-list-table.test.tsx src/test/erp/product-media.test.tsx src/test/erp/products-capability.test.ts src/test/crm/opportunities/opportunities-page.test.tsx` | PASS — 7 files, 35 tests | `runs/MOD-CORE-20261024-001/08-verify.md` | Focused Products, media and CRM compatibility tests |
| `npm run typecheck` | PASS | `runs/MOD-CORE-20261024-001/08-verify.md` | Both application and Node TypeScript projects |
| `npm run build` | PASS | `runs/MOD-CORE-20261024-001/07-build.md` | Build completed; existing large-chunk warning remains |
| `npm run i18n:check` | PASS | `runs/MOD-CORE-20261024-001/07-build.md` | No visible-text candidates |
| `npm run test:quality` | PASS — 100 files, 555 tests | `runs/MOD-CORE-20261024-001/10-git.json` | Prior PR CI evidence; not rerun in this verification snapshot |
| `npm test -- src/test/catalog/catalog-adapter.test.ts src/test/crm/customer-products-adapter.test.ts src/test/crm/pipeline/catalog-reference.test.ts src/test/crm/opportunities/opportunities-page.test.tsx` | PASS — 4 files, 20 tests | `runs/MOD-CORE-20261024-001/07-build.md` | Explicit adapter-mode selection, fail-closed configuration, no remote-to-fixture fallback, strict Catalog persistence errors and CRM compatibility |
| `npm run test:quality` | PASS — 100 files, 559 tests | `runs/MOD-CORE-20261024-001/07-build.md` | Full non-visual quality suite rerun after adapter-mode implementation |
| `npm run typecheck` | PASS | `runs/MOD-CORE-20261024-001/07-build.md` | Application and Node TypeScript projects |
| `npx eslint src/lib/storage.ts src/lib/localStore.ts src/loopdev/domains/catalog/data/localCatalog.ts src/loopdev/domains/catalog/adapter/index.ts src/vite-env.d.ts src/test/setup.ts src/test/catalog/catalog-adapter.test.ts` | PASS | `runs/MOD-CORE-20261024-001/07-build.md` | Focused lint for all files changed by `ADAPTER-MODE-001` |
| `npm run build` | PASS; existing large-chunk warning remains | `runs/MOD-CORE-20261024-001/07-build.md` | Production web bundle |
| `npm run validate:delivery-ledgers` | PASS — 8 ledgers | `runs/MOD-CORE-20261024-001/07-build.md` | Structural validation; rerun after task evidence/status update |
| `npm run validate:module-runs` | PASS — 110 checkpoints | `runs/MOD-CORE-20261024-001/07-build.md` | Checkpoint schema validation |
| `npm run validate:multiplatform` | PASS | `runs/MOD-CORE-20261024-001/07-build.md` | Structural scope/evidence validation; does not establish renderer or operation parity |
| `supabase db lint --local` | BLOCKED | `runs/MOD-CORE-20261024-001/07-build.md` | Local PostgreSQL unavailable at `127.0.0.1:54322`; do not deploy remotely |
| Authenticated desktop/mobile UI journey | NOT_RUN | `runs/MOD-CORE-20261024-001/08-verify.md` | Deep link returns HTTP 200, but this does not establish authenticated behavior or mobile-web parity |
