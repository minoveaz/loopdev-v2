# Platform Account implementation record

## References

- Product definition: **not found**; discovery records the explicit user
  request and open product decisions.
- Related implementation context: `docs/implementation/platform/settings/SETTINGS_MVP_DELIVERY.md`,
  `docs/implementation/platform/auth/`
- Active context track: `tracks/active/platform/2026-09-09-loopdev-v2-monorepo-multitenancy.md`
- Account-specific track: `tracks/active/platform/2026-10-11-platform-account-pages.md`
- Run ID: `MOD-ACCOUNT-20261010-001`
- Multiplatform contract: `docs/03-platform/governance/MULTIPLATFORM_DELIVERY_CONTRACT.md`
- Platform scope: `platform-scope.md`
- Platform evidence: `platform-evidence-matrix.md`

## Current status

| Field | Value |
|---|---|
| Status | `00-discovery complete; 01-design approved; 01-visual-design approved; 02-domain completed (partial); 03-access completed (partial); 04-api completed (partial); 05-sync completed (partial); 06-plan approved and complete; 07-build active (22 done; 2 in progress; 2 ready; 11 blocked)` |
| Current phase | `07-build`; native Profile and Preferences renderers are implemented at component level, with device acceptance still pending |
| Current skill | `module-build` |
| Current issue | [#33](https://github.com/minoveaz/loopdev-v2/issues/33) tracks build; [#32](https://github.com/minoveaz/loopdev-v2/issues/32) tracks the completed plan |
| Branch | `feature/platform-account-pages` (based on `develop`) |
| Commit | `af5e511506339ef1f96e85e9248fe0feee427516` at run initialization |
| Pull request | None |
| Last evidence | `runs/MOD-ACCOUNT-20261010-001/07-build-evidence.md`; Account suite, typechecks, Expo Doctor, Web/iOS/Android exports and route smoke checks (2026-10-11) |
| Architecture quality | `PASS_WITH_DEBT` — proposed boundaries; billing provider, MFA details and avatar resolution remain open |

## Scope

### Platform scope

| Surface | Scope | Owner | Evidence |
|---|---|---|---|
| Desktop web | `required` | Platform Delivery | `platform-scope.md` |
| Mobile web | `required` | Platform Delivery | `platform-scope.md` |
| iOS | `required` | Platform Delivery | Same account operations as web; native UX is adapted |
| Android | `required` | Platform Delivery | Same account operations as web; native UX is adapted |

### Included in discovery

- Profile, Account Settings, Security and Billing menu route/current-state
  discovery.
- User/tenant/billing ownership distinctions, focused first-party market
  research, operation-level platform gap inventory and unresolved decisions.
- User-approved MVP: global display name/avatar; user-synced language,
  timezone and notifications; device-adapted appearance; personal
  password/email, MFA and sign-out-other-sessions; organization billing
  with Owner/Admin-only access, plan/invoice/payment-method management,
  upgrades, downgrades and cancellation.

### Excluded from discovery

- Design, planning, implementation, production changes, issues, commits,
  pushes and pull requests.
- Provider-specific billing and authentication lifecycle policies; these are
  assigned to design, not left as discovery blockers.

## Phase index

| Phase | Issue | Status | Checkpoint | Evidence |
|---|---:|---|---|---|
| 00-discovery | — | `complete` | `runs/MOD-ACCOUNT-20261010-001/00-discovery.json` | `discovery.md`, `delivery-ledger.json`, `platform-scope.md`, `platform-evidence-matrix.md` |
| 01-design | — | `approved` | `runs/MOD-ACCOUNT-20261010-001/01-design.json` | `design.md`, `architecture-design.md`; approval recorded, provider/auth details remain open |
| 01-visual-design | — | `approved` | `runs/MOD-ACCOUNT-20261010-001/01-visual-design.json` | `visual-design.md`, `view-state-matrix.md`, `wireframes/*.svg`, `native-compositions.md`; user approval recorded 2026-10-10 |
| 02-domain | — | `completed (partial)` | `runs/MOD-ACCOUNT-20261010-001/02-domain.json` | `domain-model.md`; user confirmed `PlatformUser.fullName/avatarUrl` as canonical; remaining provider, avatar, catalog, cardinality and retention decisions are recorded |
| 03-access | — | `completed (partial)` | `runs/MOD-ACCOUNT-20261010-001/03-access.json` | `access-design.md`; self-only identity/security scope and active Owner/Admin Billing boundary documented; permission-key and audit decisions remain open |
| 04-api | — | `completed (partial)` | `runs/MOD-ACCOUNT-20261010-001/04-api.json` | `api-contracts.md`; shared command/query, DTO, error, consistency and event semantics documented; Auth/Billing provider decisions remain open |
| 05-sync | — | `completed (partial)` | `runs/MOD-ACCOUNT-20261010-001/05-sync.json` | `sync-design.md`; only user Preferences may queue offline; Security/Billing online-only; queue/storage and migration decisions remain open |
| 06-plan | [#32](https://github.com/minoveaz/loopdev-v2/issues/32) | `completed; approved by user` | `runs/MOD-ACCOUNT-20261010-001/06-plan.json` | `implementation-plan.md`; `runs/MOD-ACCOUNT-20261010-001/06-plan-evidence.md`; approved `delivery-ledger.json`; every missing operation/platform pair maps to a task |
| 07-build | [#33](https://github.com/minoveaz/loopdev-v2/issues/33) | `active; implementation in progress` | `runs/MOD-ACCOUNT-20261010-001/07-build.json` | Current task counts are read from `delivery-ledger.json`; operation parity remains incomplete |

## Decisions and blockers

| ID | Type | Decision/blocker | Status | Evidence |
|---|---|---|---|---|
| DEC-ACCOUNT-001-007 | Approved decisions | Scope, ownership, permissions, operations, platform parity and preference synchronization | Confirmed | `discovery.md` §10, §14 |
| DEC-ACCOUNT-008 | Billing provider / commercial and tax arrangement | LoopDev is the confirmed seller; Finance compares provider, processor vs. MoR terms, tax/invoicing obligations and commercial terms | Open for Finance review | `discovery.md` §14; `design.md` §2, §15 |
| DEC-ACCOUNT-009 | Auth session scope | User approved provider-backed sign-out of other sessions; individual device inventory/revocation is excluded | Resolved with scope change | `delivery-ledger.json`; user decision recorded in 07-build |
| DEC-ACCOUNT-010 | Detailed policies | Private user-scoped avatar storage and no automatic preference migration confirmed; avatar resolution, notification catalog, cancellation and audit policies remain open | Partial | `discovery.md` §14; `sync-design.md` |
| DEC-ACCOUNT-011 | Platform extension approval | User approved canonical profile updates and the Auth session-scope extension; Preferences/Auth factor details remain to resolve | Partial | `design.md` §15; `delivery-ledger.json` |
| DEC-ACCOUNT-012 | Buyer markets initially considered | Spain, United States and Colombia; clients may also be in other countries | Confirmed | User conversation; `design.md` §2, §15 |
| DEC-ACCOUNT-013 | Canonical profile identity | Keep existing `PlatformUser.fullName/avatarUrl` as the only authoritative fields and extend the shared contract to edit them; no separate `UserProfile` aggregate | Confirmed by user | `domain-model.md`; `design.md` §15 |
| DEC-ACCOUNT-014 | Billing seller entity and initial location | LoopDev owns the SaaS, is the seller for subscriptions and will initially operate from Spain | Confirmed by user | `discovery.md` §14; `design.md` §2, §15 |
| DEC-ACCOUNT-015 | Initial MFA method | TOTP through authenticator apps; no SMS factor | Confirmed by user | `design.md` §15; `domain-model.md` |
| PLAN-GATE-001 | Plan approval versus operation parity | Plan approval may preserve `missing` operations when each required operation/platform has explicit task coverage; strict parity is required before verification/publication | Confirmed by user | User approval on 2026-10-11; `MULTIPLATFORM_DELIVERY_CONTRACT.md`; plan ledger validation |
| VIS-ACCOUNT-005 | Native renderer/tokens | Rivera is the baseline for desktop and mobile web; iOS/Android reuse current React Native components and tokens, extending only for demonstrated gaps | Resolved by user | `visual-design.md` §1.1, §2, §4; `native-compositions.md`; `apps/mobile/theme/tokens.ts` |

## Design handoff

- **Design artifact:** `design.md` (15 sections, market comparison, reuse
  decisions, multiplatform contracts, RBAC, acceptance matrix and open
  decisions).
- **Architecture artifact:** `architecture-design.md` follows the required
  template.
- **Provider recommendation:** no provider selected. A provider-neutral
  server port is recommended while Finance reviews LoopDev's Spain launch,
  tax/invoicing responsibilities, provider terms, and whether a provider acts
  as payment processor or offers a Merchant of Record arrangement, checking
  compatibility with LoopDev's confirmed seller role. Any change to the
  seller identity requires explicit approval. The initial buyer markets
  considered are Spain, USA and Colombia, not an exclusive list.
- **Security gap:** `ACCOUNT-AUTH-HARDEN` now removes mobile Auth false-success,
  insecure native storage and permissive role fallback. Security has desktop
  and Expo renderers; provider mutation/runtime acceptance and native device
  evidence remain pending. Individual session inventory/revocation is outside
  the approved scope and must not be inferred from adapter hardening.
- **Visual gate:** `visual-design.md` and `view-state-matrix.md` are the
  normative sources; `wireframes/` contains four desktop/mobile concepts.
  `native-compositions.md` maps the proposed iOS/Android composition to the
  existing React Native catalog and identifies uncovered capabilities.
  Billing intentionally shows no fictitious plan, prices, payment methods or
  invoices. Rivera is reused for desktop/mobile web only; native tokens and
  components remain native. The user approved the conceptual package on
  2026-10-10; provider/auth/avatar specialist decisions remain open.
- **Next gate:** The approved ledger currently records 22 done, 2 in progress,
  2 ready and 11 blocked tasks. Keep Profile and Preferences native tasks
  active until per-OS device acceptance is captured; Security renderer tasks
  remain ready pending their acceptance evidence. Do not start the 11 blocked
  tasks until their recorded dependencies are resolved and the ledger marks
  them ready. Billing remains disabled and non-routable.

## Change log

| Date | Change | Run/commit | Approved by |
|---|---|---|---|
| 2026-10-10 | Recorded product decisions for four-platform MVP scope, ownership, billing permissions/actions and preference synchronization; discovery is ready for design | `MOD-ACCOUNT-20261010-001`, attempt 3 | User conversation |
| 2026-10-10 | Added Account functional/architecture proposal, official provider comparison, platform routes/operation contract and unresolved decision register; waiting for design approval before visual design | `MOD-ACCOUNT-20261010-001`, attempt 3 | User scope; approval pending |
| 2026-10-10 | Added Spain, USA and Colombia as confirmed buyer markets and refined provider availability notes; seller legal entity remains open | `MOD-ACCOUNT-20261010-001`, attempt 3 | User conversation |
| 2026-10-11 | Confirmed LoopDev as legal SaaS owner and seller entity, initially operating from Spain; provider and Finance review remain open | `MOD-ACCOUNT-20261010-001`, decision update | User conversation |
| 2026-10-10 | Recorded user's design approval; created Rivera-aligned desktop/mobile wireframes, operation/state matrix and visual reuse/accessibility source; awaiting conceptual approval of visual artifacts | `MOD-ACCOUNT-20261010-001`, `01-visual-design` | User |
| 2026-10-10 | Confirmed `PlatformUser.fullName/avatarUrl` as the canonical profile fields; completed domain and access analyses with remaining owner decisions explicit | `MOD-ACCOUNT-20261010-001`, `02-domain` and `03-access` | User |
| 2026-10-11 | Created the executable multiplatform implementation plan, audit tasks, operation-level task mapping and owner blockers; plan approval is pending and build remains gated | `MOD-ACCOUNT-20261010-001`, `06-plan` | Platform Delivery |
| 2026-10-11 | User approved separating plan approval from operation parity: retain `missing` until implementation evidence and require parity before verification/publication | `MOD-ACCOUNT-20261010-001`, `PLAN-GATE-001` | User |
| 2026-10-11 | Recorded user approval, completed `06-plan`, and prepared the `07-build` issue/handoff without starting implementation | `MOD-ACCOUNT-20261010-001`, `06-plan` → `07-build` | User |
| 2026-10-11 | Implemented and validated the shared Account navigation contract and mobile Auth hardening; kept all 25 blocked tasks and operation-parity claims unchanged | `MOD-ACCOUNT-20261010-001`, `07-build` | User-approved build scope |
| 2026-10-11 | Implemented native Profile route, profile/avatar actions and account navigation; recorded operation-level test/export evidence while keeping the task in progress until iOS/Android device acceptance | `MOD-ACCOUNT-20261010-001`, `07-build` | User-approved build scope |

## Platform impact

| Capability | Decision | Consumers | Tests affected | Migration |
|---|---|---|---|---|
| AuthPort / Tenant Context | `REUSE` + proposed `EXTEND_PLATFORM` | Topbar, protected routes, platform and product adapters | AuthPort/security/native adapter tests | Verify MFA/session operations; replace mobile false-success and insecure storage paths |
| Organization Settings | `REUSE` | `/app/settings`, SettingsAdapter, tenant context | Existing settings adapter tests | None proposed in discovery |
| Profile/preferences | `EXTEND_PLATFORM` proposed | Authenticated shell, web and native clients | No Account page or preference-sync tests found | Shared user-owned contract; appearance may remain per-device |
| Billing/subscription | `MODULE_SPECIFIC` in Billing/Finance; provider/commercial model open | Entitlements, organization billing clients | No LoopDev billing tests/contracts found | Organization-owned; Owner/Admin only; LoopDev is seller; provider-neutral port pending provider/tax review |
