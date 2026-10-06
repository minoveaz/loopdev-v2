---
id: loopdev-v2-crm-frontend
title: CRM y capacidades transversales para LoopDev v2
status: active
created: 2026-09-09
updated: 2026-09-11
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

Este documento es la fuente autoritativa del estado frontend actual de CRM y Communications
en LoopDev v2. Los documentos de producto y handoffs anteriores se conservan como contrato,
contexto histórico o frontera backend, pero no sustituyen este estado.

- Matriz única de cierre: `docs/06-product/crm/CRM_FRONTEND_CLOSURE_MATRIX.md`
- Documentación de producto: `docs/06-product/crm`
- Documentación de Communications: `docs/06-product/communications`
- Páginas CRM: `src/loopdev/pages/crm`
- Componentes de dominio: `src/loopdev/components`
- Dominio y adapters: `src/loopdev/domains/crm`
- Primitives compartidos: `src/components/common` y `src/components/ui`

## Estado actual

Implementado localmente y validado como frontend-first:

- CRM Overview.
- Contacts con tabla, búsqueda, cursor local, creación, edición, archivado y drawer responsive.
- Customer 360 inicial dentro del detalle de Contact.
- Leads con captura, detalle/workspace, atribución, assignment y conversión local.
- Pipeline y Opportunities con creación, líneas, catálogo, historial y reapertura local.
- Tasks, Notes, Activities, Timeline, Attachments, Notifications, Operations y Automations.
- Communications Inbox, Conversation Operations, CRM Context y Timeline Explorer.
- La capacidad Files Platform queda planificada como evolución transversal de Attachments
  para centralizar documentos de CRM, archivos compartidos en Communications, assets de
  Marketing Studio y Content Studio, y documentos temporales de Document Intelligence.

El estado detallado y las diferencias entre frontend local, frontend parcial y backend pendiente
se mantienen en `CRM_FRONTEND_CLOSURE_MATRIX.md`. La ausencia de Supabase, RLS, Realtime,
providers y permisos server-side no invalida el cierre local: pertenece a las fases 9 y 10.

## Fase transversal siguiente

La siguiente unidad transversal es el **Sistema global de formularios**. Su contrato y alcance
viven en `docs/03-platform/frontend/LOOPDEV_GLOBAL_FORMS_PHASE.md`. Esta fase debe ejecutarse antes de
seguir ampliando formularios de CRM o conectar nuevas superficies de persistencia, y aplica por
igual a drawer, modal, página completa, wizard e inline edit. Rivera se utiliza como referencia
visual auditada; `AppDrawer` y los primitives de `src/components/ui` son la base implementable
de LoopDev.

### Estado de implementación del sistema global de formularios

Implementado localmente:

- `useFormLifecycle` compartido para dirty state, `beforeunload`, descarte y restauración
  del estado después de guardar.
- `FormSectionHeader` y `FormSection` compartidos para jerarquía visual, eyebrow, icono,
  descripción, metadatos y progreso opcional.
- Primitives globales de `Input`, `Textarea` y `SelectTrigger` con contraste, foco y
  estados de interacción consistentes.
- `AppDrawer` con superficie interna diferenciada, confirmación de cambios y footer común.
- Contacts: secciones Identity, Contact channels, Organization y Address migradas al nuevo
  encabezado visual.
- Leads y Opportunities: creación, conversión, edición y reapertura con dirty guard común.
- Tasks y Task Templates: drawers conectados al ciclo global.
- Notes: cancelación de edición inline protegida contra descarte accidental.
- Automations y Operations: formularios inline con dirty tracking y limpieza tras persistir.

Pendiente de cierre de esta fase:

1. **Progreso real por sección** calculado desde el estado de React Hook Form.
2. **Estado de errores en el encabezado**, con contador y navegación al primer campo inválido.
3. **Navegación sticky del formulario** para saltar entre secciones largas.
4. **Secciones colapsables opcionales** para Address, Metadata y Custom Fields.
5. **Indicador global de cambios no guardados** en header y footer.
6. **Estados visuales de completitud** neutral, en progreso, completo y con errores.
7. **Variante compacta para formularios pequeños**, evitando ornamentación innecesaria.

