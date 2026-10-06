# CRM Pipeline Visual Design

> **Normative source for `MOD-CRM-PIPELINE-20260913-002`.** The SVGs in this
> workspace are review evidence only; they do not replace this document or
> constitute visual approval. Legacy component/view documents remain
> informational only.

## Gate and inputs

- Product definition: `docs/06-product/crm/pipeline/CRM_PIPELINE_UX_SPEC.md`
- Design/discovery: `discovery.md`, `architecture-design.md`
- Required gate: `01-visual-design`
- Current status: `WAITING_VISUAL_DESIGN_APPROVAL`
- Approval evidence: pending; no visual approval is claimed

## Rivera / LoopDev baseline inventory

This inventory records the baseline used to style the review wireframes. Values
are intentionally references to the current Rivera/LoopDev surfaces, not a
new Pipeline theme.

| Category | Baseline used | Evidence/source |
|---|---|---|
| Tokens | Rivera neutral canvas/surface, semantic blue action, amber warning, red danger, green success; every status also has text/icon | Existing Rivera template and shared status primitives |
| Typography | LoopDev sans stack; compact 12px metadata, 14px body, 16px controls, 20px page/section headings | Current CRM pages and typography tokens |
| Radii | 4px controls, 8px cards/drawers, 12px larger containers | Existing shared card, button and drawer recipes |
| Borders | 1px neutral dividers; stronger focus ring; semantic border paired with label/icon | Shared input, table and alert primitives |
| Shadows | Subtle elevation for cards/drawers only; no decorative shadows on dense tables | Rivera card, sheet and dialog patterns |
| Spacing | 4px base rhythm; 8/12/16/24px common gaps and padding | LoopDev spacing conventions |
| Primitives | `Button`, `Input`, `Select`/`Command`, `Popover`, `Calendar`, `Table`, `Sheet`, `Dialog`, `Badge`, `Alert`, skeleton and tooltip | Shared LoopDev/Rivera component inventory |
| CRM density | Dense but scannable: compact card metadata, 32–40px table rows, persistent amount/stage/owner, generous action target | Existing CRM Pipeline and Opportunities surfaces |

## Design principles and reuse

The existing Rivera template remains the shell baseline: page header and
breadcrumbs, responsive content container, cards, drawers, tables, badges,
buttons, menus, dialogs, skeletons and inline alerts. Use existing LoopDev
`Button`, `Input`, `Select`/`Command`, `Popover`, `Calendar`, `Table`,
`Sheet`/drawer, `Dialog`, status and tooltip primitives. Activity, Notes,
Tasks, Relations and Customer 360 remain shared Platform surfaces. No
module-local design system, timeline, uploader or replacement Kanban is
proposed.

## Wireframe index

| Surface | Desktop/mobile evidence | Source annotations |
|---|---|---|
| Kanban board and Opportunity card | `wireframes/pipeline-kanban.svg` (structure); `wireframes/pipeline-kanban-rivera.svg` (styled) | K1–K7, C1–C4 |
| Table, detail and manual creation | `wireframes/pipeline-surfaces.svg` (structure); `wireframes/pipeline-surfaces-rivera.svg` (styled) | T1–T5, D1–D5, F1–F5 |

Styled evidence uses realistic representative records (Acme renewal,
Globex expansion and Northstar pilot), desktop/mobile viewports, and labels
or icons alongside every state color cue.

### K. Kanban

Desktop uses a Rivera page header, filter/action row and horizontally
scrollable stage columns. Each column shows stage title, count/value and
cards. Mobile collapses to one stage at a time with a stage selector and
horizontal card scrolling; it never relies on drag-only movement. Loading
uses column/card skeletons; empty uses an explanation and create action;
error offers retry; forbidden explains missing scope; conflict identifies a
stale move and offers refresh/keep-local; offline marks queued moves;
pending shows sync status; success uses an inline confirmation and updated
stage history.

### C. Opportunity card

Cards show opportunity name, account/contact, amount, health indicator,
owner, next action and stage. The overflow menu exposes view, edit, move and
shared Activity/Tasks actions according to permission. Keyboard users access
the same menu and a “Move to stage” command; drag/drop is an enhancement.
Status badges use existing semantic primitives and never rely on color alone.

### T. Table

The table reuses Rivera table, sort, filter, pagination/cursor and column
visibility primitives. Desktop exposes all useful columns; mobile switches
to a compact identity/amount/stage row with a details drawer. Row actions
remain reachable from keyboard and touch. Loading, empty, error, forbidden,
conflict, offline, pending and success follow the matrix.

### D. Opportunity detail

Detail uses a Rivera header with back navigation, status/amount summary,
stage history, relations and shared Activity/Notes/Tasks tabs. Desktop uses
two columns; mobile stacks summary then tabs and opens secondary actions in a
drawer. Forbidden detail never leaks record data. Conflict and offline
states identify freshness and preserve safe local intent.

### F. Manual creation

Creation is a Rivera drawer on desktop and full-screen sheet on mobile.
Fields are grouped into identity, account/contact, value, stage and next
action. `Select`/`Command`, `Calendar`, validation, idempotency and
permission messaging use existing primitives. Pending submission disables
duplicate action while remaining cancellable; success links to detail;
offline queues only when policy allows; error preserves entered values.

