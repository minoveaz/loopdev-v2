# Phase 02 — Products domain model

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
