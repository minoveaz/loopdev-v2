# Esquema de documentación multiplataforma CRM

> **Estado:** propuesta para revisión
> **No es:** un contrato implementado, una autorización de desarrollo ni evidencia de
> que existan clientes nativos.
> **Propietario propuesto:** CRM, en coordinación con Platform
> **Fecha:** 2026-09-13

## Propósito y contexto

Esta propuesta define cómo organizar la futura verdad de producto CRM para que un mismo
dominio pueda proyectarse en web de escritorio, web responsive, iOS y Android. No
reescribe ni sustituye los documentos actuales. En particular, el backend documentado
en `docs/03-platform/backend/` y los contratos CRM existentes siguen siendo referencias
que deben reconciliarse mediante los gates de gobierno de documentación.

La organización actual ya separa módulos como `contacts/`, `leads/`, `pipeline/`,
`tasks/` y `customer-360/`, y conserva material histórico en `archive/`. La propuesta
añade una taxonomía explícita para evitar que un contrato de dominio, una decisión de
API y una pantalla específica terminen mezclados en el mismo documento.

## Principios

1. **Backend client-agnostic y compartido.** El backend, la API, los eventos, la
   seguridad, la auditoría y la tenancy se definen una vez. No se crean reglas
   distintas para web, iOS o Android.
2. **Clientes como proyecciones del mismo dominio.** Cada cliente traduce las mismas
   entidades, comandos, estados y capacidades a una superficie adecuada para su
   contexto.
3. **No hay obligación de paridad de UI.** La semántica debe ser consistente, pero
   móvil puede usar una secuencia de captura o seguimiento diferente a escritorio.
4. **Compartir semántica, no forzar layouts.** IDs, invariantes, permisos, eventos y
   resultados son comunes; navegación, densidad, gestos y composición pueden variar.
5. **Offline es una propiedad explícita.** Cada capacidad declara si lee, escribe,
   encola, reconcilia o exige conexión. No se asume que “responsive web” equivale a
   “offline mobile”.
6. **La autoridad requiere evidencia.** Un documento propuesto no prueba runtime,
   ruta, registro ni cliente existente. Se mantiene la jerarquía de
   `V2_DOCUMENTATION_SOURCE_OF_TRUTH.md`.
7. **Trazabilidad sin destrucción.** Migrar la documentación significa clasificar y
   enlazar fuentes, no mover, borrar o reescribir documentos CRM existentes.

## Árbol recomendado

La siguiente estructura es el destino recomendado para documentos nuevos. Durante la
migración se pueden mantener nombres actuales y añadir enlaces de compatibilidad.

```text
docs/06-product/crm/
├── README.md
├── CRM_MULTIPLATFORM_DOCUMENTATION_SCHEMA.md
├── shared/                         # Fundación CRM compartida
│   ├── domain/                     # entidades, invariantes y lifecycles comunes
│   ├── backend-api/                # contratos, errores, tenancy, eventos
│   ├── access-audit/               # capacidades, RLS/RBAC, auditoría
│   ├── sync/                       # local-first, colas, conflictos y recovery
│   ├── cross-platform/             # matrices, aceptación y evidencia
│   └── visual/                     # tokens y lenguaje visual CRM
├── modules/                        # Verdad por módulo, sin duplicar foundation
│   ├── contacts/
│   ├── leads/
│   ├── pipeline/
│   ├── tasks/
│   └── customer-360/
├── surfaces/                       # Proyecciones UX por cliente
│   ├── web-desktop/
│   ├── web-mobile/
│   ├── ios/
│   └── android/
├── backend-api/                    # Índice CRM hacia contratos Platform
├── cross-platform/                 # Índices globales y gates
├── fixtures/                       # Datos de prueba; no son contrato runtime
└── archive/                        # Solo referencias históricas, sin cambios
```

`shared/` contiene la semántica CRM reusable; `modules/` contiene comportamiento
específico de una entidad o journey; `surfaces/` contiene decisiones de presentación.
`backend-api/` y `cross-platform/` son índices y artefactos de coordinación, no una
segunda implementación del backend. Las referencias activas de Platform siguen en
`docs/03-platform/{frontend,backend,mobile,governance}`.

## Set canónico por módulo

Cada módulo debe tener un índice que enlace exactamente un documento vigente de cada
tipo. Si un tipo no aplica, debe existir un stub que lo marque como `no aplica` y lo
justifique; no se debe inferir ausencia.

