# Historical Delivery Run Dispositions

This record reconciles two audited workflow v1 runs using their preserved run
manifests, checkpoints, current delivery ledgers, evidence matrices and
artifact bytes. It does not edit or retroactively repair either run.

| Run | Disposition | Evidence and reason |
|---|---|---|
| Leads — `MOD-LEADS-20260917-001` | `UNVERIFIED` | The manifest remains `running` at `09-review` while verification and release are marked approved. The current ledger is `blocked`, with the speed-dial and conversion tasks blocked on missing E4 journeys. Its verification checkpoint has only a ledger-validation command and no `exit_code` or `source_commit`; no structured E4/E5 records exist. All five approved artifact fingerprints in the manifest differ from the current bytes at their recorded paths. |
| Pipeline — `MOD-PIPELINE-20260918-001` | `UNVERIFIED` | The manifest remains `running` at `09-review` while verification and release are marked approved. The current ledger is `blocked` on the speed-dial E4 task. Although verify prose reports typecheck and 67 test suites, checkpoint validation entries have no `exit_code` or `source_commit`; no structured E4 journey records exist. All five approved artifact fingerprints differ from the current bytes at their recorded paths. |

## Pipeline gate resolution

The earlier coherent Pipeline run, `MOD-CRM-PIPELINE-20260913-002`, is paused
at `WAITING_VISUAL_DESIGN_APPROVAL` and its visual-design checkpoint records
approval as pending. The later run does not contain verifiable evidence to
supersede that gate: its approval artifact hashes do not match current files,
its verification commands are prose-only, its ledger is blocked, and its
platform scope conflicts with the ledger about whether iOS and Android are in
scope. Therefore the delivery posture remains paused at the earlier visual
approval gate. No missing approval is inferred.

## Disposition rules

- `UNVERIFIED` means the preserved record does not prove its verification or
  release claims under the current evidence standard. It is not a claim that
  the implementation is defective.
- Neither run is labelled `SUPERSEDED`: no later verified delivery run for
  either module is present in the audited records.
- Keep each original manifest, checkpoint, ledger and action-data file intact.
  Any future run must use the current workflow, resolve the blocked tasks and
  produce fresh snapshot-bound evidence.

## Source records

- Leads run and ledger: `docs/implementation/crm/leads/runs/MOD-LEADS-20260917-001/`
  and `docs/implementation/crm/leads/delivery-ledger.json`.
- Pipeline runs and ledger: `docs/implementation/crm/pipeline/runs/`, including
  `MOD-CRM-PIPELINE-20260913-002` and `MOD-PIPELINE-20260918-001`, plus
  `docs/implementation/crm/pipeline/delivery-ledger.json`.
- Requirement matrices: `docs/implementation/crm/leads/requirement-evidence-matrix.md`
  and `docs/implementation/crm/pipeline/requirement-evidence-matrix.md`.
