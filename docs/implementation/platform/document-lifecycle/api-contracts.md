# Document Lifecycle API and Event Contracts

All commands require an authenticated organization context and an
`idempotencyKey`. Errors use `DocumentLifecycleError` codes from
`lifecycle-contracts.ts`.

| Operation | Required input | Result |
|---|---|---|
| `POST /document-lifecycle/associate` | organization, document, extraction, contact, expected version | linked document |
| `POST /document-lifecycle/promote` | association plus temp path/file metadata | platform file and relation |
| `GET /document-lifecycle/retention` | organization | defaults and type policies |
| `PUT /document-lifecycle/retention/:type` | organization, type, days | policy (1–3650 days) |
| `POST /document-lifecycle/cleanup` | worker context | expired count |
| `POST /document-lifecycle/reconcile` | worker context | orphan/mismatch report |

Events are tenant-scoped and contain event ID, document/extraction/contact/file
IDs, actor, timestamp and idempotency key. Communications invokes the same
promote/associate contract and must not create a second uploader.
