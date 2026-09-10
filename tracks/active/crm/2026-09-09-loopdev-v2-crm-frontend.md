---
id: loopdev-v2-crm-frontend
title: CRM y capacidades transversales para LoopDev v2
status: active
created: 2026-09-09
updated: 2026-09-10
owner: loopdev-v2
lead: User
branch: develop
branches: []
phase: 3
pull_requests: []
issues: [2]
packages: []
release: internal-product
areas: [frontend, platform, crm, communications, ux]
dependencies:
  - loopdev-v2-monorepo-multitenancy
blocked_by: []
supersedes: []
---

# CRM y capacidades transversales para LoopDev v2

## Outcome

Construir el CRM completo de LoopDev v2 sobre adapters locales y capacidades Platform
reutilizables, dejando las páginas, contratos y reglas preparados para sustituir el adapter
local por Supabase como última fase, sin reescribir la UI.

El trabajo es frontend-first. La persistencia real se conectará después mediante adapters,
sin reescribir las páginas ni crear una API paralela desde el navegador. Las capacidades
transversales de trabajo —Tasks, Notes, Activities y Timeline— se diseñan como Platform
capabilities reutilizables por CRM y por las futuras suites de LoopDev, aunque su primera
implementación y fixtures se validen dentro de CRM.

## Fuente de verdad

- Alineación frontend: `docs/06-product/crm/CRM_V2_FRONTEND_ALIGNMENT.md`
- Documentación de producto: `docs/06-product/crm`
- Páginas CRM: `src/loopdev/pages/crm`
- Componentes de dominio: `src/loopdev/components`
- Dominio y adapters: `src/loopdev/domains/crm`
- Primitives compartidos: `src/components/common` y `src/components/ui`

## Estado actual

Implementado como base visual:

- CRM Overview.
- Contacts con tabla, búsqueda, ordenación y paginación local de presentación.
- Customer 360 dentro del detalle de Contact.
- Leads con datos del adapter local.

La documentación de producto de Contacts y Leads sigue siendo la fuente de requisitos. La base
visual no se considera implementación funcional completa mientras falten contratos de query,
paginación por cursor, permisos y mutaciones autorizadas.

Implementado localmente en la Fase 4:

- Pipeline y Opportunities con adapter local, filtros, mutaciones y drawers responsive.
- Contacts y Leads con drawers globales, estados y contratos de ciclo comercial separados.
- Frontera documentada para reemplazar el adapter local por Supabase sin reescribir páginas.
- Contratos Platform independientes para Tasks, Notes, Activities, Timeline, Attachments y
  Notifications, reutilizables fuera de CRM.
- Adapters/stores locales aislados por `EntityScope`, con CRUD, filtros, optimistic versioning,
  idempotencia local y Timeline append-only deduplicado.
- Bandeja de Tasks CRM demostrable en `/app/sales-crm/tasks`, además de paneles reutilizables
  dentro de Customer 360. El workspace técnico `/app/platform/workspace` fue retirado para
  evitar duplicar la superficie operativa del CRM.

Supabase, Storage, RLS, Auth real y migraciones siguen pendientes de una fase de backend posterior.

## Alcance funcional del CRM

El track cubre las siguientes superficies y capacidades de CRM:

### Entidades comerciales

- [x] CRM Overview.
- [x] Contacts: tabla, búsqueda, filtros, cursor local, creación, edición, archivado y
  drawer responsive.
- [x] Customer 360 inicial para Contact.
- [x] Leads: tabla/cards, vistas, filtros, selección, preview, estados y conversión.
- [x] Pipeline: board Kanban de Opportunities y movimientos de etapa.
- [x] Opportunities: tabla/cards, filtros, ordenación y detalle en drawer.
- [ ] Contact detail enriquecido con relaciones, Notes, Tasks y Timeline.
- [ ] Lead detail/workspace con actividad, atribución y relaciones.
- [ ] Opportunity detail completo con historial, actividad y relaciones.
- [ ] Creación manual de Leads y Opportunities.
- [ ] Reapertura explícita de Opportunities terminales.
- [ ] Stage configuration y catálogo de productos preparado para organización/workspace.
- [ ] Opportunity lines con referencias a CatalogItem, Offer y Variant.

