---
title: "[Nombre de la suite] — plantilla de documentación multiplataforma"
status: proposed-template
classification: proposed
owner: "[Product owner / Documentation owner]"
last_reviewed: "[YYYY-MM-DD]"
---

# [Nombre de la suite] — documentación multiplataforma

> **PLANTILLA / PROPUESTA.** Este documento es un punto de partida reutilizable para
> documentar una suite SaaS multiplataforma. No es un contrato runtime, no autoriza
> desarrollo y no demuestra que exista una API, una ruta, un módulo ni una aplicación
> nativa. Sustituye los marcadores, enlaza evidencia verificable y conserva la
> clasificación de cada afirmación.
>
> Antes de usarlo, leer
> [`../../03-platform/governance/V2_DOCUMENTATION_SOURCE_OF_TRUTH.md`](../../03-platform/governance/V2_DOCUMENTATION_SOURCE_OF_TRUTH.md).
> En caso de conflicto, prevalece la jerarquía de autoridad de ese documento.

## Cómo usar esta plantilla

1. Copiarla a `docs/06-product/[suite]/[SUITE]_MULTIPLATFORM_DOCUMENTATION.md`.
2. Mantener el punto de vista de **suite**: los módulos son capacidades coordinadas,
   no productos aislados.
3. Marcar cada afirmación como `implemented`, `approved`, `proposed`, `legacy/archive`
   o `needs review`; enlazar código, tests, tracks y runtime cuando se afirme
   implementación.
4. No inventar endpoints, clientes nativos, eventos, permisos ni soporte offline.
5. Completar las matrices aunque una capacidad todavía no exista: usar `No aplica`,
   `Propuesto` o `No verificado` con owner y siguiente decisión.

### Convención de evidencia

| Marca | Significado | Evidencia mínima |
| --- | --- | --- |
| `implemented` | Comportamiento existente y verificable | Código fuente + ruta/registro + test o evidencia runtime |
| `approved` | Contrato o intención aprobada | Documento/track aprobado; no prueba ejecución |
| `proposed` | Diseño pendiente de aprobación | Propuesta explícita y owner |
| `legacy/archive` | Material histórico | Enlace conservado; no autoriza trabajo actual |
| `needs review` | Conflicto, ausencia o clasificación pendiente | Issue/decisión o gate de revisión |

---

## 1. Identidad, misión y ownership de la suite

| Campo | Respuesta |
| --- | --- |
| Nombre y slug | `[Nombre]` / `[slug]` |
| Estado de la suite | `[implemented / approved / proposed / needs review]` |
| Owner de producto | `[persona/equipo]` |
| Owner de documentación | `[persona/equipo]` |
| Platform partner | `[Platform / Backend / Mobile / Design / Security]` |
| Fecha y versión del documento | `[YYYY-MM-DD]` / `[vX]` |
| Fuentes canónicas | `[enlaces]` |

### Misión y resultados de negocio

- **Misión:** `[qué problema resuelve la suite y para quién]`.
- **Resultados medibles:** `[resultado]` — métrica, baseline, objetivo, fecha y owner.
- **No objetivos:** `[lo que queda fuera de esta suite]`.
- **Evidencia:** `[implemented/approved/proposed]` — `[enlaces]`.

### Actores, tenancy y ownership

| Actor / sistema | Necesidad y acciones | Scope de tenant/workspace | Ownership de datos | Estado/evidencia |
| --- | --- | --- | --- | --- |
| `[rol]` | `[leer/crear/aprobar/administrar]` | `[tenant, workspace, account]` | `[suite/módulo/Platform]` | `[marca + enlace]` |

Documentar explícitamente: tenant raíz, workspaces, membresías, invitaciones,
transferencia de ownership, cuentas de servicio, actor efectivo, actor en nombre de
otro actor, regiones de datos y qué ocurre al abandonar un tenant.

---

## 2. Límite de la suite y mapa de módulos

### Boundary

- **Dentro:** `[capacidades y dominios]`.
- **Fuera:** `[capacidades propiedad de otras suites/Platform]`.
- **Contratos de entrada/salida:** `[eventos, APIs, integraciones]`.
- **Regla de ownership:** ningún módulo redefine una entidad o regla que sea shared;
  debe enlazar su fuente canónica.

### Mapa de módulos

