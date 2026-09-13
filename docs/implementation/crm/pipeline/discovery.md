# CRM Pipeline Discovery

## Document control

| Field | Value |
|---|---|
| Module | CRM Pipeline and Opportunities |
| Suite | CRM |
| Run ID | `MOD-CRM-PIPELINE-20260913-002` |
| User request | Start delivery from zero while verifying the existing Kanban implementation against the target design |
| Product definition | `docs/06-product/crm/pipeline/` |
| Discovery status | `complete` |
| Owner | CRM / delivery |

## Problem and objective

Pipeline must help a commercial team understand where Opportunities are in the
sales process, decide what to do next, move work forward safely and preserve
the context connecting an Opportunity with Contact, Lead and shared activity.

The objective is a local-first CRM pilot that is fast to scan and operate,
permission-aware, auditable and ready to evolve from the existing Kanban into
table, detail and manual-creation surfaces without duplicating Platform
capabilities.

Success means a user can find an authorized Opportunity, understand its
commercial and activity health, take the next authorized action, recover from
conflicts and navigate to related CRM context without losing tenant/workspace
boundaries.

## Actors and outcomes

| Actor | Job to be done | Outcome | Permissions/constraints |
|---|---|---|---|
| Sales agent | Manage assigned opportunities and next actions | Opportunity progresses with auditable stage/activity state | Only authorized records/actions |
| Manager | Inspect team pipeline, reassign and resolve stalled work | Team pipeline remains actionable and forecastable | Team scope and elevated actions |
| CRM admin | Configure stage names/order and active stages | Pipeline reflects the workspace process | Stable stage IDs and admin permission |
| Superdev | Diagnose platform behavior | Safe support and audit trail | Separate privileged access and purpose |

## Expected domain capabilities

| Capability | Classification | Expected behavior | Priority |
|---|---|---|---|
| Stage-based Kanban | `REQUIRED_MVP` | View authorized Opportunities by stable stages and move them through authorized commands | P0 |
| Opportunity card | `REQUIRED_MVP` | Show identity, commercial summary, ownership, activity health and authorized actions | P0 |
| Opportunity list/table | `REQUIRED_MVP` | Search, filter, sort and paginate Opportunities | P0 |
| Opportunity detail | `REQUIRED_MVP` | Show full context, relations, history and follow-up actions | P0 |
| Manual Opportunity creation | `REQUIRED_MVP` | Create an Opportunity with Contact, product and valid initial stage | P0 |
| Lead conversion | `REQUIRED_MVP` | Idempotently create an Opportunity from a qualified Lead | P0 |
| Activity/next action health | `REQUIRED_MVP` | Make stale, overdue or missing follow-up visible and actionable | P0 |
| Forecasting | `REQUIRED_FOLLOW_UP` | Weighted pipeline and targets without corrupting operational board | P1 |
| Workflow automation | `REQUIRED_FOLLOW_UP` | Stage-triggered Tasks, notifications and handoffs | P1 |
| Explainable pipeline health | `DIFFERENTIATOR_OPPORTUNITY` | Explain why an Opportunity is at risk and what evidence supports it | Explore |
| Local-first recovery | `PLATFORM_REUSE` | Continue safely offline and reconcile conflicts | P0 |
| Shared Activity, Notes, Tasks and Relations | `PLATFORM_REUSE` | Reuse existing contracts and shared context | P0 |
| AI scoring, quotes, documents and external integrations | `OUT_OF_SCOPE` | Deferred until a separately approved phase | P2 |

## Inputs, outputs and events

### Inputs

- Contacts and Contact permissions.
- Qualified Leads and conversion identity.
- Product/catalog reference data.
- Workspace stage configuration.
- Users, owners, organization and tenant scope.
- Notes, Tasks, Activity and communications context.
- Search, filter, pagination and optimistic version inputs.

### Outputs

- Authorized Opportunity card and table read models.
- Opportunity detail with Contact, Lead and stage history.
- Stage-change, reopen, creation and conversion mutations.
- Activity/stage-history records and Customer 360 context.
- Conflict, forbidden, validation and offline states.
- Future automation triggers and forecast projections.

### Events

| Event | Producer | Consumers | Payload/invariants | Idempotency/audit |
|---|---|---|---|---|
| `opportunity.created` | CRM command | Activity, Customer 360, automation | Tenant/workspace scoped Opportunity identity and origin | Idempotency key and audit actor |
| `opportunity.stage_changed` | CRM command | Activity, Customer 360, automation | Previous/new stable stage, actor, origin and version | Optimistic version and immutable history |
| `opportunity.reopened` | CRM command | Activity, Customer 360 | Terminal source, target open stage and reason | Elevated permission and audit |
| `opportunity.converted_from_lead` | CRM command | Leads, Activity, Customer 360 | Lead, Contact, product and conversion identity | Unique tuple and idempotency |
| `opportunity.activity_health_changed` | Activity projection | Board/card and follow-up workflows | Evidence-backed health state | Derived, explainable and recomputable |

