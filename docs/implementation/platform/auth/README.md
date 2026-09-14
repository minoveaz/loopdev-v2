# Platform Auth and Tenant Context Implementation

## References

- Product definition: `docs/implementation/platform/auth/HANDOFF.md`
- Track: `tracks/active/platform/2026-09-09-loopdev-v2-monorepo-multitenancy.md`
- Run ID: `MOD-AUTH-20260914-001`
- Multiplatform contract: `docs/03-platform/governance/MULTIPLATFORM_DELIVERY_CONTRACT.md`
- Platform scope: `platform-scope.md`
- Platform evidence: `platform-evidence-matrix.md`

## Current status

| Field | Value |
|---|---|
| Status | `in_progress` |
| Current phase | `00-discovery` |
| Branch | `feature/crm-v2-foundation` |
| Checkpoint | `00-discovery` |
| Last evidence | `docs/implementation/platform/auth/discovery.md` |

## Scope

### Platform scope

| Surface | Scope | Owner | Evidence |
|---|---|---|---|
| Desktop web | `required` | Platform Delivery | Web auth, ProtectedRoute, Topbar tenant switch |
| Mobile web | `required` | Platform Delivery | Mobile web shell, session boundary |
| iOS | `planned` | Platform Delivery | Neutral `SecureStoragePort` boundary |
| Android | `planned` | Platform Delivery | Neutral `SecureStoragePort` boundary |

### Included

- Contrato neutral `AuthPort` y `TenantContextPort` en `packages/contracts`.
- Supabase Auth Browser adapter para web y Expo Web.
- Contexto multi-tenant estricto con resolución de `userId`, `organizationId`, `workspaceId` y permisos RBAC.
- Flujo de login, logout, recuperación de contraseña y actualización de sesión.
- Purgado de datos y colas locales en logout/conmutación de tenant (cero fugas de datos).
- Implementación de pruebas con mocks deterministas para CI.

### Excluded

- Modificación destructiva de la base de datos de desarrollo.
- Implementación de proveedores SSO/SAML externos en esta fase.
- Modificación del backend de Notes (se reanudará una vez Auth esté verificado).

## Phase index

| Phase | Status | Checkpoint | Evidence |
|---|---|---|---|
| 00-discovery | `completed` | `docs/implementation/platform/auth/runs/MOD-AUTH-20260914-001/00-discovery.json` | `discovery.md`, `delivery-ledger.json` |
| 01-design | `pending` | - | - |
| 01-visual-design | `pending` | - | - |
| 02-domain | `pending` | - | - |
| 03-access | `pending` | - | - |
| 04-api | `pending` | - | - |
| 05-sync | `pending` | - | - |
| 06-plan | `pending` | - | - |
| 07-build | `pending` | - | - |
| 08-verify | `pending` | - | - |
| 09-review | `pending` | - | - |
| 10-git | `pending` | - | - |

## Decisions and blockers

| ID | Type | Decision/blocker | Status | Evidence |
|---|---|---|---|---|
| `AUTH-BLOCK-DESIGN` | Blocker | Canonical design and visual design are not approved | Active | Gate design requerida |
| `DEC-AUTH-001` | Decision | Adoptar Supabase Auth con JWT rotativo y RLS enforcement | Approved | Benchmark en `discovery.md` |
| `DEC-AUTH-002` | Decision | Contrato neutral `AuthPort` desacoplado de DOM/SDK en packages/contracts | Approved | Handoff y Discovery |