| Módulo | Responsabilidad principal | Entidades/capacidades | Owner | Dependencias | Estado/evidencia |
| --- | --- | --- | --- | --- | --- |
| `[módulo]` | `[qué decide y ejecuta]` | `[lista]` | `[owner]` | `[módulos/Platform]` | `[marca + enlace]` |

### Mapa de dependencias

| Módulo consumidor | Depende de | Tipo (dato/API/evento/UI) | Dirección permitida | Riesgo/ciclo | Contrato canónico |
| --- | --- | --- | --- | --- | --- |
| `[A]` | `[B/Platform]` | `[tipo]` | `[A → B]` | `[riesgo]` | `[enlace]` |

Registra si la dependencia es obligatoria u opcional, síncrona o asíncrona, y quién
aprueba cambios incompatibles. No uses una dependencia visual para ocultar una
acoplación de dominio.

---

## 3. Dominio compartido, lifecycle e invariantes

### Modelo compartido

| Entidad / value object | Definición | Relaciones | IDs estables | PII/sensibilidad | Owner / evidencia |
| --- | --- | --- | --- | --- | --- |
| `[Entidad]` | `[significado]` | `[relaciones]` | `[tipo, formato, scope]` | `[clasificación]` | `[marca + enlace]` |

### Lifecycle y transiciones

| Entidad | Estado inicial | Transiciones válidas | Actor/capacidad | Estado terminal | Evento emitido |
| --- | --- | --- | --- | --- | --- |
| `[Entidad]` | `[estado]` | `[A → B; condiciones]` | `[permiso]` | `[estado]` | `[evento versionado]` |

### Invariantes y reglas cross-module

- `[INV-001]` `[invariante que siempre debe cumplirse]` — owner/evidencia.
- `[RULE-001]` `[regla que cruza módulos]` — precedencia, error y evento.
- Definir autoridad de escritura, orden de eventos, consistencia eventual y
  comportamiento ante borrado, archivado, merge y restauración.
- IDs: formato, unicidad dentro de tenant, generación, exposición, correlación y
  compatibilidad entre clientes.
- Auditoría: actor, tenant, request/correlation ID, timestamp, before/after,
  motivo, origen de cliente y retención.
- Eventos: nombre, versión, payload mínimo, consumidor, deduplicación y evolución.

---

## 4. Backend/API compartido por todos los clientes

El backend es **client-agnostic**: desktop web, web responsive, iOS y Android
consumen las mismas reglas de dominio, autorización, tenancy y contratos versionados.
Una diferencia de UX no justifica una regla de negocio diferente.

| Tema | Contrato de suite | Implementado / propuesto | Evidencia / owner |
| --- | --- | --- | --- |
| Commands | `[nombre, input, resultado, errores]` | `[marca]` | `[enlace]` |
| Queries | `[filtros, orden, shape]` | `[marca]` | `[enlace]` |
| Eventos | `[evento.vN, producer, consumers]` | `[marca]` | `[enlace]` |
| Autorización | `[capability, actor, policy]` | `[marca]` | `[enlace]` |
| RLS/tenancy | `[scope y enforcement server-side]` | `[marca]` | `[enlace]` |
| Versionado | `[URL/schema/event compatibility]` | `[marca]` | `[enlace]` |
| Idempotencia | `[key, ventana, replay response]` | `[marca]` | `[enlace]` |
| Paginación | `[cursor/limit, stable sort, total]` | `[marca]` | `[enlace]` |
| Observabilidad | `[logs, metrics, traces, correlation]` | `[marca]` | `[enlace]` |

### Contrato de request/response

- Error envelope: `[código estable, mensaje seguro, details, correlationId]`.
- `expectedVersion` / `If-Match`: `[política de concurrencia]`.
- Timeouts, retries y backoff: `[política por command/query]`.
- Rate limits, payload limits y timeouts públicos: `[valores o propuesta]`.
- Compatibilidad hacia atrás y deprecación: `[n-1, fechas, migración]`.

### Capability matrix de suite

| Capability | Desktop web | Web mobile | iOS | Android | Backend/API | Offline | Permiso | Evidencia/owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `[capacidad]` | `[UI/No]` | `[UI/No]` | `[UI/No]` | `[UI/No]` | `[command/query/event]` | `[cache/cola/red]` | `[capability]` | `[marca + enlace]` |
| `[capacidad]` | `[UI/No]` | `[UI/No]` | `[UI/No]` | `[UI/No]` | `[contrato]` | `[política]` | `[capability]` | `[marca + enlace]` |

