# Platform Auth and Tenant Context Discovery

## Document control

| Field | Value |
|---|---|
| Module | Auth & Tenant Context |
| Suite | Platform |
| Run ID | `MOD-AUTH-20260914-001` |
| User request | Inicio de fase 00-discovery con benchmark comparativo de funcionalidades para Platform Auth |
| Product definition | `docs/implementation/platform/auth/HANDOFF.md` y `tracks/active/platform/2026-09-09-loopdev-v2-monorepo-multitenancy.md` |
| Discovery status | `complete` |
| Owner | Platform Delivery |

## Problem and objective

- **Business problem:** LoopDev v2 opera actualmente con identidades y sesiones simuladas (`use-auth.tsx` con almacenamiento local y datos estáticos como `local-development-user` y `local-development-organization`). Mientras tanto, el backend PostgreSQL/Supabase ya posee esquemas multi-tenant y políticas Row Level Security (RLS) que dependen estrictamente de `auth.uid()`, `public.organization_memberships`, `has_organization_permission` y `can_access_workspace`. Esto bloquea la conexión de backend de Notes y CRM, además de exponer al sistema a fugas de tenant y estados de sesión no confiables.
- **Primary objective:** Definir una capacidad neutral de plataforma para Autenticación y Contexto Multi-tenant (`AuthPort` y `TenantContextPort`), consumible por desktop web, mobile web, iOS y Android, con soporte para sesiones Supabase, persistencia segura por plataforma, selección activa de organización y workspace, y control de acceso basado en roles y permisos.
- **Success measure:** Existencia de un contrato neutral inyectable (`packages/contracts`), adapters desacoplados para web y mobile (sin dependencias directas de browser en contratos ni llaves privilegiadas expuestas), suite de pruebas unitarias cubriendo escenarios de login, logout, sesión expirada, cambio de organización y aislamiento estricto de tenant (0 cross-tenant data leakage).
- **Explicit boundary:** Esta fase descubre, analiza y compara funcionalidades de la industria; no aplica migraciones en producción, no expone credenciales ni modifica la UI definitiva antes de las compuertas de diseño aprobadas.

## Actors and outcomes

| Actor | Job to be done | Outcome | Permissions/constraints |
|---|---|---|---|
| Usuario Plataforma | Iniciar sesión mediante email/contraseña y recuperar acceso | Sesión autenticada con token renovable y acceso a su tenant | Requiere cuenta activa y verificación según política |
| Miembro Multitenant | Trabajar en diferentes organizaciones o marcas sin colisión | Conmutar entre organizaciones/workspaces accesibles | Aislamiento estricto vía RLS; sin acceso cruzado |
| Usuario Móvil | Mantener sesión persistente y segura en su dispositivo | Experiencia nativa sin re-autenticación constante | Almacenamiento seguro por plataforma (SecureStore / Keystore) |
| Administrador de Tenant | Gestionar pertenencia y roles de usuarios | Permisos aplicados en cliente y reforzados en servidor | Control basado en `organization_memberships` |
| Adaptadores de Dominio (CRM, Notes, Files) | Resolver `userId`, `organizationId`, `workspaceId` y permisos | Contexto inyectado en cada mutación y query sin hardcoding | Contexto inmutable durante la ejecución de la petición |

## Expected domain capabilities

