---
name: module-plan
description: Turn a LoopDev module design into an ordered, dependency-aware implementation plan.
user-invocable: true
---

# LoopDev Module Plan

For an `implementation-first` run, this skill is a short execution gate, not
a documentation phase. Reuse the approved product scope, decisions and any
existing plan. Inspect only code/contracts directly needed by the selected
tasks. Update `delivery-ledger.json` with the minimal approved task set,
dependencies, acceptance criteria and targeted tests; do not create or expand
discovery, architecture, visual, platform, track or issue documents. Do not
run broad audits unless a specific risk or unresolved decision blocks safe
implementation. Request only the approval needed to start the listed tasks.
For UI scope, inspect the current LoopDev shared components and applicable
Platform capabilities, then one or two implemented, comparable screens from
other suites for interaction patterns such as tables and forms. Inspect the
Rivera template only when a genuinely new component is needed. Record sources,
findings and reuse decisions in the plan checkpoint's structured
`ui_reuse_review`; this is a concise JSON evidence gate, not a new document or
a separate audit task.
Read `V2_DOCUMENTATION_SOURCE_OF_TRUTH.md` and the targeted V2 UI reference for
this review, then verify candidate components against their current source and
consumers. This focused check does not authorize a repository-wide survey.

For an explicitly selected `supplier-pilot` run, first read the experimental
profile section of `MODULE_DELIVERY_AGENT_CONTRACT.md`. It overrides the
standard separate plan gate, specialist-phase artifacts and issue-per-phase
rules below. Preserve authorized ledger tasks and the safety/reuse audits;
record domain, access, persistence, Platform reuse and rollback decisions in
`prebuild_decisions` before plan completion. Do not infer approval of new scope.

Consume a `module-design` specification and convert it into an executable
implementation plan without writing production code.

In the legacy standard profile, read
`docs/03-platform/governance/V2_DOCUMENTATION_SOURCE_OF_TRUTH.md` first. In
implementation-first, consult only references needed by the approved tasks.
Do not turn proposed `SAAS_*` references or archive-only documents into
implementation dependencies without verified V2 source, route, test, or
checkpoint evidence.

## Responsibilities

- Verify repository, checkout, branch, commit and local changes before planning.
- Inspect existing LoopDev routes, domains, adapters, hooks and shared components.
- Treat Rivera as the mandatory visual baseline. Identify reusable Rivera
  primitives and record any intentional visual deviation.
- For UI planning, prefer this evidence order: established LoopDev components
  and patterns; shared Platform capabilities and their current consumers;
  comparable implemented screens in a different suite; then Rivera template
  examples only for a real component gap. Do not copy business behavior from
  another module or introduce a local duplicate.
- In `ui_reuse_review`, cite exact source paths and a short finding for:
  current LoopDev components, applicable Platform capabilities, and at least
  one comparable implementation from another suite, using its exact suite key
  and a source path within that suite. If no comparable screen exists, record
  the focused source locations checked and that no match was found. When
  proposing a new component, cite the closest Rivera template
  example or explain why none applies. A no-UI plan must mark the review
  inapplicable with a reason.
- Inventory existing controls before planning new UI. Native product controls
  such as `<select>` are not allowed when an established LoopDev primitive or
  pattern exists; plan reuse of the existing `Select`, `Command`, `Popover`,
  `Calendar` or equivalent component.
- Identify reusable patterns and incompatible or legacy implementations.
- Split work into frontend, local adapter, backend contract, synchronization,
  permissions, migrations and tests.
- In legacy standard runs, add a mandatory `platform-reuse-audit` task before
  planning new shared components, adapters or persistence. For
  implementation-first, do not add audit-only tasks: use `ui_reuse_review` in
  the plan checkpoint and add a build task only when it delivers approved
  product work or a necessary Platform extension.
- Add mandatory `architecture-boundary-audit`, `responsibility-audit` and
  `refactor-safety-audit` tasks before implementation in legacy standard runs;
  implementation-first records only material risks in its existing task
  acceptance criteria and checkpoint.
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
For `implementation-first`, the numbered narrative outputs above are planning
considerations, not extra deliverables; use the approved ledger and concise
checkpoint evidence only.

## Platform integration planning (legacy standard profile)

The first planning task must inspect:

- `docs/03-platform/frontend/PLATFORM_V2_UI_REFERENCE.md` and
  `docs/03-platform/frontend/PLATFORM_V2_SHELL_REFERENCE.md`;
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

`delivery-ledger.json` is the executable plan source. Create small tasks with
stable IDs and explicit requirement IDs, capability IDs, platform, owner,
risk, dependencies, files/areas, acceptance criteria, validation commands and
minimum evidence level. Shared-contract work must precede renderer tasks.
Every required platform for every capability needs at least one task. Run
`npm run validate:delivery-ledgers` before requesting plan approval. Set the
ledger to `approved` and unblocked tasks to `ready` only after recording
approver, timestamp and approval source; preserve unresolved owner-dependent
tasks as explicitly `blocked`. Markdown plan completion alone is insufficient.

For every declared operation, populate `operation_coverage` with a decision for
each platform and keep `domain`, `renderer` and `operations` parity separate.
Create platform tasks and measurable acceptance criteria at operation level
when a renderer can expose data without providing the action. A required
operation may remain `missing` at plan approval only when a task explicitly
maps that operation to each missing required platform using `operation_ids`,
with owner, dependencies, acceptance criteria and validation. A required
platform may be `adapted` only with an approved adaptation reference and may
not be `not_applicable` at plan approval. Plan approval approves the scope and
sequence, not implementation parity; unresolved decisions stay as
accountable task-level blockers. Keep unimplemented operations `missing` until
implementation evidence exists. Require every required operation to be
`implemented` or approved `adapted` before completing `07-build`, starting
`08-verify`, or publishing. Plan focused component tests for changed
operations. Browser journeys are only planned for E4, high-risk or release
work and are not synonymous with Playwright.

## Common Contract

### Input context

- approved or latest `module-design` specification;
- approved `module-visual-design` source and evidence; planning is blocked
  while the visual-design subgate is awaiting approval;
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

For `implementation-first`, the ledger is the plan artifact. Reuse an existing
plan when it already defines the approved tasks; do not generate
`implementation-plan.md` solely to satisfy this standard profile's traceability
rule. Do not create a track or issue for a bounded task unless coordination
requires it.

Create or update `docs/implementation/<suite>/<module>/implementation-plan.md`
and its phase evidence in the initialized workspace. Create a checkpoint for
the plan phase using
`docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md`. Record the environment
evidence, design input, audit-task results, plan artifact, blockers, detected
failure, likely origin and next handoff. Use
`docs/implementation/_templates/implementation-plan.md` and create/update the
implementation track and phase issues before execution. Use the
`.github/ISSUE_TEMPLATE/module-phase.md` structure and do not start a phase
without an issue containing its acceptance criteria and dependencies.
## Multiplatform planning gate

Read the Multiplatform Delivery Contract and create explicit shared, desktop
and mobile work items. Every task must identify its platform scope, validation
command and evidence needed for closure. Include mobile navigation, touch,
safe-area, offline and deep-link work whenever applicable; do not hide mobile
work inside a generic frontend task.

### Shared capability contract gate

The first implementation task for each capability must create or verify its
shared contract before building platform UI. The plan must identify the
contract path, all desktop/mobile/native consumers, versioning impact and
contract tests. Include separate renderer tasks only after the shared
semantics, action catalog, state matrix, permissions and navigation meaning are
approved.
