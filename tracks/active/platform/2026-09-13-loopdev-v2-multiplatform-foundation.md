---
id: loopdev-v2-multiplatform-foundation
title: LoopDev v2 Multiplatform Foundation
status: active
created: 2026-09-13
updated: 2026-09-13
owner: platform
lead: User
branch: develop
branches: []
phase: 0
pull_requests: []
issues: []
packages: []
release: not-required
areas: [platform, architecture, multiplatform, suite, crm, mobile, backend, governance]
dependencies:
  - loopdev-v2-monorepo-multitenancy
blocked_by:
  - MOD-CRM-PIPELINE-20260913-002
supersedes: []
run_ids:
  - MOD-CRM-PIPELINE-20260913-002
product_docs:
  - docs/06-product/_templates/SUITE_MULTIPLATFORM_DOCUMENTATION_TEMPLATE.md
  - docs/06-product/crm/CRM_MULTIPLATFORM_DOCUMENTATION_SCHEMA.md
implementation_docs:
  - docs/implementation/crm/pipeline/
---

# LoopDev v2 Multiplatform Foundation

## Objetivo

Establecer la fundación de gobierno, documentación, contratos y verificación que
permita evolucionar LoopDev v2 como una plataforma multiplataforma. El resultado
debe hacer posible que una misma semántica de negocio se proyecte en desktop web,
mobile web, iOS y Android, sin afirmar que existen clientes nativos o capacidades
de backend que todavía no tengan evidencia de fuente.

La primera demostración de la plataforma será **Launchpad** como vertical slice de
Platform. **CRM Overview** será el primer vertical slice de suite. Ambos deben
probar navegación, contexto de organización/workspace, permisos, estados,
contratos, evidencia visual y límites de cliente; no son autorización para crear
backend o aplicaciones nativas.

## Fuente de verdad y estado de evidencia

Este track gobierna la fase, pero no reemplaza los documentos normativos enlazados.
La jerarquía y clasificación de fuentes sigue
[`docs/03-platform/governance/V2_DOCUMENTATION_SOURCE_OF_TRUTH.md`](../../../docs/03-platform/governance/V2_DOCUMENTATION_SOURCE_OF_TRUTH.md).

- **Implementado y verificable:** shell y rutas web presentes en código, incluyendo
  `/launchpad` y las superficies CRM documentadas por
  [`docs/03-platform/frontend/PLATFORM_V2_SHELL_REFERENCE.md`](../../../docs/03-platform/frontend/PLATFORM_V2_SHELL_REFERENCE.md)
  y la matriz de cierre de CRM.
- **Contrato/diseño vigente:** API, RLS, multi-tenancy, environments, mobile y
  documentación CRM activa enlazados en este track.
- **Propuesto, no implementado:** backend remoto completo, API productiva,
  capacidades offline sincronizadas, clientes nativos iOS/Android, sus builds,
  distribución y cualquier proveedor Render no demostrado por código o runtime.
- **Histórico únicamente:** no se reactivan documentos bajo
  `docs/06-product/archive/` ni se usan como fuente normativa.

Un documento detallado no constituye por sí mismo evidencia de runtime. Toda
afirmación de implementación debe aportar código, prueba, runtime, configuración
o artefacto de release reproducible.

## Alcance

### Incluido

- Índice suite-level multiplataforma y árbol canónico de documentación.
- Launchpad como slice de Platform y CRM Overview como primer slice de suite.
- Contratos compartidos de dominio, API/backend, auth, organization, workspace,
  tenancy, permisos, auditoría, errores, eventos, versionado e idempotencia.
- Separación explícita de responsabilidades entre clientes desktop web, mobile
  web, iOS y Android.
- Modelo de entorno de desarrollo con Supabase y Render, con roles separados y
  secretos aislados.
- Estrategia propuesta de native apps, ambientes de release y pruebas.
- Requisitos local-first/offline: cache, outbox, sync, conflictos, retry,
  recovery, freshness y autoridad del servidor.
- Un único documento visual normativo y evidencia SVG/PNG comparable entre
  plataformas, junto con accesibilidad y estados funcionales.