| Documento canónico | Pregunta que responde | Dueño primario |
| --- | --- | --- |
| `MODULE_CONTRACT.md` | ¿Qué capacidad ofrece y cuáles son sus límites? | Product + Domain |
| `MODULE_DOMAIN_LIFECYCLE.md` | ¿Qué entidades, estados, invariantes y transiciones existen? | Domain |
| `MODULE_BACKEND_API.md` | ¿Qué queries, commands, DTOs, errores, eventos y versionado hay? | Platform Backend |
| `MODULE_ACCESS_AUDIT.md` | ¿Quién puede ver/actuar y qué se audita? | Security/Platform |
| `MODULE_SYNC.md` | ¿Qué se persiste localmente, encola, reconcilia y recupera? | Sync |
| `MODULE_DESKTOP_WEB_UX.md` | ¿Cómo se trabaja con teclado, densidad y multitarea? | Web |
| `MODULE_MOBILE_WEB_UX.md` | ¿Cómo se adapta a viewport, conectividad y touch web? | Web |
| `MODULE_NATIVE_MOBILE_UX.md` | ¿Qué flujo nativo usan iOS/Android y qué integraciones requieren? | Mobile |
| `MODULE_VISUAL_DESIGN.md` | ¿Qué jerarquía, tokens, estados y evidencia visual aplican? | Design |
| `MODULE_CAPABILITY_MATRIX.md` | ¿Qué soporta cada cliente, con qué límites y dependencias? | Product + Platform |
| `MODULE_ACCEPTANCE_EVIDENCE.md` | ¿Qué gates, pruebas, screenshots, runtime y trazabilidad lo demuestran? | Delivery |
| `MODULE_MIGRATION_LEGACY_MAP.md` | ¿Qué fuentes actuales se conservan, sustituyen o revisan? | Documentation owner |

El módulo no debe copiar la definición de `Opportunity`, permisos o eventos en sus
cuatro documentos UX. Debe enlazar el documento compartido y describir únicamente la
proyección, excepciones y decisiones abiertas.

## Matriz de capacidades

Cada capability debe tener una fila, aunque solo exista inicialmente en una plataforma.
La columna **offline** distingue lectura cacheada, escritura en cola y “requiere red”.

| Capability | Compartida / específica | Desktop web | Web mobile | iOS | Android | Offline | Permisos | API / eventos |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Consultar oportunidades | Compartida | tabla, filtros, paginación | lista y filtros compactos | lista cacheada | lista cacheada | lectura cacheada; freshness visible | `crm.opportunity.read` | `listOpportunities`; `opportunity.updated` |
| Mover etapa | Compartida | drag/drop + comando alternativo | acción en detalle | acción rápida o menú | acción rápida o menú | encola si está permitido; conflicto explícito | `crm.opportunity.move` | `moveOpportunityStage`; `opportunity.stage_changed` |
| Crear captura | Compartida, distinta proyección | formulario completo | formulario por pasos | captura rápida, cámara/contactos si aplica | captura rápida, cámara/contactos si aplica | borrador local; envío en cola | `crm.opportunity.create` | `createManualOpportunity`; `opportunity.created` |
| Seguimiento | Compartida | tareas/notas en panel | acción “siguiente paso” | recordatorio, llamada o nota nativa | igual, sujeto a integración | cola de actividad y recovery | `crm.task.create`, `crm.note.create` | `task.created`, `note.created` |
| Configurar etapas | Compartida, admin-only | pantalla de administración | no prioritaria | no | no | requiere red | `crm.pipeline.configure` | `configurePipelineStage`; `pipeline.config_changed` |

La matriz también debe registrar `deviceIntegrations`, límites de tamaño, soporte de
accesibilidad, telemetría, versión mínima y owner. Una capacidad no se considera
“shared” porque tenga el mismo botón; es shared porque conserva la misma semántica y
contrato.

## Ejemplo: una oportunidad en Pipeline

El lifecycle compartido sigue siendo `qualified → proposal → won|lost`, con IDs de etapa
estables, `expectedVersion`, `contactId`, `productKey`, permisos y evento de auditoría.
La superficie puede diferir:

| Momento | Desktop web | Web mobile | iOS / Android nativo |
| --- | --- | --- | --- |
| Descubrir trabajo | Kanban con columnas, tabla alternativa, búsqueda y filtros persistentes | Lista ordenada por prioridad/frescura; filtros en sheet | Bandeja “para hoy”, lista cacheada y filtro por asignación |
| Abrir | Detail panel junto al board o ruta de detalle | Detail full-screen con resumen y CTA principal | Pantalla de detalle con tabs/sections nativos |
| Cambiar etapa | Drag/drop accesible o menú “Mover a…”; muestra conflicto sin perder filtros | CTA “Cambiar etapa”, selector y confirmación contextual | Acción rápida, swipe/action sheet; haptic opcional, nunca semántica |
| Capturar | Formulario completo con contacto, producto, importe y fecha | Wizard corto, campos progresivos y guardado de borrador | Captura rápida, contacto del dispositivo/cámara solo con permiso y revisión |
| Seguimiento | Crear tarea/nota desde el panel y ver timeline | CTA “Añadir siguiente paso”, timeline resumido | Recordatorio, nota/llamada y notificación local; sincronización posterior |
| Offline | Indica que requiere conexión o conserva lectura según política | Cache de lectura; no promete escritura offline sin contrato | Cache y cola de mutaciones según `MODULE_SYNC`; conflicto/retry visible |

Todas las variantes invocan el mismo `moveOpportunityStage` y reciben el mismo código
`CONFLICT`, `FORBIDDEN` o `STAGE_TRANSITION_FORBIDDEN`. Un gesto de swipe no crea una
regla de negocio nueva y una columna Kanban no obliga a Android a reproducir un board.

## Qué se comparte y qué puede variar

### Debe compartirse

- IDs, relaciones, tenant/workspace scope y versionado.
- Estados, transiciones, invariantes y reglas de negocio.
- Capacidades, permisos server-side, RLS, errores seguros y restricciones de PII.
- Commands, queries, DTOs, idempotency keys y eventos de dominio.
- Auditoría append-only, actor/origen, trazabilidad y correlación de requests.
- Política de sync: autoridad, orden, conflicto, retry, deduplicación y recovery.
- Significado de loading, empty, forbidden, conflict, stale y success.

### Puede variar

- Navegación, jerarquía de pantallas, layout, densidad y orden de campos.
- Kanban/table frente a list/detail/action flow.
- Gestos, accesos rápidos, menús contextuales, haptics y notificaciones.
- Integraciones de dispositivo (cámara, contactos, calendario, biometría), siempre
  declaradas en la matriz y protegidas por permisos.
- Estrategia de cache y affordances offline dentro de los límites del contrato.
- Copy de ayuda y composición visual localizada, sin cambiar nombres semánticos de
  estados o errores.

## Skills recomendadas

Estas skills son propuestas de proceso; crear o actualizar skills requiere su propio
review y no forma parte de este documento:

| Skill propuesta | Responsabilidad | Relación con skills actuales |
| --- | --- | --- |
| `multiplatform-discovery` | Inventariar módulos, clientes, evidence tiers, capacidades y diferencias de dispositivo | Extiende `module-discovery`; reutiliza governance y no afirma apps inexistentes |
| `client-surface-design` | Convertir un lifecycle en proyecciones web desktop/web mobile/native sin duplicar reglas | Coordina `module-design` y `module-visual-design` |
| `mobile-app-design` | Flujos nativos, navegación, permisos de dispositivo, estados de conectividad y accesibilidad | Complementa `module-visual-design`, no reemplaza UX web |
| `backend-contracts` | Normalizar API, eventos, seguridad, tenancy, auditoría, errores y compatibilidad | Formaliza el trabajo de `api-contracts`, junto a `domain-model` y `access-design` |
| `sync-design` (actualización) | Añadir columnas por cliente, capacidades offline y recovery específico iOS/Android/web | Mantiene la skill existente: estados de negocio, conectividad, entidad y mutación separados |
| `multiplatform-verify` | Verificar matriz, contratos, evidencia por cliente, offline, permisos y no-regresión | Complementa `module-verify`; `module-review` valida promoción y trazabilidad |

El orden sugerido es `multiplatform-discovery → domain-model/access-design →
backend-contracts → sync-design → client-surface-design/mobile-app-design →
multiplatform-verify`. `module-build` solo entra cuando existe una decisión de
implementación aprobada.

## Gates de entrega y ownership de artefactos

