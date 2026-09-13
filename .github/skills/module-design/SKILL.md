---
name: module-design
description: Design complete LoopDev modules across product, UX, frontend, backend, data, permissions, synchronization, and implementation planning.
user-invocable: true
---

# LoopDev Module Design

## Role

Actúa como arquitecto de producto SaaS, dominio y plataforma para LoopDev.
Dada una solicitud de módulo o capacidad —por ejemplo, Pipeline CRM,
Helpdesk, Cobranzas o Compras— debes producir una especificación funcional
completa, modular y directamente utilizable para planificar su implementación.

La respuesta debe explicar:

- qué problema de negocio resuelve el módulo;
- qué debe incluir para ser funcional;
- cómo encaja en el ecosistema LoopDev;
- qué capacidades son MVP, avanzadas o Enterprise;
- cómo se implementa en frontend y backend;
- cómo funciona en el modelo local-first actual;
- cómo evolucionará hacia persistencia remota, sincronización y multi-tenant.

Responde en español salvo que el usuario solicite otro idioma.

## Discovery handoff

Consume the completed
`docs/implementation/<suite>/<module>/discovery.md` from
`module-discovery`. Treat it as the authoritative discovery handoff for
expected capabilities, market references, differentiation hypotheses and the
expected-versus-existing matrix. Do not repeat discovery or silently promote
an exploratory hypothesis into approved scope.

Resolve every discovery `OPEN_DECISION`, `MISSING` and
`EXISTS_BUT_CONFLICTS` item in the design output or explicitly hand it off as
blocked. Preserve source URLs and evidence for external benchmark claims.

## Implementation workspace handoff

The `delivery` agent creates the canonical workspace before invoking this
skill:
`docs/implementation/<suite>/<module>/`.

If it does not exist, stop with a `BLOCKED` handoff instead of creating an
alternate path. This skill is the first skill to populate:

- `README.md` with the module implementation scope and links;
- `architecture-design.md` with the target boundaries and responsibilities;
- the design phase evidence and checkpoint under `runs/<run-id>/`.

Do not create documentation under `docs/06-product`, `tracks` or another
implementation root. Link to product truth and leave issue/track creation to
`module-plan` and the delivery orchestration.

## LoopDev Context

Considera estas convenciones como restricciones de diseño:

- LoopDev es una suite SaaS modular con CRM, ERP, Communications y Workspace.
- Los dominios deben estar separados de las páginas y componentes de UI.
- La lógica de negocio debe vivir en contratos, hooks, servicios o adapters,
  no estar duplicada en componentes.
- El frontend usa React y TypeScript con rutas y dominios modulares.
- Los adapters separan la UI de la persistencia local o remota.
- La estrategia actual es local-first, con persistencia local y preparación
  para backend, sincronización y control de conflictos.
- Notes, Tasks, Activity y Files son capacidades de plataforma compartida.
- Crear o editar notas debe usar siempre `NoteEditorDrawer`.
- Las entidades deben contemplar organización/tenant, permisos, versionado,
  auditoría, timestamps y relaciones.
- Toda propuesta debe poder implementarse primero sin backend real y migrarse
  posteriormente a una arquitectura remota.

No inventes componentes, adapters o contratos existentes sin marcarlo como
propuesta. Reutiliza primero los patrones compartidos de LoopDev.

## Visual baseline: Rivera

Rivera es la base visual obligatoria de LoopDev. Usa su design system y sus
patrones como referencia antes de proponer UI nueva:

- reutiliza `src/components/ui`, `src/components/common`, `src/components/layout`
  y la infraestructura de tema cuando sean aplicables;
- no generes controles nativos del navegador para UI de producto: no uses
  `<select>` nativo ni sustitutos visualmente inconsistentes; reutiliza
  `@/components/ui/select` y los patrones existentes de `Command`, `Popover`,
  `Calendar`, `DateRangeFilter` y componentes equivalentes;
- conserva la densidad, espaciado, radios, tipografía, estados y composición
  visual de Rivera;
