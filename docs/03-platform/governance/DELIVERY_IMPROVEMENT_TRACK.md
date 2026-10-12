# Delivery improvement track

Branch: `codex/delivery-improvements` (based on `develop`)  
Status: implementation in progress

## Objective

Make delivery runs reproducible and internally consistent. A run must not report verification or release approval while required tasks are blocked, and every verification claim must be attributable to an immutable source snapshot and recorded evidence.

This track is based on the historical audit of `MOD-LEADS-20260917-001` and `MOD-PIPELINE-20260918-001`. It improves the delivery harness for future runs; it does not rewrite historical evidence or retroactively mark those runs as verified.

## Workstreams

### 1. State and gate consistency

- Define one canonical rule for when a ledger is eligible for verification, review, and release.
- Block final approvals when the ledger is blocked, required tasks are incomplete, or required evidence is missing.
- Reconcile run manifest, checkpoint, ledger, and README lifecycle states; fail validation when they disagree.
- Make terminal state explicit: completed runs must have a completed terminal phase and Git handoff, or record why handoff is intentionally omitted.
- Add regression coverage for blocked-ledger and conflicting-state cases.

**Done when:** no code path can record verification/release approval for a blocked ledger, and repository validation rejects inconsistent run state.

### 2. Reproducible source and runtime evidence

- Require a clean, immutable source identity before verification (commit SHA, or a preserved patch plus base SHA and patch digest).
- Bind command results and runtime journeys to that source identity.
- Require runtime URL/environment and platform/device details for UI journey evidence.
- Store structured evidence objects in the run evidence directory and validate their references, checksums, exit results, and source identity.
- Preserve machine-readable logs/results rather than relying on action prose in `*-data.json`.

**Done when:** an auditor can identify exactly which source snapshot and environment each verification result tested, and dirty/unattributed runs cannot pass verification.

### 3. Approval and artifact integrity

- Compute approval fingerprints from the referenced artifact bytes at approval time.
- Recompute and compare fingerprints during later validation.
- Record approver identity and approval timestamp as distinct fields; validate required fields and reject reused/mismatched fingerprints.
- Tie each approval to a specific gate, artifact path, and source snapshot.

**Done when:** approvals fail validation if their artifact changes or the fingerprint does not match its content.

### 4. Platform-specific verification

- Make mobile typecheck and tests explicit delivery commands, separate from root desktop typecheck.
- Derive required platform checks from the module scope/ledger.
- Require structured UI journey evidence for E4 tasks (including Leads conversion/speed dial and Pipeline speed dial).
- Keep static boundary checks separate from runtime/UI acceptance evidence.

**Done when:** required mobile platforms cannot be marked verified based only on desktop checks or mobile boundary validation.

### 5. Canonical delivery records and historical reconciliation

- Establish the ledger as the canonical source for requirements, tasks, blockers, and evidence IDs.
- Generate or validate README phase/status summaries and requirement/platform matrices against that source.
- Resolve Leads requirement-ID drift between its ledger and requirement evidence matrix.
- Mark the audited Leads and Pipeline runs as `superseded`, `experimental`, or `unverified` where supported by evidence; preserve their original records and document the decision.
- Resolve the Pipeline run versus current visual-design gate/plan discrepancy without inventing missing approvals.

**Done when:** canonical records agree, and historical runs have an explicit, evidence-backed disposition.

## Delivery sequence

1. **P0 — Gate correctness:** state-machine invariants and ledger eligibility are implemented for workflow version 2; cross-artifact validation is enabled for new runs. Regression coverage and validation are pending.
2. **P0 — Evidence provenance:** immutable source snapshot, command/runtime evidence schema, validator enforcement.
3. **P1 — Approval integrity:** artifact digest verification and actor/gate binding.
4. **P1 — Platform acceptance:** explicit mobile checks and required E4 journey records.
5. **P1 — Reconciliation:** canonical record alignment and evidence-backed dispositions for the two audited runs.
6. **P2 — Adoption:** update delivery workflow documentation/templates and run the workflow on one pilot module.

Dependencies: Workstream 1 precedes safe release adoption. Workstreams 2 and 3 establish provenance/integrity. Workstream 4 depends on agreeing the required platform matrix. Historical reconciliation must follow those schema decisions and must preserve original run data.

## Track-level acceptance

- [x] Delivery validation rejects a blocked ledger at verification/release for workflow version 2.
- Completed phase evidence is attributable to a clean, immutable source snapshot.
- Approval fingerprints are computed and verified against the approved artifact.
- Required platform checks and E4 journeys are machine-verifiable.
- Manifest, checkpoint, ledger, README, and evidence matrices do not contradict one another.
- Leads and Pipeline historical records have documented dispositions based only on preserved evidence.
- Documentation describes the implemented gates and a pilot run demonstrates the lifecycle end to end.

## Audit references

- Leads run: `docs/implementation/crm/leads/runs/MOD-LEADS-20260917-001/`
- Leads ledger: `docs/implementation/crm/leads/delivery-ledger.json`
- Leads requirement matrix: `docs/implementation/crm/leads/requirement-evidence-matrix.md`
- Pipeline run: `docs/implementation/crm/pipeline/runs/MOD-PIPELINE-20260918-001/`
- Pipeline ledger: `docs/implementation/crm/pipeline/delivery-ledger.json`
- Delivery state machine: `scripts/lib/delivery-state-machine.mjs`

## Working rules for this track

- Do not manufacture evidence for historic runs. Record gaps as gaps.
- Preserve historical run records; use explicit supersession/disposition metadata rather than silently editing outcomes.
- Implement in small reviewable changes on this branch and keep each acceptance criterion traceable to code or documentation.