## Entities, relationships and lifecycle

| Entity | Owner | Relationships | States | Invariants |
|---|---|---|---|---|
| Opportunity | CRM | Contact, optional Lead, Product, Owner, Stage, Activity | open, won, lost, reopened | Tenant/workspace scope, versioned mutations |
| PipelineStage | CRM admin | Workspace and Opportunities | active/inactive, open/won/lost | Stable ID, configurable label/order |
| OpportunityActivity | Platform/CRM | Opportunity and actor | scheduled, completed, overdue | Shared Activity contract |
| Lead conversion | CRM | Lead, Opportunity, Contact, Product | pending/success/conflict | Idempotent `(tenant, lead, product, origin)` |

## Platform and suite integration

| Capability/module | Decision | Consumed contract | Produced data/events | Duplicate prohibited? |
|---|---|---|---|---|
| Kanban and shared UI | `PLATFORM_REUSE` | Shared board/primitives | Pipeline-specific card view model | Yes |
| Contacts | `MODULE_SPECIFIC` + shared relation | Contact identity and permissions | Contact relation on Opportunity | No duplicate Contact model |
| Leads | `MODULE_SPECIFIC` + shared conversion | Qualified Lead and conversion contract | Conversion event and Opportunity | No separate conversion semantics |
| Activity/Timeline | `PLATFORM_REUSE` | Shared activity and history | Stage/creation/reopen events | Yes |
| Notes and Tasks | `PLATFORM_REUSE` | Shared follow-up capabilities | Related note/task references | Yes |
| Relations/Customer 360 | `PLATFORM_REUSE` | Relation and customer context | Opportunity relationship | Yes |
| Catalog/reference data | `PLATFORM_REUSE` | Product identity and labels | Stable `productKey` | No duplicate catalog |

## Market/domain baseline

The baseline is not a parity requirement. It identifies useful patterns to
evaluate against LoopDev's local-first and suite-level goals:

- mature CRMs provide configurable stages, permissions, workflow automation
  and forecasting;
- pipeline-native products optimize fast scanning and activity-driven next
  steps;
- integrated CRMs connect pipeline records to communications and a full
  engagement timeline;
- newer workflow products explore assisted updates, predictive health and
  reduced manual logging.

## External benchmark and source register

| Reference | Source URL | Accessed | Observed capability/pattern | Classification | LoopDev applicability | Tradeoff / do not copy |
|---|---|---|---|---|---|---|
| Salesforce Sales Cloud | https://www.salesforce.com/products/sales-cloud/features/ | 2026-09-13 | Configurable stages, deep automation, forecasting and extensible records | `INDUSTRY_BASELINE` | Use as completeness reference for permissions, workflows and forecast boundaries | Avoid enterprise configuration burden in MVP |
| HubSpot CRM | https://www.hubspot.com/products/crm | 2026-09-13 | Visual deals, connected engagement timeline, tasks and marketing/sales context | `TRANSFERABLE_PATTERN` | Connect Opportunity to shared Activity and suite context | Avoid coupling CRM MVP to marketing automation |
| Pipedrive | https://www.pipedrive.com/en/features | 2026-09-13 | Pipeline-first UX, clear cards and activity-driven next action/health | `TRANSFERABLE_PATTERN` | Prioritize scanability, next action and low-friction stage movement | Avoid reducing pipeline to a single linear sales model |
| Salesflare comparison/reference | https://blog.salesflare.com/compare-salesforce-zoho-hubspot-pipedrive | 2026-09-13 | Automation and lower-friction CRM operation as a product direction | `DIFFERENTIATOR_OPPORTUNITY` | Explore less manual logging and better context | Secondary analysis; verify product claims before relying on them |
| Rapitek CRM comparison | https://rapitek.com/en/crm-sales-pipeline-comparison/ | 2026-09-13 | Voice/AI-assisted updates and adaptive workflow as emerging patterns | `DIFFERENTIATOR_OPPORTUNITY` | Candidate for future explainable assistance and local-first capture | Do not add AI/voice to MVP without a validated use case |

## LoopDev differentiation hypotheses

