# Platform Analytics/Insights Implementation Plan

## Inputs

- Product definition: Issue 19, reusable multi-tenant Analytics/Insights capability.
- Design run: Not yet recorded; issue 19 is the current functional specification.
- Track: Platform capability consumed by CRM and Document Intelligence.
- Main issue: 19.
- Approved by: Pending explicit plan approval.
- Approval date: Pending.

## Environment baseline

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/Documents/Proyectos/loopdev-v2` |
| Checkout type | In-place canonical local checkout |
| Branch | `feature/crm-v2-foundation` |
| Base branch | `develop` |
| HEAD | `e9ca052` |
| Runtime URL | `http://127.0.0.1:8080` |
| Runtime port | `8080` |
| Working tree | Dirty: branding and title changes in `index.html`, `public/site.webmanifest`, `public/favicon.svg`, `src/App.tsx`, `src/components/layout/AppShell.tsx`, `src/components/layout/Topbar.tsx`, and `src/components/layout/DocumentTitle.tsx` |

## Scope and decisions

| Decision | Status | Rationale |
|---|---|---|
| Analytics is a Platform capability | Confirmed | CRM and Document Intelligence must consume common contracts and states. |
| MVP is operational product analytics, not a general BI builder | Confirmed | Avoid premature warehouse/query-builder complexity. |
| Tenant/workspace scope is mandatory | Confirmed | Prevent cross-tenant leakage and align with Platform authorization. |
| Empty dashboards retain visual structure but never fabricate data | Confirmed | Estar Protegidos starts with low data volume. |
| Direct aggregate queries may be used initially | Assumed | Read models/materialized views are introduced only where measured performance requires them. |
| Final metric catalogue and freshness SLAs | Open | Must be approved during design before backend implementation. |
| Supabase schema/read-model strategy | Open | Depends on existing CRM tables and production/staging migration policy. |

## Target architecture

```text
Module pages
  -> analytics hooks
    -> Platform Analytics contract
      -> local adapter (development/tests)
      -> Supabase adapter (RLS-scoped production data)
        -> metric definitions / aggregate queries / read models

Shared UI primitives consume typed results and render loading, empty,
error, forbidden, stale, offline and success states.
```

The Platform contract must expose typed operations equivalent to:

```text
getMetric(metricId, filters)
getTimeSeries(metricId, filters, interval)
getBreakdown(metricId, filters, dimension)
```

Every response includes metric identity/version, applied scope, period,
unit/format, generated time, freshness and explicit error state.

## Ordered work breakdown

| ID | Phase | Issue | Type | Task | Dependencies | Files/areas | Validation | Definition of done |
|---|---|---:|---|---|---|---|---|---|
| ANA-00 | Preparation | 19 | audit | Freeze environment truth and isolate current branding/UI changes | none | checkout, git state, runtime | status, branch, HEAD, route smoke | Analytics work can be reviewed without overwriting unrelated changes |
| ANA-01 | Discovery | 19 | audit | Complete platform reuse audit for existing StatCard, MetricTrend, Activity, Tasks, Notes and Document Intelligence metrics | ANA-00 | `src/components/common`, `src/loopdev/domains/platform`, `src/loopdev/domains/document-intelligence`, inventory docs | audit matrix and consumer list | Every reuse/extend decision has evidence and no duplicate primitive is planned |
| ANA-02 | Discovery | 19 | audit | Complete architecture, responsibility and refactor-safety audit | ANA-01 | contracts, adapters, hooks, Supabase boundaries | dependency-direction and ownership review | Public contract, adapter and UI responsibilities are assigned |
| ANA-03 | Design | 19 | design | Approve metric schema, catalogue, dimensions, freshness and period semantics | ANA-01, ANA-02 | new platform analytics contract | contract examples and decision record | CRM and Document Intelligence metric definitions are versioned and approved |
| ANA-04 | Design | 19 | design | Approve access, RLS, offline/local-first and error semantics | ANA-03 | platform permissions, auth scope, Supabase policies | tenant isolation cases and state matrix | Unauthorized, forbidden, stale, offline and partial-data behavior is explicit |
| ANA-05 | Platform | 19 | implementation | Implement typed Analytics contracts, metric registry, filters and response/error types | ANA-03, ANA-04 | `src/loopdev/domains/platform/analytics` | contract/unit tests | Shared API supports metric, time-series and breakdown queries |
| ANA-06 | Platform | 19 | implementation | Implement local adapter and deterministic fixtures only for development/tests | ANA-05 | local analytics adapter and test data | adapter contract tests | Local adapter returns empty and populated states without production mock leakage |
| ANA-07 | Platform | 19 | implementation | Implement reusable metric state hooks and UI primitives | ANA-05 | `src/components/analytics`, hooks | component tests for all states | Loading, empty, error, forbidden, stale, offline, pending and success render consistently |
| ANA-08 | Backend | 19 | implementation | Implement Supabase aggregate adapter, RLS-safe scope enforcement and migrations/functions where needed | ANA-04, ANA-05 | Supabase migrations/functions, remote adapter | SQL/RLS tests and scoped smoke tests | Queries return only authorized tenant/workspace data and include freshness metadata |
| ANA-09 | CRM | 19 | integration | Replace CRM Overview mocks with Analytics metrics and contextual empty states | ANA-06, ANA-07, ANA-08 | `src/loopdev/pages/crm/Overview.tsx`, CRM adapter | route, refresh, empty/populated/error journey | `/app/sales-crm/overview` has no fabricated staging/production data |
| ANA-10 | Document Intelligence | 19 | integration | Publish/consume extraction, confidence, accuracy, pending, token, cost, provider/model and error metrics | ANA-06, ANA-07, ANA-08 | DI adapter, overview and metrics components | adapter/route/runtime tests | DI metrics use real tenant-scoped data and remain compatible with issue 17 ledger |
| ANA-11 | Hardening | 19 | verification | Validate accessibility, i18n/RTL, responsive portals, performance and rollback | ANA-09, ANA-10 | all changed surfaces | focused tests plus browser route evidence | No regression in existing platform consumers; rollback path documented |
| ANA-12 | Delivery | 19 | evidence | Record phase evidence, update issue checklist and prepare commit | ANA-11 | implementation docs and issue 19 | full targeted suite, diff check | Issue acceptance evidence is complete before close/merge |