### Dirección visual del header de formulario

El header superior mostrado en el drawer todavía puede evolucionar. La dirección propuesta
es convertirlo en una cabecera de contexto, no solo en título y descripción:

- primera línea con eyebrow de contexto (`CRM / CONTACT`);
- título principal y descripción limitada a una línea o dos;
- estado a la derecha (`New`, `Editing`, `Read-only`) y dirty badge cuando corresponda;
- barra de progreso opcional para formularios largos;
- metadatos secundarios como última actualización, propietario o entidad relacionada;
- footer sticky separado para `Cancel` y `Save`, sin mezclar acciones con el scroll;
- versión compacta en móvil para evitar que la cabecera consuma demasiado espacio.

La implementación debe mantener `FormSectionHeader` como componente base y permitir que cada
superficie active solo los slots que necesita. No se deben crear headers específicos por dominio.

### Contrato responsive de formularios

Los formularios separan densidad visual y tamaño de superficie:

```ts
type FormLayoutMode = "compact" | "standard" | "expanded";
type FormResponsiveMode = "auto" | "fixed";
```

`compact` se reserva para acciones rápidas e inline edit, `standard` es el valor por defecto
para drawers y modales, y `expanded` se usa en formularios largos, páginas completas y wizards.
Con `responsive="auto"` la presentación se adapta así:

| Desktop | Mobile |
| --- | --- |
| compact | compact |
| standard | compact |
| expanded | standard |

El contrato funcional no cambia entre dispositivos: validación, dirty state, errores, foco y
acciones permanecen iguales. Solo cambia la presentación: una columna en móvil, header reducido,
metadata secundaria oculta, navegación horizontal y footer accesible.

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

### CRM Overview OVR-10 release/readiness review

**Estado:** bloqueada / no lista para release (`MOD-CRM-20260927-001:10-review`).

La revisión verificó el checkout solicitado, la rama
`feature/crm-v2-foundation`, HEAD `e9ca052069a5693412e1979adc17763a1c3300f2`,
el árbol sucio preservado y el proceso Vite real en
`http://127.0.0.1:8080` (PID 13144). Overview, Tasks y un deep link de Task
responden HTTP 200; typecheck, lint, i18n, tests enfocados, smoke autenticado,
build y `git diff --check` pasan. No se hicieron commits, push, PR, reset,
revert ni fases de automatización/enterprise.

El primer OVR-10 quedó bloqueado por el desfase 8081/8080 y por la ausencia de
captura UI autenticada. En el rerun `MOD-CRM-20260927-001:10-review-rerun` se
corrigió la identidad del manifiesto al proceso real en 8080 y volvieron a pasar
typecheck, lint, i18n, 18 tests enfocados, smoke autenticado, build, diff check y
las probes HTTP. El release sigue bloqueado porque este entorno no ofrece
automatización de navegador ni canvas/runtime autenticado para probar
loading/success/empty/error/forbidden/stale/offline, responsive mobile,
i18n/RTL, autorización del deep link, aislamiento tenant/team/brand o
revocación de caché. No se fabricó evidencia. La aprobación humana final de
release sigue siendo necesaria.

## Alcance funcional del CRM

El track cubre las siguientes superficies y capacidades de CRM:

### Entidades comerciales

- [x] CRM Overview.
- [x] Contacts: tabla, búsqueda, filtros, cursor local, creación, edición, archivado y
  drawer responsive.
- [x] Customer 360 inicial para Contact; la versión enriquecida permanece parcial.
- [x] Leads: tabla/cards, vistas, filtros, selección, preview, estados y conversión.
- [x] Pipeline: board Kanban de Opportunities y movimientos de etapa.
- [x] Opportunities: tabla/cards, filtros, ordenación, creación, líneas, historial y detalle en drawer.
- [ ] Contact detail enriquecido con relaciones, Notes, Tasks y Timeline.
- [x] Lead detail/workspace, actividad, atribución y assignment local.
- [x] Opportunity detail local con historial, actividad, relaciones y drawer responsive.
- [x] Creación manual local de Leads y Opportunities.
- [x] Reapertura explícita local de Opportunities terminales.
- [x] Stage configuration y catálogo local preparado para organización/workspace.
- [x] Opportunity lines locales con referencias a CatalogItem, Offer y Variant.

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
- **Files Platform:** capacidad global de archivos y documentos con upload queue, dropzone,
  previews, metadatos, categorías, tags, versiones, relaciones polimórficas, permisos,
  retención, auditoría y frontera reemplazable hacia Storage/Supabase. No pertenece a CRM:
  CRM, Communications, Marketing Studio, Content Studio y Document Intelligence son
  consumidores.
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

