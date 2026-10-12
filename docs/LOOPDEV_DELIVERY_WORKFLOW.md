# LoopDev v2: flujo de delivery y automatizacion

## Proposito

Este documento explica a un desarrollador o agente como LoopDev v2 convierte una
necesidad de producto en un modulo documentado, implementado, verificado y listo
para revisar. El objetivo es automatizar todo lo repetible sin convertir la
existencia de codigo, un build verde o un commit en una falsa prueba de que el
modulo funciona.

El flujo esta pensado para:

- preservar la definicion de producto y los limites aprobados;
- reutilizar Platform y evitar implementaciones duplicadas;
- mantener una sola semantica para desktop web, mobile web, iOS y Android;
- producir evidencia trazable por fase;
- detenerse ante decisiones, riesgos o desviaciones que requieren criterio humano;
- permitir reanudar una ejecucion fallida sin perder su historial.

Este es un resumen operativo. Las fuentes normativas son el contrato del agente,
las skills y los contratos de gobierno enlazados al final.

## Idea central

El delivery de LoopDev no es una secuencia de prompts que genera pantallas. Es
una orquestacion por fases:

```text
solicitud de modulo
  -> contexto y discovery
  -> diseno funcional y arquitectonico
  -> diseno visual aprobado
  -> analisis de dominio, acceso, API y sincronizacion
  -> plan ejecutable
  -> build incremental
  -> verificacion objetiva
  -> review de release
  -> commit, push y pull request
```

Cada fase tiene:

- una skill responsable;
- entradas y salidas explicitas;
- un checkpoint JSON;
- evidencia humana o automatizada;
- un estado (`completed`, `blocked`, `failed`, `deviated`, etc.);
- un siguiente handoff.

El agente `delivery` coordina el proceso, pero no sustituye el criterio de las
skills especializadas. Un helper define dominio, permisos, contratos API o
sincronizacion; no implementa silenciosamente fuera del plan.

## Fuentes de verdad

Antes de analizar o construir, el agente debe distinguir target aprobado,
implementacion real y contexto historico:

| Pregunta | Fuente canonica |
|---|---|
| Que producto se debe construir | `docs/06-product/<suite>/<module>/` |
| Que arquitectura y alcance se aprobaron | `docs/implementation/<suite>/<module>/` |
| Que trabajo largo y dependencias existen | `tracks/active/` |
| Que trabajo es ejecutable | Issues de GitHub por fase |
| Que codigo y tests existen | `src/`, `apps/mobile/`, `packages/contracts/`, `scripts/` |
| Que evidencia deja cada fase | `docs/implementation/<suite>/<module>/runs/<run-id>/` |
| Que contrato rige la plataforma | `docs/03-platform/governance/` |

Orden minimo de lectura:

1. `V2_DOCUMENTATION_SOURCE_OF_TRUTH.md`.
2. `MULTIPLATFORM_DELIVERY_CONTRACT.md`.
3. Track activo y definicion de producto aplicable.
4. Referencias visuales y de shell V2.
5. Workspace de implementacion y checkpoints existentes.
6. Rutas, dominios, adapters, contratos, tests y runtime real.

Los documentos `SAAS_*` son propuestas y los documentos archivados son contexto
historico. Ninguno demuestra por si mismo que una capacidad exista en runtime.

## Modos de operacion del agente

El agente soporta tres modos:

| Modo | Comportamiento |
|---|---|
| `interactive` | Se detiene en cada gate de aprobacion. Es el modo por defecto. |
| `plan` | Hace discovery, diseno y plan sin modificar produccion. |
| `autopilot` | Ejecuta el alcance aprobado, valida fases y puede crear commits locales; se detiene ante bloqueos, desviaciones, push, pull request o aprobaciones. |

`autopilot` no significa autonomia sin limites. Nunca debe aprobar su propio
alcance, hacer push, crear un pull request o esconder una desviacion.

## Ciclo de delivery

### 1. Intake y auditoria de contexto

El agente identifica modulo, suite, producto, track, checkout, rama, commit,
working tree, runtime y `run_id`. Declara tambien `PLATFORM_SCOPE`:

```text
PLATFORM_SCOPE:
- desktop_web
- mobile_web
- ios
- android
```