## Mandatory audits

- [ ] Environment truth audit (ANA-00).
- [ ] Platform reuse audit (ANA-01).
- [ ] Legacy-flow audit: remove CRM mock path from runtime while retaining local fixtures only for tests (ANA-02, ANA-09).
- [ ] Route and runtime audit for `/app/sales-crm/overview` and Document Intelligence overview (ANA-09, ANA-10).
- [ ] Surface-state audit for loading, empty, error, forbidden, conflict, offline, pending and success (ANA-07).
- [ ] Operation-parity audit across desktop web/mobile surfaces where Analytics is exposed (ANA-11).
- [ ] Renderer-action test audit for filters, retry, refresh and empty-state CTAs (ANA-07, ANA-11).
- [ ] Accessibility and i18n audit (ANA-11).
- [ ] Security and rollback audit for tenant isolation, sensitive metrics and migrations (ANA-04, ANA-08, ANA-11).
- [ ] Architecture-boundary audit (ANA-02).
- [ ] Responsibility audit (ANA-02).
- [ ] Refactor-safety audit (ANA-02, ANA-11).

## Initial metric interaction matrix

| Consumer | Metrics | Trigger | Shared data | Permission | Evidence |
|---|---|---|---|---|---|
| CRM Overview | contacts, leads, opportunities, pipeline, tasks, activity | route load, filters, refresh | CRM entities and Platform activity/tasks | CRM read permissions | populated/empty/error route journeys |
| Document Intelligence Overview | processed, status, confidence, validated accuracy, pending review, tokens, cost, provider/model, errors | route load, filters, refresh | extraction records and usage metadata | Document Intelligence read permissions | scoped adapter and UI state tests |
| Future IA Services | ledger cost, tokens, model effort, latency | reporting period query | issue 17 append-only ledger | IA consumption permission | deferred until ledger exists |

## Risks and blockers

| ID | Risk/blocker | Impact | Owner | Mitigation | Status |
|---|---|---|---|---|---|
| R-01 | Issue 19 does not yet define metric IDs, dimensions or freshness SLAs | High | Product/Platform | Approve ANA-03 decisions before implementation | Open |
| R-02 | CRM overview contains extensive mock arrays and may not map one-to-one to persisted entities | High | CRM/Platform | Inventory persisted schema and map unsupported cards to explicit empty states | Open |
| R-03 | Current working tree contains unrelated branding/title changes | Medium | Delivery | Keep ANA-00 boundary and do not revert or mix changes silently | Open |
| R-04 | Document Intelligence cost is currently embedded in extraction metadata, while issue 17 defines a future ledger | Medium | Platform/IA | Use current fields as source with explicit compatibility boundary; do not claim billing readiness | Assumed |
| R-05 | Direct aggregate performance is unknown at tenant scale | Medium | Backend | Instrument query latency and introduce read models only with evidence | Assumed |

## Required approval before implementation

Approve the plan and the following MVP decisions:

1. Metric IDs and initial CRM/Document Intelligence catalogue.
2. Supported filters: organization, workspace, date range and optional owner/status.
3. Freshness contract: synchronous query timestamp for MVP, with `stale` only when a cached/read-model result is older than its declared threshold.
4. Empty-state policy: retain cards/graph containers, render explanatory empty states, and never show fabricated values outside local development fixtures.
5. Backend approach: begin with RLS-scoped aggregate queries and add read models only after measured need.

State: **partial / blocked pending plan and metric-contract approval**.