`Offline` debe distinguir lectura cacheada, borrador local, escritura en cola,
reconciliación y `requiere red`; no equivale a “responsive”.

---

## 5. Estrategia de clientes multiplataforma

### Compartido frente a específico

| Decisión | Compartir (semántica/contrato) | Específico de plataforma | Criterio y evidencia |
| --- | --- | --- | --- |
| Dominio, IDs, estados, invariantes | `[qué]` | `[excepción justificada]` | `[criterio]` |
| Commands, queries, errores, eventos | `[qué]` | `[adaptador]` | `[criterio]` |
| Layout y navegación | `[tokens/patrones]` | `[composición]` | `[ergonomía]` |
| Offline/sync | `[autoridad y reglas]` | `[storage/UX]` | `[riesgo]` |
| Integraciones de dispositivo | `[contrato de resultado]` | `[cámara/contactos/push]` | `[permiso]` |
| Accesibilidad/localización | `[mínimos]` | `[convención OS]` | `[criterio]` |

### Responsabilidades por superficie

- **Desktop web:** `[densidad, multitarea, teclado, tablas/kanban, URL]`.
- **Web responsive:** `[touch, viewport, degradación, conectividad]`.
- **iOS:** `[navegación y patrones nativos, permisos, lifecycle]`.
- **Android:** `[navegación y patrones nativos, permisos, lifecycle]`.
- **Backend:** `[semántica, seguridad, auditoría, compatibilidad; nunca UI]`.

Regla: una acción nativa (swipe, deep link, notificación) proyecta un command
existente; no crea una segunda regla de negocio.

---

## 6. Navegación, información y deep links

### Arquitectura compartida

- Jerarquía suite → módulo → entidad → acción: `[mapa]`.
- Términos, breadcrumbs, títulos, empty/error/loading/conflict states: `[contrato]`.
- Search, filtros, recientes, favoritos, permisos y back behavior: `[reglas]`.

### Deep links

| Ruta/URI canónica | Cliente(s) | Requiere auth/tenant | Fallback si no disponible | Compatibilidad/versionado |
| --- | --- | --- | --- | --- |
| `[https://… o app://…]` | `[web/iOS/Android]` | `[sí + scope]` | `[ruta segura]` | `[vN]` |

Documentar universal links/app links, parámetros no sensibles, expiración de enlaces,
redirección tras login, estados offline y comportamiento ante recurso eliminado o sin
permiso.

---

## 7. Design system y baseline visual de suite

- **Fuente de tokens:** `[Platform/shared design system]`.
- **Baseline:** tipografía, color, spacing, grid, elevation, motion, iconografía,
  focus, estados semánticos y densidad: `[enlaces]`.
- **Identidad de suite:** `[diferenciadores aprobados sin romper Platform]`.
- **Herencia de módulos:** cada módulo puede añadir composición y contenido, pero no
  redefinir tokens, estados de seguridad, focus ni componentes base sin aprobación.
- **Visual evidence:** `[screenshots/runs/tests]`; una propuesta visual no demuestra
  implementación.

| Elemento | Platform shared | Suite override permitido | Módulo override permitido | Evidencia/estado |
| --- | --- | --- | --- | --- |
| `[token/componente]` | `[valor]` | `[sí/no + regla]` | `[sí/no]` | `[marca + enlace]` |

---

## 8. Local-first, offline, sync, conflictos y recovery

### Política común

| Capacidad | Lectura offline | Escritura offline | Cola/deduplicación | Conflicto | Recovery | Cliente/excepción |
| --- | --- | --- | --- | --- | --- | --- |
| `[capacidad]` | `[sí/no/frescura]` | `[sí/borrador/no]` | `[key/orden/retry]` | `[estrategia]` | `[acción]` | `[plataforma]` |

Definir autoridad de servidor, snapshot/cache, TTL, invalidación, orden causal,
`idempotencyKey`, reintentos seguros, backoff, operaciones no repetibles, detección de
conflicto, UI de resolución, pérdida de dispositivo, logout, cambio de tenant,
reinstalación, migración de base local y recuperación tras crash. La política debe ser
la misma semánticamente en web, iOS y Android aunque el almacenamiento difiera.

---

## 9. Seguridad, privacidad, permisos y datos sensibles

