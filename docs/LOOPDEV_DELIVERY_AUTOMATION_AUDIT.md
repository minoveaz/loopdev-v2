# Auditoria del delivery automatizado multiplataforma de LoopDev v2

## Estado del documento

| Campo | Valor |
|---|---|
| Fecha | 2026-09-14 |
| Alcance | Definicion, diseno, plan, build, verify, review y delivery Git de modulos LoopDev |
| Plataformas | Desktop web, mobile web, iOS y Android |
| Caso de contraste | CRM Contacts y CRM Pipeline |
| Resultado | El modelo documental es amplio, pero el enforcement actual no impide saltos de fase, evidencia debil ni cierres parciales |

## Estado de implementacion

### Fase 0: implementada el 2026-09-14

- orden canonico corregido y centralizado en `delivery-workflow.json`;
- invariantes semanticas activas para ownership, completion, gates,
  predecesores, outputs y validaciones;
- workspaces descubiertos desde runs y estructura minima obligatoria;
- Contacts migrado a discovery/build bloqueados sin aprobar evidencia faltante;
- Pipeline 001 bloqueado y artefactos downstream de Pipeline 002 marcados como
  desviados hasta resolver el gate visual;
- workspace minimo de Contacts y matriz de requisitos de Pipeline
  materializados.

### Fase 1: implementada el 2026-09-14

- schemas versionados para workflow, run, checkpoint, approval, evidence y task;
- motor con `init`, `start-phase`, `complete-phase`, `block`, `approve`,
  `handoff` y `resume`;
- inicializacion idempotente desde templates;
- approvals ligadas a actor, rol, artefacto, fingerprint y fuente;
- fingerprints separados para product, design, plan, contracts, code y tests;
- invalidacion transitiva de fases y approvals;
- paquete determinista de resume;
- suite de regresion integrada en CI.

En este punto los schemas de task y evidence solo definian la frontera de las
fases siguientes; el ledger ejecutable se incorpora en la Fase 2 documentada a
continuacion.

### Fase 2: implementada el 2026-09-14

- ledger JSON versionado para requirements, capabilities, tasks y change
  requests;
- IDs estables y enlaces bidireccionales validados;
- cobertura obligatoria por plataforma requerida;
- tareas con owner, riesgo, dependencias, criterios, comandos y nivel de
  evidencia;
- deteccion de ciclos y de scope drops sin aprobacion;
- gates de discovery, design y plan conectados al ledger;
- fingerprints de scope e invalidacion de fases/approvals downstream;
- Contacts como piloto con 8 requirements, 8 capabilities y 24 tareas, todas
  bloqueadas hasta completar design, access y plan approvals.

Build por task atomica y evidencia runtime verificable siguen perteneciendo a
las Fases 4 a 6.

### Fase 3: implementada el 2026-09-14

- manifests ejecutables para Contacts y Pipeline con IDs, acciones, estados,
  validacion, permisos, navegacion y adaptaciones por plataforma;
- `ContactPort` neutral y validacion de mutaciones compartida bajo
  `packages/contracts`;
- adapters desktop y mobile explicitos, sin cargar el runtime web desde Expo;
- suite contractual unica ejecutada contra ambos adapters para list/search,
  permisos, validacion, create, update, conflicto, archive, Customer 360 y
  duplicate review;
- gate de CI que rechaza imports de `apps/mobile` hacia `src/`;
- rutas parametrizadas y ejemplos de deep link verificados para Contacts;
- correccion de `updatedAt` monotono para que optimistic concurrency no acepte
  dos escrituras dentro del mismo milisegundo;
- matriz de Contacts actualizada como `PARTIAL`: existe paridad de contrato de
  dominio, pero Customer 360 mobile solo ofrece un resumen de lectura con edit
  y archive; no tiene las acciones operativas de las tabs desktop. La evidencia
  runtime y la paridad de renderer permanecen pendientes.

### Fase 4: base de evidencia implementada el 2026-09-14

- validador de evidencia estructurada para comandos, tests, journeys runtime y
  screenshots;
- cada evidencia debe referenciar un requirement existente, el `HEAD` exacto y
  un artefacto con checksum verificable;
- la evidencia runtime se rechaza cuando el worktree esta sucio, evitando
  atribuir un resultado a un commit que no contiene el codigo ejecutado;
- gate integrado en CI y cubierto por regresiones de commit/checksum.

La evidencia estructurada no se exige durante desarrollo diario. Una tarea
`ready` o `in_progress` se valida con sus comandos focalizados; un task `done`
con nivel `E4_JOURNEY` o `E5_DEVICE` debe registrar evidencia ligada a su ID.
Playwright es una opcion para journeys web de riesgo, no un requisito general.

