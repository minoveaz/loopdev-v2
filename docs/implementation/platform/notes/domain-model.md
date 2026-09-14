# Platform Notes Domain Model

## Scope and decisions

This model unifies the existing `GlobalNoteRecord` and Platform `NoteRecord` behind one neutral semantic model. Existing desktop storage remains an adapter concern; this document defines behavior, not a migration of the desktop drawer.

## Entities

| Entity | Required fields | Scope/owner | Source of truth | Local fixture | Remote identity | Delete/restore |
|---|---|---|---|---|---|---|
| Note | id, organizationId, workspaceId?, authorId, mode, content, plainTextPreview, visibility, relation refs, version, status, createdAt, updatedAt | Organization + optional workspace; author and permission snapshot | NotesPort result | deterministic local note fixture | stable note id | soft delete/tombstone; restore only before retention expiry and with permission |
| NoteRelation | entityType, entityId, label, organizationId | Same organization as note | Note relation collection | Contact fixture | entity reference | detached on explicit update; relation deletion does not delete note |
| NoteMention | userId, displayName | Organization membership | Note content projection | workspace user fixture | stable user id | removed when content changes |
| NoteAuditEntry | noteId, action, actorId, scope, outcome, timestamp, correlationId | Append-only organization audit | Audit/Activity capability | test event sink | correlation id | never edited; retention policy applies |
| NoteSyncMetadata | localRevision, serverVersion, mutationId, syncState | Local adapter | Sync adapter | local storage fixture | server version | removed with tombstone after reconciliation |

## Content model

- `mode` is `quick` or `rich`.
- `quick` serializes plain text into the shared document envelope and leaves mentions/marks empty.
- `rich` stores TipTap-compatible JSON, a plain-text preview and extracted mentions.
- Renderers may group or adapt controls, but must preserve the document meaning and operation IDs.

## Lifecycle

| State | Entry | Allowed exits | Actor/trigger | Invariant/event |
|---|---|---|---|---|
| draft | Editor starts or local draft restored | pending, active, discarded | current user/editor | no server/audit claim until mutation accepted |
| pending | Authorized mutation queued offline or awaiting adapter | active, conflict, failed, cancelled | adapter/sync | mutation id is durable and visible |
| active | Create/update accepted at current version | active, pending, conflict, deleted | NotesPort | content non-empty, scope valid, version increments |
| conflict | Expected version rejected or reconciliation detects divergent content | active, pending, cancelled | adapter/sync + user | neither version is silently discarded |
| failed | Terminal transport/validation result not queued | draft, pending, cancelled | adapter | stable error code; no false success |
| deleted | Authorized delete/tombstone accepted | restored only by explicit policy | authorized actor | list excludes by default; audit event emitted |
| cancelled | User cancels draft or queued mutation | draft only via new editor | current user | no persisted active note |

## Commands and invariants

- `listNotes`: returns only notes visible in the requested organization/workspace and relation scope.
- `createNote`: requires a non-empty plain-text projection, valid relation scope, supported mode and create permission.
- `updateNote`: requires note id, editable permission and expected version; increments version atomically.
- `deleteNote`: requires delete permission, expected version where remote, and is idempotent for an existing tombstone.
- `applyVisibilityAndPermissions`: visibility changes are validated as a mutation; clients cannot grant access beyond actor scope.
- `relateToContact`: Contact relation must belong to the same organization; cross-tenant relation is rejected.
- Every accepted mutation records actor, organization, action, correlation/mutation id and resulting version.
- A note cannot be visible through a cached relation after the actor loses permission; adapters must invalidate it.

## Domain events

| Event | Payload | Consumers | Idempotency |
|---|---|---|---|
| `note.created.v1` | note id, scope, relation, author, visibility, version, mutationId | Customer 360, CRM, Activity/audit | mutationId |
| `note.updated.v1` | note id, changed fields, previous/new version, actor, mutationId | Customer 360, CRM, Activity/audit | note id + new version |
| `note.deleted.v1` | note id, scope, relation, actor, tombstone version, mutationId | Customer 360, CRM, Activity/audit | note id + tombstone version |
| `note.conflict.v1` | note id, local version, server version, actor, mutationId | sync UI and recovery | mutationId |

## Open decisions and risks

- Rich TipTap schema version and native iOS/Android renderer remain follow-up decisions.
- Restore policy and retention period require Platform policy confirmation.
- Existing Global and Platform records need an explicit migration mapping during build; no silent field loss is allowed.

**State:** complete with documented follow-up decisions.
