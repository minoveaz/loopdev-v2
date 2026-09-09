# Documentacion de producto CRM

Documentacion funcional del CRM de LoopDev v2. Esta carpeta conserva contratos y evidencia
funcional procedentes del producto legacy, pero la implementacion visual autoritativa es la
aplicacion LoopDev v2 de este repositorio.

## Alineacion con LoopDev v2

Lee primero [CRM v2 frontend alignment](CRM_V2_FRONTEND_ALIGNMENT.md). Ese documento define
las rutas, superficies implementadas, limites del adapter local y la clasificacion de la
documentacion legacy.

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
- [Handoff de implementacion](contacts/CRM_CONTACT_IMPLEMENTATION_HANDOFF.md)

### Leads

- [Especificacion UX](leads/CRM_LEADS_UX_SPEC.md)

### Pipeline y Opportunities

- [Especificacion UX](pipeline/CRM_PIPELINE_UX_SPEC.md)
- [Auditoria de componentes](pipeline/CRM_PIPELINE_COMPONENT_AUDIT.md)
- [Contrato](pipeline/CRM_PIPELINE_CONTRACT.md)
- [Impact assessment](pipeline/CRM_PIPELINE_IMPACT_ASSESSMENT.md)
- [Handoff de implementacion](pipeline/CRM_PIPELINE_IMPLEMENTATION_HANDOFF.md)

### Tasks, Notes y Timeline

- [Especificacion UX](tasks/CRM_TASKS_UX_SPEC.md)
- [Auditoria de componentes](tasks/CRM_TASKS_COMPONENT_AUDIT.md)
- [Contrato](tasks/CRM_TASKS_CONTRACT.md)
- [Impact assessment](tasks/CRM_TASKS_IMPACT_ASSESSMENT.md)
- [Handoff de implementacion](tasks/CRM_TASKS_IMPLEMENTATION_HANDOFF.md)

### Customer 360

- [Especificacion UX](customer-360/CRM_CUSTOMER_360_UX_SPEC.md)
- [Auditoria de componentes](customer-360/CRM_CUSTOMER_360_COMPONENT_AUDIT.md)
- [Contrato](customer-360/CRM_CUSTOMER_360_CONTRACT.md)
- [Impact assessment](customer-360/CRM_CUSTOMER_360_IMPACT_ASSESSMENT.md)
- [Handoff de implementacion](customer-360/CRM_CUSTOMER_360_IMPLEMENTATION_HANDOFF.md)

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

1. Consultar `CRM_V2_FRONTEND_ALIGNMENT.md`.
2. Usar rutas `/app/sales-crm/*`.
3. Mantener la UI desacoplada del almacenamiento mediante `src/loopdev/domains/crm`.
4. Usar el adapter local mientras se desarrolla la experiencia visual.
5. Registrar cualquier divergencia del backend en el contrato o handoff correspondiente, sin
   inventar endpoints en las paginas.
