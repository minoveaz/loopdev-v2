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

The legacy standard profile creates this workspace before the first skill
runs. `module-design` is its first skill to populate module-specific content.
For example, CRM Pipeline uses
`docs/implementation/crm/pipeline/`. Skills must reuse this workspace and
must not create alternative flat roots.

Use the templates in `docs/implementation/_templates/`.

## Executable delivery runs

### Implementation-first (default for new code runs)

New `delivery:init` runs use `implementation-first`. This profile is for work
with approved scope: keep pre-build setup to the task ledger, implement code
and tests, run verification, and only then write
`implementation-report.md` with the results actually observed.

```bash
npm run delivery:init -- --suite crm --module Contacts
```

The only required pre-build workspace artifact is `delivery-ledger.json`.
Reuse the approved product decisions and existing plan; do not generate
discovery, architecture, visual, platform, track or per-phase issue documents
unless a concrete unresolved decision or risk requires one. Plan approval
authorizes the listed tasks; it does not prove their implementation.

The verification report maps each approved task to changed code, exact test
and build commands/results, verified behavior, platform coverage, gaps and
risks. It must be written after the tests pass. The review phase compares this
report to the code, tests and approved ledger.

### Opt-in supplier pilot

The experimental profile is limited to `erp/Proveedores`; it does not change
existing runs. Starting it requires a named, bounded slice. The following
initialization creates a draft run, not an approved supplier implementation:

```bash
npm run delivery:init -- --suite erp --module Proveedores --profile supplier-pilot --slice supplier-directory --platform-scope desktop_web,mobile_web
```

Its graph is discovery -> design -> prototype -> plan -> build -> verify ->
review -> Git. Domain/access/API/sync analysis remains required when relevant,
but is captured in plan decisions rather than separate phase reports.

Complete the prototype checkpoint, then record the user's combined scope and
visual approval with the existing `delivery:approve` command and gate
`visual_design`. Supply the exact relative artifact path, its actual SHA-256,
actor, role and approval source. The CLI rejects mismatched fingerprints.
Keep the approved semantic design in the existing design/visual documents.
Rendering-only refinements in code do not change this baseline; semantic
changes must update it and require approval again.

Plan completion data must include `prebuild_decisions` with non-empty
`domain`, `access`, `persistence`, `platform_reuse` and `rollback` decisions or
links to their canonical definitions. It still requires authorized ledger
tasks, acceptance criteria, contracts, dependencies and validation.
The ledger represents the current complete slice. A partially implemented
module-wide ledger is not a shortcut to slice release: strict operation
coverage and module-wide blockers remain enforced.

After completing build, feedback can reopen it without restarting discovery:

```bash
npm run delivery -- iterate --suite erp --module Proveedores --run MOD-PROVEEDORES-YYYYMMDD-001 --reason "Refine the approved interaction"
npm run delivery -- inspect --suite erp --module Proveedores --run MOD-PROVEEDORES-YYYYMMDD-001
```

Iteration preserves the previous checkpoint snapshot and combined product
approval, but withdraws acceptance/release/push/PR approvals. Update task
progress and collect evidence again. If semantic scope, design or contracts
changed, use `delivery:resume` and obtain the affected approval again.
Task status/evidence updates alone do not invalidate product scope; changed
task definitions invalidate the plan. Fingerprints still conservatively
include repository-wide code and tests; contracts are scoped to the
capabilities' declared `contract_refs`, including their shared dependencies.

Record acceptance with gate `product_acceptance` against the completed,
current build artifact. Verify/review the slice, then record `release`
approval against the current review artifact. Push and PR remain separate
explicit approvals. `inspect` never equates prototype, accepted UI, passing
verification or release permission with remote publication.

The normative exception and its safeguards are in
`MODULE_DELIVERY_AGENT_CONTRACT.md` under "Experimental supplier delivery
profile". Do not use this profile for another module or migrate old runs.

### Legacy standard lifecycle

The explicit `standard` profile preserves the original documentation-heavy
workflow for design-only requests or work whose scope is not yet approved.
The delivery lifecycle is intentionally append-only: it never resets, amends,
force-pushes or overwrites an existing run.

```bash
npm run delivery:init -- --suite crm --module Contacts --profile standard
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

Legacy standard runs require `architecture-design.md`. It is the structural
baseline for layer boundaries, responsibilities, dependencies, refactors and
technical debt, and is linked from the design, plan, checkpoints, evidence
matrix and review issue.

Legacy standard runs also require `visual-design.md` and `view-state-matrix.md`.
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
