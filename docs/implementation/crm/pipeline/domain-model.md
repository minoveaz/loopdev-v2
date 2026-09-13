# Phase 02 — Domain model

| Field | Value |
|---|---|
| Run | `MOD-CRM-PIPELINE-20260913-002` |
| Span | `MOD-CRM-PIPELINE-20260913-002:02-domain` |
| Parent | `MOD-CRM-PIPELINE-20260913-002:01-design` |
| Status | `completed` |

## Entities and relationships

| Entity | Source of truth / scope | Relationships and rules |
|---|---|---|
| Opportunity | CRM aggregate; tenant/workspace scoped | Requires Contact and stable `productKey`; optional Lead; owns lifecycle, version and audit identity |
| PipelineStage | Workspace CRM configuration | Stable ID, mutable label/order/active flag, terminal type `open\|won\|lost`; Opportunity references ID, never label |
| OpportunityLine | CRM child record | One or more product/catalog references; quantity positive; contributes commercial summary |
| StageHistory | CRM event projection consumed by Activity/Timeline | Append-only from/to stage, actor, origin, reason and timestamp; no duplicate timeline implementation |
| Activity health | Derived from shared Activity/Tasks | `fresh\|stale\|overdue\|unknown`; recomputable and evidence-backed, not persisted as authoritative business state |
| Lead conversion | Cross-domain command identity | Unique `(tenant, lead, productKey, origin=lead_conversion)`; preserves Contact and Lead links |

All records carry tenant/workspace scope and version/audit timestamps. Brand is a CRM attribute, not an independent security boundary.

## Lifecycle and invariants

| Rule | Status | Boundary |
|---|---|---|
| Open stages may move only through authorized transitions; terminal stages are immutable through normal move | confirmed | Domain invariant |
| `won`/`lost` can leave only via explicit reopen, elevated permission and non-empty reason | confirmed | Domain invariant + authorization |
| Manual creation uses configured active open default; conversion starts at stable `qualified`; missing default returns `INVALID_STAGE` | confirmed | Persistence/command validation |
| Contact is mandatory; conversion Contact/Lead/product attribution cannot be edited | confirmed | Domain invariant |
| Product identity is normalized stable key, not display label | confirmed | Persistence constraint |
| Manual creation never changes Lead status; first successful conversion changes qualified Lead to converted | confirmed | Cross-module invariant |
| Version is required for mutations and stage history is append-only | confirmed | Persistence/concurrency |
| Archive is soft-delete; archived records are excluded from default reads and may be restored by authorized manager/admin with audit | assumed | Retention policy |
| Hard delete and automatic purge are outside pilot; retention period remains open | open | Product/platform policy |

## Events and consumers

`opportunity.created`, `opportunity.stage_changed`, `opportunity.reopened`, `opportunity.converted_from_lead`, and derived `opportunity.activity_health_changed` carry tenant/workspace, stable IDs, actor, origin, version and request/idempotency identity. Activity, Customer 360, Tasks/Notes and automation consume the existing Platform contracts.

## Risks and open questions

- Existing local records use `organizationId` and nullable `productKey`; migration must normalize scope and reject ambiguous products.
- Confirm whether archive/restore is needed in MVP and the retention period before backend schema work.
- Health thresholds (fresh/stale/overdue) must be owned by Activity policy, not duplicated in Pipeline.

## Handoff

Complete; access-design may define enforcement against these invariants.