- Skills y gates para suite, superficies, mobile, tenant/environment, deployment
  y verificación multiplataforma.
- Trazabilidad hacia el CRM activo y bloqueo explícito del Pipeline pausado.

### Fuera de alcance

- Modificar producción, migrar la aplicación, crear `apps/mobile` o escoger un
  framework nativo sin decisión y evidencia aprobadas.
- Implementar Supabase, Render, API, RLS, Auth, sync u offline en este track.
- Crear una API paralela desde las páginas o duplicar reglas de negocio por cliente.
- Reanudar o ampliar el run de CRM Pipeline.
- Convertir documentos archivados en fuentes actuales, crear issues, o cerrar
  gates por inferencia documental.
- Pixel parity entre clientes: se comparte semántica, no necesariamente layout,
  navegación, densidad o gestos.

## Principios

1. **Una semántica, varias proyecciones.** IDs, invariantes, estados, comandos,
   eventos, permisos y errores son comunes; la presentación puede variar.
2. **Backend client-agnostic.** El servidor es autoridad de identidad, contexto,
   autorización, mutaciones y auditoría; ningún cliente decide tenancy.
3. **Evidence-first.** `current`, `proposed`, `needs review` y `legacy/archive`
   se distinguen siempre. Native apps y backend productivo son `proposed` hasta
   verificarse por fuente.
4. **Security by boundary.** `organization_id`, workspace, membresía, permisos,
   RLS y auditoría se validan server-side; ocultar UI no es seguridad.
5. **Offline explícito.** Cada capability declara lectura cacheada, escritura
   encolada o requisito online. Lo pendiente/conflictivo nunca se presenta como
   confirmado por servidor.
6. **Reuse before duplication.** Los contratos Platform se reutilizan por suites;
   CRM es primer consumidor, no propietario de reglas globales.
7. **Progressive delivery.** Cada slice cierra una cadena completa de evidencia
   antes de ampliar superficie o backend.
8. **No resurrection.** Las referencias históricas se enlazan como contexto, sin
   editar, promover ni ejecutar archivos archivados.

## Contexto de arquitectura

La dirección prevista es una plataforma con clientes independientes sobre
contratos compartidos:

```text
Desktop web / Mobile web / iOS / Android
                  |
        adapters + SDK + contracts
                  |
     auth + organization/workspace context
                  |
       API / Supabase (propuesto)
       PostgreSQL + RLS + Storage + Functions
                  |
             audit/events
```

La aplicación web actual mantiene la responsabilidad de browser shell, rutas y
responsive web. iOS y Android serían clientes de presentación separados; no hay
evidencia de que existan sus fuentes, targets, builds o listings. Las reglas de
dominio y autorización no pueden vivir solo en un cliente.

La intención de tenancy es pool compartido con aislamiento lógico PostgreSQL/RLS,
`organizations` y `organization_memberships`, y workspace explícito cuando aplique.
El contrato debe resolver el contexto desde sesión/membresía, particionar cache y
invalidar colas al cambiar de organización. Ver
[`docs/03-platform/backend/MULTI_TENANCY_STRATEGY.md`](../../../docs/03-platform/backend/MULTI_TENANCY_STRATEGY.md)
para la estrategia documentada, no para afirmar una migración completa.

### Separación Supabase / Render

La decisión de roles para el entorno de desarrollo es:

| Superficie | Responsabilidad prevista | No debe hacer |
|---|---|---|
| Supabase local/DEV | PostgreSQL, Auth, RLS, Storage y Functions para desarrollo y seeds reproducibles | Servir el frontend web ni alojar secretos de producción |
| Supabase STAGING/PROD | Proyectos separados para datos y servicios gestionados, con promoción controlada | Compartir credenciales o datos entre entornos |
| Render DEV/STAGING (si se habilita) | Runtime de servicios web/worker/preview y URLs de integración | Convertirse en autoridad de identidad, tenancy o RLS |
| Render PROD (si se habilita) | Despliegue de runtime aprobado, observabilidad y rollback | Recibir claves privilegiadas en cliente o sustituir controles Supabase |

