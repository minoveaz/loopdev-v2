---
title: LoopDev v2 shell reference
status: current-source-reference
owner: platform
---

# LoopDev v2 shell reference

This document describes the shell, navigation, route, settings, and layout
patterns implemented in the current source tree.

## Implemented shell

Historical shell material is already resolved under
`docs/03-platform/archive/` and is not implementation evidence. This reference
uses only the current source-backed shell described below.

### Shell composition

- `src/components/layout/AppShell.tsx` is the authenticated application shell.
  It selects `src/loopdev/LoopdevShell.tsx` for `/launchpad` and `/app/*`, and
  `src/template/rivera/RiveraShell.tsx` for other authenticated routes.
- `src/loopdev/LoopdevShell.tsx` delegates the LoopDev workspace sidebar to
  `src/loopdev/components/LoopdevSidebar.tsx`, which supplies
  `src/loopdev/navigation.ts` to the shared `Sidebar`.
- The shell renders `Topbar`, a routed `<Outlet>` in `main#main-content`, and
  `AppFooter` from `src/components/layout/`. It includes a skip-to-content
  link and closes the mobile navigation on route changes.

### Sidebar and top bar

- `src/components/layout/Sidebar.tsx` renders the navigation tree, active
  route handling, nested expansion, user menu, scroll area, and mobile
  dialog/drawer semantics. It accepts `navigationOverride` for the LoopDev
  workspace.
- `src/components/layout/Topbar.tsx` provides the sidebar toggle, command
  search, language menu, messages, notifications, theme controls, and account
  menu/sign-out actions. The command menu is implemented by
  `src/components/layout/CommandMenu.tsx`.
- `src/components/layout/AppFooter.tsx` provides the compact footer and
  responsive resources menu.

## Responsive behavior

The current shell uses Tailwind breakpoints represented in source as:

- below `md` (`768px`): the sidebar is a mobile drawer/dialog; the shell locks
  body scrolling while it is open, traps focus, supports Escape, and restores
  focus to the opener (`AppShell.tsx`, `Sidebar.tsx`);
- `md` through below `nav` (`1200px`): the sidebar is forced into a 60px mini
  presentation and content receives `md:ps-[60px]`;
- at or above `nav` (`1200px`): the user's collapsed state controls 60px versus
  260px content padding; the top-bar toggle changes the large-screen state;
- the shell listens for direction/language/theme changes and avoids stale
  drawer transitions or scroll locks;
- the communications route uses a full-height, overflow-hidden layout and
  hides the footer; the theme customizer floating action is hidden on
  `/launchpad` and communications.

Evidence: `src/components/layout/AppShell.tsx`,
`src/components/layout/Sidebar.tsx`, and
`src/components/layout/Topbar.tsx`.

## Navigation and routes

- `src/app/navigation.ts` defines the main navigation tree and
  `collectNavRoutes` helper for route coverage.
- `src/loopdev/navigation.ts` defines the LoopDev workspace navigation passed
  to the shared sidebar.
- `src/app/nav-types.ts` defines the navigation node/section types.
- `src/routes/AppRoutes.tsx` owns the top-level route tree, lazy loading,
  public paths, protected routing, redirects, and the `NotFound` wildcard.
  Authenticated routes are nested below `ProtectedRoute` and `AppShell`.
- `src/routes/ProtectedRoute.tsx` redirects unauthenticated users to
  `/pages/login` while preserving the originating location.
- `src/routes/LoopdevRoutes.tsx` defines the current LoopDev routes, including
  `/launchpad`, `/app/settings`, CRM routes, communications, tasks, and ERP
  routes. Some former deep links redirect to current settings paths.
- `src/components/common/RouteLoader.tsx` and
  `src/routes/RouteFallback.tsx` provide route-loading/fallback UI for lazy
  navigation.

## Page layout patterns

`src/components/common/PageContainer.tsx` is the shared content wrapper with
`wide`, `default`, and `narrow` widths. `AppShell.tsx` supplies responsive
content padding; pages generally compose `PageContainer` with `PageHeader`,
`PageTabs`, data surfaces, and common states. Settings pages can use
`FormSection`, `FormSectionNav`, and `SettingsCard` from
`src/components/common/`.

## Settings and appearance

- `/app/settings` and `/app/settings/communications` are implemented in
  `src/loopdev/pages/Settings.tsx` and
  `src/loopdev/pages/settings/Communications.tsx`.
- Account and template settings routes are declared in
  `src/routes/AppRoutes.tsx`; the account menu links to profile, settings,
  security, and billing.
- Theme and appearance behavior is implemented by
  `src/hooks/use-theme.tsx`, `src/hooks/useThemeConfig.ts`,
  `src/providers/ThemeConfigProvider.tsx`,
  `src/components/theme/ThemeCustomizer.tsx`, and
  `src/components/settings/`.
- Language and direction behavior is implemented by `src/i18n/index.tsx` and
  locale files under `src/i18n/locales/`.

## Gaps and non-implemented capabilities

The current source does not provide a generic shell configuration registry,
route-generation system, permission-aware navigation contract, server-driven
navigation, cross-application shell orchestration, or a universal layout
builder. Those capabilities must not be inferred from the existing shell.
Navigation is source-defined, route protection is currently handled by
`ProtectedRoute`, and broader authorization behavior requires separate
evidence. Proposed shell behavior needs a source, route/consumer, and test
change before it can be described as implemented.
