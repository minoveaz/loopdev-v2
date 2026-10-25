# Phase 04 — Products API contracts

## Identity

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:04-api` |
| Skill | `api-contracts` |
| Parent phase | `03-access` |
| Track | ERP Core |
| Issue(s) | #36 |
| Status | `completed` (analysis outcome: `partial`) |

## Objective

Define logical Products/category commands, queries, DTO boundaries, errors,
pagination, concurrency and event semantics for future local and remote
adapters, preserving approved product intent and legacy consumer compatibility.

## Inputs

- `discovery.md`, `design.md`, `domain-model.md` and `access-model.md`
- `delivery-ledger.json` and approved visual category-management source
- `CatalogAdapter`, catalog types, local/Supabase adapters and adapter tests
- ERP catalog migration and shared Platform `EntityRef` conventions
- `docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md`

## Actions

- Defined client-agnostic logical query/command contracts without selecting
  transport routes or infrastructure.
- Specified request/response fields, scope authority and validation boundaries.
- Documented terminal/retryable errors, pagination, idempotency, version
  conflicts, transaction boundaries and observability.
- Preserved legacy `catalog_item` references and surfaced adapter/schema
  mismatches as decisions rather than silently normalizing them.
- Recorded proposed product/category events and consumer/platform impact.

## Outputs

- `api-contracts.md`
- `runs/MOD-CORE-20261024-001/04-api.json`

## Acceptance criteria

- [x] Commands, queries, DTO boundaries and error semantics are documented.
- [x] Pagination, idempotency, versioning and transaction boundaries are
  explicit or marked open.
- [x] Events, consumers, retries, authorization and multiplatform behavior are
  covered.
- [x] Legacy contracts, scope blockers and unresolved domain/access decisions
  remain explicit.
- [x] No endpoint, event bus, database schema or production code was changed.

## Validation evidence

| Command or check | Result | Evidence path/link |
|---|---|---|
| `npm run delivery:validate` | passed; 103 checkpoint files checked | CLI output |
| `npm run validate:delivery-ledgers` | passed; 8 ledgers checked | CLI output |
| `npm run validate:multiplatform` | passed | CLI output |
| `npm run test:delivery` | passed; 27 tests | CLI output |
| Python ERP JSON/SVG/Markdown-link check | passed; 8 JSON, 5 SVG, all local links resolve | CLI output |

## Environment

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Branch | `feature/erp-core-capabilities` |
| HEAD | `cb2b35d30c87f7b3d4e42fbfcc1fe9390f624387` |
| Runtime URL | None |
| Runtime port | None |

## Decisions, failures and handoff

- Decisions: `API-ERP-001`, `002`, `006`, `008`, `009` and `010` confirmed;
  `API-ERP-003`, `004`, `005` and `007` assumed; `API-ERP-011` open.
- Detected failure: None new; the RLS and permission-key gaps from
  `03-access` remain release blockers.
- Likely origin: Not applicable to this phase.
- Next handoff: `05-sync`; do not implement endpoints or events until scope,
  legacy mapping, concurrency/audit and access blockers are resolved.