Los journeys de Contacts no se registran todavia como `PASS`: el ledger de
build sigue bloqueado y este checkout tiene cambios sin commit. Las pruebas de
componente Expo, recorridos browser y evidencia device quedan pendientes sobre
un task `ready` y un checkout limpio.

## Objetivo

Determinar por que el agente `delivery`, aun teniendo instrucciones y skills
detalladas, puede implementar solo una parte de lo definido, perder requisitos
durante build y no trasladar de forma completa las capacidades existentes en
desktop a mobile.

La auditoria evalua cinco propiedades:

1. que toda necesidad aprobada se convierta en trabajo ejecutable;
2. que ningun trabajo pueda cerrarse sin implementacion y evidencia;
3. que desktop y mobile compartan semantica sin duplicar reglas;
4. que una ejecucion pueda detenerse y reanudarse sin perder alcance;
5. que los gates importantes sean comprobados por herramientas y no dependan
   solo de que el agente recuerde instrucciones narrativas.

## Alcance revisado

Se revisaron:

- `docs/LOOPDEV_DELIVERY_WORKFLOW.md`;
- `.github/agents/delivery.agent.md`;
- las doce skills de delivery bajo `.github/skills/`;
- los contratos de delivery, trazabilidad, arquitectura y multiplataforma;
- `scripts/delivery-run.mjs`, los validadores de runs, contratos, rutas y
  multiplataforma;
- la configuracion CI y los scripts npm;
- los workspaces y checkpoints de CRM Contacts y CRM Pipeline;
- la implementacion CRM desktop y la aplicacion bajo `apps/mobile/`.

Esta es una auditoria estatica del sistema de delivery. Las observaciones de
runtime que aparecen en checkpoints existentes se evaluan como claims del run,
no como evidencia reproducida por esta auditoria.

## Validaciones reproducidas

El 2026-09-14 se ejecutaron desde la raiz del checkout auditado:

```bash
npm run validate:module-runs
npm run validate:multiplatform
```

Ambos comandos pasaron. El primero reporto 13 checkpoints validados y el segundo
reporto que el delivery multiplataforma era valido. Este resultado convive con:

- el checkpoint inconsistente de Contacts descrito en los hallazgos;
- la ausencia del workspace minimo multiplataforma de Contacts;
- evidencia declarada como completa sin browser rendering;
- Pipeline detenido en aprobacion visual con artefactos downstream ya creados.

Por tanto, el resultado verde actual demuestra conformidad de forma para los
archivos que el script descubre, no completitud funcional del delivery. Este es
el falso positivo de baseline que las Fases 0 y 1 deben convertir en tests de
regresion del sistema de delivery.

## Resumen ejecutivo

LoopDev ya tiene una definicion madura de lo que deberia ocurrir: fuentes de
verdad, fases, aprobaciones, trazabilidad, reutilizacion de Platform, estados de
UI, seguridad y evidencia multiplataforma. El problema principal no es una
falta de instrucciones. El problema es que la mayor parte de esas instrucciones
no forma una maquina de estados ejecutable.

Hoy es posible que:

- un modulo no tenga los artefactos minimos y quede fuera de algunos
  validadores;
- se cree un checkpoint de cualquier fase sin validar sus predecesores;
- un checkpoint quede `completed` con arquitectura `PENDING`, evidencia de
  runtime ausente o el run global bloqueado;
- un handoff se registre sin comprobar aprobaciones ni actualizar realmente la
  fase actual;
- desktop y mobile tengan rutas o componentes, pero no la misma cobertura de
  capacidades, estados, permisos y persistencia;
- un `PASS` se sostenga con texto que contiene palabras como `test` o `runtime`,
  sin verificar el archivo, comando, commit o resultado;
- el agente consuma gran parte de su contexto en discovery y diseno, y llegue a
  build con un plan demasiado grande para completar en una sola ejecucion.

La conclusion es:

> Las skills deben seguir explicando como razonar, pero la completitud, el orden
> de fases, la paridad y la validez de la evidencia deben salir del prompt y
> convertirse en datos tipados, comandos idempotentes y gates de CI.

## Diagnostico de causa raiz

```text
instrucciones extensas y correctas
             |
             v
artefactos Markdown y JSON parcialmente estructurados
             |
             v
validadores de presencia y formato, sin cobertura semantica completa
             |
             v
el agente puede decidir que una fase termino
             |
             v
build parcial + mobile incompleto + evidencia autorreferencial
```

El sistema actual usa al LLM como orquestador, ejecutor y juez de completitud.
Esas responsabilidades deben separarse:

