# Platform Auth Evidence Matrix

| Capability/operation | Domain parity | Desktop renderer/action | Mobile renderer/action | iOS | Android | Status | Owner | Gap/next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `CAP-AUTH-CORE.getSession` | `contract/test` | `implemented/adapted` | `implemented/adapted` | `planned` | `planned` | `PASS` | Platform Delivery | Verified in `auth-port.test.ts` |
| `CAP-AUTH-CORE.onAuthStateChange` | `contract/test` | `implemented/adapted` | `implemented/adapted` | `planned` | `planned` | `PASS` | Platform Delivery | Verified in `auth-port.test.ts` |
| `CAP-AUTH-CORE.signInWithPassword` | `contract/test` | `implemented/adapted` | `implemented/adapted` | `planned` | `planned` | `PASS` | Platform Delivery | Verified in `auth-port.test.ts` |
| `CAP-AUTH-CORE.signOut` | `contract/test` | `implemented/adapted` | `implemented/adapted` | `planned` | `planned` | `PASS` | Platform Delivery | Verified in `auth-port.test.ts` |
| `CAP-AUTH-CORE.requestPasswordReset` | `contract/test` | `implemented/adapted` | `implemented/adapted` | `planned` | `planned` | `PASS` | Platform Delivery | Verified in `auth-port.test.ts` |
| `CAP-AUTH-CORE.updatePassword` | `contract/test` | `implemented/adapted` | `implemented/adapted` | `planned` | `planned` | `PASS` | Platform Delivery | Verified in `auth-port.test.ts` |
| `CAP-AUTH-CORE.listOrganizations` | `contract/test` | `implemented/adapted` | `implemented/adapted` | `planned` | `planned` | `PASS` | Platform Delivery | Verified in `auth-port.test.ts` |
| `CAP-AUTH-CORE.selectOrganization` | `contract/test` | `implemented/adapted` | `implemented/adapted` | `planned` | `planned` | `PASS` | Platform Delivery | Verified in `auth-port.test.ts` |
| `CAP-AUTH-CORE.listWorkspaces` | `contract/test` | `implemented/adapted` | `implemented/adapted` | `planned` | `planned` | `PASS` | Platform Delivery | Verified in `auth-port.test.ts` |
| `CAP-AUTH-CORE.selectWorkspace` | `contract/test` | `implemented/adapted` | `implemented/adapted` | `planned` | `planned` | `PASS` | Platform Delivery | Verified in `auth-port.test.ts` |
| `CAP-AUTH-CORE.getTenantContext` | `contract/test` | `implemented/adapted` | `implemented/adapted` | `planned` | `planned` | `PASS` | Platform Delivery | Verified in `auth-port.test.ts` |

`PASS` requires verified domain, renderer and operations on every required platform. A shared port, a visible section or a registered route alone does not prove action parity.

## Runtime snapshot

| Field | Value |
| --- | --- |
| Repository path | `/Users/minoveaz/Documents/Proyectos/loopdev-v2` |
| Checkout type | `branch` |
| Branch and HEAD | `feature/crm-v2-foundation` |
| Desktop URL/port | `http://localhost:8080/` |
| Mobile URL/port | `http://localhost:8081/` |
| Validation timestamp | `2026-09-14T17:35:42.000Z` |

## Validation commands

| Command | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `npm run validate:delivery-ledgers` | `PASS` | 0 errors | All 8 auth tasks done with evidence |
| `npm run typecheck` | `PASS` | Exit code 0 | Desktop web + contracts typecheck |
| `cd apps/mobile && npx tsc --noEmit` | `PASS` | Exit code 0 | Mobile typecheck |
| `npm run validate:mobile-boundaries` | `PASS` | 0 violations | Mobile boundary cleanly isolated |
| `npm run test:quality` | `PASS` | 62 passed files, 319 passed tests | Full quality suite pass including auth |