### Fase 8H — Files Platform transversal

**Estado:** En progreso — slice local funcional y consumidores CRM/Communications/Notes/Tasks conectados

Esta fase continúa el cierre local de Communications 8A-8G. Se numera 8H porque Files
Platform nace ahora como capacidad transversal necesaria para Customer 360 y Communications,
y se extenderá a Marketing Studio, Content Studio y Document Intelligence. La referencia a
Attachments de la Fase 5 describe la base existente; no representa el orden actual de trabajo.

Files Platform sustituirá el uploader específico de Attachments por una capacidad reutilizable
para cualquier suite o dominio. El objetivo no es solo subir archivos: debe ofrecer un contrato
único para archivos operativos, documentos de clientes y assets creativos, manteniendo el
binario detrás de un adapter y sin acoplar consumidores a Supabase Storage.

**Consumidores iniciales**

- CRM Customer 360: documentos centralizados del contacto con categorías, preview, versiones,
  permisos y origen.
- Communications: archivos recibidos o enviados en una conversación y acción explícita de
  “Guardar en la ficha del cliente”, conservando `conversationId` y `messageId`.
- Notes, Tasks, Leads y Opportunities: attachments contextuales mediante `EntityRef`.
- Marketing Studio: biblioteca de assets para imágenes, vídeo, audio, motion kits, logos,
  fuentes y recursos white-label.
- Content Studio: assets de contenido, previews, variantes por canal/aspect ratio y
  referencias desde piezas o campañas.
- Document Intelligence: documentos temporales, previews, límites de formato y lifecycle
  de sesión sin convertir la extracción en almacenamiento permanente.

**Contrato y experiencia global**

- [x] Definir `FileRecord`, `FileVersion`, `FileRelation` y `UploadSession` con
  `EntityScope`, `EntityRef` y permisos; las categorías y fuentes extensibles siguen abiertas.
- [x] Definir la frontera de `FileRecord` (metadata y relaciones) frente al binario y al
  `StorageObject`; ningún consumidor depende de una URL pública o de un proveedor concreto.
- [x] Definir `FilesAdapter` y store local determinista con listado, creación de metadata y
  mutaciones de lifecycle.
- [x] Crear el primitive global `FilesDropzone` con variantes iniciales para selección múltiple,
  drag/drop, browse, validación y cola local.
- [x] Cubrir validación de archivos y comportamiento del adapter local con tests focalizados.
- [x] Integrar `FilesDropzone`, categorías, listado y metadata local en Customer 360 Documents;
  el botón de upload del workspace activa el selector.
- [x] Definir `FileCategory` y `FileSource`; `FilePermission` y versionado de `UploadSession`
  siguen pendientes.
- [x] Completar `FilesAdapter` y store local con update metadata, archive, restore, delete,
  version, relate/unrelate y signed-preview mock local.
- [x] Crear primitives globales `FilePicker`, `UploadQueue`, `UploadItem`,
  `FilePreview`, `FileList` y `FileCategoryTabs`, con una primera variante reutilizable para
  página y modal.
- [x] Cubrir drag and drop, selección múltiple, progreso, cancelación, retry,
  duplicados, límites de tamaño/tipo/cantidad, errores recuperables y keyboard/mobile UX.
- [x] Modelar estados `queued`, `uploading`, `processing`, `ready`, `failed`, `archived`
  y `expired`, además de `source: upload | conversation | manager | generated | temporary`.
- [ ] Añadir categorías, tags, búsqueda autorizada, filtros, ordenación, colecciones y
  vistas compacta/lista/grid sin imponer una taxonomía exclusiva de CRM. `FileList` ya
  soporta query, categoría, ordenación, tags y vistas list/grid; falta conectarlo a una
  biblioteca de página con autorización y colecciones.
