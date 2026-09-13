---
name: module-build
description: Implement an approved LoopDev module plan in small, validated increments.
user-invocable: true
---

# LoopDev Module Build

Implement an approved `module-design` and `module-plan` in the verified
LoopDev checkout.

## Responsibilities

- Confirm repository, checkout, branch, commit and working tree before editing.
- Refuse to mix incompatible checkouts or overwrite unrelated local changes.
- Implement only the approved scope and preserve existing LoopDev patterns.
- Reuse shared Notes, Tasks, Activity, Files and `NoteEditorDrawer`.
- Use Rivera's shared design system and visual patterns as the default. Do not
  create duplicate primitives or import Rivera demo pages, features or data
  into LoopDev business code.
- Do not introduce native browser product controls such as `<select>`. Reuse
  the established LoopDev primitives and interaction patterns, including
  `@/components/ui/select`, `Command`, `Popover` and `Calendar`, unless a
  documented accessibility or platform requirement justifies an exception.
- Keep business logic in contracts, hooks, services and adapters.
- Keep presentation, application/use-case, domain, port/contract and adapter
  responsibilities separate according to
  `docs/03-platform/governance/SOFTWARE_ARCHITECTURE_AND_DESIGN_CONTRACT.md`.
- Record significant refactors with their reason, preserved behavior, affected
  files and consumers, risk, before/after tests, rollback and residual debt.
- Stop and report an unapproved dependency-boundary or responsibility
  deviation; do not hide it inside a cleanup commit.
- Reuse Platform capabilities instead of implementing module-local versions.
  This includes Notes, Files/upload/preview, Activity/Timeline, Tasks,
  Relations and Document Intelligence.
- Implement local-first behavior before backend-only capabilities where required.
- Add or update tests with each behavior change.
- Run targeted validation after each coherent phase.
- Stop and report when the codebase diverges from the plan or a design decision
  is required.

## Orchestration

Use helper skills for focused decisions, not as independent implementers:

- `domain-model`: entities, states and invariants.
- `api-contracts`: API and event contracts.
- `access-design`: RBAC, tenant scope and RLS.
- `sync-design`: local-first and synchronization behavior.

## Required Output

- Changes implemented.
- Validation commands and results.
- Requirements completed and pending.
- Files changed.
- Risks, migrations and follow-up work.

Never claim completion without evidence from the actual checkout.

## Common Contract

### Documentation workspace

Use the workspace created by `delivery` at
`docs/implementation/<suite>/<module>/`. Update only the build phase evidence,
architecture deviations/refactoring records, checkpoints and linked issue.
Never create a parallel flat directory or replace prior phase evidence.

### Input context

- approved `module-design`;
- approved `module-plan`;
- completed `module-discovery` baseline and expected-versus-existing matrix;
- actual repository, checkout, branch, commit and working-tree state.

### Decision status

Classify changes as `confirmed`, `assumed`, `open` or `deviated`. Stop when an
open decision or plan deviation requires user approval.

### Output handoff

For every completed phase report:

- tasks completed and files changed;
- tests and validation commands with results;
- acceptance evidence;
- migrations, risks and follow-up work;
- state `complete`, `partial`, `blocked` or `deviated`.

### Action boundaries

This skill may modify production code only within the approved plan. It may
create a local commit after the approved phase passes its validation gates,
but it must not push, create a pull request, redesign scope silently or
declare backend/release readiness without corresponding evidence.

### Traceability

Create a checkpoint for every coherent build phase using
`docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md`. Record the exact files
changed, tests, commands, runtime evidence, plan deviations, migrations,
detected failure, likely origin and next handoff. Mark the phase `blocked` or
`deviated` instead of claiming completion when evidence is incomplete. Update
`docs/implementation/_templates/phase-evidence.md` and its GitHub issue before
closing the phase issue. Never close an issue whose acceptance checklist or
evidence is incomplete.

## Platform reuse gate

Before adding a shared-looking component, adapter, persistence model, event or
processing workflow, answer:

1. Does the Platform inventory already provide it?
2. Which existing contract and consumers prove the reuse pattern?
3. Is the difference a module rule or only a visual variation?
4. If it is missing, should Platform be extended first?

Classify the result as `REUSE`, `EXTEND_PLATFORM`, `MODULE_SPECIFIC` or
`BLOCKED`. Creating a duplicate notes editor, file uploader, document preview,
timeline, task widget, extractor or permission model is a plan deviation and
requires explicit approval.

## Operational truth gate

Before editing and before reporting completion, record the actual repository
path, checkout type, branch, `HEAD`, working-tree state and intended runtime
URL/port. Never use another checkout or runtime as evidence.

For UI behavior, validate the real route after implementation. Include deep
links, refresh, navigation and the actual surface where portals render.
When replacing UX, remove or disable the legacy flow and add a regression test
proving that only the approved path remains.

Every behavior change must cover the applicable states:

```text
loading, empty, error, forbidden, conflict, offline, pending, success
```

Respect the approved accessibility, i18n, RTL, security, migration and
rollback decisions. A build or typecheck cannot substitute for functional,
permission or runtime evidence.
## Multiplatform build gate

Use the platform scope and update `platform-evidence-matrix.md` during each
coherent phase. For in-scope mobile work, run `cd apps/mobile && npm ci`,
`npx tsc --noEmit`, `npx expo-doctor` and an Expo Web export in addition to
desktop validation. Record runtime URLs, platform-specific deviations and
shared-contract consumers; a desktop-only implementation is a deviation unless
approved.
