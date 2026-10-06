---
name: sync-design
description: Define local-first persistence, synchronization and conflict behavior for a LoopDev module.
user-invocable: false
---

# LoopDev Synchronization Helper

Define how a module works locally now and migrates safely to a remote backend.

## Cover

- Local entities and storage boundaries.
- Adapter interfaces.
- Offline reads and writes.
- Mutation queue and idempotency keys.
- Retry and backoff behavior.
- Versioning and conflict resolution.
- Server rejection and reconciliation.
- Migration from local storage to remote data.
- User-visible synchronization state.
- Synchronization boundaries for shared Platform capabilities and related
  entities.

Return a state model, operation matrix, conflict policy, migration risks and
test cases. Do not invent backend infrastructure or modify code.

## Common Contract

### Input context

- module specification and domain model;
- `module-discovery` artifact with lifecycle, outputs and recovery
  expectations;
- current local adapter/storage patterns;
- known remote API and connectivity constraints.

### Decision status

Mark sync rules as `confirmed`, `assumed` or `open`. Keep business state,
connectivity state, entity sync state and mutation state separate.

### Output handoff

Return:

- local entity/storage boundaries;
- operation and offline matrix;
- mutation state model;
- retry/idempotency rules;
- conflict policy;
- migration and reconciliation plan;
- test cases, risks and open decisions;
- state `complete`, `partial` or `blocked`.

### Action boundaries

This helper defines synchronization semantics only. It does not implement
storage, queues or backend infrastructure and does not modify production files.

Reuse the established local adapters, mutation queues and synchronization
states of shared Platform capabilities. Do not create module-local upload,
preview, notes or document-processing queues when Platform already owns them.

Define recovery after reload, offline rejection, permission changes, version
conflicts, failed jobs, migration rollback and partial synchronization.
Distinguish business state, connectivity, entity sync state and mutation state
in every operation matrix.

Use discovery to identify which expected capabilities must work local-first
and which outputs/events require durable reconciliation. Existing local
behavior is baseline evidence, not the target sync contract.

### Traceability

Return a helper checkpoint linked to the parent phase using
`docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md`, with the sync state
model, operation matrix, conflict policy, migration risks, detected failure,
likely origin and status. Use
`docs/implementation/_templates/phase-evidence.md` for the human-readable
phase record.
## Multiplatform synchronization gate

Define one semantic sync policy for web, iOS and Android. Distinguish storage
and lifecycle adaptations from business behavior, and include reload, offline,
permission changes, conflicts, tenant changes, reinstall and recovery evidence.
