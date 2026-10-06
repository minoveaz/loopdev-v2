# <Module> Implementation Plan

## Inputs

 Product definition: `tracks/active/platform/2026-09-13-loopdev-v2-multiplatform-foundation.md`
 Design run: `MOD-NOTES-20260914-001`
 Track: `tracks/active/platform/2026-09-13-loopdev-v2-multiplatform-foundation.md`
 Main issue: pending issue setup after plan approval
 Approved by: pending plan approval
 Approval date: pending

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
| Repository path | `/workspaces/loopdev-v2` |
| Checkout type | branch |
| Branch | `feature/crm-v2-foundation` |
| Base branch | not recorded |
| HEAD | `7ee970db79438f96db160ab03ca5acb2074dc1a8` |
| Runtime URL | desktop `http://127.0.0.1:8082`, mobile `http://127.0.0.1:8083` |
| Runtime port | 8082 / 8083 |
| Working tree | modified; documentation workspace only |
| Working tree | |

## Ordered work breakdown

| ID | Phase | Issue | Type | Task | Dependencies | Files/areas | Validation | Definition of done |
| TASK-NOTES-CONTRACT | 07-build | pending | shared contract | Implement NotesPort and DTOs | none | `packages/contracts/src/notes.ts` | contract tests, typecheck | all six operations and typed states pass |
| TASK-NOTES-DESKTOP-ADAPTER | 07-build | pending | desktop renderer | Wrap existing drawer behavior without UI change | contract | `src/loopdev/domains/platform`, NotesPanel | focused Platform tests | desktop Quick/Rich drawer unchanged |
| TASK-NOTES-MOBILE-ADAPTER | 07-build | pending | mobile renderer | Add explicit mobile adapter and boundary | contract | `apps/mobile/adapters/notes` | mobile boundary, mobile tsc | no desktop imports |
| TASK-NOTES-MOBILE-CARD | 07-build | pending | mobile renderer | Implement Rivera-inspired note card/list/actions | mobile adapter | `apps/mobile/components` | focused component tests | list and action states evidenced |
| TASK-NOTES-MOBILE-RICH | 07-build | pending | mobile renderer | Implement Quick/Rich mobile editor and TipTap-compatible JSON | mobile adapter | `apps/mobile/components` | focused editor tests | rich actions and draft states pass |
| TASK-NOTES-CUSTOMER360 | 07-build | pending | migration | Migrate Customer 360 mobile to NotesPort | desktop/mobile adapters and renderers | Customer 360 consumers | multiplatform contracts/boundary | no duplicate Notes state |
| TASK-NOTES-ACCESS | 07-build | pending | backend | Enforce permissions, scope and audit | contract | Platform adapter/policy tests | security-focused tests | cross-tenant and forbidden cases pass |
| TASK-NOTES-SYNC | 07-build | pending | shared contract | Implement pending/retry/conflict semantics | contract/access | local adapters and sync tests | quality suite | no silent rich conflict loss |
| TASK-NOTES-TESTS | 07-build | pending | test | Run parity, security and renderer suites | Customer360/sync | `src/test`, `apps/mobile` | focused test commands | every operation has action evidence |
| TASK-NOTES-AUDITS | 07-build | pending | audit | Run reuse, boundary, responsibility and rollback audits | contract | docs/source boundaries | typecheck/boundary validators | no duplicate ownership |
|---|---|---:|---|---|---|---|---|---|
| | | # | | | | | | |
 [x] Environment truth audit.
 [x] Platform reuse audit.
 [x] Legacy-flow audit.
 [x] Route and runtime audit.
 [x] Surface-state audit.
 [x] Operation-parity audit: compare every user operation by platform; record
 [x] Renderer-action test audit: define focused component tests for every
 [x] Accessibility and i18n audit.
 [x] Security and rollback audit.
 [x] Visual design approval (`01-visual-design`) recorded before specialized analysis and plan approval.
	adaptation to its approved decision.
- [ ] Renderer-action test audit: define focused component tests for every
	changed user operation; reserve browser journeys for high-risk or E4 tasks.
- [ ] Accessibility and i18n audit.
- [ ] Security and rollback audit.
| Notes | listNotes | adapted | adapted | not_applicable | not_applicable | `DESIGN-003` | CONTRACT, DESKTOP-ADAPTER, MOBILE-ADAPTER | unit/component |
| Notes | createNote | adapted | adapted | not_applicable | not_applicable | `VIS-004` | CONTRACT, MOBILE-RICH | unit/component |
| Notes | updateNote | adapted | adapted | not_applicable | not_applicable | `VIS-004` | CONTRACT, MOBILE-RICH | unit/component |
| Notes | deleteNote | adapted | adapted | not_applicable | not_applicable | `VIS-003` | ACCESS, TESTS | unit/component |
| Notes | applyVisibilityAndPermissions | adapted | adapted | not_applicable | not_applicable | `DESIGN-003` | ACCESS, SYNC | unit |
| Notes | relateToContact | adapted | adapted | not_applicable | not_applicable | `DESIGN-003` | CUSTOMER360, TESTS | component |
- [ ] Visual design approval (`01-visual-design`) recorded before specialized analysis and plan approval.

## Issue execution policy

| PLAN-001 | Existing desktop behavior regression | High | Platform | Freeze drawer and add before/after tests | open |
| PLAN-002 | Native rich editor is not in current scope | Medium | Platform | iOS/Android planned with follow-up owner | open |
| PLAN-003 | TipTap runtime boundary in mobile | High | Platform | Use mobile-specific web/native adapter; no desktop imports | open |
| PLAN-004 | Scope/permission leakage via offline queue | Critical | Platform | tenant partition and pre-send permission recheck | open |
Each issue must contain a measurable acceptance checklist, evidence links and
the run/span ID. An issue is closed only after its definition of done passes.

## Operation parity inventory

| Capability | Operation | Desktop web | Mobile web | iOS | Android | Adaptation/decision | Task IDs | Test level |
|---|---|---|---|---|---|---|---|---|
| | | `implemented/adapted/missing/not_applicable` | `implemented/adapted/missing/not_applicable` | | | | | `unit/component/journey/device` |

## Risks and blockers

| ID | Risk/blocker | Impact | Owner | Mitigation | Status |
|---|---|---|---|---|---|
