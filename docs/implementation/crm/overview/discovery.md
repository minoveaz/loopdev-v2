# CRM Overview Discovery

## Document control

| Field | Value |
|---|---|
| Module | CRM Overview / Sales Operating Dashboard |
| Suite | CRM |
| Run ID | `MOD-CRM-20260927-001` |
| User request | Continue approved discovery; redesign `/app/sales-crm/overview` as an operating dashboard |
| Product definition | `docs/06-product/crm/` and active CRM frontend track |
| Discovery status | `complete` |
| Owner | LoopDev delivery |

## Problem and objective

The current Overview mixes dashboard analytics with a full work center and several
parallel Platform feeds. This creates competing sources of truth, shows
context-free records, and exposes local/demo or document-extraction noise.
The objective is a decision-oriented dashboard for a sales user or manager:
understand current commercial health, see the next work items, and review one
deduplicated business activity summary in the active tenant scope.

Success means every visible metric/feed is traceable to a typed remote-ready
contract, tenant-scoped, permission-aware, localized, and rendered with explicit
loading/empty/error/forbidden/stale/offline/partial states. No fabricated values
or duplicate workspaces remain.

## Actors and outcomes

| Actor | Job | Outcome | Constraints |
|---|---|---|---|
| Sales user | Prioritize today’s work | KPI context, pipeline risks, next tasks, recent business activity | assigned/team scope |
| Sales manager | Coach and inspect health | aggregate KPIs, stage distribution, activity trend | team/org scope |
| Read-only user | Monitor | read-only dashboard, no mutation actions | permission and tenant scope |
| Tenant admin | Configure access | same dashboard under organization policy | RLS and entitlement controls |

## Expected capabilities

| Capability | Classification | Expected behavior | Priority |
|---|---|---|---|
| Tenant-scoped KPI cards | `REQUIRED_MVP` + `PLATFORM_REUSE` | contacts, open leads, open opportunities, pipeline value from Analytics contract | P0 |
| Pipeline health | `REQUIRED_MVP` | stage distribution and health indicators; no fabricated funnel | P0 |
| Compact task summary | `PLATFORM_REUSE` | pending/overdue/next tasks, deep-link to Tasks workspace | P0 |
| Authoritative activity summary | `PLATFORM_REUSE` | one filtered Activity read model; no separate Timeline feed | P0 |
| Remote Analytics adapter | `PLATFORM_REUSE` | Supabase/RLS-backed query path with freshness metadata | P0 |
| Notes/Attachments contextual links | `PLATFORM_REUSE` | not rendered by default; available from entity detail | P1 |
| Document Intelligence signals | `OUT_OF_SCOPE` | extraction metrics/noise not shown on CRM dashboard | P0 |
| Full Tasks workspace | `OUT_OF_SCOPE` | remains at `/app/sales-crm/tasks`, not embedded | P0 |

## Inputs, outputs and events

Inputs are active organization/workspace/brand scope, user permissions, date
range, optional owner/team/stage filters, CRM entities, Platform Tasks and
Activities, and Analytics metric definitions.

Outputs are typed KPI, pipeline-health, task-summary and activity-summary read
models. Mutations are limited to task status transition only when the shared
Task contract authorizes it; dashboard KPIs and activity are read-only.

| Event | Producer | Consumers | Minimum payload | Idempotency/audit |
|---|---|---|---|---|
| `crm.opportunity.stage_changed` | CRM | Analytics, Activity | tenant/entity/version/stage | event id + append-only audit |
| `crm.lead.created` | CRM | Analytics, Activity | tenant/entity/owner | event id |
| `platform.task.updated` | Tasks | Dashboard cache/read model | task id/version/status | version check |
| `platform.activity.recorded` | Activity | dashboard activity query | source ref/type/occurredAt | sourceType+sourceId dedupe |

## Entities and lifecycle

The dashboard owns no CRM entity. It consumes Contact, Lead, Opportunity,
Task and Activity projections. Read models carry `organizationId`, optional
workspace/brand, `generatedAt`, `freshness`, permission scope, and source
version. Activity is append-only; Tasks retain their own lifecycle and version.

## Platform integration

| Capability | Decision | Integration | Duplicate prohibited |
|---|---|---|---|
| Analytics | `REUSE` | `useAnalyticsMetric`/breakdown contracts and remote adapter | Yes |
| Tasks | `REUSE` | `usePlatformTasks` only for compact summary | Yes |
| Activity | `REUSE` | one authoritative Activity read model | Yes |
| Timeline | `REUSE` but not rendered | Timeline remains detail/read-model infrastructure | Yes |
| Notes | `REUSE` contextual only | no default panel; use detail route | Yes |
| Files/Attachments | `REUSE` contextual only | no default panel; future Storage adapter | Yes |
| Relations | `REUSE` contextual only | no fixed demo refs; entity-driven links only | Yes |
| Document Intelligence | `REUSE` elsewhere | no extraction status/cost/token cards here | Yes |

