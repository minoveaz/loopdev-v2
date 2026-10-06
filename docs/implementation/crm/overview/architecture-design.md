# CRM Overview Architecture and Design

## Document control

| Field | Value |
|---|---|
| Module | CRM Overview / Sales Operating Dashboard |
| Run ID | `MOD-CRM-20260927-001` |
| Design checkpoint | `runs/MOD-CRM-20260927-001/01-design.json` |
| Status | `confirmed_for_pre-implementation_gate` |
| Architecture quality | `PASS_WITH_DEBT` |

## Target architecture

Presentation → application orchestration → CRM/Platform ports → local or remote adapters.
The page owns composition only; Analytics owns metric semantics; Tasks and Activity
own their entities and mutations; authorization/RLS owns visibility.

| Layer | Responsibility | Areas | Forbidden |
|---|---|---|---|
| Presentation | Rivera layout, state renderers, navigation | `Overview.tsx`, shared cards | direct storage/query |
| Application | combine KPI/pipeline/task/activity reads | CRM overview hook/use case | domain mutation rules |
| Domain/ports | read-model DTOs, filters, state semantics | CRM/Analytics contracts | UI-specific state |
| Adapters | local fixtures, Supabase/RLS queries, cache | platform analytics, CRM adapters | bypassing scope |

## Responsibility matrix

| Concern | Owner | Consumers | Must not contain |
|---|---|---|---|
| UI | CRM page + Rivera primitives | CRM routes | mock business arrays |
| Metrics | Platform Analytics | CRM, DI, future modules | page-specific calculations |
| Tasks | Platform Tasks | Overview, Tasks route | duplicate workspace |
| Activity | Platform Activity/read model | Overview, details | Timeline duplicate |
| Authorization | Auth + RLS | every adapter/query | UI-only checks |
| Sync | Platform adapter/queue | dashboard reads, tasks writes | local queue duplicate |

## Platform contracts

| Capability | Decision | Contract | Consumers | Duplicate prohibited |
|---|---|---|---|---|
| Analytics | REUSE | metric/breakdown response + freshness | CRM/DI | Yes |
| Tasks | REUSE | task query/state/version | CRM/Tasks | Yes |
| Activity | REUSE | filtered business activity | CRM/details | Yes |
| Notes/Files/Relations | REUSE contextual | entity refs/panels | details | Yes |
| Document Intelligence | REUSE elsewhere | extraction contracts | DI | Yes |

## Structural quality

Audit targets: current page mixes concerns and fixed references; remove imports
and rendering without changing shared Platform contracts. Preserve existing
routes and adapter boundaries. Tests must prove no direct localStorage/Supabase
access, no duplicate feed, and no accidental extraction events.

## Confirmed operating decisions

- KPI catalogue: open pipeline, open leads, open opportunities, overdue/today
  tasks.
- Freshness: 60-second target; 5-minute maximum acceptable age.
- Team aggregates: only records visible to the selected team under RLS and
  membership; never cross-team data.
- Activity: calls, emails, meetings, notes, tasks, assignments, stage changes,
  conversions and closures; Document Intelligence extraction and technical
  events excluded by default.
- Tasks summary is read-only and deep-links to Tasks; all mutations remain in
  Tasks.
- Read cache is 60 seconds with explicit stale/offline state; no offline
  mutations and manual retry.
- New composition activates for all tenants after tests pass, without a
  feature-flag rollout; validation failure rolls back to the prior composition.
- Export is out of MVP.

## Open decisions/debt

`DEC-OVR-04` aggregate vs read model threshold remains open. Native iOS/Android
ownership is also open. Debt: remote analytics/RLS evidence is not proven in
the current dirty checkout; owner Platform/CRM; validation is required before
activation/release. This is a recorded evidence gap, not a scope deviation.
