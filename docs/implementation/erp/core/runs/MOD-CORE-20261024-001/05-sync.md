# Phase 05 — Products synchronization design

## Identity

| Field | Value |
|---|---|
| Run ID | `MOD-CORE-20261024-001` |
| Span ID | `MOD-CORE-20261024-001:05-sync` |
| Skill | `sync-design` |
| Parent phase | `04-api` |
| Track | ERP Core |
| Issue(s) | #36 |
| Status | `completed` (analysis outcome: `partial`) |

## Objective

Record the current local/remote persistence boundary and define a safe
reconciliation, offline, retry, conflict and migration contract without
implementing storage or backend infrastructure.

## Inputs

- `discovery.md`, `domain-model.md`, `access-model.md` and `api-contracts.md`
- Catalog adapter interface, local stores, Supabase adapter and tests
- `src/lib/localStore.ts` and `src/lib/storage.ts`
- ERP catalog foundation migration
- `docs/03-platform/governance/MULTIPLATFORM_DELIVERY_CONTRACT.md`

## Actions

- Traced adapter selection, local persistence, seed fallback, remote routing
  and remote error behavior.
- Separated business, connectivity, entity-sync and mutation state.
- Defined operation/offline behavior, idempotent retry, conflict/recovery and
  tenant-change rules as proposals.
- Added a staged migration/reconciliation plan that preserves legacy IDs,
  leaves ambiguous product types in draft for review, and requires an approved
  mapping for legacy category references.
- Identified storage and routing risks; kept code and infrastructure unchanged.

## Outputs

- `sync-model.md`
- `runs/MOD-CORE-20261024-001/05-sync.json`

## Acceptance criteria

- [x] Local entities/storage boundaries and current gaps are evidenced.
- [x] Operation matrix distinguishes local/demo, remote and offline behavior.
- [x] Retry, idempotency, conflict, permission-change and tenant-change rules
  are defined or explicitly open.
- [x] Migration, rollback/reconciliation and multiplatform test cases are
  documented.
- [x] No production code, schema, queue or runtime data was changed.

## Validation evidence

| Command or check | Result | Evidence path/link |
|---|---|---|
| `npm run delivery:validate` | passed; 104 checkpoint files checked | CLI output |
| `npm run validate:delivery-ledgers` | passed; 8 ledgers checked | CLI output |
| `npm run validate:multiplatform` | passed | CLI output |
| `npm run test:delivery` | passed; 27 tests | CLI output |
| Python ERP JSON/SVG/Markdown-link check | passed; 9 JSON, 5 SVG, all local links resolve | CLI output |

## Environment

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Branch | `feature/erp-core-capabilities` |
| HEAD | `cb2b35d30c87f7b3d4e42fbfcc1fe9390f624387` |
| Runtime URL | None |
| Runtime port | None |

## Decisions, failures and handoff

- Decisions: `SYNC-ERP-001`–`004`, `007`, `009`, `010` and `012` confirmed;
  `SYNC-ERP-005` and `008` assumed; `SYNC-ERP-006` and `011` open.
- Detected failure: current local storage suppresses read/write failures, and
  the Products domain has no remote mutation queue/version/reconciliation
  contract; no production offline guarantee can be claimed.
- Likely origin: existing catalog adapter and shared `localStore`/`storage`
  implementation.
- Next handoff: `06-plan` only after the open domain, access and API decisions
  and the RLS/permission blockers are resolved.
