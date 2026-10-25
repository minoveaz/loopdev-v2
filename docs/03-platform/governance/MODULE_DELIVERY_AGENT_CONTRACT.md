# LoopDev Delivery Agent Contract

## Purpose

This contract defines how the `delivery` agent orchestrates development of a
LoopDev module. It is the authoritative workflow contract for
`.github/agents/delivery.agent.md`; it does not replace the individual skill
contracts.

The agent coordinates work. Domain, access, API, synchronization, planning,
implementation, verification, review and Git decisions remain governed by
their respective skills.

Architecture quality is a transversal concern, not an optional final review.
Every run maintains an `ARCHITECTURE_QUALITY` status:
`PENDING`, `PASS`, `PASS_WITH_DEBT`, `DEVIATED`, `BLOCKED` or `FAIL`.

## Implementation-first profile

New delivery CLI runs default to `implementation-first`. Existing runs,
including runs without a `profile` property, retain their original graph and
gates. This profile is for implementation against approved scope, not for
inventing product requirements. The approved product definition or user
decisions remain the acceptance baseline.

Its graph is `06-plan → 07-build → 08-verify → 09-review → 10-git`. The
pre-build workspace contains only `delivery-ledger.json` and the run
checkpoint. Planning reuses existing approved decisions and records only the
small executable task set, acceptance criteria and targeted tests. It does
not require discovery/design reports, specialist phase documents, architecture
or visual documents, matrices, tracks or one issue per phase.

After plan approval, implement production code and tests in the same work
phase. Run focused tests before writing narrative documentation. Verification
then produces one `implementation-report.md` mapping planned tasks to changed
code and passing tests, with only verified behavior, gaps, risks and remaining
blockers. Review compares that report, code and test evidence against the
approved scope. A missing decision, security/data risk, shared Platform
extension or material architecture change may require focused analysis and
user approval; those are exceptions, not automatic document-producing phases.

Use the full standard graph only when the user requests design/analysis without
implementation or the scope is too unresolved to approve executable tasks.
Do not migrate existing runs or infer approval from branch names.

## Experimental supplier delivery profile

An explicitly initialized `supplier-pilot` run for `erp/Proveedores` uses its
existing experimental graph in `delivery-workflow.json`. Do not convert
existing runs or infer pilot selection from a branch name.

This is a bounded process experiment, not approval of the Suppliers product.
Each run names one `slice_id`; its current ledger must describe that complete
slice, not an unfinished module-wide backlog. Slice readiness never establishes
readiness of the entire ERP suite or future supplier capabilities.

For this profile only, these rules override the duplicated standard phase,
artifact and issue instructions in this contract and the individual skills:

- Discovery and design lead directly to an early reviewable prototype in the
  LoopDev shell. A running, isolated prototype can replace mandatory SVGs.
  Preserve the existing Markdown visual source and identify the reviewed
  artifact/version. Use synthetic data, no live writes, no silent mock
  fallback, and no normal production navigation to prototype-only routes.
- `visual_design` is the single approval of the slice's scope and visual
  direction. A separate design or plan gate is not requested. It binds an
  existing artifact's actual SHA-256, the slice, approver, source and semantic
  baseline. Approval must come from the user, never from the agent itself.
- Domain, access, API and sync skills are targeted helpers, not mandatory
  independent phases/issues. Before build, plan completion requires recorded
  `prebuild_decisions` for domain, access, persistence, Platform reuse and
  rollback. Material open decisions still block their dependent work.
- Keep the existing workspace and ledger as the single execution record.
  Link source decisions rather than repeat them in every document. Use
  issues for useful delivery units, not automatically for every skill.
  The plan contains the existing reuse, boundary, responsibility and refactor
  audits, shared contracts and desktop/mobile operation coverage. The ledger
  must still be approved, or tasks explicitly approved, before build.
  Record the combined product approval as the source only where it really
  authorizes those tasks; additional scope always needs a new decision.
