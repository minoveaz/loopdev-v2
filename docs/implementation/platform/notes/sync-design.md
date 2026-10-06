# Platform Notes Sync Design

## Storage boundaries

- The Notes application owns semantic state; desktop and mobile adapters own storage mechanics.
- Local records are partitioned by organization, workspace and authenticated user context.
- A local draft may exist before a Note mutation; it is not an active server note until accepted.
- Rich content is stored as TipTap-compatible JSON plus plain-text preview so list rendering does not require the editor runtime.

## Operation matrix

| Operation | Online | Offline read | Offline write | Mutation state | Reconciliation |
|---|---|---|---|---|---|
| listNotes | fetch/cache | cached visible notes with `offline` label | n/a | fresh/stale | replace by server cursor/version |
| createNote | apply immediately | n/a | queue with `pending` state | pending/active/failed | idempotency key creates or returns same note |
| updateNote | expected-version mutation | edit local draft only | queue patch with base version | pending/conflict | server version check |
| deleteNote | tombstone mutation | show cached note but disable delete if permission unknown | queue idempotent tombstone | pending/deleted/conflict | tombstone wins only after authorization |
| visibility/relation change | expected-version mutation | edit local draft only | queue with scope snapshot | pending/conflict/forbidden | recheck scope and permissions |

## Mutation queue

Each queued mutation includes `mutationId`, operation, note id, organization/workspace scope, authenticated actor, base version, serialized payload hash, createdAt and retry count. The queue is ordered per note, deduplicates identical mutation IDs and never crosses tenant context.

## Retry and recovery

- Network failures use bounded exponential backoff with jitter.
- Validation, forbidden, invalid-scope and incompatible idempotency errors are terminal and shown to the user.
- Reload restores drafts and pending queue before rendering success.
- Logout, tenant switch or membership suspension pauses and revalidates the queue; unauthorized items become `forbidden`, not silently retried.
- Reinstall/native storage loss is treated as local draft loss unless the mutation was already server-confirmed.
- Rich TipTap documents retain the original JSON payload through retry; preview is regenerated only when content changes.

## Conflict policy

1. Server rejects stale `expectedVersion` with `NOTES_CONFLICT`.
2. The local note enters `conflict` and preserves local JSON, server JSON/version and a human-readable preview.
3. Renderer offers `Reload server version`, `Keep local draft and retry` or `Cancel local change`.
4. No automatic last-write-wins for rich content.
5. After resolution, a new mutation id and current expected version are required.

## Permission and tenant changes

Before sending every queued mutation, recheck organization/workspace membership and the specific action permission. On context change, clear visible records from the previous tenant and retain only explicitly recoverable local drafts tagged to that tenant.

## Migration plan

1. Existing desktop/local Global Notes and Platform Notes are read through compatibility adapters.
2. Map fields into neutral Note DTO without dropping rich JSON, visibility, relation or version metadata.
3. Seed deterministic migration fixtures and compare list/create/update/delete outcomes.
4. Enable remote adapter behind a feature flag after local parity tests pass.
5. Roll back by disabling remote writes while preserving read cache and explicit pending/error states.

## Sync evidence tests

- reload with pending create preserves draft and mutation id;
- retry does not duplicate a note;
- stale update enters conflict and preserves both documents;
- tenant switch prevents cross-tenant queue execution;
- permission revocation turns pending mutation into forbidden;
- offline rich draft restores TipTap JSON and plain-text preview;
- delete retry is idempotent;
- server rejection never renders as confirmed success.

**State:** complete with implementation evidence pending.
