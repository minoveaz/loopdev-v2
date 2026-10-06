# Platform Notes Discovery

## Document control

| Field | Value |
|---|---|
| Module | Notes |
| Suite | Platform |
| Run ID | MOD-NOTES-20260914-001 |
| User request | Capacidad Notes multiplataforma reutilizable por Customer 360 y otros módulos |
| Product definition | No existe todavía; se usa el track activo de Platform como intención aprobada |
| Discovery status | `complete` |
| Owner | Platform |

## Problem and objective

- Business problem: Notes está duplicado entre el dominio global y el dominio Platform, con UI desktop consumida directamente y sin un contrato neutral consumible por mobile.
- Primary objective: definir una capacidad Platform Notes con semántica única para listar, crear, editar, eliminar, visibilidad, permisos y relaciones con Contact/Customer 360.
- Success measure: los consumidores desktop y mobile web usan el mismo port/adapters explícitos; no existen imports de `src/` desktop ni estado de Notes duplicado en `apps/mobile`.
- Explicit boundary: esta fase descubre y clasifica; no autoriza todavía producción, API remota, clientes nativos ni cambios de checkpoint manuales.

## Actors and outcomes

| Actor | Job to be done | Outcome | Permissions/constraints |
|---|---|---|---|
| Platform user | Crear y consultar contexto operativo | Nota visible en el tenant y entidad relacionada | Scope de organización/workspace y permisos server-side |
| Author | Editar y eliminar notas propias cuando el permiso lo permita | Historial auditable y estado claro | Concurrencia optimista |
| Customer 360/CRM | Consumir notas relacionadas con Contact | Vista consistente sin modelo local paralelo | Contrato NotesPort |
| Platform administrator | Administrar visibilidad y acceso | Denegaciones trazables | No bypass de tenant |

## Expected domain capabilities

| Capability | Classification | Expected behavior | Priority |
|---|---|---|---|
| Shared Notes contract and port | `PLATFORM_EXTENSION` | Add a neutral `NotesPort` under `packages/contracts`, with stable operations, states and errors. | MVP |
| Desktop Notes adapter | `PLATFORM_REUSE` | Adapt the existing Platform work/local behavior behind the shared port; do not expose desktop UI as the contract. | MVP |
| Mobile Notes adapter and UI | `REQUIRED_MVP` | Native React Native/Expo list and editor surfaces consuming the same contract. | MVP |
| Visibility, permission and audit semantics | `REQUIRED_MVP` | Enforce organization scope, visibility, capability checks, audit metadata and forbidden states. | MVP |
| Contact/Customer 360 relation | `REQUIRED_MVP` | Relate notes to Contact through `EntityRef`/shared relation semantics. | MVP |
| Remote sync and native clients | `REQUIRED_FOLLOW_UP` | Preserve local-first contract for future API, iOS and Android adapters. | Follow-up |

## Inputs, outputs and events

### Inputs

- Entities: Note, relation reference, organization/workspace scope, actor, permission snapshot, audit entry, sync metadata.
- Commands: `createNote`, `updateNote`, `deleteNote`, visibility change as part of create/update, and relation assignment through the same mutation contract.
- External/Platform data: Contact/Customer 360 relation, current user and membership, local persistence, future remote revision.

### Outputs

- Read models: paged `listNotes` result filtered by scope, relation and visibility.
- Mutations: create/update/delete with expected version, idempotency key and explicit result status.
- User-visible outcomes: loading, empty, success, pending/offline, forbidden, conflict and error states with equivalent meaning across renderers.

### Events

| Event | Producer | Consumers | Payload/invariants | Idempotency/audit |
|---|---|---|---|---|
| `note.created` | Notes adapter/application layer | Customer 360, CRM, Activity/audit | note id, scope, relation, actor, visibility, version | idempotency key and append-only audit |
| `note.updated` | Notes adapter/application layer | Customer 360, CRM, Activity/audit | changed fields, expected/new version, actor | reject stale version; audit result |
| `note.deleted` | Notes adapter/application layer | Customer 360, CRM, Activity/audit | note id, scope, relation, actor, tombstone/version | idempotent delete; audit result |

## Entities, relationships and lifecycle

| Entity | Owner | Relationships | States | Invariants |
|---|---|---|---|---|
| Note | Platform Notes | Contact/Customer 360 via relation; organization/workspace via scope | `draft`, `pending`, `active`, `deleted`, `conflict` | tenant scope, non-empty content, version required for update/delete |
| NoteRelation | Platform Notes | Contact, Customer 360 and future entities | attached/detached | relation and note share organization scope |
| AuditEntry | Platform audit owner | Notes and consumers | append-only | actor, tenant, action, resource and outcome are mandatory |

## Platform and suite integration