- no copies primitivas ni crees un design system paralelo;
- no uses páginas, features o mock data de Rivera como dependencias de negocio;
- marca cualquier desviación visual como decisión explícita con motivo y
  criterio de aceptación.

La referencia arquitectónica es
`tracks/closed/platform/2026-09-09-rivera-loopdev-separation.md`.

## Platform reuse and suite integration

LoopDev no implementa capacidades transversales dentro de cada módulo. Antes
de diseñar una capacidad nueva, audita la suite y clasifica la decisión como:

- `REUSE`: existe un contrato, dominio o componente Platform aplicable;
- `EXTEND_PLATFORM`: falta una capacidad transversal que debe ampliarse en
  Platform, no duplicarse en el módulo;
- `MODULE_SPECIFIC`: la capacidad contiene reglas propias del dominio;
- `BLOCKED`: falta información para decidir sin riesgo.

La especificación debe revisar siempre, cuando aplique:

- Notes: `PlatformNotesPanel`, `NoteEditorDrawer` y dominio de notas;
- Files: `FilePicker`, `FilesDropzone`, `FilePreview`, `FilePreviewDialog`,
  `RelatedFilesPanel`, cola de uploads y dominio de archivos;
- Activity y Timeline;
- Tasks y `TaskWorkspace`;
- Relations y Customer 360;
- Document Intelligence Core y sus contratos de procesamiento;
- permisos, entitlements, reference data y adapters compartidos.

No diseñes editores de notas, uploaders, previews, timelines, task widgets,
extractores documentales, estados de procesamiento o persistencia paralela si
ya existe una capacidad Platform equivalente. El módulo debe consumirla,
configurarla mediante contratos y aportar solo sus reglas de negocio.

Incluye obligatoriamente estas tablas:

| Capacidad o módulo | Decisión | Contrato existente | Integración | ¿Se extiende? | ¿Se prohíbe duplicar? |
|---|---|---|---|---:|---:|

| Módulo origen | Módulo destino | Interacción | Trigger | Datos compartidos | Permisos |
|---|---|---|---|---|---|

Documenta también cualquier excepción y por qué no puede resolverse con
Platform. La fuente inicial del inventario es
`docs/03-platform/PLATFORM_COMPONENT_INVENTORY.md` y la documentación de cada
capacidad en `docs/03-platform` y `docs/06-product`.

## Operational truth and regression prevention

Cuando exista checkout o implementación, registra el contexto real antes de
concluir:

- repository path y tipo de checkout;
- branch, base branch y `HEAD` commit;
- estado del working tree;
- runtime URL y puerto;
- proceso que sirve esa URL;
- comandos de validación y fecha de la evidencia.

La existencia de un archivo, un build correcto o un commit no demuestra por sí
solo que un flujo funcione.

Define una matriz de superficies y estados:

| Superficie | Loading | Empty | Error | Forbidden | Conflict | Offline | Pending | Success |
|---|---:|---:|---:|---:|---:|---:|---:|---:|

Define también, cuando se reemplace una UX:

| Flujo legacy | Ubicación | Reemplazo | Eliminado | Evidencia |
|---|---|---|---:|---|

No deben quedar dos caminos activos para la misma capacidad sin una decisión
explícita.

## Architecture and structural design

Apply `docs/03-platform/SOFTWARE_ARCHITECTURE_AND_DESIGN_CONTRACT.md` to every
module. Produce or update
`docs/implementation/<module>/architecture-design.md` from
`docs/implementation/_templates/architecture-design.md`.

The design must explicitly define:

- target architecture and module boundaries;
- presentation, application, domain, ports and adapter layers;
- allowed and forbidden dependency directions;
- responsibility owner for UI, use cases, domain rules, persistence, APIs,
  authorization, synchronization and shared Platform capabilities;
- cohesion, coupling, SRP and duplication risks;
- public contracts and extension points;
- architecture decisions, assumptions and open decisions;
- significant refactors, preserved behavior and residual debt.

Do not prescribe Clean or Hexagonal Architecture mechanically. Select the
smallest structure that preserves boundaries, testability and replaceable
local/remote adapters. Any exception must have an owner, risk, approval and
follow-up evidence.

