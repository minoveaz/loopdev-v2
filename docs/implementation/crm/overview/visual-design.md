# CRM Overview — 01 Visual Design

> Normative visual source for `MOD-CRM-20260927-001`. Styled SVGs are review
> evidence only; they do not replace this specification or runtime validation.

## Inputs and approval

- Product definition: `docs/06-product/crm/README.md` and
  `docs/06-product/crm/CRM_SUITE_CONTRACT_ALIGNMENT.md`
- Module design: `design.md`
- Architecture and plan: `architecture-design.md`, `implementation-plan.md`
- Rivera/shared primitive references:
  `src/components/common/{PageHeader,StatCard,SurfaceCard,DateRangeFilter,AnalyticsEmptyState}.tsx`,
  `src/components/ui/{select,popover,command,calendar}.tsx`,
  `src/components/layout/AppShell.tsx`
- Approved direction: remote KPI cards, pipeline health, compact task summary
  and one authoritative business-activity summary. Remove the full Tasks
  workspace from this route, duplicate Timeline/Activities, default
  Notes/Attachments, fixed demo relations and document-extraction noise.
- Approval status: `approved`
- Approval evidence: user approval received on 2026-09-27; runtime comparison
  remains pending because production implementation has not started.

## Rivera / LoopDev baseline inventory

| Category | Current baseline/source | Observed value or convention | Evidence |
|---|---|---|---|
| Tokens | `src/index.css`, Tailwind theme | neutral surfaces, semantic status colors, compact dashboard density | existing shared theme |
| Typography | Rivera UI reference and `PageHeader` | clear page title, muted supporting copy, tabular numbers for metrics | `src/components/common/PageHeader.tsx` |
| Radii | shared `SurfaceCard`, `StatCard` | small/medium consistent card radius; no bespoke CRM radius | shared components |
| Borders | shared cards and controls | low-contrast border, divider only for grouping | `src/components/common/SurfaceCard.tsx` |
| Shadows | Rivera card treatment | restrained elevation; never use shadow as the only grouping cue | Rivera dashboard patterns |
| Spacing | shared page/container utilities | 4/8px rhythm, 16–24px panel gaps, dense but breathable desktop layout | existing CRM pages |
| Primitives | `PageHeader`, `StatCard`, `SurfaceCard`, `DateRangeFilter`, `Select`, `Popover`, `Command`, `Calendar` | reuse; no native select or parallel card system | source paths above |
| CRM density | current CRM/Pipeline surfaces | desktop dashboard is information-dense; mobile becomes a readable stack | `CRM_UI_COMPONENT_PROTOCOL.md` |

### Visual decisions

1. The page has one visual priority: answer “how is the business doing and
   what should I do now?” without competing feeds.
2. KPI cards are remote-ready and always show period and freshness metadata;
   “no data” is not rendered as a fabricated zero.
3. Pipeline health is the primary work surface. Tasks and activity are
   supporting summaries, not alternate workspaces.
4. No default Notes, Attachments, relation tiles or Document Intelligence
   panels appear on this overview. Those capabilities remain contextual on
   authorized detail routes.
5. No visual extension of Platform is proposed in this gate.

## View wireframes

### V1 — Sales Operating Dashboard, desktop (≥1200px)

Evidence: [`runs/MOD-CRM-20260927-001/visual-desktop.svg`](runs/MOD-CRM-20260927-001/visual-desktop.svg)

Composition, top to bottom:

1. AppShell/Topbar and CRM breadcrumb remain Platform-owned.
2. `PageHeader`: eyebrow `CRM / OVERVIEW`, title `Sales overview`, one-line
   description, and a right-aligned `Refresh` action.
3. Filter row: `DateRangeFilter`, organization/team scope controls using
   Rivera `Select`/`Popover`/`Command`, and a visible “Updated … ago” freshness
   label. Filters are query parameters, not hidden component state.
4. Four equal `StatCard`s: pipeline value, open opportunities, win rate and
   overdue tasks. Each includes value, period comparison, trend text/icon and
   freshness; trend is never color-only.
5. Main two-column content grid: `PipelineHealthCard` (8 columns) and
   `PipelineRiskCard` (4 columns). The latter contains textual risks and links,
   not a second chart legend.
