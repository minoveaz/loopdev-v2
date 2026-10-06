# CRM Overview Access, RBAC and RLS

Run `MOD-CRM-20260927-001` · phase `04-access`. This is an authorization
contract; UI checks are advisory and never the security boundary.

## Scope model

Every request resolves `tenantId → organizationId → workspaceId/brandId →
membership → role/team/assignment → record policy`. Workspace and brand must
belong to the organization. Team and owner filters only narrow the caller's
visible set; selected-team aggregates include only records visible under RLS
and active membership, with no cross-team data. A missing or revoked membership
yields a neutral forbidden/not
found response and purges cached projections and queued writes for that scope.

## Role and action matrix

| Action | Admin | Manager | Member/User | Read-only |
|---|---|---|---|---|
| Read own dashboard | confirmed | confirmed | confirmed | confirmed |
| Read organization aggregate | confirmed | assumed (policy scope) | no unless granted | no unless granted |
| Read team aggregate | confirmed | confirmed for managed teams | confirmed for assigned teams | granted scope only |
| Open linked CRM record | all org scope | team/assigned scope | assigned/team scope | read scope |
| Read task summary | confirmed | confirmed | assigned/visible | read scope |
| Transition task inline | confirmed via Tasks | confirmed via Tasks | assigned + task capability | denied |
| Read business activity | org/team/assigned scope | team/assigned | assigned/team | read scope |
| Export | denied in MVP | denied in MVP | denied in MVP | denied in MVP |
| Archive/delete/restore Overview data | not applicable | not applicable | not applicable | not applicable |

`admin`, `manager`, `member` and `read_only` map to existing Platform
membership/capability policies; Overview must not invent roles. Task mutation
and audit remain Platform Tasks-owned. Notes, Files, Relations and Document
Intelligence use their existing policies when reached from detail routes.

## Sensitive data and RLS

RLS predicates must enforce tenant and organization equality, active
membership, optional descendant scope, and the applicable aggregate/record
capability. Aggregates must not leak hidden row counts, names, contact data or
financial values. A partial response may omit fields but cannot signal omitted
records. Server-side queries re-check scope after every organization switch
and before returning a cache hit. No policy relies on `organizationId` from
the URL alone.

Required policy properties:

- no cross-tenant or cross-organization joins;
- no workspace/brand escape through nullable filters;
- revoked membership invalidates snapshot and queued task writes;
- direct deep links return the same neutral response for unknown and
  unauthorized IDs;
- background projection jobs execute under service identity with explicit
  tenant scope and cannot broaden a user's cache.

## Audit

Read access is telemetry/audit according to Platform policy; exports and task
transitions are auditable events containing actor, tenant, organization,
scope hash, target operation, result and correlation ID. Do not log raw
payloads, hidden record identifiers or sensitive metric values. Overview does
not create a second audit log.

## Security test cases

| Case | Expected |
|---|---|
| Cross-tenant organization ID | 403/404 neutral; no data or timing-revealing detail |
| Workspace/brand from another organization | rejected before query |
| Manager queries unowned team | filter rejected or empty by policy, never widened |
| Deep link to hidden task/activity/CRM record | neutral forbidden/not found |
| Cache hit after membership revocation | purge and deny; no stale values |
| Queued task transition after revocation | cancel/reject and audit |
| Read-only attempts transition/export | denied server-side |
| Partial sensitive aggregate | permitted fields only; no hidden-row inference |
| Attachments/Notes/Document Intelligence link | shared capability rechecks entity scope |
| Organization switch during concurrent request | response bound to original authorized scope |

Open decisions: exact implementation of the already-confirmed RLS team
aggregate policy and native iOS/Android ownership. Current source evidence includes a remote
Notes permission failure and partial analytics/RLS readiness; no runtime
security readiness is claimed.

**State: complete with open policy decisions.** Handoff: `05-sync`.
