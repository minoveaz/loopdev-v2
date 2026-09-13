---
title: LoopDev desktop component inventory
status: active
classification: discovery
owner: Platform Delivery
phase: 0
---

# Phase 0: Desktop component inventory

This inventory is the baseline for the multiplatform component strategy. It
records components that are already consumed by product surfaces before any
new cross-platform UI kit is designed. It is intentionally an inventory, not
a migration plan: no existing component should be replaced or duplicated
until its consumers and behavior are understood.

## Audit scope

The audit covers product-facing desktop code in:

- `src/components/common`
- `src/components/platform`
- `src/loopdev/components/crm`
- `src/loopdev/components/communications`
- `src/loopdev/components/platform`
- CRM, ERP, Conversations, platform and settings pages
- Rivera components directly consumed by application routes or product code

The large Rivera template catalogue is not treated as a product component
catalogue unless an actual product surface imports it.

## Reusable shared components

| Component | Source | Current consumers | Kind | Mobile direction |
|---|---|---|---|---|
| `PageContainer` | `src/components/common/PageContainer.tsx` | CRM, platform, settings and route pages | Shared layout | Shared contract; native page container |
| `PageHeader` | `src/components/common/PageHeader.tsx` | CRM lists, details and workspace pages | Shared layout | Shared contract; mobile header adaptation |
| `DataCard` | `src/components/common/DataCard.tsx` | Contacts, Leads, Opportunities, Communications and reports | Shared surface | Responsive web reuse; mobile card renderer |
| `StatCard` | `src/components/common/StatCard.tsx` | Workspace, operations and reports | Shared surface | Shared data contract; compact mobile card |
| `StatusBadge` | `src/components/common/StatusBadge.tsx` | CRM, Communications, settings and tables | Shared semantic UI | Shared status vocabulary and tokens |
| `SearchInput` | `src/components/common/SearchInput.tsx` | CRM lists, inboxes and task views | Shared control | Shared search contract; native input |
| `FilterDropdown` | `src/components/common/FilterDropdown.tsx` | CRM lists, inboxes and reports | Shared control | Shared filter contract; sheet/select renderer |
| `DataTable` | `src/components/common/DataTable.tsx` | Operations, workspace and table views | Shared data view | Shared columns/actions; mobile list/card renderer |
| `TablePagination` | `src/components/common/TablePagination.tsx` | Data-table consumers | Shared control | Shared pagination contract; mobile paging/infinite loading |
| `TableSkeleton` | `src/components/common/TableSkeleton.tsx` | Table consumers | Shared state | Mobile list skeleton renderer |
| `DateRangeFilter` | `src/components/common/DateRangeFilter.tsx` | Activity and report views | Shared control | Shared range contract; mobile date sheet |
| `EmptyState` | `src/components/common/EmptyState.tsx` | CRM, Communications and reports | Shared state | Shared state contract and mobile composition |
| `LoadingState` | `src/components/common/LoadingState.tsx` | CRM and Communications | Shared state | Shared state contract and mobile composition |
| `ConfirmDialog` | `src/components/common/ConfirmDialog.tsx` | Contacts, Leads and destructive flows | Shared feedback | Dialog on desktop, action sheet on mobile |
| `SurfaceCard` | `src/components/common/SurfaceCard.tsx` | Settings and Communications settings | Shared surface | Shared tokens; responsive/native surface |
| `PageTabs` | `src/components/common/PageTabs.tsx` | Detail and workspace pages | Shared navigation | Shared tab semantics; scrollable mobile tabs |
| `AppBreadcrumbs` | `src/components/common/AppBreadcrumbs.tsx` | Shell and detail pages | Shared navigation | Condensed back/context header |
| `FormSection*` | `src/components/common/FormSection*.tsx` | Forms and settings | Shared form layout | Sectioned mobile form |
| `SettingsCard` | `src/components/common/SettingsCard.tsx` | Settings pages | Shared surface | Responsive/native settings row/card |
| `UserAvatar` | `src/components/common/UserAvatar.tsx` | People and CRM flows | Shared identity UI | Shared identity contract; native renderer |
| `MonoCell` | `src/components/common/MonoCell.tsx` | Tables and record details | Shared data display | Shared formatting contract |
| `NoteComposer` | `src/components/common/NoteComposer.tsx` | Notes and record workflows | Shared domain control | Mobile composer renderer |
| `NoteEditorDrawer` | `src/components/common/NoteEditorDrawer.tsx` | Note editing flows | Shared domain control | Bottom-sheet/editor renderer |
| `ClickableSurfaceCard` | `src/components/common/ClickableSurfaceCard.tsx` | Card-based navigation | Shared interaction | Shared interaction contract |

## Product and domain components

