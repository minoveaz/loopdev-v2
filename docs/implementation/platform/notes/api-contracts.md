# Platform Notes API and Port Contract

## Shared contract boundary

The client-agnostic contract belongs in `packages/contracts/src/notes.ts` and is consumed by desktop and mobile adapters. The existing desktop `NoteEditorDrawer` remains a renderer; it does not become the contract.

## Command/query catalog

| Operation | Input | Output | Retryability |
|---|---|---|---|
| `listNotes` | organization/workspace scope, relation, cursor, limit, visibility filter | page of visible Note DTOs + nextCursor | retryable read |
| `createNote` | mode, document content, preview, visibility, relation refs, idempotencyKey | Note DTO + mutation state | retryable with same key |
| `updateNote` | noteId, patch, expectedVersion, idempotencyKey | Note DTO or conflict | retryable only with same version/key |
| `deleteNote` | noteId, expectedVersion, idempotencyKey | tombstone/result | idempotent retry |
| `applyVisibilityAndPermissions` | noteId, visibility, expectedVersion, idempotencyKey | Note DTO or forbidden/conflict | retryable after auth/version refresh |
| `relateToContact` | noteId, Contact ref, expectedVersion, idempotencyKey | Note DTO or invalid-scope | retryable after scope refresh |

## DTO shape

```ts
type NotesScope = { organizationId: string; workspaceId?: string | null };
type NoteDto = {
  id: string;
  scope: NotesScope;
  authorId: string;
  mode: "quick" | "rich";
  content: TipTapDocument;
  plainTextPreview: string;
  visibility: "private" | "team" | "organization";
  relations: NoteRelationDto[];
  version: number;
  status: "draft" | "pending" | "active" | "conflict" | "deleted";
  permissions: { canRead: boolean; canEdit: boolean; canDelete: boolean };
  createdAt: string;
  updatedAt: string;
};
```

Requests carry `correlationId` and `idempotencyKey`. Timestamps are UTC. DTOs never contain secrets or authorization tokens.

## Pagination/filter/sort

- Default limit 25, maximum 100.
- Cursor is opaque to clients; no offset assumptions.
- Filters: relation, visibility allowed by actor, status excluding tombstones by default.
- Sort: `updatedAt DESC`, stable `id` tie-breaker.
- Direct URL access must resolve scope and authorization before returning data.

## Error catalog

| Code | HTTP/future transport | Retryable | Meaning |
|---|---:|---:|---|
| `NOTES_FORBIDDEN` | 403 | no | actor cannot see or mutate resource |
| `NOTES_NOT_FOUND` | 404 | no | resource absent within authorized scope |
| `NOTES_VALIDATION` | 422 | no | empty content, unsupported document or invalid relation |
| `NOTES_INVALID_SCOPE` | 422 | no | relation/tenant/workspace mismatch |
| `NOTES_CONFLICT` | 409 | after resolution | expected version is stale |
| `NOTES_IDEMPOTENCY_REPLAY` | 409/200 | no | same key with incompatible payload |
| `NOTES_OFFLINE_PENDING` | client state | yes | accepted locally but not server-confirmed |
| `NOTES_NETWORK` | client/5xx | yes | transport unavailable |
| `NOTES_RATE_LIMITED` | 429 | yes/backoff | retry-after applies |

## Events and consumers

Events are versioned, have correlation/idempotency metadata and are emitted only after accepted mutation semantics. Consumers are Customer 360, CRM, Activity/audit and future sync reconciliation. Duplicate events are ignored by event id or mutation key.

## Client impact

| Client | Contract consumption | Adaptation |
|---|---|---|
| Desktop web | adapter wraps existing Platform work/local behavior and existing drawer callbacks | no desktop renderer change |
| Mobile web | mobile adapter and list/editor consume same DTOs/outcomes | touch layout and TipTap editor composition |
| iOS/Android | planned adapter | native storage/bridge may differ; semantic IDs remain stable |

## Open API decisions

- Exact transport path and envelope follow Platform API standards in a future backend phase.
- TipTap schema version negotiation and attachment DTO extension require sync/API implementation decisions.

**State:** complete with transport follow-ups.