### Operación comercial

- [x] Tasks y vista My Day local (lista/workspace y filtros Platform; agrupación avanzada pendiente).
- [x] Notes contextuales con privacidad local.
- [x] Activities de negocio local.
- [x] Timeline unificado y deduplicado local.
- [x] Attachments de Contact, Lead, Opportunity, Task y Note mediante referencias Platform
  (uploader visual local).
- [x] Notifications in-app local para asignaciones y cambios relevantes; canales externos
  pendientes.
- [ ] Comments y mentions cuando exista una necesidad colaborativa validada.
- [ ] Import/export y operaciones masivas autorizadas.
- [ ] Search CRM y filtros guardables.
- [ ] Tags y clasificación transversal.
- [ ] Custom fields mediante configuración, sin builders prematuros.
- [ ] Auditoría visible donde corresponda y audit log interno separado.
- [ ] Automatizaciones CRM iniciales basadas en eventos y acciones.

El adapter activo durante esta fase es `localLoopdevAdapter`. El backend Supabase, sus
contratos, RLS, permisos y migraciones se mantienen como referencia de integración y no
se duplican en este track.

## Capacidades Platform transversales

Estas capacidades no pertenecen exclusivamente a CRM. CRM será el primer consumidor, pero los
contratos deben permitir su uso posterior en Projects, Support, Documents, Operations y la
aplicación móvil.

### Platform foundation

- **Organization context:** organización activa, workspace, brand, tenant y contexto de sesión.
- **Identity and membership:** usuario, membresía, roles, estado de membresía y usuarios asignables.
- **Permissions and capabilities:** permisos de lectura, escritura, asignación, administración y
  acceso a datos sensibles.
- **Entity references:** referencias polimórficas `entityType + entityId` con scope autorizado.
- **Entity relationships:** relaciones entre entidades, cardinalidad, tipo de relación y ownership.
- **Reference data:** países, ciudades, monedas, idiomas, timezone, documentos, géneros, productos
  y catálogos configurables.
- **Catalog:** catálogo transversal de ofertas comerciales, independiente de CRM y extensible
  para servicios de salud, comercio, SaaS, servicios profesionales y productos físicos.
- **Catalog items:** elemento comercial base con `key`, `sku`, tipo, categoría y estado.
- **Offers:** condiciones comerciales, modelo de cobro, moneda, unidad y vigencia.
- **Variants:** variantes por talla, modalidad, cobertura, plan o configuración.
- **Price books and entries:** listas de precios y precios vigentes sin acoplarlos a CRM.
- **Catalog visibility:** disponibilidad por organización, workspace, brand o canal autorizado.

### Work and collaboration

- **Tasks:** trabajo accionable, asignación, prioridad, vencimiento, lifecycle y versionado.
- **Notes:** contenido contextual, autoría, visibilidad `private/team/organization` y privacidad.
- **Comments:** conversación colaborativa separada de Notes.
- **Mentions:** menciones de usuarios y futura notificación.
- **Activities:** eventos funcionales visibles, no equivalentes a auditoría.
- **Timeline:** read model append-only compuesto y deduplicado por `sourceType:sourceId`.
- **Audit:** eventos internos de seguridad, cambios sensibles y cumplimiento, separados del Timeline.
- **Attachments:** archivos, versiones, asociación a entidades, permisos y futura Storage.
- **Notifications:** inbox in-app, preferencias, eventos y futuros canales email/push/WhatsApp.

### Data and extensibility

