---
id: rivera-loopdev-separation
title: Rivera Template and Loopdev Application Separation
status: active
created: 2026-09-09
updated: 2026-09-09
owner: minoveaz
lead: User
branch: develop
branches: []
phase: 5
pull_requests: []
issues: [1]
packages: []
release: internal-refactor
areas: [frontend, architecture, platform]
dependencies: []
blocked_by: []
supersedes: []
---

# Rivera Template and Loopdev Application Separation

## Checkpoint operativo 2026-09-09

La Fase 0 queda completada como baseline documental y de estructura. El repositorio contiene la
plantilla Rivera, el primer producto Loopdev y el design system compartido todavía en sus
ubicaciones actuales. No se han movido archivos ni modificado páginas Rivera.

Inventario inicial:

| Area | Ubicacion actual | Archivos |
| --- | --- | ---: |
| Design system UI | `src/components/ui` | 49 |
| Componentes comunes | `src/components/common` | 29 |
| Tema y apariencia | `src/components/theme`, `src/components/settings` | 4 |
| Layout compartido | `src/components/layout` | 9 |
| Paginas Rivera | `src/pages` | 214 |
| Features Rivera | `src/features` | 35 |
| Datos mock Rivera | `src/data` | 30 |
| Componentes Loopdev | `src/components/loopdev` | 18 |
| Adapter Loopdev | `src/adapters/loopdev` | 3 |
| Hook CRM Loopdev | `src/hooks/use-loopdev-crm.ts` | 1 |

Baseline de validacion en `develop` (`81bc2e2`):

- Build de producción: correcto.
- Lint: 22 errores y 22 avisos preexistentes.
- Tests: 57 tests ejecutados; 4 archivos correctos, un snapshot fallido y 13 archivos bloqueados
  por la dependencia ausente `@testing-library/dom`.
- Dependencias instaladas localmente con `npm install`; no se modificó el manifiesto del proyecto.

La issue de coordinación es `minoveaz/loopdev-v2#1`.

## Outcome

Rivera remains available as an unchanged template and visual implementation guide, while Loopdev
becomes the real product application with its own routes, pages, navigation, domains and data.
Both surfaces directly reuse Rivera's existing design system and shared frontend infrastructure.

The refactor must not create a second design system, duplicate visual primitives or modify Rivera
pages to implement Loopdev behavior.

## Context

The repository currently combines the Rivera admin template with the first Loopdev CRM slices.
Rivera's reusable visual layer lives primarily in `src/components/ui`, `src/components/common`,
`src/components/theme`, `src/components/settings`, `src/components/layout`, styles, theme
configuration and shared frontend utilities.

Rivera demo pages, features and mock data currently coexist with Loopdev code. The refactor will
introduce explicit ownership boundaries without changing the visual language established by Rivera.

## Scope

### Included

- Keep Rivera's design system and shared visual infrastructure in place for direct reuse.
- Isolate Rivera pages, demo features, navigation and mock data behind a template boundary.
- Separate Rivera and Loopdev route composition.
- Give Rivera and Loopdev explicit application shells while reusing shared layout primitives where
  they are genuinely generic.
- Move Loopdev Launchpad, CRM pages, CRM components, navigation and adapter code into a product
  boundary.
- Ensure CRM data is consumed through a Loopdev domain adapter rather than Rivera mock stores.
- Preserve existing URLs and behavior during the migration where practical.
- Validate build, lint, tests and the primary template/Loopdev routes after each migration slice.

### Excluded

- Redesigning Rivera or replacing its visual system.
- Creating a parallel `design-system` directory or copying Rivera primitives.
- Rewriting the CRM UX or implementing new CRM modules.
- Connecting the CRM adapter to a production backend as part of this structural refactor.
- Removing Rivera from the repository or deleting its template pages.
- Refactoring unrelated application behavior.

## Dependency rules

```text
Rivera template pages ──┐
Loopdev application ────┼──> shared Rivera components and platform utilities
Platform infrastructure ┘
```

- Loopdev may import shared Rivera visual components and generic platform utilities.
- Loopdev must not import Rivera pages, Rivera features or Rivera mock data.
- Rivera must not import Loopdev modules.
- Shared components must not acquire Loopdev or Rivera business-data dependencies.
- New Loopdev code belongs under the Loopdev product boundary, not under Rivera's template pages.

## Target ownership

