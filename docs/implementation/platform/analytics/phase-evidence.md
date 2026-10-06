# Analytics/Insights Build Evidence

## Phase

Initial Platform contract and CRM empty-state integration.

## Environment

- Repository: `/Users/minoveaz/Documents/Proyectos/loopdev-v2`
- Checkout: in-place canonical checkout
- Branch: `feature/crm-v2-foundation`
- HEAD at start: `e9ca052`
- Runtime target: `http://127.0.0.1:8080`
- Working tree: contained pre-existing branding/title changes; preserved.

## Completed

- Added typed Platform Analytics contracts for metrics, filters, metric results, series results and explicit errors.
- Added versioned initial catalogue for CRM and Document Intelligence.
- Added local adapter with mandatory organization scope validation.
- Exposed Analytics through the Platform adapter boundary.
- Added `useAnalyticsMetric`.
- Added reusable empty-state presentation.
- Replaced CRM Overview fabricated KPI values and chart fixtures with scoped local metrics and explicit empty chart states.
- Added adapter tests for scoped metrics, invalid scope and empty series behavior.
- Added Document Intelligence metric projections (`processed`, `pending_review`,
  `average_confidence`, `estimated_cost`) through the same Platform contract.
- Added a Supabase adapter for Document Intelligence metrics with explicit
  organization filtering and non-silent `UNAVAILABLE` errors; the Platform
  boundary uses it when Supabase is configured and retains local behavior only
  when no remote client exists.
- Connected Document Intelligence overview KPI values to the shared Analytics
  hook while retaining adapter metrics as compatibility fallback.
- Added Supabase CRM KPI queries for contacts, open leads, open opportunities
  and pipeline value.
- Added tenant-checked Supabase RPCs for time series and breakdowns covering
  the initial CRM and Document Intelligence metric families.

## Validation

```text
npm run typecheck                         PASS
npm run lint -- --quiet                   PASS
npx vitest run src/test/platform/analytics.test.ts src/test/platform/platform-foundation.test.ts  PASS (6 tests)
git diff --check                          PASS
```

## Acceptance evidence

- A tenant with no time-series data receives an empty series, not fabricated points.
- A metric query without organization scope is rejected.
- CRM overview cards are backed by the Analytics contract and local CRM stores.
- CRM pipeline, funnel, activity and owner areas retain their structure and show empty states.
- Document Intelligence metrics can be queried through the shared catalogue and
  preserve the existing adapter's organization scope.
- Remote metric failures are not converted into successful local fixture data.
- Time series and breakdown queries execute through explicit allow-listed RPC
  metric identifiers rather than arbitrary SQL from the browser.

## Pending / blocked

- Additional CRM metrics (tasks/activity/owners), cache/read-model tuning and
  browser runtime evidence remain pending.
- Document Intelligence overview cards have not yet been migrated to render
  directly from the Analytics hook; the existing metrics adapter remains the
  runtime source until the Supabase Platform adapter is available.
- CRM time-series/breakdown queries currently return empty series pending backend/read-model definitions.
- Runtime browser evidence for deep-link refresh and portal surfaces remains pending.
- Issue 19 must remain open until these acceptance areas are completed.

## Risks and rollback

- The local adapter is intentionally development-only and must not be treated as production analytics.
- Rollback is surgical: remove the Analytics exports/adapter field, hook, components, CRM Overview integration and tests; no database migration was introduced.
- Existing branding/title changes were not reverted or mixed into this phase.