Desktop web y mobile web son obligatorios para un modulo nuevo salvo excepcion
aprobada. iOS y Android quedan como `planned` o `not_applicable` solamente con
owner y seguimiento explicito.

El workspace canonico se crea en:

```text
docs/implementation/<suite>/<module>/
```

Como minimo contiene:

```text
README.md
architecture-design.md
implementation-plan.md
requirement-evidence-matrix.md
platform-scope.md
platform-evidence-matrix.md
runs/<run-id>/run.json
```

### 2. Discovery: entender antes de disenar

`module-discovery` reconcilia la solicitud, el producto aprobado, la base de
mercado, Platform y el estado actual del repositorio. Debe responder:

- problema, actores, outcome y limite del modulo;
- entidades, estados, invariantes, entradas, salidas y eventos;
- que consume y que produce el modulo dentro de la suite;
- que ya existe, que falta, que contradice el target y que no esta probado;
- que capacidades son MVP, follow-up, Platform, especificas o fuera de alcance;
- como cambia cada capacidad entre desktop, mobile web, iOS y Android.

El resultado es una matriz expected-versus-existing con evidencia. La presencia
de una ruta o componente no se clasifica como alineacion sin comportamiento,
contrato o test observable.

### 3. Design: definir el modulo completo

`module-design` produce el diseño funcional y arquitectonico. Debe cubrir
producto, UX, dominio, frontend, backend futuro, datos, permisos, local-first,
sincronizacion, integraciones y rollout.

Cada capacidad transversal se clasifica antes de crearla:

```text
REUSE            usar el contrato y renderer compartidos existentes
EXTEND_PLATFORM  ampliar Platform antes de consumirla desde el modulo
MODULE_SPECIFIC  regla propia del dominio
BLOCKED          falta una decision o evidencia segura
```

Notes, Files, Activity, Tasks, Relations y Document Intelligence se consumen
mediante sus contratos existentes. No se crean editores de notas, uploaders,
previews, timelines, task widgets, extractores o modelos de permisos paralelos.

El diseño tambien establece estados de UI, rutas, deep links, permisos,
accesibilidad, i18n, RTL, rollback y criterios de aceptacion.

### 4. Visual design: gate obligatorio

`module-visual-design` ocurre despues de discovery y design, y antes del
analisis especializado o la aprobacion del plan. Produce:

- `visual-design.md` como fuente normativa;
- `view-state-matrix.md`;
- wireframes SVG revisables;
- evidencia para desktop y mobile;
- inventario Rivera/LoopDev, matriz de reutilizacion y decisiones abiertas.

El agente se detiene en `WAITING_VISUAL_DESIGN_APPROVAL` hasta que una persona
aprueba composicion, jerarquia, estados, breakpoints, accesibilidad y
reutilizacion de primitivas. Un SVG o un build correcto no equivale a esa
aprobacion.

### 5. Analisis especializado

Los helpers son child phases del design o del plan:

| Skill | Decide |
|---|---|
| `domain-model` | entidades, relaciones, estados, invariantes, eventos, archive/delete/restore |
| `access-design` | RBAC, scopes, tenancy, RLS, datos sensibles, auditoria y pruebas de escalamiento |
| `api-contracts` | comandos, queries, DTOs, errores, eventos, paginacion, idempotencia y versionado |
| `sync-design` | storage local, cola de mutaciones, retry, conflictos, reconciliacion y migracion |

Cada helper diferencia `confirmed`, `assumed` y `open`. Una decision abierta que
impide continuar se convierte en `blocked`, no en una suposicion escondida.

### 6. Plan ejecutable

`module-plan` convierte el design aprobado en tareas ordenadas, con ID,
dependencias, areas afectadas, riesgo, validacion y definition of done.

El primer trabajo debe incluir auditorias de:

- entorno y runtime;
- reutilizacion de Platform;
- flujos legacy;
- rutas y deep links;
- estados de superficie;
- accesibilidad e i18n;
- seguridad y rollback;
- limites arquitectonicos;
- responsabilidades, SRP, cohesion y coupling;
- seguridad de refactors.

Tambien crea o actualiza el track y una issue de GitHub por fase. Una issue no
se cierra solo porque el codigo compile: necesita criterios, evidencia y
checkpoint completos.

