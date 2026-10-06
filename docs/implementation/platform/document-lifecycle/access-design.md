# Document Lifecycle Access Design

| Operation | owner/admin | manager/agent | member | read-only |
|---|---:|---:|---:|---:|
| View permitted extraction/file | yes | yes | yes | yes |
| Review extraction | yes | yes | scoped | no |
| Associate/promote | yes | yes | scoped | no |
| Change retention policy | yes | no | no | no |
| Cleanup/reconcile | worker | worker | no | no |

Every table and Storage path is organization-scoped. RLS repeats membership
checks server-side; contact foreign keys include organization IDs. Identity
documents are sensitive PII, signed URLs are short-lived, and audit/timeline
events omit raw document fields and bytes.