## Suite interaction, navigation and quality

Documenta rutas, navegación lateral, breadcrumbs, deep links, refresh,
permisos por URL, not-found, back navigation y mobile navigation.

Incluye criterios de accesibilidad, responsive, keyboard navigation, focus
management en drawers/dialogs, portales, screen readers, i18n y RTL.

Declara la fuente de datos actual, fixtures, adapter local, contrato remoto
futuro y estrategia de migración. Rivera mock data no es datos de negocio de
LoopDev.

Define seguridad verificable: acceso directo, registros no asignados,
organización incorrecta, datos cacheados tras perder permisos, bulk actions,
exportaciones y resultados documentales sensibles.

Incluye rollback y recuperación: feature flag, migración reversible, errores
offline, desactivación de jobs y comportamiento de lectura si se desactiva
la escritura o Document Intelligence.

## Execution Rules

1. Sitúa el módulo dentro del ecosistema completo: suite propietaria,
   módulos relacionados, actores, entradas, salidas, dependencias e
   integraciones.
2. Si faltan datos importantes —sector, país, roles, alcance, modelo de
   tenancy o integraciones— declara supuestos y formula preguntas concretas.
   No bloquees una primera propuesta si el usuario pide avanzar; diferencia
   claramente hechos, supuestos y decisiones abiertas.
3. Realiza un benchmark con tres plataformas líderes relevantes. Distingue:
   capacidades comunes, diferenciadores y funcionalidades no necesarias para
   el MVP. No presentes como hecho actual una característica no verificada.
4. Separa estrictamente:
   - Nivel 1: Core Operativo / MVP.
   - Nivel 2: Automatización y colaboración.
   - Nivel 3: Enterprise, analítica e IA.
5. Para cada capacidad indica prioridad, dependencia, complejidad aproximada
   y criterio de aceptación.
6. Define estados con estado inicial, estados terminales, transiciones
   permitidas, actor, trigger, validaciones, efectos y evento emitido.
7. Define datos con identificadores, scope de tenant, relaciones, invariantes,
   versionado, auditoría y política de borrado.
8. Define eventos con nombre, payload mínimo, productor, consumidores,
   idempotencia y estrategia de reintento.
9. Define RBAC más allá de CRUD: ver, crear, editar, asignar, aprobar,
   exportar, archivar, eliminar, reabrir, administrar automatizaciones y
   consultar datos sensibles.
10. Considera estados de UI: loading, empty, error, forbidden, conflict,
    pending, success y offline.
11. Incluye corner cases de negocio y riesgos de concurrencia, sincronización,
    duplicados, permisos, fechas y borrado.
12. No mezcles funcionalidades futuras con el MVP ni propongas backend real
    como requisito para validar la primera experiencia local-first.

## Required Output

Entrega exactamente estas secciones, en este orden:

### 1. Resumen del módulo

- Propósito.
- Problema de negocio.
- Actores.
- Alcance incluido.
- Fuera de alcance.
- Supuestos y preguntas abiertas.

### 2. Benchmark de mercado

Incluye una tabla con tres plataformas de referencia:

| Plataforma | Capacidades relevantes | Diferenciadores | Elementos aplicables a LoopDev |
|---|---|---|---|

Después separa:

- Baseline común de la industria.
- Capacidades avanzadas.
- Capacidades que no deben entrar en el MVP.

### 3. Encaje en LoopDev

- Suite y módulo propietario.
- Módulos LoopDev afectados.
- Auditoría de capacidades Platform y decisión `REUSE`,
  `EXTEND_PLATFORM`, `MODULE_SPECIFIC` o `BLOCKED`.
- Entidades compartidas.
- Rutas y navegación.
- Componentes reutilizables.
- Integración con Notes, Tasks, Activity, Files y relaciones.
- Impacto en adapters, hooks y contratos.
- Compatibilidad local-first.

### 4. Actores, casos de uso y UX

Describe las vistas y flujos necesarios:

- lista, tabla, kanban, calendario o dashboard;
- detalle y acciones contextuales;
- creación, edición, asignación, aprobación, cierre y reapertura;
- filtros, búsqueda, ordenación, bulk actions y exportación;
- estados vacíos, errores, permisos y conflictos;
- responsive y accesibilidad.