La existencia, topología y despliegue de Render sigue **propuesta/no verificada**.
Las variables viven por entorno y los secretos no se versionan. Esta separación
complementa [`docs/03-platform/governance/ENVIRONMENTS.md`](../../../docs/03-platform/governance/ENVIRONMENTS.md);
antes de un deploy debe añadirse evidencia de configuración, health check,
rollback, migraciones y ownership.

## Contratos fundacionales

Antes de promover cualquier slice a backend real o native, se debe documentar y
versionar, sin duplicar por cliente:

| Contrato | Mínimo obligatorio |
|---|---|
| Auth/identity | sesión, expiración, refresh/revocación, usuario, membresía y estado seguro |
| Organization/workspace | contexto activo, cambio de contexto, scope de cada request y cache partitioning |
| Tenancy/RLS | ownership, políticas por tabla, cross-tenant denial y fixtures de dos organizaciones |
| Permissions | capabilities, roles, acciones, `401/403`, permisos sensibles y fallback de UI |
| API | envelope `data/meta`, errores con `code/traceId`, UUID, UTC, paginación, idempotencia y `/api/v1` |
| Domain/events | entidades, invariantes, lifecycle, actor/origin, correlation ID y eventos versionados |
| Audit | append-only, actor, organización, workspace, acción, recurso, resultado y retención |
| Sync | revision/version, outbox, ordering, dedupe, retry/backoff, conflict y recovery |

La referencia API vigente es
[`docs/03-platform/backend/API_STANDARDS.md`](../../../docs/03-platform/backend/API_STANDARDS.md).
La documentación de CRM debe enlazar estos contratos; no copiar definiciones en
cada UX de cliente.

## Árbol de documentación

El set suite-level debe vivir bajo `docs/06-product/<suite>/` y enlazar contratos
Platform sin crear una segunda fuente:

```text
docs/06-product/
├── _templates/SUITE_MULTIPLATFORM_DOCUMENTATION_TEMPLATE.md
├── <suite>/
│   ├── README.md
│   ├── shared/
│   │   ├── domain/
│   │   ├── backend-api/
│   │   ├── access-audit/
│   │   ├── sync/
│   │   ├── cross-platform/
│   │   └── visual/
│   ├── modules/
│   ├── surfaces/{web-desktop,web-mobile,ios,android}/
│   ├── backend-api/
│   ├── cross-platform/
│   ├── fixtures/
│   └── archive/                 # referencias intactas, no fuente activa
└── crm/
    ├── CRM_MULTIPLATFORM_DOCUMENTATION_SCHEMA.md
    ├── CRM_FRONTEND_CLOSURE_MATRIX.md
    ├── modules/                 # destino; migración no destructiva
    └── surfaces/                # destino; no implica implementación nativa
```

El contrato de suite debe seguir
[`docs/06-product/_templates/SUITE_MULTIPLATFORM_DOCUMENTATION_TEMPLATE.md`](../../../docs/06-product/_templates/SUITE_MULTIPLATFORM_DOCUMENTATION_TEMPLATE.md)
y el CRM debe usar
[`docs/06-product/crm/CRM_MULTIPLATFORM_DOCUMENTATION_SCHEMA.md`](../../../docs/06-product/crm/CRM_MULTIPLATFORM_DOCUMENTATION_SCHEMA.md)
como esquema, sin resucitar `docs/06-product/archive/`.

## Fases y gates

| Fase | Objetivo | Gate de salida | Estado |
|---|---|---|---|
| 0. Fundación documental | autoridad, árbol, inventario, owners y evidence tiers | source map y matriz aprobados | en curso |
| 1. Contratos Platform | auth, tenancy, API, permisos, audit, eventos y environments | contratos versionados + casos denial | pendiente |
| 2. Visual normativo | un documento visual, tokens, estados y evidencia SVG/PNG | comparativa desktop/mobile y accesibilidad | pendiente |
| 3. Launchpad slice | entrada, contexto y estados Platform extremo a extremo | runtime web + tests + screenshots + traceability | pendiente |
| 4. CRM Overview slice | primera suite consumiendo contratos compartidos | capability matrix y estados aprobados | pendiente |
| 5. Sync/multiclient | offline/local-first y límites por cliente | conflict/recovery evidence por capability | pendiente |
| 6. Native/release | decisión de apps, targets, ambientes y pruebas | decisión explícita; nunca por supuesto | pendiente |
| 7. Promoción | revisión y handoff | verdict, riesgos residuales y rollback | pendiente |