- el agente propone, implementa y explica;
- el CLI controla transiciones y calcula cobertura;
- los tests prueban comportamiento;
- CI impide integrar estados incompletos;
- una persona aprueba decisiones de producto, visuales, seguridad y release.

## Hallazgos priorizados

### P0. La maquina de estados esta documentada, pero no esta implementada

**Evidencia**

- `MODULE_DELIVERY_AGENT_CONTRACT.md` define una secuencia desde `INTAKE` hasta
  `RELEASE_REVIEW` y prohibe avanzar cuando una fase esta bloqueada.
- `scripts/delivery-run.mjs checkpoint` acepta cualquier `--phase` y crea el
  checkpoint sin comprobar predecesores, aprobaciones ni artefactos requeridos.
- `handoff` registra un objeto `handoff`, pero no valida el checkpoint origen ni
  actualiza de forma consistente `current_phase`.
- `init` comienza en `01-design`, aunque discovery precede al design en el flujo
  operativo.

**Impacto**

El agente puede saltar discovery, visual design, analisis especializado o plan
approval. El orden depende de memoria conversacional en vez del estado del run.

**Correccion requerida**

Implementar un motor de transiciones con un grafo canonico. Cada transicion debe
validar predecesores, artefactos, aprobaciones, estado de arquitectura y
fingerprints antes de modificar `current_phase`.

### P0. Existen contradicciones internas en el orden obligatorio

**Evidencia**

En `.github/agents/delivery.agent.md`, la lista de routing coloca
`domain-model` antes de `module-visual-design`. El mismo archivo declara despues
que visual design debe ocurrir antes de todo analisis especializado. El contrato
de delivery usa discovery, design, visual design y luego specialized analysis.

Pipeline refleja el efecto: conserva checkpoints de analisis especializado y
plan mientras sigue en `WAITING_VISUAL_DESIGN_APPROVAL`.

**Impacto**

Dos ejecuciones igualmente razonables pueden seguir ordenes diferentes. Los
artefactos downstream existen, pero no estan autorizados para usarse.

**Correccion requerida**

Definir el orden una sola vez en un archivo machine-readable y hacer que el
agente, el CLI, los templates, el reporte y CI lo consuman. El Markdown debe
renderizarse o validarse contra esa fuente, no mantener otra copia manual.

### P0. `completed` no significa completo

**Evidencia**

El checkpoint de Contacts `03-build.json` tiene simultaneamente:

- `phase: 03-build`;
- `skill: module-verify`;
- `status: completed`;
- `architecture_quality: PENDING`;
- un `approval_gate` bloqueado;
- evidencia que reconoce que no hubo browser rendering;
- un handoff que mantiene el run bloqueado por verificaciones externas.

`validate-module-runs.mjs` valida campos y enums, pero no rechaza estas
combinaciones incompatibles.

**Impacto**

Los reportes pueden presentar una fase como terminada aunque no cumpla su
contrato. El agente aprende del checkpoint equivocado al reanudar.

**Correccion requerida**

Agregar invariantes de estado. Por ejemplo:

```text
checkpoint.status == completed
  => decision_status == confirmed
  => approval_gate.status in [approved, not_required]
  => architecture_quality in [PASS, PASS_WITH_DEBT]
  => all required outputs exist
  => all required validations passed
  => no blocking gap exists
```

Build y verify deben tener IDs y checkpoints distintos. Una skill no puede
cerrar una fase que no posee.

### P0. No existe una cadena obligatoria requisito -> capacidad -> tarea -> test -> evidencia

**Evidencia**

Las matrices actuales son Markdown y los checkpoints aceptan arrays libres. No
hay IDs referenciales obligatorios ni validacion de cobertura entre product,
design, plan, build y verify.

**Impacto**

Una capacidad puede estar bien descrita en design y desaparecer del plan o de
build sin producir un error. Este es el mecanismo principal por el que el agente
"hace cosas" pero no termina todo lo esperado.

**Correccion requerida**

Crear un ledger de requirements en JSON o YAML con IDs estables. Cada requisito
debe declarar plataformas, estados, permisos, contratos, tareas y tipos de
evidencia. Ninguna fase puede cerrar si disminuye la cobertura sin una decision
de scope aprobada.

### P0. La paridad desktop/mobile no parte de un inventario funcional ejecutable

**Evidencia**

- `smoke-routes.json` inventaria algunas rutas, no todas las capacidades dentro
  de cada ruta.
- el smoke valida registro de rutas desktop con mas profundidad que mobile;
- el contrato exige semantica compartida para acciones, validacion, permisos y
  lifecycle, pero no hay un comparador de cobertura entre renderers;
- Contacts no tiene el workspace minimo completo, incluyendo
  `platform-scope.md` y `platform-evidence-matrix.md`.

