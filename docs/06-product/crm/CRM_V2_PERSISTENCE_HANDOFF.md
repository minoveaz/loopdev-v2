# CRM v2 persistence handoff

LoopDev v2 currently runs on the local CRM adapter. This document records the
boundary for the future Supabase adapter without adding migrations or requiring
Docker/Supabase on the development machine.

## Reused legacy rules

The legacy CRM implementation remains the source for persistence rules that v2
must preserve:

- `organization_id` is the tenant boundary; `workspace_id` and `brand_id` are
  additional operational scope.
- Opportunities require a contact and use `origin` (`manual` or
  `lead_conversion`).
- Lead conversion is idempotent per organization, lead and normalized
  `productKey`.
- Stage changes and detail updates use optimistic concurrency.
- `won` and `lost` are Opportunity terminal stages; they do not mutate Lead
  status.
- Timeline events are append-only and should use the modern
  `crm_timeline_events` model when persistence is connected.
- Access checks and RLS stay in the adapter/service boundary, never in pages.

## Current v2 boundary

```text
Opportunities page / Pipeline / Leads
  -> useCrmPipeline / useCrmLeads
  -> LoopdevCrmAdapter
  -> localLoopdevAdapter
```

The future implementation must satisfy the same `LoopdevCrmAdapter` contract.
It should translate the UI's `expectedUpdatedAt` to the legacy persistence
version field and translate probability values between the local decimal
representation (`0..1`) and the backend integer representation (`0..100`).

## Deliberately deferred

Do not copy or execute legacy migrations in v2 yet. Supabase integration,
tenant/session resolution, RLS validation, API routes and shared package
contracts belong to the persistence phase. Until then, local fixtures are
explicitly a frontend-first simulation and must not be treated as durable
backend data.
