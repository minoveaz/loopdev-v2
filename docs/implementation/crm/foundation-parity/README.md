# CRM Foundation Parity Implementation

## References

- Product roadmap: `docs/06-product/crm/CRM_MULTIPLATFORM_PARITY_ROADMAP.md`
- Main issue: `minoveaz/loopdev-v2#8`
- Multiplatform contract: `docs/03-platform/governance/MULTIPLATFORM_DELIVERY_CONTRACT.md`
- Evidence matrix: `requirement-evidence-matrix.md`

## Current status

| Field | Value |
|---|---|
| Status | `blocked` |
| Current phase | Foundation adapter hardening |
| Current issue | #8 |
| Branch | `feature/crm-v2-foundation` |
| Checkout | `/workspaces/loopdev-v2` |
| Baseline commit | `a6233bbb` |
| Last evidence | TypeScript, boundaries, contracts, focused tests and quality suite pass; Files schema, sessions and private bucket are applied remotely |

## Scope

The parity foundation covers shared contracts and adapters for Tasks,
ActivityTimeline, Files and Catalog across desktop and mobile, with tenant
scope, local fallback and runtime evidence. This phase does not close #8.

## Implemented in this phase

- ActivityTimeline Supabase reads now use the authenticated Supabase client,
  rather than a hand-built REST request with an invalid authorization header.
- Timeline queries preserve organization scope, optional workspace scope,
  relation filtering and bounded result limits.
- Timeline append continues to use the canonical authenticated client and
  organization/dedupe key.
- Demo task/template and catalog seeds are no longer exposed through the
  production mobile adapters.
- Mobile Files now validates MIME/size, scopes reads by organization and uses
  only user-created local cache when offline.
- The `platform_files` metadata migration exists in source, but it does not
  establish a Supabase Storage upload/session/preview flow.

## Open blockers

| ID | Blocker | Status |
|---|---|---|
| FP-001 | Authenticated tenant read/write smoke tests for Tasks, Timeline and Catalog are still required; Auth is disabled and PostgREST currently returns HTTP 500. | open |
| FP-002 | Remote metadata, versions, upload sessions, RLS and private Storage bucket are deployed; `npm run smoke:files-authenticated` passes upload, versioning, signed preview and cleanup. | resolved |
| FP-003 | Mobile offline transition/recovery and native/runtime route evidence are still not captured. | open |

## Release decision

`READY_FOR_HANDOFF`: Files schema, upload sessions, RLS and private Storage are
deployed remotely, and the authenticated upload/version/preview smoke passes.
The remaining follow-up is shared Desktop adapter parity and committing/pushing
the application code changes.
