# Platform Notes Visual Design

## Document control

| Field | Value |
|---|---|
| Module | Notes |
| Run ID | MOD-NOTES-20260914-001 |
| Phase | 01-visual-design |
| Status | revised; awaiting visual approval |
| Baseline | Rivera / LoopDev shared primitives |

## Visual intent

Notes is a quiet, scan-first CRM work surface. The design keeps the contact context visible, makes note ownership and visibility legible, and gives create/edit actions equal semantic meaning on desktop and mobile without copying the desktop drawer into mobile.

## Rivera baseline inventory

| Concern | Current source evidence | Decision |
|---|---|---|
| Page composition | `src/components/common/PageContainer.tsx`, `PageHeader.tsx` | Reuse existing contact detail composition; no new shell |
| Surface and border | `src/components/common/SurfaceCard.tsx`, `SurfaceCardHeader`, current Customer 360 runtime | Use a structured Rivera surface: header hierarchy, compact radius, restrained border and dense CRM spacing |
| Data states | `EmptyState`, `LoadingState`, `LoadingSkeleton` | Reuse state semantics; status is not conveyed by color alone |
| Desktop editor | `src/components/common/NoteEditorDrawer.tsx`, `AppDrawer` | **Frozen for this delivery. Do not change its layout, behavior or TipTap implementation.** NotesPort integration must wrap the existing callbacks only. |
| Actions | `AdaptiveContextMenu`, `ConfirmDialog` | The visible `...` affordance opens `Edit note`, `Copy link` and `Delete note`; destructive action is separated and labelled |
| Typography/theme | Rivera theme and `src/index.css` | Inherit current tokens; no parallel font or color system |
| Mobile shell | `apps/mobile` native primitives and current Customer 360 screen | Build a mobile-owned list/editor composition with shared labels and operation IDs |

## View and breakpoint decisions

### Desktop web

- At `>= 1200px`, Notes is a two-column region inside Customer 360: note list in the primary column and contact context/actions in the secondary column.
- At `768px-1199px`, the list remains primary and the editor opens as the existing adaptive drawer.
- Below `768px`, the desktop web layout stacks list and context; touch targets remain at least 44px.
- **No desktop UI change is in scope.** The current `NoteEditorDrawer` remains the source behavior: Quick note and Rich note tabs, visibility selector, optional title, relation context, TipTap toolbar, mentions, links, lists, checklist, alignment, highlight, attachments, delete, cancel and save.
- The adapter/contract work may connect the existing callbacks to `NotesPort`, but must preserve the current drawer composition and user behavior. Any required desktop behavior change is a scope change requiring approval.

### Mobile web / Expo Web

- At `< 768px`, Notes is a full-width section in Customer 360 with a compact header, relation label, visibility badge and one primary create action.
- Tapping a note opens the mobile-owned editor screen/sheet. It does not import `NoteEditorDrawer`, `PlatformNotesPanel` or any `src/` desktop runtime.
- The mobile list preserves contact identity, supports native back behavior and keeps destructive actions behind a confirmation affordance.
- Note cards use a Rivera-style structured surface: title and action affordance in the first row, preview content in the body, and author/visibility/updated metadata in the footer. The action affordance is represented with its open options in `wireframes/notes-mobile-create-states.svg`.
- Offline and pending states are inline, persistent and text-labelled; conflict state offers reload/keep-local decision without implying server success.

### Mobile create/edit flow

The mobile editor is a dedicated full-screen or bottom-sheet composition. It is not a copy of `NoteEditorDrawer`, but it preserves the same semantic capability:

1. Tap `Create new note` or a note row action.
2. Show the relation header (`Related to Jordan Davis`), optional title field and a segmented `Quick note` / `Rich note` control.
3. `Quick note` presents a focused multiline text field with visibility, attachment and save actions.
4. `Rich note` presents a mobile TipTap-compatible editing surface. Formatting actions are available through a horizontally scrollable toolbar or a secondary formatting sheet: heading/text style, bold, italic, underline, bullet/numbered list, checklist, quote, alignment, highlight, link, mention and undo/redo. The mobile renderer may group actions for touch ergonomics, but must preserve the same operation IDs and content meaning.
5. Visibility remains `private`, `team` or `organization`; the Contact relation remains explicit.
6. Save reports `success`, `pending`, `conflict`, `forbidden` or `error` using the shared NotesPort result, and never silently falls back to local success.

