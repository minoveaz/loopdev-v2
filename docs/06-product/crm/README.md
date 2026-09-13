# Documentacion de producto CRM

> **Source of truth:** read
> [`../../03-platform/governance/V2_DOCUMENTATION_SOURCE_OF_TRUTH.md`](../../03-platform/governance/V2_DOCUMENTATION_SOURCE_OF_TRUTH.md)
> first. The `SAAS_*` platform documents are proposed, non-runtime references;
> they do not prove that a registry, resolver, or consumer exists.

Documentacion funcional del CRM de LoopDev v2. Esta carpeta conserva contratos y evidencia
funcional procedentes del producto legacy, pero la implementacion visual autoritativa es la
aplicacion LoopDev v2 de este repositorio.

## Alineacion con LoopDev v2

Lee primero el track activo
(`tracks/active/crm/2026-09-09-loopdev-v2-crm-frontend.md`) y la
[matriz única de cierre](CRM_FRONTEND_CLOSURE_MATRIX.md). Ahí se definen las rutas,
superficies implementadas, límites del adapter local y la clasificación de la documentación
legacy.

La fuente actual de la UI CRM es:

- `src/loopdev/pages/crm` para paginas y superficies de suite.
- `src/loopdev/components` para composiciones especificas de LoopDev.
- `src/loopdev/domains/crm` para tipos, hooks y adapters.
- `src/components/common` y `src/components/ui` para primitives compartidos.

El backend Supabase y sus contratos se conservan como referencia de integracion. Esta fase
actualiza y desarrolla el frontend v2; no duplica ni reimplementa el backend documentado.

## Arquitectura de UI

CRM se monta sobre la arquitectura de UI de LoopDev: el Shell y los primitives compartidos
son propiedad de Platform; los componentes CRM viven dentro de una capa orientada al dominio.
Consulta la guia de alineacion v2 antes de crear o auditar componentes CRM.

El protocolo concreto para clasificar, diseñar, crear, probar y promover
componentes CRM está en [CRM UI component protocol](CRM_UI_COMPONENT_PROTOCOL.md).

## Bloques

### Contactos

- [UX y componentes](contacts/CRM_CONTACTS_COMPONENT_AUDIT.md)
- [Contrato](contacts/CRM_CONTACT_CONTRACT.md)
- [Impact assessment](contacts/CRM_CONTACT_IMPACT_ASSESSMENT.md)
- El handoff original está archivado en
  [`archive/crm/contacts/CRM_CONTACT_IMPLEMENTATION_HANDOFF.md`](../archive/crm/contacts/CRM_CONTACT_IMPLEMENTATION_HANDOFF.md).

### Leads

- [Especificacion UX](leads/CRM_LEADS_UX_SPEC.md)

### Pipeline y Opportunities

- [Especificacion UX](pipeline/CRM_PIPELINE_UX_SPEC.md)
- [Auditoria de componentes](pipeline/CRM_PIPELINE_COMPONENT_AUDIT.md)
- [Contrato](pipeline/CRM_PIPELINE_CONTRACT.md)
- [Impact assessment](pipeline/CRM_PIPELINE_IMPACT_ASSESSMENT.md)
- El handoff original está archivado en
  [`archive/crm/pipeline/CRM_PIPELINE_IMPLEMENTATION_HANDOFF.md`](../archive/crm/pipeline/CRM_PIPELINE_IMPLEMENTATION_HANDOFF.md).

#### Estado de implementación v2

La primera slice local de Pipeline está disponible en
`/app/sales-crm/pipeline`. Incluye contratos tipados en el boundary CRM, fixtures
locales multi-tenant, listado filtrable y movimiento de etapa con
`expectedUpdatedAt` (conflicto optimista). La vista usa columnas kanban
responsive y no requiere Docker, Supabase ni servicios externos. La tabla de
Opportunities y las operaciones de backend permanecen fuera de esta slice.
La composición visual sigue el patrón Kanban de Rivera (`/apps/kanban`):
toolbar de búsqueda/filtros, columnas desplazables, cards compactas y menú
accesible de movimiento; las mutaciones continúan pasando por el adapter CRM.

### Tasks, Notes y Timeline

- [Especificacion UX](tasks/CRM_TASKS_UX_SPEC.md)
- [Auditoria de componentes](tasks/CRM_TASKS_COMPONENT_AUDIT.md)
- [Contrato](tasks/CRM_TASKS_CONTRACT.md)
- [Impact assessment](tasks/CRM_TASKS_IMPACT_ASSESSMENT.md)
- El handoff original está archivado en
  [`archive/crm/tasks/CRM_TASKS_IMPLEMENTATION_HANDOFF.md`](../archive/crm/tasks/CRM_TASKS_IMPLEMENTATION_HANDOFF.md).

### Customer 360

- [Especificacion UX](customer-360/CRM_CUSTOMER_360_UX_SPEC.md)
- [Auditoria de componentes](customer-360/CRM_CUSTOMER_360_COMPONENT_AUDIT.md)
- [Contrato](customer-360/CRM_CUSTOMER_360_CONTRACT.md)
- [Impact assessment](customer-360/CRM_CUSTOMER_360_IMPACT_ASSESSMENT.md)
- El handoff original está archivado en
  [`archive/crm/customer-360/CRM_CUSTOMER_360_IMPLEMENTATION_HANDOFF.md`](../archive/crm/customer-360/CRM_CUSTOMER_360_IMPLEMENTATION_HANDOFF.md).

### Shared del piloto

- [UX general del piloto](shared/CRM_PILOT_UX_SPEC.md)
- [Revision de readiness](shared/CRM_PILOT_READINESS_REVIEW.md)
- [Matriz de seguridad y aislamiento](shared/CRM_PILOT_SECURITY_AND_ISOLATION_MATRIX.md)

### Datos sinteticos

- [Fixtures](fixtures/)

## Regla de trabajo

Las definiciones, contratos, auditorias, handoffs y fixtures del CRM viven aqui por bloque de
producto. Los documentos backend-first, de Supabase, RLS y certificacion describen la fuente de
verdad ya construida y no deben convertirse en una segunda implementacion dentro de v2.

Para trabajo visual v2:

1. Consultar `tracks/active/crm/2026-09-09-loopdev-v2-crm-frontend.md` y
   `CRM_FRONTEND_CLOSURE_MATRIX.md`.
2. Usar rutas `/app/sales-crm/*`.
3. Mantener la UI desacoplada del almacenamiento mediante `src/loopdev/domains/crm`.
4. Usar el adapter local mientras se desarrolla la experiencia visual.
5. Registrar cualquier divergencia del backend en el contrato o handoff correspondiente, sin
   inventar endpoints en las paginas.
