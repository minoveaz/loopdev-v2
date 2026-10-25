# Phase 02 — Products domain model

## Attempt 13 — Revalidation after design and visual refresh

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:02-domain` |
| Parent phase | `01-visual-design` (attempt 13, completed and reapproved) |
| Status | `completed` (analysis outcome: `partial`) |
| Environment | `feature/erp-core-capabilities`, HEAD `2e7faf367aa0b13a735492e9878390cc7e5a3621`; no production or remote database changes |

Rechecked the domain model against the refreshed design, discovery, visual
scope, current source contracts and the delivery ledger. Product/category
ownership, generated identities, independent SKU categories, sourcing,
archive/restore behavior, purchase-cost ownership, physical-attribute units,
reusable media assignments and manual gallery ordering remain unchanged.
Current route registration and explicit adapter-mode selection do not alter
domain semantics. Shared audit semantics and Platform Files reuse are approved;
their mutation integration, metadata enforcement, retention and deployed-state
evidence remain implementation/security gates outside this phase.

| Validation | Result |
|---|---|
| `npm run validate:delivery-ledgers` | Passed: 8 ledgers |
| `npm run validate:multiplatform` | Passed |
| `git diff --check` | Passed |

No domain decisions were expanded or silently resolved. Legacy category and
workspace mapping, media metadata/retention, cost history/precision, physical
attribute activation criteria and authorized deployed-data review remain open.

## Attempt 11 — Revalidation after refreshed discovery

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:02-domain` |
| Parent phase | `01-visual-design` (attempt 11, completed) |
| Status | `completed` (analysis outcome: `partial`) |
| Environment | `feature/erp-core-capabilities`, HEAD `2e7faf367aa0b13a735492e9878390cc7e5a3621`; no code, schema or remote data changes |

Rechecked the approved entity model and lifecycle against the refreshed
discovery, approved Products/SKU/media visual scope and current source
contracts. No domain decision changed: product/category ownership, SKU-specific
categories, archive-only semantics, cost and measurement ownership, reusable
media assignments and manual gallery ordering remain as recorded in
`domain-model.md`. The missing runtime adapter mode and local-demo tenant
mismatch are implementation/runtime blockers, not new domain rules.

| Validation | Result |
|---|---|
| `npm run test:delivery` | Passed: 34 tests |
| `npm run validate:delivery-ledgers` | Passed: 8 ledgers |
| `npm run validate:multiplatform` | Passed |

Open domain questions remain: reviewed legacy category mapping and workspace
provenance, shared Files tag/retention ownership, cost history and currency
precision, physical-attribute activation requirements, and deployed-schema /
authorized-data evidence. No migration or remote write is authorized by this
revalidation.

## Identity

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:02-domain` |
| Skill | `domain-model` |
| Parent phase | `01-visual-design` |
| Track | ERP Core |
| Issue(s) | #36 |
| Status | `completed` (analysis outcome: `partial`) |

## Objective

Define Products and product-category domain semantics, reconcile approved
product decisions with the catalog baseline, and make unresolved rules
actionable for the access/API/sync phases without implementing production
behavior.

## Inputs

- `design.md`, `architecture-design.md`, `discovery.md` and
  `delivery-ledger.json`
- Approved conceptual visual gate and `view-state-matrix.md`
- `src/loopdev/domains/catalog/types.ts` and local catalog adapter/stores
- `supabase/migrations/20260928160000_erp_catalog_foundation.sql`
- `src/test/catalog/catalog-adapter.test.ts`
- `docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md`

## Actions

- Recorded confirmed, assumed and open product/category rules separately.
- Mapped entities, relationships, lifecycles, invariants, commands and
  proposed domain events.
- Added per-entity ownership, fixture, migration identity, deletion and
  cross-module-event continuity notes.
- Compared legacy types, category keys, SQL constraints, cascades and adapter
  behavior with the approved Products model.
- Kept implementation, access, API and sync decisions outside this phase.

## Outputs

- `domain-model.md`
- `runs/MOD-CORE-20261024-001/02-domain.json`

## Acceptance criteria

- [x] Product/category entities and relationships are documented.
- [x] Lifecycle, invariants, commands and proposed events are documented.
- [x] Current implementation conflicts and migration identities are evidenced.
- [x] Unresolved choices remain explicit and are handed to dependent phases.
- [x] No production code, schema, tests, routes or runtime data were changed.

## Validation evidence

| Command or check | Result | Evidence path/link |
|---|---|---|
| `npm run delivery:validate` | passed; 101 checkpoint files checked | CLI output |
| `npm run validate:delivery-ledgers` | passed; 8 ledgers checked | CLI output |
| `npm run validate:multiplatform` | passed | CLI output |
| `npm run test:delivery` | passed; 27 tests | CLI output |
| Python ERP JSON/SVG/Markdown-link check | passed; 6 JSON, 5 SVG, all local links resolve | CLI output |

## Environment

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Branch | `feature/erp-core-capabilities` |
| HEAD | `cb2b35d30c87f7b3d4e42fbfcc1fe9390f624387` |
| Runtime URL | None |
| Runtime port | None |

## Decisions, failures and handoff

- Decisions: `DOM-ERP-001`–`014` and `DOM-ERP-017`–`018` confirmed;
  `DOM-ERP-015` and `DOM-ERP-016` remain open for mapping legacy category keys
  and ownership of locale/channel fields. Currency belongs to each
  `PriceBook`, each price entry inherits its book's currency, and offers have
  no independent currency. Legacy `service` maps
  to Service; `physical_product`, `digital_product`, `subscription`,
  `coverage`, `package` and `fee` remain drafts until explicit review.
  `OrganizationCatalog` is retained
  only as legacy migration input, not as a target business entity or product
  ownership boundary; its currency maps to PriceBooks, while destination
  ownership for locale and channel fields remains open. Finished products allow
  buy/make/both sourcing; raw materials/components are buy-only for now;
  services have no sourcing value. Revisit raw-material sourcing during
  Manufacturing discovery. Ambiguous legacy class values are never guessed:
  they remain drafts until reviewed; any later class assignment is explicit.
  Organization-wide product/category scope and independently assigned
  category ownership for each SKU, with category required before activation,
  archive-preserves-assignments, no-permanent-category-delete, restore-if-
  parent-active, subtree-preserving reparenting, blocking parent archival while
  active children remain, organization-wide SKU uniqueness and generated
  organization-unique product/variant/category keys were confirmed
  by the user on 2026-10-24. SKU comparison ignores leading/trailing
  whitespace and letter case; stored SKU values preserve entered case after
  trimming.
  Details and evidence are in `domain-model.md`.
- Detected failure: None.
- Likely origin: Not applicable.
- Next handoff: `03-access`; enforce organization-wide scope and treat legacy
  workspace IDs as an explicit migration constraint.

---

## Attempt 7 — Approved media, cost and physical-attribute scope

### Identity

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:02-domain` |
| Skill | `domain-model` |
| Parent phase | `01-visual-design` |
| Issue | #36 |
| Status | `completed` (analysis outcome: `partial`) |
| Branch / HEAD | `feature/erp-core-capabilities` / `2e7faf367aa0b13a735492e9878390cc7e5a3621` |
| Runtime | Not started; no runtime evidence was claimed |
| Validation timestamp | `2026-10-25T10:40:05Z` |