- [x] Preparar preview local seguro para imágenes y PDF; los demás tipos muestran metadata y
  quedan preparados para descarga cuando exista Storage.
- [ ] Implementar versionado y reemplazo conservando historial, autoría, checksum y
  `supersedesFileVersionId`; el adapter local ya calcula SHA-256 y rechaza duplicados,
  pero falta exponer el historial y reemplazo en la UI.
- [x] Definir lifecycle temporal, retención, archivado, borrado lógico, expiración y cleanup
  local para documentos de sesión y assets abandonados.
- [ ] Mantener permisos por organización/workspace/entidad, acceso sensible, links compartidos
  con expiración y audit events separados del Timeline.
- [ ] Añadir eventos Platform para `file.created`, `file.versioned`, `file.related`,
  `file.archived` y `file.deleted`, preparados para Notifications y Automations.
- [x] Integrar la acción de Communications para guardar documentos recibidos en Customer 360,
  conservando `conversationId` y `messageId`.
- [x] Conectar el selector local con attachments de Customer 360, Notes y Tasks mediante
  bridges compatibles con los contratos anteriores.
  Customer 360 Documents queda integrado en el slice inicial. Notes muestra archivos por
  relación y Tasks expone el contador de archivos asociados. Los contratos legacy siguen
  siendo compatibles durante la migración.

**Frontera backend futura**

- [ ] Definir mapping de metadata a tablas y del binario a Storage/Supabase.
- [ ] Preparar signed URLs, resumable/multipart upload, antivirus/validación MIME y
  generación de thumbnails/renditions detrás de servicios server-side.
- [ ] Definir cuotas, límites por organización/workspace, retención legal y export/delete
  de datos sin exponer credenciales ni permitir autorización decidida por el cliente.
- [ ] Conectar OCR, clasificación, extracción y transcodificación solo como workers o
  capacidades posteriores; Files Platform no debe asumir IA ni un proveedor específico.

**Pendiente para cerrar la fase**

- [ ] Persistir attachments como parte de la operación de creación de Note/Task y evitar
  huérfanos si el formulario se cancela; hoy el adapter Platform crea metadata de attachment
  de forma independiente.
- [ ] Añadir acciones de preview, delete y retry dentro de las vistas de Notes y Tasks; hoy
  Notes lista nombre/estado y Tasks muestra el contador.
- [ ] Completar búsqueda, tags, filtros, ordenación y vistas de biblioteca.
- [ ] Completar checksum, deduplicación por hash y reemplazo/versionado con historial visible.
- [ ] Conectar Leads y Opportunities, y posteriormente Marketing Studio, Content Studio y
  Document Intelligence.
- [x] Preparar contratos reutilizables para tags, checksum, filtros y acciones de retry/delete
  sin acoplar la biblioteca a un consumidor concreto.
- [x] Preparar contextos provider-neutral para Marketing Studio, Content Studio y Document
  Intelligence, con relaciones polimórficas y lifecycle temporal para documentos de sesión.
- [ ] Sustituir el almacenamiento local por un adapter server-side cuando exista infraestructura:
  Storage, signed URLs, RLS/permisos, cuotas, antivirus, thumbnails, retención legal y
  export/delete.

**Criterios de diseño derivados de VitaBlue**

- La biblioteca debe soportar assets creativos y recursos white-label, no únicamente
  documentos administrativos.
- Debe conservar `assetType`, `brandId`, `channel`, `aspectRatio`, `rendition`,
  `license/usage` y `status` como metadata extensible para Marketing/Content Studio.
- Debe distinguir fuente original, preview, thumbnail y renditions generadas, evitando
  que una pantalla de edición dependa del archivo original para cada tamaño o canal.
- La extracción de Document Intelligence debe consumir una `UploadSession` temporal y
  devolver resultados al workflow sin convertir automáticamente el documento en un asset
  permanente.

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

**Estado:** Completada localmente — proveedores externos, billing y persistencia remota pendientes

