# Platform evidence matrix

| Capability/operation | Domain parity | Desktop renderer/action | Mobile renderer/action | iOS | Android | Status | Owner | Gap/next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `erp.visual-composition` | Not applicable: visual source only | Conceptually approved full-page product/SKU forms and record, dedicated categories view, reference drawers; no runtime screenshot | Responsive page compositions and quick drawer; no operation-level runtime evidence | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Revised conceptual approval recorded 2026-10-24; compare runtime after implementation |
| `erp.overview.read` (navigation compatibility; not MVP capability) | Partial: current page reads catalog adapter; no renderer test | Implemented in source at `/app/erp/overview`; loading/error is incomplete | Responsive route; operation evidence missing | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Decide redirect/compatibility behavior in route audit; do not expand scope into dashboard work |
| `catalog.list` (Products list compatibility operation) | Partial: typed adapter/local test; remote path exists but no runtime proof | `/app/erp/products` is wired to the aggregate Products view; authenticated runtime/action evidence pending | Missing operation-level evidence; same route is not proof | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Verify organization-wide aggregation, authentication and desktop/mobile operation behavior |
| `catalog.manage` (legacy aggregate mutator) | Conflicts: local CRUD tests exist; adapters expose physical deletion and lack version/audit | Legacy page exists; no page-level runtime evidence | Missing operation-level evidence | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Replace delete with archive/restore and verify permissions, version, audit, errors and route behavior |
| `catalog.offers.list/manage` | Partial: local/remote adapter and SQL fields exist; runtime and archive parity unverified | Legacy commercial UI exists | Missing operation-level evidence | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Enforce `catalog.read` visibility and `catalog.write` mutations; PriceBook owns currency |
| `catalog.price-books.list/manage` | Partial: adapter/schema exists; no runtime or page-level proof | Legacy commercial UI exists | Missing operation-level evidence | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Verify currency, archive/restore, versions, permissions and desktop/mobile parity |
| `catalog.price-entries.list/manage` | Partial: adapter/schema exists; legacy entry currency conflicts with approved PriceBook ownership | Legacy commercial UI exists | Missing operation-level evidence | N/A (deferred) | N/A (deferred) | PARTIAL | @loopdev-io | Validate reference combinations and currency inheritance; keep sales prices distinct from purchase-cost reference |
| `catalog.cost-reference.read/manage` | Missing: concept approved, domain/access/API/sync contracts need reconciliation | Full-page cost section is conceptual; permission enforcement missing | Full-page cost section is conceptual; permission enforcement missing | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io | Define currency, product/SKU ownership, dedicated visibility permission and audit before build; no `catalog.read` inheritance |
| `catalog.categories.list` | Missing: no category entity/tree contract | Missing | Missing | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io | Implement approved model, authorization and operation parity tests |
| `catalog.categories.manage` | Missing: no category entity/tree CRUD contract | Missing; dedicated view is conceptual | Missing; stacked tree/detail view is conceptual | N/A (deferred) | N/A (deferred) | NOT_TESTED | @loopdev-io | Implement archive/restore/reparent rules, generated keys and focused desktop/mobile tests |
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
| Branch and HEAD | `feature/erp-core-capabilities` / `0024978c4c92097cf295313864e4eadb4e810aba` |
| Working tree | Documentation changes in progress under `docs/implementation/erp/core/`; no production code changes |
| Desktop URL/port | `http://localhost:8080`; server responds, but unauthenticated route redirects to `/pages/login`; no authenticated UI evidence |
| Mobile URL/port | `http://localhost:8080`; responsive behavior not yet verified |
| Validation timestamp | 2026-10-24T19:24:00+02:00 |

## Validation commands

| Command | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Source and route inspection | PASS | `discovery.md` | Source presence is recorded separately from runtime behavior |
| Official benchmark source review | PASS | `discovery.md`, external source register | Odoo, Microsoft Learn and SAP Learning first-party pages reviewed 2026-10-24 |
| Visual source and view/state coverage | PARTIAL | `visual-design.md`, `view-state-matrix.md`, `wireframes/` | Revised full-page product/SKU and record compositions, reference drawer and category view received conceptual approval on 2026-10-24. They are not runtime evidence; post-implementation comparison remains pending. |
| `npm run delivery:validate` | NOT_RUN | — | Run after checkpoint reconciliation. |
| `npm run validate:delivery-ledgers` | NOT_RUN | — | Run after executable plan tasks are added. |
| `npm run validate:multiplatform` | NOT_RUN | — | Run after scope and evidence matrix reconciliation. |
| ERP JSON/SVG/link check | NOT_RUN | — | Run after final document edits; not runtime evidence. |