El codigo actual de Contacts muestra ademas una situacion que el flujo no puede
clasificar automaticamente: existen rutas y componentes mobile para varias
superficies, pero no hay una prueba transversal que determine si listar,
buscar, crear, editar, archivar, Customer 360 y duplicate review tienen la misma
semantica observable que desktop.

**Impacto**

La presencia de una pantalla mobile se confunde con paridad. Las diferencias de
acciones deshabilitadas, persistencia, errores, permisos o estados pueden quedar
sin detectar.

**Correccion requerida**

Introducir un `capability-manifest` por modulo. Debe separar:

- semantica compartida: comando, query, validacion, permiso, lifecycle y error;
- adaptacion de plataforma: ruta, navegacion, layout, input y feedback;
- evidencia por plataforma: contract test, component test y runtime journey.

La meta no es copiar la UI desktop en mobile. Es conservar la misma capacidad y
regla de negocio con una interaccion adecuada a cada plataforma.

### P1. Los validadores comprueban forma, no calidad de evidencia

**Evidencia**

`validate-multiplatform-delivery.mjs` acepta evidencia desktop/mobile que sea
cualquier texto no vacio y no sea un placeholder entre corchetes. Para `PASS`,
basta con que la fila contenga `commit`, `timestamp`, `runtime`, `http` o `test`.
No comprueba que:

- el path exista;
- el test se haya ejecutado y pasado;
- el commit coincida con el run;
- la URL haya servido la aplicacion correcta;
- el screenshot corresponda a la ruta, estado y timestamp declarados.

**Impacto**

La matriz puede validarse con evidencia nominal o antigua.

**Correccion requerida**

Usar evidencia estructurada con `type`, `path/url`, `command`, `exit_code`,
`commit`, `created_at`, `platform`, `requirement_id` y checksum cuando aplique.
El validador debe resolver y comprobar cada referencia.

### P1. El inicializador no crea el workspace que el contrato exige

**Evidencia**

El contrato exige materializar README, arquitectura, plan, matriz de requisitos,
scope de plataformas y matriz de evidencia. `delivery-run.mjs init` solo crea el
directorio del run y `run.json`.

`validate-multiplatform-delivery.mjs` solo revisa directorios que ya tienen
`README.md`. Un modulo incompleto sin README, como Contacts, puede quedar fuera
de ese recorrido y no generar error por sus matrices ausentes.

**Impacto**

El flujo falla abierto: la ausencia del marcador usado por el validador evita
que el modulo sea validado.

**Correccion requerida**

`delivery:init` debe copiar templates de forma idempotente. El inventario de
modulos debe venir de manifests o runs, no de la existencia de README. Todo run
debe resolver exactamente un workspace y validar su estructura completa.

### P1. Resume no restaura ni revalida el trabajo de forma suficiente

**Evidencia**

`delivery-run.mjs resume` compara un fingerprint global de
`packages/contracts/src`. Si cambia, invalida solo `current_phase`; si no cambia,
no comprueba que el blocker se haya resuelto. Tampoco incrementa `attempt`,
reconstruye el contexto, calcula dependencias downstream ni elige el ultimo
checkpoint reanudable.

**Impacto**

Una nueva conversacion puede recomenzar trabajo, ignorar gaps previos o reutilizar
evidencia obsoleta tras cambios en producto, plan, codigo o tests.

**Correccion requerida**

Persistir fingerprints por categoria de input y un grafo de dependencias.
`resume` debe producir un paquete de contexto corto y determinista con ultima
fase valida, blocker, cambios desde el checkpoint, fases invalidadas y siguiente
tarea atomica.

### P1. Build no esta dividido en unidades que garanticen terminacion

**Evidencia**

`module-build` exige implementar un plan aprobado en incrementos, pero no define
un limite de trabajo por invocacion ni un algoritmo para seleccionar una tarea.
El plan de Pipeline contiene auditorias, dominio, acceso, API, sync, UI,
superficies, tests, migracion y verify en una sola tabla amplia.

**Impacto**

El agente puede iniciar varias areas, consumir contexto y tiempo, y terminar con
muchas piezas parciales. Un resumen conversacional no garantiza que la siguiente
ejecucion continue exactamente donde se detuvo.

**Correccion requerida**

Hacer que una invocacion de build ejecute una sola unidad atomica o un lote
pequeno con el mismo criterio de aceptacion. El CLI debe seleccionar la siguiente
tarea `ready`, bloquear trabajo paralelo incompatible y no permitir cerrar la
tarea hasta que sus checks pasen.

### P1. Las pruebas mobile no forman parte de una estrategia de paridad

**Evidencia**