Gates transversales: suite documentation, client-surface, mobile, tenant/environment,
deployment y multiplatform verification. Fallar un gate bloquea promoción y no se
resuelve cambiando el estado del documento.

## Milestones

1. **M1 — Foundation index:** source map, ownership matrix, árbol y clasificación
   de fuentes actuales/propuestas/archivadas.
2. **M2 — Contract baseline:** contratos shared con ejemplos de autorización,
   error, audit, versionado y entorno Supabase/Render.
3. **M3 — Visual baseline:** documento visual único y SVG/PNG equivalentes para
   Launchpad y CRM Overview en desktop web y mobile web.
4. **M4 — Launchpad proof:** flujo verificable desde auth/contexto hasta suite entry,
   con loading/empty/forbidden/error/offline states según contrato.
5. **M5 — CRM Overview proof:** overview usa los mismos límites de org/workspace,
   permisos, audit y evidence matrix.
6. **M6 — Readiness decision:** decisión separada sobre native, offline write,
   API productiva y deploy; cada sí/no debe aportar evidencia o quedar proposed.

## Workstreams

| Workstream | Resultado | Owner propuesto |
|---|---|---|
| Suite documentation | índices, schema, source map, migración no destructiva | Documentation/Product |
| Platform contracts | auth, org/workspace, tenancy, permissions, API, audit/events | Platform |
| Launchpad | vertical slice de shell, navegación, capability y estados | Platform/Web |
| CRM Overview | primer consumidor de suite y contratos Platform | CRM/Product |
| Client boundaries | desktop web, mobile web, iOS, Android y capability matrix | Surface owners |
| Native/release | decisión tecnológica, build channels, QA/TestFlight/Play testing | Mobile/Release |
| Local-first/sync | cache, outbox, conflict, retry, recovery y freshness | Sync/Platform |
| Visual system | fuente visual única y evidencia SVG/PNG cross-platform | Design |
| Environments/deploy | Supabase/Render roles, secrets, promotion, rollback | DevOps/Platform |
| Verification | tests, runtime, accessibility, security, screenshots y traceability | Verify |

## Entregables

- Índice suite-level conforme a template y schema CRM.
- Matriz de capacidades por cliente con offline, permisos, API/eventos, device
  integrations, accesibilidad y versión mínima.
- Contratos shared de auth, context, tenancy, permissions, API, audit y sync,
  marcados `current` o `proposed` con evidencia.
- Documento visual normativo único; SVG estructural/estilizado y PNG renderizado
  para Launchpad y CRM Overview, con viewport, commit y herramienta registrados.
- Matrices de estados (loading, empty, error, forbidden, stale, offline,
  conflict, success) y accesibilidad por superficie.
- Runbook DEV/STAGING/PROD con separación Supabase/Render, secretos, health,
  migración, rollback y ownership.
- Native readiness record que preserve explícitamente “no implementado” cuando no
  haya source/build/runtime/release evidence.
- Gate report y traceability matrix para cada slice.

## Dependencias

- [`tracks/active/platform/2026-09-09-loopdev-v2-monorepo-multitenancy.md`](2026-09-09-loopdev-v2-monorepo-multitenancy.md):
  dirección incremental de monorepo, adapters, Supabase y tenancy.
- [`tracks/active/crm/2026-09-09-loopdev-v2-crm-frontend.md`](../crm/2026-09-09-loopdev-v2-crm-frontend.md):
  estado frontend-first y CRM Overview implementado localmente.
- [`docs/06-product/crm/CRM_FRONTEND_CLOSURE_MATRIX.md`](../../../docs/06-product/crm/CRM_FRONTEND_CLOSURE_MATRIX.md):
  estado de superficie CRM, sin confundirlo con backend.