### 7. Build incremental

`module-build` implementa un plan aprobado en fases coherentes. En cada fase:

1. confirma checkout, rama, commit, working tree y runtime;
2. implementa solo el alcance aprobado;
3. mantiene separadas presentacion, aplicacion, dominio, ports/contracts y adapters;
4. reutiliza Platform y el baseline visual Rivera;
5. cubre el comportamiento local-first cuando aplique;
6. anade o actualiza tests junto al cambio;
7. ejecuta validacion focalizada;
8. actualiza evidencia y checkpoint.

Un cambio de contrato compartido, de permisos, de migracion o de alcance
requiere la aprobacion correspondiente y puede invalidar fases posteriores.

### 8. Verify: evidencia objetiva

`module-verify` compara producto, discovery, design, plan, codigo, tests y
runtime. Genera una matriz por requisito con `PASS`, `PARTIAL`, `FAIL`,
`NOT_TESTED` o `NOT_APPLICABLE`.

Debe revisar, segun aplique:

- loading, empty, error, forbidden, conflict, offline, pending y success;
- rutas directas, refresh, navegacion, back y deep links;
- desktop web y mobile web por separado;
- iOS/Android o una excepcion documentada con owner;
- accesibilidad, keyboard, focus, responsive, i18n y RTL;
- permisos fuera de la UI, tenant isolation, cache tras perder permisos y exports;
- sincronizacion, migracion, feature flags, rollback y recovery;
- consumidores existentes de Platform y ausencia de duplicados;
- limites de arquitectura, responsabilidades y regresiones.

Un typecheck, build o commit solo prueba que una parte tecnica paso; nunca
sustituye evidencia funcional o de runtime.

### 9. Review de release

`module-review` emite uno de estos veredictos:

```text
READY
READY_WITH_GAPS
NOT_READY
BLOCKED
```

Debe rankear findings por severidad y confianza, separar bloqueos de mejoras,
revisar deuda residual y emitir veredictos separados para desktop y mobile.
Un modulo no esta listo si una superficie mobile dentro del scope carece de
evidencia funcional, visual, de accesibilidad o runtime.

La calidad arquitectonica transversal se mantiene como:

```text
PENDING | PASS | PASS_WITH_DEBT | DEVIATED | BLOCKED | FAIL
```

Una desviacion arquitectonica no aprobada bloquea release aunque pasen tests,
typecheck y build.

### 10. Git delivery

`git-workflow` registra el estado Git por separado de la evidencia funcional.
Usa ramas de trabajo, commits Conventional Commits y recovery mediante
`git revert`. El agente nunca hace reset, amend, force-push ni reescribe
historial autonomamente.

Los commits locales pueden crearse despues de una fase aprobada y validada.
Push y pull request siempre requieren aprobacion explicita.

La trazabilidad final debe conectar:

```text
run_id
  -> checkpoints
  -> evidencia
  -> commit
  -> rama remota
  -> pull request
  -> CI
  -> review
  -> merge
```

## Automatizacion disponible hoy

### Inicializacion y checkpoints

Desde la raiz del repositorio:

```bash
npm run delivery:init -- --suite crm --module Contacts
npm run delivery:start-phase -- --suite crm --module Contacts \
  --run MOD-CONTACTS-YYYYMMDD-001 --phase 00-discovery \
  --skill module-discovery
npm run delivery:complete-phase -- --suite crm --module Contacts \
  --run MOD-CONTACTS-YYYYMMDD-001 --phase 00-discovery \
  --data path/to/completion-data.json
npm run delivery:approve -- --suite crm --module Contacts \
  --run MOD-CONTACTS-YYYYMMDD-001 --gate design \
  --by owner@example.com --role product_owner \
  --artifact docs/implementation/crm/contacts/architecture-design.md \
  --fingerprint sha256:<64-hex> --source https://github.com/org/repo/issues/123
npm run delivery:handoff -- --suite crm --module Contacts \
  --run MOD-CONTACTS-YYYYMMDD-001 --from 00-discovery --to 01-design
npm run delivery:resume -- --suite crm --module Contacts \
  --run MOD-CONTACTS-YYYYMMDD-001 --reason "Resolved product decision"
npm run delivery:validate
npm run validate:delivery-ledgers
npm run report:delivery-ledgers
npm run test:multiplatform-contracts
npm run validate:mobile-boundaries
npm run delivery:report
```