La configuracion principal de Vitest incluye tests bajo `src/`, mientras
`apps/mobile/` no tiene una suite equivalente de componentes y journeys. CI
ejecuta TypeScript, Expo Doctor y Expo export, que prueban compilacion y
empaquetado, no equivalencia funcional.

**Impacto**

Una app mobile puede compilar y exportarse aunque una accion no persista, una
ruta muestre un skeleton o un estado de permisos no exista.

**Correccion requerida**

Agregar tres capas:

1. contract tests compartidos ejecutados contra adapters desktop y mobile;
2. component/integration tests de cada renderer;
3. journeys de runtime generados desde la misma capability matrix.

### P1. La frontera de dependencias mobile no esta protegida

**Evidencia**

`apps/mobile/App.tsx` consume el adapter CRM ubicado bajo `src/`. Ese adapter
transitivo integra implementaciones de varios dominios web. El flujo no tiene un
check de imports permitidos ni un presupuesto de bundle para mobile.

**Impacto**

Compartir semantica puede convertirse accidentalmente en compartir runtime y
dependencias de desktop. TypeScript puede pasar aunque Expo incluya codigo no
deseado o una dependencia falle solo al ejecutar.

**Correccion requerida**

Mover contratos y casos de uso realmente compartidos a packages neutrales y
proveer adapters por plataforma. Agregar reglas de boundaries e inspeccion del
bundle mobile.

### P2. Skills extensas y solapadas aumentan la perdida de instrucciones

**Evidencia**

Las skills repiten startup, fuentes de verdad, trazabilidad, reutilizacion,
arquitectura, evidencia y restricciones. Build, verify, review y el agente
repiten reglas de completitud parecidas con formatos no identicos.

**Impacto**

La informacion critica compite por contexto con documentos de producto y codigo.
Ademas, una regla corregida en un archivo puede quedar obsoleta en otro.

**Correccion requerida**

Reducir cada skill a:

- trigger y alcance;
- inputs tipados;
- algoritmo de la fase;
- outputs tipados;
- codigos de bloqueo;
- comando de validacion y handoff.

Mover reglas comunes a un contrato corto y hacer que el CLI las aplique. Para
runs largos, aislar cada fase en una ejecucion o subagente y pasar solo el
paquete de handoff generado.

### P2. Ownership y autorizacion de approvals son ambiguos

**Evidencia**

Los JSON aceptan `approved_by` y `approved_at`, pero no definen roles autorizados,
metodo de captura, vinculo a issue ni integridad del evento. `init` tampoco crea
el gate visual obligatorio entre sus approvals iniciales.

**Impacto**

Una aprobacion puede ser omitida, autoatribuida o no corresponder al artefacto
que finalmente se implemento.

**Correccion requerida**

Toda aprobacion debe referenciar actor, rol, artefacto, fingerprint, timestamp y
fuente externa verificable. Si cambia el fingerprint aprobado, el gate vuelve a
pending automaticamente.

## Evaluacion del flujo actual

| Area | Madurez documental | Enforcement actual | Riesgo |
|---|---|---|---|
| Fuentes de verdad | Alta | Baja | Se puede usar evidencia historica o parcial |
| Discovery y design | Alta | Media-baja | Cobertura no enlazada por IDs |
| Visual gate | Alta | Baja | Orden contradictorio y approval no inicializado |
| Analisis especializado | Alta | Baja | Handoffs y blockers no tipados |
| Plan | Media-alta | Baja | Tareas demasiado grandes y no seleccionables por CLI |
| Build | Alta en reglas | Baja en control | Puede terminar por contexto, no por DoD |
| Verify | Alta en checklist | Baja en evidencia | PASS nominal y runtime no reproducible |
| Desktop/mobile parity | Media | Baja | Se comparan superficies, no capabilities ejecutables |
| Resume | Media | Baja | Fingerprint parcial y sin reconstruccion de dependencias |
| CI/release | Media | Media-baja | Buena compilacion, cobertura funcional insuficiente |

## Modelo objetivo

### 1. Una fuente ejecutable del workflow

Crear `delivery-workflow.schema.json` y `delivery-workflow.json` con:

- fases y skills propietarias;
- predecesores;
- artefactos requeridos;
- approvals;
- estados terminales;
- invariantes de completion;
- invalidacion por tipo de cambio;
- comandos obligatorios por plataforma.

Los documentos humanos explican el modelo, pero no lo duplican.

### 2. Ledger de requirements y capabilities

Ejemplo conceptual:

