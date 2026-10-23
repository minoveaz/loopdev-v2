# Phase 03 — Access design

## Identity

| Field | Value |
|---|---|
| Run ID | `MOD-ACCOUNT-20261010-001` |
| Span ID | `MOD-ACCOUNT-20261010-001:03-access` |
| Skill | `access-design` |
| Parent phase | `02-domain` |
| Track | Not created; deferred to `module-plan` |
| Issue(s) | None |
| Status | `completed`; result `partial` because named policy decisions remain open |

## Objective

Define Account role/action rules, user and organization data scopes, sensitive
operations, RLS requirements, audit expectations and authorization tests
without implementing policies or application code.

## Inputs

- `docs/implementation/platform/account/discovery.md`
- `docs/implementation/platform/account/design.md`
- `docs/implementation/platform/account/domain-model.md`
- `docs/implementation/platform/account/delivery-ledger.json`
- `docs/implementation/platform/auth/access-design.md`
- `docs/implementation/platform/notes/access-design.md`
- `supabase/migrations/20260807000000_platform_core_permissions.sql`
- `supabase/migrations/20260915000000_platform_security_hardening.sql`
- `supabase/migrations/20260927110000_settings_management.sql`
- `supabase/tests/database/002_platform_core_rls.sql`

## Actions

- Reconciled approved self-service scope with Platform Auth, membership and
  Billing ownership.
- Preserved the user-approved Owner/Admin-only Billing rule and applied it to
  read and mutation operations for the selected organization.
- Distinguished client route visibility from server authorization and RLS.
- Audited current permission helpers, organization audit events and
  permission-checked Settings functions; recorded missing Account/Billing
  policy evidence and the native role-mapping gap.
- Defined access tests covering all platforms, deep links, tenant switches,
  stale caches, exports, attachments and Document Intelligence references.

## Outputs

- `docs/implementation/platform/account/access-design.md`
- `docs/implementation/platform/account/runs/MOD-ACCOUNT-20261010-001/03-access.json`

## Acceptance criteria

- [x] Role/action matrix distinguishes self-service from organization Billing.
- [x] Scope, membership status, sensitive fields and platform-admin boundary
  are explicit.
- [x] RLS/server requirements do not assume Account or Billing policies exist.
- [x] Security test cases include deep links, stale authorization, cross-org
  data, bulk/export, attachments, Document Intelligence and native/offline.
- [x] Open policy decisions have owners and safe boundaries.

## Validation evidence

| Command or check | Result | Evidence path/link |
|---|---|---|
| Source review | Passed | Current Platform permission, role, audit and Settings migration patterns inspected |
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

- Decisions: the confirmed Owner/Admin-only policy includes Billing reads as
  well as mutations; role and tenant scope must be server-authoritative.
- Detected failure: none. No Account/Billing access implementation or
  Billing-specific permission key was found; this is a baseline gap, not an
  exploitable active path because Account Billing is not implemented.
- Likely origin: `null` — no Account/Billing source was identified.
- Next handoff: `04-api`; define actor binding, tenant-scoped DTOs, forbidden
  behavior and reauthorization at every command.
- State: `partial`.