| Hypothesis | User value | Product behavior changed | Platform/domain impact | Complexity | Validation experiment | Decision |
|---|---|---|---|---|---|---|
| Explainable pipeline health | Users know why a deal is at risk, not just that it is red | Card shows evidence: stale activity, overdue task, missing next action or conflict | Activity projection and card indicators | Medium | Test card scan and next-action selection with synthetic opportunities | `explore` |
| Local-first safe selling | Reps can continue operating during unreliable connectivity | Pending mutations, clear reconciliation and no silent data loss | Sync/conflict contracts and audit | High | Simulate offline move/create/reload/reconcile | `MVP` candidate |
| Contextual next action | Pipeline suggests the next useful action from existing shared context | Card/detail exposes authorized next action from Activity/Tasks/Communications | Shared Activity/Task integration | Medium | Compare time-to-next-action with static cards | `explore` |
| Decision timeline | Teams understand why stage changes happened | History combines stage, reason, actor and related activity | Activity/Timeline event model | Medium | Test manager investigation of a stalled opportunity | `follow-up` |
| Permission-aware collaboration | Users see actionable context without exposing sensitive records | Cards/actions adapt to scope and permissions with explicit explanations | Access policy and read models | Medium | Test direct URL, cached permission and team-scope scenarios | `MVP` candidate |

## Product definition currently approved

- Product documents:
  - `CRM_PIPELINE_CONTRACT.md`
  - `CRM_PIPELINE_UX_SPEC.md`
  - `CRM_PIPELINE_COMPONENT_AUDIT.md`
  - `CRM_PIPELINE_IMPACT_ASSESSMENT.md`
- Approved scope: Kanban, table, detail, creation, conversion, stage
  movement, reopen, permissions, audit, local-first preparation and shared
  CRM context.
- Explicit exclusions: AI, quotes, documents, billing, advanced forecasting
  and external integrations.

### Legacy reference policy

The older component and view documentation is retained as historical context
for discovery and regression analysis only. It does not authorize creating
new legacy components, routes or parallel Pipeline views. Any approved
behavior must be implemented by reusing the current Rivera template, shared
LoopDev primitives and existing LoopDev v2 modules. A Platform extension
requires a separate decision; a new Pipeline-specific component is allowed
only for behavior that is genuinely owned by the CRM domain.

| Legacy reference | Informational meaning | Current reuse target | Decision |
|---|---|---|---|
| Legacy component/view lists in CRM product and audit documents | Historical vocabulary and expected behavior to verify, not a construction blueprint | Rivera layout, shared UI primitives, existing CRM/Pipeline surfaces | `INFORMATIONAL_ONLY` |
| Legacy card/view interaction patterns | Regression and UX intent evidence | Existing `OpportunityCard`, shared menus, drawers and status primitives | `REUSE_CURRENT_PRIMITIVE` |
| Any missing cross-cutting capability implied by legacy docs | Candidate Platform gap, not module-local implementation | Existing Platform contract first; extend Platform only with approval | `EXTEND_PLATFORM` if approved |
| Duplicate legacy route or component | Deprecated parallel path | Current canonical Pipeline route and shared module contracts | `REJECTED_DUPLICATE` |

## Existing LoopDev implementation

| Area | Existing route/code/doc | Behavior observed | Evidence |
|---|---|---|---|
| Kanban | `src/loopdev/pages/crm/Pipeline.tsx` | Six stage columns, search, stage/owner filters, drag/drop and menu movement | Source audit and live HTTP 200 |
| Opportunity card | `OpportunityCard` in `Pipeline.tsx` | Name, Contact, amount, probability, close date, owner and movement/reopen actions | Source audit |
| CRM adapter | `src/loopdev/domains/crm/adapter/local.ts` | Tenant-scoped reads, stage moves, conflict handling, reopen and lead conversion | Adapter tests |
| Pipeline page test | `src/test/crm/pipeline/pipeline-page.test.tsx` | Renders stages and verifies a stage movement | Component test |
| Adapter test | `src/test/crm/pipeline/pipeline-adapter.test.ts` | Scope, conflict, conversion and lead-status invariants | Adapter test |
| Table/detail/create | CRM routes and product docs | Related CRM surfaces exist in documentation and adjacent implementation, but require baseline verification against the full Pipeline contract | Discovery gap |

## Expected versus existing

