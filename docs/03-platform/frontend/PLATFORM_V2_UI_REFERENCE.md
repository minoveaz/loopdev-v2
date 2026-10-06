---
title: LoopDev v2 UI reference
status: current-source-reference
owner: platform
---

# LoopDev v2 UI reference

This document records reusable UI primitives and components that are present
in the current source tree. A path is evidence of implementation, not a
promise that every component is used on every route. Proposed patterns are
listed separately and are not runtime capabilities.

## Implemented and reusable

### Page and navigation composition

| Component | Exact path | Scope and evidence |
| --- | --- | --- |
| `PageContainer` | `src/components/common/PageContainer.tsx` | Shared page wrapper with `wide`, `default`, and `narrow` max-widths, centered layout, and vertical rhythm. |
| `PageHeader` | `src/components/common/PageHeader.tsx` | Shared page title/description/actions header with responsive stacking. |
| `PageTabs` | `src/components/common/PageTabs.tsx` | Router-linked or controlled tabs; active route matching and horizontal overflow scrolling. |
| `AppBreadcrumbs` | `src/components/common/AppBreadcrumbs.tsx` | Breadcrumb presentation for page hierarchy. |
| `FormSection` | `src/components/common/FormSection.tsx` | Reusable form/settings section; auto-responsive two-column layout at `lg` and optional collapse state. |
| `FormSectionHeader` / `FormSectionNav` | `src/components/common/FormSectionHeader.tsx`, `src/components/common/FormSectionNav.tsx` | Shared section heading and settings/form navigation patterns. |

These components are re-exported from
`src/components/common/index.ts`; consumers should import from that barrel
where appropriate.

### Data, status, and feedback

| Component | Exact path | Scope and evidence |
| --- | --- | --- |
| `DataTable` | `src/components/common/DataTable.tsx` | Shared typed data-table composition with columns and row/bulk actions. |
| `TablePagination` / `TableSkeleton` | `src/components/common/TablePagination.tsx`, `src/components/common/TableSkeleton.tsx` | Pagination and loading treatment for table views. |
| `DataCard`, `StatCard`, `ChartCard` | `src/components/common/DataCard.tsx`, `src/components/common/StatCard.tsx`, `src/components/common/ChartCard.tsx` | Reusable dashboard/data summary surfaces. |
| `SurfaceCard` / `ClickableSurfaceCard` | `src/components/common/SurfaceCard.tsx`, `src/components/common/ClickableSurfaceCard.tsx` | Shared surface and interactive-card compositions. |
| `EmptyState`, `LoadingState`, `LoadingSkeleton` | `src/components/common/EmptyState.tsx`, `src/components/common/LoadingState.tsx`, `src/components/common/LoadingSkeleton.tsx` | Shared empty and loading states. |
| `ConfirmDialog` | `src/components/common/ConfirmDialog.tsx` | Confirmation dialog for destructive or consequential actions. |
| `StatusBadge` / `MetricTrend` | `src/components/common/StatusBadge.tsx`, `src/components/common/MetricTrend.tsx` | Shared status and metric-change presentation. |
| `SearchInput` / `FilterDropdown` / `DateRangeFilter` | `src/components/common/SearchInput.tsx`, `src/components/common/FilterDropdown.tsx`, `src/components/common/DateRangeFilter.tsx` | Reusable filtering controls used by list/data surfaces. |
| `DetailDrawer` | `src/components/common/DetailDrawer.tsx` | Detail panel wrapper around the platform drawer with `expanded` layout and automatic responsive behavior. |
| `AdaptiveContextMenu` | `src/components/common/AdaptiveContextMenu.tsx` | Shared contextual action menu abstraction. |

### Platform and product UI

| Component | Exact path | Scope and evidence |
| --- | --- | --- |
| `AppDrawer` | `src/components/platform/AppDrawer.tsx` | Platform drawer primitive used by detail and workspace interactions. |
| `NoteComposer` / `NoteEditorDrawer` | `src/components/common/NoteComposer.tsx`, `src/components/common/NoteEditorDrawer.tsx` | Shared note composition/editing UI; modules must reuse these rather than create parallel editors. |
| `ActivityFeed` | `src/components/common/ActivityFeed.tsx` | Shared activity-feed presentation. |
| `SettingsCard` | `src/components/common/SettingsCard.tsx` | Reusable settings surface. |
| `src/components/ui/*` | `src/components/ui/` | Implemented low-level shadcn-style primitives, including `button`, `dialog`, `drawer`, `dropdown-menu`, `popover`, `select`, `command`, `calendar`, `table`, `tabs`, `tooltip`, and related controls. |
| Theme controls | `src/components/theme/ThemeCustomizer.tsx`, `src/components/settings/ThemeColorPicker.tsx`, `src/components/settings/ThemeOptionCard.tsx`, `src/components/settings/ThemePreview.tsx` | Implemented appearance customization surfaces integrated with the shell. |

### Platform work and files

The current source tree exposes these shared capabilities through the following
barrels and paths:

| Capability | Current implementation evidence | Adaptation |
| --- | --- | --- |
| Tasks | `src/loopdev/components/platform/index.ts` exports `PlatformTaskForm`, `PlatformTaskList`, and `PlatformTaskWorkspace` from `TaskWorkspace.tsx`; consumed by `src/loopdev/pages/platform/Workspace.tsx`. | Applies as a shared Platform capability; use the current barrel and domain types under `src/loopdev/domains/platform/`. |
| Notes, activity, timeline, notifications, relations, attachments | `src/loopdev/components/platform/index.ts` exports the corresponding panels/feed components. | Applies as reusable Platform UI; verify each consumer and do not infer a universal shell zone from the archived contract. |
| Files | `src/loopdev/components/files/index.ts` exports `FilesDropzone`, `FilePicker`, `UploadQueue`, `FilePreview`, `FilePreviewDialog`, `FileList`, `FileCategoryTabs`, and `RelatedFilesPanel`. | Applies as the current file UI surface; use these exports and the current files domain, not the archived inventory wording. |

Current platform types use `EntityScope`/`EntityRef` in
`src/loopdev/domains/platform/types.ts`, persistence is behind
`src/loopdev/domains/platform/adapter/`, and focused tests exist under
`src/test/platform/`. Compatibility behavior is only claimed when a current
consumer and compatibility test identify it; it must not justify adding
parallel APIs.

## Evidence and reuse rules

- The common barrel at `src/components/common/index.ts` is the verified
  public reuse surface for the common components listed above.
- Route consumers provide additional evidence; examples include
  `src/template/rivera/pages/reports/SalesReport.tsx` and
  `src/template/rivera/pages/reports/ActivityLogs.tsx`, which use
  `PageContainer` and common data components.
- Existing tests under `src/test/` cover selected primitives and behaviors,
  including `src/test/platform/app-drawer.test.tsx`,
  `src/test/page-container-consistency.test.ts`, and
  `src/test/sidebar-drawer.test.tsx`.
- Reuse is preferred over module-local duplicates. A missing cross-module
  capability is a proposal requiring an explicit platform change, not an
  implemented primitive.

## Proposed, not implemented

The source tree does not establish a generic component registry, a generated
component catalog, or a universal page-builder API. New primitives,
cross-module contracts, or standardized compositions not listed above are
proposals until they have source, route/consumer, and test evidence.