- [`docs/03-platform/frontend/MOBILE_SHELL_NAVIGATION_CONTRACT.md`](../../../docs/03-platform/frontend/MOBILE_SHELL_NAVIGATION_CONTRACT.md)
  y [`docs/03-platform/mobile/MOBILE_APPS_IOS_ANDROID.md`](../../../docs/03-platform/mobile/MOBILE_APPS_IOS_ANDROID.md):
  frontera web responsive/native propuesta.
- [`docs/implementation/crm/pipeline/README.md`](../../../docs/implementation/crm/pipeline/README.md):
  run pausado y artefactos conservados.

### Dependencia bloqueante: CRM Pipeline

`MOD-CRM-PIPELINE-20260913-002` está **PAUSED** en
`WAITING_VISUAL_DESIGN_APPROVAL`. No debe reanudarse hasta que esta fundación
establezca y apruebe los contratos de documentación, visual, acceso, API, sync,
tenancy y evidencia que el run debe consumir. No se deben crear sus issues,
aprobar su plan, iniciar Build/Verify ni reinterpretar sus artefactos como
implementación. La reanudación requiere un gate explícito y mantener el estado
visual pendiente hasta tener aprobación separada.

## Riesgos

| ID | Riesgo | Mitigación | Estado |
|---|---|---|---|
| R-01 | Documentos propuestos se toman por runtime existente | evidence tiers, source map y gate de promoción | abierto |
| R-02 | Backend por cliente o API duplicada | contratos shared y revisión de dependencias | abierto |
| R-03 | RLS/tenant incompleto permite cross-org | fixtures multi-org, denial tests y revisión Platform/Security | abierto |
| R-04 | Offline oculta conflictos o datos no confirmados | estados pending/conflict/stale y recovery verificable | abierto |
| R-05 | Supabase y Render mezclan autoridad/secretos | matriz de roles, proyectos separados y deploy checklist | abierto |
| R-06 | Pixel parity retrasa clientes o fuerza layouts incorrectos | compartir semántica; aceptar proyecciones justificadas | abierto |
| R-07 | Pipeline se reanuda por presión de entrega | dependencia bloqueante registrada y owner de gate | abierto |
| R-08 | Evidencia visual no es reproducible | SVG/PNG con viewport, commit, fuente y herramienta | abierto |

## Decisiones y preguntas abiertas

| ID | Tipo | Decisión/pregunta | Estado |
|---|---|---|---|
| D-01 | decisión | Launchpad es el slice Platform y CRM Overview el primer slice de suite | propuesta de este track |
| D-02 | decisión | Supabase es autoridad de datos/auth prevista; Render solo runtime previsto | propuesta; Render no verificado |
| D-03 | decisión | Native apps no existen como implementación hasta evidencia source/build/release | vigente |
| D-04 | decisión | Offline se habilita por capability, no por plataforma completa | propuesta |
| Q-01 | pregunta | ¿Qué framework y paquete de contratos usarán iOS/Android? | abierta |
| Q-02 | pregunta | ¿Qué entidades permiten escritura offline y qué conflictos requieren intervención? | abierta |
| Q-03 | pregunta | ¿Cuál es la estrategia de versionado API/eventos y compatibilidad mínima? | abierta |
| Q-04 | pregunta | ¿Qué servicios se alojarán realmente en Render y quién opera rollback? | abierta |
| Q-05 | pregunta | ¿Qué matrix de OS, device, localización y accesibilidad se soporta por release? | abierta |
| Q-06 | pregunta | ¿Qué integraciones nativas requieren aprobación de privacidad? | abierta |

## Criterios de aceptación

- [ ] Existe un índice suite-level que sigue el template, enlaza el schema CRM y
  clasifica fuentes sin modificar ni reactivar archivos archivados.
- [ ] Launchpad y CRM Overview tienen objetivo, owner, capability matrix,
  estados, límites de cliente y trazabilidad separados.
- [ ] `docs/06-product/launchpad/LAUNCHPAD_MULTIPLATFORM_CONTRACT.md` está
  aprobado como contrato funcional de Launchpad para web, iOS y Android.