- **Search:** búsqueda por entidad y búsqueda global autorizada.
- **Saved filters/views:** filtros persistentes por usuario y organización.
- **Tags:** clasificación reutilizable por organización, workspace y entidad.
- **Custom fields:** definiciones, valores, visibilidad y obligatoriedad configurables.
- **Import/export:** CSV, validación, deduplicación, progreso, errores y reintentos.
- **Automations:** triggers, condiciones, acciones, ejecuciones e idempotencia.
- **Localization:** locale, timezone, moneda, formatos y traducciones.
- **Entitlements:** capacidades habilitadas por organización y futura relación con billing.

Todas las capacidades se desarrollarán inicialmente con contratos TypeScript, adapters locales,
stores deterministas y fixtures. Ninguna página accederá directamente a `localStorage`,
Supabase o tablas de dominio.

## Fases

### Fase 1 — Consolidar la base visual CRM

**Estado:** Completada en `feature/crm-v2-foundation`

- [x] Revisar Overview, Contacts, Leads y Customer 360 contra el lenguaje visual v2.
- [x] Homogeneizar headers, tablas, filtros, badges, estados vacíos y paginación.
- [x] Cubrir estados `loading`, `empty`, `error`, `forbidden` y `success` según la capacidad de cada superficie.
- [x] Mantener Customer 360 en `/app/sales-crm/contacts/:contactId`.
- [x] Evitar acceso directo a Supabase desde páginas y componentes.

**Evidencia:** Los hooks CRM ahora exponen `loading`, `error` y `reload`; Contacts,
Leads y Customer 360 renderizan estados vacíos y errores recuperables; `DataCard`
centraliza la presentación de errores; y la validación de la rama pasa lint,
typecheck, 193 tests y build.

### Contacts UI-1: lista autoritativa

**Estado:** Completada en `f095352`

- [x] Actualizar el contrato del adapter a `items`, `nextCursor` y `hasMore`.
- [x] Añadir `organizationId`, `query`, `cursor` y `limit` al contrato de consulta.
- [x] Implementar búsqueda con debounce y estado `q` en URL.
- [x] Sustituir la paginación numérica local por navegación basada en cursor.
- [x] Mantener únicamente filtros respaldados por el contrato real.
- [x] Cubrir `loading`, `empty`, `error`, `forbidden` y `success`.
- [x] Mantener el acceso desde cada fila a `/app/sales-crm/contacts/:contactId`.
- [x] Crear tests separados de adapter, hook, estados y navegación a Customer 360.

**Alcance:** Solo lectura y navegación. Creación, edición, merge, exportación, bulk actions y
Customer 360 enriquecido quedan fuera de esta unidad.

### Siguiente unidad — Contacts UI-2: creación y edición

**Estado:** Implementada; cierre visual pendiente

1. **Contrato del adapter**
   - [x] Añadir `createContact(input)` y `updateContact(contactId, patch, expectedUpdatedAt)`.
   - [x] Definir respuestas para éxito, validación, permisos, conflicto `409` y error de servidor.
   - [x] Simular creación, edición y conflictos en `localLoopdevAdapter`.

2. **Formulario CRM**
   - [x] Crear `ContactForm` y `ContactFormDrawer` responsive.
   - [x] Incluir identidad, canales, organización y dirección como base real de CRM.
   - [x] Exigir al menos email o teléfono y mostrar errores por campo.

3. **Crear contacto**
   - [x] Activar el botón `New contact`.
   - [x] Ejecutar `createContact` y cubrir edición, envío, éxito y validación en el formulario.
   - [x] Diferenciar visualmente `forbidden`, conflicto `409` y error de servidor.
   - [x] Cerrar el drawer y recargar la primera página al finalizar.

4. **Editar contacto**
   - [x] Añadir una acción de edición por fila.
   - [x] Cargar los datos existentes en el formulario.
   - [x] Enviar `expectedUpdatedAt`.
   - [x] Recargar la lista tras una actualización exitosa.
   - [x] Confirmar el cierre del drawer cuando existen cambios sin guardar.
   - [x] Añadir `archiveContact` como operación de archivado suave con `expectedUpdatedAt`.
   - [x] Añadir campos personales contractuales al formulario: documento, fecha de nacimiento y género.

