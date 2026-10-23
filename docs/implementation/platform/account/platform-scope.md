---
platform_scope:
  desktop_web: required
  mobile_web: required
  ios: required
  android: required
status: complete
owner: Platform Delivery
---

# Platform scope

## Surface decision

The user approved desktop web, mobile web, iOS and Android for the same
operations, with platform-adapted interfaces. Shared semantics are required;
renderer parity is currently missing on native and mock-backed on web.

| Surface | In scope? | Route/runtime | Owner | Decision/evidence |
|---|---|---|---|---|
| Desktop web | Required | Authenticated LoopDev web app; current menu uses `/account/profile`, `/account/settings`, `/account/security`, `/account/billing` | Platform Delivery | User-approved scope 2026-10-10; `Topbar.tsx` and `AppRoutes.tsx` show Rivera sample destinations |
| Mobile web | Required | Responsive browser app under `AppShell`; current menu uses the same `/account/*` routes; proposed `/app/account/*` routes use `LoopdevShell` | Platform Delivery | Same web/DOM primitives and operations as desktop, responsive adaptation; no runtime URL/port used |
| iOS | Required | Expo native app; account rows exist in `MobileAccountSheet`, but native destinations and operations are missing | Platform Delivery | User-approved same operations on native; design native navigation and adaptations |
| Android | Required | Expo native app; account rows exist in `MobileAccountSheet`, but native destinations and operations are missing | Platform Delivery | User-approved same operations on native; design native navigation and adaptations |

## Shared contract decisions

| Concern | Shared source | Desktop adaptation | Mobile adaptation | Evidence |
|---|---|---|---|---|
| Domain and lifecycle | No Account capability contract exists. Auth identity/session uses `packages/contracts/src/auth-port.ts`; organization settings use `src/loopdev/domains/settings/` | Four independent capability semantics: global profile, user preferences, Auth security, organization billing | Same semantics; renderer-specific flows and native contracts remain design work | Account discovery sections 4–6 and 10 |
| Navigation and deep links | Four destinations are approved; exact native route/deep-link scheme is design work; authenticated route guard is `src/routes/ProtectedRoute.tsx` | Topbar currently links to four `/account/*` Rivera-template pages; proposal `/app/account/*` is not registered and would select `LoopdevShell` | Mobile web shares the web routes; native sheet rows currently do not navigate | `AppRoutes.tsx`, `AppShell.tsx`, `Topbar.tsx`, `MobileAccountSheet.tsx`, native `LoopdevRoutes.tsx` |
| Permissions and tenant scope | AuthPort/Tenant Context and existing SettingsAdapter | Profile/preferences/security are user-owned; only organization Owner/Admin may view/manage Billing | Same authorization semantics; native secure-storage/provider adaptations not designed | `auth-port.ts`, `src/loopdev/domains/settings/`, Multiplatform Delivery Contract |
| Offline and synchronization | User syncs language, timezone, notifications; appearance may adapt per device; billing/security require authoritative services | No current Account persistence contract | Native storage/lifecycle adaptations remain design work; do not mirror mock storage | User decisions 2026-10-10; Multiplatform Delivery Contract |

## Visual component and token decision

| Surface | Verified visual base | What is not reused | Alignment status |
|---|---|---|---|
| Desktop web | Rivera web tokens from `src/index.css`; shared `PageContainer`, `PageHeader`, `DataCard`, `Button`, `Input`, `Select`, `Switch`, `ThemeOptionCard`, feedback primitives | Template page-local storage, sample data and simulated handlers | Verified for the proposed visual composition; the Account routes themselves are still unregistered |
| Mobile web | Same React DOM components/tokens as desktop, responsive using the actual web shell breakpoints | Native React Native controls and the old `/account/*` mock page logic | Responsive web component reuse verified; runtime page behavior not implemented |
| iOS/Android | React Native renderer, existing `apps/mobile/components/ui` catalog and `apps/mobile/theme/tokens.ts`; user decision confirms no Rivera DOM/palette requirement | Web/DOM components cannot be imported into the native renderer | Native visual base is its own component set; reuse/extend existing controls where needed. `VIS-ACCOUNT-005` is resolved |

Web reuse evidence is recorded in `visual-design.md` §1.1 and §4. Native
component evidence and per-view compositions are recorded in
`visual-design.md` §1.1/§4 and `native-compositions.md`. Keep operation and
state semantics shared without forcing visual token equality.

## Deferred or unsupported surfaces

| Surface/capability | Reason | Risk | Owner | Follow-up issue |
|---|---|---|---|---|
| iOS Account operations | Required; no native Account routes; native menu rows are nonfunctional | Native operations are missing; secure storage and provider flows require design | Platform Delivery + Platform capability owners | Create implementation issues after design |
| Android Account operations | Required; no native Account routes; native menu rows are nonfunctional | Same semantics, secure storage and navigation need explicit native adaptation | Platform Delivery + Platform capability owners | Create implementation issues after design |
| Billing provider/lifecycle | Billing ownership and operations are approved; no provider/customer/entitlement contract exists | Financial and cross-tenant data could be misrepresented or exposed | Billing/Finance owner TBD | Compare providers and define authority in design |
| Security operations beyond current AuthPort | Security actions are approved; current shared contract does not establish all MFA/session operations | False security assurances if unsupported actions are simulated | Platform Auth owner | Verify provider support and plan extensions in design |

## Discovery status

`complete`: all four platforms are required with shared operation semantics.
Implementation parity is not claimed; all account operation gaps remain to be
designed and delivered.

## Design composition decisions

| Surface | Profile | Preferences | Security | Billing | Navigation |
|---|---|---|---|---|---|
| Desktop web | Rivera shared page/card/form primitives in LoopDev's proposed `/app` shell | `DataCard`, `Select`, `ThemeOptionCard`, `Switch` | Shared input/dialog components; real AuthPort outcomes | Shared card/empty-state components; provider neutral | Proposed `/app/account/*`; redirect old `/account/*` only after route/guard implementation |
| Mobile web | Same DOM components, one-column layout and min 44px touch hit area | Same sync semantics; selects/options reflow | Same AuthPort states | Same Owner/Admin policy and pending states | Shared web routes and responsive shell |
| iOS | Reuse `MobilePageContainer`, `MobilePageHeader`, `MobileCard`, `MobileAvatar`, `MobileInput`, `MobileButton` and native tokens; safe area/back | `MobileSelectSheet`/native switches with the same preference IDs | Native reauth/factor only with secure storage and supported provider | Native safe handoff under same tenant scope | Native route/deep link; no destination currently |
| Android | Reuse `MobilePageContainer`, `MobilePageHeader`, `MobileCard`, `MobileAvatar`, `MobileInput`, `MobileButton` and native tokens; system back | `MobileSelectSheet`/native switches with the same preference IDs | Native reauth/factor only with secure storage and supported provider | Native safe handoff under same tenant scope | Native route/deep link; no destination currently |

Adaptations may change layout, keyboard/touch affordances and OS pickers, but
not operation IDs, lifecycle, ownership, permission or accessible meaning.
For mobile web, interactive controls must keep at least a 44 CSS px hit area;
native controls must meet platform touch guidance. Web control components may
need a padding/min-height wrapper where their default visual height is smaller.
Native Security and Billing remain blocked for implementation until the
current mobile Auth adapter's false-success and storage/role gaps are resolved.
