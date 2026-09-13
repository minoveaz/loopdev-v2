---
name: api-contracts
description: Define backend API, DTO, error and event contracts for a LoopDev module.
user-invocable: false
---

# LoopDev API Contracts Helper

Provide contracts that can support the current local adapter and a future
remote backend.

## Cover

- Commands and query endpoints.
- Request and response DTOs.
- Validation and error codes.
- Pagination, filtering and sorting.
- Idempotency and version checks.
- Transactions and consistency boundaries.
- Domain events, payloads and consumers.
- Webhooks, jobs and retry semantics where needed.
- Contracts for consuming shared Platform capabilities and their events.

Return contract tables and unresolved decisions. Do not implement endpoints or
choose infrastructure without an approved parent plan.

## Common Contract

### Input context

- module specification and domain decisions;
- `module-discovery` artifact with inputs, outputs, events and expected
  integrations;
- current adapter interfaces and repository evidence;
- future backend constraints when known.

### Decision status

Mark contracts as `confirmed`, `assumed` or `open`. Separate domain commands
from transport details and identify errors that are retryable or terminal.

### Output handoff

Return:

- command/query catalog;
- request and response DTO tables;
- error catalog;
- pagination/filter/sort rules;
- concurrency and idempotency rules;
- event and retry contracts;
- risks and open decisions;
- state `complete`, `partial` or `blocked`.

### Action boundaries

This helper defines contracts only. It does not implement endpoints, choose
infrastructure or change production files.

Prefer existing Platform contracts for Notes, Files, Document Intelligence,
Activity, Tasks and Relations. Define an extension only when the shared
contract lacks a generic capability, and identify existing consumers affected
by that extension.

Use discovery's input/output/event inventory as the completeness baseline.
Every missing or conflicting contract must become an explicit decision or
plan task; do not let the current adapter define the target contract by
accident.

Every contract must define direct-URL authorization behavior, tenant scope,
sensitive-field handling, retryability, idempotency, version conflicts,
observability and rollback/recovery semantics where it changes persisted
state or asynchronous work.

### Traceability

Return a helper checkpoint linked to the parent phase using
`docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md`, with contract
artifacts, consumer impact, unresolved decisions, detected failure, likely
origin and status. Use
`docs/implementation/_templates/phase-evidence.md` for the human-readable
phase record.
