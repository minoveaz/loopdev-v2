# CRM Overview API Contracts

Run `MOD-CRM-20260927-001` · phase `03-api` · contract-only, no endpoint
implementation. Transport may be REST/RPC behind the existing adapter port;
the browser must not call Supabase directly.

## Scope and query catalog

All requests carry `organizationId` and an authenticated session. Optional
`workspaceId`, `brandId`, `teamId`, `ownerId` and `stageCodes` are narrowing
filters. `period` is `{ from, to, timezone }`; dates are ISO-8601 and the
server caps the range and page size.

The KPI catalogue is fixed for MVP: `open_pipeline`, `open_leads`,
`open_opportunities`, and `overdue_today_tasks`. `freshUntil` targets 60 seconds
after `generatedAt`; responses older than 5 minutes are stale and must not be
rendered as a normal fresh success.

| Query | Stable operation | Result |
|---|---|---|
| KPI cards | `GET /crm/overview/kpis` | `OverviewEnvelope<KpiMetric[]>` |
| Pipeline health | `GET /crm/overview/pipeline-health` | `OverviewEnvelope<PipelineHealth>` |
| Task summary | `GET /crm/overview/task-summary` | `OverviewEnvelope<TaskSummary>` from Platform Tasks |
| Activity summary | `GET /crm/overview/activity-summary` | `OverviewEnvelope<ActivitySummary>` from Platform Activity |

`OverviewEnvelope<T>` is:

```ts
type OverviewEnvelope<T> = {
  scope: { tenantId: string; organizationId: string; workspaceId?: string; brandId?: string };
  period: { from: string; to: string; timezone: string };
  data: T;
  generatedAt: string;
  freshUntil: string | null;
  sourceVersion: string;
  permission: "full" | "partial";
  correlationId: string;
  nextCursor?: string | null;
};
```

`permission: "partial"` may remove sensitive fields or rows but never
reveals their existence. A 403/404 direct URL response is neutral and must
not distinguish an unknown organization from an unauthorized one.

## Validation, pagination and consistency

The server re-resolves tenant, organization, membership, workspace/brand and
record scope; it ignores any client scope not granted by session policy.
`limit` defaults to 25 and is capped at 100; cursor is opaque and signed.
KPI and pipeline results are bounded aggregates (no arbitrary sort); task and
activity summaries sort by `dueAt`/`occurredAt` descending with stable ID
tie-breakers. Responses are snapshot-consistent per query and may differ
between independent panels; `sourceVersion` and `generatedAt` make that
visible.

## Errors

| Code | HTTP | Retry | Meaning/action |
|---|---:|---|---|
| `OVERVIEW_SCOPE_REQUIRED` | 400 | no | missing organization/tenant context |
| `OVERVIEW_INVALID_FILTER` | 400 | no | invalid period, cursor, limit or scope descendant |
| `OVERVIEW_FORBIDDEN` | 403/404 | no | neutralized unauthorized scope/deep link |
| `OVERVIEW_SCHEMA_MISMATCH` | 502 | no | adapter/backend contract drift; quarantine response |
| `OVERVIEW_UPSTREAM_UNAVAILABLE` | 503 | bounded | retry with backoff, then stale cache |
| `OVERVIEW_RATE_LIMITED` | 429 | bounded | honor `Retry-After` |
| `OVERVIEW_STALE_VERSION` | 409 | no | only task mutation; reload current task |
| `OVERVIEW_CONFLICT` | 409 | no | mutation rejected by source ownership/version |

Errors include `correlationId`, no record names or sensitive aggregate values,
and are mapped to localized UI copy.

## Task mutation boundary

Overview has no mutation endpoint. The task summary is read-only and every
mutation is performed in the Tasks module, which owns authorization, audit,
versioning and any future offline queue. Overview provides an authorized deep
link only.

## Events and asynchronous work

Analytics consumes `OpportunityCreated|Updated|StageChanged` and publishes
`AnalyticsProjectionUpdated { metricId, scope, period, sourceVersion,
generatedAt }`. Tasks and Activity retain their shared event contracts.
Activity input is restricted to calls, emails, meetings, notes, tasks,
assignments, stage changes, conversions and closures. Document Intelligence
extraction and technical events are excluded by default. Overview invalidates
or re-fetches on matching scope/version; it does not publish domain events.
Delivery is at-least-once; consumers dedupe by `sourceVersion` or
`(sourceType, sourceId)`. Query retry is manual after a bounded failed request;
no Overview-owned job or queue is introduced.

## Sensitive fields, observability and rollback

Aggregate responses omit hidden record identifiers, contact details and
financial fields not covered by policy. Logs contain operation, scope hash,
metric ID, latency, result class and correlation ID, never raw payloads.
The new composition activates directly for all tenants after the validation
suite passes. There is no feature-flag rollout. If validation fails, rollback
restores the prior route composition without altering source data or adapters.

Open decisions: canonical endpoint vs RPC naming, exact read-model threshold,
and native iOS/Android ownership.
Remote Analytics is only partially implemented in this checkout; these
contracts are not runtime readiness evidence.

**State: complete with open decisions.** Handoff: `04-access`.
