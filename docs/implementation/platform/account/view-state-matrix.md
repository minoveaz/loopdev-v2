# Account view/state matrix

Normative state inventory for the four Account capabilities. Shared behavior
is defined in `design.md` and `visual-design.md`; renderers may adapt layout,
not operation meaning, permissions, state, or copy key. The matrix is a design
artifact only; no behavior is claimed as implemented.

| View / operation | Loading | Empty | Error | Forbidden | Conflict | Offline | Pending | Success |
|---|---|---|---|---|---|---|---|---|
| Profile / `read_profile` | Skeleton fields, polite status | First-run profile prompts | Retry with safe copy | Own-profile permission notice | N/A | Show last known non-sensitive profile as stale | N/A | Current confirmed values |
| Profile / `update_display_name` | Load form | N/A | Field error + summary | Do not render mutation | Keep draft and show remote version | Keep draft, label unsynced | Disable duplicate submit; `aria-busy` | Confirm only after adapter response |
| Profile / `change_avatar` | Existing avatar placeholder | No avatar, initials generated from current user | Upload error; preserve old ref | Explain unavailable permission | Refresh profile ref | No upload queue until Files contract | Upload progress, cancel where safe | New image after server confirms |
| Preferences / `read_preferences` | Skeleton groups | Use documented defaults; not missing-data ambiguity | Retry, keep last known values marked stale | Own-preference notice | N/A | Local cached values with offline label | N/A | Values from sync source |
| Preferences / `change_language` | Disable picker while loading | Catalog error if no options | Preserve selection and explain | No mutation | Compare local/remote field | Queue only with sync ID and pending label | Spinner/status text | Locale changes only on accepted write |
| Preferences / `change_timezone` | Shared select loading | No silent guessed timezone | Invalid/unavailable timezone | No mutation | Field-level compare | Queue with pending label | Busy state | Confirmed timezone |
| Preferences / `change_appearance` | Theme control loading | Use current theme default | Preserve current theme | No mutation | Device-local; no cross-device conflict unless sync approved | Can change locally | Immediate but report local-only | Applied on current device |
| Preferences / `change_personal_notifications` | Skeleton preferences | Explain default notification behavior | Keep prior values | No mutation | Compare changed preference keys | Queue eligible changes | Show queued/sending | Confirmed user-level preferences |
| Security / `read_security_status` | Skeleton with no stale secrets | No MFA factor enrolled | Provider unavailable message | Reauth/permission required | Requery provider | No sensitive stale status; no writes | Loading status only | Provider-confirmed security state |
| Security / `change_password` | Fields disabled while submitting | N/A | Password-specific error; don't clear required fields silently | Deny and explain | N/A | No offline action | `reauth_required`/provider challenge | Only after provider confirms |
| Security / `change_email` | Current email + request state | N/A | Keep current email; provide retry | Deny | N/A | No offline action | Pending confirmation to new address | Active only after verified provider event |
| Security / `manage_mfa` | Provider operation loading | Explain setup, no false “off” | Provider failure; keep state unchanged | AAL/reauth prompt | Re-list factor state | No offline enrollment/removal | Challenge required | Only verified factor status |
| Security / `sign_out_other_sessions` | Disable action while provider request is pending | Unsupported/error remains explicit | Keep current session and show retryable provider error | Own authenticated subject only | Confirm request outcome; current session remains active | No offline queue | Confirmation + pending state | No device list; success only after provider confirms |
| Billing / `read_subscription` | Skeleton under active org name | No subscription/not configured state | Provider unavailable, retry | Member/non-owner is blocked server-side | Re-fetch version | No sensitive stale billing detail | N/A | Verified provider/server projection |
| Billing / `change_plan` | Load current plan/catalog | No purchasable plan means no CTA | Explain provider/validation failure | Only Owner/Admin | Refresh current subscription | No offline action | Await portal/provider/webhook; mark pending | Refresh authoritative subscription, then confirm |
| Billing / `cancel_subscription` | Load cancellation eligibility | N/A | No false cancellation | Only Owner/Admin | Refresh and explain current status | No offline action | Confirm destructive consequence and effective date | Confirm only provider/server state |
| Billing / `manage_payment_methods` | Load provider handoff | No method data: not configured | Handoff/provider error | Only Owner/Admin | Re-read provider summary | No method/payment cache or writes | Open secure hosted/native flow | Return and refetch summary |
| Billing / `view_invoice` | Load scoped invoice list | No invoices for this org | Invoice unavailable; retry | Only Owner/Admin | Refresh list | No persistent URL cache | PDF/portal download pending | Open short-lived provider-authorized invoice |
| Account navigation | Route loader | No route uses not-found | Route error boundary | Auth redirect / billing forbidden | N/A | Route still opens; mutations respect offline policy | Lazy-route load indicator | Correct destination and breadcrumb |

## Platform renderer decisions

| Surface | Composition and interaction | Adaptation allowed | Must remain shared |
|---|---|---|---|
| Desktop web | LoopDev shell, page breadcrumbs, narrow single-column forms; keyboard first; provider handoff opens safe tab/return flow | Wide max-width capped by `PageContainer`; desktop menu layout | IDs, copy semantics, validation, auth/tenant checks, states |
| Mobile web | Responsive LoopDev shell drawer; cards/forms one column; no hover-only controls; 320 CSS px reflow | Stacked button arrangement and popover-to-drawer adaptation | IDs, labels, permissions, pending/error/conflict behavior |
| iOS | Native stack screens using the existing `apps/mobile/components/ui` catalog; safe area, keyboard, and back returns to source action | Native navigation transition, safe-area/keyboard behavior and approved OS picker | Same operation catalog, server authority, state/copy meaning |
| Android | Native stack screens using the existing `apps/mobile/components/ui` catalog; system back and keyboard behavior | Native navigation transition, insets/keyboard behavior and approved OS picker | Same operation catalog, server authority, state/copy meaning |

Native per-view compositions and current component reuse are documented in
`native-compositions.md`. Native web-view/SDK for provider flows is not
approved; Billing provider integration must document its safe cross-platform
flow during API/specialist design. Native Account operations remain missing
from runtime despite the proposed renderer compositions.

The React Native renderer is separate from the Rivera DOM component library.
The user confirmed that Rivera is the desktop/mobile web baseline; iOS/Android
reuse the current native component catalog and tokens, extending them only
where a required capability is missing. Mobile web continues to reuse Rivera
DOM primitives. Visual approval of the complete package is still pending.

## Cross-cutting verification expectations

- Verify authenticated routes on direct open, refresh, back/forward and
  organization switch.
- Verify role loss and cache purge while a view is open; a stale UI cannot
  authorize a write.
- Verify visible text and icon convey state without color alone.
- Verify focus, screen reader announcements, keyboard, touch targets, i18n,
  RTL and reduced motion for each renderer.
- Runtime screenshots, device tests, behavior tests and visual diffs belong to
  implementation/verification; none is available at visual design time.