`delivery-run.mjs` automatiza la creacion del `run_id`, la secuencia diaria, el
workspace desde templates, el manifest `run.json`, transiciones de fase,
approvals ligadas a fingerprints, handoffs, fingerprints por categoria,
invalidacion transitiva, paquetes de resume y la llamada a los validadores. El
grafo canonico se encuentra en
`docs/03-platform/governance/delivery-workflow.json`.

`delivery-ledger.json` enlaza requirements, capabilities y tareas mediante IDs
estables. El validador rechaza referencias no reciprocas, plataformas requeridas
sin tarea, dependencias ciclicas, tareas sin criterios/comandos y eliminaciones
de scope sin change request aprobado. Discovery y design completan el alcance y
la semantica; plan agrega tareas y solo puede cerrar con el ledger aprobado.

Desde la version 2 del workflow, iniciar o completar `08-verify`, `09-review` o
`10-git` exige un ledger aprobado, sin blockers, con todas las tareas en `done`
y con sus referencias de evidencia presentes en el checkout. Aprobar los gates
`verification` y `release` vuelve a comprobar estas condiciones y exige los
checkpoints correspondientes; release tambien requiere verification aprobada.
Al iniciar `08-verify`, el run fija el commit HEAD y el fingerprint del ledger;
el cierre falla si cambia cualquiera de los dos o si queda codigo sin commit
fuera de los registros del run. Cada validacion debe registrar `exit_code: 0` y
el `source_commit` fijado. Los runs de workflow version 1 conservan su
comportamiento historico.

El fingerprint es importante: si cambia un contrato compartido, el resume
marca la fase afectada para revalidacion en vez de reutilizar evidencia vieja.

### Validaciones de repositorio

```bash
npm run validate:module-runs
npm run validate:contracts
npm run smoke:routes
npm run validate:multiplatform
```

Estas validaciones automatizan:

- forma y campos obligatorios de manifests y checkpoints;
- estados y gates de aprobacion validos;
- IDs estables y metadatos de capability contracts;
- reutilizacion del action catalog compartido en Contacts;
- existencia y estructura de matrices multiplataforma;
- evidencia minima, owner y follow-up para `NOT_TESTED` o `N/A`;
- rutas desktop/mobile del manifest de smoke y checks deterministas declarados.

Los scripts no pueden demostrar por si solos que un usuario completara el
flujo en un navegador o dispositivo. Las filas de smoke marcadas como
dependientes de runtime requieren evidencia manual o de automatizacion de
navegador en la matriz de plataforma.

### Baseline web y mobile

La validacion tecnica minima definida por el contrato multiplataforma es:

```bash
npm run lint
npm run typecheck
npm run test:quality
npm run build

cd apps/mobile
npm ci
npx tsc --noEmit
npx expo-doctor
npx expo export --platform web --output-dir /tmp/loopdev-mobile-web
```

El subconjunto puede ser mas pequeno para un cambio focalizado, pero el
checkpoint debe registrar que se omitio, por que y que riesgo queda.

### CI

`.github/workflows/ci.yml` separa las responsabilidades:

- `module-traceability`: checkpoints, contratos, smoke y contrato multiplataforma;
- `code-quality`: lint y typecheck web;
- `tests`: tests de calidad;
- `build`: build de produccion web;
- `mobile-quality`: `npm ci`, TypeScript mobile, `expo-doctor` y export web mobile.

Los jobs de aplicacion y mobile se activan mediante `paths-filter`, por lo que
un cambio focalizado puede evitar trabajo no relacionado sin saltarse los gates
que corresponden a sus rutas o contratos.

## Que automatizar y que no automatizar

### Automatizable con bajo riesgo

- crear run IDs, manifests, checkpoints y handoffs;
- calcular fingerprints y detectar invalidacion de evidencia;
- validar JSON, tablas, estados, IDs, contratos y rutas;
- ejecutar lint, typecheck, tests, builds y checks Expo;
- generar reportes de runs;
- preparar cambios mecanicos y commits locales despues de gates aprobados;
- actualizar matrices con resultados de comandos cuando la evidencia sea
  determinista y trazable.

