# Platform Auth and Tenant Context Architecture and Design

## Document control

| Field | Value |
|---|---|
| Module | Auth & Tenant Context |
| Product definition | `docs/implementation/platform/auth/HANDOFF.md` |
| Run ID | `MOD-AUTH-20260914-001` |
| Track | LoopDev v2 Monorepo & Multi-tenancy |
| Design checkpoint | `runs/MOD-AUTH-20260914-001/01-design.json` |
| Owner | Platform Delivery |
| Status | `draft` |

## Target architecture

### Context and boundaries

- **Suite and bounded context:** Platform Auth & Tenant Context, que provee identidad, sesión y contexto de organización a todas las suites (CRM, Platform Notes, Files, Communications).
- **Owned responsibilities:**
  - Autenticación mediante email/contraseña y recuperación de cuenta.
  - Gestión de sesión reactiva (tokens, expiración, rotación de refresh tokens).
  - Resolución del contexto de tenant activo (`organizationId`, `workspaceId`, `brandId`).
  - Catálogo de membresías y roles (`owner`, `admin`, `editor`, `viewer`).
  - Tratamiento del rol **Super Admin / Platform Owner** para acceso y visualización global de organizaciones.
  - Estrategia de recuperación de contraseña adaptable (con servidor de correo real o en modo desarrollo/testing sin SMTP).
  - Purgado atómico de cachés locales en logout o cambio de organización para garantizar cero fugas de datos (*zero cross-tenant data leakage*).
- **Explicitly out of scope:**
  - Lógica de negocio específica de CRM, Notes o Files.
  - Modificación de esquemas de producción o reseteo destructivo de Supabase.
  - Almacenamiento directo de contraseñas en frontend.

### Layer map

| Layer | Responsibilities | Files/areas | Allowed dependencies | Forbidden dependencies |
|---|---|---|---|---|
| Presentation | Formularios de login/recuperación, selector de organización en Topbar, modal móvil | `src/pages/Login.tsx`, `Topbar.tsx`, `apps/mobile/...` | Hooks de aplicación (`useAuth`, `useTenantContext`) | SDK directo de Supabase en vistas |
| Application | Orquestación de sesión, suscripción a eventos de auth, conmutación de tenant y purga de cachés | `src/hooks/use-auth.tsx`, `src/hooks/use-tenant-context.tsx` | Contratos (`AuthPort`, `TenantContextPort`) | Almacenamiento acoplado a DOM en móvil |
| Domain | Modelos de usuario, sesión, organización, workspace, permisos y roles | Contratos TypeScript en `packages/contracts/src/auth-port.ts` | Tipos puros de TypeScript | Frameworks de UI o dependencias de red |
| Ports/contracts | Interfaces canónicas neutrales para desktop web, mobile web, iOS y Android | `packages/contracts/src/auth-port.ts` | None | Imports de `src/` o `apps/mobile/` |
| Adapters/infrastructure | Cliente de Supabase Web, storage adapter seguro para móvil y mock testing adapter | `src/loopdev/domains/platform/adapter/auth-supabase.ts`, `apps/mobile/adapters/auth.ts` | `AuthPort`, `TenantContextPort`, SDK Supabase | UI components |

### Dependency direction

```text
Presentation → Application → Domain / Ports ← Adapters / Infrastructure
```

## Critical Architecture Decisions

### 1. Rol Super Admin / Owner Global (`DEC-AUTH-003`)

- **Necesidad:** Permitir a usuarios designados como Super Admin o Platform Owners ver y gestionar todas las organizaciones del sistema sin saltarse las políticas de seguridad.
- **Mapeo en Base de Datos & RLS:**
  - Se vincula a nivel de `public.organization_memberships` con rol `'owner'`, o mediante claim seguro en `app_metadata` (`is_super_admin: true`).
  - Las políticas RLS y funciones como `has_organization_permission` permiten acceso total cuando el claim o la membresía `'owner'` está presente.
- **Mapeo en TenantContextPort:**
  - Para usuarios estándar, `listOrganizations()` retorna únicamente las organizaciones donde tienen membresía activa.
  - Para el Super Admin (`isSuperAdmin: true` o rol `'owner'` global), `listOrganizations()` retorna **todas las organizaciones existentes en el sistema**.
  - En la interfaz, el Super Admin conmutará de organización en el selector del Topbar. **La aplicación siempre opera con un `organization_id` activo en contexto**, lo que asegura que las consultas y mutaciones de CRM, Notes, etc., siempre viajen con el tenant explícito correcto.

