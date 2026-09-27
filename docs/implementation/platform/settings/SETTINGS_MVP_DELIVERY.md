# Settings MVP delivery

## Discovery

The LoopDev shell already exposes `/app/settings` and the active organization
context through `platformAdapter`. There was no Settings domain contract or
tenant-scoped persistence boundary. Workspace navigation is now the single
Settings entry point and is labelled `Workspace / Tools` so it cannot be read
as a second Document Intelligence destination.

The repository currently ships a local platform adapter; no Supabase schema or
remote organization adapter is present on this branch. The Settings adapter is
therefore intentionally replaceable and keys all records by the active
`organizationId` supplied by platform context. It does not invent tenant UUIDs
or use cross-tenant fixtures.

## Design and plan

- Define organization settings, users, roles, and status contracts under
  `loopdev/domains/settings`.
- Keep reads and mutations behind `SettingsAdapter`, with an explicit active
  organization assertion on every operation.
- Persist the local implementation per organization and expose loading,
  empty, error, forbidden, and success states in `/app/settings`.
- Keep English and Spanish keys in parity for the complete Settings surface.
- Cover persistence, validation, owner protection, and cross-organization
  rejection with adapter tests.

## Implemented scope

- Organization name, visible slug, timezone, and locale.
- Tenant user listing and invitations.
- Member role assignment (`owner`, `admin`, `member`).
- Activation and suspension with owner protection.
- Single Workspace / Tools navigation destination for Settings.
- No billing, external integrations, API keys, advanced preferences, SSO/SCIM,
  or configurable Enterprise audit.

## Verification evidence

| Check | Result |
| --- | --- |
| TypeScript | `npm run typecheck` passed |
| Lint | `npm run lint` passed with pre-existing warnings only |
| Focused adapter tests | `npx vitest run src/test/settings/settings-adapter.test.ts` — 3 passed |
| Quality suite | `npm run test:quality` — 57 files / 298 tests passed |
| Production build | `npm run build` passed |
| i18n parity | English/Spanish Settings keys: 38 / 38 |

Browser validation is represented by the route-level states and reload-safe
adapter persistence. A live remote/RLS browser run remains blocked until the
approved Supabase organization adapter and schema exist; the adapter contract
is the handoff boundary for that integration.