```json
{
  "id": "CRM-CONTACTS-EDIT",
  "requirement_ids": ["CRM-CONTACTS-REQ-012"],
  "semantics": {
    "command": "contact.update",
    "permission": "contacts.update",
    "validation_contract": "ContactInput",
    "errors": ["FORBIDDEN", "CONFLICT", "VALIDATION"]
  },
  "platforms": {
    "desktop_web": { "required": true, "surface": "contact drawer" },
    "mobile_web": { "required": true, "surface": "contact edit screen" },
    "ios": { "required": true, "surface": "contact edit screen" },
    "android": { "required": true, "surface": "contact edit screen" }
  },
  "states": ["loading", "error", "forbidden", "conflict", "offline", "success"]
}
```

El plan referencia estos IDs. Los tests y evidencias tambien. El gate calcula
cobertura por joins, no por interpretacion de prosa.

### 3. Build atomico dirigido por cola

```text
delivery next
  -> elige una tarea READY
  -> crea working checkpoint
  -> entrega al agente solo contexto necesario
  -> implementa
  -> ejecuta checks de la tarea
  -> registra evidencia estructurada
  -> marca DONE o BLOCKED
  -> recalcula la siguiente tarea
```

Una tarea debe caber en una sesion y producir un cambio validable. Si toca mas
de una plataforma, puede tener subtareas por renderer, pero la capability no
cierra hasta que todas las plataformas requeridas pasen.

### 4. Piramide de evidencia

| Nivel | Prueba | Uso |
|---|---|---|
| E0 | archivo/import presente | inventario, nunca completion |
| E1 | lint/typecheck/build | integridad tecnica |
| E2 | unit/contract test | semantica aislada |
| E3 | integration/component test | conexion del renderer y adapter |
| E4 | runtime journey + screenshot/trace | comportamiento observable |
| E5 | device/security/tenant evidence | release de alto riesgo |

Cada requisito declara su nivel minimo. El validador rechaza evidencia de nivel
inferior.

### 5. Comparador desktop -> mobile

El comparador no debe inferir features solo desde nombres de componentes. Debe:

1. cargar el capability manifest aprobado;
2. ejecutar el mismo contract suite contra ambos adapters;
3. verificar que cada renderer expone las acciones permitidas;
4. comprobar estados, errores, permisos y navegacion equivalentes;
5. ejecutar journeys por plataforma con datos semilla compartidos;
6. reportar `PASS`, `PARTIAL`, `FAIL` o `NOT_TESTED` por capability y plataforma;
7. bloquear closure si una plataforma requerida no esta en `PASS`.

## Fases de implementacion propuestas

### Fase 0. Contencion y baseline reproducible

**Objetivo:** impedir nuevos falsos positivos mientras se construye el sistema.

**Trabajo**

- corregir el orden canonico de skills y eliminar contradicciones;
- prohibir `completed` con approval bloqueado o arquitectura pendiente;
- hacer que el validador descubra workspaces desde runs, no desde README;
- completar o marcar formalmente incompleto el workspace de Contacts;
- registrar el estado real de Contacts y Pipeline sin reescribir evidencia
  historica;
- definir un solo vocabulario de estados para manifests, checkpoints y matrices.

**Criterio de salida**

Los ejemplos actuales inconsistentes fallan en CI con mensajes accionables y
ningun run nuevo puede saltar una fase obligatoria.

**Estimacion:** 2-4 dias.

### Fase 1. Workflow engine y schemas

**Objetivo:** convertir la secuencia documental en una maquina de estados.

**Trabajo**

- crear schemas para run, checkpoint, approval, task y evidence;
- implementar `init`, `start-phase`, `complete-phase`, `block`, `approve`,
  `handoff` y `resume` como transiciones atomicas;
- materializar todos los templates en `init`;
- verificar ownership de fase y predecesores;
- registrar fingerprints por producto, design, plan, contracts, codigo y tests;
- invalidar transitivamente las fases dependientes;
- generar un paquete de resume y un reporte de blockers.

**Criterio de salida**

No existe una operacion CLI capaz de producir un estado invalido segun el grafo.
Hay tests del state machine para happy path, skip, rechazo, cambio de contrato y
resume.

**Estimacion:** 1-2 semanas.

### Fase 2. Trazabilidad de requirements y plan ejecutable

**Objetivo:** garantizar que todo lo aprobado llegue a build y verify.

**Trabajo**

- definir IDs estables de requirement y capability;
- generar el ledger desde discovery/design con aprobacion humana;
- hacer que `module-plan` produzca tareas estructuradas pequenas;
- validar cobertura bidireccional entre requirement, capability y task;
- agregar dependencias, owner, riesgo, plataformas y checks a cada tarea;
- impedir scope drop; todo requisito removido necesita change request aprobado.

**Criterio de salida**

