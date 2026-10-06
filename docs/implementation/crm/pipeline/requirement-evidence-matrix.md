# CRM Pipeline Requirement Evidence Matrix

| Requirement ID | Product definition reference | Implementation evidence | Test/evidence link | Status | Gap/next action |
|---|---|---|---|---|---|
| PIPELINE-VISUAL-GATE | `docs/06-product/crm/pipeline/` | Visual artifacts exist | `runs/MOD-CRM-PIPELINE-20260913-002/01-visual-design.json` | `PARTIAL` | Obtain explicit visual approval |
| PIPELINE-SPECIALIZED | Approved visual design | Historical helper artifacts exist | Checkpoints `02-domain` through `05-sync` | `FAIL` | Revalidate after visual approval |
| PIPELINE-PLAN | Valid specialized handoffs | Historical plan exists | `runs/MOD-CRM-PIPELINE-20260913-002/06-plan.json` | `FAIL` | Regenerate or revalidate after predecessors pass |

## Release blockers

- Visual design is not approved.
- Specialized analysis and plan were produced outside the canonical phase order.

## Known deviations

- Historical downstream artifacts are retained but their checkpoints are marked `deviated`.