- Build, focused verification and feedback are iterative. `delivery iterate`
  reopens build within the same run and slice, snapshots previous checkpoints,
  and clears acceptance, release and publication approvals. It does not
  approve new scope or manufacture new task authorization.
- `product_acceptance` requires completed build with current evidence.
  Verification may run continuously; review requires both completed
  verification and explicit product acceptance. Review/release readiness
  does not imply push, PR, deployment or production publication.

The pilot uses semantic ledger content for the scope fingerprint; task status,
parity progress and evidence references are not new product scope. Task
definitions are part of the plan fingerprint. Code/test changes reopen build
or verification, not product scope approval. Changes to requirements, approved
design, permissions or contracts require renewed scope/visual approval.
Changing action meaning is never a cosmetic edit: update its semantic baseline.
Contract fingerprints cover the capability `contract_refs` declared in the
ledger; include shared contract dependencies there rather than relying on
unrelated package changes to invalidate approval. Code and test fingerprinting
remains conservatively repository-wide, reopening technical evidence rather
than product approval.

`resume` detects changes and invalidates dependent phases. `iterate` handles
feedback after completed build. Both preserve previous pilot checkpoints and
approval history. Repeated completion requires new passing evidence; stale
build inputs or regressed operation coverage cannot establish readiness.
`delivery inspect` reports prototype, implementation, product acceptance,
verification and release milestones separately and labels the completion
scope as a slice. Publication remains `not_recorded`; no remote action is
performed by these commands.

Pilot opt-in, approval and iteration commands are documented in
`docs/implementation/README.md`. Keep existing pilot checkpoints on their
original profile; do not relabel them as implementation-first evidence.

## Authoritative artifacts

| Concern | Location |
|---|---|
| Agent profile | `.github/agents/delivery.agent.md` |
| Agent contract | `docs/03-platform/governance/MODULE_DELIVERY_AGENT_CONTRACT.md` |
| Traceability | `docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md` |
| Product definition | `docs/06-product/<suite>/<module>/` |
| Implementation documentation | `docs/implementation/<suite>/<module>/` |
| Implementation templates | `docs/implementation/_templates/` |
| Track template | `tracks/templates/module-development-track.md` |
| Issue templates | `.github/ISSUE_TEMPLATE/` |
| CI validation | `.github/workflows/ci.yml` |
| Architecture contract | `docs/03-platform/governance/SOFTWARE_ARCHITECTURE_AND_DESIGN_CONTRACT.md` |
| Multiplatform delivery | `docs/03-platform/governance/MULTIPLATFORM_DELIVERY_CONTRACT.md` |
| Executable phase graph | `docs/03-platform/governance/delivery-workflow.json` |

## Inputs

The agent accepts:

- a module or capability request;
- an existing product specification;
- an existing track or issue;
- a request to resume a blocked run;
- a request to verify or review an implementation.

If the request is ambiguous, record assumptions and ask only the smallest
decision needed to continue safely.

## Run initialization

Every implementation-first run must:

1. generate a stable ID using `MOD-<MODULE>-<YYYYMMDD>-<SEQUENCE>`;
2. confirm repository path, checkout, branch, base, `HEAD` and working tree;
3. locate the approved product scope and existing plan, if present;
4. resolve the canonical run path as
   `docs/implementation/<suite>/<module>/runs/<run-id>/`;
5. create only `delivery-ledger.json` and `run.json` before implementation;
6. record approved task IDs, acceptance criteria, dependencies and focused
   validation; initialize platform detail only to the level needed to build.

The agent must stop if the intended checkout or runtime cannot be confirmed.
The legacy standard graph retains its original initialization requirements.

### Implementation workspace initialization

The `delivery` agent owns the first creation of the implementation workspace.
For a CRM Pipeline run, the canonical location is:

```text
docs/implementation/crm/pipeline/
```

The legacy standard profile must create or preserve this structure:

```text
docs/implementation/<suite>/<module>/
├── README.md
├── architecture-design.md
├── implementation-plan.md
├── requirement-evidence-matrix.md
├── platform-scope.md
├── platform-evidence-matrix.md
└── runs/<run-id>/
    └── run.json
```

