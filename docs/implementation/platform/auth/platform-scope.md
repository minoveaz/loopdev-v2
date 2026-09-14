---
platform_scope:
  desktop_web: required
  mobile_web: required
  ios: planned
  android: planned
status: draft
owner: Platform Delivery
---

# Platform scope

## Surface decision

| Surface | In scope? | Route/runtime | Owner | Decision/evidence |
| --- | --- | --- | --- | --- |
| Desktop web | Yes | `/pages/login`, `/launchpad`, `/app/*` | Platform Delivery | Web application authenticated routes and tenant selector |
| Mobile web / Expo Web | Yes | Mobile web shell & auth modal | Platform Delivery | Browser-based mobile execution consuming neutral contract |
| iOS | Planned | `apps/mobile` (Expo Native) | Platform Delivery | Planned native build; requires secure storage abstraction |
| Android | Planned | `apps/mobile` (Expo Native) | Platform Delivery | Planned native build; requires secure storage abstraction |

## Shared contract decisions

| Concern | Shared source | Desktop adaptation | Mobile adaptation | Evidence |
| --- | --- | --- | --- | --- |
| Domain and lifecycle | `packages/contracts/src/auth-port.ts` | Browser runtime adapter | Mobile runtime adapter | `AuthPort` and session events |
| Navigation and deep links | `packages/contracts/src/navigation.ts` | React Router web routes | Expo Router mobile routes | Redirect on unauthenticated |
| Permissions and tenant scope | `packages/contracts/src/auth-port.ts` | Server-evaluated RLS + client context | Server-evaluated RLS + client context | `TenantContextPort` |
| Offline and synchronization | `packages/contracts/src/auth-port.ts` | Browser storage | Secure storage boundary | Token refresh & purge on logout |

## Deferred or unsupported surfaces

| Surface/capability | Reason | Risk | Owner | Follow-up issue |
| --- | --- | --- | --- | --- |
| iOS / Android Native Binaries | Entornos nativos en fase de planificación en el track multiplatform | Bajo; se preserva la frontera mediante `SecureStoragePort` neutral | Platform Delivery | `MOD-PLATFORM-MOBILE-001` |
| Social OAuth / Enterprise SAML | Requiere configuración de proveedores y dominios en consola Supabase | Medio; se abordará como follow-up tras consolidar Email/Password | Platform Delivery | `MOD-PLATFORM-AUTH-SSO` |
