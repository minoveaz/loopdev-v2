# Phase 04 — API contracts

| Field | Value |
|---|---|
| Run | `MOD-CRM-PIPELINE-20260913-002` |
| Span | `MOD-CRM-PIPELINE-20260913-002:04-api` |
| Parent | `MOD-CRM-PIPELINE-20260913-002:01-design` |
| Status | `completed` |

## Command/query catalog

| Contract | Inputs | Result and consistency |
|---|---|---|
| `listPipelineBoard` | scope, query, stage/owner/product/origin filters, cursor, limit, sort | Authorized `PipelineBoardColumn[]`, cursor and totals; read-consistent snapshot |
| `listOpportunities` | scope, filters, cursor, limit, sort | Authorized paginated rows with Contact/Lead summaries and activity projection |
| `getOpportunity` | opportunity ID + scope | Detail, relations, stage history and shared activity; direct URL authorization required |
| `createManualOpportunity` | Contact, product, initial fields, idempotency key | Transactional Opportunity `origin=manual`; no Lead mutation |
| `createOpportunityFromLead` | qualified Lead, product, fields, idempotency key | Idempotent conversion, stable `qualified` stage, Lead status update once |
| `moveOpportunityStage` | ID, target stage, expected version, reason/origin | Updated record + stage event or conflict/forbidden |
| `reopenOpportunity` | terminal ID, open target, expected version, reason | Updated record + reopen event; elevated permission |
| `updateOpportunity` | ID, allowed patch, expected version | Updated record or version conflict |
| `configurePipelineStage` | workspace/admin scope, stable ID or create input | Stage config; immutable ID and validated default |

## DTO requirements

Responses include stable IDs, tenant/workspace scope, `origin`, `productKey`, stage ID and label, version, timestamps, permission affordances, last activity and derived health. Detail responses use relation references to shared Contact/Lead/Activity/Notes/Tasks/Customer 360 contracts; no duplicate embedded domain models. Errors use `{ data, error: { code, message }, requestId }` and never expose secrets or unnecessary PII.

## Error, pagination and concurrency rules

Error codes include `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `IDEMPOTENCY_CONFLICT`, `CONTACT_REQUIRED`, `LEAD_REQUIRED`, `INVALID_STAGE`, `STAGE_TRANSITION_FORBIDDEN`, `INVALID_STAGE_CONFIGURATION`, `REOPEN_FORBIDDEN`, `REOPEN_REASON_REQUIRED` and `CROSS_TENANT_REFERENCE`. Cursor pagination is opaque, bounded by server limit, and sorting is deterministic with stable ID tie-break. Mutating commands require optimistic version; idempotency keys are scoped to tenant and command, and reuse with a different payload is terminal conflict.

## Events/retries/observability

Events use stable entity IDs, actor, tenant/workspace, previous/new state, version, origin and request ID. Consumers are at-least-once and deduplicate by event ID. Transactional command failures are terminal except transport/timeouts and retryable dependency unavailability; retries preserve idempotency. Logs record redacted request ID, command, scope result, latency, retry count and conflict code.

## Open decisions and compatibility

- `confirmed`: existing local adapter remains a compatibility implementation of these contracts.
- `assumed`: remote transport will preserve the envelope and shared Platform event contracts.
- `open`: final cursor encoding and backend HTTP/RPC naming; do not block local plan.
- `open`: whether stage configuration creation is in MVP or admin follow-up.

## Handoff

Complete; sync-design defines how these commands behave offline and during migration.
