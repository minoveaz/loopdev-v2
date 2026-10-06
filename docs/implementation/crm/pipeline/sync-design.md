# Phase 05 — Synchronization design

| Field | Value |
|---|---|
| Run | `MOD-CRM-PIPELINE-20260913-002` |
| Span | `MOD-CRM-PIPELINE-20260913-002:05-sync` |
| Parent | `MOD-CRM-PIPELINE-20260913-002:01-design` |
| Status | `completed` |

## State model

Keep business state (`open/won/lost/reopened`), connectivity (`online/offline/degraded`), entity sync (`synced/stale/forbidden/error`) and mutation (`idle/pending/acknowledged/retryable/rejected/conflict`) separate. UI must expose pending, stale, conflict, forbidden, error and success without changing business state optimistically beyond the adapter contract.

## Local boundaries and operation matrix

| Operation | Offline behavior | Reconciliation |
|---|---|---|
| Board/table/detail reads | Serve tenant-scoped local snapshot; mark stale | Refresh by cursor/version when online; drop forbidden records |
| Manual create | Queue idempotent command, show pending | Ack stable ID; retry transport failures; terminal validation/permission rejection remains visible |
| Stage move/update | Queue expected-version mutation; prevent duplicate action | Ack event/version; conflict preserves server record and offers refresh/reapply |
| Reopen | Queue only with explicit reason and permission snapshot | Recheck permission and version; rejection never silently changes terminal state |
| Lead conversion | Queue transaction with conversion tuple | Deduplicate by idempotency key and unique tuple; reconcile Lead and Opportunity atomically |
| Notes/Tasks/Activity/Files | Delegate to existing Platform queues and contracts | Pipeline consumes projections; no module-local queues |

## Retry and conflict policy

Use stable idempotency keys per user command and exponential backoff with bounded retries for timeout/network/unavailable errors. Do not retry validation, forbidden, cross-tenant, terminal transition or idempotency conflicts. A version conflict is a first-class `conflict` mutation: retain local intent for user review, refresh authoritative record, and require explicit retry with new version. Permission changes are rechecked before enqueue and on send; rejected queued work is auditable and removable without data loss.

## Migration and recovery

Migration maps local `organizationId` to tenant/workspace, preserves stable opportunity/stage/line IDs, normalizes product keys and imports append-only stage history. Duplicate conversion tuples merge to the authoritative Opportunity; ambiguous/null product keys quarantine for review. Reload restores queue and mutation state from durable local storage; partial sync resumes per command. Rollback uses additive migration markers and a reversible import cursor, never deletes source records until reconciliation evidence is complete.

## Test cases and risks

1. Offline create/move/reopen, reload, reconnect and ack exactly once.
2. Timeout retry, terminal rejection, permission revocation while queued and cross-tenant rejection.
3. Two writers with stale versions produce one conflict and no lost stage history.
4. Conversion replay returns existing Opportunity and does not double-convert Lead.
5. Partial page sync, forbidden cached record removal and migration rollback/resume.

Risk: current local stores are in-memory and do not yet provide durable queue semantics; this is a plan/build gap, not evidence of completed sync. Thresholds for stale health remain owned by Activity policy.

## Handoff

Complete; module-plan may sequence local adapter, shared Platform reuse, permissions, contracts and migration evidence.