It must copy or materialize the corresponding files from
`docs/implementation/_templates/` and never invent a second implementation
root. Existing files are updated in place; they are not overwritten without
preserving prior evidence.

The implementation-first profile does not materialize this full tree at
initialization. It adds `implementation-report.md` only after implementation
and verification evidence exist. Existing product/design documents are linked
as inputs, not copied into another implementation workspace.

## State machine

`delivery-workflow.json` is the canonical machine-readable source for phase
IDs, ordering, ownership, predecessors, gates and invalidation. The diagram
below is the legacy standard profile.

```text
INTAKE
  → CONTEXT_AUDIT
  → DISCOVERY
  → DESIGN
  → WAITING_DESIGN_APPROVAL
  → 01-VISUAL-DESIGN
  → WAITING_VISUAL_DESIGN_APPROVAL
  → SPECIALIZED_ANALYSIS
  → PLAN
  → WAITING_PLAN_APPROVAL
  → ISSUE_SETUP
  → BUILD_LOOP
  → VERIFY
  → REVIEW
  → COMMIT_CHECKPOINT
  → WAITING_PUSH_APPROVAL
  → PUSH
  → WAITING_PR_APPROVAL
  → PULL_REQUEST
  → RELEASE_REVIEW
```

Any phase may transition to:

```text
BLOCKED
FAILED
DEVIATED
WAITING_USER
PAUSED
```

Dependent phases cannot start while an earlier phase is blocked, failed or
deviated.

The implementation-first profile uses:

```text
APPROVED_SCOPE
  → 06-PLAN (executable task ledger only)
  → 07-BUILD (production code and tests)
  → 08-VERIFY (tests first, then implementation-report.md)
  → 09-REVIEW
  → 10-GIT
```

## Skill routing

| Phase | Skill | Output |
|---|---|---|
| Design | `module-design` | Product and architecture specification |
| Visual design | `module-visual-design` | Normative visual source, view/state matrix and wireframe evidence |
| Discovery | `module-discovery` | Expected capabilities, domain baseline and expected-versus-existing matrix |
| Domain | `domain-model` | Entities, states, invariants and events |
| Access | `access-design` | Permission, scope and security matrix |
| API | `api-contracts` | Commands, DTOs, errors and event contracts |
| Sync | `sync-design` | Local-first, conflict and migration policy |
| Plan | `module-plan` | Ordered tasks, dependencies and issue plan |
| Build | `module-build` | Code, tests, migrations and phase evidence |
| Verify | `module-verify` | Requirement matrix and objective evidence |
| Review | `module-review` | Release verdict and findings |
| Git | `git-workflow` | Commit, rollback, push and PR evidence |

For implementation-first, only `module-plan → module-build → module-verify →
module-review → git-workflow` run by default. Specialist skills are invoked
only for a concrete unresolved design or safety decision.

Helper skills run as child spans of design or plan. The agent must pass their
outputs to the parent phase and store their checkpoints.

## Platform and visual gates

For the legacy standard profile, classify each new capability before planning
or building it as:

```text
REUSE
EXTEND_PLATFORM
MODULE_SPECIFIC
BLOCKED
```

All profiles reuse Rivera visual primitives and shared LoopDev capabilities
for Notes, Files, uploads, previews, Activity, Tasks, Relations and Document
Intelligence. Stop for approval before extending a shared Platform contract;
do not create a module-local duplicate. In implementation-first, record this
decision in the task ledger rather than a separate audit report.

## Track and issue lifecycle

The legacy standard profile creates or updates the implementation track and
one issue per executable phase. For implementation-first, use an existing
track or issue when it helps coordinate work; do not create one for every
phase. The task ledger and run checkpoints are sufficient for a bounded task.
Any issue that is created must contain:

- objective;
- dependencies;
- skill and phase;
- run ID and span ID;
- acceptance criteria;
- evidence requirements;
- implementation and product links.