6. Lower two-column grid: `TaskSummaryCard` (compact next/overdue rows and
   `View tasks` deep link) and `BusinessActivitySummaryCard` (one deduplicated
   chronological summary with `View activity` deep link).
7. No full task table, timeline rail, notes composer, attachments panel,
   relation showcase or extraction metrics.

Representative data is tenant-scoped and labelled as illustrative in the SVG:
`$248.4k pipeline`, `32 open`, `27.4% win rate`, `6 overdue`; stages show
counts/value and a text health summary. The runtime must use adapter data or an
explicit empty state, never these SVG values.

### V2 — Sales Operating Dashboard, tablet (768–1199px)

The header and filters wrap to two rows. KPI cards use a 2×2 grid. Pipeline
health remains full width; risk, tasks and activity follow as full-width cards
in that order. The filter popover is constrained to the viewport and the
content never requires horizontal scrolling. Evidence is covered by the
responsive acceptance criteria and the desktop/mobile SVG pair.

### V3 — Sales Operating Dashboard, mobile (≤767px)

Evidence: [`runs/MOD-CRM-20260927-001/visual-mobile.svg`](runs/MOD-CRM-20260927-001/visual-mobile.svg)

1. AppShell mobile navigation owns the menu; the page does not add a second
   navigation drawer.
2. Compact `PageHeader` stacks title, freshness and refresh action.
3. Filters collapse behind one labelled `Filters` button opening a focus-trapped
   Popover/Sheet. Date selection uses `Calendar`; scope search uses `Command`.
4. KPI cards stack one per row, preserving value → label → comparison →
   freshness order.
5. Pipeline health uses readable stage rows with progress bars and text
   percentages; risk card follows.
6. Task and activity summaries use rows with minimum 44px touch targets and
   explicit deep-link affordances. No dense table or horizontal carousel.

## Component hierarchy

```text
OverviewPage (route composition only)
├─ AppShell / Breadcrumbs (Platform)
├─ PageHeader (shared)
│  ├─ RefreshButton (shared action pattern)
│  └─ FreshnessBadge (CRM presentation)
├─ OverviewFilters (CRM presentation)
│  ├─ DateRangeFilter → Calendar (shared)
│  ├─ ScopeSelect → Select/Popover/Command (shared)
│  └─ FilterSummary (CRM presentation)
├─ KpiGrid
│  └─ StatCard × 4 (shared)
├─ PipelineHealthCard (CRM presentation)
│  ├─ StageHealthRows
│  └─ PipelineRiskCard (CRM presentation)
├─ TaskSummaryCard
│  └─ TaskSummaryRow × N (Tasks contract, rendered compactly)
└─ BusinessActivitySummaryCard
   └─ ActivitySummaryRow × N (Activity contract, deduplicated)
```

`OverviewPage` owns composition and route transitions only. Query orchestration
belongs to `useSalesOverview`; domain types and adapters stay under
`src/loopdev/domains/crm`/Analytics ports. Task transition remains Platform
Tasks-owned; this page may deep-link or offer inline transition only after the
approved access/API decision.

## Visual states and recovery

The normative state matrix is [`view-state-matrix.md`](view-state-matrix.md).
Each card owns its query state so one failed source does not blank the page.

- `loading`: skeleton preserves final card geometry; announce “Loading sales
  overview” once, not per skeleton row.
- `success`: show values, source period and freshness.
- `empty`: explain which scope/period has no records and offer filter change;
  do not imply zero business activity unless the contract says zero.
- `partial`: retain successful cards, show an inline warning on the affected
  card and a scoped retry.
- `error`: show concise error code/correlation reference and `Try again`;
  keep filter context.
- `forbidden`: replace data with a neutral permission message and do not expose
  cached values, counts or entity names.
- `stale/offline`: show last authorized snapshot, timestamp and banner;
  provide retry/reconnect. Clear snapshot when tenant/membership scope changes.
- `pending`: refresh button and deep links show progress without layout shift.
- `conflict`: only applies to an optional task transition; link to Tasks and
  explain that the current version changed.

## Responsive breakpoints

