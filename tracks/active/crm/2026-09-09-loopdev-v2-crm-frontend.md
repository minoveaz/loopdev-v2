---
id: loopdev-v2-crm-frontend
title: CRM y Communications frontend para LoopDev v2
status: active
created: 2026-09-09
updated: 2026-09-09
owner: loopdev-v2
lead: User
branch: develop
branches: []
phase: 1
pull_requests: []
issues: [2]
packages: []
release: internal-product
areas: [frontend, crm, communications, ux]
dependencies:
  - loopdev-v2-monorepo-multitenancy
blocked_by: []
supersedes: []
---

# CRM y Communications frontend para LoopDev v2

## Outcome

Construir la experiencia visual del CRM y de Communications en LoopDev v2 a partir del
lenguaje visual ya establecido, manteniendo las páginas desacopladas del backend Supabase
que ya existe en el producto legacy.

El trabajo es frontend-first. La persistencia real se conectará después mediante adapters,
sin reescribir las páginas ni crear una API paralela desde el navegador.

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

Preparado en navegación, pero pendiente de construcción de la superficie de dominio:

- Pipeline.
- Opportunities.
- Tasks.
- Communications.

El adapter activo durante esta fase es `localLoopdevAdapter`. El backend Supabase, sus
contratos, RLS, permisos y migraciones se mantienen como referencia de integración y no
se duplican en este track.

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
   - [ ] Cubrir creación, edición, validación y estados de submit.
   - [x] Cubrir permisos, errores de servidor, conflicto `409` y archivado en el adapter local.
   - [ ] Cubrir restauración de foco y actualización de la lista.

### Cierre visual de Contacts

**Estado:** Pendiente

- [x] Mostrar los campos disponibles del modelo CRM en el formulario y Customer 360.
- [ ] Crear una representación mobile semántica de la lista.
- [ ] Completar restauración de foco y pruebas de accesibilidad.
- [ ] Añadir tests de integración del formulario y del refresco tras mutaciones.
- [ ] Mostrar explícitamente el estado archivado en el detalle.

**Fuera de UI-2:** Customer 360 enriquecido, merge, exportación, bulk actions, filtros avanzados,
owner y lifecycle stage.

### Fase 2 — Pipeline y Opportunities

**Estado:** Pendiente

- [ ] Definir la composición visual del board y la tabla responsive.
- [ ] Diseñar tarjetas de Opportunity, etapas, filtros y acciones.
- [ ] Implementar detalle de Opportunity reutilizando Contact 360 cuando corresponda.
- [ ] Añadir estados `stale`, `conflict` y `action pending` para la futura conexión real.
- [ ] Mantener las rutas bajo `/app/sales-crm/*`.

### Fase 3 — Tasks, Notes y Timeline

**Estado:** Pendiente

- [ ] Diseñar bandeja de Tasks y vista My Day.
- [ ] Integrar Tasks, Notes y Timeline como capacidades contextuales.
- [ ] Evitar duplicar actividad dentro de Customer 360.
- [ ] Definir formularios y overlays con los primitives actuales.
- [ ] Conservar permisos y reglas de privacidad del backend como contrato.

### Fase 4 — Communications

**Estado:** Pendiente

- [ ] Definir Communications como suite visual independiente dentro de LoopDev.
- [ ] Diseñar inbox, conversaciones, estados de lectura, filtros y panel contextual.
- [ ] Mantener la relación contextual con Contact, Lead y Customer 360.
- [ ] Separar claramente la UI de canales reales, proveedores y credenciales.
- [ ] Usar fixtures o adapter local hasta conectar el backend existente.

### Fase 5 — Integración progresiva

**Estado:** Futuro

- [ ] Implementar el adapter Supabase para los contratos ya existentes.
- [ ] Conectar queries y mutaciones sin cambiar las composiciones visuales.
- [ ] Validar aislamiento multi-tenant, permisos y estados de error.
- [ ] Retirar datos locales solo cuando cada flujo tenga persistencia real validada.

## Rutas v2

| Superficie | Ruta | Estado |
| --- | --- | --- |
| CRM overview | `/app/sales-crm/overview` | Implementada |
| Contacts | `/app/sales-crm/contacts` | Implementada |
| Customer 360 | `/app/sales-crm/contacts/:contactId` | Implementada |
| Leads | `/app/sales-crm/leads` | Implementada |
| Pipeline | `/app/sales-crm/pipeline` | Pendiente |
| Opportunities | `/app/sales-crm/opportunities` | Pendiente |
| Tasks | `/app/sales-crm/tasks` | Pendiente |
| Communications | `/app/sales-crm/communications` | Pendiente |

## Fuera de alcance

- Rehacer el backend Supabase, migraciones, RLS o contratos ya existentes.
- Crear microservicios o una API REST paralela.
- Implementar ahora la aplicación móvil.
- Activar proveedores reales de email, WhatsApp u otros canales sin una integración aprobada.
- Implementar billing, marketing automation o módulos SaaS no relacionados con estas superficies.

## Criterios de cierre

- [ ] Las superficies CRM actuales tienen una composición visual consistente en v2.
- [ ] Pipeline, Opportunities, Tasks y Communications tienen diseño y estados documentados.
- [ ] Todas las páginas usan `/app/sales-crm/*` y el shell actual de LoopDev.
- [ ] La UI consume datos mediante hooks, servicios y adapters.
- [ ] La integración Supabase sustituye al adapter local sin reescritura de páginas.
- [ ] Los estados de permisos, errores, privacidad y aislamiento están cubiertos.
- [ ] Tests, typecheck, build y lint pasan.
- [ ] El issue GitHub asociado está enlazado y la evidencia final está registrada.

## Issue GitHub

Issue de seguimiento: `minoveaz/loopdev-v2#2`.
