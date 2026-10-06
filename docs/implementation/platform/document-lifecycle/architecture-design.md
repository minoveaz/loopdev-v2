# Platform Document Lifecycle Architecture

| Field | Value |
|---|---|
| Module | Platform Document Lifecycle |
| Run ID | MOD-DOCUMENT-LIFECYCLE-20260926-001 |
| Status | approved-by-request / implementation evidence pending |
| Architecture quality | PASS_WITH_DEBT |

## Boundaries and dependency direction

Document Intelligence owns extraction and lifecycle orchestration. Files owns
permanent binary storage, versions and previews; CRM owns contacts; Timeline
owns cross-module activity. Presentation → application → domain/contracts →
adapters is preserved. The remote adapter is infrastructure only and receives
the shared Supabase client.

| Concern | Owner | Forbidden |
|---|---|---|
| Lifecycle invariants | `lifecycle.ts`, `lifecycle-contracts.ts` | UI transitions |
| Local queue | `lifecycle-local.ts` | Remote assumptions |
| Promotion/storage | `lifecycle-remote.ts` + Files | DI-owned permanent bucket |
| Tenant/RBAC | Supabase RLS and shared auth | Client-only checks |
| Retention/cleanup | Platform migration/worker | Ad-hoc deletes |

## Platform decisions

| Capability | Decision | Evidence |
|---|---|---|
| Files metadata/storage | REUSE | Existing `platform_files` migrations |
| Document Intelligence | MODULE_SPECIFIC | Existing extraction adapter |
| Retention and reconciliation | EXTEND_PLATFORM | `20260929000000...sql` |
| CRM/Communications/Timeline | REUSE | Existing shared contracts and tables |

## Invariants

- Every row carries immutable `organization_id`.
- Promotion copies bytes before deleting temporary storage.
- A contact association is unique per document and scoped by organization.
- Idempotency keys replay the original result.
- Optimistic `version` prevents concurrent association.
- Temporary unassociated documents expire after 30 days.
- Associated documents use policy/default retention and never delete before
  promotion confirmation.

## Refactoring and residual debt

The Phase 1 lifecycle files are preserved and extended only through additive
exports/new modules. Communications UI wiring and a background scheduler remain
follow-up debt; the SQL cleanup/reconciliation functions are ready for the
configured worker. No duplicate Files primitive was introduced.
