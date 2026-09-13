---
name: module-review
description: Review a LoopDev module for product completeness, architecture quality and release readiness.
user-invocable: true
---

# LoopDev Module Review

Perform a final product and architecture review using the design, plan and
verification evidence.

## Review Areas

- Product scope and domain completeness.
- UX consistency and accessibility.
- Rivera visual baseline compliance and absence of a parallel design system.
- Reuse of existing LoopDev controls instead of native browser UI such as
  `<select>`, unless an explicit accessibility or platform exception is
  documented.
- Domain rules and lifecycle correctness.
- Frontend boundaries and reuse.
- Backend/API readiness.
- RBAC, tenant isolation and auditability.
- Local-first and synchronization risks.
- Test coverage and evidence quality.
- Migration, observability and rollout readiness.
- Unnecessary MVP scope and Enterprise leakage.
- Platform reuse and suite integration.
- Operational truth and runtime evidence.
- Legacy-flow removal, accessibility, security and rollback readiness.

## Required Output

1. Executive verdict: ready, ready with gaps, or not ready.
2. Findings ranked by severity and confidence.
3. Requirement coverage matrix.
4. Blocking issues.
5. Non-blocking improvements.
6. Release and follow-up recommendations.

Do not implement fixes in review mode.

## Common Contract

### Input context

- `module-design`;
- `module-plan`;
- `module-verify` evidence;
- current repository and release constraints.

### Decision status

Classify findings as `confirmed`, `assumed` or `open`, and release status as
`READY`, `READY_WITH_GAPS`, `NOT_READY` or `BLOCKED`.

### Output handoff

Each finding must include severity, confidence, area, evidence, impact and
recommended action. End with:

- executive verdict;
- blocking issues;
- non-blocking improvements;
- release and follow-up recommendations;
- state `complete`, `partial` or `blocked`.

### Action boundaries

This skill reviews and decides. It does not implement fixes, alter scope or
replace missing verification evidence with assumptions.

### Traceability

Create a review checkpoint linked to the design, plan and verification
checkpoints using `docs/03-platform/MODULE_DEVELOPMENT_TRACEABILITY.md`.
Record the verdict, findings, confidence, blocking status, detected failure,
likely origin, release decision and next handoff. Update the implementation
README from `docs/implementation/_templates/module-implementation-readme.md`,
the requirement evidence matrix and the track before closing the review issue.
The review issue may close only after the verdict and all blocking findings
are resolved or explicitly accepted by the responsible approver.

## Platform and cross-module review

Review every applicable integration with:

- Notes and `NoteEditorDrawer`;
- Files upload, attachments and preview;
- Activity and Timeline;
- Tasks;
- Relations and Customer 360;
- Document Intelligence;
- shared permissions, entitlements and adapters.

Block release when the module duplicates or bypasses a Platform capability
without an approved architectural exception. Check both directions:

- the new module consumes Platform correctly;
- existing modules are not regressed by the new integration.

## Suite-level release gate

A module is not `READY` unless evidence covers:

- the real checkout, branch, commit and runtime;
- all required UI states and direct routes;
- removal or intentional coexistence of legacy flows;
- accessibility, responsive, i18n and RTL behavior;
- tenant isolation, sensitive data and direct URL authorization;
- local-first recovery, migration, feature flags and rollback;
- regression impact on existing Platform consumers.

Compilation, tests without behavioral coverage, a commit or a clean working
tree cannot alone justify a release-ready verdict.