| Capability | Classification | Expected behavior | Priority |
|---|---|---|---|
| Shared AuthPort Contract | `PLATFORM_EXTENSION` | Interfaz neutral en `packages/contracts` para operaciones de sesión, suscripción a eventos y ciclo de vida de autenticación. | `REQUIRED_MVP` |
| Tenant Context Contract | `REQUIRED_MVP` | Resolución de usuario activo, listado de organizaciones, conmutación de organización/workspace activa y permisos. | `REQUIRED_MVP` |
| Web Runtime Adapter (Supabase) | `REQUIRED_MVP` | Implementación con cliente Supabase Browser para web desktop y Expo Web con auto-refresh y persistencia estándar. | `REQUIRED_MVP` |
| Mobile Boundary Adapter | `REQUIRED_MVP` | Abstracción de persistencia segura para React Native/Expo sin importar APIs directas de navegador (`localStorage`). | `REQUIRED_MVP` |
| Mock/Testing Auth Adapter | `PLATFORM_REUSE` | Implementación simulada determinista para pruebas unitarias sin requerir conexión de red o credenciales en CI. | `REQUIRED_MVP` |
| Route & Action Protection | `REQUIRED_MVP` | Guardas de ruta (`ProtectedRoute`) y verificadores de permisos (`canAccessWorkspace`, `hasPermission`). | `REQUIRED_MVP` |
| Password Recovery & Reset Flow | `REQUIRED_MVP` | Solicitud de restablecimiento de contraseña, procesamiento de callback y actualización segura. | `REQUIRED_MVP` |
| SSO / OAuth Social / SAML | `REQUIRED_FOLLOW_UP` | Integración con Google, Microsoft Azure AD o SAML enterprise. | Follow-up |
| Multi-Factor Authentication (MFA / 2FA) | `REQUIRED_FOLLOW_UP` | Desafíos TOTP / SMS para cuentas privilegiadas. | Follow-up |

## Market/domain baseline & Comparative Benchmark

Para fundamentar la arquitectura de autenticación y multi-tenancy de LoopDev v2, se realiza un benchmark comparativo estructurado frente a tres plataformas representativas de la industria B2B SaaS con gestión multi-tenant:

| Criterio / Funcionalidad | Supabase Auth (Referencia de Infraestructura) | Clerk (Referencia de UX Auth & B2B Orgs) | WorkOS / Auth0 (Referencia Enterprise B2B) | LoopDev v2 (Arquitectura Objetivo) |
|---|---|---|---|---|
| **Estrategia Multi-tenancy** | Basado en RLS con tabla relacional de membresías (`organization_memberships`) y `auth.uid()`. | Organizations nativas en JWT claims con conmutación de tenant en frontend. | Multi-tenant Directory Sync & Organization context por subdominio o header. | **Pool Architecture + RLS**: `organization_id` canónico resuelto en base a membresía del usuario; contexto inyectado en adaptadores. |
| **Persistencia de Sesión** | Web: `localStorage` / cookies. Móvil: Adaptador inyectable (`AsyncStorage` / `expo-secure-store`). | Web: Cookies seguras / memory. Móvil: SDK con Secure Enclave. | Token storage seguro en keychain/keystore. | **Plataforma Aislada**: Web vía storage estándar; móvil vía `SecureStoragePort` neutral sin acoplamiento a DOM. |
| **Jerarquía de Tenant** | Plana (User ↔ Org) extensible con esquemas propios (`organizations` → `workspaces` → `brands`). | User → Organization → Roles. | Enterprise Organization → Workspaces / Projects. | **Spine Corporativo**: `User` → `Organization` → `Workspace` → `Brand` (soporta Holding corporativo y Single-Brand). |
| **Manejo de Permisos (RBAC)** | Funciones PostgreSQL (`has_organization_permission`) evaluadas en RLS. | Permisos granulares como claims en sesión y verificadores frontend (`<Protect>`). | Scopes RBAC y FGA (Fine-Grained Authorization). | **Híbrido Consistente**: Permisos calculados en servidor para RLS; snapshot de permisos expuesto al cliente para renderizado condicional. |
| **Recuperación de Contraseña** | Magic Link o código OTP con redirección a URL de callback. | Flow integrado con pantalla interactiva de reseteo. | Email con token firmado efímero. | **Flujo canónico**: Solicitud de reseteo → enlace seguro de callback → vista controlada de nueva contraseña → sesión renovada. |
| **Invalidez y Concurrencia** | Revocación de refresh token y cleanup de sesión en base de datos. | Invalidación instantánea por webhooks/websockets. | Sesión revocable centralizada por SCIM. | **Limpieza estricta**: En logout, purga inmediata de tokens, tenant context activo y colas de mutación locales pendientes. |

