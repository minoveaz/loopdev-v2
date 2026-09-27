# CRM Overview Local-first and Synchronization Design

Run `MOD-CRM-20260927-001` · phase `05-sync`. Overview is read-mostly:
remote-authoritative queries are preferred, local adapters provide deterministic
fixtures/development and authorized stale snapshots. Platform Tasks owns all
write queues; Overview must not create a parallel queue.

## Boundaries and cache identity

Local storage may contain only normalized read projections and metadata:
`KpiMetric`, `PipelineHealth`, `TaskSummary`, `ActivitySummary`,
`generatedAt`, `freshUntil`, `sourceVersion`, `scopeHash`,
`permissionSnapshot`. Cache key is
`tenant/organization/workspace/brand/team/owner/period/permissionHash` plus
projection name and source version. No local cache may be read after a scope
or membership change until authorization is re-established.

## State model

Keep states separate:

- connectivity: `online | offline | reconnecting`;
- entity sync: `remote | local-only | stale | invalidated | forbidden`;
- mutation: `none | pending | retrying | rejected | conflicted | applied`
  (only relevant to delegated Platform Tasks writes);
- panel business state: `loading | success | empty | partial | error`.

Offline reads may show the last authorized snapshot labelled with timestamp
and stale/offline state. The read cache TTL is 60 seconds; data older than 5
minutes is stale and requires manual retry. They must never fabricate current
values or reveal data from another scope. This module has no offline mutations;
all task mutations occur in Tasks.

## Operation matrix

| Operation | Online | Offline | Source/conflict | Recovery |
|---|---|---|---|---|
| KPI/pipeline read | remote Analytics | authorized stale cache/local fixture | sourceVersion refresh; no merge | bounded retry, then stale |
| Task summary read | Platform Tasks | authorized stale snapshot | source version refresh | reconnect and requery |
| Activity summary read | Platform Activity | authorized stale snapshot | dedupe `(sourceType,sourceId)` | requery and discard duplicates |
| Task transition | Tasks module only | not available from Overview | Tasks owns version/conflict | open Tasks; user resolves there |
| Refresh | invalidate/requery | mark reconnecting | no local mutation | preserve filters |

Successful remote reads replace the projection only after schema, scope hash
and permission snapshot validation. A partial panel update cannot overwrite
other panels with empty data.

## Retry, idempotency and conflicts

Reads retry only network errors, 429 and 5xx using bounded backoff and
`Retry-After`; the user can manually retry after failure. No Overview task
writes use an idempotency key because mutations do not originate here. Any
Tasks conflict is handled by the Tasks module. Permission rejection clears the
cached projection. Never last-write-wins business data silently.

## Migration and rollback

Migration is adapter-by-adapter: local fixture IDs map to remote UUIDs only in
controlled seed/import manifests; they are not inferred at runtime. Dual-read
comparison records counts, scope, sourceVersion, freshness and schema parity
without exposing payloads. After tests pass, cutover activates the new
composition for all tenants; there is no per-tenant feature-flag rollout.
Rollback returns to the prior composition and preserves source records; it does
not delete caches until authorization revocation/retention policy permits. Any
failed validation leaves the issue open, records a checkpoint attempt and
invalidates dependent evidence.

## Recovery and tests

Required tests: reload with pending task write; offline/online transition;
stale cache age and freshness label; scope change and membership revocation;
duplicate event delivery; schema mismatch quarantine; 409 task conflict;
partial panel failure; migration map collision; rollback to prior route; and
cross-tenant cache-key isolation. Runtime queue/backend evidence is not
available in this analysis run.

Open decisions: exact remote read-model threshold and migration owner/cutover
evidence. Cache TTL, freshness, offline mutation policy and activation strategy
are confirmed above.

**State: complete with implementation evidence deferred.** Handoff:
`WAITING_IMPLEMENTATION_APPROVAL` (next approval immediately before production
implementation).