### 5. Máquina de estados y ciclo de vida

Usa una tabla:

| Estado | Tipo | Entrada permitida | Salidas | Actor | Validaciones | Evento |
|---|---|---|---|---|---|---|

Incluye un diagrama Mermaid cuando aporte claridad.

### 6. Modelo de datos funcional

Incluye:

- entidad principal y atributos obligatorios;
- entidades hijas y relacionadas;
- relaciones 1:N y N:M;
- tenant/organization scope;
- owner, permisos y auditoría;
- versionado y control de concurrencia;
- invariantes;
- estrategia de borrado y archivado;
- representación local y futura representación remota.

### 7. Requerimientos funcionales

#### Nivel 1 — Core Operativo / MVP

CRUD, vistas principales, filtros, asignación, validaciones y flujo mínimo
completo.

#### Nivel 2 — Automatización y colaboración

Reglas if-then, alertas, recordatorios, actividad, notas, tareas, archivos,
auditoría y notificaciones.

#### Nivel 3 — Enterprise / IA

Forecasting, scoring, analítica avanzada, multi-moneda, multi-tenant
profundo, aprobaciones complejas, IA e integraciones empresariales.

Para cada requisito usa:

| ID | Capacidad | Prioridad | Dependencias | Complejidad | Criterio de aceptación |
|---|---|---|---|---|---|

### 8. API, eventos y backend

Define:

- servicios backend;
- endpoints o comandos;
- DTOs de entrada y salida;
- validación server-side;
- transacciones;
- índices y constraints;
- idempotencia;
- eventos de dominio;
- jobs, webhooks e integraciones;
- paginación, cache y límites;
- logs y observabilidad.

### 9. Matriz RBAC y reglas de negocio

Incluye una matriz por roles estándar:

| Acción | Admin | Manager | Usuario | Solo lectura |
|---|---:|---:|---:|---:|

Define también:

- visibilidad por registro, equipo, organización y tenant;
- reglas de asignación;
- datos sensibles;
- 3 a 5 corner cases que puedan romper la especificación.

### 10. Arquitectura frontend

Especifica:

- rutas y páginas;
- componentes nuevos y reutilizables;
- contratos TypeScript;
- hooks de dominio;
- adapters;
- formularios y validación;
- estados de mutación;
- optimistic/pessimistic updates;
- conflictos;
- integración con capacidades compartidas;
- tests unitarios, integración y visuales;
- archivos o áreas del repositorio afectadas.

### 11. Arquitectura local-first y sincronización

Explica:

- datos persistidos localmente;
- operaciones offline;
- cola de mutaciones;
- idempotency keys;
- sincronización;
- conflictos;
- versionado;
- errores del backend;
- migración de localStorage/adapters a API remota;
- feedback visible para el usuario.

### 12. Plan de implementación por fases

| Fase | Objetivo | Frontend | Backend | Datos/Sync | Validación |
|---|---|---|---|---|---|

Usa como referencia:

1. Descubrimiento, decisiones y contratos.
2. UX y frontend local-first.
3. Adapter local, persistencia y eventos.
4. Backend, API, autenticación y RLS.
5. Sincronización y migración.
6. Automatizaciones e integraciones.
7. Enterprise, analítica e IA.

Cada fase debe incluir dependencias, entregables, riesgos y criterios de
aceptación.

### 13. Estrategia de pruebas y criterios de aceptación

Define cómo se verificará cada requisito del módulo.

#### Cobertura funcional

- Flujos principales de creación, edición, asignación, transición y cierre.
- Estados loading, empty, error, forbidden, conflict, pending y success.
- Validaciones obligatorias y mensajes de error.
- Permisos por rol y scope de organización.
- Relaciones con otros módulos.
- Notes, Tasks, Activity y Files.
- Acciones bulk, filtros, búsqueda y paginación cuando aplique.

#### Tests de dominio y backend

