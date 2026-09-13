# Implementation Documentation

This directory contains the versioned execution record for implementing
LoopDev modules. It must not replace product specifications.

## Source-of-truth boundaries

| Concern | Canonical location |
|---|---|
| Product, domain and UX definition | `docs/06-product/<suite>/<module>/` |
| Implementation plan and phase evidence | `docs/implementation/<module>/` |
| Cross-phase execution state | `docs/implementation/<module>/runs/<run-id>/` |
| Long-running work and dependencies | `tracks/active/<area>/<track>.md` |
| Executable work units and acceptance | GitHub issues |
| Code and tests | `src/`, `public/`, `scripts/` and repository configuration |

The implementation documentation compares what was built against the
approved product definition. It must link back to the relevant product
documents instead of copying them.

## Module implementation layout

```text
docs/implementation/<module>/
├── README.md
├── implementation-plan.md
├── architecture-design.md
├── phase-01-discovery.md
├── phase-02-foundation.md
├── phase-03-build.md
├── phase-04-verify.md
├── phase-05-review.md
├── requirement-evidence-matrix.md
└── runs/
    └── <run-id>/
        ├── run.json
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

Use the templates in `docs/implementation/_templates/`.

Every module must include `architecture-design.md`. It is the structural
baseline for layer boundaries, responsibilities, dependencies, refactors and
technical debt, and is linked from the design, plan, checkpoints, evidence
matrix and review issue.

The operational JSON templates are:

- `MODULE_RUN_TEMPLATE.json`;
- `MODULE_CHECKPOINT_TEMPLATE.json`.

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
