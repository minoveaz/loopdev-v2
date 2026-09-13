---
name: module-plan
description: Turn a LoopDev module design into an ordered, dependency-aware implementation plan.
user-invocable: true
---

# LoopDev Module Plan

Consume a `module-design` specification and convert it into an executable
implementation plan without writing production code.

## Responsibilities

- Verify repository, checkout, branch, commit and local changes before planning.
- Inspect existing LoopDev routes, domains, adapters, hooks and shared components.
- Treat Rivera as the mandatory visual baseline. Identify reusable Rivera
  primitives and record any intentional visual deviation.
- Inventory existing controls before planning new UI. Native product controls
  such as `<select>` are not allowed when an established LoopDev primitive or
  pattern exists; plan reuse of the existing `Select`, `Command`, `Popover`,
  `Calendar` or equivalent component.
- Identify reusable patterns and incompatible or legacy implementations.
- Split work into frontend, local adapter, backend contract, synchronization,
  permissions, migrations and tests.
- Add a mandatory `platform-reuse-audit` task before planning new shared
  components, adapters or persistence.
- Add mandatory `architecture-boundary-audit`, `responsibility-audit` and
  `refactor-safety-audit` tasks before implementation.
- Convert every `REUSE` and `EXTEND_PLATFORM` decision from the design into
  explicit dependencies and acceptance evidence.
- Assign dependencies, sequencing, risk and acceptance criteria.
- Continue in the implementation workspace initialized by `delivery`; do not
  create a second documentation root.
- Delegate focused analysis to helper skills when needed:
  `domain-model`, `api-contracts`, `access-design` and `sync-design`.

## Required Output

1. Scope and assumptions.
2. Current-state inventory.
3. Target architecture.
4. Ordered work breakdown with dependencies.
5. Files, domains and services affected.
6. Test plan and acceptance evidence.
7. Risks, blockers and decisions requiring approval.

Do not claim implementation is complete and do not modify production files.

## Platform integration planning

The first planning task must inspect:

- `docs/03-platform/PLATFORM_COMPONENT_INVENTORY.md`;
- existing Notes, Files, Activity, Tasks, Relations and Document Intelligence
  contracts;
- current consumers and adapters;
- forbidden duplicate implementations.

Also create explicit audit tasks before implementation:

- `environment-truth-audit`: checkout, branch, commit, working tree and runtime;
- `platform-reuse-audit`: shared contracts, consumers and duplicate risks;
- `legacy-flow-audit`: existing UX paths and replacement/removal evidence;
- `route-and-runtime-audit`: routes, navigation, deep links and real URL;
- `surface-state-audit`: loading, empty, error, forbidden, conflict, offline,
  pending and success;
- `accessibility-and-i18n-audit`: keyboard, portals, responsive, i18n and RTL;
- `security-and-rollback-audit`: isolation, sensitive data, flags and recovery.
- `architecture-boundary-audit`: layers, module boundaries, dependency
  direction, public contracts and forbidden imports.
- `responsibility-audit`: UI/application/domain/infrastructure ownership,
  SRP, cohesion, coupling and duplication risks.
- `refactor-safety-audit`: behavior preserved, before/after evidence,
  regression tests, rollback and residual technical debt.

Each task must define the evidence required to close it. A clean build,
commit or source file is not sufficient evidence for behavior.

Every proposed new cross-module capability must be classified as
`REUSE`, `EXTEND_PLATFORM`, `MODULE_SPECIFIC` or `BLOCKED`. A plan cannot
create a module-local uploader, preview, notes editor, timeline, task system,
document extractor or processing state when an applicable Platform contract
exists.

Include a suite interaction matrix with modules, triggers, shared data,
permissions, events and validation evidence. If Platform must be extended,
plan that change before the consuming module and identify all affected
consumers.

## Common Contract

### Input context

- approved or latest `module-design` specification;
- completed `module-discovery` artifact and expected-versus-existing matrix;
- repository, checkout, branch, commit and working-tree state;
- existing implementation patterns and constraints.

### Decision status

Classify decisions as `confirmed`, `assumed` or `open`. Mark a task
`blocked` when an open decision prevents safe planning.

### Output handoff

Every task must include an ID, type, dependencies, affected files or areas,
risk, validation command and definition of done. End with:

- ordered work breakdown;
- acceptance evidence plan;
- decisions and blockers;
- state `complete`, `partial` or `blocked`.

The plan must convert discovery gaps and approved design decisions into
executable tasks. It must retain each baseline classification and evidence
link instead of repeating discovery or treating source presence as completion.

### Action boundaries

This skill inspects and plans only. It does not modify production files,
create commits or silently expand the approved scope.

### Traceability

Create or update `docs/implementation/<suite>/<module>/implementation-plan.md`
and its phase evidence in the initialized workspace. Create a checkpoint for
the plan phase using
`docs/03-platform/MODULE_DEVELOPMENT_TRACEABILITY.md`. Record the environment
evidence, design input, audit-task results, plan artifact, blockers, detected
failure, likely origin and next handoff. Use
`docs/implementation/_templates/implementation-plan.md` and create/update the
implementation track and phase issues before execution. Use the
`.github/ISSUE_TEMPLATE/module-phase.md` structure and do not start a phase
without an issue containing its acceptance criteria and dependencies.
