# Platform Account Architecture and Design

## Document control

| Field | Value |
|---|---|
| Module | Platform Account surfaces: Profile, Preferences, Security, Billing |
| Product definition | User-approved scope in `discovery.md` §10; no approved product doc exists |
| Run ID | `MOD-ACCOUNT-20261010-001` |
| Track | Not created; implementation issues/tracks deferred to `module-plan` |
| Design checkpoint | `runs/MOD-ACCOUNT-20261010-001/01-design.json` |
| Owner | Platform Delivery; Auth and Billing owners pending |
| Status | `draft`; review/approval pending |

## Target architecture

### Context and boundaries

- Suite and bounded context: Platform shell entry point; Profile/Preferences are user-scoped shared capabilities, Security is Auth-owned, Billing is organization-scoped Billing/Finance.
- Owned responsibilities: Account navigation and renderer composition only; each capability's domain/adapter owns its own operations.
- Explicitly out of scope: organization settings/membership, account deletion, mock/sample billing, credentials in Profile, and provider-specific rules before provider approval.
- Public routes and entry points: proposed `/app/account/{profile,settings,security,billing}` under LoopDev shell; protected redirects from current `/account/*`; native destinations in `apps/mobile/LoopdevRoutes.tsx`.
- Consuming modules: authenticated shell and other modules consuming identity/preferences/entitlements.
- Consumed Platform capabilities: AuthPort, Tenant Context, Settings, theme/i18n/notification hooks, Files/storage if approved, common UI and route guards.

### Layer map

| Layer | Responsibilities | Files/areas | Allowed dependencies | Forbidden dependencies |
|---|---|---|---|---|
| Presentation | Render four surfaces, route/deep-link, states, accessibility | `src/loopdev/pages/`, common UI, `apps/mobile/components/` | Application use cases and shared contracts | Provider SDKs, storage or authorization rules in components |
| Application | Orchestrate reads/mutations, reauth, pending/conflict handling | Proposed Platform/Billing hooks and use cases | Domain and ports | Rivera mock pages; direct DB/provider operations from UI |
| Domain | Profile/preferences ownership; Auth lifecycle; Billing lifecycle/entitlements | Shared Platform/Auth/Billing domains | Contracts and pure rules | React, route and renderer details |
| Ports/contracts | Stable operation IDs, DTOs, errors, states, permission and platform semantics | `packages/contracts/src/` (proposed) | Domain and application | Platform-only action catalogs or one renderer's assumptions |
| Adapters/infrastructure | Supabase Auth, secure native storage, preference persistence/sync, Billing provider/webhooks | `src/loopdev/domains/platform/adapter/`, `apps/mobile/adapters/`, backend | Ports/contracts | UI-owned persistence; fake success; cross-tenant provider secrets |

### Dependency direction

```text
Presentation → Application → Domain → Ports → Adapters
```

Document any exception, its reason and its owner:

| Exception | Reason | Risk | Approval | Follow-up |
|---|---|---|---|---|
| Current Account URLs use `/account/*` but `AppShell` chooses Rivera shell outside `/app/*` | Keep old paths as protected redirects to `/app/account/*` so LoopDev pages render in LoopDev shell | Temporary routing compatibility | Proposed; approval pending | Route and direct-link tests in build |

## Responsibility matrix

| Concern | Authoritative owner | Consumers | Must not contain | Evidence |
|---|---|---|---|---|
| UI rendering | Platform frontend/mobile | Account page renderers | Provider/business logic | Current routes render Rivera pages / native rows are nonfunctional |
| Use cases/orchestration | Capability owners (Profile/Prefs, Auth, Billing) | Web/native renderers | Route components | No shared Account use cases yet |
| Domain rules/invariants | User Profile/Preferences, Auth provider, Billing/Finance | Account renderers, other suite consumers | Renderer-local mutation rules | Profile/Billing contracts absent |
| Persistence | Platform Profile/Preferences adapter; Auth provider; Billing backend/provider | Shared ports | Component localStorage | Native adapter has non-secure storage fallback |
| API/transport | Platform API/Auth/Billing owners | Web/mobile adapters | Components and Rivera templates | Billing backend/provider adapter absent |
| Authorization/tenant scope | Server/Auth/RLS using trusted subject and membership | All clients | Client role or hidden links | Mobile maps non-superadmin users to admin |
| Synchronization/conflicts | Preferences sync owner; remote Auth/Billing provider | All clients | Component-local flags | No preferences sync contract; no offline Security/Billing writes |
| Shared Platform capability | Platform owner | CRM/ERP/Workspace clients | Account-specific duplicate contracts | Profile/Preferences/Auth contract extensions unapproved |