The mobile implementation must not import `NoteEditorDrawer`, `RichNoteEditor`, `NoteComposer`, `AppDrawer` or any desktop runtime from `src/`.

### iOS and Android

Planned. The same shared semantics and copy keys apply; native renderer details remain a follow-up with Platform as owner.

## View compositions

| View | Desktop | Mobile web | Native note |
|---|---|---|---|
| Contact Notes list | Dense panel with title, count, filters, rows and contextual menu | Full-width list with compact rows and touch actions | Planned native list |
| Note editor | **Frozen existing Rivera drawer/editor**; adapter wiring only | Dedicated mobile editor with Quick/Rich selector, TipTap-compatible rich mode, title/content/visibility/relation, attachment and save state | Planned native editor |
| Empty/forbidden/error | Inline state in panel with primary recovery action | Full-width state with contact context and recovery action | Shared semantics |
| Conflict/offline | Banner plus row/editor status | Inline status block and explicit retry/resolve action | Shared semantics |

## Zone reuse matrix

| Zone | Classification | Primitive/contract | Owner | Rationale/evidence |
|---|---|---|---|---|
| Customer 360 heading and contact context | CRM | Existing Customer 360 page | CRM/Platform | Preserve route and entity context |
| Notes list surface | shared | `SurfaceCard`, loading/empty states | Platform | Reusable capability surface |
| Desktop editor | shared | `NoteEditorDrawer`, `NoteComposer` | Platform | Existing Rivera implementation; adapter boundary required |
| Desktop contextual actions | primitive | `AdaptiveContextMenu`, `ConfirmDialog` | Platform | Consistent destructive interaction |
| Mobile Notes list | MODULE_SPECIFIC | React Native `View`, `Pressable`, `ScrollView` | Platform mobile | Layout and touch ergonomics are platform-specific |
| Mobile Notes editor | MODULE_SPECIFIC | Mobile form primitives | Platform mobile | Must not copy/import desktop drawer |
| Visibility/status indicators | shared | NotesPort labels and state IDs | Platform | Meaning comes from contract, not color |
| Relation/deep link | shared | `EntityRef` / Contact route | Platform + CRM | Same entity meaning on every client |

## State treatment

Every renderer supports loading, empty, error, forbidden, conflict, offline, pending and success. Each state has a text label and an action or recovery path; color is supplementary only. Delete requires confirmation and reports the resulting state through the shared operation outcome.

## Accessibility and internationalization

- Keyboard focus enters and returns from the desktop editor/dialog; Escape closes without losing unsaved content.
- Mobile touch targets are at least 44px, use native back behavior and preserve safe-area insets.
- Note visibility and sync states have text labels, accessible names and icons; no state relies on color alone.
- Form errors are associated with fields; save/delete status is announced through an accessible live region.
- Lists expose note title, author, visibility, updated date and relation as a coherent accessible name.
- Labels and copy use shared i18n keys; layouts must support RTL ordering without changing operation meaning.

## Wireframe evidence

- Desktop composition: `wireframes/notes-desktop.svg`
- Mobile composition: `wireframes/notes-mobile.svg`
- Mobile note card: `wireframes/notes-mobile-card.svg`
- Mobile action menu and creation states: `wireframes/notes-mobile-create-states.svg`

The SVGs are low-fidelity review evidence for this source. They are not production components.

## Approval and post-implementation validation

Conceptual approval covers hierarchy, states, responsive behavior, accessibility and reuse decisions in this document. After build, runtime screenshots on the desktop and mobile routes must be compared against these compositions and recorded separately in the platform evidence matrix.

## Open visual decisions

| ID | Decision | Default | Owner | Approval needed |
|---|---|---|---|---|
| VIS-001 | Rich editor content model on mobile | Plain text-compatible contract first; rich formatting may adapt on desktop | Product + Platform | Visual/design gate |
| VIS-002 | Offline write affordance | Show explicit pending state and retry/resolve action | Product + Platform | Visual/design gate |
| VIS-003 | Desktop preservation | Freeze current `NoteEditorDrawer`; only adapter callbacks may change | Platform | Explicit scope confirmation |
| VIS-004 | Mobile rich editor | Provide TipTap-compatible Quick/Rich flow with grouped touch toolbar | Platform | Visual/design gate |
