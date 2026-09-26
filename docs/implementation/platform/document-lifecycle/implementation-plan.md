# Platform Document Lifecycle Implementation Plan

Run: `MOD-DOCUMENT-LIFECYCLE-20260926-001` · Main issue: `#14` · Track:
`tracks/active/platform/2026-09-13-loopdev-v2-multiplatform-foundation.md`

| Phase | Work | Validation | Status |
|---|---|---|---|
| 00 | Discovery and current-state audit | Matrix/checkpoint | completed |
| 01 | Domain/contracts/RBAC/API/sync design | Type contracts and tests | completed |
| 02 | Local-first association/idempotency | Vitest lifecycle tests | completed |
| 03 | Remote migration/RLS/promotion | Supabase migration + authenticated smoke | in_progress |
| 04 | CRM/Communications/Files integration | Cross-module runtime smoke | pending |
| 05 | Cleanup/reconciliation/retention | SQL function and worker evidence | pending |
| 06 | Verify/review/Git | typecheck, quality, build, review | pending |

## Mandatory audits

- Environment/checkout truth: canonical branch `feature/crm-v2-foundation`.
- Platform reuse: Files, Timeline, shared auth and CRM contacts reused.
- Legacy-flow audit: no configured legacy checkout.
- Security/rollback: RLS, private buckets, optimistic versions, migration
  rollback documented; destructive remote apply requires migration approval.
- Operation parity: desktop/mobile web share the same domain contract; native
  surfaces planned.

## Risks and blockers

Remote Supabase apply and authenticated smoke require the configured project
credentials/runtime and explicit migration gate. No secrets are recorded.
