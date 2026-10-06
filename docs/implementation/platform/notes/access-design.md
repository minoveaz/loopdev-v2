# Platform Notes Access Design

## Scope model

- `organizationId` is mandatory and is authoritative for tenant isolation.
- `workspaceId` is optional but, when present, filters visibility within the organization.
- Relations cannot cross organization scope.
- Client visibility is advisory; server/future API and local adapter enforce the decision.

## Role/action matrix

| Actor/role | list/read | create | update own | update others | delete own | delete others | change visibility | audit/export |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Member | visible scope | yes if `notes.create` | yes if `notes.update` | no | yes if `notes.delete` | no | only within allowed visibility | audit generated; no bulk export |
| Team lead | visible team/workspace | yes | yes | team notes if assigned scope | yes | team notes if policy allows | team visibility and narrower | audit read |
| Organization admin | organization scope | yes | yes | yes within organization | yes | yes within organization | private/team/organization | audit read/export by policy |
| Suspended member | no | no | no | no | no | no | no | no |
| Unauthenticated/cross-tenant actor | no | no | no | no | no | no | no | no |

## Permission rules

| Rule | Status | Enforcement |
|---|---|---|
| Private note is visible to author and explicitly authorized owner/admin | confirmed | NotesPort result + server/RLS policy |
| Team note is visible only to members in same workspace/team scope | confirmed | scope resolver and policy check |
| Organization note is visible to authorized organization members | confirmed | tenant policy |
| Edit/delete requires action permission and record visibility | confirmed | mutation recheck, not UI only |
| Direct Customer 360 deep link rechecks Contact and Note access | confirmed | route loader/adapter/API |
| Cached note is removed or marked forbidden after permission loss | confirmed | cache invalidation on context/permission change |
| Offline mutation is rejected or requeued after membership suspension | confirmed | sync revalidation |
| Attachments inherit note visibility and relation scope | assumed | Platform attachment policy; verify in API phase |

## Audit requirements

Every create, update, delete, visibility change, forbidden mutation and cross-tenant denial records actor, organization, workspace, action, note id, relation, outcome, timestamp, correlation id and client origin. Audit entries are append-only and are not exposed as editable Note content.

## Security test cases

1. User from organization B cannot list, read, update or delete organization A notes.
2. Direct Customer 360 URL with an unauthorized Contact returns forbidden without note metadata.
3. A private note is absent from list results for another member.
4. A stale cached note disappears after role/membership revocation.
5. Team lead cannot widen a private note to organization visibility without permission.
6. Delete and visibility mutations reject stale version and unauthorized actor.
7. Offline queued mutation is rechecked after tenant switch, logout or suspension.
8. Note attachment and future export inherit note scope and permission.
9. Bulk operations, if introduced, require explicit permission and per-record checks.
10. iOS/Android permission prompts must reflect the same semantic denial, not grant access.

## Open decisions

- Exact permission key names should align with the shared Platform permission registry.
- Organization admin export and restore retention require Platform governance confirmation.

**State:** complete with two policy follow-ups.
