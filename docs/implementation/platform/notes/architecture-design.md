# Platform Notes Architecture and Design

## Document control

| Field | Value |
|---|---|
| Module | Notes |
| Product definition | `tracks/active/platform/2026-09-13-loopdev-v2-multiplatform-foundation.md` |
| Run ID | MOD-NOTES-20260914-001 |
| Track | LoopDev v2 Multiplatform Foundation |
| Design checkpoint | `runs/MOD-NOTES-20260914-001/01-design.json` |
| Owner | Platform |
| Status | `draft` |

## Target architecture

### Context and boundaries

- Suite and bounded context: Platform Notes, shared by CRM and Customer 360.
- Owned responsibilities: note lifecycle, relations, visibility outcomes, permission decisions, version/concurrency and local-first result semantics.
- Explicitly out of scope: remote backend implementation, native renderer implementation, attachments as a new subsystem, and legacy duplicate editors.
- Public routes and entry points: existing Customer 360 contact detail; no new route is required for MVP.
- Consuming modules: Customer 360, CRM, Communications where internal-note mapping is approved, and Platform workspace surfaces.
- Consumed Platform capabilities: `EntityScope`/`EntityRef`, Activity/audit, local persistence patterns and Rivera primitives.

### Layer map

| Layer | Responsibilities | Files/areas | Allowed dependencies | Forbidden dependencies |
|---|---|---|---|---|
| Presentation | Render list/editor and states | Desktop PlatformNotesPanel/common primitives; mobile-owned Notes UI | Notes application/port | Desktop runtime in mobile |
| Application | Orchestrate list/create/update/delete and map results | Notes use-case hooks/adapters | Domain rules and renderer internals | Duplicated consumer state |
| Domain | Note identity, scope, relation, visibility, version and lifecycle | Shared contract types and pure validators | UI framework and persistence APIs | Per-client rules |
| Ports/contracts | Define NotesPort, operation IDs, errors, state semantics and DTOs | `packages/contracts/src/notes.ts` | Domain-neutral TypeScript | Desktop imports |
| Adapters/infrastructure | Local desktop/mobile persistence and future transport | `src/loopdev/domains/...`, `apps/mobile/...` adapters | NotesPort | Components deciding authorization |

### Dependency direction

```text
Presentation → Application → Domain → Ports → Adapters
```

Document any exception, its reason and its owner:

| Exception | Reason | Risk | Approval | Follow-up |
|---|---|---|---|---|
| | | | | |

## Responsibility matrix

| Concern | Authoritative owner | Consumers | Must not contain | Evidence |
|---|---|---|---|---|
| UI rendering | | | | |
| Use cases/orchestration | | | | |
| Domain rules/invariants | | | | |
| Persistence | | | | |
| API/transport | | | | |
| Authorization/tenant scope | | | | |
| Synchronization/conflicts | | | | |
| Shared Platform capability | | | | |

## Module and Platform contracts

| Capability | `REUSE` / `EXTEND_PLATFORM` / `MODULE_SPECIFIC` / `BLOCKED` | Contract | Consumers | Duplicate prohibited? |
|---|---|---|---|---|
| | | | | |

## Structural quality baseline

- [ ] Cohesion and coupling risks identified.
- [ ] SRP risks identified.
- [ ] Duplicate implementations searched for.
- [ ] Public contracts and dependency direction documented.
- [ ] Domain/application behavior is independently testable.
- [ ] Tenant, authorization and synchronization boundaries documented.
- [ ] Residual technical debt has an owner and issue.

## Refactoring records

| ID | Reason | Behavior preserved | Files/consumers | Risk | Before evidence | After evidence | Rollback | Residual debt |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

## Open decisions and deviations

| ID | Decision or deviation | Status | Impact | Approver | Resolution/follow-up |
|---|---|---|---|---|---|
| | | | | | |

## Responsibility decisions

| Concern | Authoritative owner | Consumers | Must not contain | Evidence |
|---|---|---|---|---|
| UI rendering | Desktop/mobile renderer owners | Customer 360, CRM | Domain rules or persistence calls | Rivera reference and mobile boundary requirement |
| Use cases/orchestration | Notes application adapter/hooks | All renderers | JSX-specific state duplication | `NotesPort` design |
| Domain rules/invariants | Shared NotesPort/domain contract | All adapters | Client-only lifecycle rules | Discovery matrix |
| Persistence | Explicit desktop/mobile local adapters; future remote adapter | Notes application | UI storage calls | Existing local adapters |
| Authorization/tenant scope | Server/future adapter; clients reflect results | All clients | UI-only enforcement | Access phase |
| Synchronization/conflicts | Sync adapter and shared result states | All clients | Silent overwrite | Sync phase |

## Module and Platform decisions

| Capability | Decision | Contract | Consumers | Duplicate prohibited? |
|---|---|---|---|---|
| Notes lifecycle | `EXTEND_PLATFORM` | `packages/contracts/src/notes.ts` | Customer 360, CRM, mobile | Yes |
| Existing desktop Notes UI | `REUSE` | `PlatformNotesPanel` / `NoteEditorDrawer` | Desktop | Yes |
| Mobile Notes UI | `MODULE_SPECIFIC` | Mobile list/editor composition | Mobile Customer 360 | No desktop copy/import |
| Contact relation | `REUSE` | `EntityRef` and contact contract | Customer 360/CRM | No parallel relation model |

## Semantic and parity design

| Operation | Shared meaning | Desktop renderer | Mobile renderer | iOS/Android |
|---|---|---|---|---|
| listNotes | Scope/relation/visibility-filtered page | Platform panel composition via adapter | Mobile list with touch actions | Planned adapter |
| createNote | Validate, relate, authorize, persist or mark pending | Existing editor through port | Mobile editor owned by apps/mobile | Planned adapter |
| updateNote | Expected version required; conflict is explicit | Drawer/editor adaptation | Mobile editor with conflict state | Planned adapter |
| deleteNote | Authorized idempotent tombstone/delete | Context action and confirm | Mobile action menu and confirm | Planned adapter |
| applyVisibilityAndPermissions | Shared decision; renderer reflects forbidden/disabled | Rivera controls and forbidden state | Mobile controls and forbidden state | Planned adapter |
| relateToContact | Relation shares tenant scope and deep-link meaning | Customer 360 contact relation | Customer 360 mobile relation | Planned adapter |

## Required UI states

| Surface | Loading | Empty | Error | Forbidden | Conflict | Offline | Pending | Success |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Desktop Notes | yes | yes | yes | yes | yes | yes | yes | yes |
| Mobile Notes list/editor | yes | yes | yes | yes | yes | yes | yes | yes |

## Accessibility, responsive and navigation

- Desktop uses Rivera spacing, typography, focus-managed drawer/dialog primitives and keyboard action menus.
- Mobile uses touch targets, safe-area padding, native back behavior and a dedicated list/editor composition; it never imports `src/` desktop runtime or `NoteEditorDrawer`.
- The existing contact route remains the deep-link target. Refresh, back and forbidden relation behavior must preserve contact context without leaking note data.
- Copy keys, RTL ordering, focus restoration and non-color status indicators are shared contract requirements; renderer-specific layout is allowed.