- [x] Implementar eventos, triggers y acciones CRM iniciales (`create_task`,
  `create_note` y `record_activity`) detrás del adapter local.
- [x] Añadir idempotencia por organización/evento y execution log local con estados
  `succeeded`, `failed` y deduplicación observable.
- [x] Preparar entitlements por organización sin conectar billing real.
- [x] Completar accesibilidad, responsive, error recovery y visual review de la
  superficie local de Automations.
- [x] Ejecutar typecheck, lint, tests focalizados y build.
- [x] Actualizar contratos y registrar límites explícitos:
  `crm.automations` (10 reglas), `crm.automation.executions` (100 eventos),
  `crm.contacts` y `crm.opportunities` sin límite local.
- [ ] Conectar Supabase, billing, proveedores externos y persistencia remota.

### Fase 8 — Communications Inbox multicanal

**Estado:** 8A-8G completadas localmente — backend colaborativo, Supabase,
Realtime, RLS, providers y delivery real quedan como trabajo futuro.

Communications no se define como una suite independiente en esta fase. El primer
consumidor es el CRM Communications Inbox, preparado para múltiples canales sin
activar proveedores que todavía no tengan adapter, políticas y permisos aprobados.

- [x] Definir el Inbox como una experiencia operativa CRM basada en la composición
  de Rivera y los patrones de `loopdev-lab`.
- [x] Mantener la arquitectura multicanal desde el inicio:
  `whatsapp`, `email`, `instagram`, `facebook_messenger`, `sms`, `phone` y
  `livechat`.
- [x] Definir WhatsApp como primer canal operativo local.
- [x] Mantener Email preparado visual y contractualmente, aunque no esté activo en
  la primera entrega. Email requiere posteriormente sus propias reglas de asunto,
  threads, attachments, delivery, consentimiento y provider adapter.
- [x] Diseñar Channel Rail con `All channels`, filtros por canal, contadores,
  estado de conexión y estados `connected`, `disconnected`, `pending`, `error`,
  `coming_soon` y `disabled`.
- [x] Diseñar Inbox desktop con lista de conversaciones, thread y contexto CRM
  opcional; el contexto CRM permanece cerrado por defecto y se activa únicamente
  cuando el usuario lo solicita.
- [x] Diseñar experiencia mobile secuencial:
  lista de conversaciones → thread → CRM context drawer/sheet.
- [x] Definir el contexto CRM como panel opt-in con Contact, Lead, Opportunity,
  Tasks, Activities y Customer 360, sin duplicar entidades CRM.
- [x] Mantener el composer principal como respuesta directa al cliente, con destinatario,
  canal y estado de entrega explícitos; las notas internas viven en Conversation Operations.
- [x] Preparar estados `queued`, `sent`, `delivered`, `read` y `failed`, además
  de account disconnected, kill switch, policy restricted, expired window,
  template required, forbidden, empty, loading y conflict.
- [x] Mantener el diseño del composer basado en capacidades del canal:
  templates, attachments, voice, rich content, delivery states y conversation
  window; cada capacidad debe venir del adapter y no de condiciones visuales
  hardcoded.
- [x] Mantener fixtures redacted y adapter local como fuente de datos de la
  primera implementación visual.
#### 8A — Contratos, adapter y datos locales

**Estado:** Completada

- [x] Implementar contratos tipados, contexto de organización y frontera
  `Page -> hook -> adapter -> local store`.
- [x] Implementar fixtures redacted y store local con conversaciones,
  mensajes, notas internas, estados de lifecycle, lectura, starred y filtros.
- [x] Preparar soporte multicanal: WhatsApp operativo; Email y canales futuros
  visibles como `coming_soon` sin acciones de proveedor.

#### 8B — Communications Inbox desktop

**Estado:** Completada

- [x] Implementar `/app/sales-crm/communications` y
  `/app/sales-crm/communications/:conversationId`.
- [x] Implementar Channel Rail, lista de conversaciones, thread, búsqueda,
  filtros, unread counts y selección respaldada por URL.

#### 8C — Estados y validación local

**Estado:** Completada

- [x] Implementar estados loading, empty, error, account/capability state,
  lifecycle, read y starred.
