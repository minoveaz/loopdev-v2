# Platform Notes View and State Matrix

| View/state | Desktop web | Mobile web | iOS | Android | Shared semantics | Recovery/action |
|---|---|---|---|---|---|---|
| Notes list loading | skeleton rows | compact skeleton rows | planned | planned | `loading` | wait/cancel navigation |
| Notes list empty | EmptyState with create action | inline empty copy with create button | planned | planned | `empty` | create note |
| Notes list success | dense rows, author, visibility, updated date, relation | touch rows with same metadata | planned | planned | `success` | open/edit |
| Create editor | **Existing unchanged `NoteEditorDrawer`** | mobile-owned editor screen/sheet with Quick/Rich selector, relation, title, visibility, attachment and save | planned | planned | `createNote` | save/cancel |
| Quick note mode | Existing desktop Quick note tab unchanged | multiline text field with touch-first actions | planned | planned | quick content semantics | save/cancel |
| Rich note mode | Existing desktop Rich note tab and TipTap toolbar unchanged | TipTap-compatible editor with grouped touch formatting sheet/toolbar, mentions, lists, checklist, links and undo/redo | planned | planned | rich content semantics | save/cancel |
| Update editor | **Existing unchanged drawer with expected version through adapter** | mobile editor with version token | planned | planned | `updateNote` | save/reload |
| Delete confirmation | ConfirmDialog/context action | native confirmation action | planned | planned | `deleteNote` | confirm/cancel |
| Permission forbidden | inline forbidden state | full-width forbidden state | planned | planned | `forbidden` | return to contact |
| Validation error | field-level message | field-level message | planned | planned | `validation-error` | correct fields |
| Network/server error | inline alert and retry | inline alert and retry | planned | planned | `error` | retry |
| Stale version conflict | editor conflict banner | explicit resolve/reload action | planned | planned | `conflict` | reload or keep local draft |
| Offline read | cached list with offline label | cached list with offline label | planned | planned | `offline` | reconnect |
| Offline write | pending row/banner | pending row/banner | planned | planned | `pending` | retry/cancel |
| Visibility change | shared select/control | mobile select/control | planned | planned | `applyVisibilityAndPermissions` | save/retry |
| Contact relation | relation chip/deep link | relation header/deep link | planned | planned | `relateToContact` | open Contact |

## Responsive decisions

- Desktop wide: `>= 1200px`, two-column Customer 360 composition.
- Desktop compact/tablet: `768px-1199px`, stacked content with adaptive editor drawer.
- Mobile web/Expo Web: `< 768px`, one-column touch-first list and editor.
- iOS/Android: planned, must preserve operation IDs and accessibility meaning.

## State evidence rule

A route, visible section, shared type or registered adapter does not prove an operation. Evidence must show the action, its result and its state on each required surface.
