# Mobile shell navigation contract

## Purpose

Define the implemented mobile navigation boundary for the current LoopDev
shell. This is a source-backed contract for `AppShell`, `Sidebar`, `Topbar`
and the LoopDev navigation tree.

## Current ownership

| Concern | Current owner | Evidence |
| --- | --- | --- |
| Shell selection and mobile drawer lifecycle | `AppShell` | `src/components/layout/AppShell.tsx` |
| Navigation tree and active route state | `Sidebar` | `src/components/layout/Sidebar.tsx` |
| LoopDev workspace navigation data | `LoopdevSidebar` and `loopdevNavigation` | `src/loopdev/components/LoopdevSidebar.tsx`, `src/loopdev/navigation.ts` |
| Mobile/desktop toggle trigger | `Topbar` coordinated by `AppShell` | `src/components/layout/Topbar.tsx`, `src/components/layout/AppShell.tsx` |
| Route transition cleanup | `AppShell` | `src/components/layout/AppShell.tsx` closes the drawer on pathname changes |
| Routed page content | `Outlet` inside `AppShell` | `src/components/layout/AppShell.tsx` |

Pages do not create a second global navigation drawer or shell-level overlay
manager. Page-specific drawers such as `src/components/platform/AppDrawer.tsx`
remain content surfaces, not replacements for the shell navigation.

## Implemented mobile behavior

- Below `768px`, `Sidebar` uses drawer/dialog semantics and `AppShell` owns
  body-scroll locking, Escape handling, and cleanup.
- `Sidebar` moves focus into the open drawer, traps Tab navigation, and restores
  focus to the opener when it closes.
- The shell closes the mobile drawer after route changes and when the viewport
  crosses into desktop.
- At `768px`–`1199px`, the sidebar is forced into its mini presentation.
- At `1200px` and above, the user-controlled collapsed state determines the
  60px or 260px content offset.

Evidence: `src/components/layout/AppShell.tsx` and
`src/components/layout/Sidebar.tsx`.

## Navigation data and routes

- Main navigation is defined in `src/app/navigation.ts`.
- LoopDev navigation is defined in `src/loopdev/navigation.ts` and passed by
  `src/loopdev/components/LoopdevSidebar.tsx`.
- Navigation node types are defined in `src/app/nav-types.ts`.
- Route ownership is in `src/routes/AppRoutes.tsx`,
  `src/routes/LoopdevRoutes.tsx`, and `src/routes/ProtectedRoute.tsx`.
- `Topbar` exposes the implemented search command menu, language picker, theme
  controls, notifications, messages, account menu and sign-out actions.

## Accessibility requirements supported by the implementation

The mobile drawer must retain an accessible navigation name, keyboard focus
management, Escape dismissal, visible focus treatment, and focus restoration.
The shell provides a skip-to-content link and a stable `main#main-content`
target. These behaviors are covered by source evidence and related tests such
as `src/test/sidebar-drawer.test.tsx`.

## Gaps and non-implemented capabilities

The current source does not implement a separate mobile bottom-navigation
component, a server-driven navigation contract, a generic navigation registry,
or a module-context overlay coordinated by the shell. It also does not expose a
permission-filtered navigation API beyond the existing route/auth behavior.
Such capabilities require a new source implementation, route/consumer
evidence, and focused tests before being added to this contract.