| Área | Regla de suite | Enforcement | Evidencia/owner |
| --- | --- | --- | --- |
| Auth/session | `[tokens, expiración, refresh, logout]` | `[server/client]` | `[enlace]` |
| Tenant/RLS | `[scope y aislamiento]` | `[backend/database]` | `[enlace]` |
| Capabilities | `[matriz actor → acción]` | `[server-side + UX]` | `[enlace]` |
| PII | `[clasificación, minimización, masking]` | `[storage/log/export]` | `[enlace]` |
| Retención/borrado | `[retention, legal hold, export]` | `[jobs/policies]` | `[enlace]` |
| Auditoría | `[eventos obligatorios y acceso]` | `[append-only]` | `[enlace]` |
| Secretos | `[prohibición de secretos en clientes/logs]` | `[vault/build]` | `[enlace]` |

Documentar permisos de dispositivo por propósito y revocación. La UX puede ocultar
acciones, pero la autorización efectiva debe comprobarse en backend/RLS.

---

## 10. Accesibilidad, localización, RTL y convenciones de plataforma

- WCAG/objetivo: `[nivel y alcance]`; keyboard/focus/screen reader: `[reglas]`.
- Idiomas, formatos de fecha/número/moneda, pluralización y zona horaria: `[reglas]`.
- RTL: `[componentes, orden lógico, iconos direccionales, pruebas]`.
- Contraste, motion reduction, text scaling, touch targets y feedback: `[mínimos]`.
- Convenciones web/iOS/Android que pueden variar sin cambiar semántica: `[lista]`.

| Caso | Desktop web | Web mobile | iOS | Android | Gate/evidencia |
| --- | --- | --- | --- | --- | --- |
| `[idioma/RTL/a11y]` | `[criterio]` | `[criterio]` | `[criterio]` | `[criterio]` | `[test/evidence]` |

---

## 11. Requisitos nativos iOS/Android

| Tema | iOS | Android | Política suite / compatibilidad |
| --- | --- | --- | --- |
| Secure storage | `[Keychain, claves, biometría]` | `[Keystore, claves, biometría]` | `[datos permitidos]` |
| Push | `[APNs, permisos, deep link]` | `[FCM, permisos, deep link]` | `[payload no sensible]` |
| Background tasks | `[BGTask/limitaciones]` | `[WorkManager/limitaciones]` | `[jobs seguros/idempotentes]` |
| OS integrations | `[calendario/contactos/cámara]` | `[equivalentes]` | `[consentimiento]` |
| Release channels | `[TestFlight/staged/store]` | `[internal/beta/staged]` | `[gates y rollback]` |
| Min OS/app version | `[mínimo]` | `[mínimo]` | `[API compatibility]` |

Definir matriz `appVersion ↔ API/schema`, migraciones de almacenamiento local,
forzado/blando de actualización, soporte de clientes n-1, firma, configuración por
entorno y qué ocurre cuando el backend deja de aceptar una versión.

---

## 12. Datos, integraciones y reutilización de Platform

### Catálogo compartido

| Recurso | Owner | Uso por módulos | Source of truth | Sensibilidad/retención | Cliente/offline |
| --- | --- | --- | --- | --- | --- |
| Reference data | `[owner]` | `[módulos]` | `[Platform/suite]` | `[clasificación]` | `[política]` |
| Files/storage | `[owner]` | `[módulos]` | `[storage contract]` | `[PII/retention]` | `[upload/retry]` |
| Activity/timeline | `[owner]` | `[módulos]` | `[event/audit]` | `[retention]` | `[cache]` |
| Tasks | `[owner]` | `[módulos]` | `[Platform/suite]` | `[clasificación]` | `[sync]` |
| Notes | `[owner]` | `[módulos]` | `[Platform/suite]` | `[clasificación]` | `[sync]` |
| Integración `[X]` | `[owner]` | `[capacidad]` | `[contrato]` | `[datos]` | `[fallback]` |

Enlazar contratos de `docs/03-platform/{frontend,backend,mobile,governance}` y no
copiar su implementación. Registrar ownership, límites, webhooks, retries,
rate limits, import/export, reference data versionado, archivos (mime/size/virus
scan), actividad, tareas y notas. Reutilizar Platform cuando ya sea la fuente canónica.

---

## 13. Lifecycle de suite, releases y migraciones