| Breakpoint | Layout rule | Interaction changes | Evidence |
|---|---|---|---|
| Desktop ≥1200 | 4 KPI columns; 8/4 primary grid; 2-column summaries | Inline filters, visible labels, pointer and keyboard actions | `visual-desktop.svg`, V1 |
| Tablet 768–1199 | 2×2 KPI grid; all content cards stack | Filters wrap; popovers stay viewport-contained | V2 criteria |
| Mobile ≤767 | one column; compact header; readable rows | Filters in focus-trapped sheet/popover; 44px targets; no horizontal scroll | `visual-mobile.svg`, V3 |
| iOS/Android | planned native parity, not claimed by this gate | Platform owner maps same hierarchy after web approval | `platform-scope.md` |

## Accessibility, keyboard, i18n and RTL

- Landmark order is `main → header → filters → KPI region → pipeline region →
  tasks region → activity region`; each card has a unique heading.
- Keyboard order follows visual order. All cards with actions expose a labelled
  link/button; no click-only card containers.
- Focus is visible with the shared focus ring. Refresh preserves focus and
  announces completion/failure in a polite live region.
- Filter popover/sheet traps focus while open, returns focus to its trigger on
  close, supports Escape and has an accessible name. Date controls expose
  keyboard calendar navigation.
- Pipeline bars include text values and accessible labels; color is never the
  only signal for risk, trend, status or freshness.
- Loading uses skeletons plus a single live announcement; errors are associated
  with their retry action. Forbidden state does not announce hidden data.
- Touch targets are at least 44×44 CSS px. Reduced-motion users receive no
  animated chart transitions; progress changes are instantaneous.
- All copy, dates, numbers, currency and relative times use `useT`/locale
  formatting. Do not concatenate translated fragments.
- RTL mirrors grids, icon placement and directional affordances; numeric
  values retain locale direction and pipeline order is explicitly labelled.
- Deep links announce the destination context after navigation and preserve a
  usable back path.

## Routes, deep links and navigation behavior

- Canonical route: `/app/sales-crm/overview`.
- Filters serialize to query parameters (`period`, `organization`,
  `workspace`, `brand`, `team`, `owner`, `stage`) after server-side scope
  validation. Refresh and shared links restore the same authorized view.
- KPI cards link to the relevant authorized CRM list with filter context.
  Pipeline stage rows deep-link to `/app/sales-crm/pipeline`; task/activity
  summaries link to `/app/sales-crm/tasks` and `/app/sales-crm/activity`
  respectively, subject to permission re-check.
- Direct access with a missing/invalid scope renders not-found or a neutral
  forbidden state according to route policy; it never reveals whether a
  record exists.
- Browser back returns to the previous filter state. Mobile navigation uses
  AppShell's existing menu and does not add a dashboard-specific drawer.

## Rivera and shared LoopDev reuse

| Need | Existing primitive/template | Reuse or extension decision | Evidence |
|---|---|---|---|
| Page title and actions | `PageHeader` | REUSE | shared component |
| KPI cards | `StatCard` | REUSE | shared component |
| Surfaces and grouping | `SurfaceCard` | REUSE | shared component |
| Date range | `DateRangeFilter` + `Calendar` | REUSE | shared component |
| Scope filtering | `Select`, `Popover`, `Command` | REUSE | no native controls |
| Empty/loading/error | `AnalyticsEmptyState` + shared status patterns | REUSE | existing analytics work |
| Tasks | Platform Tasks contract; compact renderer | REUSE, no workspace duplicate | `design.md` |
| Activity | Platform Activity contract; one summary | REUSE, no timeline duplicate | `design.md` |
| Notes/Files/Relations | contextual detail-route panels | REUSE_CONTEXTUAL, not default | `design.md` |
| Document Intelligence | existing contracts, excluded from overview | REUSE_OUT_OF_SCOPE | `design.md` |

### Zone reuse matrix

| Zone | Classification | Primitive or contract | Owner | Rationale | Evidence |
|---|---|---|---|---|---|
| Shell/header | shared | AppShell, PageHeader | Platform | consistent navigation and title hierarchy | route contract |
| Filters | shared | DateRangeFilter, Select, Popover, Command | Platform | consistent query controls and keyboard behavior | baseline inventory |
| KPI grid | shared + CRM | StatCard + Analytics read model | Platform/CRM | shared visual, CRM metric semantics | OVR-01 |
| Pipeline health | CRM | SurfaceCard + CRM stage contract | CRM | sales-specific health semantics | OVR-02 |
| Task summary | shared | Tasks read contract + compact rows | Platform Tasks | avoid a second task workspace | OVR-03 |
| Activity summary | shared | Activity read contract + dedupe | Platform Activity | one authoritative business feed | OVR-04 |
| Notes/files/relations | contextual | shared detail panels | Platform | preserve capability without default noise | OVR-07 |
| Extraction | excluded | Document Intelligence contract | Platform | not a sales operating signal | OVR-07 |

