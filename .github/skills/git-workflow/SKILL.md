---
name: git-workflow
description: Validate LoopDev v2 branches, commits, pushes, and pull requests.
user-invocable: true
---

# LoopDev v2 Git Workflow

Use this workflow for every branch, commit, push, or pull request operation.

## Branches

Protected branches are `develop` and `main`.

Create work from an updated `develop` branch using one of these formats:

- `feature/<area>-<topic>` for product or architecture work.
- `fix/<area>-<topic>` for behavior or bug corrections.
- `chore/<area>-<topic>` for tooling, governance, maintenance, or refactors.
- `docs/<area>-<topic>` for documentation-only work.
- `test/<area>-<topic>` for tests and validation infrastructure.

Use lowercase words separated by hyphens. Keep one branch to one primary
intention and do not commit directly to `develop` or `main`.

## Commits

Use Conventional Commits with a lowercase scope:

```text
type(scope): imperative description
```

Use `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, or `perf` as the type.
Keep commits coherent, reviewable, and free of unrelated changes.

Before committing:

```bash
git status
git diff --stat
git diff --cached --check
```

## Pull requests

- Normal work targets `develop`.
- Releases target `main` only from `develop`.
- Use a PR title matching the Conventional Commits format.
- Link the related issue with `Closes #<id>` or `Refs #<id>`.
- Complete the repository PR template.
- Describe validation, risks, contracts, migrations, RLS, secrets, and
  external integrations when applicable.
- Merge only after required CI and review checks pass.

The canonical reference is `docs/03-platform/governance/GIT_WORKFLOW.md`.

## Common Contract

### Input context

- repository and checkout path;
- current branch, base branch and working-tree state;
- requested Git operation and any linked issue or pull request.

### Decision status

Classify repository facts as `confirmed`, `assumed` or `open`. Stop before a
destructive or ambiguous operation instead of inferring user intent.

### Output handoff

Report:

- operation performed or intentionally not performed;
- branch, commit, remote and pull-request evidence;
- validation commands and results;
- conflicts, blockers and required user decisions;
- state `complete`, `partial` or `blocked`.

### Action boundaries

This skill handles Git workflow only. It does not design modules, implement
production behavior, rewrite history or force-push. Once the approved scope
and validation gates pass, creating a local commit does not require a second
approval. Pushes and pull requests always require explicit user approval.
Neither a commit nor a clean Git state alone proves functional completion.

Local commits should be created at coherent phase boundaries or before risky
changes, using a Conventional Commit message that includes the module run ID
when available. They are recovery checkpoints, not publication events. If a
checkpoint must be undone, create a new `git revert` commit; do not reset,
amend, force-push or rewrite history autonomously.

### Traceability

Record a Git checkpoint linked to the module run using
`docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md`, with repository path,
branch, base, `HEAD`, working-tree state, commit/push/PR evidence, detected
failure, likely origin and status. Git evidence must never be presented as
functional or runtime evidence. Use
`docs/implementation/_templates/module-implementation-readme.md` for the
delivery links and update the relevant phase evidence before linking the
commit, remote branch, pull request and related issue/track.
