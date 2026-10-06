# Auth and Identity Handoff

## Purpose

Implement the shared authentication and tenant-context foundation required by
LoopDev v2 before resuming the Platform Notes backend integration.

This handoff is intended for an agent working from another computer. Do not
assume that local browser sessions, local Supabase tokens, Docker volumes, or
uncommitted files are available there.

## Current repository state

- Repository: `minoveaz/loopdev-v2`
- Branch: `feature/crm-v2-foundation`
- Checkpoint commit: `68353fc feat(notes): add platform notes adapters and mobile editor`
- Notes delivery run: `MOD-NOTES-20260914-001`
- Notes delivery state: `07-build`, attempt 4, blocked by missing real auth context,
durable sync implementation, focused security/audit coverage and renderer tests.
- Do not delete or close the Notes run. It is a dependent run and must be
resumed after Auth and tenant context are complete.

## Supabase access

The development project is:

- Project name: `loopdev-platform-dev`
- Project ref: `sukjcsylkljiyvfklxvj`
- Region: `eu-west-1`
- Status observed during audit: `ACTIVE_HEALTHY`

On the new computer, authenticate the CLI directly in the terminal:

```bash
npx supabase login
npx supabase projects list
npx supabase link --project-ref sukjcsylkljiyvfklxvj
```

Never place Supabase access tokens, database passwords, service-role keys or
`.env` values in Git, handoff documents or chat messages.

Docker is required for local Supabase commands and is already used by the CLI.
Verify it with:

```bash
docker info
docker compose version
npx supabase --version
```

## Evidence already collected

The remote development database already contains a Notes backend. It is not
necessary to create a second `notes` table.

Existing remote objects include:

- `public.crm_notes`
- `public.crm_notes_visible`
- `public.crm_audit_events`
- RLS policies for Notes read/insert/update/delete
- organization and workspace permission functions
- relation-scope validation trigger
- authenticated actor trigger
- timeline append trigger
- idempotency columns and unique index
- optimistic `version` column

The legacy repository was audited from:

```text
https://github.com/minoveaz/loopdev
```

Relevant legacy sources:

```text
supabase/migrations/20260827000000_crm_core_catalog_foundation.sql
apps/loopdev-os/src/app/api/crm/notes/route.ts
apps/loopdev-os/src/app/api/crm/_lib/access.ts
apps/loopdev-os/src/services/crm/operations.ts
apps/loopdev-os/src/lib/supabase/client.ts
apps/loopdev-os/src/lib/supabase/server.ts
apps/loopdev-os/src/types/database.types.ts
```

Legacy Notes originally stored plain `body` text and relation foreign keys. The
current remote schema is newer and adds `workspace_id`, `brand_id`, relation
columns, `version`, idempotency fields and the visible-note view.

## Why Auth is a prerequisite

LoopDev v2 currently uses a mock session from `localStorage` in:

```text
src/hooks/use-auth.tsx
```

Current local identifiers such as these are not Supabase identities:

```text
local-development-user
local-development-organization
local-workspace
```

The remote RLS functions depend on real Supabase Auth and membership data:

```text
auth.uid()
public.organization_memberships
public.has_organization_permission(...)
public.can_access_workspace(...)
```

Do not connect Notes mutations to Supabase while v2 still sends mock IDs.

## Auth module scope

Create a new delivery run for Platform Auth/Identity, for example:

```text
MOD-PLATFORM-AUTH-20260914-001
```

The scope must cover:

- email/password sign in;
- sign out;
- session restoration after reload;
- access-token refresh;
- forgot-password request;
- password-reset callback and update;
- email verification state;
- expired or revoked session handling;
- auth error mapping;
- desktop web and mobile web behavior;
- iOS and Android storage decisions, even if native renderers remain planned;
- real authenticated user identity from `auth.users`;
- organization memberships;
- active organization selection;
- accessible workspaces;
- active workspace selection;
- membership status;
- permission set required by Platform and CRM;
- route protection and unauthenticated redirects;
- logout cleanup of active tenant context and local pending queues.

