# Platform evidence matrix

| Capability/operation | Domain parity | Desktop renderer/action | Mobile renderer/action | iOS | Android | Status | Owner | Gap/next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `erp.visual-composition` | Not applicable: visual source only | Prior product/SKU, category and reference compositions conceptually approved; new product-media library is not designed; no runtime screenshot | Prior responsive compositions approved; product-media touch/upload flows not designed or tested | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Product media added by `CR-ERP-PRODUCT-MEDIA-001`; add and approve desktop/mobile visual evidence before implementation |
| `erp.overview.read` (navigation compatibility; not MVP capability) | Partial: current page reads catalog adapter; no renderer test | Implemented in source at `/app/erp/overview`; loading/error is incomplete | Responsive route; operation evidence missing | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Decide redirect/compatibility behavior in route audit; do not expand scope into dashboard work |
| `catalog.list` (Products list compatibility operation) | Partial: typed adapter/local test; remote path exists but no runtime proof | `/app/erp/products` is wired to the aggregate Products view; authenticated runtime/action evidence pending | Missing operation-level evidence; same route is not proof | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Verify organization-wide aggregation, authentication and desktop/mobile operation behavior |
| `catalog.identifiers.generate` | Local adapter generates organization-scoped numeric keys/SKUs; Supabase migration assigns IDs and guards direct changes; PostgreSQL validation pending | Product and variant forms display generated key/SKU read-only; four focused test files pass | Responsive implementation shares the desktop-web forms; mobile-web interaction not separately verified | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Start local Postgres and lint the migration; verify authenticated desktop/mobile-web interactions. Trusted external-SKU import remains future integration work. |
| `catalog.manage` (legacy aggregate mutator) | Conflicts: local CRUD tests exist; adapters expose physical deletion and lack version/audit | Legacy page exists; no page-level runtime evidence | Missing operation-level evidence | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Replace delete with archive/restore and verify permissions, version, audit, errors and route behavior |
| `catalog.offers.list/manage` | Partial: local/remote adapter and SQL fields exist; runtime and archive parity unverified | Legacy commercial UI exists | Missing operation-level evidence | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Enforce `catalog.read` visibility and `catalog.write` mutations; PriceBook owns currency |
| `catalog.price-books.list/manage` | Partial: adapter/schema exists; no runtime or page-level proof | Legacy commercial UI exists | Missing operation-level evidence | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Verify currency, archive/restore, versions, permissions and desktop/mobile parity |
| `catalog.price-entries.list/manage` | Partial: adapter/schema exists; legacy entry currency conflicts with approved PriceBook ownership | Legacy commercial UI exists | Missing operation-level evidence | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Validate reference combinations and currency inheritance; keep sales prices distinct from purchase-cost reference |
| `catalog.cost-reference.read/manage` | Missing: concept approved, domain/access/API/sync contracts need reconciliation | Full-page cost section is conceptual; permission enforcement missing | Full-page cost section is conceptual; permission enforcement missing | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io | Define currency, product/SKU ownership, dedicated visibility permission and audit before build; no `catalog.read` inheritance |
| `catalog.categories.list` | Missing: no category entity/tree contract | Missing | Missing | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io | Implement approved model, authorization and operation parity tests |
| `catalog.categories.manage` | Missing: no category entity/tree CRUD contract | Missing; dedicated view is conceptual | Missing; stacked tree/detail view is conceptual | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io | Implement archive/restore/reparent rules, generated keys and focused desktop/mobile tests |
| `catalog.media.library.list` | Missing: no shared media-library or Product media association contract | Missing | Missing | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io + Platform owner | Define organization-scoped listing and reuse semantics; verify Files backend before implementation |
| `catalog.media.upload` | Missing: no generic authenticated organization Files adapter | Missing | Missing; mobile file picker/touch and interruption behavior not designed | N/A (deferred) | N/A (deferred) | NOT_TESTED | Platform owner | Approve remote upload, signed URL, image validation, audit and failure/retry behavior |
| `catalog.media.attach` | Missing: `FileRecord.relation` is singular and local `relate()` replaces it | Missing | Missing | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io + Platform owner | Choose ERP-owned assignment records or approved Platform multi-relation contract; enforce same-organization scope |
| `catalog.media.metadata.manage` | Missing: no product alt-text or media metadata contract | Missing | Missing | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io | Define metadata fields and whether alt text is file- or association-scoped; add accessible editing behavior |
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
| Checkout type | branch |
| Branch and HEAD | `feature/erp-core-capabilities` / `2fe79082039b24eb771879dad3ca79a59dba6d21` |
| Working tree | Modified; includes approved identifier implementation and pre-existing ERP governance/product changes |
| Desktop URL/port | `http://localhost:8080/app/erp/products/new`; HTTP 200 from SPA server, but authenticated interaction not verified |
| Mobile URL/port | `http://localhost:8080`; no mobile-web runtime evidence |
| Validation timestamp | 2026-10-25 |

## Validation commands

| Command | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Source and route inspection | PASS | `discovery.md` | Source presence is recorded separately from runtime behavior |
| Official benchmark source review | PASS | `discovery.md`, external source register | Odoo, Microsoft Learn, Shopify Help, Adobe Commerce and Bynder product documentation/pages reviewed 2026-10-24–25 |
| Visual source and view/state coverage | PARTIAL | `visual-design.md`, `view-state-matrix.md`, `wireframes/` | Revised full-page product/SKU and record compositions, reference drawer and category view received conceptual approval on 2026-10-24. They are not runtime evidence; post-implementation comparison remains pending. |
| `npm run delivery:validate` | NOT_RUN | — | Run after checkpoint reconciliation. |
| `npm run validate:delivery-ledgers` | NOT_RUN | — | Run after executable plan tasks are added. |
| `npm run validate:multiplatform` | NOT_RUN | — | Run after scope and evidence matrix reconciliation. |
| ERP JSON/SVG/link check | NOT_RUN | — | Run after final document edits; not runtime evidence. |

| `npm test -- src/test/catalog/catalog-adapter.test.ts src/test/erp/product-record-pages.test.tsx src/test/erp/product-sku-manager.test.tsx src/test/erp/product-list-table.test.tsx` | PASS | `runs/MOD-CORE-20261024-001/07-build.md` | 4 files, 25 tests |
| `npm run typecheck` | PASS | `runs/MOD-CORE-20261024-001/07-build.md` | Both application and Node TypeScript projects |
| `npm run build` | PASS | `runs/MOD-CORE-20261024-001/07-build.md` | Build completed; existing large-chunk warning remains |
| `npm run i18n:check` | PASS | `runs/MOD-CORE-20261024-001/07-build.md` | No visible-text candidates |
| `npm run validate:delivery-ledgers` | PASS | `runs/MOD-CORE-20261024-001/07-build.md` | 8 ledgers checked |
| `supabase db lint --local` | BLOCKED | `runs/MOD-CORE-20261024-001/07-build.md` | Local PostgreSQL unavailable at `127.0.0.1:54322`; do not deploy remotely |
| `npm run validate:module-runs` | FAIL (pre-existing run state) | `runs/MOD-CORE-20261024-001/07-build.md` | Existing visual-design checkpoint contains `not_run` entries and completed phases lack the required visual-design approval |
| Authenticated UI journey | NOT_RUN | `runs/MOD-CORE-20261024-001/07-build.md` | Deep link returns HTTP 200, but this does not establish authenticated behavior or mobile-web parity |
