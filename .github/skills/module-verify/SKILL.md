---
name: module-verify
description: Verify a LoopDev module against its design, plan, tests and runtime behavior.
user-invocable: true
---

# LoopDev Module Verify

Evaluate the implemented module against `module-design` and `module-plan`.

## Responsibilities

- Verify the actual checkout, branch, commit and running application port.
- Execute the smallest relevant tests, then escalate when evidence requires it.
- Validate TypeScript, lint, build, domain tests, adapter tests, permission tests,
  synchronization tests and visual flows.
- Check loading, empty, error, forbidden, conflict, offline and success states.
- Confirm shared platform behavior and absence of legacy duplicate flows.
- Confirm LoopDev uses Rivera's shared visual system, preserves its visual
  language and has no duplicated primitives or forbidden Rivera boundary
  imports.
- Verify cross-module integrations and Platform reuse for Notes, Files,
  Activity, Tasks, Relations and Document Intelligence when applicable.
- Check that new product UI does not use native `<select>` controls or browser
  default substitutes where an established LoopDev primitive exists.
- Compare requirements with observed evidence, not source presence alone.

## Required Output

Use a matrix:

| Requirement | Status | Evidence | Gap | Severity |
|---|---|---|---|---|

Then provide:

1. Validation commands and results.
2. Functional gaps.
3. Technical risks.
4. Regression risks.
5. Exact next actions.

Do not change production code unless the user explicitly requests remediation.

## Common Contract

### Input context

- `module-design`;
- `module-plan`;
- implementation checkout and runtime URL/port;
- available test, build and lint configuration.

### Decision status

Classify each requirement as `confirmed`, `assumed`, `open` or
`not-applicable`. Classify evidence as `PASS`, `PARTIAL`, `FAIL` or
`NOT_TESTED`.

### Output handoff

Every requirement must have observable evidence or an explicit gap. End with:

- validation commands and results;
- functional and technical gaps;
- regression risks;
- exact next actions;
- state `complete`, `partial` or `blocked`.

### Action boundaries

This skill gathers evidence and reports gaps. It does not modify production
code, approve its own remediation or claim success from source presence alone.

### Traceability

Create a verification checkpoint following
`docs/03-platform/MODULE_DEVELOPMENT_TRACEABILITY.md`. Include the environment
snapshot, requirement matrix, command results, runtime evidence,
visual/accessibility evidence, detected failures, likely implementation origin
and exact next handoff. Use
`docs/implementation/_templates/requirement-evidence-matrix.md` and
distinguish `detected_by` from `likely_origin`. Do not close verification
issues until every applicable requirement has evidence or an explicit gap.
Leave the issue open for `PARTIAL`, `FAIL` or `NOT_TESTED` outcomes.

## Platform integration verification

For every applicable Platform capability, verify:

- the documented contract is actually consumed;
- the shared adapter and permissions are used;
- events and relationships use the expected shapes;
- upload, preview, notes and processing states are not duplicated;
- offline and error behavior follows the shared capability;
- all affected modules still work.

Report duplicate or bypassed Platform implementations as at least a high
severity architectural gap unless the design documents an approved exception.

## Operational verification

Report environment evidence before functional results:

- actual repository path and checkout;
- branch and `HEAD`;
- working-tree state;
- runtime URL/port and serving process;
- validation timestamp.

Verify the complete surface matrix, including empty states where conditional
containers may hide drawers or dialogs, and portal-rendered content outside
the original test container.

Verify:

- routes, navigation, deep links, refresh and direct URL permissions;
- legacy flow removal;
- accessibility, keyboard focus, responsive behavior, i18n and RTL;
- local data versus Rivera demo data;
- tenant isolation, sensitive fields, exports and cached permissions;
- migration, feature flags, rollback and recovery;
- all affected existing modules, not only the new screen.

Do not treat source presence, a passing typecheck or a clean commit as
functional evidence.