| Fase | Entrada | Gate de salida | Owner/aprobador | Evidencia |
| --- | --- | --- | --- | --- |
| Discovery | `[scope, actores, gaps]` | `[boundary aprobado]` | `[owner]` | `[enlace]` |
| Domain/API | `[contratos]` | `[invariantes, seguridad, compat]` | `[owner]` | `[enlace]` |
| Surfaces | `[matrices UX]` | `[a11y, visual, platform]` | `[owner]` | `[enlace]` |
| Pilot/beta | `[build + fixtures]` | `[acceptance]` | `[owner]` | `[enlace]` |
| Release | `[version]` | `[rollback/observability]` | `[approver]` | `[enlace]` |
| Operate/deprecate | `[telemetría]` | `[migration/retirement]` | `[owner]` | `[enlace]` |

Documentar migraciones de schema/API/eventos, backfills, dual-read/write, flags,
rollback, clientes antiguos, ventanas de compatibilidad, datos offline pendientes y
comunicación. Separar lifecycle de producto, módulos, documentos y releases de apps.

---

## 14. Verificación y gates de aceptación

### Matriz por plataforma

| Gate | Backend/API | Desktop web | Web mobile | iOS | Android | Offline/sync | Evidencia requerida |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Contrato/dominio | `[pass/pending]` | `[pass/pending]` | `[pass/pending]` | `[pass/pending]` | `[pass/pending]` | `[pass/pending]` | `[tests/enlaces]` |
| Auth/tenant/RLS | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[evidence]` |
| Capability/permissions | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[evidence]` |
| A11y/localización/RTL | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[evidence]` |
| Error/conflict/recovery | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[evidence]` |
| Observabilidad | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[evidence]` |
| Release/version compatibility | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[evidence]` |

### Gates de suite

- [ ] Boundary, módulos y ownership aprobados.
- [ ] Dominio, invariantes, IDs, eventos y reglas cross-module verificados.
- [ ] API, autorización, tenancy/RLS, idempotencia, paginación y observabilidad
      probados; los documentos no sustituyen tests.
- [ ] Capability matrix completa y diferencias justificadas.
- [ ] Cada superficie pasa sus gates de UX, accesibilidad, localización y seguridad.
- [ ] Offline, conflictos, migración y recovery probados donde se declaran.
- [ ] Evidencia implementada separada de propuesta; no se infieren apps nativas.
- [ ] Rollback, compatibilidad y ownership de release aprobados.

---

## 15. Ownership documental y árbol canónico

### Ownership

| Artefacto | Pregunta | Owner primario | Revisores | Estado/evidencia |
| --- | --- | --- | --- | --- |
| Índice de suite | ¿Qué existe y cómo se relaciona? | `[Product/Docs]` | `[Platform]` | `[marca]` |
| Dominio shared | ¿Qué significa y qué invariantes hay? | `[Domain]` | `[Security]` | `[marca]` |
| Backend/API | ¿Cómo se consume de forma segura? | `[Platform Backend]` | `[Suite]` | `[marca]` |
| Sync | ¿Qué ocurre sin red/conflicto? | `[Sync]` | `[Clients]` | `[marca]` |
| Surface docs | ¿Cómo se proyecta por cliente? | `[Surface owner]` | `[Design/A11y]` | `[marca]` |
| Acceptance evidence | ¿Qué lo demuestra? | `[Delivery]` | `[QA]` | `[marca]` |

### Árbol recomendado

```text
docs/06-product/[suite]/
├── README.md
├── [SUITE]_MULTIPLATFORM_DOCUMENTATION.md   # este índice canónico
├── shared/
│   ├── domain/              # modelo, lifecycle, invariantes, eventos
│   ├── backend-api/         # commands, queries, errores, versionado
│   ├── access-audit/        # permisos, tenancy, RLS, auditoría
│   ├── sync/                # offline, conflictos, recovery
│   ├── cross-platform/      # matrices y gates
│   └── visual/              # tokens y baseline de suite
├── modules/[module]/
│   ├── README.md
│   ├── MODULE_CONTRACT.md
│   ├── MODULE_DOMAIN_LIFECYCLE.md
│   ├── MODULE_BACKEND_API.md
│   ├── MODULE_ACCESS_AUDIT.md
│   ├── MODULE_SYNC.md
│   ├── MODULE_CAPABILITY_MATRIX.md
│   ├── MODULE_ACCEPTANCE_EVIDENCE.md
│   └── MODULE_MIGRATION_LEGACY_MAP.md
├── surfaces/{web-desktop,web-mobile,ios,android}/
└── archive/                 # solo histórico; no editar para “migrar”
```

