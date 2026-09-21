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
| Checkout | `/Users/minoveaz/Documents/Proyectos/loopdev-v2` |
| Baseline commit | `cf5fd9f` |
| Last evidence | Remote Tasks, Catalog and Timeline tables respond HTTP 200; focused parity tests pass |

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

## Open blockers

| ID | Blocker | Status |
|---|---|---|
| FP-001 | The remote `platform_timeline_events`, `crm_tasks` and `catalog_products` endpoints respond successfully, but authenticated tenant read/write smoke tests are still required. | open |
| FP-002 | Files has no canonical remote metadata table/storage contract in the current migration set, so its Supabase path cannot be certified. | blocking |
| FP-003 | `npm run validate:mobile-boundaries` reports seven existing Communications imports into desktop runtime; this is tracked for #12 but prevents full Mobile release certification. | open |
| FP-004 | The full quality suite still has unrelated pre-existing Communications and Tasks UI failures. | open |

## Release decision

`NOT_READY`: Tasks, Timeline and Catalog have verified contracts and focused
coverage, but Files lacks a remote persistence contract and the full Mobile
boundary/runtime gates are not green.