5. **Tests separados**
   - [x] Cubrir creación, edición, validación y estados de submit.
   - [x] Cubrir permisos, errores de servidor, conflicto `409` y archivado en el adapter local.
   - [x] Cubrir restauración de foco.
   - [x] Cubrir actualización de la lista tras una mutación desde la página.

### Cierre visual de Contacts

**Estado:** Completada localmente; Customer 360 enriquecido queda en una fase posterior

- [x] Mostrar los campos disponibles del modelo CRM en el formulario y Customer 360.
- [x] Crear una representación mobile semántica de la lista.
- [x] Completar restauración de foco y pruebas de accesibilidad.
- [x] Añadir tests de integración del formulario y del refresco tras mutaciones.
- [x] Mostrar explícitamente el estado archivado en el detalle.

**Fuera de UI-2:** Customer 360 enriquecido, merge, exportación, bulk actions, filtros avanzados,
owner y lifecycle stage.

### Fase 2 — Platform foundation local y Catalog

**Estado:** Completada localmente — sin backend, migraciones ni Supabase

- [x] Mantener Reference Data detrás de un adapter transversal.
- [x] Crear `OrganizationContext`, `EntityRef`, scope y permisos locales.
- [x] Crear contratos Platform independientes de CRM.
- [x] Crear `CatalogItem`, `Offer`, `CatalogVariant`, `PriceBook` y `PriceEntry`.
- [x] Crear `CatalogAdapter` y stores locales deterministas.
- [x] Soportar tipos `physical_product`, `service`, `subscription`, `coverage`, `package`,
  `digital_product` y `fee`.
- [x] Mantener `key`/`sku` estables y separar nombre visible, precio y operación.
- [x] Añadir visibilidad por organización/workspace sin crear reglas sectoriales en el núcleo.
- [x] Preparar extensiones verticales para healthcare, commerce, SaaS y servicios profesionales
  mediante metadata y fixtures genéricos, sin campos sectoriales en el core.
- [x] Preparar contratos para web y futura aplicación móvil.
- [x] Cubrir aislamiento lógico entre organizaciones en los adapters locales.

**Evidencia local:** `src/loopdev/domains/platform` aporta el contexto de organización,
`EntityRef`, scopes y permisos detrás de `PlatformAdapter`. `src/loopdev/domains/catalog`
aporta contratos, fixtures multi-tenant, stores y `CatalogAdapter`; el adapter local solo
devuelve registros visibles para la organización/workspace solicitado. CRM conserva `productKey`
y además persiste/resuelve `catalogItemId`, `offerId` y `variantId` cuando están disponibles.
La futura frontera Supabase queda en el adapter: no se instalaron servicios, no se ejecutaron
migraciones y ninguna página accede a `localStorage`.

### Fase 3 — Cerrar el CRM core

**Estado:** Completada localmente — backend Supabase y capacidades de Fase 4 permanecen fuera

- [x] Implementar board Kanban de Opportunities en `/app/sales-crm/pipeline`.
- [x] Implementar tabla/cards responsive de Opportunities en
  `/app/sales-crm/opportunities`.
- [x] Reutilizar `AppDrawer` para el detalle responsive.
- [x] Compartir adapter, store local y concurrencia optimista entre Pipeline y
  Opportunities.
- [x] Completar mobile semántico, accesibilidad y estados archivados de Contacts.
- [ ] Completar Contact detail, relaciones y Customer 360 enriquecido.
- [x] Añadir captura y creación manual de Leads.
- [x] Añadir Lead detail/workspace, atribución y assignment local.
- [x] Añadir creación manual de Opportunities.
- [x] Añadir reapertura explícita de `won`/`lost` con razón y permiso elevado.
- [x] Añadir historial de cambios de etapa y relación con Timeline.
- [x] Reemplazar progresivamente `productKey` libre por referencias de CatalogItem, Offer y Variant.
- [x] Añadir Opportunity Lines, inicialmente con soporte de una línea y después multi-línea.
- [x] Alinear stages configurables/locales y estados de error con el contrato local; price books y paginación avanzada quedan para el adapter futuro.
- [x] Cubrir tests de adapter y páginas para creación, terminales, reapertura, líneas, conversión y navegación/detalle.