## External benchmark

| Reference | Source/accessed | Observation | Classification | Applicability / do not copy |
|---|---|---|---|---|
| Salesforce Pipeline Inspection | https://help.salesforce.com/s/articleView?id=sf.pipeline_inspection.htm (2026-09-27) | pipeline, activity and opportunity-change inspection with filters | `INDUSTRY_BASELINE` | adopt decision-oriented health; do not copy configurable BI breadth |
| Salesforce Reports/Dashboards | https://trailhead.salesforce.com/content/learn/modules/lex_implementation_reports_dashboards (2026-09-27) | role-oriented KPI dashboards and drill-down | `TRANSFERABLE_PATTERN` | role/scope-aware cards; defer dashboard builder |
| HubSpot reporting/pipelines | https://knowledge.hubspot.com/reports (2026-09-27) | tasks, pipeline and rep activity grouped for execution | `INDUSTRY_BASELINE` | compact task summary; do not reproduce multiple dashboards |
| Pipedrive Insights | https://support.pipedrive.com/hc/en-us/articles/360003870297-Insights-Reporting-Overview (2026-09-27) | pipeline/activity reports and team/individual views | `TRANSFERABLE_PATTERN` | simple stage health; defer custom report builder |

## Differentiation hypotheses

| Hypothesis | Value | Impact | Complexity | Experiment | Decision |
|---|---|---|---|---|---|
| Explainable health | managers trust KPI cards when each has source/freshness/scope | Analytics metadata | M | instrument card drill-down and freshness comprehension | `MVP` |
| Local-first continuity | reps can still prioritize from last authorized snapshot offline | cache/sync states | M | offline usability test | `follow-up` |
| One activity truth | dedupe improves scan speed and avoids contradictory feeds | Activity read model | M | compare task completion and confusion | `MVP` |
| Permission-aware stale cache | cached data disappears after scope loss | auth+sync | M | revoke-access reload test | `follow-up` |

## Expected versus existing

| Capability | Existing implementation | Baseline | Evidence / next action |
|---|---|---|---|
| Analytics KPIs | `useAnalyticsMetric` for four metrics; local/remote work in dirty tree | `EXISTS_PARTIALLY` | `Overview.tsx`, analytics plan; verify remote adapter/RLS |
| Pipeline breakdown | `useAnalyticsBreakdown("crm.pipeline_by_stage")` | `EXISTS_PARTIALLY` | route source; define health semantics and stale state |
| Task summary | full `PlatformTaskWorkspace` embedded | `EXISTS_BUT_CONFLICTS` | remove workspace, keep compact projection |
| Timeline + Activities | both rendered | `EXISTS_BUT_CONFLICTS` | choose Activity summary as authority |
| Notes + Attachments | default panels rendered; Notes permission error known | `EXISTS_BUT_CONFLICTS` | contextual only; verify forbidden state |
| Relations | fixed `crm_cust_1`, lead and opportunity refs | `EXISTS_BUT_CONFLICTS` | remove fixed demo refs; derive from real context |
| Document extraction noise | no explicit extraction panel in current excerpt, but shared feeds can surface it | `NOT_TESTED` | event taxonomy/filter test |
| Tenant scope | `activeOrganization`, `brandId`, workspace fallback | `EXISTS_PARTIALLY` | verify non-local org, RLS and cache invalidation |
| i18n | `useT` and CRM keys | `EXISTS_PARTIALLY` | audit all new labels, dates, currencies and RTL |
| Attachments Storage | Platform references; future Storage adapter | `EXISTS_PARTIALLY` | no migration in this module |

## Boundaries and handoff

MVP is the four KPI cards, pipeline health, compact Tasks summary, one Activity
summary, remote-ready contracts, explicit states, tenant/RBAC expectations and
responsive Rivera composition. Follow-up is offline snapshot, drill-down
explanations, saved filters and Storage. Out of scope are dashboard builder,
full Tasks workspace, default Notes/Attachments, fixed demo relations,
Document Intelligence metrics and new Platform duplicates.

Confirmed decisions: KPI catalogue is open pipeline, open leads, open
opportunities and overdue/today tasks; freshness target is 60 seconds with a
5-minute maximum; team aggregates are limited to selected-team records visible
under RLS/membership; activity is allowlisted to calls, emails, meetings,
notes, tasks, assignments, stage changes, conversions and closures, excluding
Document Intelligence extraction and technical events by default; the Tasks
summary is read-only with a deep link; cache is 60 seconds with stale/offline
state, no offline mutations and manual retry; activation is direct for all
tenants after tests with rollback on validation failure; export is out of MVP.
Open decisions are limited to the exact aggregate-versus-read-model threshold
and native iOS/Android ownership.

**Handoff:** `module-design` complete; proceed to design approval, then visual
design and plan approval. No production implementation started.
