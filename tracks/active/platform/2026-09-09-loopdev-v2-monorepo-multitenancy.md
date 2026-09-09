---
id: loopdev-v2-monorepo-multitenancy
title: Evolución de LoopDev v2 hacia monorepo SaaS multi-tenant
status: active
created: 2026-09-09
updated: 2026-09-09
owner: platform
branch: null
areas:
  - architecture
  - crm
  - database
  - multi-tenancy
  - supabase
dependencies: []
blocked_by: []
supersedes: []
phase: 1
pull_requests: []
issues: []
packages: []
release: not-required
---

# Evolución de LoopDev v2 hacia monorepo SaaS multi-tenant

## Outcome

Convertir LoopDev v2 en la aplicación web inicial de una plataforma SaaS multi-tenant,
preparada para compartir contratos, módulos y datos con una futura aplicación móvil,
manteniendo durante la primera fase el foco en la construcción visual y funcional del CRM.

La migración arquitectónica debe ser incremental. No se debe bloquear el avance de la UI
del CRM esperando a que estén terminados el monorepo, la base de datos o la aplicación móvil.

## Estado inicial

- LoopDev v2 es actualmente una aplicación React/Vite independiente.
- El CRM utiliza un adapter con datos locales, que debe conservarse mientras se desarrolla
  la superficie visual.
- La autenticación actual es provisional y no constituye todavía la fuente de verdad del
  producto.
- No existe todavía una estructura monorepo dentro de este repositorio.
- Supabase será la plataforma prevista para Auth, PostgreSQL, RLS, Storage y funciones
  server-side.

## Principios

- La UI actual se conserva como prioridad inmediata.
- La migración a monorepo será incremental y no implicará copiar código entre aplicaciones.
- Web y móvil consumirán los mismos contratos, dominio y backend, pero tendrán superficies
  visuales propias.
- Toda entidad de negocio pertenecerá a una organización mediante `organization_id`.
- La seguridad multi-tenant se aplicará con RLS; ocultar datos en la UI no es una medida de
  seguridad.
- Las páginas no accederán directamente a Supabase: usarán queries, servicios y adapters
  del dominio.
- Las claves privilegiadas y la lógica que requiera secretos solo vivirán en Edge Functions
  o en infraestructura server-side.
- No se crearán microservicios ni una API paralela mientras Supabase cubra correctamente el
  caso de uso.

## Fases

### Fase 1 — CRM visual y fronteras de dominio

**Estado:** En curso

Objetivo: avanzar en la experiencia del CRM sin depender todavía de persistencia real.

- [ ] Completar las vistas visuales principales de CRM.
- [ ] Consolidar el Customer 360, contactos, leads, oportunidades, tareas y timeline.
- [ ] Mantener los datos locales detrás del adapter existente.
- [ ] Evitar que las páginas y componentes conozcan detalles de almacenamiento.
- [ ] Definir estados de carga, vacío, error, permisos y datos no disponibles.
- [ ] Documentar los contratos de dominio que la UI necesita.
- [ ] Identificar componentes reutilizables para el futuro design system.

### Fase 2 — Preparación de la estructura monorepo

**Estado:** Pendiente

Objetivo: convertir la aplicación actual en una aplicación dentro de una estructura capaz
de alojar web, móvil, paquetes compartidos y módulos de dominio.

Estructura objetivo inicial:

```text
apps/
  web/                 # LoopDev v2
  mobile/              # Futuro cliente móvil

packages/
  contracts/           # Tipos, schemas y eventos compartidos
  sdk/                 # Cliente de acceso a backend
  auth/                # Abstracciones de sesión y permisos
  config/              # Configuración compartida

modules/
  crm/
  organizations/
  activity/
  billing/

supabase/
  migrations/
  functions/
  seed.sql
```

- [ ] Definir la estrategia de migración del repositorio actual.
- [ ] Separar claramente aplicación, paquetes, módulos e infraestructura.
- [ ] Configurar pnpm workspaces y Turbo solo cuando existan al menos dos superficies
  o paquetes reales que lo justifiquen.
