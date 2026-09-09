---
title: CRM v2 frontend alignment
status: active
owner: loopdev-v2
updated: 2026-09-09
scope: frontend
---

# Alineacion del frontend CRM para LoopDev v2

## Proposito

Esta es la guia de trabajo para continuar el diseño y la implementacion visual del CRM en
LoopDev v2. La documentacion fue importada desde el repositorio legacy de LoopDev y contiene
dos tipos de informacion:

- contratos, modelo de datos, Supabase, RLS y certificaciones del backend ya construido;
- especificaciones de UX, componentes y rutas que deben adaptarse a la aplicacion v2.

El backend no se reescribe en esta fase. La UI v2 consume el dominio mediante adapters y
puede cambiar de datos locales a Supabase sin reescribir las paginas.

## Fuente autoritativa actual

| Responsabilidad | Ubicacion en v2 |
| --- | --- |
| Shell y navegación LoopDev | `src/loopdev/LoopdevShell.tsx`, `src/loopdev/navigation.ts` |
| Paginas CRM | `src/loopdev/pages/crm` |
| Componentes CRM | `src/loopdev/components` |
| Tipos y adapter CRM | `src/loopdev/domains/crm` |
| Primitives compartidos | `src/components/common`, `src/components/ui` |
| Documentacion de producto | `docs/06-product/crm` |

Las paginas no acceden directamente a Supabase. El flujo esperado es:

```text
Pagina CRM
  -> hook de dominio
    -> adapter CRM
      -> backend Supabase
```

Mientras se completa la conexion de v2, `localLoopdevAdapter` es la implementacion activa para
la fase visual. El adapter ya modela contactos, leads, Customer 360, oportunidades, tareas,
notas y timeline con `organizationId`, estados parciales y permisos por seccion.

## Rutas v2

La navegacion de la suite usa el prefijo `/app/sales-crm`:

| Superficie | Ruta v2 | Estado en v2 |
| --- | --- | --- |
| CRM overview | `/app/sales-crm/overview` | Visual implementada con datos de presentacion |
| Contacts | `/app/sales-crm/contacts` | Implementada con adapter local |
| Customer 360 | `/app/sales-crm/contacts/:contactId` | Implementada con adapter local |
| Leads | `/app/sales-crm/leads` | Implementada con adapter local |
| Pipeline | `/app/sales-crm/pipeline` | Ruta de suite preparada; UI de dominio pendiente |
| Opportunities | `/app/sales-crm/opportunities` | Ruta de suite preparada; UI de dominio pendiente |
| Tasks | `/app/sales-crm/tasks` | Ruta de suite preparada; UI de dominio pendiente |
| Communications | `/app/sales-crm/communications` | Ruta de suite preparada; UI pendiente |

Las rutas `/sales-crm/*` sin `/app` pertenecen a la documentacion y al producto legacy. En
especificaciones de frontend v2 deben escribirse siempre como `/app/sales-crm/*`.

## Prioridad visual

1. Consolidar el lenguaje visual existente de LoopDev: `PageContainer`, `PageHeader`, `DataCard`,
   tablas, filtros, estados vacios, badges, paginacion y responsive.
2. Completar Contacts y Customer 360 antes de ampliar el modelo de interacciones.
3. Llevar Leads al mismo nivel visual que Contacts, manteniendo su contrato de dominio.
4. Diseñar Pipeline, Tasks y Communications como nuevas superficies v2, reutilizando primitives
   compartidos sin copiar el shell.
5. Cubrir en cada superficie `loading`, `empty`, `error`, `forbidden` y `success`; añadir
   `stale` o `conflict` cuando la mutacion real se conecte.

## Que se conserva de la documentacion legacy

Se conservan como referencia de backend y producto:

- contratos de entidades, comandos y errores;
- reglas de organización, membresía, permisos y aislamiento RLS;
- modelo de Customer 360, actividad, notas, tareas y oportunidades;
- criterios de privacidad, accesibilidad e idempotencia;
- fixtures y evidencia de certificación del backend.

No son rutas de importación para v2 los árboles `apps/loopdev-os`, `packages/contracts` o
`/api/*` descritos en esos documentos. Cuando una especificación frontend los mencione, se
interpreta como contrato de integración del backend, no como ubicación de código en este
repositorio.

## Regla de actualización

Los documentos UX, component audit, component contract, implementation plan y handoff pueden
actualizarse para reflejar el frontend v2. Los documentos `backend`, `security`, `readiness`,
`functional certification` y `closure matrix` solo deben cambiar cuando cambie la evidencia real
del backend; no se deben adaptar copiando estructuras legacy al frontend v2.
