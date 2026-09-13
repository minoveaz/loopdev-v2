# LoopDev Module Development Traceability

## Purpose

This document defines the functional audit trail for developing LoopDev
modules. Every module run must make it possible to answer:

- which skill was executing;
- which phase and parent phase were active;
- which repository, checkout, branch and commit were used;
- which inputs and decisions were consumed;
- which files, contracts or tests were produced;
- which evidence passed or failed;
- where a failure was detected and where it likely originated;
- which phase must resume next.
- whether architecture quality passed, contains approved debt or is blocking.

This is versioned product and engineering documentation. It belongs in the
production repository and should be reviewed with the module design.

## Execution phases

| Phase | Primary skill | Purpose | Completion gate |
|---|---|---|---|
| `01-design` | `module-design` | Functional, product and architecture specification | Requirements, platform reuse and acceptance matrix complete |
| `01-visual-design` | `module-visual-design` | Normative visual source, view/state matrix and wireframe evidence | Visual evidence complete and explicit approval recorded |
| `00-discovery` | `module-discovery` | Expected capabilities and existing-state comparison | Scope, domain baseline and handoff matrix complete |
| `02-domain` | `domain-model` | Entities, states, invariants and events | Domain decisions resolved or explicitly open |
| `03-access` | `access-design` | RBAC, scopes, sensitive data and audit | Permission matrix and security tests defined |
| `04-api` | `api-contracts` | Commands, DTOs, errors and events | Contract and consumer impact defined |
| `05-sync` | `sync-design` | Local-first, queues, conflicts and migration | Operation matrix and conflict policy defined |
| `06-plan` | `module-plan` | Ordered implementation tasks | Dependencies, evidence and definition of done complete |
| `07-build` | `module-build` | Production implementation and tests | Approved scope implemented and validated |
| `08-verify` | `module-verify` | Objective technical, functional and runtime evidence | Requirement matrix has evidence or explicit gaps |
| `09-review` | `module-review` | Release and architecture decision | Verdict and blocking findings recorded |
| `10-git` | `git-workflow` | Commit, push and pull request operations | Git evidence recorded separately from product evidence |

Helper phases may run as child spans of `01-design`, `01-visual-design` or
`06-plan`. They must
not silently become independent implementations.

## Run identity

Every run receives a stable ID:

```text
MOD-<MODULE>-<YYYYMMDD>-<SEQUENCE>
```

Example:

```text
MOD-CRM-20260913-001
```

Each checkpoint receives a span ID:

```text
<run-id>:<phase>
```

Example:

```text
MOD-CRM-20260913-001:07-build
```

## Required checkpoint contract

Each skill must create or update one JSON checkpoint per phase. The canonical
operational templates live in `docs/implementation/_templates/` and the
canonical checkpoint location is the implementation documentation directory:

```text
docs/implementation/<suite>/<module>/runs/<run-id>/
├── run.json
├── 01-design.json
├── 01-visual-design.json
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

If the implementation directory has not been created yet, use:

```text
docs/06-product/module-runs/<run-id>/
```

The product documentation under `docs/06-product` remains the definition of
what must be built. It is not the primary location for implementation
checkpoints. The canonical checkpoint shape is:

```json
{
  "run_id": "MOD-CRM-20260913-001",
  "span_id": "MOD-CRM-20260913-001:07-build",
  "phase": "07-build",
  "skill": "module-build",
  "parent_span_id": "MOD-CRM-20260913-001:06-plan",
  "module": "Opportunities",
  "status": "completed",
  "decision_status": "confirmed",
  "architecture_quality": "PASS",
  "started_at": "2026-09-13T09:00:00+02:00",
  "completed_at": "2026-09-13T09:30:00+02:00",
  "environment": {
    "repository": "minoveaz/loopdev-v2",
    "repository_path": "/Users/minoveaz/Documents/Proyectos/loopdev-v2",
    "checkout_type": "branch",
    "branch": "feature/crm-v2-foundation",
    "base_branch": "develop",
    "head_commit": "78f4d9e",
    "working_tree": "modified",
    "runtime_url": "http://localhost:8081",
    "runtime_port": 8081
  },
  "input_artifacts": [
    "module-design",
    "module-plan",
    "domain-model",
    "api-contracts"
  ],
  "decisions": [
    {
      "id": "DEC-001",
      "status": "confirmed",
      "summary": "Reuse PlatformNotesPanel and NoteEditorDrawer"
    }
  ],
  "actions": [
    "Implemented the approved detail route",
    "Added regression coverage for empty Notes state"
  ],
  "output_artifacts": [
    "src/loopdev/pages/crm/OpportunityDetail.tsx",
    "src/test/platform/notes-attachments.test.tsx"
  ],
  "validation": [
    {
      "command": "npm run test -- opportunity-detail",
      "result": "passed",
      "evidence": "test output and runtime smoke check"
    }
  ],
  "requirements": [
    {
      "id": "REQ-NOTES-EMPTY",
      "status": "PASS",
      "evidence": "runtime and regression test"
    }
  ],
  "detected_failure": null,
  "likely_failure_origin": null,
  "next_handoff": "08-verify",
  "evidence_links": [],
  "notes": []
}
```

Do not store secrets, tokens or personal credentials in checkpoints. Redact
private data and use repository-relative paths when an absolute path is not
needed for disambiguation.

## Status vocabulary

Phase status:

```text
pending
running
completed
blocked
failed
deviated
skipped
```

Requirement status:

```text
PASS
PARTIAL
FAIL
NOT_TESTED
NOT_APPLICABLE
```

Decision status:

```text
confirmed
assumed
open
rejected
```

`deviated` means the implementation differs from the approved plan.
`blocked` means the phase cannot safely continue. Neither may be reported as
completed.

## Detection versus origin

Always distinguish the skill that found a problem from the phase that likely
introduced it:

```json
{
  "detected_failure": {
    "code": "VERIFY-003",
    "detected_by": "module-verify",
    "summary": "Notes drawer does not open in the empty state"
  },
  "likely_failure_origin": {
    "phase": "07-build",
    "skill": "module-build",
    "code": "BUILD-003",
    "confidence": 8
  }
}
```

The detecting skill must not silently reassign blame. If origin is uncertain,
use `null` and explain the uncertainty in `notes`.

## Error catalog

| Code | Skill/phase | Meaning |
|---|---|---|
| `DESIGN-001` | `module-design` | Requirement or scope is ambiguous |
| `DESIGN-002` | `module-design` | Platform capability is not classified |
| `DOMAIN-001` | `domain-model` | Invalid or contradictory transition |
| `DOMAIN-002` | `domain-model` | Invariant is undefined or contradictory |
| `ACCESS-001` | `access-design` | Permission or scope is missing |
| `ACCESS-002` | `access-design` | Tenant or sensitive-data isolation is unresolved |
| `API-001` | `api-contracts` | API/event contract is incomplete |
| `API-002` | `api-contracts` | Consumer compatibility is unresolved |
| `SYNC-001` | `sync-design` | Conflict or retry policy is missing |
| `SYNC-002` | `sync-design` | Migration or recovery path is missing |
| `PLAN-001` | `module-plan` | Dependency is unresolved |
| `PLAN-002` | `module-plan` | Existing pattern or target area is unavailable |
| `BUILD-001` | `module-build` | Checkout or runtime is not the intended one |
| `BUILD-002` | `module-build` | Implementation deviates from the approved plan |
| `BUILD-003` | `module-build` | Blocking validation or regression failure |
| `VERIFY-001` | `module-verify` | Required evidence is absent |
| `VERIFY-002` | `module-verify` | Runtime, route or environment mismatch |
| `VERIFY-003` | `module-verify` | Functional or regression failure |
| `VERIFY-004` | `module-verify` | Platform capability is duplicated or bypassed |
| `REVIEW-001` | `module-review` | Blocking release requirement |
| `REVIEW-002` | `module-review` | Release risk is unresolved |
| `GIT-001` | `git-workflow` | Branch, remote or repository operation is unsafe |
| `GIT-002` | `git-workflow` | Commit, push or PR evidence is incomplete |

## Handoff rules

1. A phase may hand off only when its completion gate is met.
2. A `blocked`, `failed` or `deviated` phase stops dependent phases.
3. A later phase may detect an earlier failure, but must link it to the
   likely origin rather than hiding it.
4. Re-running a phase keeps the same `run_id` and creates a new checkpoint
   revision or attempt.
5. Every checkpoint links to its input and output artifacts.
6. Git checkpoints describe delivery state only; they do not replace
   functional, visual, security or runtime evidence.

## Approval gates

The workflow pauses for explicit approval at these boundaries:

| Boundary | Required approval |
|---|---|
| `01-design` → `01-visual-design` | Product and architecture design approved |
| `01-visual-design` → specialized analysis | Visual source and review evidence approved |
| `06-plan` → `07-build` | Implementation scope and dependencies approved |
| `08-verify` → `09-review` | Verification evidence accepted for review |
| `09-review` → `10-git` | Release decision approved; commit may be automatic, push/PR require explicit approval |

An `open` decision, unresolved `blocked_by` entry or missing required
evidence prevents the next phase from starting.

## Resuming a run

Blocked runs are resumed with the same `run_id` and an incremented `attempt`.
The new checkpoint must record:

- the decision or evidence that removed the blocker;
- the previous checkpoint and attempt;
- the changed inputs;
- any invalidated downstream phases;
- the new next handoff.

Completed phases are not rerun unless an input or shared Platform contract
changed. If a Platform contract changes, all listed consumers must be
re-evaluated before the run continues.

## Platform impact and change requests

Any change to a shared capability must include a `platform_impact` entry in
`run.json` with:

- capability and decision (`REUSE`, `EXTEND_PLATFORM`, `MODULE_SPECIFIC`);
- current consumers;
- affected tests and routes;
- migration requirement;
- compatibility and rollback impact.

Changes outside the approved scope require a `change_requests` entry with:

```json
{
  "id": "CR-002",
  "requested_by": "user",
  "reason": "Reuse shared preview component",
  "impact": "medium",
  "approved": true,
  "approved_at": "<RFC3339 timestamp>"
}
```

An unapproved change request makes the current phase `deviated` or `blocked`.

## Evidence links and privacy

Large outputs must be stored as referenced artifacts rather than embedded in
checkpoints:

```json
{
  "type": "test-output",
  "path": "artifacts/module-runs/MOD-CRM-20260913-001/tests.txt",
  "sha256": "<digest>"
}
```

Allowed evidence includes test output, screenshots, visual diffs, build logs,
runtime recordings and CI links. Never store credentials, tokens or
unredacted PII. Each run must declare whether it contains PII, whether it was
redacted and its retention class.

## Commit and pull-request linkage

The run manifest should link product evidence to delivery state:

```text
run_id
  → checkpoint
  → commit
  → pull request
  → CI run
  → review
  → merge