| Gate | Salida mínima | Owner de aprobación |
| --- | --- | --- |
| Descubrimiento | inventario, alcance, authority tier y matriz inicial | Product + Documentation |
| Dominio | lifecycle, invariantes, IDs y eventos | Domain owner |
| Acceso/API | capability matrix, permisos, errores, tenancy y auditoría | Platform/Security |
| Sync | operación offline, cola, conflicto, retry y recovery por cliente | Sync owner |
| Superficies | UX de cada cliente y excepciones justificadas | Surface owner + Design |
| Evidencia | tests, runtime, screenshots, accessibility y traceability | Delivery/Verify |
| Promoción | estado `current`, `proposed`, `legacy/archive` o `needs review` | Product owner |

El owner del documento mantiene la semántica; un surface owner no puede editarla
implícitamente. Los artefactos de ejecución deben vivir en
`docs/implementation/<module>/runs/`; las decisiones de producto en `docs/06-product`;
los contratos Platform en `docs/03-platform`. Cada documento debe enlazar su evidencia
sin presentarla como implementación.

### Relación con el Pipeline actual

La ejecución `MOD-CRM-PIPELINE-20260913-002` está pausada en
`WAITING_VISUAL_DESIGN_APPROVAL` y ya conserva artefactos de dominio, access, API y
sync. Cuando este esquema sea revisado, el Pipeline debería **consumirlo
eventualmente** como índice de fuentes y gates: mapear sus artefactos a los documentos
canónicos, completar la matriz de capacidades y verificar las superficies futuras.
No se cambia, reanuda, reescribe ni amplía esa ejecución por esta propuesta; tampoco se
deduce que existan backend remoto o apps nativas.

## Migración no destructiva de documentación existente

La migración clasifica primero; no mueve ni reescribe documentos actuales. El resultado
puede ser un índice nuevo con enlaces y una etiqueta de estado.

| Clasificación | Uso | Ejemplos iniciales |
| --- | --- | --- |
| **current** | Fuente activa cuando coincide con governance, código y tests actuales | `README.md`, `CRM_FRONTEND_CLOSURE_MATRIX.md`, `CRM_UI_COMPONENT_PROTOCOL.md`, contratos CRM vigentes |
| **proposed** | Intención aprobada o diseño por revisar; no prueba runtime | este esquema, futuros documentos de superficies nativas, `SAAS_*` explícitamente propuestos |
| **legacy/archive** | Evidencia histórica únicamente; conservar intacta | `docs/06-product/archive/crm/**`, handoffs archivados y prototipos antiguos |
| **needs review** | Conflicto, duplicación o falta de evidencia que requiere decisión | catálogos con rutas históricas, UX sin estado de implementación, contratos que no enlazan API actual |

Para cada archivo se registra, sin alterar su contenido: clasificación, owner,
fecha de revisión, autoridad y enlaces a reemplazo o complemento. Solo después de que
un owner apruebe una clasificación se crea el documento canónico faltante. Un `legacy`
no se convierte en `current` por ser detallado; un `proposed` no se convierte en
contrato por existir en Git.

## Decisiones abiertas

1. ¿Cuál es el modelo de versionado y compatibilidad para API/eventos entre clientes?
2. ¿Qué subconjunto de CRM tendrá escritura offline y cuál será estrictamente online?
3. ¿Cuál es la resolución de conflictos para cambios concurrentes de etapa, asignación,
   notas y tareas?
4. ¿Qué integraciones nativas (contactos, cámara, calendario, notificaciones) se
   aprobarán y con qué política de privacidad?
5. ¿Se compartirán DTOs/eventos generados entre clientes o solo esquemas versionados?
6. ¿Qué matriz de device support, accesibilidad y localización será obligatoria por
   release?
7. ¿Quién será accountable de cada documento cuando Product, Platform y Design
   discrepen?

## Próximo paso recomendado

Aprobar o comentar esta propuesta como **schema de documentación**, sin tratarla como
contrato runtime. Después, realizar un inventario `multiplatform-discovery` de Pipeline
como piloto no destructivo: enlazar el contrato actual, los artefactos del run pausado,
la matriz propuesta y las referencias Platform; marcar gaps como `needs review`; y
solo entonces decidir si se actualizan los índices de módulo y README. No se deben
modificar producción, crear clientes nativos ni cambiar el Pipeline para validar este
esquema.
