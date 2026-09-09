---
title: Initial testing matrix
status: active
owner: loopdev-v2
updated: 2026-09-09
scope: engineering
---

# Matriz inicial de tests para LoopDev v2

## Objetivo

Definir el conjunto mínimo de validaciones que debe crecer con LoopDev v2 sin introducir
todavía tests visuales, E2E ni una implementación real de Supabase. La prioridad inicial es
proteger la calidad de escritura, los boundaries de arquitectura y los estados del frontend.

## Capas iniciales

| Capa | Qué protege | Estado | Gate |
| --- | --- | --- | --- |
| Lint | Reglas de escritura y errores comunes de TypeScript/React | Disponible | Obligatorio |
| Typecheck | Contratos entre componentes, hooks, adapters y tipos | Disponible mediante `npm run typecheck` | Obligatorio |
| Unit tests | Helpers puros, formateadores y transformaciones | Parcialmente disponible | Obligatorio |
| Structural tests | Shell, rutas, dirección, estados y contratos de layout | Disponible | Obligatorio |
| Adapter contract tests | Que cada backend respete `LoopdevAdapter` | Pendiente inmediato | Obligatorio al añadir adapters |
| Hook tests | Loading, error, retry, success y cleanup | Pendiente inmediato | Obligatorio por hook de dominio |
| Page state tests | Loading, empty, filtered-empty, error y success | Pendiente inmediato | Obligatorio por página de dominio |
| Accessibility tests | Roles, labels, keyboard interaction y estados ARIA | Parcial; no sustituye revisión visual | Obligatorio para primitives e interacción |
| Build | Integridad de producción y resolución de imports | Disponible | Obligatorio |

## Tests que debemos tener inicialmente

### 1. Calidad de escritura

- `npm run lint`.
- `npm run typecheck`.
- Detección de imports duplicados.
- Detección de clases estáticas duplicadas.
- Prohibición de acceso directo a Supabase, `fetch` o SQL desde páginas y componentes.
- Prohibición de bypass del adapter desde una superficie de dominio.
- Uso de variantes explícitas en botones y primitives compartidos.
- Uso de tokens semánticos en lugar de colores hardcodeados cuando se incorpore el auditor
  estático de frontend.

### 2. Contratos de infraestructura frontend

- El contrato `LoopdevAdapter` debe ser satisfecho por `localLoopdevAdapter`.
- Los adapters deben devolver tipos de dominio, no respuestas crudas del backend.
- Los adapters deben propagar errores; no deben convertirlos silenciosamente en arrays vacíos.
- Las páginas no deben conocer detalles de persistencia ni de tenancy.
- La futura implementación Supabase debe permanecer intercambiable con la local.

### 3. Dominio CRM

Para cada hook de CRM:

- inicia en `loading`;
- expone datos en `success`;
- expone un error recuperable;
- permite `reload`;
- limpia correctamente el estado al desmontar o cambiar de dependencia;
- diferencia una respuesta vacía de un error.

Para cada página CRM:

- renderiza `loading`;
- renderiza `empty` cuando el workspace no tiene datos;
- renderiza `filtered-empty` cuando los filtros no producen resultados;
- renderiza `error` con retry;
- renderiza el estado exitoso;
- no ejecuta consultas directamente;
- conserva las rutas oficiales `/app/sales-crm/*`.

### 4. Primitives compartidos

Los primeros primitives que deben tener tests de comportamiento son:

- `DataCard`: contenido, loading y error.
- `EmptyState`: mensaje, acción y variantes de causa.
- `FilterDropdown`: valor controlado, disabled, readonly y eventos.
- `Pagination`: límites, navegación y estado disabled.

Estos tests deben verificar comportamiento y accesibilidad básica, no snapshots visuales.

### 5. Shell y routing

- Las rutas CRM oficiales resuelven el módulo correcto.
- Una ruta de contacto conserva el `contactId`.
- El shell mantiene navegación y estado de sesión.
- El modo RTL no fuerza LTR.
- Los estados de sidebar, navbar y dirección permanecen deterministas.

## Tests deliberadamente aplazados

- Snapshots o regresión visual.
- Playwright y E2E de navegador.
- Validaciones reales de RLS y Supabase.
- Tests de integración con servicios externos.
- Tests de carga, concurrencia y tenancy real.
- Validación de impacto entre packages del monorepo, hasta que exista el monorepo.

Los archivos actuales `visual-regression*.test.tsx` se conservan como referencia y ejecución
local, pero quedan fuera del gate `test:quality` inicial.

## CI y filtrado por alcance

`.github/workflows/ci.yml` usa `dorny/paths-filter` para evitar ejecuciones innecesarias:

- `quality`: se ejecuta si cambia código, tests, configuración o dependencias.
- `build`: se ejecuta si el cambio puede alterar el artefacto de producción.
- No existe todavía un job exclusivo de CRM: los cambios CRM pasan los gates globales hasta que
  existan tests propios de CRM que justifiquen un job separado.
- Cambios únicamente documentales no ejecutan instalación, tests ni build.
- La política de flujo hacia `main` permanece separada en
  `.github/workflows/main-branch-policy.yml`.

Los checks `Revisar reglas y tipos del código`, `Ejecutar tests rápidos de componentes y
contratos` y `Comprobar que la aplicación compila` deben ser los checks requeridos en la
protección de `develop`. Para `main`, el check de política de flujo y el CI deben seguir siendo
obligatorios.

## Escalado por suites

Los tests deben organizarse por ownership y no como una suite global creciente:

```text
src/test/shared/       primitives, helpers y contratos transversales
src/test/shell/        navegación, sesión y layout
src/test/crm/          adapter, hooks y páginas CRM
src/test/<suite>/      tests de cada nueva suite
```

Cuando una carpeta de suite tenga suficientes tests, se añadirá un script y un job específico
para esa carpeta. El job global seguirá reservado para controles rápidos y contratos
transversales; no se duplicarán los mismos tests en todos los jobs.