```

The `10-git` checkpoint must record the commit, remote branch, pull request,
CI result and whether the reviewed commit changed afterwards. Once scope and
validation are approved, a local commit may be created automatically. Push and
pull-request creation always require explicit user approval. A Git checkpoint
cannot upgrade a failed functional or runtime checkpoint to completed.

## Continuous integration

CI executes `npm run validate:module-runs` in a dedicated
`module-traceability` job. This job validates every committed run checkpoint
under `docs/implementation/**/runs/` and the compatibility fallback
`docs/06-product/**/module-runs/`.

The validator checks JSON syntax, required checkpoint fields, status
vocabularies, completion timestamps, blocked failure data and array-shaped
artifacts/validation. It intentionally does not replace product tests,
runtime checks or release review.

## Issue lifecycle

`module-plan` creates one issue per executable phase or independently
reviewable work item using `.github/ISSUE_TEMPLATE/module-phase.md` or the
general work-item template. Every issue must link:

- the implementation track;
- the product definition;
- the implementation documentation;
- the run ID and span ID;
- dependencies and related issues;
- acceptance criteria.

During execution:

1. `module-build` updates the issue with actions, commits and evidence.
2. `module-verify` updates the issue with command, runtime, visual and
   regression evidence.
3. `module-review` records the verdict and remaining gaps.
4. The issue is closed only when its acceptance criteria, evidence checklist
   and phase checkpoint are complete.

An issue must remain open when the phase is `blocked`, `failed`, `deviated`,
`PARTIAL`, `FAIL` or `NOT_TESTED`. Closing an issue does not close the track or
mark the module release-ready; the final review must do that.

## Workflow metrics

Run `npm run report:module-runs` to produce a machine-readable summary of the
versioned checkpoints. The report tracks:

- completed, blocked, failed, pending and deviated phases;
- attempts and re-runs;
- detected failures;
- passed and failed validation commands;
- requirements with `PASS`, `PARTIAL`, `FAIL` or `NOT_TESTED`.

These metrics are diagnostic, not release gates by themselves. A high number
of `blocked` phases indicates a design or dependency problem; a high number of
`deviated` phases indicates plan instability; repeated `VERIFY` failures
indicate insufficient acceptance coverage or late regression detection.

## Review checklist

Before accepting a run, confirm:

- every phase has a checkpoint or an explicit `skipped` reason;
- all blockers have owners and next actions;
- every requirement has evidence or a documented gap;
- environment evidence identifies the intended checkout and runtime;
- detected failures are separated from likely origin;
- the run contains no secrets;
- the final review verdict matches the evidence;
- Git delivery is recorded separately from product completion.

## Autonomy policy

The workflow supports three execution modes:

| Mode | Local commit | Push | Pull request |
|---|---:|---:|---:|
| `interactive` | After approved scope and validation | Explicit approval | Explicit approval |
| `plan` | No production changes | No | No |
| `autopilot` | After approved scope and validation | Explicit approval | Explicit approval |

Automatic commits must still include the traceability run ID, the validated
scope and the required co-author trailer. Pushes and pull requests are
external repository actions and always require a separate explicit approval.

Local commits are recovery checkpoints and should be created after coherent
validated phases or before risky changes. Rollbacks must use a new
`git revert` commit linked to the affected run and checkpoint. Autonomous
`reset`, `amend`, force-push and history rewriting are not allowed.
