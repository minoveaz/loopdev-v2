# Phase 03 — Access design

| Field | Value |
|---|---|
| Run | `MOD-CRM-PIPELINE-20260913-002` |
| Span | `MOD-CRM-PIPELINE-20260913-002:03-access` |
| Parent | `MOD-CRM-PIPELINE-20260913-002:01-design` |
| Status | `completed` |

## Role/action/scope matrix

| Role | Read scope | Mutations | Sensitive/privileged rules |
|---|---|---|---|
| Sales agent | Authorized tenant + workspace records assigned to self or permitted team | Create manual, edit allowed fields, move authorized open stages, create shared Note/Task | No cross-tenant deep links; no terminal reopen or unauthorized reassignment |
| Manager | Authorized tenant/workspace team scope | Agent actions plus reassignment, terminal reopen with reason, conflict resolution | Team membership and workspace scope rechecked server-side |
| CRM admin | Workspace configuration plus authorized records | Configure stage labels/order/active/default | Cannot alter stable IDs or bypass record scope |
| Superdev | Explicit support scope and purpose | Diagnostic access only unless separately delegated | Privileged access, redacted logs and audit trail required |

No viewer role is introduced for the pilot. Every query and command enforces organization/tenant and workspace scope; brand remains non-independent CRM data.

## Assignment, RLS and sensitive data

- RLS predicates apply per verb to Opportunity, Stage, Contact and Lead references; all referenced records must share tenant/workspace.
- Cached/read-model records must be rechecked on direct URL, mutation, background sync, export and bulk action.
- Contact identifiers, commercial amount, notes and activity are confidential; ordinary errors and telemetry exclude unnecessary PII.
- Shared Notes, Tasks, Files, Relations and Document Intelligence policies are reused; Pipeline defines no parallel policy.
- Assignment changes require manager/admin capability and audit actor, before/after owner and reason where applicable.

## Audit events

Record create, update, stage move, reopen, assignment, lead conversion, export, forbidden attempt, conflict and restore with actor, tenant/workspace, request ID, origin, previous/new values (redacted where sensitive), version and timestamp.

## Security test cases

1. Direct URL and stale cached card from another tenant/workspace return `FORBIDDEN`/not found without data leakage.
2. Agent cannot move terminal stage, reopen, reassign outside team, or configure stages; manager can only within team scope.
3. Cross-tenant Contact/Lead/product/stage references are rejected atomically.
4. Permission revocation between read and sync prevents queued mutation and removes stale action affordance.
5. Bulk move/export validates each record scope and emits audit; partial failure is explicit.
6. Attachments, Notes, Tasks and Document Intelligence results follow shared relation and permission checks.

## Open decisions

- `open`: exact policy names/claims and whether managers may restore archived records.
- `assumed`: tenant/workspace membership is the existing CRM policy source; no new authorization model.

## Handoff

Complete; API contracts must expose these scopes and errors without relying on UI checks.