- [x] Mantener el trigger de CRM context como placeholder sin implementar el
  contexto CRM; las acciones de composer se implementan en 8D.
- [x] Añadir tests focalizados de contratos, filtros y mutaciones del adapter
  local; ejecutar typecheck y lint.

#### 8D — Composer y acciones de conversación

**Estado:** Completada localmente — sin providers reales

- [x] Implementar composer de respuesta directa al cliente con texto, envío local,
  creación optimista y estados de entrega.
- [x] Mover la creación y lectura de notas internas de conversación a
  Conversation Operations; no se mezclan con el composer de customer reply.
- [x] Aplicar capabilities y estados de cuenta al habilitar acciones; mostrar
  mensajes explícitos para cuenta desconectada, canal `coming_soon`, ventana
  expirada, template requerido y policy-disabled.
- [x] Implementar lifecycle local `pending`, `snoozed`, `closed` y `reopen`,
  asignación propia y conflictos de versión optimista.
- [x] Mantener CRM context como placeholder y sin attachments, audio, AI ni
  integraciones externas.

#### 8E — Contextual CRM Workspace

**Estado:** Completada localmente — 8F y 8G completadas localmente

Communications abre este workspace de forma opt-in desde el header del thread. El
thread, su selección, filtros, scroll y borrador permanecen bajo la propiedad de
Communications; el workspace solo compone contexto de entidades existentes.

- [x] Implementar contratos, hook y adapter local `CRMWorkspace` como frontera
  reemplazable. Contact, Lead y Opportunity siguen siendo propiedad del adapter CRM;
  Tasks, Notes, Activities y Timeline siguen siendo capacidades compartidas de
  Platform referenciadas por `EntityRef`.
- [x] Implementar panel desktop derecho con tabs internas `Overview`, `Contact`,
  `Lead`, `Opportunity`, `Work` (Tasks/Activities) y `Notes / Timeline`.
- [x] Abrir el workspace únicamente bajo acción explícita del operador y mantener
  visible el thread. El cierre no cambia la ruta ni descarta selección, filtros,
  posición de scroll o contenido del composer.
- [x] Añadir quick actions contextuales sin abandonar el thread: abrir el registro
  relacionado en una pestaña nueva, crear Task, añadir Note CRM y actualizar estado
  de Lead cuando el adapter y los permisos locales lo permiten. La asignación de la
  conversación pertenece a Communications Operations, no al contexto CRM.
- [x] Consumir IDs reales de las fixtures/stores locales (`contactId`, `leadId`,
  `opportunityId` y `EntityRef`) sin crear copias de entidades CRM. Las acciones
  pasan por `loopdevAdapter.crm` y `platformAdapter.work`.
- [x] Mostrar estados de loading, vacío, identidad pendiente, forbidden, error,
  conflicto/versionado y errores de acción sin bloquear la lectura del thread.
- [x] Mantener rail de canales, colores, estilo de conversación activa, layout
  full-width y comportamiento responsive. En viewport móvil el mismo workspace se
  presenta como sheet lateral para no romper la navegación secuencial
  conversación → thread → CRM workspace.
- [x] Añadir pruebas focalizadas de apertura/cierre, navegación de tabs, creación
  contextual de Task y preservación de la conversación seleccionada.

#### 8F — Mobile y configuración operativa

**Estado:** Completada localmente — sin providers reales

- [x] Implementar la variante mobile secuencial: lista → thread → CRM Workspace
  sheet, con back navigation, rail de canales como selector compacto, controles
  de acciones responsive y composer usable con teclado móvil.
- [x] Preservar conversación seleccionada, filtros, posición de scroll, borradores
  por conversación y contexto del workspace al navegar dentro del Inbox.
- [x] Implementar `/app/settings/communications` siguiendo el hub de Settings,
  con account health local, WhatsApp conectado, Email y canales futuros preparados
  pero no conectados, capacidades, templates placeholder, permisos/policy y
  kill-switch/status operativo.
- [x] Mantener las acciones limitadas al adapter local: no se simulan providers,
  Supabase, webhooks ni envío para canales sin conexión.
