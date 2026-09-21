# Communications Review

## Executive verdict

**NOT_READY / BLOCKED**. The repository contains a substantial Communications
Core model, tenant-scoped foreign keys, RLS migrations, and local adapter
coverage. It does not yet provide release-grade evidence that the approved
server-side dispatch contract is respected by the browser clients, that mobile
attributes actions to the authenticated actor, or that the target Supabase
project has the required inbox-state migration. The focused UI regression run
also fails.

Review date: 2026-09-21
Repository: `minoveaz/loopdev-v2`
Checkout: `/Users/minoveaz/Documents/Proyectos/loopdev-v2`
Branch: `feature/crm-v2-foundation`
Reviewed commit: `cf5fd9f`

## Findings

| ID | Severity | Confidence | Status | Area | Evidence | Impact | Recommended action |
|---|---|---:|---|---|---|---|---|
| COMM-REV-001 | Blocking / High | 10/10 | confirmed | Architecture, security, dispatch | `src/loopdev/domains/communications/adapter/supabase.ts` inserts outbound rows directly into `communication_messages`; the approved Core contract requires `sendCommunication` and a server-side worker, and `20260909000000_communications_phase4_worker_controls.sql` defines the queue/kill-switch model without the adapter consulting it | Browser code can enqueue a reply without the documented organization kill switch, template dispatch workflow, provider verification, trace envelope, or worker authorization | Introduce the server-side command/BFF boundary and make the browser adapter consume its normalized result; enforce kill switch, template, consent, idempotency and trace ID there |
| COMM-REV-002 | Blocking / High | 10/10 | confirmed | Mobile tenant and audit boundary | `apps/mobile/hooks/useMobileCommunications.ts` hardcodes `userId: "mobile-user"` and falls back to `COMMUNICATIONS_LOCAL_CONTEXT`; `MobileCommunicationsScreen` and `MobileConversationScreen` do not pass an authenticated context | Remote mutations can have `author_id = null` and misleading actor metadata; an unauthenticated/mobile fallback can silently display local fixtures instead of failing explicitly | Build a memoized context from the authenticated mobile session, pass it to every Communications hook/screen, and fail closed when no authenticated tenant exists |
| COMM-REV-003 | Blocking / High | 9/10 | confirmed | Product/runtime truth | `src/loopdev/pages/settings/Communications.tsx:100` calls the communications hook with `COMMUNICATIONS_LOCAL_CONTEXT`; the hook therefore routes through the local adapter | Settings can report local fixture health while Inbox is remote, so operators cannot trust connection, template, or kill-switch state | Bind settings to the authenticated tenant context and the same Supabase-backed adapter used by the Inbox |
| COMM-REV-004 | Blocking / High | 9/10 | confirmed | Verification | Focused Vitest run: `4` files, `12` tests; `3` files failed and `11` tests failed. Adapter/collaboration unit run passed `2` files and `10` tests, but it exercises only the local adapter | The UI behavior is not regression-safe; passing local adapter tests does not validate the remote path | Fix the failing UI tests or implementation, add Supabase adapter contract tests with mocked RLS/row errors, and rerun the full Communications slice |
| COMM-REV-005 | Blocking / Medium | 8/10 | open | Migration/runtime evidence | `20260925000000_communications_inbox_state.sql` adds `starred`, `unread_count`, `version`, collaboration, idempotency and content columns used by the adapter, but the review date is 2026-09-21 and no remote migration/status evidence is recorded | The canonical adapter may query or write columns not present in the target project; HTTP success cannot establish schema readiness | Verify remote migration history and run an authenticated, non-destructive read plus permission/error-path checks against the target project |
| COMM-REV-006 | High / Medium | 9/10 | confirmed | React lifecycle | Mobile hooks construct a new context object on every render and use it as an effect dependency; state updates therefore retrigger list/detail requests | Potential request loops, stale races, and excessive Supabase traffic on mobile | Memoize the derived context and subscribe to tenant/auth changes before issuing requests |
| COMM-REV-007 | Medium / High | 10/10 | confirmed | UX architecture | `src/loopdev/pages/crm/Communications.tsx` renders a native `<select>` for catalog items | Violates the module-review control rule and creates a desktop/mobile control inconsistency without a documented accessibility exception | Replace with the existing LoopDev select/popover primitive and add keyboard/accessibility coverage |

## Requirement coverage matrix

| Requirement | Evidence | Status | Gap |
|---|---|---|---|
| Organization and workspace scoped reads | RLS migrations `20260901`, `20260907`; database tests `007-009` | `PARTIAL` | Remote execution and runtime tenant evidence are missing |
| Authenticated actor attribution | Desktop derives actor from auth; mobile uses `"mobile-user"` | `FAIL` | Mobile actor/session propagation is unresolved |
| Inbox list/detail and filters | Desktop and mobile screens plus local adapter tests | `PARTIAL` | UI tests fail; remote adapter path lacks behavioral tests |
| Assignment and lifecycle concurrency | Adapter version checks and local collaboration tests | `PARTIAL` | Browser writes bypass the approved server command boundary |
| Outbound reply policy | UI checks connection/window; DB queue and controls migrations exist | `FAIL` | Direct browser insert does not enforce the full server-side policy/worker path |
| Internal notes | Supabase insert and RLS policy exist | `PARTIAL` | Actor attribution and server-side command/trace evidence are incomplete |
| Idempotency | Inbox-state migration adds unique keys; adapter reads/writes them | `PARTIAL` | Migration application and conflict contract are not verified remotely |
| Mobile/desktop parity | Shared types and parallel surfaces exist | `FAIL` | Mobile context and settings still diverge from desktop runtime behavior |
| UI accessibility and shared controls | Some labelled controls and local tests | `PARTIAL` | Native catalog `<select>` remains; failing UI suite blocks evidence |
| Rollout, kill switch and retention | Phase 4 migration and tests define controls | `NOT_TESTED` | No worker execution or remote operational evidence |

## Blocking issues

1. Resolve `COMM-REV-001` before enabling outbound production actions.
2. Resolve `COMM-REV-002` and `COMM-REV-003` before claiming desktop/mobile use the same tenant-backed runtime.
3. Resolve `COMM-REV-004` and record passing UI plus remote adapter evidence.
4. Resolve or explicitly verify `COMM-REV-005` against the target Supabase project.

## Non-blocking improvements

- Add pagination/cursor support instead of loading and filtering the complete
  conversation set in the browser.
- Replace `any` row mappings with generated Supabase/database types.
- Add expiry cleanup for collaboration presence/drafting state on the remote
  path and expose normalized provider errors with trace IDs.

## Release and follow-up recommendations

- Keep the module at `09-review` with status `BLOCKED`.
- Create a verification run after the server command boundary and mobile auth
  context are corrected.
- Re-run the desktop and mobile runtime checks from the canonical checkout,
  including direct route authorization and a non-destructive authenticated
  Supabase read.
- Do not commit or push the pending TypeScript-only adapter change as a
  Communications release until the full validation slice passes.

State: `partial` (review complete; release blocked).
