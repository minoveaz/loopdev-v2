# Platform evidence matrix

| Capability/operation | Domain parity | Desktop renderer/action | Mobile renderer/action | iOS | Android | Status | Owner | Gap/next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `notes.listNotes` | NotesPort + adapter tests | adapted: desktop Platform adapter | adapted: mobile adapter + Customer 360 list | planned | planned | PARTIAL | Platform | Renderer component evidence pending |
| `notes.createNote` | NotesPort + mobile adapter test | adapted: existing drawer callback preserved | adapted: mobile Quick/Rich editor | planned | planned | PARTIAL | Platform | Focused renderer tests pending |
| `notes.updateNote` | versioned mutation + conflict test | adapted: Platform work adapter | adapted: mobile adapter | planned | planned | PARTIAL | Platform | Desktop suite baseline blocker |
| `notes.deleteNote` | contract + mobile CRUD test | adapted: Platform adapter operation; UI unchanged | adapted: mobile action menu | planned | planned | PARTIAL | Platform | Permission/component evidence pending |
| `notes.applyVisibilityAndPermissions` | shared permission/error contract | adapted: Platform mutation boundary | adapted: mobile visibility controls | planned | planned | PARTIAL | Platform | Access tests pending |
| `notes.relateToContact` | shared relation scope | adapted: Customer 360 Platform relation | adapted: mobile Contact relation | planned | planned | PARTIAL | Platform | Consumer regression tests pending |

`PASS` requires verified domain, renderer and operations on every required
platform. A shared port, a visible section or a registered route alone does not
prove action parity.

## Runtime snapshot

| Field | Value |
| --- | --- |
| Repository path | `/workspaces/loopdev-v2` |
| Checkout type | branch |
| Branch and HEAD | `feature/crm-v2-foundation / 7ee970d` |
| Desktop URL/port | `http://127.0.0.1:8082` |
| Mobile URL/port | `http://127.0.0.1:8083` |
| Validation timestamp | 2026-09-14 design |

## Validation commands

| Command | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `npm run validate:delivery-ledgers` | PASS | CLI output | Discovery ledger valid; design pending |
| `npm run validate:mobile-boundaries` | PASS | CLI output | `apps/mobile` has no imports from `src/` |
| `npx tsc --noEmit` (apps/mobile) | PASS | CLI output | Mobile TypeScript passes |
| `npx expo export --platform web --output-dir /tmp/loopdev-mobile-web` | PASS | CLI output | Expo Web bundle exported |
| `npm run test -- src/test/platform/notes-port.test.ts src/test/mobile/notes-adapter.test.ts` | PASS | CLI output | 5 focused tests passed |
| `npm run test -- src/test/platform/platform-work.test.ts src/test/platform/platform-work-components.test.tsx` | FAIL | CLI output | Existing component test expects missing inline Add note field; desktop frozen, task remains open |
