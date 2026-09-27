# CRM Overview Domain Model

Run `MOD-CRM-20260927-001` · phase `02-domain` · status `complete` with
open decisions recorded below. The Overview is a read-model consumer; it owns
no CRM entity and must not duplicate Tasks, Activity, Analytics, Notes, Files
or Document Intelligence state.

## Entity and projection contract

| Projection | Authority/source of truth | Required fields | Identity/version |
|---|---|---|---|
| `KpiMetric` | Platform Analytics, sourced from CRM entities | `metricId`, `scope`, `period`, `value`, `unit`, `generatedAt`, `freshUntil`, `sourceVersion`, `permissionSnapshot` | `(scopeHash, metricId, period, sourceVersion)` |
| `PipelineHealth` | CRM Opportunities/Stages via Analytics breakdown | `stageCode`, `label`, `count`, `value`, `currency`, `health`, `generatedAt`, `sourceVersion` | stage code is stable within an organization |
| `TaskSummary` | Platform Tasks | `taskId`, `title`, `status`, `dueAt`, `ownerId`, `relation`, `version`, `permissionSnapshot` | task UUID + optimistic `version` |
| `ActivitySummary` | Platform Activity business-event read model | `activityId`, `type`, `sourceType`, `sourceId`, `occurredAt`, `actorId`, `summary`, `relation` | dedupe key `(sourceType, sourceId)` |

For every projection, `organizationId` is mandatory; workspace and brand are
optional descendants of the organization. Team aggregates include only records
visible to the selected team under RLS and active membership; cross-team rows
are never included. Local fixtures use deterministic
IDs only in the local adapter and tests. Remote identity is UUID-based and
must never be inferred from a fixture ID. No Overview archive, delete or
restore command exists. Source records retain their own lifecycle and audit
history.

## Relationships and ownership

- One organization has many workspaces/brands, and every projection belongs to
  exactly one organization.
- A pipeline stage belongs to one organization and has many opportunities;
  stage labels are reference data, not client-owned strings.
- A task or activity may reference one CRM entity through an opaque
  `EntityRef`; the target route rechecks authorization.
- A metric may aggregate many source records but does not expose source rows
  unless the caller separately has record access.
- Notes, Files, Relations and Document Intelligence are contextual capabilities
  on authorized detail routes. They are not Overview children.

## Lifecycle and invariants

The panel state machine is presentation state, not domain state:
`loading → success|empty|partial|error|forbidden`; `success → stale|offline`;
`stale|offline|error → loading`. A forbidden result is terminal until scope or
membership changes.

Confirmed invariants:

1. Scope is an intersection of tenant, organization, optional workspace/brand,
   membership and record policy; client filters cannot widen it.
2. A response cannot be labelled fresh unless `generatedAt <= now < freshUntil`
   and its permission snapshot matches the active scope hash.
3. Missing data is `empty`, not a fabricated zero; zero is valid only when the
   metric contract declares a zero-capable aggregate.
4. Activity is business-only and deduplicated by `(sourceType, sourceId)`;
   extraction/system telemetry is excluded unless the taxonomy is explicitly
   changed.
5. Overview exposes no task transition. Task transitions remain Platform Tasks
   commands; the summary is read-only and links to the Tasks module.
6. A cached snapshot or queued task write is invalidated on tenant,
   organization, workspace, brand or membership-scope change.

Confirmed product decisions: the KPI set is open pipeline, open leads, open
opportunities and overdue/today tasks; freshness target is 60 seconds with a
maximum acceptable age of 5 minutes; selected-team aggregates are restricted to
records visible under RLS/membership; activity is allowlisted to calls, emails,
meetings, notes, tasks, assignments, stage changes, conversions and closures,
excluding Document Intelligence extraction and technical events by default.

## Commands and events

Overview exposes only idempotent queries: `GetKpis`, `GetPipelineHealth`,
`GetTaskSummary`, `GetActivitySummary`, and `RefreshOverview` (a cache
invalidation/request action, not a domain mutation). Source modules own:

- `OpportunityCreated|Updated|StageChanged`
- `TaskCreated|Updated|Completed|Reopened`
- `BusinessActivityRecorded`
- `MembershipScopeChanged`

Analytics may consume CRM source events and publish
`AnalyticsProjectionUpdated { metricId, scope, period, sourceVersion,
generatedAt }`. Activity publishes only allowlisted business events.
Overview consumes these events or revalidates on query; it does not emit a
second timeline event.

## Archive, delete, restore and retention

The dashboard retains no records. Source retention, soft delete, restore and
audit policy remains authoritative in CRM, Tasks and Activity. Deleted or
revoked source references disappear from subsequent authorized projections;
stale cache must be purged rather than showing tombstones or names.

## Risks and handoff

Remote Analytics/RLS is only partially evidenced in the current dirty checkout;
Notes has a remote permission failure and Timeline extraction filtering remains
unproven. These are integration evidence gaps, not domain permission to widen
scope. Architecture quality remains `PASS_WITH_DEBT`.

**State: complete.** Handoff: `03-api` (the requested gate order places API
before access; access remains a prerequisite for implementation and release).