| Capability/module | Decision | Consumed contract | Produced data/events | Duplicate prohibited? |
|---|---|---|---|---|
| Customer 360 | `EXTEND_PLATFORM` | Existing Customer 360 view and `EntityRef` semantics | NotesPort provides relation-scoped notes | Notes owns note lifecycle; Customer 360 must not duplicate state |
| CRM | `PLATFORM_REUSE` | Existing CRM local adapter and contact port | Consume shared relation and note summaries | No CRM-specific Notes CRUD contract |
| Communications | `PLATFORM_REUSE` | Existing internal-note behavior | Map conversation relation to NotesPort if approved | Do not conflate public replies with Notes |
| Activity/audit | `PLATFORM_REUSE` | Platform activity/timeline types | Emit auditable note events | No second audit trail in mobile |
| `apps/mobile` | `EXTEND_PLATFORM` | Existing Customer 360 mobile contract | Import only `packages/contracts` and mobile adapter | No imports from desktop `src/` |

## Market/domain baseline

| Reference capability | Why expected | Relevant to MVP? | Evidence/source |
|---|---|---:|---|
| Entity-related notes | Common CRM pattern | Yes | Salesforce Notes guidance, accessed 2026-09-14 |
| Permissioned ownership and visibility | Common enterprise pattern | Yes | Salesforce Notes guidance, accessed 2026-09-14 |
| Mobile-adapted list/editor | Common mobile pattern | Yes | Salesforce Notes guidance states mobile availability, accessed 2026-09-14 |

## External benchmark and source register

Research must use three to five relevant references and record access dates.

| Reference | Source URL | Accessed | Observed capability/pattern | Classification | LoopDev applicability | Tradeoff / do not copy |
|---|---|---|---|---|---|---|
| Salesforce Notes guidance | https://help.salesforce.com/s/articleView?id=sf.notes.htm&type=5 | 2026-09-14 | Entity relation, owner/edit/delete permissions, visibility and mobile surface | `INDUSTRY_BASELINE` | Use explicit relation and permission matrix | Do not copy legacy dual note tools or overwrite-on-concurrency behavior |
| HubSpot record notes | https://knowledge.hubspot.com/records/add-notes-to-records | 2026-09-14 | Record-context notes and activity timeline pattern | `UNVERIFIED` | Validate later against an accessible official source | Do not treat unavailable page content as evidence |
| Notion CRM guide | https://www.notion.com/help/guides/using-notion-for-crm | 2026-09-14 | Flexible relational context and collaborative notes pattern | `UNVERIFIED` | Consider relation-first navigation as a hypothesis | Do not import workspace/document semantics into Platform Notes |

## LoopDev differentiation hypotheses

Do not add these to MVP without product approval.

| Hypothesis | User value | Product behavior changed | Platform/domain impact | Complexity | Validation experiment | Decision |
|---|---|---|---|---|---|---|
| Local-first transparency | Users can continue reading and queueing permitted writes offline | Show pending/conflict state rather than false server success | Outbox, revision and recovery contract | medium | Focused adapter tests for queue/retry/conflict | `MVP` |
| Cross-module context | One note is discoverable from Contact, CRM and Platform surfaces | Relation-aware list and deep link | Shared relation contract and consumer adapters | medium | Customer 360 and CRM integration tests | `MVP` |
| Permission-aware collaboration | Users understand why a note is hidden or blocked | Forbidden state includes stable reason without leaking data | Server authorization and audit | medium | Visibility/tenant denial tests | `MVP` |

## Product definition currently approved

- Product documents: none under `docs/06-product/platform/notes/`; active source is the Platform foundation track.
- Approved scope: shared multiplatform semantics, desktop/mobile web first, native surfaces planned, reuse before duplication.
- Explicit exclusions: production backend, native app implementation, release/push/PR, and visual/design/plan approval inferred from scaffold files.
- Existing approvals: none for this run; design and visual gates remain pending.

### Legacy reference policy

Legacy documentation and component/view inventories are informational
evidence, not implementation authority. They must not result in new legacy
components, routes or parallel views. Map any still-required behavior to the
current Rivera template, shared LoopDev primitives and existing LoopDev v2
modules.

| Legacy reference | Informational meaning | Current reuse target | Decision |
|---|---|---|---|
| `PlatformNotesPanel` / `NoteEditorDrawer` references | Existing desktop UI evidence | Desktop adapter may compose current primitives | `REUSE_CURRENT_PRIMITIVE` |
| Archived component inventories | Historical catalog only | Current Platform contract and Rivera primitives | `INFORMATIONAL_ONLY` |

## Existing LoopDev implementation

