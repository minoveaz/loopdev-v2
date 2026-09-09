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

The canonical reference is `docs/03-platform/GIT_WORKFLOW.md`.