### Fase 4 — Tasks, Notes, Activities y Timeline

**Estado:** Completada localmente — Supabase pendiente

- [x] Implementar Tasks con relaciones polimórficas a Contact, Lead, Opportunity y futuras
  entidades mediante `EntityRef`.
- [x] Implementar Notes con visibilidad `private`, `team` y `organization`, autoría y
  permisos explícitos.
- [x] Implementar Activities como eventos de negocio, separados del audit log.
- [x] Implementar Timeline como read model transversal, append-only y deduplicado por
  `sourceType:sourceId`.
- [x] Mantener el límite de Audit Events: no se mezclan en el Timeline local; el audit log
  persistente y sus políticas quedan pendientes de backend.
- [x] Integrar las cuatro capacidades con Contact, Lead, Opportunity y Customer 360 mediante
  referencias y paneles Platform reutilizables.
- [x] Crear Tasks list/workspace local usando el contrato Platform, con tabla operativa,
  filtros, ordenación, acciones de lifecycle, vistas `All tasks`, `My tasks`, `Urgent &
  overdue` y calendario mensual.
- [x] Sustituir relaciones CRM hardcoded por un `CRMRecordPicker` alimentado desde Contacts,
  Leads y Opportunities mediante sus hooks de dominio.
- [x] Añadir edición de Tasks desde `AppDrawer`, asignación condicionada por permisos y
  control de concurrencia optimista por `version`.
- [x] Añadir catálogo local de Task Templates con administración por organización, CRUD,
  archivado/restauración y aplicación desde el formulario de Tasks. La administración se
  accede desde Tasks y no aparece como entrada independiente del sidebar.
- [x] Reutilizar `AppDrawer`, `DataCard`, `EmptyState`, `LoadingState` y primitives de
  `src/components/ui`; no se copiaron páginas ni mocks de Rivera.
- [x] Cubrir estados loading, empty, forbidden, conflict, stale (versión) y pending en la
  frontera de adapter/hooks/UI, además de tests del picker, vistas, edición y templates.

### Fase 5 — Attachments, Notifications y colaboración

**Estado:** Completada localmente para Attachments/Notifications — proveedores reales pendientes

- [x] Implementar Attachments con asociación polimórfica, metadatos, estado local y límites
  visuales; Storage real queda detrás del adapter.
- [x] Implementar Notifications in-app locales con estado unread/read/archived y mark-as-read.
- [ ] Implementar Comments y Mentions solo donde exista una necesidad validada.
- [x] Preparar notificaciones para asignaciones y cambios de Tasks; vencimientos, menciones y
  cambios de etapa de proveedores reales quedan pendientes.
- [x] Dejar Storage, email, push y proveedores reales detrás del adapter sin instalar servicios.

### Fase 6 — Search, Tags, Custom Fields e Import/Export

**Estado:** Completada localmente — persistencia remota y búsqueda global real pendientes

- [x] Implementar búsqueda CRM reutilizable y preparada para búsqueda global.
- [x] Implementar saved views y filtros persistentes.
- [x] Implementar Tags y EntityTags.
- [x] Preparar Custom Fields con visibilidad y requiredness por organización.
- [x] Implementar import/export local con validación, deduplicación y resultados por fila.
- [x] Implementar bulk actions solo sobre comandos respaldados por contrato.
- [x] Exponer las operaciones en `/app/sales-crm/operations`; la pantalla usa el adapter
  local y queda preparada para cambiar a Supabase sin modificar la composición.
- [x] Mantener la validación de tipos, requiredness y opciones de Custom Fields en el
  contrato de mutación.