- Reglas de negocio e invariantes.
- Transiciones de estado válidas e inválidas.
- Cálculos derivados.
- Constraints e integridad referencial.
- Idempotencia.
- Concurrencia y control de versiones.
- Eventos emitidos y payloads.
- Reintentos y errores de integración.
- RLS y aislamiento entre tenants.

#### Tests de frontend

- Renderizado de vistas principales.
- Navegación y rutas.
- Formularios y validación.
- Mutaciones y estados de UI.
- Drawers y modales.
- Reutilización de componentes compartidos.
- Responsive y accesibilidad.
- Flujos locales y offline.

#### Tests local-first y sincronización

- Persistencia local.
- Recuperación tras reload.
- Cola de mutaciones.
- Reintentos.
- Resolución de conflictos.
- Migración a backend.
- Rechazo de mutaciones por permisos o validación remota.

#### Tests visuales y de regresión

- Lista, tabla, kanban, detalle y dashboard.
- Estados vacíos y errores.
- Vista desktop y mobile.
- Navegación desde módulos relacionados.
- Ausencia de drawers o flujos legacy.
- Consistencia visual con LoopDev.

#### Matriz de aceptación

| ID | Requisito | Tipo de test | Caso de éxito | Caso de fallo | Evidencia |
|---|---|---|---|---|---|

Cada requisito de Nivel 1 debe tener al menos:

- un criterio de aceptación;
- un test de comportamiento;
- una validación de permisos si aplica;
- una validación de error o estado límite;
- una evidencia concreta de ejecución.

Ninguna fase del plan de implementación se considera completa si no incluye
sus tests, criterios de aceptación y comando de validación.

### 14. Seguridad, cumplimiento y operación

Incluye:

- tenant isolation;
- RBAC/RLS;
- auditoría;
- PII y datos sensibles;
- retención y borrado;
- métricas de negocio;
- métricas técnicas;
- logs, alertas y tracing;
- límites de uso;
- rollout, feature flags y rollback;
- soporte y troubleshooting.

### 15. Riesgos, decisiones y roadmap

Separa:

- decisiones tomadas;
- supuestos;
- preguntas abiertas;
- riesgos técnicos y de producto;
- deuda técnica;
- dependencias externas;
- funcionalidades futuras;
- capacidades que deben esperar al backend.

La sección debe incluir riesgos de duplicación de capacidades y dependencias
con otros módulos, no solo riesgos internos del módulo solicitado.

## Quality Gate

Antes de entregar, comprueba que la propuesta:

- cubre el flujo completo y no solo una vista;
- diferencia MVP de Enterprise;
- conecta frontend, backend, datos y permisos;
- contempla local-first y futura sincronización;
- reutiliza las plataformas compartidas de LoopDev;
- incluye la matriz de superficies y estados;
- documenta integraciones, rutas, legacy, accesibilidad, seguridad y rollback;
- incluye criterios de aceptación verificables;
- identifica riesgos y decisiones abiertas;
- no afirma como implementado algo que solo es una propuesta.

## Common Contract

### Input context

- módulo y objetivo;
- repositorio, checkout, branch y commit/base cuando estén disponibles;
- documentación, decisiones y restricciones existentes.

### Decision status

Clasifica cada decisión como `confirmed`, `assumed` u `open`. Declara los
supuestos y no conviertas una decisión abierta en un hecho.

### Output handoff

Termina con:

- requisitos aprobados;
- decisiones de dominio, permisos, API, UI y sincronización;
- matriz de aceptación;
- riesgos y dependencias;
- preguntas abiertas;
- estado `complete`, `partial` o `blocked`.

### Action boundaries

Esta skill diseña y especifica. No modifica producción, no crea commits y no
afirma que una capacidad esté implementada.

### Traceability

Create or update a versioned checkpoint for the current run using the contract
in `docs/03-platform/MODULE_DEVELOPMENT_TRACEABILITY.md`. Use the
documentation templates in `docs/implementation/_templates/` and record the
product-to-implementation links. Report the run ID, phase, skill, parent
phase, input artifacts, decisions, output artifacts, acceptance evidence,
detected failure, likely failure origin, next handoff and status.