### 2. Flujo de Recuperación de Contraseña sin Servidor de Correo SMTP (`DEC-AUTH-004`)

- **Contexto:** En etapas iniciales de desarrollo o entornos donde aún no está configurado un proveedor SMTP saliente (Resend/SendGrid):
  - **Desarrollo local (Docker / CLI):** Supabase enruta automáticamente los correos a **Inbucket** (`http://localhost:54324/`), permitiendo verificar los enlaces de reseteo instantáneamente.
  - **Entorno remoto (`loopdev-platform-dev`):** Supabase ofrece una cuota de correos por defecto para pruebas.
  - **Estrategia Frontend (`AuthPort`):**
    - `requestPasswordReset(email)` invoca la API estándar de Supabase.
    - Si el servicio de correo no está disponible o falla el transporte, el adapter captura el error de forma segura y expone un código amigable (`email-service-unavailable`), sin romper la aplicación.
    - Se habilita un mecanismo para que durante desarrollo se puedan emitir tokens de recuperación administrativos mediante CLI (`supabase auth admin reset-password-for-email`) o mediante enlace de callback manual.
    - El formulario y ruta de actualización de contraseña (`updatePassword`) quedan plenamente implementados listos para procesar el callback cuando el servidor de correo esté conectado formalmente.

### 3. Aislamiento y Purga Atómica de Estado (*Zero Cross-Tenant Leakage*) (`DEC-AUTH-005`)

- Al invocar `signOut()` o al conmutar de organización mediante `selectOrganization(orgId)`:
  1. Se actualiza el `tenantContext` inmutable.
  2. Se invalidan las consultas cacheadas en React Query (`queryClient.clear()`).
  3. Se reinician los adaptadores en memoria y colas locales de mutación.
  4. Se redirige al dashboard/launchpad de la nueva organización.

## Responsibility matrix

| Concern | Authoritative owner | Consumers | Must not contain | Evidence |
|---|---|---|---|---|
| UI rendering | Web components & Mobile screens | Rutas protegidas, AppShell | Llamadas directas al SDK de Supabase o credenciales | Rivera shell & login surfaces |
| Use cases/orchestration | `useAuth`, `useTenantContext` | Toda la aplicación | Estado de módulos de negocio (CRM, etc.) | React context providers |
| Domain rules/invariants | `AuthPort` y `TenantContextPort` | Adaptadores web, móvil y tests | Tipos dependientes de DOM o Node | `packages/contracts/src/auth-port.ts` |
| Persistence | Local storage / Secure storage | `AuthPort` adapters | Tokens sensibles expuestos en texto plano inseguro | Web/Mobile auth adapters |
| Authorization / Tenant scope | RLS en Postgres + Contexto en servidor | Adaptadores de datos | Verificaciones de seguridad solo en cliente | `public.organization_memberships` |

## Module and Platform contracts

| Capability | Decision | Contract | Consumers | Duplicate prohibited? |
|---|---|---|---|---|
| Session Management | `EXTEND_PLATFORM` | `AuthPort` | `useAuth`, `ProtectedRoute` | Sí; una sola fuente de sesión |
| Tenant Context | `REQUIRED_MVP` | `TenantContextPort` | CRM, Notes, Files, Communications | Sí; un solo resolvedor de tenant |
| Role & Permissions | `REQUIRED_MVP` | `AuthPermissions` | Navegación, guardas de acción | Sí; sincronizado con RLS |

## Open decisions and deviations

| ID | Decision or deviation | Status | Impact | Approver | Resolution/follow-up |
|---|---|---|---|---|---|
| `DEC-AUTH-003` | Super Admin / Owner multi-org access | Approved | Acceso global conmutado por selector de tenant | User | Documentado en architecture design |
| `DEC-AUTH-004` | Password recovery sin SMTP | Approved | Fallback seguro y soporte para dev/testing | User | Documentado en architecture design |
| `DEC-AUTH-005` | Purga atómica de datos en tenant switch | Approved | Cero fugas de información entre organizaciones | Platform Delivery | Implementar en TenantContextPort |