### Debe conservar aprobacion o juicio humano

- objetivo de negocio, MVP y fuera de alcance;
- decisiones abiertas de dominio, seguridad, tenancy, API y sincronizacion;
- aprobacion visual y de accesibilidad;
- extensiones de Platform y cambios de contratos compartidos;
- migraciones destructivas, RLS, datos sensibles y rollback;
- aceptar deuda residual o una desviacion arquitectonica;
- afirmar evidencia de runtime, UX, permisos o comportamiento nativo;
- push, pull request, release y merge.

La regla practica es: automatizar la comprobacion y la preparacion; no
automatizar la aprobacion de decisiones cuyo coste de error sea alto.

## Fallos, bloqueos y reanudacion

Cuando algo falla, el agente debe:

1. registrar codigo de error y checkpoint;
2. separar `detected_by` de `likely_origin`;
3. mantener abierta la issue de la fase;
4. declarar siguiente accion y owner;
5. conservar el mismo `run_id`;
6. incrementar `attempt` al reanudar;
7. invalidar evidencia downstream si cambiaron las entradas.

Estados que detienen dependencias:

```text
blocked | failed | deviated | waiting_user | paused
```

Una fase reanudada no repite automaticamente todo el run. Solo se reabren
fases completadas si cambio una entrada, un contrato compartido o la evidencia
que las sustentaba.

## Comunicacion minima de cada update

Cada reporte del agente debe incluir:

```text
Run ID:
Current phase:
Current skill:
Status:
Issue:
Evidence:
Blocker or decision:
Next handoff:
```

Esto evita reportes vagos como “ya esta listo” y hace visible si el problema es
de producto, implementacion, evidencia, runtime o delivery.

## Definition of Done del delivery

Un run solo puede considerarse completo cuando:

- las requirements tienen evidencia de implementacion;
- todas las superficies desktop/mobile dentro del scope tienen evidencia;
- las integraciones Platform y cross-module fueron verificadas;
- los estados de UI aplicables estan cubiertos;
- rutas, runtime, accesibilidad, i18n y RTL fueron revisados;
- seguridad, tenant isolation, migracion y rollback estan atendidos;
- issues y checkpoints de fases estan completos;
- `module-review` emitio veredicto final;
- `ARCHITECTURE_QUALITY` es `PASS` o `PASS_WITH_DEBT` aprobado;
- Git delivery esta registrado separadamente.

`READY_WITH_GAPS`, `BLOCKED`, `FAIL`, `PARTIAL` y `NOT_TESTED` no son estados de
completion.

## Como usar este flujo en la practica

Para empezar un modulo, el desarrollador debe aportar, como minimo:

1. nombre del modulo y problema de negocio;
2. suite propietaria y producto relacionado;
3. resultado esperado y limites conocidos;
4. integraciones o dependencias conocidas;
5. modo deseado: `interactive`, `plan` o `autopilot`.

El agente debe hacer primero contexto y discovery. No debe empezar creando
componentes porque exista una pantalla parecida. Si el pedido es ambiguo,
debe formular la minima pregunta que desbloquea una decision segura y dejar
las demas suposiciones registradas.

Para un cambio pequeño sobre un modulo existente, el mismo principio aplica en
escala reducida: identificar el contrato, la superficie, el estado afectado,
la prueba focalizada y el riesgo multiplataforma antes de editar.

## Referencias normativas

- [Auditoria de automatizacion del delivery](LOOPDEV_DELIVERY_AUTOMATION_AUDIT.md)
- [Delivery Agent](../.github/agents/delivery.agent.md)
- [Module Delivery Agent Contract](03-platform/governance/MODULE_DELIVERY_AGENT_CONTRACT.md)
- [Module Development Traceability](03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md)
- [Multiplatform Delivery Contract](03-platform/governance/MULTIPLATFORM_DELIVERY_CONTRACT.md)
- [Documentation Source of Truth](03-platform/governance/V2_DOCUMENTATION_SOURCE_OF_TRUTH.md)
- [Implementation Documentation](implementation/README.md)
- [CI workflow](../.github/workflows/ci.yml)
- [Git Workflow skill](../.github/skills/git-workflow/SKILL.md)