The user-visible auth copy must be internationalizable and must not expose
backend error details or secrets.

## Required shared contracts

Define an `AuthPort` or equivalent shared contract with operations equivalent to:

```text
getSession
onAuthStateChange
signInWithPassword
requestPasswordReset
updatePassword
verifySessionCallback
signOut
```

Define an organization-context contract with equivalent operations for:

```text
getCurrentUser
listOrganizations
selectOrganization
listWorkspaces
selectWorkspace
getPermissions
clearContext
```

The context returned to Platform adapters must contain:

```ts
{
  userId: string | null;
  organizationId: string | null;
  workspaceId: string | null;
  brandId: string | null;
  membershipStatus: "active" | "pending" | "suspended" | null;
  permissions: readonly string[];
}
```

Keep local/mock adapters for tests, but make the runtime adapter injectable.
Do not hard-code `local-development-organization` in the Supabase path.

## Platform implementation decisions

Use Supabase Auth for the real adapter. Prefer the repository's existing
Supabase-compatible runtime conventions from legacy, but do not copy Next.js
server-only code into the Vite or Expo runtime.

Desktop web and Expo Web may use browser persistence. Native mobile must use a
platform-appropriate secure storage adapter. Keep the shared AuthPort neutral.

Do not expose a service-role key in desktop, web or native client bundles.
All RLS-sensitive operations must run with the user's authenticated session.

## Verification requirements

At minimum, add focused tests for:

- valid sign in;
- invalid credentials;
- sign out and local context cleanup;
- session restoration;
- expired session;
- password reset request and callback state;
- organization selection;
- workspace selection;
- permission changes;
- suspended membership;
- tenant isolation;
- no cross-organization context leakage;
- desktop/mobile contract parity.

Use local adapters and mocked Supabase responses for unit tests. Use a linked
Supabase integration check only when credentials and test accounts are
available. Never make tests depend on a personal production account.

Required repository checks before handoff:

```bash
npm run validate:delivery-ledgers
npm run typecheck
npm run validate:mobile-boundaries
npm run test:quality
npm run validate:multiplatform
```

## Delivery workflow

Read and follow:

```text
docs/03-platform/governance/delivery-workflow.json
docs/03-platform/governance/MODULE_DELIVERY_AGENT_CONTRACT.md
docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md
docs/03-platform/governance/MULTIPLATFORM_DELIVERY_CONTRACT.md
```

Required phase order:

```text
00-discovery
01-design
01-visual-design
02-domain
03-access
04-api
05-sync
06-plan
07-build
08-verify
09-review
10-git
```

The visual-design gate must include desktop and mobile compositions, storage
and interaction decisions, and shared-contract evidence. Stop for approval at
the design, visual design and plan gates.

Create one issue per executable phase using the repository module-phase issue
template. Link every issue to the Auth run, product definition, implementation
artifacts and span ID.

## Notes follow-up after Auth

After Auth and tenant context are verified:

1. Resume `MOD-NOTES-20260914-001` using the delivery CLI.
2. Add a Supabase-backed NotesPort adapter.
3. Map the v2 Notes contract to `crm_notes` and `crm_notes_visible`.
4. Preserve RLS and remote version/idempotency semantics.
5. Decide and document how TipTap JSON is persisted; do not silently put rich
JSON into the legacy plain-text `body` field.
6. Keep local adapters for offline tests and explicit fallback behavior.
7. Add security, audit, sync and renderer acceptance evidence.
8. Complete Notes `07-build`, then proceed to `08-verify`.

## Prohibited actions

- Do not reset, amend or rewrite existing commits.
- Do not push to `main` or `develop`.
- Do not run destructive Supabase reset commands against the linked dev project.
- Do not apply migrations to the remote project without an explicit migration
approval and a reviewed diff.
- Do not commit `.env`, tokens, service-role keys, database passwords or local
Supabase temp files.
- Do not claim Notes backend completion before the Auth dependency and remote
adapter evidence pass.
