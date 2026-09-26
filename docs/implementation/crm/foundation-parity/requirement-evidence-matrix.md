# Foundation Parity Requirement Evidence Matrix

| Requirement | Evidence | Status | Gap |
|---|---|---|---|
| Tasks shared contract and adapters | `packages/contracts/src/tasks.ts`, `src/loopdev/domains/tasks/`, `apps/mobile/adapters/tasks.ts`, focused foundation tests | partial | Contract and focused behavior pass; authenticated tenant smoke evidence is still missing. |
| ActivityTimeline shared port | `src/loopdev/domains/platform/adapter/work.ts`, `packages/contracts/src/activity-timeline.ts`, `apps/mobile/adapters/activity-timeline.ts`, focused foundation tests | partial | Contract and focused behavior pass; authenticated tenant smoke evidence is still missing. |
| Files shared contract and adapters | `src/loopdev/domains/files/types.ts`, `src/loopdev/domains/files/adapter/local.ts`, `apps/mobile/adapters/files.ts`, remote migration list and `npm run smoke:files-authenticated` | confirmed | Remote upload, session, version and signed preview smoke passes; broader shared Desktop adapter parity remains a follow-up. |
| Catalog shared contract and adapters | `src/loopdev/domains/catalog/types.ts`, `apps/mobile/adapters/catalog.ts`, focused foundation tests | partial | Contract and focused behavior pass; authenticated tenant smoke evidence and complete offer facade evidence are missing. |
| Tenant isolation | Remote `platform_files` migration/RLS and Storage policies; local scope tests | partial | Remote policies are deployed; authenticated cross-tenant runtime evidence is still required. |
| Local/offline fallback | Local adapter and foundation tests | partial | Local fallback is covered; mobile offline transition and recovery evidence is still missing. |
| Responsive/accessibility UX | Existing mobile components | open | Foundation-level state coverage is incomplete. |
| Runtime and migration verification | `npx supabase migration list --linked`; remote `platform_files`, `platform_file_versions` and `platform_file_upload_sessions` HTTP 200; `npm run smoke:files-authenticated` | confirmed | Remote Files upload, metadata, version and signed preview flow passes with cleanup. |
| Mobile dependency boundary | `npm run validate:mobile-boundaries --silent` | confirmed | Validation passes; no imports from `src/` are currently detected in `apps/mobile`. |

## Current verification

- `npm run typecheck --silent`: passed.
- `npx tsc -p apps/mobile/tsconfig.json --noEmit`: passed.
- `npm run validate:mobile-boundaries --silent`: passed.
- `npm run validate:contracts --silent`: passed (16 contract files, 2 stable ids).
- Focused foundation suite: 7 files and 26 tests passed.
- Full quality suite: 68 files and 361 tests passed.
- `git diff --check`: passed.
- `npx supabase db push --linked`: applied `20260927000000`, `20260928000000` and `20260928100000` remotely.
- `npx supabase migration list --linked`: local and remote histories match through `20260928100000`.
- Remote REST probe for `platform_files`: HTTP 200 with an empty result set.
- Authenticated remote Storage dump confirms bucket `platform-files`, private, 25 MB limit and allowed MIME types.
- Remote REST probes for `platform_file_versions` and `platform_file_upload_sessions`: HTTP 200.
- `npm run smoke:files-authenticated`: passed upload, session, metadata, version, signed preview and cleanup.
- The anon Storage endpoint may return 404 for this private bucket; that is not evidence that the bucket is absent.
- No issue closure claimed: Files remote upload/preview and authenticated runtime evidence remain open.