El reporte puede enumerar automaticamente requisitos sin tarea, tareas sin test
y capacidades sin evidencia por plataforma. Todos esos casos bloquean plan o
release segun corresponda.

**Estimacion:** 1-2 semanas.

### Fase 3. Paridad multiplataforma por contrato

**Objetivo:** trasladar capacidades desktop a mobile sin copiar implementaciones
ni perder semantica.

**Trabajo**

- crear capability manifests para Contacts y Pipeline como pilotos;
- extraer contratos, validacion y casos de uso compartidos a packages neutrales;
- crear adapters desktop/mobile explicitos;
- proteger boundaries de imports de `apps/mobile`;
- ampliar el manifest de rutas para rutas parametrizadas y deep links;
- generar contract tests ejecutables contra ambos adapters;
- declarar adaptaciones permitidas de navegacion y UI por plataforma.

**Criterio de salida**

Para Contacts, cada capacidad MVP tiene el mismo resultado de dominio, permisos,
errores y lifecycle en desktop y mobile. Las diferencias visuales estan
declaradas y aprobadas. No hay dependencia accidental del runtime web desde
mobile.

**Estimacion:** 2-3 semanas.

### Fase 4. Evidencia verificable y pruebas de runtime

**Objetivo:** sustituir claims textuales por evidencia reproducible.

**Trabajo**

- estructurar command evidence con exit code, commit, checksum, requirement y
  task ID;
- mantener tests de componente y contract tests focalizados junto al cambio;
- ejecutar journeys web desktop o Expo web solo para tareas `E4_JOURNEY`,
  regresiones de alto riesgo y hitos de capability;
- capturar screenshot, traza o resultado solo cuando el journey se use para
  cerrar una tarea, no durante cada iteracion;
- comprobar rutas directas, refresh, back, permisos y estados de UI en los
  journeys que apliquen;
- incorporar accesibilidad, responsive, i18n, RTL y device evidence segun el
  riesgo, el platform scope y el nivel de evidencia declarado;
- validar bundle mobile y dependencias prohibidas mediante los gates de CI.

**Criterio de salida**

El desarrollo diario puede avanzar con validacion focalizada. Al cerrar una
tarea `done` de nivel `E4_JOURNEY` o `E5_DEVICE`, un `PASS` solo es posible si
el validador puede resolver evidencia creada para el mismo commit y verificar
el artefacto correspondiente. Playwright es opcional: se usa cuando aporta el
mejor journey reproducible, no como un requisito mecanico.

**Estimacion:** 2-3 semanas.

### Fase 5. Orquestacion del agente por tareas y recovery

**Objetivo:** permitir ejecuciones largas sin depender de una sola ventana de
contexto.

**Trabajo**

- reducir y desduplicar las skills;
- separar orquestacion, implementacion y verificacion en contextos distintos;
- entregar a cada fase un handoff corto generado por CLI;
- hacer que build tome una tarea READY por invocacion;
- guardar cada resultado antes de continuar;
- limitar reintentos repetidos y escalar el mismo error tras un umbral;
- exigir verify independiente antes de review;
- generar updates del agente desde el estado real del run.

**Criterio de salida**

Una conversacion interrumpida puede reanudarse desde otro contexto y seleccionar
la misma siguiente tarea sin volver a inferir el alcance. El agente no puede
declarar completion; solo solicitar al CLI la transicion.

**Estimacion:** 1-2 semanas.

### Fase 6. Release gates, GitHub y metricas

**Objetivo:** cerrar el circuito de automatizacion y medir su eficacia.

**Trabajo**

- sincronizar tasks con issues por fase/capability;
- verificar approvals desde eventos trazables y fingerprints;
- publicar reportes de cobertura y paridad en PR;
- bloquear merge por gaps P0/P1, plataformas requeridas no probadas o deuda no
  aprobada;
- mantener push, PR, migraciones sensibles y release como gates humanos;
- medir abandono, retrabajo, cobertura y tiempo por fase.

**Criterio de salida**

La PR muestra requisitos, capacidades, plataformas, tests, evidencia, gaps y
aprobaciones del commit exacto. El merge no depende de leer manualmente todos
los documentos del run.

**Estimacion:** 1-2 semanas.

## Backlog inicial recomendado