- [ ] Mantener una migración reversible y evitar un cambio masivo de imports sin necesidad.
- [ ] Establecer reglas de dependencias entre `apps`, `packages`, `modules` y `supabase`.

### Fase 3 — Fundación multi-tenant y base de datos

**Estado:** Pendiente

Objetivo: establecer la fuente de verdad persistente y el aislamiento entre organizaciones.

- [ ] Crear migraciones de organizaciones, perfiles y membresías.
- [ ] Definir roles y permisos por organización.
- [ ] Crear el modelo persistente inicial del CRM.
- [ ] Añadir `organization_id`, auditoría y timestamps a las entidades de negocio.
- [ ] Configurar políticas RLS para lecturas y mutaciones.
- [ ] Configurar seeds y Supabase local para desarrollo.
- [ ] Generar tipos TypeScript desde el esquema de base de datos.
- [ ] Mantener datos demo separados de los datos persistentes.

Modelo inicial previsto:

```text
auth.users
organizations
organization_members
profiles

crm_contacts
crm_leads
crm_opportunities
crm_tasks
crm_notes
activity_events
```

### Fase 4 — Sustitución progresiva del adapter local

**Estado:** Pendiente

Objetivo: conectar el CRM a Supabase sin reescribir las pantallas.

- [ ] Implementar `supabaseLoopdevAdapter`.
- [ ] Mantener `localLoopdevAdapter` para desarrollo visual y fallback controlado.
- [ ] Conectar las lecturas mediante TanStack Query.
- [ ] Conectar mutaciones con invalidación y estados de error explícitos.
- [ ] Migrar autenticación provisional a Supabase Auth.
- [ ] Añadir pruebas de permisos y aislamiento por organización.
- [ ] Retirar los datos locales únicamente cuando la persistencia real cubra el flujo.

### Fase 5 — Cliente móvil y paquetes compartidos

**Estado:** Futuro

Objetivo: permitir que la aplicación móvil consuma el mismo backend y los mismos contratos.

- [ ] Crear `apps/mobile` cuando exista una primera funcionalidad aprobada.
- [ ] Compartir contratos, validaciones, permisos y SDK.
- [ ] Compartir tokens de diseño, no componentes web literalmente.
- [ ] Definir navegación y componentes específicos para móvil.
- [ ] Mantener web y móvil como clientes independientes del mismo backend multi-tenant.

## Arquitectura objetivo

```text
apps/web
  └── CRM visual y aplicación principal

apps/mobile
  └── Futuro cliente móvil

packages/contracts
  └── Tipos, schemas y eventos

packages/sdk
  └── Acceso tipado a Supabase y Edge Functions

modules/crm
  └── Reglas y contratos de negocio del CRM

supabase
  ├── Auth
  ├── PostgreSQL
  ├── RLS
  ├── Storage
  └── Edge Functions
```

Flujo de datos esperado:

```text
Página CRM
  -> Hook de query/mutation
    -> Servicio del dominio
      -> Adapter
        -> Supabase
```

## Fuera de alcance de la fase actual

- Crear la aplicación móvil ahora.
- Implementar todos los módulos del SaaS.
- Migrar inmediatamente todos los datos locales.
- Crear microservicios.
- Crear una API REST duplicada para cada consulta CRUD.
- Implementar facturación completa.
- Integrar proveedores externos de comunicación.
- Bloquear el trabajo visual del CRM hasta terminar la base de datos.

## Criterios de cierre del track

- [ ] LoopDev v2 vive dentro de una estructura monorepo documentada.
- [ ] Web y móvil pueden compartir contratos y backend sin duplicar reglas de negocio.
- [ ] El modelo de organizaciones y membresías está implementado.
- [ ] RLS impide el acceso cruzado entre organizaciones.
- [ ] CRM tiene persistencia real en Supabase.
- [ ] La UI CRM consume datos mediante adapters/servicios y no mediante consultas directas
  desde las páginas.
- [ ] La autenticación ya no depende de sesiones simuladas en `localStorage`.
- [ ] La arquitectura permite añadir la aplicación móvil sin duplicar el backend.
- [ ] El track se cierra únicamente con aprobación explícita y evidencia de validación.
