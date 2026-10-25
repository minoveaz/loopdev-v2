# ERP Products and SKUs — Implementation Plan

## Approval and scope

| Field | Value |
|---|---|
| Run | `MOD-CORE-20261024-001` |
| Product definition | `discovery.md`, `design.md`, `domain-model.md` |
| Main issue | [minoveaz/loopdev-v2#36](https://github.com/minoveaz/loopdev-v2/issues/36) |
| Plan status | Approved by the Product Owner on 2026-10-25; only ledger tasks marked `ready` may start, subject to dependencies |
| Visual status | Product/SKU and media compositions approved conceptually; runtime comparison remains open |
| Delivery ledger | `delivery-ledger.json` is the executable source of task status and dependencies |

The user-requested scope is to close the first-release Products capability:
products, separately managed SKUs, generated identifiers, hierarchical
categories, offers/sales prices, per-unit purchase-cost references, physical
attributes and reusable product/SKU imagery. Desktop web and mobile web are
required. Approval authorizes implementation only within the approved scope and task
dependencies. It does not authorize remote writes, migrations, deployment or
changes outside this scope; the owner/data/runtime blockers below remain gates.

Excluded: Shopify synchronization, Inhand storefront/orders/payments,
suppliers, sales transactions, procurement, inventory, finance, native apps,
exports, permanent deletion, accounting valuation, margin calculation and
offline remote cache/queue.

## Environment baseline

| Field | Value |
|---|---|
| Repository | `/Users/minoveaz/.copilot/repos/loopdev-v2` (`minoveaz/loopdev-v2`) |
| Checkout | In-place branch checkout |
| Branch / base | `feature/erp-core-capabilities` / `develop` |
| HEAD | `2e7faf367aa0b13a735492e9878390cc7e5a3621` |
| Working tree | Existing documentation and wireframe changes; no production-code or migration edits in this planning pass |
| Runtime | `http://localhost:8080/app/erp/products` returned HTTP 200; SPA response only, no authenticated interaction evidence |

## Current-state inventory

| Area | Verified baseline | Planned consequence |
|---|---|---|
| Routes and shell | `/app/erp/products` is wired; legacy `/app/erp/product-catalog[/:catalogId]` remains. Authenticated and mobile journeys are not verified. | Preserve deep-link compatibility; verify routes and operations on both required web surfaces. |
| Catalog | Local and Supabase adapters and product/SKU UI exist. Adapter selection is inferred from organization-ID shape. | Add explicit `local_demo`/`supabase` configuration; preserve `catalog.*` compatibility and CRM `catalog_item` references. |
| Identifiers | Numeric internal keys/SKUs have implementation and focused tests; issue #37 is task-scoped. Local PostgreSQL migration lint is unavailable. | Keep `ERP-IDENTIFIERS-001` blocked until its remaining migration validation and checkpoint evidence close; do not expand its task approval. |
| Categories | Product/SKU records only have flat category references; no category tree entity, adapter or management view exists. | Build the organization-scoped category lifecycle, assignment and tree operations. |
| Media | Upload/gallery components, adapters and migration exist. Current adapter writes Storage/`platform_files` directly; shared Files relationship, authorization, finalization, renditions and cleanup contracts are incomplete. Gallery has no persisted position/version or atomic reorder. | Reuse/extend Platform Files first; keep file bytes, preview URLs and lifecycle out of Products; then add versioned assignments and atomic reorder. |
| Cost and physical data | Product-level cost UI/adapter exists; SKU cost flow and separate cost permission enforcement are incomplete. Physical attributes are not fully represented across the current contracts. | Use the approved per-purchasable-unit cost policy and `catalog.cost.read/manage`; keep costs out of ordinary product projections. Add physical fields to the owning product or SKU without inheritance. |
| Access and audit | Existing SQL has broad legacy policies and a documented read-only-delete risk. Cost permissions are absent from current shared permission types/RLS. Platform append-only audit is not available as a generic approved contract. | No remote writes until Platform audit, operation-specific RLS and authorized deployed-state verification pass. |
| Local persistence and sync | `storage.ts` suppresses persistence errors; adapter mode is implicit. Remote Products are online-only and must not fall back to fixtures. | Surface local-demo failures; keep remote mode online-only, fail closed and never queue or fall back. |
| Shared UI and Platform | Reusable Rivera/LoopDev page, form, Select, table, drawer, state, Files, Notes, Activity, Tasks, Relations and Document Intelligence contracts/components exist. Files currently models a singular relation; it does not provide the approved reusable Product media contract. | Complete the mandatory reuse audit. Reuse shared primitives/capabilities; require Platform approval before extending Files/audit; do not create local duplicates. |

## Target architecture

Keep dependency direction `presentation → application → domain → ports ←
adapters`. ERP Products owns product/SKU/category/commercial data and media
assignments. Platform owns organization/membership authorization, append-only
audit, file bytes, upload/finalization, previews, shared file metadata and
retention. CRM retains customer/relationship identity and stable
`catalog_item` references. Shopify/Inhand integrations remain deferred.

Classifications: Platform organization/access and UI primitives are `REUSE`;
shared Files and append-only audit are `EXTEND_PLATFORM` and blocked on their
owners; product, category, cost and assignment semantics are `MODULE_SPECIFIC`.
Notes, Activity, Tasks, Relations and Document Intelligence are reusable
contracts only when a separately approved Products interaction requires them;
this plan does not add collaboration or extraction UI.

### Suite interaction matrix

| Producer → consumer | Trigger/data | Permission boundary | Evidence |
|---|---|---|---|
| Products → CRM | CRM resolves stable legacy `catalog_item` product references. | `catalog.read` plus CRM record permission; no duplicate CRM product master. | Catalog/CRM regression tests and compatibility lookup. |
| Products → Platform Files | Product/SKU gallery uploads, lists, previews, reuses, attaches and detaches organization-owned files. | Products authorizes the association; Files independently authorizes bytes, previews and lifecycle. | Shared contract tests, cross-organization negative tests and both web renderers. |
| Products → Platform audit | Every successful remote mutation emits an append-only event in the same transaction, without sensitive values. | Server-derived actor and organization; audit failure aborts mutation. | Platform contract approval and atomicity/RLS tests. |
| Products → Notes/Activity/Tasks/Relations/Document Intelligence | No new first-release trigger is approved. | Existing Platform authorization applies if a future scope adds one. | No parallel implementation; future use requires a scoped change request. |
| Products → Shopify/Inhand | None in this release. | No channel credentials, public API or storefront operation. | Explicitly deferred in discovery and ledger. |

## Ordered work breakdown

The IDs below are authoritative in `delivery-ledger.json`. Every listed task is
in `07-build`, because the executable plan schema uses build tasks for ordered
audits and implementation work. Task-specific phase issues and an active ERP
track must be linked before any task starts; create/update them only after this
plan is approved.

### Required audits — all precede implementation

1. `AUDIT-ENV-001` — checkout, branch, commit, tree and runtime truth.
2. `AUDIT-REUSE-001` — inspect current UI/shell references and Notes, Files,
   Activity, Tasks, Relations and Document Intelligence contracts/consumers;
   classify reuse/extension/module-specific/blocker and identify duplicates.
3. `AUDIT-LEGACY-001` — map current catalog actions, routes, IDs, persistence,
   CRM consumers and behavior to preserve or retire.
4. `AUDIT-ROUTE-001` — direct URLs, navigation, refresh/back, guards, desktop
   and mobile runtime.
5. `AUDIT-STATE-001` — loading, empty, error, forbidden, conflict, offline,
   pending and success/recovery states.
6. `AUDIT-PARITY-001` — each declared operation against shared, desktop and
   mobile contracts; map every missing operation to an owner/task/test.
7. `AUDIT-A11Y-001` — keyboard/focus, portals, labels, screen readers,
   responsive behavior, touch targets, i18n and RTL.
8. `AUDIT-SECURITY-001` — tenant isolation, sensitive costs, file access,
   audit atomicity, RLS, flags and recovery.
9. `AUDIT-ARCH-001` — layers, boundaries, dependency direction, public
   contracts and forbidden imports.
10. `AUDIT-RESP-001` — UI/application/domain/port/adapter ownership, SRP,
    cohesion, coupling and duplication.
11. `AUDIT-REFACTOR-001` — before/after behavior, affected consumers, regression
    tests, rollback and residual-debt owner.

### Implementation sequence

After the audits: resolve Platform audit/Files contracts and typography;
reconcile explicit adapter mode and remote/deployed data truth; define the
Products shared contract; validate identifiers; implement operation-specific
RLS and the forward schema; implement domain/adapters; then deliver shared
semantics with separate desktop and mobile renderers for Products, categories,
media and cost. Finish with operation-level tests, authenticated route/state
journeys, authorized migration dry-run and rollback evidence.

The ledger contains task-level acceptance criteria, dependencies, affected
areas, risks, platform scope, validation commands and minimum evidence level.
Platform-owner, database-owner and authorized data-access work remains
explicitly `blocked`; no approval or test can be inferred from a migration
file or HTTP 200 response.

## Operation parity inventory

All required operations remain `missing` against the approved contract unless
the ledger explicitly records verified evidence. iOS/Android are deferred and
are not required platforms for this release.

| Capability | Required operations | Desktop web | Mobile web | Planned tasks |
|---|---|---|---|---|
| Products/SKUs and commercial records | `catalog.list`, `catalog.manage`, `catalog.variants.list`, `catalog.variants.manage`, `catalog.offers.list`, `catalog.offers.manage`, `catalog.price-books.list`, `catalog.price-books.manage`, `catalog.price-entries.list`, `catalog.price-entries.manage`, `catalog.identifiers.generate` | Existing implementation is partial; full contract `missing` | `missing` pending operation evidence | `PRODUCT-CONTRACT-001`, `PRODUCT-ADAPTER-001`, `PRODUCT-DESKTOP-001`, `PRODUCT-MOBILE-001` |
| Categories | `catalog.categories.list`, `catalog.categories.manage`, `catalog.categories.assign` | `missing` | `missing` | `PRODUCT-CONTRACT-001`, `PRODUCT-ADAPTER-001`, `CATEGORY-DESKTOP-001`, `CATEGORY-MOBILE-001` |
| Media | `catalog.media.library.list`, `catalog.media.upload`, `catalog.media.attach`, `catalog.media.metadata.manage`, `catalog.media.reorder`, `catalog.media.detach`, `catalog.media.preview` | Existing upload/gallery is partial; compliant operations `missing` | `missing` pending operation evidence | `PLATFORM-FILES-001`, `MEDIA-ADAPTER-001`, `MEDIA-DESKTOP-001`, `MEDIA-MOBILE-001` |
| Cost reference | `catalog.cost-reference.read`, `catalog.cost-reference.manage` | Existing product surface is partial; protected contract `missing` | `missing` | `PRODUCT-CONTRACT-001`, `PRODUCT-ADAPTER-001`, `COST-DESKTOP-001`, `COST-MOBILE-001` |

## Acceptance evidence

- Shared capability/DTO tests: entity lifecycle, generated immutable IDs/SKUs,
  category guards, PriceBook currency, physical-attribute ownership, sensitive
  cost projections, assignment/order versions and error semantics.
- Adapter/database tests: explicit mode; local persistence failure surfaces;
  no remote fallback; tenant equality; operation-specific RLS; no hard delete;
  atomic audit; idempotency and stale-version conflicts.
- Files tests: finalized-file requirement, upload/preview authorization,
  reusable associations, cross-organization rejection, failure recovery,
  signed URL expiry and safe retention/orphan handling.
- Renderer tests: focused component tests for every operation on desktop and
  mobile web using the same action catalog, validation and state contract.
- Runtime: authenticated direct/legacy routes, refresh/back/navigation,
  desktop and mobile viewport journeys, accessibility/i18n, forbidden/error/
  conflict/offline recovery, approved visual comparison and regressions for
  CRM/file consumers.
- Migration/release: authorized read-only deployed-state check, reviewed
  legacy inventory and dry-run, forward-only migration lint, counts/reconcile,
  feature flag/write kill switch and tested rollback/forward-recovery.
- Plan validation: `npm run validate:delivery-ledgers`,
  `npm run validate:multiplatform`, `npm run delivery:validate`,
  `npm run test:delivery`, JSON/SVG/link checks and `git diff --check`.

## Decisions and blockers

| Decision/blocker | Status | Owner / next action |
|---|---|---|
| Products/categories/media/cost scope and desktop/mobile web | Confirmed | Product Owner; this plan does not expand it. |
| Cost unit, currency and owner/admin-only separate permissions | Confirmed | Preserve the approved domain/access/API contracts; verify implementation and server enforcement. |
| Platform append-only audit contract and owner | Blocked | Platform owner must be assigned and approve atomicity, payload, redaction and failure behavior. |
| Platform Files authorization/finalization/preview/retention/renditions | Blocked | Platform owner must approve shared contract before media writes. |
| Deployed Supabase schema/RLS state | Blocked | Database owner must provide authorized read-only verification. |
| Legacy category/workspace/currency data and migration mapping | Blocked | Data owner must authorize inventory/dry-run and review mapping; do not infer. |
| Inter/JetBrains Mono design baseline vs Geist runtime | Open/blocked for visual parity | Platform owner must decide global reconciliation or approve a documented deviation; no ERP-only font fork. |
| Local PostgreSQL migration lint | Blocked | Start local database and run lint; no remote migration is authorized by this plan. |
| Existing visual approval | Confirmed conceptually | Runtime comparison remains required after implementation. |

**Plan state: approved; `07-build` is authorized only for ready tasks and in
dependency order.** The approval is recorded in
`runs/MOD-CORE-20261024-001/run.json`; the ledger keeps owner/data/environment
work explicitly blocked. Do not start blocked tasks, apply remote migrations,
enable remote writes, or close issue #36 until their separate gates and
acceptance evidence pass. The current delivery-ledger approval validator also
scopes required operation/task coverage to `REQUIRED_MVP` capabilities, so
deferred Shopify, Inhand and other ERP capabilities remain outside this
release. The prior approval-stage mismatch was corrected and covered by a
delivery regression test before starting the build phase.