- [ ] Conectar búsqueda global, persistencia Supabase, RLS y asociación de Custom Field
  Values dentro de los formularios de Contacts, Leads y Opportunities.

### Fase 7 — Automations, entitlements y certificación local

**Estado:** Pendiente

- [ ] Implementar eventos, triggers y acciones CRM iniciales.
- [ ] Añadir idempotencia y execution log local.
- [ ] Preparar entitlements por organización sin conectar billing real.
- [ ] Completar accesibilidad, responsive, error recovery y visual review.
- [ ] Ejecutar suite completa de typecheck, lint, tests y build.
- [ ] Actualizar contratos, handoffs, matrices y evidencia de cierre.

### Fase 8 — Communications y extensiones verticales

**Estado:** Pendiente

- [ ] Definir Communications como suite visual independiente dentro de LoopDev.
- [ ] Diseñar inbox, conversaciones, estados de lectura, filtros y panel contextual.
- [ ] Mantener la relación contextual con Contact, Lead, Opportunity y Customer 360.
- [ ] Separar claramente la UI de canales reales, proveedores y credenciales.
- [ ] Usar fixtures o adapter local hasta conectar el backend existente.
- [ ] Definir extensiones `healthcare`, `commerce`, `saas` y `services` sin contaminar Catalog core.
- [ ] Healthcare: coberturas, servicios, elegibilidad, beneficiarios y reservas.
- [ ] Commerce: inventario, almacenes, fulfillment, devoluciones y órdenes.
- [ ] SaaS: planes, seats, usage, suscripciones y entitlements.
- [ ] Services: recursos, duración, modalidad, reservas y entrega.

### Fase 9 — Documentación y frontera Supabase

**Estado:** Pendiente — última fase local

- [ ] Actualizar todos los contratos con los modelos Platform definitivos.
- [ ] Definir el mapping de `expectedUpdatedAt` a `version`.
- [ ] Definir el mapping de probabilidad local `0..1` al formato legacy `0..100`.
- [ ] Definir interfaces del adapter Supabase para CRM, Platform y Catalog.
- [ ] Definir envelopes, errores, paginación, idempotencia y scopes.
- [ ] Preparar mapeos de Auth, organización, workspace, membership y permisos.
- [ ] Preparar mappings de CatalogItem, Offer, Variant, PriceBook, PriceEntry y OpportunityLine.
- [ ] Mantener las páginas sin cambios al sustituir el adapter local.
- [ ] No ejecutar migraciones, RLS, seeds, Auth real ni endpoints Supabase en esta fase.

### Fase 10 — Integración progresiva con Supabase

**Estado:** Futuro

- [ ] Implementar el adapter Supabase para los contratos ya existentes.
- [ ] Conectar queries y mutaciones sin cambiar las composiciones visuales.
- [ ] Validar aislamiento multi-tenant, permisos y estados de error.
- [ ] Validar Catalog y CRM con organizaciones, workspaces, price books y permisos reales.
- [ ] Retirar datos locales solo cuando cada flujo tenga persistencia real validada.

## Rutas v2

| Superficie | Ruta | Estado |
| --- | --- | --- |
| CRM overview | `/app/sales-crm/overview` | Implementada |
| Contacts | `/app/sales-crm/contacts` | Implementada |
| Customer 360 | `/app/sales-crm/contacts/:contactId` | Implementada |
| Leads | `/app/sales-crm/leads` | Implementada |
| Pipeline | `/app/sales-crm/pipeline` | Implementada con adapter local |
| Opportunities | `/app/sales-crm/opportunities` | Implementada con adapter local |
| Tasks / Platform workspace | `/app/sales-crm/tasks` | Implementada localmente con tabla, vistas y calendario |
| Task Templates | `/app/sales-crm/task-templates` | Implementada localmente; acceso contextual desde Tasks |
| CRM Operations | `/app/sales-crm/operations` | Implementada localmente con Search, Views, Tags, Custom Fields e Import/Export |
| Communications | `/app/sales-crm/communications` | Pendiente |