- [x] Mantener fuera de esta fase attachments, audio, AI, campañas, routing
  automático, macros, teams, SLA, bulk actions y otros canales operativos reales.

#### 8G — Bandeja colaborativa multiagente y concurrencia backend

**Estado:** Completada localmente — contratos, fixtures, adapter/store y UI
validados sin Supabase ni servicios externos.

La implementación de 8G es deliberadamente local-first: simula múltiples
agentes, TTL, locks, orden server-like, auditoría e idempotencia detrás de la
frontera `Page -> hook -> adapter -> local store`. La persistencia remota,
realtime, autorización server-side, RLS, webhooks, workers y providers reales
se mantienen fuera de esta fase y se documentan como trabajo futuro.

**Separación de superficies 8G (estado: completada localmente)**

La UX de Communications conserva tres superficies con responsabilidades separadas y
solo una contextual abierta a la vez:

- **Chat:** únicamente mensajes inbound/outbound con el cliente. El composer siempre
  es `Customer reply`; no ofrece modo `Internal note`.
- **Conversation Operations (owner: Communications):** status, claim/assign/transfer/
  unassign/handoff, colaboradores, watchers, presence, drafting, composer
  lock/takeover/release, notas internas de la conversación y audit trail.
- **CRM Context (owner: CRM):** Contact, Lead, Opportunity, Customer 360, tareas/
  actividades, notas CRM/timeline y quick actions CRM. Una nota CRM no es una nota
  interna de conversación.

Operations y CRM Context se abren desde el header como drawer/sheet desktop y mobile.
Cerrar cualquiera preserva hilo, selección, filtros, drafts y scroll. Esta separación
no incorpora Supabase, providers ni backend en 8G.

La bandeja será utilizada simultáneamente por múltiples personas del mismo
workspace. No basta con asignar una conversación a un usuario: hay que evitar
respuestas cruzadas, trabajo duplicado, pérdida de contexto y envíos basados en
una versión obsoleta de la conversación.

**Modelo de colaboración**

- [x] Mantener un `assignee` persistente como propietario principal de la
  conversación.
- [x] Permitir `claim`, `assign`, `transfer`, `unassign` y handoff explícito.
- [x] Mantener colaboradores/watchers sin convertirlos en propietarios.
- [x] Mostrar en la lista el responsable, avatar, iniciales y estado de
  asignación.
- [x] Añadir filtros `All`, `Mine` y `Unassigned`, además de colas o equipos
  cuando estén definidos.
- [x] Registrar quién realizó cada cambio, transferencia, cierre, reapertura,
  nota y mensaje.

**Presence y actividad en tiempo real**

- [x] Modelar presencia efímera de agentes que están viendo una conversación:
  `viewing`, `idle` y `offline`.
- [x] Mostrar en Conversation Operations quién está viendo simultáneamente el thread.
- [x] Modelar presencia de escritura/redacción:
  `drafting` con usuario, timestamp y expiración.
- [x] Mostrar avisos como `Maya Chen is viewing` o
  `Daniel Ortiz is drafting a customer reply` en Conversation Operations.
- [x] No bloquear la lectura ni las notas internas por presencia de otro agente.
- [x] Implementar un soft lock para la respuesta, con posibilidad de takeover
  controlado por permisos de supervisor.
- [x] Eliminar presencia y locks cuando expire el heartbeat, se cierre la
  pestaña o se pierda la conexión.

**Concurrencia y protección de envíos**

- [x] Mantener `expectedVersion` en mutaciones de estado, asignación y mensajes.
- [ ] Validar la versión otra vez en backend justo antes de enviar (futuro,
  cuando exista backend).
- [x] Rechazar versiones obsoletas con error explícito y solicitar refresh.
- [x] Implementar `idempotencyKey` por intento de envío para evitar duplicados
  ante reintentos, refresh o reconexión.
- [x] No permitir que un draft antiguo se envíe silenciosamente sobre mensajes
  nuevos.
- [x] Mostrar quién modificó la conversación cuando ocurra un conflicto.
- [x] Mantener ordenamiento consistente de mensajes mediante secuencia o
  timestamp server-side.
- [x] Separar claramente el bloqueo de composer del bloqueo de la conversación:
  la colaboración no debe impedir consultar el historial.