### Checklist de artefactos por módulo

| Artefacto | Obligatorio | Si no aplica | Enlace/owner/estado |
| --- | --- | --- | --- |
| `MODULE_CONTRACT.md` | Sí | Stub con justificación | `[ ]` |
| `MODULE_DOMAIN_LIFECYCLE.md` | Sí | Stub con justificación | `[ ]` |
| `MODULE_BACKEND_API.md` | Sí | Stub; enlazar Platform | `[ ]` |
| `MODULE_ACCESS_AUDIT.md` | Sí | Stub; nunca inferir permisos | `[ ]` |
| `MODULE_SYNC.md` | Sí | Declarar `requiere red` | `[ ]` |
| `MODULE_CAPABILITY_MATRIX.md` | Sí | Marcar no soportado | `[ ]` |
| `MODULE_ACCEPTANCE_EVIDENCE.md` | Sí | Pending, no “pass” implícito | `[ ]` |
| `MODULE_MIGRATION_LEGACY_MAP.md` | Sí si hay legado | Declarar `sin legado` | `[ ]` |
| Surface UX docs | Según superficies soportadas | Registrar `no soportado` | `[ ]` |
| Visual/accessibility docs | Sí para UI | Stub con owner | `[ ]` |

---

## 16. Clasificación legacy/proposed/current y plan de migración

### Reglas

- `current` solo cuando la fuente coincide con governance y evidencia actual; un
  documento detallado no se vuelve current por existir.
- `approved` describe intención aceptada, no runtime.
- `proposed` es diseño para revisión; no es contrato ni autorización.
- `legacy/archive` se conserva intacto y solo aporta contexto histórico.
- `needs review` bloquea promoción cuando hay conflicto, duplicación o evidencia
  insuficiente.
- Nunca mover, archivar, borrar ni reescribir product docs existentes como parte de
  completar esta plantilla; añadir índices y enlaces no destructivos.

### Inventario de migración

| Fuente existente | Clasificación actual | Autoridad/evidencia | Destino o relación | Acción | Owner/fecha |
| --- | --- | --- | --- | --- | --- |
| `[ruta]` | `[current/proposed/legacy/needs review]` | `[enlace]` | `[canónico]` | `[enlazar/no tocar/revisar]` | `[ ]` |

### Plan por fases

1. Inventariar sin modificar fuentes.
2. Clasificar y registrar conflictos, owners y fecha de revisión.
3. Crear índices/stubs canónicos que enlacen la fuente original.
4. Reconciliar con código, tests, tracks y runtime; promover solo con evidencia.
5. Migrar consumidores/documentos gradualmente y conservar redirects/enlaces.
6. Revisar tras cada release y marcar deprecaciones; archivar únicamente mediante el
   proceso de governance aprobado.

---

## 17. Decisiones abiertas, riesgos y aprobaciones

### Decisiones abiertas

| ID | Decisión | Opciones | Impacto | Owner | Fecha límite | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| `DEC-001` | `[pregunta]` | `[opciones]` | `[módulos/clientes]` | `[owner]` | `[fecha]` | `[open/decided]` |

### Riesgos y mitigaciones

| ID | Riesgo | Probabilidad/impacto | Señal | Mitigación/contingencia | Owner | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| `RISK-001` | `[riesgo]` | `[P/I]` | `[métrica]` | `[acción]` | `[owner]` | `[open]` |

### Registro de aprobaciones

| Gate / decisión | Aprobador | Fecha | Evidencia o comentario | Estado |
| --- | --- | --- | --- | --- |
| Boundary | `[ ]` | `[ ]` | `[enlace]` | `[pending/approved]` |
| Dominio/API | `[ ]` | `[ ]` | `[enlace]` | `[pending/approved]` |
| Seguridad/privacidad | `[ ]` | `[ ]` | `[enlace]` | `[pending/approved]` |
| Surfaces/design/a11y | `[ ]` | `[ ]` | `[enlace]` | `[pending/approved]` |
| Release/migración | `[ ]` | `[ ]` | `[enlace]` | `[pending/approved]` |

## Historial de cambios de esta propuesta

| Fecha | Cambio | Autor | Estado |
| --- | --- | --- | --- |
| `[YYYY-MM-DD]` | Creación de plantilla reutilizable | `[ ]` | `proposed` |
