# Account Synchronization Design

## Identity and status

| Field | Value |
|---|---|---|
| Run / span | `MOD-ACCOUNT-20261010-001` / `MOD-ACCOUNT-20261010-001:05-sync` |
| Parent | `04-api` |
| Domain source | `domain-model.md` |
| API source | `api-contracts.md` |
| Status | `partial` — user decisions are recorded and the shared Supabase sync adapter/migration pass isolated unit/database tests; renderer and device-runtime recovery evidence remain pending |
| Scope | Local storage, offline eligibility, mutation states, retry/conflict, migration and reconciliation |

## State model

Connectivity, business state, entity synchronization and mutation state are
separate dimensions. A client must not use a connectivity or pending label to
claim a business operation succeeded.

| Dimension | Values | Meaning |
|---|---|---|
| Connectivity | `online`, `offline`, `unknown` | Transport reachability only |
| Business state | Provider/domain-defined | Authoritative profile/security/Billing/Preferences value; not replaced by local mutation status |
| Entity sync state | `not_loaded`, `synced`, `stale`, `local_only`, `pending_sync`, `conflict`, `forbidden` | Relationship of the local representation to its owner |
| Mutation state | `draft`, `queued`, `sending`, `accepted`, `rejected`, `failed_retryable`, `failed_terminal` | State of one requested change, independent of the entity's provider/business state |

An API/provider `accepted` result is not necessarily an effective email,
MFA, subscription or cancellation business state. Such state changes only
after the relevant authoritative confirmation/event.

## Local ownership and storage boundaries

| Data | Local boundary | Authority / local-first rule |
|---|---|---|
| `PlatformUser.fullName/avatarUrl` | Session-scoped in-memory read cache; unsent profile form values are an in-memory draft only | Auth/Profile provider is canonical. Profile update and avatar upload require online provider/Files availability; no Account-local persisted profile copy or offline queue |
| User language/timezone/notification preferences | Confirmed server values plus a durable queue keyed by the authenticated user; web uses browser storage and native uses Platform Auth secure storage | Preferences service is remote authority; offline writes remain visibly pending until accepted |
| Device appearance | Existing theme hook and device-local storage; do not sync by default | Current device choice remains local and works offline |
| Security status | In-memory, current-session cache only; clear on sign-out, session expiry/revocation and identity change | Auth provider is authority; no durable session/factor list, OTP, token or recovery secret cache |
| Billing overview, invoices, payment summaries, portal links | No durable sensitive cache; a currently rendered response is discarded on scope/permission change | Billing provider/server is authority; offline state displays unavailable, not an old authoritative-looking financial view |
| Tenant membership/role | Existing Tenant Context only | Platform membership service remains authority; never copied into Account cache as authorization |

Local state is keyed by authenticated `userId`; organization-owned Billing
state is additionally keyed by `organizationId`. Tenant changes invalidate
and reload current Account queries; they do not change the ownership of the
user's profile/preferences. Identity changes purge prior-user data and prevent
pending writes from being replayed as the new user.

## Operation and offline matrix

| Operation | Policy status | Offline read | Offline write | Entity / mutation states | Reconciliation |
|---|---|---|---|---|---|
| Read/update profile fields | `assumed` | Same-user cached projection may render as `stale`; no identity data for another account | Keep edits as an in-memory `draft`; do not queue/persist them | `synced` → `draft`; only provider confirmation returns to `synced` | Re-read `PlatformUser` after reconnect. On provider failure preserve draft with explicit error; on identity switch discard it |
| Change avatar | `open` — Files owner must confirm | Existing same-user avatar may display if already available and authorized; URL expiry rules apply | Upload requires online Files/Profile path; no local durable upload queue owned by Account | `draft` → `sending` → `accepted` only after asset/profile association succeeds; otherwise `failed_retryable` or terminal validation error | Use Platform Files upload/recovery contract once verified; delete orphaned upload only via Files owner policy |
| Read/patch user Preferences | `confirmed`; shared adapter and user-scoped durable queue implemented | Last confirmed same-user value may display as `stale`; no local fixture presented as server truth | Account Settings and the authenticated global Topbar language selector use the shared mutation contract; queue with mutation ID and `expectedVersion`, showing `pending_sync` until server acceptance | `synced` → `queued` → `sending` → `accepted` / `conflict` / `rejected` / `failed_retryable` | Sync only when the original user is authenticated; server response replaces cache; same-field conflict returns latest value and attempted patch; an explicit global language choice retries once against the latest version |
| Change device appearance | `confirmed` | Read local theme offline | Save locally offline | Device-local value has no entity sync state; local write completes or returns storage error | No remote reconciliation unless separately approved |
| Read security status | `confirmed` | No durable offline security view; return `unavailable/offline` or clearly marked in-memory stale status only while same session is live | Password/email/MFA/session mutations never queue | Mutation only `sending` while online, then provider-confirmed `accepted` or explicit error | After timeout, re-read provider state before retry; clear sensitive cache on revoke/session expiry |
| Read Billing | `confirmed` | No offline access to invoice/payment details, portal links or cached owner-only response | Plan/payment/cancel commands never queue | Online command `sending` → `accepted/pending` only on authoritative backend response; provider lifecycle remains separate | Reauthorize and fetch active-org state after reconnect/webhook; client does not grant entitlements |
| Change tenant or identity | `confirmed` for cache eviction; pending preference sign-out behavior remains open | Tenant-independent profile/preferences reloaded for current identity; Billing is unavailable until new scope is authorized | No cross-scope mutation continues | Cancel in-flight requests, clear tenant-scoped result/portal links and mark stale requests discarded | Revalidate session/membership; a queued preference mutation can replay only for its original user, never another identity |