### Conclusiones del Benchmark para LoopDev v2:
1. **No inventar un protocolo de autenticación propio:** Adoptar los estándares de sesión de Supabase Auth (JWT access token con rotación automática de refresh token).
2. **Desacoplar la UI de la infraestructura:** Definir `AuthPort` y `TenantContextPort` en `packages/contracts` para que componentes como `ProtectedRoute`, `Topbar`, `Sidebar` y los adaptadores CRM/Notes no interactúen directamente con el SDK de Supabase.
3. **Manejo explícito de la conmutación de organización:** Al cambiar de organización o cerrar sesión, todas las cachés locales y estados de módulos deben limpiarse atómicamente para prevenir fugas de datos entre tenants (*zero cross-tenant leakage*).
4. **Soporte nativo sin código duplicado:** Mantener una única máquina de estados de autenticación con adaptadores de persistencia específicos para navegador y móvil.

## Entities, relationships and lifecycle

| Entity | Owner | Relationships | States | Invariants |
|---|---|---|---|---|
| `AuthSession` | Platform Auth | Pertenece a `User`; contiene tokens y metadatos de expiración | `authenticated`, `unauthenticated`, `refreshing`, `expired` | Token válido requerido para estados autenticados |
| `UserIdentity` | Platform Auth | Mapea con `auth.users`; referencia única del actor | `active`, `suspended`, `pending_verification` | `id` UUID global inmutable |
| `Organization` | Platform Tenancy | Posee Workspaces, Brands y recursos de negocio | `active`, `inactive`, `suspended` | `id` UUID requerido en todas las tablas de negocio |
| `OrganizationMembership` | Platform Tenancy | Vincula `User` con `Organization` asignando rol | `active`, `invited`, `suspended` | Un usuario puede tener N membresías; cada una con rol explícito |
| `Workspace` | Platform Tenancy | Pertenece a una `Organization` | `active`, `archived` | Requiere pertenecer al `organization_id` padre |

## Inputs, outputs and events

### Inputs
- Credenciales: Email y contraseña normalizados.
- Comandos: `signInWithPassword`, `signOut`, `requestPasswordReset`, `updatePassword`, `selectOrganization`, `selectWorkspace`.
- Tokens y callbacks: Código o token temporal de recuperación de contraseña.

### Outputs
- Estado de autenticación reactivo (`onAuthStateChange`).
- Objeto de contexto tenant inmutable para consumidores de plataforma:
  ```ts
  {
    userId: string | null;
    organizationId: string | null;
    workspaceId: string | null;
    brandId: string | null;
    membershipStatus: "active" | "pending" | "suspended" | null;
    permissions: readonly string[];
  }
  ```
- Errores normalizados: `invalid_credentials`, `session_expired`, `user_not_found`, `forbidden`, `network_error`.

### Events

| Event | Producer | Consumers | Payload/invariants |
|---|---|---|---|
| `auth.signed_in` | AuthPort | AppShell, TenantContext, Navigation | `userId`, `email`, timestamp |
| `auth.signed_out` | AuthPort | Storage, AppCache, Router | Motivo del cierre (`user_action`, `session_expired`) |
| `tenant.switched` | TenantContextPort | CRM, Notes, Communications, Adapters | `previousOrgId`, `currentOrgId`, `workspaceId` |
| `auth.session_refreshed` | AuthPort | Transport Client, Adapters | Nuevo access token y tiempo de expiración |

## Integration & Platform boundary

- `packages/contracts`: Ubicación canónica para `auth-port.ts` y `tenant-context.ts`.
- `src/hooks/use-auth.tsx`: Evoluciona para consumir `AuthPort` y exponer el estado reactivo unificado a la app web.
- `src/routes/ProtectedRoute.tsx`: Evalúa la sesión real provista por `AuthPort` e intercepta usuarios no autenticados o sin organización activa.
- `apps/mobile`: Implementa el adapter consumiendo la misma interfaz neutral mediante almacenamiento seguro compatible con Expo/React Native.
