# Files Platform backend mapping

This is the provider-neutral boundary for a future server implementation. The
current local adapter remains the reference behavior until Storage and server-side
authorization are available.

| Local contract | Future persistence | Notes |
|---|---|---|
| `FileRecord` | `files` | Tenant scope, relation, lifecycle, permissions projection |
| `FileVersion` | `file_versions` | Immutable history, checksum, author and storage object key |
| `FileRelation` | `file_relations` or typed relation columns | Must enforce organization/workspace scope server-side |
| `UploadSession` | `file_upload_sessions` | Resumable/multipart state and expiry |
| `FilePreviewSource` | Signed URL response | Never persist public URLs in consumer records |
| `FileAuditEvent` | `file_audit_events` | Separate from Timeline and application activity |
| Local preview store | Object Storage | Browser IndexedDB is only a local fallback |

## Server responsibilities

- Validate MIME, size, checksum and quotas.
- Authorize organization, workspace and entity access with RLS/policies.
- Issue short-lived signed upload/download URLs.
- Run antivirus and optional thumbnail/rendition workers.
- Enforce retention, legal hold, expiration and export/delete workflows.
- Keep version rows immutable and make replacement idempotent.

## Consumer responsibilities

Marketing Studio, Content Studio and Document Intelligence provide only their
entity relation, purpose and optional metadata. They do not decide storage keys,
authorization, signed URL lifetime or cleanup policy.