## Fuera de alcance

- Rehacer el backend Supabase, migraciones, RLS o contratos ya existentes.
- Crear microservicios o una API REST paralela.
- Implementar ahora la aplicación móvil.
- Activar proveedores reales de email, WhatsApp u otros canales sin una integración aprobada.
- Implementar billing, marketing automation o módulos SaaS no relacionados con estas superficies.

## Criterios de cierre

- [ ] Las superficies CRM actuales tienen una composición visual consistente en v2.
- [x] Pipeline y Opportunities tienen diseño y estados documentados para la fase local.
- [x] Platform Catalog tiene contratos, adapter local y referencias desde CRM.
- [x] Tasks, Notes, Activities y Timeline tienen contrato transversal y estados documentados.
- [x] Platform foundation tiene contexto de organización, EntityRef y permisos locales.
- [x] Attachments y Notifications tienen adapters locales y contratos reutilizables.
- [x] Search, Tags, Custom Fields e Import/Export tienen alcance y comandos definidos
  para el adapter local.
- [ ] Automations y entitlements tienen límites explícitos.
- [ ] Todas las páginas usan `/app/sales-crm/*` y el shell actual de LoopDev.
- [ ] La UI consume datos mediante hooks, servicios y adapters.
- [ ] La integración Supabase sustituye al adapter local sin reescritura de páginas.
- [ ] Los estados de permisos, errores, privacidad y aislamiento están cubiertos.
- [ ] Tests, typecheck, build y lint pasan.
- [ ] El issue GitHub asociado está enlazado y la evidencia final está registrada.

## Auditoría Rivera: reutilización y límites Platform

La implementación conserva la separación documentada en `docs/architecture/ownership.md`:

- **Reutilización Rivera/shared:** `src/components/common`, `src/components/ui`,
  `AppDrawer`, estados de `DataCard`, primitives de formulario, tokens visuales y shell
  compartido. Rivera sirve como referencia visual, pero no se copian páginas, features ni
  fixtures.
- **Propiedad Platform/LoopDev:** `src/loopdev/domains/platform` contiene los contratos
  `TaskRecord`, `NoteRecord`, `ActivityRecord`, `TimelineEvent`, `AttachmentRecord` y
  `NotificationRecord`, sus stores locales y el adapter reemplazable. `src/loopdev/components`
  contiene los widgets controlados por props/hooks y la ruta de workspace.
- **Regla de dependencia:** Platform no importa `src/template/rivera`, `useLocalStore` ni
  mocks de Rivera. CRM solo aporta `EntityRef` de sus registros; el acceso a datos sigue
  pasando por adapters/hooks.
- **Frontera futura:** el mapeo a tablas, Storage, Auth, RLS y permisos Supabase está
  preparado en `EntityScope`, `EntityRef`, `version`, `visibility` y `permissions`, pero no
  se conecta en esta fase.

## Evidencia de Fase 4 (local)

- Contratos y adapter: `src/loopdev/domains/platform/types.ts`,
  `src/loopdev/domains/platform/adapter/work.ts`,
  `src/loopdev/domains/platform/adapter/local.ts`.
- Stores aislados: `src/loopdev/domains/platform/data/localWork.ts`.
- Hooks/UI: `src/loopdev/domains/platform/hooks/use-platform-work.ts` y
  `src/loopdev/components/platform`.
- Integración CRM: `Customer360PlatformSection`, `/app/sales-crm/overview` y
  `/app/sales-crm/tasks`.
- Notifications globales: menú de campana en `Topbar`, conectado al adapter Platform local.
- Attachments: uploader visual y metadata local; Storage real permanece detrás del adapter.
- Sin Supabase, Docker, migraciones, RLS ni Auth real.

## Issue GitHub

Issue de seguimiento: `minoveaz/loopdev-v2#2`.
