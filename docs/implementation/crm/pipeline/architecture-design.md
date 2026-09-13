# CRM Pipeline Architecture and Design

## Document control

| Field | Value |
|---|---|
| Module | CRM Pipeline |
| Product definition | `docs/06-product/crm/pipeline/` |
| Run ID | `MOD-CRM-PIPELINE-20260913-001` |
| Track | pending design approval |
| Design checkpoint | `runs/MOD-CRM-PIPELINE-20260913-001/01-design.json` |
| Owner | CRM |
| Status | `draft` |

## Target architecture

### Context and boundaries

- Suite and bounded context: CRM / Opportunities / Pipeline.
- Owned responsibilities: opportunity board projection, stage movement
  orchestration and pipeline-specific filters.
- Existing route: `/app/sales-crm/pipeline`.
- Pilot surfaces: Kanban, Opportunities table, opportunity detail and manual
  opportunity creation.
- Consumed Platform capabilities: shared UI primitives, Activity/stage
  history, Tasks, Notes, Relations and Customer 360.
- Explicitly out of scope: backend persistence, forecasting, quotes, AI,
  documents, billing and external integrations.

### Layer map

| Layer | Responsibilities | Files/areas | Allowed dependencies | Forbidden dependencies |
|---|---|---|---|---|
| Presentation | Board, columns, cards, filters and dialogs | `src/loopdev/pages/crm/Pipeline.tsx` | Shared UI, CRM hooks and typed view models | Direct persistence or hidden business rules |
| Application | Query/filter orchestration and mutations | `src/loopdev/domains/crm/hooks/use-crm.ts` | CRM ports and domain types | JSX-specific policy or storage internals |
| Domain | Stage codes, transition rules, tenant invariants and mutation results | `src/loopdev/domains/crm/adapter/types.ts` | Pure types and policies | React, browser storage or transport details |
| Ports/contracts | CRM adapter interfaces and command inputs | `src/loopdev/domains/crm/adapter/types.ts` | Typed domain contracts | Concrete local store access |
| Adapters/infrastructure | Local opportunity data, stage history and persistence behavior | `src/loopdev/domains/crm/adapter/local.ts` and `data/` | Domain contracts, local stores and Platform adapters | UI rendering or route decisions |

### Dependency direction

```text
Pipeline page → CRM hooks → CRM adapter contract → local CRM adapter/stores
```

## Responsibility matrix

| Concern | Authoritative owner | Consumers | Must not contain | Evidence |
|---|---|---|---|---|
| Board rendering and drag/drop interaction | Pipeline page and card | CRM route | Persistence or transition policy | `Pipeline.tsx` |
| Query and mutation orchestration | CRM hooks | Pipeline page and detail surfaces | JSX markup | `use-crm.ts` |
| Stage and opportunity rules | CRM domain types/policies | Hooks and adapters | React/browser APIs | CRM adapter contract |
| Tenant and permission enforcement | CRM adapter contract/adapter | All CRM consumers | UI-only checks | Adapter tests |
| Local persistence | Local stores and adapter | CRM hooks | Product presentation | `local.ts`, local stores |
| Stage history and activity projection | CRM stage history / Platform activity | Pipeline and Customer 360 | Duplicate timeline system | Impact assessment |

## Opportunity card design

The card is the primary operational unit of the Kanban. It must be scannable
without opening the detail view, but it must not become a second detail page
or execute business rules locally.

### Proposed information hierarchy

```text
Opportunity name                 [context actions]
Contact name
Product / origin                 [optional indicators]
Amount                           Probability
Expected close date              Activity health
Owner avatar and assignment
```

| Zone | Content | Rule |
|---|---|---|
| Header | Opportunity name and context menu | Name is the primary link/activation target; menu is keyboard accessible |
| Identity | Contact and product label | Contact opens the authorized relation; never expose cross-tenant data |
| Commercial summary | Amount, currency and probability | Use formatted values and an explicit empty marker |
| Timing | Expected close date and activity health | Show stale/overdue indicators without relying on color alone |
| Ownership | Owner name/avatar and assignment state | Show `Unassigned` explicitly; respect assignment permission |
| Indicators | Origin, stale activity, overdue task, conflict or locked state | Use shared `EntityCardIndicators` and accessible labels |
| Actions | Open detail, move stage, reopen terminal stage, create note/task when authorized | Actions are permission-aware and do not bypass the adapter |

### Card states

| State | Visual behavior | Interaction |
|---|---|---|
| `idle` | Normal surface and full content | Open detail or actions |
| `hover` | Subtle elevation and visible action affordance | No layout shift |
| `dragging` | Reduced opacity and drag cursor | Mutation is locked |
| `drop-pending` | Pending treatment while stage mutation saves | Disable duplicate actions |
| `drop-success` | Success feedback via status/announcement | Return to `idle` |
| `drop-error` | Error message and retry/refresh path | Preserve source stage |
| `locked` | Disabled movement with reason | Detail remains available if permitted |
| `stale` | Non-color stale indicator and refresh affordance | Resolve conflict before another move |
| `forbidden` | Do not render unauthorized actions/data | Follow route-level access policy |

### Responsive and accessibility rules

- Desktop uses the full card hierarchy; mobile may collapse secondary metadata
  but must preserve name, contact, stage action, amount and owner.
- Drag and drop is never the only movement mechanism; the context menu is the
  keyboard and touch alternative.
- The card exposes an accessible name, visible focus state and announced
  mutation result.
- Action menus must remain usable when the card is empty of optional values.
- Portals, dialogs and status messages are verified outside the card container.

### Baseline comparison target

The current implementation already renders name, contact, amount, probability,
expected close date, owner and stage actions. The baseline audit must verify or
plan the remaining contract items: product/origin context, activity health,
shared indicators, explicit permission states, stale/conflict presentation,
detail activation and responsive/mobile behavior.

## Module and Platform contracts

| Capability | Decision | Contract | Consumers | Duplicate prohibited? |
|---|---|---|---|---|
| Kanban and UI primitives | `REUSE` | Shared LoopDev components | Pipeline board | yes |
| Notes and Tasks | `REUSE` | Platform contracts | Opportunity detail | yes |
| Activity / stage history | `REUSE` | CRM/Platform activity contract | Pipeline and Customer 360 | yes |
| Relations / Customer 360 | `REUSE` | CRM relation contracts | Contact and Lead links | yes |

## Structural quality baseline

- [x] Existing presentation/application/adapter split identified.
- [x] Existing local-first adapter boundary identified.
- [x] Platform reuse and duplicate risks recorded.
- [ ] Runtime behavior and direct route verified on `localhost:8081`.
- [ ] Full responsibility and refactor-safety audit approved.
- [ ] Residual technical debt assigned to issues.

## Refactoring records

| ID | Reason | Behavior preserved | Files/consumers | Risk | Before evidence | After evidence | Rollback | Residual debt |
|---|---|---|---|---|---|---|---|---|
| REF-PIPELINE-001 | To be determined after architecture audit | Existing Kanban behavior must remain | Pipeline route, CRM hooks, adapter and tests | pending | Existing tests and source audit | pending | git revert checkpoint | pending |

## Open decisions and deviations

| ID | Decision or deviation | Status | Impact | Approver | Resolution/follow-up |
|---|---|---|---|---|---|
| DEC-PIPELINE-002 | Pilot includes Kanban, table, detail and manual opportunity creation | confirmed | Scope and plan | Product Owner | Design checkpoint |
| DEC-PIPELINE-003 | Confirm missing runtime evidence and start process on port 8081 | resolved | Blocks functional verification | Delivery owner | Runtime HTTP 200 |
