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

Every run must:

1. generate a stable ID using `MOD-<MODULE>-<YYYYMMDD>-<SEQUENCE>`;
2. confirm repository path, checkout, branch, base, `HEAD` and working tree;
3. declare `PLATFORM_SCOPE` using the Multiplatform Delivery Contract;
4. create the desktop/mobile capability and evidence matrices;
5. locate or create the product definition;
6. resolve the canonical implementation path as
   `docs/implementation/<suite>/<module>/`;
7. create the implementation workspace from the approved templates;
8. create or update the implementation track;
9. initialize `runs/<run-id>/run.json`;
10. record approvals, Platform impact and current phase.

The agent must stop if the intended checkout or runtime cannot be confirmed.

### Implementation workspace initialization

The `delivery` agent owns the first creation of the implementation workspace.
For a CRM Pipeline run, the canonical location is:

```text
docs/implementation/crm/pipeline/
```

The agent must create or preserve this structure:

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

`module-design` is the first skill to populate this workspace after
initialization. It owns the initial architecture/design content, while
`module-plan`, `module-build`, `module-verify` and `module-review` append or
update only their owned artifacts.

## State machine

`delivery-workflow.json` is the canonical machine-readable source for phase
IDs, ordering, ownership, predecessors, gates and invalidation. This diagram is
the human-readable projection of that source.

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

Helper skills run as child spans of design or plan. The agent must pass their
outputs to the parent phase and store their checkpoints.

## Platform and visual gates

Before planning or building a new capability, the agent must classify it as:

```text
REUSE
EXTEND_PLATFORM
MODULE_SPECIFIC
BLOCKED
```

The agent must reuse Rivera visual primitives and shared LoopDev capabilities
for Notes, Files, uploads, previews, Activity, Tasks, Relations and Document
Intelligence. It must stop for approval before extending a shared Platform
contract and must not create a module-local duplicate.

## Track and issue lifecycle

`module-plan` creates or updates the implementation track and one issue per
executable phase. Each issue must contain:

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

The agent must wait for explicit approval at:

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

`01-visual-design` is mandatory after discovery/module-design and before
specialized analysis or plan approval. Its Markdown source is normative;
wireframe SVGs are review evidence only. The gate covers wireframes, visual
states, desktop/mobile breakpoints, accessibility, Rivera/shared LoopDev
primitive reuse and approval evidence. The run stops at
`WAITING_VISUAL_DESIGN_APPROVAL` until explicit approval is recorded.

The visual gate also requires a declared platform scope and an explicit
desktop/mobile decision for every view and state. Desktop-only delivery is an
approved scope exception, never an implicit fallback.

Local commits are allowed after approved scope and validation gates pass.
Pushes and pull requests always require explicit approval.

## Checkpoints and recovery

Every phase writes a JSON checkpoint and, where applicable, a human-readable
document from `docs/implementation/_templates/`. The checkpoint must include
environment, inputs, decisions, outputs, validation, failures and handoff.

Every run maintains `platform-scope.md` and
`platform-evidence-matrix.md`. Build, verify and review phases update the
matrix with separate desktop and mobile evidence. iOS and Android may remain
`planned` or `not_applicable` only with an owner and follow-up decision.

The architecture artifact must also record significant refactor decisions:
reason, behavior preserved, affected files and consumers, risk, before/after
tests, rollback and residual technical debt. An unapproved architecture
deviation blocks dependent phases and release, even if build and tests pass.

When a phase fails:

1. mark it `failed` or `blocked`;
2. record the error code;
3. distinguish detection from likely origin;
4. keep its issue open;
5. identify the next action;
6. resume the same run with an incremented attempt;
7. invalidate dependent evidence when inputs change.

The agent may create a local recovery commit. Rollbacks use a new
`git revert` commit linked to the run. Autonomous reset, amend, force-push and
history rewriting are forbidden.

## Completion criteria

A run is complete only when:

- product requirements have implementation evidence;
- every in-scope desktop and mobile surface has evidence in the platform matrix;
- Platform and cross-module integrations are verified;
- all applicable UI states are covered;
- routes, runtime, accessibility, i18n and RTL are checked;
- security, tenant isolation and rollback are addressed;
- phase issues and checkpoints are complete;
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
