# Account requirement evidence matrix

These requirements include the user's approved MVP scope and operation
boundaries from 2026-10-10. Source inspection only; this run did not execute
account-page tests or runtime journeys.

| Requirement ID | Product definition reference | Implementation evidence | Test/evidence link | Status | Gap/next action |
|---|---|---|---|---|---|
| `REQ-ACCOUNT-PROFILE-DESTINATION` | User-approved scope 2026-10-10: global personal display name and avatar across four platforms | `src/routes/AppRoutes.tsx` maps `/account/profile` to Rivera `Profile`; `src/template/rivera/pages/account/Profile.tsx` stores sample profile data in browser storage | No focused page test found; see `platform-evidence-matrix.md` | `PARTIAL` | Design authoritative user-owned profile contract and four-platform operations |
| `REQ-ACCOUNT-PREFERENCES-DESTINATION` | User-approved scope 2026-10-10: language, timezone, appearance, personal notifications; user sync except device-adapted appearance | `/account/settings` resolves to Rivera `Settings`; separate LoopDev organization/member settings exist at `/app/settings` | Existing organization adapter tests do not cover the account page | `PARTIAL` | Design synchronized preference persistence and keep `/app/settings` for organization settings |
| `REQ-ACCOUNT-SECURITY-DESTINATION` | Password/email, MFA and provider-backed sign-out of other sessions; individual session/device inventory and revocation excluded by user-approved scope change; no account deletion | `/account/security` resolves to Rivera mock page; current `AuthPort` supports core session/password operations | `src/test/platform/auth-port.test.ts` and `src/test/auth/login.test.tsx` test underlying auth, not this page | `PARTIAL` | Implement provider-backed security operations and shared AuthPort/native coverage; never fake unsupported actions |
| `REQ-ACCOUNT-BILLING-DESTINATION` | User-approved scope 2026-10-10: active-organization billing, Owner/Admin only; plan/invoices/payment methods/upgrade/downgrade/cancel | `/account/billing` resolves to sample plans/payment methods/invoices and browser-local mutations | No LoopDev billing adapter/contract/provider or focused billing test found | `PARTIAL` | Compare providers during design; define customer mapping, entitlements and lifecycle |

## Release blockers

- Billing provider selection and security-provider feasibility remain design
  questions, not discovery blockers.
- Implementation and operation parity remain unverified on all four required
  surfaces; current web routes are mock-backed and native account rows do not
  navigate.

## Known deviations

- The four menu routes exist but resolve to Rivera template/mock pages; this
  conflicts with the approved LoopDev-native destination outcome.
- Existing native account rows are visible but do not navigate to equivalent
  destinations, despite native support being in approved MVP scope.