| Area | Existing route/code/doc | Behavior observed | Evidence |
|---|---|---|---|
| Contracts | `packages/contracts/src/contact-port.ts` | Customer 360 exposes `notes` as related data, but no NotesPort exists | Evidence of consumer need, not a Notes contract |
| Global Notes domain | `src/loopdev/domains/notes/types.ts` and adapter/local.ts | Rich local notes with visibility, relations and permissions | Existing but conflicts with Platform model; consolidate behind port |
| Platform Notes domain | `src/loopdev/domains/platform/types.ts` and adapter/work.ts | Scoped NoteRecord and list/create/update work adapter | Existing partially; missing delete and neutral cross-client port |
| Desktop renderer | `src/loopdev/components/platform/NotesPanel.tsx` and `src/components/common/NoteEditorDrawer.tsx` | Notes list/editor for desktop | Reusable renderer evidence; not mobile evidence |
| Customer 360 desktop | `src/loopdev/components/customer360/Customer360PlatformSection.tsx` | Reads and mutates through Platform hooks/panel | Existing consumer, contract boundary needs replacement |
| Customer 360 mobile | `apps/mobile/components/MobileCustomer360Screen.tsx` | Displays count only | Partial; no list/create/edit/delete operation |
| Focused tests | `src/test/notes/`, `src/test/platform/` | Core local and Platform behavior covered | Visibility, mobile lifecycle and port parity missing |

## Expected versus existing

| Capability | Expected | Product source | Existing implementation | Baseline status | Evidence | Next action |
|---|---|---|---|---|---|---|
| list/create/update/delete Notes contract | Shared semantic port for all clients | Platform/global types and work adapter exist | `MISSING` | No `packages/contracts/src/notes.ts` | Create NotesPort and contract tests |
| Desktop Notes renderer | List and editor with loading/error/forbidden paths | `NotesPanel.tsx`, `NoteEditorDrawer.tsx` | `EXISTS_PARTIALLY` | Current UI bypasses neutral port | Add explicit desktop adapter and focused tests |
| Mobile Notes list/editor | Touch-safe list and editor without desktop imports | Mobile Customer 360 only shows count | `MISSING` | `apps/mobile/components/MobileCustomer360Screen.tsx` | Add mobile adapter/UI after approved design |
| Visibility and permissions | Tenant, relation, action checks and audit | Types include visibility/permissions; enforcement incomplete | `EXISTS_PARTIALLY` | `src/loopdev/domains/platform/adapter/work.ts` | Define shared authorization/error contract and tests |
| Contact relation | Notes attached to Contact/Customer 360 | `EntityRef` and Customer 360 notes field exist | `EXISTS_PARTIALLY` | `packages/contracts/src/contact-port.ts` | Make relation operation explicit in NotesPort |
| Offline/local-first | Pending, retry, conflict, recovery semantics | local adapters exist but no shared Notes sync contract | `EXISTS_PARTIALLY` | local adapters and Platform foundation track | Define sync phase contract before implementation |
| iOS/Android renderer | Native clients consuming same semantics | No native Notes surface in scope evidence | `NOT_APPLICABLE` | Planned platforms with owner Platform | Record follow-up; no equivalence claim |

## Scope boundaries

### MVP

- Neutral `NotesPort` and serializable DTOs in `packages/contracts`.
- Explicit desktop and mobile-web adapters; no mobile import from desktop `src/`.
- Shared operation catalog: list, create, update, delete, visibility/permissions and Contact relation.
- Shared state/error/concurrency/local-first semantics and focused unit/component coverage.
- Customer 360 desktop/mobile consumption through the port without duplicated Notes state.

### Follow-up

- Remote API implementation and server-side persistence promotion.
- iOS/Android renderers and device evidence.
- Rich attachment/editor parity beyond the approved Notes contract.

### Out of scope

- Rebuilding legacy Notes components or creating a second design system.
- Treating a route, visible count, type or adapter registration as operation parity.
- Importing desktop runtime components from `src/` into `apps/mobile`.

## Contradictions, assumptions and open decisions

| ID | Type | Finding | Impact | Owner | Resolution |
|---|---|---|---|---|---|
| DISC-001 | `contradiction` | GlobalNoteRecord and Platform NoteRecord encode overlapping but different lifecycles and fields. | High: an unapproved merge could break CRM and Platform consumers. | Platform | Resolve in design/domain; prefer one neutral contract with adapters. |
| DISC-002 | `open_decision` | Whether rich TipTap content is part of MVP or a desktop-only adaptation. | Medium: affects contract serialization and mobile editor scope. | Product + Platform | Design gate approval required. |
| DISC-003 | `open_decision` | Whether offline writes are queued for MVP or read-only offline first. | High: affects sync and UI pending/conflict states. | Product + Platform | Sync phase decision; default to explicit queued writes only if testable. |
| DISC-004 | `assumption` | iOS/Android are planned, not required implementation surfaces for this run. | Medium: no native source/build evidence exists. | Platform | Record owner and follow-up in platform matrix. |

## Handoff to module-design

- Target architecture questions: define `NotesPort` and isolate desktop/mobile persistence adapters from renderers.
- UX questions: approve mobile list/editor composition, responsive breakpoints and all state treatments.
- Domain questions: resolve GlobalNoteRecord vs NoteRecord, relation cardinality, version and delete/tombstone semantics.
- Platform reuse/extension questions: approve `EXTEND_PLATFORM` for the shared contract and Customer 360 migration.
- Required decisions before planning: design approval, visual approval, rich-content scope, offline write policy and access model.
- Discovery state: `complete`