## Module and Platform contracts

| Capability | `REUSE` / `EXTEND_PLATFORM` / `MODULE_SPECIFIC` / `BLOCKED` | Contract | Consumers | Duplicate prohibited? |
|---|---|---|---|---|
| Shell/routes | `REUSE` | `AppShell`, `LoopdevShell`, `ProtectedRoute`, `Topbar` | Desktop web and mobile web | Yes; no parallel shell/menu |
| Identity/session/tenant | `REUSE` + proposed `EXTEND_PLATFORM` | `AuthPort`, `TenantContextPort`; extend operations only after capability verification | Web/native and suite modules | Yes; no page-local identity/session rules |
| Profile/preferences | Proposed `EXTEND_PLATFORM` | `PlatformUser`, current theme/i18n/notification hooks are partial | Web/native and suite modules | Yes; no separate web/mobile stores |
| Organization Settings | `REUSE` | Settings domain/adapter at `/app/settings` | Platform shell | Yes; no duplicate org/member controls |
| Billing | `MODULE_SPECIFIC` in Billing/Finance; Account is a renderer | No current Billing contract; future server Billing port | Organization/entitlement consumers | Yes; no Account-local subscription source |
| Shared UI/Files | `REUSE`; avatar may need `EXTEND_PLATFORM` | `PageContainer`, `FormSection`, `SettingsCard`, common UI, Files exports | Account renderers | Yes; no parallel primitives/uploader |

## Structural quality baseline

- [x] Cohesion and coupling risks identified: Account must remain a renderer, not merge Profile/Auth/Billing domains.
- [x] SRP risks identified: no provider or business logic in pages, hooks, Topbar or native sheet.
- [x] Duplicate implementations searched for: Rivera mock pages, Platform Settings, web/mobile auth/preferences reviewed; remove mock flows during approved implementation.
- [x] Public contracts and dependency direction documented as proposals in `design.md`.
- [x] Domain/application behavior is independently testable by the proposed shared ports.
- [x] Tenant, authorization and synchronization boundaries documented; server authority required.
- [ ] Residual technical debt has an owner and issue: mobile auth/storage/role gaps need owners and implementation issues after visual/design approval.

## Refactoring records

| ID | Reason | Behavior preserved | Files/consumers | Risk | Before evidence | After evidence | Rollback | Residual debt |
|---|---|---|---|---|---|---|---|---|
| `ARCH-ACCOUNT-001` | Replace mock destinations without changing identity/tenant ownership | Preserve auth shell, protected behavior, user vs organization ownership | Account routes, native navigation, capability renderers | Medium | `discovery.md` §11; current routes/adapters | Pending visual/build | Feature flag routes; do not fallback to mock mutations | Mobile Auth false successes/role mapping remain blocking debt |

## Open decisions and deviations

| ID | Decision or deviation | Status | Impact | Approver | Resolution/follow-up |
|---|---|---|---|---|---|
| `DEC-ACCOUNT-008` | Billing provider / commercial and tax arrangement | `open` | Provider architecture, commercial terms, tax/invoicing and portal/native parity | Product + Finance | LoopDev is the confirmed seller. Keep the adapter provider-neutral; Finance compares payment-processor and MoR offerings for LoopDev's initial Spain launch and verifies domicile, fees, tax/invoicing responsibilities and contract terms |
| `DEC-ACCOUNT-009` | Per-session inventory/revocation is not available as a supported user operation | `resolved_with_scope_change` | Use only sign-out-other-sessions; do not show fake device rows | User | Supabase `signOut({ scope: "others" })`; no direct internal-table mutation |
| `DEC-ACCOUNT-010` | Profile/preferences/catalog, cancellation and audit lifecycle | `open` | Detailed domain/API/sync policies | Product + capability owners | Resolve in specialist phases after visual approval |
| `DEC-ACCOUNT-011` | Profile/Preferences and AuthPort Platform extensions | `open` | Shared capability ownership and platform impact | Platform owner | Explicit approval and consumer impact review |
| `DEC-ACCOUNT-014` | LoopDev owns the SaaS, is its subscription seller and will initially operate from Spain | `confirmed` | Provider onboarding, precise legal domicile and tax/invoicing obligations need Finance review | User | Evaluate provider eligibility and terms for LoopDev operating from Spain; preserve LoopDev's confirmed seller role unless the user explicitly approves a change |