During execution:

1. build updates actions, files, commits and evidence;
2. verify updates commands, runtime, visual, accessibility and regression
   evidence;
3. review updates verdict, findings and remaining gaps;
4. the agent closes an issue only when all criteria and evidence pass.

Issues remain open for `blocked`, `failed`, `deviated`, `PARTIAL`, `FAIL` or
`NOT_TESTED` results.

## Approval gates

The agent must wait for explicit approval at applicable gates:

| Gate | Required decision |
|---|---|
| Design | Scope, MVP, UX and architecture |
| Visual design | Wireframes, states, breakpoints, accessibility and Rivera/shared primitive reuse |
| Plan | Tasks, dependencies, risk and effort |
| Open decision | Product, domain, access, API, sync or data ambiguity |
| Platform extension | Shared capability or contract change |
| Scope change | Work outside the approved plan |
| Migration/security | Destructive, sensitive or cross-tenant change |
| Release | Review verdict and unresolved risks |
| Push | Publish branch to remote |
| Pull request | Create or update PR |

The legacy standard profile requires `01-visual-design`. The
implementation-first profile does not: use existing Rivera/LoopDev patterns
and add a visual-design decision only when the user requests it or a material
interaction choice remains unresolved.

The legacy standard visual gate also requires a declared platform scope and an explicit
desktop/mobile decision for every view and state. Desktop-only delivery is an
approved scope exception, never an implicit fallback. Implementation-first
records platform scope only as needed to implement and verify the approved
tasks; it does not require pre-build matrices.

Local commits are allowed after approved scope and validation gates pass.
Pushes and pull requests always require explicit approval.

## Checkpoints and recovery

Every phase writes a JSON checkpoint. The legacy standard profile also writes
its phase documents. The implementation-first profile does not write narrative
phase documents before code; verification creates the single
`implementation-report.md` after tests pass. Checkpoints record environment,
inputs, outputs, validation, failures and handoff.

The legacy standard profile maintains `platform-scope.md` and
`platform-evidence-matrix.md`. Implementation-first reports platform evidence
in `implementation-report.md`, adding separate matrices only when the
approved scope or risk requires them.

The legacy standard architecture artifact records significant refactor
decisions. In implementation-first, record only material refactors in
`implementation-report.md`: reason, behavior preserved, affected files and
consumers, risk, tests, rollback and residual technical debt. An unapproved
architecture deviation blocks release, even if build and tests pass.

When a phase fails:

1. mark it `failed` or `blocked`;
2. record the error code;
3. distinguish detection from likely origin;
4. keep its issue open when one exists;
5. identify the next action;
6. resume the same run with an incremented attempt;
7. invalidate dependent evidence when inputs change.

The agent may create a local recovery commit. Rollbacks use a new
`git revert` commit linked to the run. Autonomous reset, amend, force-push and
history rewriting are forbidden.

## Completion criteria

A run is complete only when:

- product requirements have implementation evidence;
- every in-scope desktop and mobile surface has evidence in the platform matrix
  or, for implementation-first, in `implementation-report.md`;
- Platform and cross-module integrations are verified;
- all applicable UI states are covered;
- routes, runtime, accessibility, i18n and RTL are checked;
- security, tenant isolation and rollback are addressed;
- required phase checkpoints are complete; issues are required only when the
  profile or coordination need creates them;
- `module-review` has issued a final verdict;
- `ARCHITECTURE_QUALITY` is `PASS` or `PASS_WITH_DEBT` with approved residual
  debt and follow-up ownership;
- Git delivery evidence is recorded separately.

`READY_WITH_GAPS`, `BLOCKED`, `FAIL`, `PARTIAL` and `NOT_TESTED` are not
completion states.

## Communication contract

Every agent update must report:

```text
Run ID:
Current phase:
Current skill:
Status:
Issue:
Evidence:
Blocker or decision:
Next handoff:
```

The agent must never claim a phase or run is complete without the corresponding
checkpoint and evidence.