```text
src/
├─ components/                 # Shared Rivera design system and generic UI infrastructure
├─ config/                     # Shared theme configuration
├─ hooks/                      # Shared hooks, until a hook is product-specific
├─ i18n/                       # Shared localization infrastructure
├─ lib/                        # Shared frontend utilities
├─ platform/                   # Product-agnostic infrastructure when extracted
├─ template/rivera/            # Rivera pages, features, navigation, routes and demo data
├─ loopdev/                    # Loopdev application, domains, pages and product navigation
└─ routes/                     # Root route composition only
```

The exact intermediate locations may be introduced incrementally. The shared Rivera design system
is intentionally not moved or duplicated as part of this track.

## Execution plan

### Phase 0: Baseline and boundaries

**Objective:** document current ownership and protect the working application before moving files.

**Deliverables**

- [x] Create the track and link its GitHub issue.
- [x] Inventory current Rivera, shared and Loopdev modules.
- [x] Document allowed dependency directions.
- [x] Record the current route and validation baseline.

**Exit evidence:** this track, issue `minoveaz/loopdev-v2#1`, inventory and baseline reproducible are
available. The existing lint/test findings remain outside the scope of Phase 0.

### Phase 1: Route and navigation split

**Objective:** make route ownership explicit without changing the rendered experience.

**Deliverables**

- [x] Separate Rivera navigation from Loopdev navigation.
- [x] Create Rivera route composition and Loopdev route composition.
- [x] Keep the root router responsible only for composing the two surfaces.
- [x] Preserve `/template`, `/launchpad` and `/app/*` entry points.

**Implementation evidence (2026-09-09):**

- Shared navigation types moved to `src/app/nav-types.ts`.
- Loopdev navigation is owned by `src/loopdev/navigation.ts`.
- Loopdev route composition is owned by `src/routes/LoopdevRoutes.tsx`.
- `src/routes/AppRoutes.tsx` composes the Loopdev routes without duplicating their definitions.
- `LoopdevSidebar` consumes the Loopdev navigation module directly.
- Existing Rivera navigation remains in `src/app/navigation.ts`.

**Validation:** affected-file lint and production build pass. Global type-check remains blocked by
pre-existing test dependency/type issues from the baseline (`@testing-library/dom` and testing
library exports).

**Smoke validation (2026-09-09):** after correcting the route composition to use a React Router
fragment, the browser loaded and rendered `/launchpad`, `/app/sales-crm/overview`,
`/app/sales-crm/contacts`, `/app/sales-crm/leads` and `/template`. Login, Launchpad, CRM dashboard,
Contacts, Leads and the Rivera dashboard were readable and navigable in the browser canvas. The
initial webview read failure was an issue with the canvas identifier, not the application.

**Exit evidence:** route and navigation ownership is separated in code and all primary entry URLs
return the SPA shell successfully. Phase 1 is complete.

### Phase 2: Rivera template boundary

**Objective:** isolate Rivera pages and demo-only data while retaining the shared design system.

**Deliverables**

- [x] Move or group Rivera pages under the template boundary.
- [x] Move or group Rivera-only features and mock data under the template boundary.
- [x] Update imports without changing page behavior.
- [x] Keep shared UI, common components, theme and generic layout infrastructure reusable.

**Implementation evidence (2026-09-09):**

- Rivera pages now live under `src/template/rivera/pages`.
- Rivera features now live under `src/template/rivera/features`.
- Rivera demo data now lives under `src/template/rivera/data`.
- Loopdev Launchpad and CRM pages were moved out to `src/loopdev/pages`.
- Imports were updated to preserve the existing route behavior.
- The Rivera design system remains in `src/components` and was not copied or modified.

**Known transition:** `src/adapters/loopdev/local.ts` still consumes the local customer store from
the Rivera data boundary. This is intentionally deferred to Phase 4, where the CRM local data
implementation will be isolated behind the domain adapter.

**Exit evidence:** Rivera pages, features and demo data are physically grouped under the template
boundary; the shared visual layer remains directly reusable. Phase 2 is complete.

### Phase 3: Loopdev product boundary

**Objective:** group the existing Loopdev product code by application and domain ownership.

**Deliverables**

- [x] Move Launchpad and CRM pages under the Loopdev application boundary.
- [x] Move Loopdev-specific components and navigation under that boundary.
- [x] Move CRM adapter types and implementations under the CRM domain.
- [x] Rename product-specific hooks and remove accidental template-oriented names where safe.

**Implementation evidence (2026-09-09):**

- Loopdev pages live under `src/loopdev/pages`.
- Loopdev visual components, illustrations and CRM Customer 360 components live under
  `src/loopdev/components`.
