# Platform Document Lifecycle Requirement Evidence

| Requirement | Evidence | Status | Gap/next action |
|---|---|---|---|
| 30-day temporary retention | `lifecycle.ts`, cleanup SQL, authenticated lifecycle smoke | PASS | Scheduled worker invocation remains to be evidenced |
| 365-day associated default/config | `lifecycle.ts`, retention policy SQL, `DocumentRetention.tsx` | PASS_WITH_DEBT | Authenticated admin UI journey |
| New/existing CRM association | Composite FK and association contract; authenticated lifecycle smoke | PASS | CRM journey evidence |
| Promotion to Files | `lifecycle-remote.ts`, `platform_files` metadata, authenticated lifecycle smoke | PASS | Scheduled worker evidence |
| Idempotency/concurrency | local tests, operation table, version check, authenticated replay smoke | PASS | Concurrent race probe |
| Tenant isolation/RBAC | RLS policies and shared auth; cross-tenant smoke | PASS | Browser permission journey |
| Communications launch | shared drawer, lifecycle metadata and promotion command in `Communications.tsx` | PARTIAL | Authenticated UI journey with a real attachment |
| Timeline/Files surfaces | shared primitives documented | PARTIAL | Runtime screenshot/journey |
| Cleanup/reconciliation | SQL functions and authenticated cleanup smoke | PASS | Scheduled worker invocation evidence |

## Release blockers

- Communications UI invocation has been implemented but is not yet evidenced with a real authenticated browser journey.
- Cross-tenant isolation and scheduled worker invocation remain release-review
  evidence gaps.

## Known deviations

- Native iOS/Android surfaces are planned, not implemented in this web branch.
