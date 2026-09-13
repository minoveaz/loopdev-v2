---
name: module-review
description: Review a LoopDev module for product completeness, architecture quality and release readiness.
user-invocable: true
---

# LoopDev Module Review

Read `docs/03-platform/governance/V2_DOCUMENTATION_SOURCE_OF_TRUTH.md` first, then use
`docs/03-platform/frontend/PLATFORM_V2_UI_REFERENCE.md` and
`docs/03-platform/frontend/PLATFORM_V2_SHELL_REFERENCE.md` for current reusable UI and
shell evidence. Keep proposed `SAAS_*` documents and archive-only history
separate from implemented V2 evidence when reviewing delivery claims.

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
- Architecture and structural quality: layer boundaries, SRP, cohesion,
  coupling, duplication, dependency direction and residual technical debt.
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

### Documentation workspace

Review and update the canonical workspace at
`docs/implementation/<suite>/<module>/`. Record the final structural and
release verdict there and do not create a parallel documentation root.

### Input context

- `module-design`;
- `module-discovery`;
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
checkpoints using `docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md`.
Record the verdict, findings, confidence, blocking status, detected failure,
likely origin, release decision and next handoff. Update the implementation
README from `docs/implementation/_templates/module-implementation-readme.md`,
the requirement evidence matrix and the track before closing the review issue.
The review issue may close only after the verdict and all blocking findings
are resolved or explicitly accepted by the responsible approver.

## Platform and cross-module review

## Architecture quality gate

Review the module architecture artifact against
`docs/03-platform/governance/SOFTWARE_ARCHITECTURE_AND_DESIGN_CONTRACT.md`. The verdict
must cover:

Review whether the final implementation satisfies the discovery baseline and
whether each approved differentiation hypothesis was delivered, deferred or
rejected with evidence. Benchmark parity is not a release requirement unless
product scope explicitly approved it.

- target versus actual boundaries and dependency direction;
- separation of presentation, application, domain, ports and adapters;
- SRP, cohesion, coupling and duplicate implementation risks;
- significant refactors and their before/after regression evidence;
- approved versus unapproved deviations;
- rollback and residual debt ownership.

An unapproved structural deviation is blocking even when functional tests,
typecheck and build pass. Record the finding, confidence, affected consumers
and exact remediation issue.

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
## Multiplatform release gate

Return separate desktop and mobile verdicts in the release review. A module is
not `READY` when an in-scope mobile surface lacks functional, visual,
accessibility or runtime evidence. Record approved platform exceptions,
residual gaps, owners and follow-up issues explicitly.

### Shared capability contract release gate

The review must confirm that every in-scope capability has one semantic
contract consumed by each renderer. Check action catalogs, labels, enabled and
destructive states, validation, permissions, navigation and lifecycle states
across desktop and mobile. A renderer-local action list or undocumented
platform deviation is a release gap even when both platforms compile.
