# Rivera and Loopdev ownership

This repository contains two application surfaces that intentionally share Rivera's visual
foundation:

- `src/components/ui`, `src/components/common`, `src/components/theme`,
  `src/components/settings` and generic layout utilities are shared infrastructure.
- `src/template/rivera` owns Rivera demo pages, demo features, navigation and demo data.
- `src/loopdev` owns the Loopdev application, product navigation, pages, components and domains.
- `src/routes` contains only root route composition.

## Dependency rules

Loopdev may import shared UI and platform utilities, but must not import Rivera pages, features or
mock data. CRM pages and hooks must access data through the adapter under
`src/loopdev/domains/crm/adapter`.

Rivera must not import Loopdev modules. Shared components must remain product-agnostic and must not
depend on either application's business data.

When adding a new module, place it under the owner that supplies its behavior. Reuse shared visual
primitives directly instead of copying them into either application boundary.

## Route and shell ownership

`src/routes/AppRoutes.tsx` composes the application routes. Loopdev routes are defined in
`src/routes/LoopdevRoutes.tsx`, while Rivera routes remain composed by the template-facing router.
`RiveraShell` and `LoopdevShell` select their respective navigation, reusing the shared layout
primitives.