## Responsive and accessibility contract

| Breakpoint | Layout | Interaction |
|---|---|---|
| Desktop ≥1024px | Multi-column Kanban; two-column detail; table columns; drawer create | Pointer and keyboard; drag is optional |
| Mobile <768px | One stage at a time; stacked detail; compact table; full-screen create | Touch targets ≥44px, command/menu alternatives, no hover-only affordance |
| Intermediate 768–1023px | Scrollable columns; single detail column; condensed table | Preserve focus order and visible overflow controls |

All interactive elements have visible focus, accessible names and semantic
roles. Announce stage moves, pending/success/error/conflict changes in a
polite live region. Preserve keyboard order, offer a non-drag move command,
meet contrast requirements, support reduced motion and avoid color-only
meaning. Dialogs/drawers trap and restore focus. Labels and dates are
localizable and layouts tolerate RTL.

## Reuse mapping

| Pipeline need | Reuse mapping | Decision |
|---|---|---|
| Shell, cards, badges, buttons, alerts | Current Rivera template and LoopDev primitives | REUSE |
| Filters and stage selection | `Select`/`Command` + `Popover` | REUSE |
| Detail/create surfaces | Existing `Sheet`/drawer and `Dialog` patterns | REUSE |
| Table and responsive rows | Shared table primitives and existing CRM table patterns | REUSE |
| Activity, Notes, Tasks, Relations | Shared Platform contracts/surfaces | REUSE |
| Move interaction | Existing accessible menu/command; drag only enhancement | MODULE-SPECIFIC composition |

### Zone reuse matrix

| Zone | Classification | Primitive/contract | Owner | Rationale |
|---|---|---|---|---|
| App shell, breadcrumbs, page header | shared | Rivera shell template | Platform | Preserve suite navigation and density |
| Filters, search and stage selector | primitive | `Input`, `Select`/`Command`, `Popover` | Platform UI | Existing keyboard and responsive behavior |
| Kanban columns and opportunity card composition | CRM | CRM card/status patterns | CRM | Domain-specific stage, amount and health hierarchy |
| Card actions and move command | primitive + CRM | `Button`, menu, command, live region | Shared UI + CRM | Reuse mechanics; Pipeline owns command semantics |
| Activity, Notes, Tasks, Relations tabs | shared | Platform contracts and surfaces | Platform | Avoid duplicate collaboration surfaces |
| Table rows, sorting and cursor controls | shared + CRM | shared `Table`; CRM column schema | Platform + CRM | Shared behavior, Pipeline-owned fields |
| Detail summary and stage history | CRM | CRM detail pattern; shared Activity | CRM | Domain lifecycle is module-specific |
| Create drawer/sheet and form controls | shared + CRM | `Sheet`, `Input`, `Select`, `Calendar`, validation | Platform + CRM | Shared interaction, Pipeline schema |
| Loading/empty/error/forbidden states | shared | Skeleton, Alert, Empty and permission primitives | Platform | Consistent recovery and non-color cues |
| Conflict/offline/pending indicators | EXTEND_PLATFORM (decision pending) | Existing sync/status contract if available | Platform | Must not invent a local sync language |
| Pipeline move and health presentation | MODULE_SPECIFIC | CRM domain/status composition | CRM | No new base primitive proposed |

## Open visual decisions

| ID | Decision | Proposed default | Impact | Approval needed |
|---|---|---|---|---|
| VD-PIPE-001 | Exact mobile stage navigation (tabs vs selector) | Compact `Select`/`Command` above the active column | Changes mobile board navigation | Product/visual approval |
| VD-PIPE-002 | Health indicator thresholds and labels | Reuse CRM health vocabulary; expose tooltip and text | Card/detail/table consistency | Product/domain approval |
| VD-PIPE-003 | Conflict presentation (inline card vs dialog) | Inline alert with review dialog only for destructive overwrite | Recovery and focus behavior | Sync/visual approval |
| VD-PIPE-004 | Offline queue affordance placement | Persistent page status plus per-item pending badge | Trust and discoverability | Product/visual approval |
| VD-PIPE-005 | Detail secondary tabs on mobile | Horizontal scroll tabs with accessible overflow menu | Navigation density | Product/visual approval |

## Approval evidence

Approval remains **pending**. Reviewer must inspect this Markdown source,
`view-state-matrix.md`, both structural SVGs, both styled SVGs, the baseline
inventory, zone reuse matrix and open-decision tables, then record approver,
date, decision and comments in
`runs/MOD-CRM-PIPELINE-20260913-002/01-visual-design.json`.

## Two-level validation

### Conceptual approval (required before implementation)

Status: **PENDING**. Review must confirm the baseline inventory, hierarchy,
realistic data, desktop/mobile compositions, non-color state cues,
accessibility, zone classifications and open decisions. This is the approval
recorded by the visual-design gate.

### Runtime comparison (required after implementation)

Status: **NOT_RUN**. After build, capture the canonical Pipeline route at the
approved desktop/mobile viewports and compare screenshots or visual diffs to
the approved styled SVG intent. Record route, viewport, artifact links,
deviations and reviewer decision in the later verify checkpoint. Runtime
comparison cannot be claimed from these static artifacts.
