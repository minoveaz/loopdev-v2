# Implementation Documentation

This directory contains the versioned execution record for implementing
LoopDev modules. It must not replace product specifications.

## Documentation governance cleanup

Delivery runs must read
`docs/03-platform/governance/V2_DOCUMENTATION_SOURCE_OF_TRUTH.md` before product or
platform references. Proposed `SAAS_*` documents are non-runtime context only;
archived material is traceability only. A run must pause when authority or
implementation evidence is ambiguous.

## Source-of-truth boundaries

| Concern | Canonical location |
|---|---|
| Product, domain and UX definition | `docs/06-product/<suite>/<module>/` |
| Implementation plan and phase evidence | `docs/implementation/<suite>/<module>/` |
| Cross-phase execution state | `docs/implementation/<suite>/<module>/runs/<run-id>/` |
| Long-running work and dependencies | `tracks/active/<area>/<track>.md` |
| Executable work units and acceptance | GitHub issues |
| Code and tests | `src/`, `public/`, `scripts/` and repository configuration |

The implementation documentation compares what was built against the
approved product definition. It must link back to the relevant product
documents instead of copying them.

## Module implementation layout

```text
docs/implementation/<suite>/<module>/
├── README.md
├── implementation-plan.md
├── architecture-design.md
├── visual-design.md
├── view-state-matrix.md
├── requirement-evidence-matrix.md
├── delivery-ledger.json
├── platform-scope.md
├── platform-evidence-matrix.md
└── runs/
    └── <run-id>/
        ├── run.json
        ├── 00-discovery.json
        ├── 01-design.json
        ├── 02-domain.json
        ├── 03-access.json
        ├── 04-api.json
        ├── 05-sync.json
        ├── 06-plan.json
        ├── 07-build.json
        ├── 08-verify.json
        ├── 09-review.json
        └── 10-git.json
```

The `delivery` agent creates this workspace before the first skill runs.
`module-design` is the first skill to populate its module-specific content.
For example, CRM Pipeline uses
`docs/implementation/crm/pipeline/`. Skills must reuse this workspace and
must not create alternative flat roots.

Use the templates in `docs/implementation/_templates/`.

## Executable delivery runs

The delivery lifecycle is intentionally append-only: it never resets, amends,
force-pushes or overwrites an existing run.

```bash
npm run delivery:init -- --suite crm --module Contacts
npm run delivery:start-phase -- --suite crm --module Contacts --run MOD-CONTACTS-YYYYMMDD-001 --phase 00-discovery --skill module-discovery
npm run delivery:complete-phase -- --suite crm --module Contacts --run MOD-CONTACTS-YYYYMMDD-001 --phase 00-discovery --data path/to/completion-data.json
npm run delivery:handoff -- --suite crm --module Contacts --run MOD-CONTACTS-YYYYMMDD-001 --from 00-discovery --to 01-design
npm run delivery:validate
npm run validate:delivery-ledgers
npm run report:delivery-ledgers
npm run delivery:report
npm run delivery:resume -- --suite crm --module Contacts --run MOD-CONTACTS-YYYYMMDD-001 --reason "Resolved blocker"
```

Runs persist fingerprints for product, design, plan, contracts, code and tests,
explicit approval records, and invalidated phases. Changed inputs invalidate
dependent phases and approvals. Approvals identify actor, role, artifact,
fingerprint and source; they are never inferred from status or source presence.

`npm run validate:contracts` checks stable IDs, action catalogs, labels,
validation/navigation metadata and renderer imports. `npm run smoke:routes`
checks the deterministic desktop/mobile route manifest; checks marked
`runtime_dependent` still require runtime evidence in the platform matrix.

Every module must include `architecture-design.md`. It is the structural
baseline for layer boundaries, responsibilities, dependencies, refactors and
technical debt, and is linked from the design, plan, checkpoints, evidence
matrix and review issue.

Every module must also include `visual-design.md` and `view-state-matrix.md`.
These Markdown files are the normative visual source: they define wireframes,
visual states, responsive breakpoints, accessibility, Rivera/shared LoopDev
primitive reuse and open decisions. SVG or other visual artifacts are review
evidence only and must link back to the Markdown source; they do not replace
the source or constitute visual approval.

The operational JSON templates are:

- `MODULE_RUN_TEMPLATE.json`;
- `MODULE_CHECKPOINT_TEMPLATE.json`;
- `delivery-ledger.json`.

Historical run records that cannot be upgraded without inventing missing
fingerprints, approvals, or phase metadata may be preserved as schema version
`0` by setting `legacy_schema_reason` on the manifest and its checkpoints. These
records remain archival evidence, not current approval or release evidence;
new work must use schema version `1`, which is validated against the canonical
workflow.

## Issue and track linkage

Every implementation track must link:

```text
product specification
  → implementation track
  → phase issues
  → checkpoints and evidence
  → commit
  → pull request
```

Issues represent executable work. A phase issue may close only when its
acceptance criteria, evidence links and traceability checkpoint are complete.
Closing an issue is not a substitute for the final module review.

## Review rule

`module-verify` compares implementation documentation, source evidence and
the product definition under `docs/06-product`. Any requirement without
evidence is `PARTIAL`, `FAIL` or `NOT_TESTED`; it cannot be silently inferred
from the existence of source files.
