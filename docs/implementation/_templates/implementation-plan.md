# <Module> Implementation Plan

## Inputs

- Product definition:
- Design run:
- Track:
- Main issue:
- Approved by:
- Approval date:

## Environment baseline

| Field | Value |
|---|---|
| Repository path | |
| Checkout type | |
| Branch | |
| Base branch | |
| HEAD | |
| Runtime URL | |
| Runtime port | |
| Working tree | |

## Ordered work breakdown

| ID | Phase | Issue | Type | Task | Dependencies | Files/areas | Validation | Definition of done |
|---|---|---:|---|---|---|---|---|---|
| | | # | | | | | | |

## Mandatory audits

- [ ] Environment truth audit.
- [ ] Platform reuse audit.
- [ ] Legacy-flow audit.
- [ ] Route and runtime audit.
- [ ] Surface-state audit.
- [ ] Operation-parity audit: compare every user operation by platform; record
	`implemented`, `adapted`, `missing` or `not_applicable`, and link every
	adaptation to its approved decision.
- [ ] Renderer-action test audit: define focused component tests for every
	changed user operation; reserve browser journeys for high-risk or E4 tasks.
- [ ] Accessibility and i18n audit.
- [ ] Security and rollback audit.
- [ ] Visual design approval (`01-visual-design`) recorded before specialized analysis and plan approval.

## Issue execution policy

Each issue must contain a measurable acceptance checklist, evidence links and
the run/span ID. An issue is closed only after its definition of done passes.

## Operation parity inventory

| Capability | Operation | Desktop web | Mobile web | iOS | Android | Adaptation/decision | Task IDs | Test level |
|---|---|---|---|---|---|---|---|---|
| | | `implemented/adapted/missing/not_applicable` | `implemented/adapted/missing/not_applicable` | | | | | `unit/component/journey/device` |

## Risks and blockers

| ID | Risk/blocker | Impact | Owner | Mitigation | Status |
|---|---|---|---|---|---|