## Mutation queue, retry and state transitions

1. The existing generic mobile queue was reviewed and is not used because it
   lacks principal binding and native durable storage. Preferences uses a
   typed, user-scoped queue record; it is not a general-purpose queue.
2. **Confirmed baseline evidence:** the current `apps/mobile/adapters/offlineQueue.ts` is a generic precedent,
   not a safe Account dependency: it persists `unknown` payloads through
   `window.localStorage`, falls back to process memory, and its stored record
   is not intrinsically bound to Auth subject/tenant. Do not enqueue Account
   work through it until those gaps are resolved.
3. The queue stores only the allowlisted patch, original `userId`, stable
   `mutationId`, expected version, creation time and retry state. Auth tokens,
   password/email security payloads, Billing data and provider secrets are
   never stored.
4. Same mutation ID and same payload are replay-safe. Network/provider
   failures stay visibly pending and require an explicit retry; automatic
   bounded backoff and `retryAfter` handling remain follow-up work.
5. **Confirmed:** Membership/role changes reauthorize during processing. A queued
   Preferences mutation still requires the same live user; a Billing or
   Security mutation is never queued. Tenant change cancels tenant-bound work.
6. **Assumed:** A retryable failure remains visible as unsynced and offers retry/discard.
   A rejected mutation is removed only after the user is shown the server
   result or a safe recovery has been persisted; no silent drop or
   success-shaped fallback.
7. **Confirmed by the user:** Preserve queued preference changes across sign-out
   and restart under their original account, then synchronize only after that
   same account signs in again. The web queue is keyed by user ID; native queue
   storage uses the existing secure-storage adapter. No queue is read or
   replayed for a different user.

## Conflict policy

| Case | Policy status | Policy |
|---|---|---|
| Preference `expectedVersion` is stale | `confirmed` conflict state; `assumed` resolution UX | Mark entity `conflict`; fetch latest server value and show per-field local/server values; user chooses keep local, keep server or discard. Retry chosen patch against latest version with a new mutation ID |
| Two preference patches change different fields | `confirmed` | Server merges the allowlisted changed field paths; a stale version alone is not a conflict |
| Two preference patches change the same field | `confirmed` | Return the latest server value and attempted local patch as a conflict; require explicit field-level resolution and a new mutation ID |
| Profile provider changes value concurrently | `open` | Refresh canonical `PlatformUser`; preserve unsent form draft in memory and ask user to reapply; no last-write-wins claim without provider CAS |
| Auth email/MFA/session state changes elsewhere | `confirmed` | Provider-confirmed state wins; discard obsolete local challenge/session view and re-read |
| Billing status/webhook changes while UI is open | `confirmed` | Provider/Billing projection wins; refresh summary and surface action outcome; client cannot locally roll back or grant entitlement |
| Permission revoked while request is queued/in-flight | `confirmed` | Reject at server, purge protected caches/links, mark mutation forbidden; never retry until the same actor has been reauthorized |
| Duplicate mutation delivery | `assumed` | Same user/mutation ID/payload returns prior result where owner supports idempotency; same ID with changed payload is terminal `IDEMPOTENCY_CONFLICT` |

## Migration and recovery

| Source | Status | Migration behavior |
|---|---|---|
| Existing local notification preference key | `confirmed` | Do not import it; it has no verified user identity. Initialize from server/default values and leave the legacy consumer unchanged until the Preferences renderer is wired |
| Existing device theme | `confirmed` | Keep device-local and read through the existing theme hook; no server migration or cross-user account migration |
| Rivera profile/security/Billing samples | `confirmed` | Never import or treat sample localStorage as business data |
| Existing Auth session | `confirmed` | Reuse Auth-owned migration/secure storage. Do not copy token/session records into Account queue; native secure-storage gaps remain Platform Auth work |
| New remote Preferences | `confirmed` | On first remote read, initialize an unchosen language from the current supported app locale; preserve any explicitly initialized server language. Other preference values remain server/default-owned. Do not import legacy local notification values; use stable Auth `userId`, never email, active organization or device |
| Interrupted queue or partial event delivery | `assumed` | Reconcile by mutation ID/version with the authoritative service; server outbox/provider replay repairs events without repeating the business write |
| Reinstall / cleared browser storage | `assumed` | Restore confirmed profile/preferences from remote after authentication. Unsent local-only theme may reset to system; an unsent queue is recoverable only if Platform storage explicitly supports it |