- CRM adapter contract and local implementation live under `src/loopdev/domains/crm/adapter`.
- CRM hooks live under `src/loopdev/domains/crm/hooks/use-crm.ts` and use domain-oriented names.
- Existing shared layout files import Loopdev components only as the application shell integration
  point; the visual primitives remain shared and are not duplicated.
- No remaining source imports reference the former `src/components/loopdev`, `src/adapters/loopdev`
  or `src/hooks/use-loopdev-crm` paths.

**Exit evidence:** Loopdev routes render from Loopdev-owned pages, components and CRM domain
modules while continuing to reuse shared Rivera components directly. Phase 3 is complete.

### Phase 4: Data and shell decoupling

**Objective:** remove CRM dependencies on Rivera demo data and clarify shell ownership.

**Deliverables**

- [x] Keep CRM access behind a stable adapter contract.
- [x] Replace direct `customersStore`/Rivera mock imports from CRM pages and hooks.
- [x] Separate Rivera and Loopdev shell responsibilities.
- [x] Reuse only generic shared shell primitives between both applications.
- [x] Add explicit error and loading boundaries where the move exposes them.

**Implementation evidence (2026-09-09):**

- CRM local data is now owned by `src/loopdev/domains/crm/data/localCustomers.ts`.
- The CRM adapter no longer imports `src/template/rivera/data` or `customersStore`.
- CRM Overview no longer imports Rivera user fixtures; its owner data is product-local.
- `RiveraShell` and `LoopdevShell` now own their respective sidebar composition while both reuse the
  shared `Sidebar` and layout primitives.
- CRM pages and hooks continue to access data only through the adapter contract.
- The migration preserved the existing loading behavior; no additional error boundary was exposed
  by this structural move.

**Exit evidence:** Loopdev can change its CRM data implementation without importing Rivera data,
and each application surface has an explicit shell composition. Phase 4 is complete.

### Phase 5: Validation and enforcement

**Objective:** prove the separation and prevent regression.

**Deliverables**

- [x] Validate template routes and Loopdev routes independently.
- [x] Run the existing build, lint and test commands.
- [x] Search for forbidden cross-boundary imports.
- [x] Update project documentation with the ownership rules.
- [ ] Record migration evidence and close the track only after explicit approval.

**Validation evidence (2026-09-09):**

- Production build passes after the full migration.
- The migrated page consistency test passes for both `src/template/rivera/pages` and
  `src/loopdev/pages`.
- Existing full lint and test commands were executed. They retain the baseline failures: 22 lint
  errors and 22 warnings, missing `@testing-library/dom` in 13 test files, one pre-existing CSS
  snapshot mismatch, and no new failure caused by the boundary migration.
- Forbidden import searches confirm that Loopdev does not import Rivera pages, features or data, and
  Rivera pages do not import Loopdev modules.
- Ownership rules are documented in `docs/architecture/ownership.md`.
- Primary Rivera and Loopdev routes were smoke-tested during the route and boundary migration.

**Exit evidence:** the structural acceptance checks pass and the remaining baseline validation
failures are documented. Track closure remains pending explicit user approval.

## Risks and mitigations

| Risk | Impact | Mitigation | Owner | Status |
| --- | --- | --- | --- | --- |
| Moving routes breaks legacy URLs | Rivera or CRM becomes inaccessible | Preserve aliases and validate entry routes after each phase | User | open |
| Shared components contain hidden Rivera assumptions | Loopdev inherits demo behavior | Inspect dependencies before moving; keep data-bound components in template | User | open |
| CRM remains coupled to mock stores | Backend replacement remains expensive | Enforce adapter-only access from Loopdev pages and hooks | User | open |
| Large mechanical move creates noisy regressions | Review and rollback become difficult | Use small phase commits with build/lint/test checkpoints | User | open |
| Template and product responsibilities drift again | Future work recreates coupling | Document and review dependency rules for new modules | User | open |

## Acceptance criteria

- [ ] Rivera remains available as a template and visual guide.
- [ ] Rivera design-system components are reused directly; no parallel design system exists.
- [ ] Loopdev owns its application routes, pages, navigation and CRM domain code.
- [ ] Loopdev does not import Rivera pages, features or mock data.
- [ ] Rivera does not import Loopdev modules.
- [ ] `/launchpad` and `/app/*` continue to work with Loopdev navigation.
- [ ] Existing Rivera template routes continue to work.
- [ ] Existing build, lint and test commands pass.
- [ ] The user explicitly approves closure.

## Change log

| Date | Change | Reason | Approved by |
| --- | --- | --- | --- |
| 2026-09-09 | Created separation track | Keep Rivera as the unchanged visual template while making Loopdev the real application | User |
