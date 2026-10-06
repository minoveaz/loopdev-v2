# Platform evidence matrix

| Capability/operation | Domain parity | Desktop renderer/action | Mobile renderer/action | iOS | Android | Status | Owner | Gap/next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Contracts, lifecycle events and errors | `lifecycle-contracts.ts`; lifecycle tests | Implemented; unit-tested | N/A — shared domain contract | N/A | N/A | PASS | Document Intelligence | Add authenticated contract coverage if required by release review |
| Local-first association and idempotency | `lifecycle-local.ts`; local lifecycle tests | Implemented; unit-tested | N/A — shared local store | N/A | N/A | PARTIAL | Document Intelligence | Add runtime offline queue evidence |
| Remote promotion to Files and contact relation | `lifecycle-remote.ts`; migration; authenticated smoke test via `npm run smoke:document-lifecycle-authenticated --silent` | Implemented and verified against Supabase | Reuses `platform_files` metadata contract | N/A | N/A | PASS | Platform/Files | Scheduled worker evidence remains |
| Retention configuration and cleanup | `retention.ts`; settings route; migration function; authenticated smoke | Policy UI and remote cleanup implemented | N/A | N/A | N/A | PARTIAL | Platform | Verify scheduled worker invocation |
| Communications launch integration | `Communications.tsx`; shared drawer; promotion command | Real attachment record now carries lifecycle metadata and promotes on contact apply | N/A | N/A | N/A | PARTIAL | Communications | Add authenticated UI journey evidence |

`PASS` requires verified domain, renderer and operations on every required
platform. A shared port, a visible section or a registered route alone does not
prove action parity.

## Runtime snapshot

| Field | Value |
| --- | --- |
| Repository path | `/Users/minoveaz/Documents/Proyectos/loopdev-v2` |
| Checkout type | `branch` |
| Branch and HEAD | `feature/crm-v2-foundation @ 2f45278` |
| Desktop URL/port | Not started |
| Mobile URL/port | Not started |
| Validation timestamp | `2026-09-26` |

## Validation commands

| Command | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `npm test -- --run src/test/document-intelligence/lifecycle.test.ts src/test/document-intelligence/lifecycle-local.test.ts` | PASS | local output | 6 tests passed |
| `npm run typecheck` | PASS | local output | App and Node projects pass |
| `npm run lint` | PASS | local output | ESLint pass |
| `npm run build` | PASS | local output | Production build pass |
| `npm run test:quality` | PASS | local output | 70 files, 367 tests passed |
| `npx supabase link --project-ref sukjcsylkljiyvfklxvj` | PASS | linked project | Remote project linked |
| `supabase db push` | PASS | migration applied remotely | `20260929000000_document_lifecycle_platform_promotion.sql` |
| `npm run smoke:document-lifecycle-authenticated --silent` | PASS | `idempotentReplay: true`, `fileId` created, `cleanupResult: 0`, `crossTenantIsolation: true` | Temporary upload, promotion, association, replay, cleanup and tenant isolation verified |
| `npm run build --silent` | PASS | production bundle generated | Includes Communications and retention settings changes |
| `npm run test:quality --silent` | PASS | quality suite completed | Full application suite |
