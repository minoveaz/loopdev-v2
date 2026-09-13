---
name: access-design
description: Define RBAC, tenant visibility, audit and security rules for a LoopDev module.
user-invocable: false
---

# LoopDev Access Design Helper

Define who can see and mutate module data without implementing application code.

## Cover

- Roles and action matrix.
- Organization, workspace, team and record scope.
- Assignment and delegation rules.
- Sensitive fields and actions.
- RLS requirements.
- Audit events.
- Export, archive, delete and restore permissions.
- Tenant isolation and privilege-escalation corner cases.
- Permission inheritance and policy reuse for shared Platform capabilities.

Return a permission matrix, rules, test cases and open decisions.

## Common Contract

### Input context

- module and domain model;
- `module-discovery` artifact and actor/outcome matrix;
- organization, workspace, team and tenant assumptions;
- existing auth and policy patterns.

### Decision status

Mark each permission rule as `confirmed`, `assumed` or `open`. Distinguish
action permissions from record scopes and sensitive-field policies.

### Output handoff

Return:

- role/action/scope matrix;
- assignment and delegation rules;
- RLS and tenant-isolation requirements;
- audit requirements;
- permission and escalation test cases;
- risks and open decisions;
- state `complete`, `partial` or `blocked`.

### Action boundaries

This helper defines authorization semantics only. It does not implement
policies, choose identity infrastructure or modify code.

Shared capabilities must reuse their established permission and audit
contracts. Define only module-specific conditions, scopes or sensitive fields;
do not create a parallel authorization model for Notes, Files, Tasks or
Document Intelligence.

Use discovery to verify that every expected actor, outcome and sensitive
operation is represented. If the existing implementation exposes less or more
access than discovery expects, record the gap rather than treating the UI as
the authorization policy.

Include tests for deep-link access, stale cached data after permission
changes, cross-organization records, bulk actions, exports, attachments and
Document Intelligence results. Permissions must be enforced outside the UI
and rechecked during synchronization or background processing.

### Traceability

Return a helper checkpoint linked to the parent phase using
`docs/03-platform/MODULE_DEVELOPMENT_TRACEABILITY.md`, with the permission
matrix, security test cases, unresolved decisions, detected failure, likely
origin and status. Use
`docs/implementation/_templates/phase-evidence.md` for the human-readable
phase record.