| Prioridad | Entregable | Resultado esperado |
|---|---|---|
| 1 | Invariantes semanticas en `validate-module-runs.mjs` | El checkpoint inconsistente de Contacts deja de pasar |
| 2 | Discovery de workspaces desde runs | Contacts no evade validacion por falta de README |
| 3 | Orden canonico unico | Agente y contrato usan la misma secuencia |
| 4 | `delivery:init` idempotente | Todo modulo nace con workspace completo |
| 5 | State machine + tests | No se pueden saltar gates ni handoffs |
| 6 | Requirement/capability schema | No se pierden funcionalidades entre fases |
| 7 | Capability manifest de Contacts | Baseline de paridad desktop/mobile verificable |
| 8 | Contract tests de Contacts | Misma semantica en adapters |
| 9 | Tests de componentes y journeys mobile | Mobile deja de validarse solo por compile/export |
| 10 | Evidence validator | `PASS` exige evidencia real del commit actual |
| 11 | Import/bundle boundary mobile | Mobile no arrastra runtimes web accidentalmente |
| 12 | Build queue atomica | Cada ejecucion termina una unidad o queda bloqueada con precision |

## Cambios recomendados en las skills y el agente

### `delivery.agent.md`

- mantener solo mision, modo, state machine, politica de approvals y comandos;
- corregir el orden visual/specialized analysis;
- ordenar al agente a usar el CLI para toda transicion;
- prohibirle escribir `status: completed` directamente;
- delegar una fase por contexto y consumir handoffs generados;
- diferenciar `run complete`, `phase complete` y `task complete`.

### `module-discovery`

- producir requirements y capabilities con IDs;
- inventariar funcionalidad existente por comportamiento observable;
- distinguir `source_observed`, `test_verified` y `runtime_verified`;
- para migraciones desktop -> mobile, generar el baseline funcional desktop.

### `module-design` y helpers

- consumir los IDs de discovery sin renombrarlos;
- declarar semantica compartida y adaptacion por plataforma;
- producir decisiones tipadas y blockers, no solo secciones narrativas;
- definir que helpers aplican y hacer que su estado bloquee al parent.

### `module-plan`

- generar tareas pequenas machine-readable;
- exigir una tarea por capability/plataforma/estado cuando corresponda;
- declarar comandos y nivel de evidencia antes de aprobar el plan;
- calcular cobertura de requirements antes del gate.

### `module-build`

- aceptar un `task_id`, no un plan completo abierto;
- implementar y validar solo esa unidad;
- registrar archivos, tests y evidence refs estructurados;
- no auto-verificar ni auto-cerrar la fase global.

### `module-verify`

- ejecutarse en contexto separado de build;
- consumir manifests, no reconstruir scope desde prosa;
- verificar todos los estados y plataformas exigidos por cada capability;
- emitir findings; el CLI decide si se cumple la transicion.

### `module-review`

- calcular veredictos desktop y mobile desde evidencia validada;
- bloquear cualquier capability requerida en `PARTIAL`, `FAIL` o `NOT_TESTED`;
- permitir deuda solo con approval, owner, fecha y follow-up.

## Metricas de exito

| Metrica | Objetivo inicial |
|---|---|
| Requirements aprobados con task y test enlazados | 100% |
| Capabilities MVP con evidencia por plataforma requerida | 100% |
| Checkpoints invalidos aceptados por CI | 0 |
| Runs reanudados sin repetir fases validas | > 90% |
| Tareas build terminadas o bloqueadas con causa en una invocacion | > 85% |
| Evidencia `PASS` resoluble al commit declarado | 100% |
| Diferencias desktop/mobile no declaradas | 0 |
| Skills con reglas comunes duplicadas | Reduccion de al menos 50% |

## Decisiones humanas que deben conservarse

La automatizacion maxima no significa eliminar gates humanos. Deben seguir
requiriendo aprobacion explicita:

- alcance de producto y cambios de MVP;
- diseno visual y accesibilidad percibida;
- cambios de contratos Platform compartidos;
- tenancy, RLS, datos sensibles y migraciones destructivas;
- aceptacion de deuda o desviaciones;
- validacion final en dispositivos fisicos cuando aplique;
- push, pull request, release y merge.

Todo lo demas debe tender a ser calculado, reproducible e idempotente.

## Recomendacion final

No conviene agregar mas texto a las skills como primera respuesta. Eso aumenta
la probabilidad de que instrucciones importantes compitan entre si. La primera
inversion debe ser Fase 0 y Fase 1: hacer imposible representar estados
inconsistentes y hacer imposible saltar gates desde el CLI.

Despues, Contacts debe ser el piloto de paridad porque ya ofrece suficiente
implementacion desktop/mobile para probar el modelo y suficientes gaps para
demostrar que funciona. Pipeline debe permanecer detenido en su gate visual
hasta que el nuevo motor pueda importar su run sin considerar sus artefactos
downstream como aprobados.

El objetivo operativo final es sencillo de comprobar:

> El agente puede detenerse en cualquier momento, pero el sistema siempre sabe
> exactamente que requisito falta, en que plataforma, que tarea lo implementa,
> que evidencia debe producir y cual es la unica siguiente accion valida.