### Objective and inputs

Reconcile the Products domain with the approved product-media scope, the
approved visual addendum, the Product Owner's cost-per-purchasable-unit and
currency choices, and physical-attribute ownership/units. Inputs include the
current `discovery.md`, `design.md`, `visual-design.md`, `domain-model.md`,
catalog/media/file source, related migrations, focused tests and Platform
Files references.

### Decisions and domain outcomes

- Confirmed that a product without separately managed SKUs owns its optional
  purchase-cost reference; when SKUs exist, each purchasable SKU has an
  independent optional value and does not inherit a product value.
- Confirmed each cost reference carries its own ISO currency, has no automatic
  conversion and does not inherit a sales PriceBook currency. Currency-specific
  amount precision remains an API/persistence concern.
- Confirmed physical values belong to the managed unit (product without SKUs,
  otherwise each SKU), without inheritance; weight is in kg and dimensions in
  cm for this release.
- Confirmed alt text is contextual to the product/SKU assignment; the shared
  Platform File remains reusable and is not copied into Products.
- Added `ProductCostReference`, `ProductPhysicalAttributes`,
  `ProductMediaAsset` and `ProductMediaAssignment` semantics, relationships,
  lifecycle assumptions, migration identity and proposed domain events.
- Recorded current conflicts: product cost UI only writes product-level data;
  the library picker is not exposed by the gallery; there are no image
  renditions; media SQL currently cascades and exposes physical delete paths;
  shared file policy and tag ownership need Platform/access reconciliation.

### Open decisions and risks

- The exact cost history/source requirement is not confirmed; current-value
  only is recorded as an assumption, with sensitive changes audited.
- Product media asset/tag ownership, detached-assignment retention and shared
  file archival/purge require a Platform-approved contract.
- Activation requirements for physical values and currency-specific decimal
  precision must be specified in dependent access/API work.
- Category mapping, legacy workspace expansion, deployed schema state and an
  authorized data dry run remain blocked by external evidence/access.

### Validation and evidence

| Command or check | Result | Evidence |
|---|---|---|
| `npm run delivery:validate` | Passed | 108 checkpoint files checked; 36 archived legacy records |
| `npm run validate:delivery-ledgers` | Passed | 8 ledgers checked |
| `npm run validate:multiplatform` | Passed | Multiplatform delivery validation passed |
| `npm run validate:module-runs` | Passed | 108 checkpoint files checked; 36 archived legacy records |
| `npm run test:delivery` | Passed | 30 tests passed |
| Inline Python ERP JSON/SVG/Markdown-link check | Passed | 10 run JSON files, 12 wireframes, 20 Markdown documents |
| `git diff --check` | Passed | No whitespace errors |

Source evidence includes
`src/loopdev/domains/catalog/media/types.ts`,
`src/loopdev/domains/catalog/adapter/product-media-local.ts`,
`src/loopdev/domains/catalog/adapter/product-media-supabase.ts`,
`src/loopdev/domains/catalog/adapter/local.ts`,
`src/loopdev/domains/catalog/adapter/supabase.ts`,
`src/loopdev/pages/erp/ProductMediaGalleryManager.tsx`,
`src/loopdev/pages/erp/ProductRecordPages.tsx`,
`supabase/migrations/20261024180000_erp_product_details_and_references.sql`,
`supabase/migrations/20261025100000_erp_product_media_library.sql`, and
`src/loopdev/domains/files/types.ts`.

### Handoff

**Status: `partial`.** Product, category, media, cost and physical-attribute
semantics are reconciled to current approvals. Access analysis is recorded in
`03-access`; Platform review of shared Files, cost permissions, RLS, retention
and the append-only audit prerequisite remains necessary. This analysis did
not change production code, schema, tests or remote data.

### Product Owner follow-up — `DOM-ERP-031`

At `2026-10-25T10:48:59Z`, the Product Owner confirmed: “Sí, permitir orden
manual”. Each product/SKU gallery therefore supports multiple assignments
with an explicit order scoped to that target. Reordering changes assignments
only; it does not move or duplicate the reusable organization asset. The
contract is included in the active API phase.
