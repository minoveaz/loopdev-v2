# Module Development Runs

This directory is the fallback location for traceability runs when a module
does not yet have its own product documentation directory.

Use the templates in:

- `docs/implementation/_templates/MODULE_RUN_TEMPLATE.json`
- `docs/implementation/_templates/MODULE_CHECKPOINT_TEMPLATE.json`

Store one directory per run:

```text
module-runs/<run-id>/
├── run.json
├── 01-design.json
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

The canonical contract is
`docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md`.

## Review states

Use the run index to identify:

- active runs;
- blocked runs;
- failed runs;
- runs awaiting user approval;
- completed runs;
- runs associated with a pull request.

Do not store secrets, tokens or unredacted personal data in this directory.
