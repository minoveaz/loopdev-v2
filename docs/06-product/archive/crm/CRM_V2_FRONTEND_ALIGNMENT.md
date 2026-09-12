---
title: CRM v2 frontend alignment
status: historical-reference
owner: loopdev-v2
updated: 2026-09-11
scope: frontend
---

# Alineacion historica del frontend CRM para LoopDev v2

> **Nota de estado:** este documento ya no es la fuente de estado frontend. El estado actual
> vive en `tracks/active/crm/2026-09-09-loopdev-v2-crm-frontend.md` y en
> `../../../crm/CRM_FRONTEND_CLOSURE_MATRIX.md`. Esta página conserva contratos de alineación, rutas y
> decisiones de arquitectura que siguen siendo útiles como referencia.

## Proposito

Esta es la guia de trabajo para continuar el diseño y la implementacion visual del CRM en
LoopDev v2. La documentacion fue importada desde el repositorio legacy de LoopDev y contiene
dos tipos de informacion:

- contratos, modelo de datos, Supabase, RLS y certificaciones del backend ya construido;
- especificaciones de UX, componentes y rutas que deben adaptarse a la aplicacion v2.

El backend no se reescribe en esta fase. La UI v2 consume el dominio mediante adapters y
puede cambiar de datos locales a Supabase sin reescribir las paginas.

## Referencia de ubicaciones autoritativas

| Responsabilidad | Ubicacion en v2 |
| --- | --- |
| Navegación LoopDev | `src/loopdev/navigation.ts` |
| Paginas CRM | `src/loopdev/pages/crm` |
| Componentes CRM | `src/loopdev/components` |
| Tipos y adapter CRM | `src/loopdev/domains/crm` |
| Platform foundation | `src/loopdev/domains/platform` |
| Catalog y adapter local | `src/loopdev/domains/catalog` |
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
la fase local. El adapter modela contactos, leads, Customer 360 y oportunidades; las referencias
transversales de organización, workspace, scopes y permisos viven en `PlatformAdapter`, y el
catálogo transversal vive en `CatalogAdapter`. Ninguna página accede directamente a `localStorage`.

## Fase 2 local: Platform y Catalog

La base local implementada antes del cierre CRM incluye:

- `OrganizationContext`, `EntityRef`, `EntityScope` y permisos locales reemplazables por un
  adapter futuro.
- `CatalogItem`, `Offer`, `CatalogVariant`, `PriceBook` y `PriceEntry`, con estados `draft`,
  `active` y `archived`, `key`/`sku` estables y metadata extensible.
- Visibilidad por organización y workspace: los registros compartidos tienen `workspaceId: null`
  y los registros de workspace solo aparecen en su scope autorizado.
- Fixtures multi-tenant para ejemplos genéricos de salud, tienda, SaaS y servicios. El core no
  contiene campos sectoriales; las extensiones se expresan mediante metadata.
- Opportunities compatibles hacia atrás con `productKey`, y referencias opcionales a
  `catalogItemId`, `offerId` y `variantId`. Las conversiones de Leads mantienen la normalización
  e idempotencia existentes y pueden resolver una referencia local de Catalog.

Esta fase es deliberadamente frontend-first: no instala Docker/Supabase, no crea ni ejecuta
migraciones y no conecta backend real. La frontera futura consiste en sustituir
`localPlatformAdapter`, `localCatalogAdapter` y `localLoopdevAdapter` por implementaciones
Supabase con los mismos contratos, scopes y permisos.

## Fase 3 local: cierre del CRM core

Contacts, Leads, Pipeline y Opportunities comparten contratos y adapters locales sin conectar
backend. Leads se crean desde un diálogo estándar con contacto, source/attribution y owner
local; su estado (`new`, `qualified`, `converted`, etc.) nunca se mezcla con los stages de
Pipeline y las conversiones siguen siendo idempotentes.

Opportunities admiten creación manual con `CatalogItem`, `Offer` o `Variant` cuando existen y
conservan `productKey` como fallback. Cada oportunidad tiene al menos una línea extensible,
edición local, relaciones a Contact/Lead y detalle en `AppDrawer`. Los stages locales exponen
un catálogo estable; `won` y `lost` son terminales y solo pueden reabrirse con una razón no
vacía. Cada cambio agrega un registro a un store append-only de stage history preparado para
ser proyectado por Timeline en Fase 4, sin implementar Timeline aquí.

## Rutas v2

La navegacion de la suite usa el prefijo `/app/sales-crm`:

| Superficie | Ruta v2 | Estado en v2 |
| --- | --- | --- |
| CRM overview | `/app/sales-crm/overview` | Visual implementada con datos de presentacion |
| Contacts | `/app/sales-crm/contacts` | Implementada con adapter local |
| Customer 360 | `/app/sales-crm/contacts/:contactId` | Implementada con adapter local |
| Leads | `/app/sales-crm/leads` | Implementada con adapter local |
| Pipeline | `/app/sales-crm/pipeline` | Board local con stages, concurrencia optimista, terminales y reapertura explícita |
| Opportunities | `/app/sales-crm/opportunities` | Tabla/cards local, creación manual, líneas, catálogo y detalle en drawer |
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
   compartidos sin duplicar la navegación global.
5. Cubrir en cada superficie `loading`, `empty`, `error`, `forbidden` y `success`; añadir
   `stale` o `conflict` cuando la mutacion real se conecte.

## Que se conserva de la documentacion legacy

Se conservan como referencia de backend y producto:

- contratos de entidades, comandos y errores;
- reglas de organización, membresía, permisos y aislamiento RLS;
- modelo de Customer 360, actividad, notas, tareas y oportunidades;
- criterios de privacidad, accesibilidad e idempotencia;
- fixtures y evidencia de certificación del backend.

Las recetas técnicas del producto legacy no forman parte de la arquitectura frontend v2. No deben
aparecer en rutas, páginas, componentes ni criterios de aceptación de v2.

En v2 se validan capacidades de producto, no recetas de shell. Para cada superficie se debe
comprobar directamente que existe el contenido solicitado, sus acciones autorizadas, estados,
acceso a relaciones y navegación real. Por ejemplo, Contacts debe ofrecer una tabla de contactos,
búsqueda, estados de datos y acceso a Customer 360 desde cada contacto autorizado.

No son rutas de importación para v2 los árboles `apps/loopdev-os`, `packages/contracts` o
`/api/*` descritos en esos documentos. Cuando una especificación frontend los mencione, se
interpreta como contrato de integración del backend, no como ubicación de código en este
repositorio.

## Regla de actualización

Los documentos UX, component audit, component contract, implementation plan y handoff pueden
actualizarse para reflejar el frontend v2. Los documentos `backend`, `security`, `readiness`,
`functional certification` y `closure matrix` solo deben cambiar cuando cambie la evidencia real
del backend; no se deben adaptar copiando estructuras legacy al frontend v2.
