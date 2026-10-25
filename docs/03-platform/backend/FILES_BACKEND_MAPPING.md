# Files Platform backend mapping

This is the provider-neutral contract for Files consumers. The existing local
adapter is demo-only. The development database has organization-scoped Files
and product-media policies, but the generic organization-scoped remote Files
adapter is not implemented and Products still has a direct Storage path.

| Local contract | Future persistence | Notes |
|---|---|---|
| `FileRecord` | `files` | Tenant scope, relation, lifecycle, permissions projection |
| `FileVersion` | `file_versions` | Immutable history, checksum, author and storage object key |
| `FileRelation` | `file_relations` or typed relation columns | Must enforce organization/workspace scope server-side |
| `UploadSession` | `file_upload_sessions` | Resumable/multipart state and expiry |
| `FilePreviewSource` | Signed URL response | Choose `original`, `large` (max edge 1600 px) or `thumbnail` (max edge 400 px); maximum URL lifetime is 300 seconds; never persist or cache URLs |
| `FileAuditEvent` | `file_audit_events` | Separate from Timeline and application activity |
| Local preview store | Object Storage | Browser IndexedDB is only a local fallback |

## Server responsibilities

- Validate MIME, size, checksum and quotas.
- Authorize organization, workspace and entity access with RLS/policies.
- Issue short-lived signed upload/download URLs.
- Run antivirus and optional thumbnail/rendition workers.
- Enforce retention, legal hold, expiration and export/delete workflows.
- Keep version rows immutable and make replacement idempotent.

## Product media contract

`PlatformFilesPort` in `packages/contracts/src/platform-files.ts` is the
shared consumer boundary. It hides storage keys and provider-specific upload
details. The authenticated server derives the actor, verifies active
organization membership, validates the requested scope and re-authorizes the
resource on each upload, status and preview request. A client-supplied
organization or resource ID is a selector, not proof of access.

| Concern | Contract |
|---|---|
| Upload policy | JPEG, PNG or WebP; maximum 25 MiB. MIME, file signature and successful image decoding are enforced server-side. Browser validation is only an early UX check. |
| Finalization | Files owns the upload session, storage key, scanning/processing and immutable original. Return `processing` until complete; Products may register only a `ready` same-organization File. Idempotency keys make retries safe. |
| Renditions | Platform Files produces maximum-edge 1600 px and 400 px renditions, preserves aspect ratio, never upscales, and retains the original. Encoding/quality are Platform policy, not consumer input. |
| Reuse and association | A finalized File may be referenced by multiple product/SKU assignments. ERP owns `ProductMediaAsset` tags and per-target assignment, ordering and alt text. Product detach deletes only that assignment; it never deletes the reusable asset, File, version or binary. |
| Preview | Platform Files rechecks current Files and resource authorization, then returns a signed URL with `expiresAt` and a maximum 300-second lifetime. The URL is a bearer credential until expiry; consumers must request it on demand and not persist/cache it. |
| Retention and recovery | Platform Files owns retention, legal hold, incomplete-upload reconciliation and orphan recovery. ERP never deletes a File or binary as compensation for registration/attach failure. Recovery must verify that no active assignment or other reference exists before any permanent cleanup. |

The contract does not invent a retention duration; the Platform retention
policy remains authoritative. Failed registration/attachment leaves the
finalized File in the reusable library until Platform-owned reconciliation
handles it. A successful detach is not an orphan-cleanup signal.

The Products media adapter now uses `PlatformFilesPort` and the authenticated
`platform-files` function for library listing, upload finalization and preview
signing. The implementation is limited to organization-scoped product media;
it does not yet provide a generic organization/workspace Files adapter or the
remaining lifecycle operations described above.

## Consumer responsibilities

Consumers provide only their entity relation, purpose and optional metadata.
They do not decide storage keys, authorization, signed URL lifetime, rendition
processing, retention or cleanup policy.
