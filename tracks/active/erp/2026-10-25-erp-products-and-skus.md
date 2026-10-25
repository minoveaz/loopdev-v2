---
id: erp-products-and-skus
title: ERP Products and SKUs
status: active
created: 2026-10-25
updated: 2026-10-25
owner: erp
lead: "@loopdev-io"
branch: feature/erp-core-capabilities
branches:
  - feature/erp-core-capabilities
phase: 0
pull_requests: []
issues:
  - 39
packages: []
release: not-required
areas: [erp, products, catalog, categories, media, multiplatform]
dependencies:
  - loopdev-v2-multiplatform-foundation
blocked_by:
  - "Platform/DB owner @loopdev-io approved append-only audit semantics, six-month active retention, a default-off DB-enforced kill switch, and immutable-snapshot/forward-only recovery. Implementation and atomicity tests remain gated by AUDIT-SECURITY-001. The kill switch is not implemented; do not assume remote writes are disabled or test live writes."
  - "Authorized legacy-data access and full deployed ERP RLS/cost-policy state are unavailable; keep product-data migration/cutover blocked. Product-media Storage policies alone have been verified remotely."
  - "The isolated Storage-policy pgTAP suite passes 19/19; broader tenant/cost/RLS/audit/recovery security criteria remain incomplete."
  - "Mobile web shares the responsive web route, but viewport-level operation parity remains unverified. The missing route in the native mobile app is not a blocker because iOS/Android are deferred for this release."
supersedes: []
run_ids:
  - MOD-CORE-20261024-001
product_docs:
  - docs/06-product/products/PRODUCT_CATALOG_GLOBAL_TRACK.md
implementation_docs:
  - docs/implementation/erp/core/
---

# ERP Products and SKUs

## Objective

Deliver the approved first-release Products capability for desktop web and
mobile web: products and separately managed SKUs, generated immutable
identifiers, hierarchical categories, commercial records, unit purchase-cost
references, physical attributes and reusable product/SKU media.

## Approved scope

The Product Owner approved `docs/implementation/erp/core/implementation-plan.md`
and `delivery-ledger.json` on 2026-10-25. The plan was approved; attempt 10
later invalidated its current workflow handoff pending artifact revalidation
and renewed gate approvals. Build
started with `AUDIT-ENV-001`; the environment, Platform-reuse and legacy
behavior audits are done. The Product Owner then approved extending the shared
Platform Files contract for the gallery. A read-only security review found
that the new Storage migration broadened non-product file writes to any active
organization member. Forward-only corrections were applied to
`loopdev-platform-dev`: non-product Files retain their prior authorization,
product-media reads/writes use catalog permissions, authenticated product-media
deletion is denied, and explicit authenticated table grants match the deployed
grant state. Remote queries confirmed migration history, policies and grants.
The isolated pgTAP suite passes 19/19; the full security audit still has
additional open criteria.
The ledger is approved with 25 ready tasks, 8 blocked tasks and 8 completed
tasks. Its approval-stage validation scopes operation coverage to
`REQUIRED_MVP`.

### Workflow recovery

Attempt 10 recorded `ADAPTER-MODE-001` as done with test evidence, then the
delivery CLI detected changed `scope`, `design`, `code` and `tests`
fingerprints while resolving superseded run-level blocker records. It
invalidated the prior phase checkpoints and design, visual-design, plan,
verification and release approvals. The phase index below is historical, not
a current valid handoff. Revalidate the canonical artifacts and obtain the
required approvals before starting further work. No other task is eligible
until the recovery is resolved.

Shopify synchronization, Inhand storefront/orders/payments, suppliers, sales
transactions, procurement, inventory, finance, native apps, permanent
deletion, accounting valuation and offline remote cache/queue remain out of
scope.

The implementation phase is tracked in
[issue #39](https://github.com/minoveaz/loopdev-v2/issues/39). Discovery issue
#36 remains open until Product/Platform acceptance evidence is complete.

## Execution gates

- Implement product media through the approved shared Files contract; do not
  add a module-local upload/preview path or start a task whose status is
  `blocked`.
- Preserve task dependencies and attach evidence before marking a task done.
- Do not start `PLATFORM-FILES-001` until `AUDIT-SECURITY-001` is complete; remote
  Storage policy inspection alone does not satisfy the full audit.
- Do not start tasks whose status is `blocked`; preserve task dependencies and
  separate deferred capabilities from first-release scope.
- Keep Product data writes and data migrations disabled until Platform
  audit/Files contracts, full deployed RLS verification and authorized
  legacy-data review pass. Policy-only security corrections may be applied
  under their separately approved scope.
- Reuse Platform Files and shared UI contracts; do not add module-local upload,
  preview, audit or permission systems.
- Verify desktop and mobile web separately. A passing build or source file is
  not behavioral evidence.
- Keep issue #36 open until its required Product/Platform acceptance evidence
  is complete.

## Canonical artifacts

- Plan: `docs/implementation/erp/core/implementation-plan.md`
- Executable ledger: `docs/implementation/erp/core/delivery-ledger.json`
- Run/checkpoints: `docs/implementation/erp/core/runs/MOD-CORE-20261024-001/`
- Main discovery issue: [minoveaz/loopdev-v2#36](https://github.com/minoveaz/loopdev-v2/issues/36)