On logout or identity switch, retain the original user's pending change and do
not flush it under the next account. The Account UI must make pending status
visible and offer retry/discard for that original account.

Rollback removes the new sync adapter/queue and returns reads to the previous
approved authority; it must not delete server preferences or import legacy
values automatically. A failed server migration leaves the prior local value
available as an explicitly local draft, never as confirmed remote state.

## Multiplatform adaptation

| Platform | Storage and recovery adaptation | Shared semantic behavior |
|---|---|---|
| Desktop web | Browser persistence may store non-secret preference queue payloads only if user-scoped and recoverable; cross-tab coordination required | Same queued/conflict/forbidden states and reauthorization |
| Mobile web | Browser storage follows the same constraints; page reload may interrupt in-flight work | Same user-keyed queue and no offline Security/Billing commands |
| iOS | Use the verified Platform storage abstraction; never assume `window.localStorage` exists. Auth tokens remain in secure storage, separate from preference queue | Same mutation IDs, errors and conflict policy |
| Android | Use the verified Platform storage abstraction; never assume `window.localStorage` exists. Auth tokens remain in secure storage, separate from preference queue | Same mutation IDs, errors and conflict policy |

Appearance uses native/web existing theme adaptation and is not forced to be
identical across devices. Touch/navigation/lifecycle differences do not
change ownership or replay rules.

## Synchronization test cases

1. Reload while offline with a queued Preferences patch; restore the same
   authenticated user and verify the patch remains visibly pending.
2. Retry the same mutation ID after network timeout; verify one server effect
   and no duplicate preference event.
3. Reuse the mutation ID with a different patch; reject with
   `IDEMPOTENCY_CONFLICT`.
4. Submit a stale `expectedVersion`; show latest server values and require
   field-level user resolution before retry.
5. Queue a mutation for user A, sign out and authenticate as user B; verify no
   local value renders for B and no mutation is sent as B.
6. Switch organizations while loading Billing; purge the previous scope,
   reject stale in-flight response and issue no portal/invoice link in the
   new organization.
7. Revoke membership or downgrade Owner/Admin while Billing is cached or an
   action is pending; server rejects and client clears restricted data.
8. Go offline while editing Profile; preserve only an in-memory draft and
   report it is unsaved; reload or switch identity without false success.
9. Fail Files upload or profile association after upload; expose retryable
   state and follow Files orphan-cleanup policy.
10. Go offline in Security; verify no password/email/MFA/session mutation is
    queued and no factor/session list is presented as current.
11. Go offline in Billing; verify no invoice/payment/provider details or
    mutation response are loaded from durable cache.
12. Restore connectivity after a rate limit; honor `retryAfter` and retain
    pending state without a tight retry loop.
13. Reinstall/clear storage with confirmed server preferences and an unsent
    local theme; restore remote preferences and allow theme to use system
    default without importing legacy state.
14. Simulate server write success followed by event delivery failure; verify
    outbox/reconciliation repairs event delivery without a second business
    mutation.
15. Run the same contract tests on desktop web, mobile web, iOS and Android,
    including native restart and web multi-tab behavior.

## Open decisions and risks

| Item | Owner | Safe boundary |
|---|---|---|
| Cross-tab coordination, automatic retry/backoff and queue retention | Platform Sync/Privacy | Queue is user-scoped and durable; multi-tab locking and automatic retry are not implemented |
| Preference notification catalog breadth | Product + Preferences | Current contract mirrors the existing four channels and four notification types; this catalog remains an implementation assumption |
| Provider CAS/idempotency for profile and Security operations | Platform Auth | Re-read before retry; no offline queue or conflict guarantee without provider support |
| Files upload queue/abort/orphan cleanup for avatar | Platform Files | Reuse Files lifecycle; Account owns no duplicate uploader |
| Billing read-cache lifetime, webhooks, entitlement event reconciliation and replay store | Billing/Finance | No durable client billing cache or queued mutation |
| Native restart runtime evidence | Platform Sync/Auth | Shared adapter uses the existing native secure-storage provider; device restart and authenticated native runtime evidence are not available |

**State:** `partial`. The user's decisions for pending-change recovery,
non-import of legacy notification values, and field-level conflict behavior
are reflected in the implementation. The shared adapter, user-scoped queue,
Supabase persistence migration and isolated pgTAP suite are present. Database
execution passed on a fresh isolated local project, but authenticated runtime
evidence, native restart verification, automatic retry/backoff, and cross-tab
coordination remain pending. The migration has not been applied to a shared or
remote database.