**Persistencia y backend**

- [x] Definir contratos/entidades locales para assignments, participants, presence,
  composer locks, drafts, audit events e idempotency keys.
- [x] Definir TTL y limpieza local de presence, drafts y locks.
- [ ] Implementar realtime por organización/workspace con aislamiento
  multi-tenant (futuro con Supabase Realtime).
- [ ] Proteger asignaciones, takeover, envío y lectura con permisos de rol
  server-side (futuro).
- [ ] Aplicar RLS y validación server-side; el cliente no decide ownership ni
  autorización (futuro).
- [ ] Conectar Supabase Realtime, webhooks, workers, delivery y retries sin
  exponer credenciales de proveedores.
- [ ] Mantener la integración con WhatsApp detrás de un provider adapter
  (futuro, sin provider real en 8G).
- [x] Preparar el mismo contrato para Email y futuros canales sin duplicar la
  lógica de colaboración.

**Estados y experiencia de error**

- [x] Definir estados `unassigned`, `assigned`, `viewing`, `drafting`,
  `waiting`, `handoff_requested` y `closed`.
- [x] Mostrar avisos claros cuando otro agente está redactando o cuando la
  conversación cambió mientras se editaba.
- [x] Permitir guardar una nota interna como alternativa cuando no se puede
  responder.
- [x] Diseñar recuperación ante desconexión, reconexión, heartbeat expirado,
  retry y envío duplicado.
- [x] Añadir audit trail visible para supervisores y trazabilidad operativa.

**Validación**

- [x] Cubrir dos agentes viendo la misma conversación.
- [x] Cubrir dos drafts simultáneos y takeover autorizado.
- [x] Cubrir dos envíos concurrentes con una versión obsoleta.
- [x] Cubrir reintentos con la misma `idempotencyKey`.
- [x] Cubrir transferencia, unassignment y handoff.
- [x] Cubrir pérdida de conexión y expiración de presence.
- [x] Validar aislamiento entre organizaciones y workspaces.
- [x] Validar que la UI móvil y desktop reflejen los mismos estados
  colaborativos.

Las extensiones `healthcare`, `commerce`, `saas` y `services` no forman parte de
esta fase; se mantienen como trabajo futuro y no deben contaminar Catalog, CRM ni
el contrato inicial de Communications.

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
| Settings | `/app/settings` | Hub de configuración de organización y workspace |
| CRM Operations | `/app/settings/crm/operations` | Implementada localmente; acceso anterior redirige desde `/app/sales-crm/operations` |
| CRM Automations | `/app/settings/crm/automations` | Implementada localmente; acceso anterior redirige desde `/app/sales-crm/automations` |
| CRM Automations | `/app/sales-crm/automations` | Implementada localmente con triggers, acciones, entitlements y execution log |
| Communications Inbox | `/app/sales-crm/communications` | Implementada localmente con colaboración 8G; providers, realtime y delivery real pendientes |
| Communications conversation | `/app/sales-crm/communications/:conversationId` | Implementada localmente con presencia, drafting, locks, auditoría e idempotencia; backend/providers pendientes |
| Communications settings | `/app/settings/communications` | Implementada localmente; providers y persistencia real pendientes |

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
- [ ] Files Platform tiene contrato global, primitives de upload, adapter local y
  consumidores CRM/Communications/Marketing/Content definidos sin acoplamiento de proveedor.
- [x] Search, Tags, Custom Fields e Import/Export tienen alcance y comandos definidos
  para el adapter local.
- [x] Automations y entitlements tienen límites explícitos.
- [x] Communications Inbox tiene contratos, adapter local, estados multicanal,
  composición desktop/mobile, composer y colaboración multiagente local definidos
  para 8A-8G.
- [ ] Todas las páginas usan `/app/sales-crm/*` y el shell actual de LoopDev.
- [ ] La UI consume datos mediante hooks, servicios y adapters.
- [ ] La integración Supabase sustituye al adapter local sin reescritura de páginas.
- [ ] Los estados de permisos, errores, privacidad y aislamiento están cubiertos.
- [x] Tests, typecheck, build y lint pasan.
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