- [ ] Auth, organization, workspace, tenancy, permissions, API, audit, events y
  sync tienen contratos shared o están marcados `proposed` con gaps explícitos.
- [ ] Cada afirmación de backend o native distingue diseño de implementación y
  contiene source/runtime/build/release evidence cuando se marque current.
- [ ] Desktop web, mobile web, iOS y Android tienen fronteras, no paridad forzada,
  requisitos de accesibilidad y estado offline documentados.
- [ ] Supabase y Render tienen roles, entornos, secretos, promoción y rollback
  separados; la existencia de Render no se afirma sin evidencia.
- [ ] Un único documento visual normativo genera evidencia SVG/PNG comparable,
  con viewport, commit, fuente y resultado de validación.
- [ ] Los gates suite, client-surface, mobile, tenant/environment, deployment y
  multiplatform verification tienen owner, salida y verdict.
- [ ] Se documentan local-first, outbox, idempotencia, conflictos, retry,
  recovery, stale/pending/conflict y cambio de organización.
- [ ] El Pipeline permanece pausado y no se reanuda hasta aprobación explícita
  de esta fundación y sus contratos requeridos.
- [ ] `git diff --check` pasa y los cambios quedan limitados a los artefactos
  explícitamente incluidos en este track.

## Requisitos de evidencia

Cada gate debe guardar, según aplique:

- commit/ref, ruta, comando y resultado de tests/unit/integration/contract;
- URL y HTTP status de runtime, entorno y timestamp;
- fixtures de al menos dos organizaciones/workspaces y pruebas `401/403/404/409`;
- screenshots PNG y fuentes SVG (estructural y estilizada), viewport, device,
  browser/OS y comparación contra el documento visual normativo;
- matriz de accesibilidad (teclado, foco, contraste, screen reader, touch,
  Dynamic Type/TalkBack cuando exista cliente);
- logs de sync con queue/retry/conflict/recovery y prueba de no afirmar
  confirmación server-side antes de sincronizar;
- para native: source target, build firmado reproducible, canal QA/beta, versión
  mínima, crash/sync telemetry y evidencia de TestFlight/Play testing. En ausencia
  de todo ello, el estado obligatorio es `proposed/not implemented`.

## Ownership

| Artefacto/decisión | Accountable | Consultados |
|---|---|---|
| Este track y source map | Platform | Product, Documentation |
| Contratos auth/tenancy/API/audit | Platform | Security, Backend, CRM |
| Launchpad | Platform/Web | Design, Accessibility |
| CRM Overview | CRM/Product | Platform, Design |
| Proyección por cliente | Surface owner | Product, Platform, Accessibility |
| Visual normativo y SVG/PNG | Design | Surface owners, Verify |
| Sync/offline/conflicts | Sync/Platform | Mobile, CRM, Security |
| Environments/deployment | DevOps/Platform | Backend, Security |
| Gate verdict y evidencia | Verify/Delivery | Todos los owners |
| Reanudación del Pipeline | Product + Platform | CRM, Documentation |

## Relación con tracks y runs existentes

Este track complementa, no reemplaza, `loopdev-v2-monorepo-multitenancy`, que
continúa gobernando la migración incremental de arquitectura. Complementa
`loopdev-v2-crm-frontend`, cuyo frontend local-first permanece válido; no convierte
su adapter local en persistencia remota.

El Pipeline run `MOD-CRM-PIPELINE-20260913-002` es una dependencia bloqueada:
sus artefactos de domain/access/API/sync se conservan como insumos para el
inventario, pero el run no se reanuda, no se edita y no se trata como aprobación
de esta fundación. La relación solo podrá cambiar después de un gate documentado,
con la visual design approval separada y los contratos shared aceptados.

## Change log

| Date | Change | Run/issue/commit | Approved by |
|---|---|---|---|
| 2026-09-13 | Creado como fundación activa de plataforma multiplataforma; Pipeline mantenido pausado | `MOD-CRM-PIPELINE-20260913-002` | pending |