## Before/after legacy flow matrix

| Flujo legacy | Ubicación | Reemplazo | Eliminado | Evidencia |
|---|---|---|---:|---|
| Full Tasks workspace embedded/linked as dashboard destination | `/app/sales-crm/tasks`, overview task area | `TaskSummaryCard` + authorized deep link | Sí, from overview | V3, OVR-03 |
| Duplicate Timeline and Activities feeds | overview/activity surfaces | one `BusinessActivitySummaryCard` | Sí | V1, OVR-04 |
| Default Notes/Attachments panels | overview cards | contextual detail-route panels only | Sí | zone matrix |
| Fixed demo relations | overview relation tiles | authorized entity deep links; no fabricated relations | Sí | OVR-07 |
| Document-extraction metrics/noise | overview/document widgets | excluded; Document Intelligence remains separate | Sí | OVR-07 |

No two active paths remain for the same overview capability. Existing
dedicated routes remain available where they are their authoritative workspace;
the redesign removes only their duplicate presence from this dashboard.

## Visual acceptance criteria

| ID | Criterion | Evidence required |
|---|---|---|
| VD-01 | Desktop hierarchy contains header, filters, four KPI cards, pipeline health, compact tasks and one activity summary in that order | visual-desktop.svg + runtime screenshot later |
| VD-02 | No overview surface renders full Tasks, duplicate Timeline/Activities, default Notes/Attachments, fixed relations or extraction noise | legacy matrix + component/regression test later |
| VD-03 | Every view has loading, empty, error, forbidden, stale/offline and partial behavior without layout collapse | `view-state-matrix.md` |
| VD-04 | Tablet and mobile preserve semantic order and remove horizontal scrolling | responsive criteria + mobile SVG |
| VD-05 | Rivera/shared primitives are reused; no native select or parallel design system | baseline and reuse matrices |
| VD-06 | Keyboard, focus return, announcements, contrast, touch targets, RTL and i18n behavior are explicit | accessibility section + a11y runtime evidence later |
| VD-07 | Deep links, query filters, back navigation and permission re-check are defined | route section |
| VD-08 | SVG representative values are labelled as review-only and cannot become runtime fixtures | inputs and wireframe sections |

## Two-level validation

### Conceptual approval (before implementation)

- Scope and hierarchy: complete; approval pending.
- States and recovery: complete in `view-state-matrix.md`; approval pending.
- Responsive/accessibility: desktop/tablet/mobile and a11y guidance complete; approval pending.
- Rivera baseline and zone reuse: complete; no Platform extension proposed.
- Approver/date/decision/evidence: user approval required at
  `APPROVED_BY_USER`; the run proceeds through specialized analysis and then
  pauses at `WAITING_IMPLEMENTATION_APPROVAL`.

### Runtime comparison (after implementation)

- Runtime route and viewport set: not run; production code was not modified.
- Screenshot/visual-diff artifacts: not run.
- Comparison against approved source: pending visual approval and build.
- Deviations and approval: none recorded.
- Status: `NOT_RUN`.

## Open decisions

| ID | Decision | Owner | Proposed default | Impact | Approval needed |
|---|---|---|---|---|---|
| VD-OPEN-01 | Resolved KPI catalogue and freshness | CRM + Platform Analytics | four canonical cards; show generated/fresh-until metadata | labels and empty semantics | resolved 2026-09-27; evidence remains pending |
| VD-OPEN-02 | Team-scope semantics | CRM + Access | explicit organization/team scope intersection | filter options and RLS | yes |
| VD-OPEN-03 | Inline task transition | Platform Tasks | deep-link only for first implementation | action affordances and conflict state | yes |
| VD-OPEN-04 | Activity allowlist | Platform Activity | business events only; exclude extraction/system noise | dedupe and trust | yes |
| VD-OPEN-05 | Native parity ownership | Platform | iOS/Android planned after web approval | multiplatform evidence | yes |
