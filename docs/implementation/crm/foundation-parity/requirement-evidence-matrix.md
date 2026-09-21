# Foundation Parity Requirement Evidence Matrix

| Requirement | Evidence | Status | Gap |
|---|---|---|---|
| Tasks shared contract and adapters | `packages/contracts/src/tasks.ts`, `src/loopdev/domains/tasks/`, `apps/mobile/adapters/tasks.ts` | partial | Mobile adapter still duplicates behavior and hardcodes a fallback organization. |
| ActivityTimeline shared port | `src/loopdev/domains/platform/adapter/work.ts`, `packages/contracts/src/activity-timeline.ts`, `apps/mobile/adapters/activity-timeline.ts` | partial | Remote endpoint responds, but authenticated tenant smoke tests are missing. |
| Files shared contract and adapters | `src/loopdev/domains/files/types.ts`, `src/loopdev/domains/files/adapter/local.ts`, `apps/mobile/adapters/files.ts` | blocked | No canonical remote metadata/storage table exists in the current migration set. |
| Catalog shared contract and adapters | `src/loopdev/domains/catalog/types.ts`, `apps/mobile/adapters/catalog.ts` | partial | Mobile model is unified and reads/writes `catalog_products`; price-book/offer queries still need a shared mobile facade. |
| Tenant isolation | Local Files scope tests; Supabase RLS migration | partial | Mobile runtime and remote smoke evidence are missing. |
| Local/offline fallback | Local adapter tests | partial | No mobile offline transition and recovery evidence. |
| Responsive/accessibility UX | Existing mobile components | open | Foundation-level state coverage is incomplete. |
| Runtime and migration verification | Remote HTTP 200 for `crm_tasks`, `catalog_products`, `platform_timeline_events` | partial | Authenticated tenant smoke and real mobile route evidence are missing. |
| Mobile dependency boundary | `npm run validate:mobile-boundaries --silent` | blocked | Seven Communications imports still cross from mobile into desktop runtime. |

## Current verification

- `npm run typecheck --silent` from the canonical checkout: passed.
- `npx tsc -p apps/mobile/tsconfig.json --noEmit`: passed.
- `git diff --check` from the canonical checkout: passed.
- Focused foundation suite: 14 tests passed.
- `npm run validate:mobile-boundaries --silent`: failed with seven Communications boundary violations.
- Full quality suite: failed on pre-existing Communications settings and Tasks UI localization assertions.
- No issue closure claimed.
