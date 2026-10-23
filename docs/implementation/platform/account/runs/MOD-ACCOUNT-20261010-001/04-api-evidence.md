# Phase 04 — API contracts

## Identity

| Field | Value |
|---|---|
| Run ID | `MOD-ACCOUNT-20261010-001` |
| Span ID | `MOD-ACCOUNT-20261010-001:04-api` |
| Skill | `api-contracts` |
| Parent phase | `03-access` |
| Track | Not created; deferred to `module-plan` |
| Issue(s) | None |
| Status | `completed`; result `partial` because Auth/Billing/provider decisions remain open |

## Objective

Define client-agnostic commands, queries, DTO semantics, errors, pagination,
consistency and events for current local adapters and a future remote backend.

## Inputs

- `docs/implementation/platform/account/discovery.md`
- `docs/implementation/platform/account/design.md`
- `docs/implementation/platform/account/domain-model.md`
- `docs/implementation/platform/account/access-design.md`
- `packages/contracts/src/auth-port.ts`
- `packages/contracts/src/index.ts`
- `src/loopdev/domains/platform/adapter/auth-supabase.ts`
- `src/loopdev/domains/settings/types.ts`
- `docs/implementation/platform/auth/api-contracts.md`
- `docs/implementation/platform/notes/api-contracts.md`

## Actions

- Compared approved Account operations with current AuthPort, PlatformUser,
  Auth adapter, Settings contract and API patterns.
- Defined proposed Auth/Profile extension semantics without adding transport
  paths or provider implementation.
- Specified user/organization subject binding, DTO field allowlists, semantic
  errors, pagination, idempotency and concurrency boundaries.
- Recorded provider-neutral Billing queries/commands, event semantics,
  webhook responsibilities and all client impacts.

## Outputs

- `docs/implementation/platform/account/api-contracts.md`
- `docs/implementation/platform/account/runs/MOD-ACCOUNT-20261010-001/04-api.json`

## Acceptance criteria

- [x] Every discovery capability has corresponding commands/queries or an
  explicit missing/provider-dependent decision.
- [x] DTOs exclude secrets and bind identity/organization scope to trusted
  context.
- [x] Errors, retryability, idempotency, version conflicts and pagination are
  explicit.
- [x] Events, webhook verification/replay and downstream consumers are
  identified.
- [x] Desktop web, mobile web, iOS and Android consume the same semantic
  contract.
- [x] No endpoint or production API code was added.

## Validation evidence

| Command or check | Result | Evidence path/link |
|---|---|---|
| Contract source review | Passed | `AuthPort`, Supabase adapter, shared contracts, Auth/Notes API designs inspected |
| Traceability validators | Pending | Run after checkpoint artifacts are updated |

## Environment

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Branch | `feature/platform-account-pages` |
| HEAD | `af5e511506339ef1f96e85e9248fe0feee427516` |
| Runtime URL | Not started |
| Runtime port | Not started |

## Decisions, failures and handoff

- Decisions: `PlatformUser.fullName/avatarUrl` remain canonical; Profile
  updates use a shared Auth/Profile operation; Billing requests bind to a
  server-authorized active organization.
- Detected failure: no Account Preferences, Profile update, Security extension
  or Billing contract exists; these are documented capability gaps, not
  claims of working APIs.
- Likely origin: `null` — this analysis identifies absent capabilities; no
  Account API implementation was in scope.
- Next handoff: `05-sync`; define offline eligibility, local persistence,
  conflict/retry policy and provider reconciliation using these operation
  semantics.
- State: `partial`.