| Capability | Expected | Product source | Existing implementation | Baseline status | Evidence | Next action |
|---|---|---|---|---|---|---|
| Kanban stages | Stable authorized columns and movement | Contract, UX spec | Six local stages, move and reopen flows | `EXISTS_PARTIALLY` | `Pipeline.tsx`, tests | Verify all permissions/states/runtime |
| Opportunity card | Identity, commercial data, owner, product/origin, activity health and actions | UX spec, component audit | Core fields and actions; no complete health/indicator model | `EXISTS_PARTIALLY` | `OpportunityCard` | Design and verify card gap |
| Accessible movement | Drag/drop plus keyboard/menu alternative | UX spec | Context menu exists; runtime/accessibility evidence pending | `EXISTS_PARTIALLY` | Page test/source | Verify keyboard, focus and announcements |
| Conflict handling | Optimistic version and recovery | Contract, impact assessment | Adapter conflict result and refresh action | `EXISTS_PARTIALLY` | Adapter/page source | Verify runtime and all mutation states |
| Activity health/next action | Evidence-backed stale/overdue/missing follow-up | Discovery/UX direction | Activity data exists, card health not fully projected | `EXISTS_PARTIALLY` | Adapter data | Design projection and test |
| Table | Search/filter/sort/paginate Opportunities | UX spec | Not verified in current Pipeline baseline | `NOT_TESTED` | Product docs | Audit routes/code |
| Detail | Relations, history, Notes, Tasks and actions | UX spec | Opportunity detail exists but Pipeline contract coverage not verified | `NOT_TESTED` | Product docs/source inventory | Audit route/code |
| Manual creation | Contact, product, stage, idempotency and validation | Contract, UX spec | Adapter supports conversion; manual flow not verified | `NOT_TESTED` | Contract/source inventory | Audit and test |
| Lead conversion | Idempotent conversion and status invariants | Contract | Local adapter and tests cover conversion | `EXISTS_AND_ALIGNS` | Adapter test | Confirm runtime and shared events |
| Tenant isolation | Cross-tenant reads/mutations rejected | Contract, impact assessment | Local adapter test covers forbidden read | `EXISTS_PARTIALLY` | Adapter test | Verify direct URL and mutation scope |
| Shared Platform reuse | Activity, Notes, Tasks, Relations and UI reused | Component audit | Adapters/imports exist; consumer behavior pending | `EXISTS_PARTIALLY` | Source audit | Platform integration audit |
| Local-first recovery | Offline, pending, conflict and reconciliation | Contract/impact assessment | Local adapter exists; full recovery evidence absent | `NOT_TESTED` | Source inventory | Sync design and runtime tests |
| Legacy component/view references | Historical behavior to verify, not new implementation scope | Product and audit documentation | Legacy references coexist with current Rivera/LoopDev v2 surfaces | `NOT_APPLICABLE` | Legacy reference policy above | Reuse current primitives; reject duplicate paths |

## Scope boundaries

### MVP

- Kanban and Opportunity card;
- table, detail and manual creation;
- qualified Lead conversion;
- stage movement/reopen with permissions, versioning and audit;
- shared Activity, Notes, Tasks and Relations;
- tenant isolation and local-first conflict handling;
- responsive/accessibility evidence.

### Follow-up

- explainable pipeline health;
- contextual next action;
- decision timeline;
- forecasting and workflow automation;
- voice/AI-assisted updates.

### Out of scope

- AI scoring in the first implementation;
- quotes, documents, billing and external integrations;
- parity with enterprise configuration depth.
- rebuilding legacy components or views when a current template, primitive or
  LoopDev v2 module already provides the capability.

## Contradictions, assumptions and open decisions

| ID | Type | Finding | Impact | Owner | Resolution |
|---|---|---|---|---|---|
| DISC-001 | contradiction | Product UX expects table/detail/create surfaces, while the current verified baseline is primarily the Kanban | Scope and plan | Product/Tech Lead | Resolve in module-design |
| DISC-002 | open_decision | Activity health and next-action indicators are described as desired patterns but not fully specified in approved product docs | Card design and domain | Product Owner | Select MVP behavior or follow-up |
| DISC-003 | assumption | Existing local adapter behavior is the intended starting point for local-first implementation | Sync and migration | Tech Lead | Confirm in sync-design |
| DISC-004 | open_decision | Which differentiation hypothesis, if any, enters MVP | Scope and effort | Product Owner | Decide at design gate |

## Handoff to module-design

- Target architecture questions: confirm card view model, Activity health
  projection and table/detail/create composition.
- UX questions: approve card hierarchy, indicators, states and next-action
  affordances.
- Domain questions: confirm Opportunity lifecycle, conversion and activity
  invariants.
- Platform questions: confirm Activity, Tasks, Notes, Relations and
  Customer 360 reuse.
- Required decisions before planning: MVP differentiators, health semantics,
  missing surfaces and local-first evidence expectations.
- Discovery state: `complete`
