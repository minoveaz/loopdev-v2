# Platform evidence matrix

| Capability/operation | Domain parity | Desktop renderer/action | Mobile renderer/action | iOS | Android | Status | Owner | Gap/next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `erp.visual-composition` | Not applicable: visual source only | Five approved conceptual light-theme wireframes use current HSL tokens, shared sidebar/card treatments and current navigation labels; no app-runtime screenshot | Five responsive compositions, including dedicated category tree/detail; no operation-level runtime evidence | Planned, no evidence | Planned, no evidence | PARTIAL | ERP product owner | Conceptual approval recorded 2026-10-24; after implementation capture runtime screenshots and compare at desktop/tablet/mobile |
| `erp.overview.read` | Partial: current page reads catalog adapter; no page-level renderer test | Implemented in source at `/app/erp/overview`; loading/error handling not explicit | Route responsive; operation-level evidence missing | Planned, no evidence | Planned, no evidence | PARTIAL | ERP product owner pending | Add explicit loading/error/forbidden/offline feedback and focused renderer tests; verify desktop/mobile behavior |
| `catalog.list` (Products list compatibility operation) | Partial: typed adapter, local test; remote path exists but no runtime proof | Implemented under legacy `/app/erp/product-catalog`; target `/app/erp/products` is not implemented | Missing operation-level evidence; same route is not proof | Planned, no evidence | Planned, no evidence | PARTIAL | ERP product owner pending | Define aggregate product/service query across legacy grouping, then verify desktop/mobile actions and remote runtime |
| `catalog.manage` (Products manage compatibility operation) | Partial: local CRUD adapter tests; remote CRUD path/schema exists | Implemented under legacy page; no page-level runtime evidence | Missing operation-level evidence | Planned, no evidence | Planned, no evidence | PARTIAL | ERP product owner pending | Verify create/edit/archive/delete semantics on both web surfaces; preserve IDs during route/module migration |
| `catalog.categories.list` (proposed category-tree read operation) | Missing: no category entity/tree contract | Missing | Missing | Planned, no evidence | Planned, no evidence | NOT_TESTED | ERP product owner pending | Define category model and authorization in `02-domain`/`03-access`; preserve Products route semantics |
| `catalog.categories.manage` (proposed category-tree management operation) | Missing: no category entity/tree CRUD contract | Missing; dedicated management view is conceptual only | Missing; stacked tree/detail view is conceptual only | Planned, no evidence | Planned, no evidence | NOT_TESTED | ERP product owner pending | Category lifecycle is defined in `02-domain`; define authorization in `03-access`, add operation parity tests, and do not treat the wireframe as implemented behavior |
| `catalog.read-availability` (legacy product availability operation) | Partial locally; Supabase adapter returns an empty list | Source surface exists but remote read is stubbed | Missing operation-level evidence | Planned, no evidence | Planned, no evidence | PARTIAL | ERP product owner pending | Resolve Products contract gap and verify remote persistence |
| `channel.connect` / `channel.sync_approved_data` | Missing: no Shopify connector contract/runtime found | Missing | Missing | Planned, no evidence | Planned, no evidence | NOT_TESTED | Product + MiauCraft owner | Discover source-of-truth and integration operations before design |
| `commerce.order.manage` | Missing: no ERP order module found | Missing | Missing | Planned, no evidence | Planned, no evidence | NOT_TESTED | ERP/Inhand owner | Later phase after MiauCraft pilot and order lifecycle approval |
| `inventory.single_warehouse.manage` | Missing: no ERP stock module found | Missing | Missing | Planned, no evidence | Planned, no evidence | NOT_TESTED | ERP/Inhand owner | Later phase; define movement/reservation semantics |
| `payment.coordinate` | Missing: no Inhand payment provider integration found | Missing | Missing | Planned, no evidence | Planned, no evidence | NOT_TESTED | ERP/Inhand owner | Select provider and define callback/idempotency contract; no card data in LoopDev |

`PASS` requires verified domain, renderer and operations on every required
platform. A shared port, a visible section or a registered route alone does not
prove action parity.

## Runtime snapshot

| Field | Value |
| --- | --- |
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Checkout type | branch |
| Branch and HEAD | `feature/erp-core-capabilities` / `cb2b35d30c87f7b3d4e42fbfcc1fe9390f624387` |
| Working tree | ERP implementation artifacts are untracked under `docs/implementation/erp/`; no production code changes |
| Desktop URL/port | Not started; no runtime evidence for this visual gate |
| Mobile URL/port | Not started; no runtime evidence for this visual gate |
| Validation timestamp | 2026-10-24 |

## Validation commands

| Command | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Source and route inspection | PASS | `discovery.md` | Source presence is recorded separately from runtime behavior |
| Official benchmark source review | PASS | `discovery.md`, external source register | Odoo, Microsoft Learn and SAP Learning first-party pages reviewed 2026-10-24 |
| Visual source and view/state coverage | PARTIAL | `visual-design.md`, `view-state-matrix.md`, `wireframes/` | Attempt 2 was rejected for visual mismatch; five revised static SVGs include the dedicated category view and received conceptual approval on 2026-10-24. They are not runtime evidence; post-implementation comparison remains pending. |
| `npm run delivery:validate` | PASS | `Module run validation passed: 100 checkpoint file(s) checked (36 archived legacy record(s)).` | Re-run after the category-management view and attempt-5 checkpoint updates. |
| `npm run validate:delivery-ledgers` | PASS | `Delivery ledger validation passed: 8 ledger(s) checked.` | ERP product-category capability is recorded as a new append-only ledger ID. |
| `npm run validate:multiplatform` | PASS | `Multiplatform delivery validation passed.` | Platform scope remains desktop/mobile web required; iOS/Android planned. |
| ERP JSON/SVG/link check | PASS | Five ERP JSON files parsed; five SVGs parse as XML; all local Markdown links resolve. | This syntax/link check is not runtime evidence; no app runtime was started. |