| Component | Source | Consumers | Domain | Mobile direction |
|---|---|---|---|---|
| `AppDrawer` / `ResponsiveDrawer` | `src/components/platform/` | CRM operations, leads and tasks | Platform shell | Shared navigation contract; mobile drawer |
| `CRMRecordPicker` | `src/loopdev/components/crm/CRMRecordPicker.tsx` | Tasks, Opportunities and Leads | CRM | Shared query/selection contract; native picker |
| `CRMWorkspacePanel` | `src/loopdev/components/crm/CRMWorkspacePanel.tsx` | Communications detail | CRM + Communications | Define shared record context; mobile detail renderer |
| `ContactFormDrawer` | `src/loopdev/components/crm/contacts/ContactFormDrawer.tsx` | Contacts | CRM | Shared form schema; mobile sheet/screen |
| `ContactMobileCard` | `src/loopdev/components/crm/contacts/ContactMobileCard.tsx` | Contacts | CRM | Existing mobile precedent; generalize its pattern |
| `ConversationOperationsPanel` | `src/loopdev/components/communications/ConversationOperationsPanel.tsx` | Communications | Conversations | Native/mobile operations renderer |
| `ConversationTimelinePanel` | `src/loopdev/components/communications/ConversationTimelinePanel.tsx` | Communications | Conversations | Shared timeline contract; mobile timeline renderer |
| `ConversationTimelineRail` | `src/loopdev/components/communications/ConversationTimelineRail.tsx` | Communications | Conversations | Shared event model; mobile vertical timeline |
| `MessageContextMenu` | `src/loopdev/components/communications/MessageContextMenu.tsx` | Communications | Conversations | Shared actions; mobile action sheet |
| `TaskWorkspace` / `PlatformTaskForm` | `src/loopdev/components/platform/TaskWorkspace.tsx` | Task templates and workspace | Platform | Shared form/task contract; mobile form renderer |

## Rivera usage boundary

Rivera is the desktop visual baseline and contains many reusable examples, but
its full template catalogue is not automatically part of the LoopDev product
component API.

The following Rivera modules are known direct consumers or route-level
dependencies and must be classified before reuse in new product modules:

| Rivera module | Source | Usage | Decision |
|---|---|---|---|
| `RiveraShell` | `src/template/rivera/RiveraShell.tsx` | Application/template shell wiring | Desktop reference; mobile shell remains native |
| `ProductDialog` | `src/template/rivera/features/commerce/ProductDialog.tsx` | Rivera product management pages | Do not copy; extract dialog/form behavior if needed |
| `OrderDetailsDrawer` | `src/template/rivera/features/commerce/OrderDetailsDrawer.tsx` | Rivera order pages | Do not copy; use shared detail contract |
| `UserDetailsDrawer` | `src/template/rivera/features/users/UserDetailsDrawer.tsx` | Rivera user pages | Do not copy; use shared identity/detail contract |
| `ActivityFeed`, `MessagesFeed`, `NotificationsFeed` | `src/template/rivera/features/feeds/` | Rivera feed pages | Candidate shared feed contract |
| `Showcase` / `ShowcaseRow` | `src/template/rivera/features/ui-kit/Showcase.tsx` | Rivera UI examples | Reference only |
| `EmailTemplatePage` | `src/template/rivera/features/email-templates/shared.tsx` | Rivera email template pages | Product-specific; not a cross-platform primitive |

## Priority classification

### Extract first

These components appear across multiple product areas and should define the
first shared contracts:

1. `PageContainer` and `PageHeader`
2. `DataTable` and the table state components
3. `DataCard` and `StatCard`
4. `StatusBadge`
5. `SearchInput`, `FilterDropdown` and `DateRangeFilter`
6. `EmptyState`, `LoadingState` and error/forbidden states
7. `PageTabs`, `AppBreadcrumbs` and shell navigation
8. `ConfirmDialog` and action-menu semantics

### Extract after the shared base

- `CRMRecordPicker`
- `ContactFormDrawer`
- `NoteComposer`
- `CRMWorkspacePanel`
- `TaskWorkspace`
- conversation timeline and message actions

### Keep platform-specific

The visual implementation may remain platform-specific when the interaction
model is inherently different:

- desktop data table versus mobile data list;
- desktop drawer versus mobile bottom sheet;
- desktop hover/context menus versus mobile action sheets;
- desktop dense timeline rail versus mobile vertical timeline.

The semantics, states, permissions, actions and data contracts must still be
shared.

## Phase 0 findings

1. We already have a meaningful shared desktop vocabulary; the first step is
   inventory and contract extraction, not creating a second component library.
2. `DataTable`, `DataCard`, `StatusBadge`, filters and state components are
   the highest-leverage migration surface.
3. `ContactMobileCard` is an existing mobile precedent that should become a
   reusable pattern rather than remain a one-off.
4. Rivera components should be treated as desktop implementations or visual
   references, not copied wholesale into `apps/mobile`.
5. Mobile parity should be measured by shared capability, state and hierarchy,
   not by forcing a pixel-identical desktop layout onto a narrow viewport.

## Exit criteria for Phase 0

Phase 0 is complete when:

- every product-facing shared component has an owner and classification;
- every high-priority component has its actual consumers recorded;
- Rivera direct usage is separated from LoopDev product components;
- each component has a mobile direction;
- duplicate or one-off mobile implementations are identified;
- Phase 1 starts from this inventory and does not introduce an unclassified
  replacement component.

## Phase 1 handoff

Phase 1 should create contracts and tokens for the **Extract first** group,
starting with `DataTable`/`MobileDataList`, shared state components and
`StatusBadge`. It should not attempt to migrate every Rivera template or
rewrite existing product screens in one pass.
