---
title: LoopDev action and semantic color protocol
status: active-foundation
owner: platform
---

# LoopDev Action Protocol

This is the platform-wide rule for actions across LoopDev web and mobile. CRM,
ERP, communications, documents, tasks, settings and account surfaces reuse the
same semantic action language.

## Language standard

Every user-facing action uses an i18n key, never a hardcoded English or Spanish
label. English and Spanish share the same key and intent:

| Key | English | Spanish |
| --- | --- | --- |
| `common.actions.back` | Back | Volver |
| `common.actions.create` | Create | Crear |
| `common.actions.save` | Save | Guardar |
| `common.actions.apply` | Apply | Aplicar |
| `common.actions.edit` | Edit | Editar |
| `common.actions.assign` | Assign | Asignar |
| `common.actions.archive` | Archive | Archivar |
| `common.actions.restore` | Restore | Restaurar |
| `common.actions.deletePermanently` | Delete permanently | Eliminar definitivamente |
| `common.actions.retry` | Try again | Intentar de nuevo |
| `common.actions.refresh` | Refresh | Actualizar |
| `common.actions.clearSelection` | Clear selection | Limpiar selección |
| `common.actions.selectAll` | Select all | Seleccionar todo |
| `common.actions.copy` | Copy | Copiar |
| `common.actions.export` | Export | Exportar |
| `common.actions.download` | Download | Descargar |
| `common.actions.undo` | Undo | Deshacer |

Translations must preserve intent, not translate word-for-word when that would
change the command meaning. Module-specific nouns may be appended through
parameters, for example `{{count}} selected` / `{{count}} seleccionados`.

## Intent matrix

| Intent | Typical commands | Web primitive | Mobile primitive | Visual treatment | Confirmation |
| --- | --- | --- | --- | --- | --- |
| Create | New, add, invite | `Button` `default` | `MobileButton` `primary` | Primary | No |
| Save / Apply | Save, publish, apply filters | `Button` `default` | `MobileButton` `primary` | Primary | No; show pending/committed state |
| View / Navigate | Open, view details, inspect | link, `Button` `ghost`/`outline` | `MobileButton` `ghost` | Neutral | No |
| Edit | Edit, configure, rename | `Button` `outline`/`ghost` + `Pencil` | outline + edit icon | Neutral | No |
| Assign / Change state | Assign, approve, mark done | outline, menu item or segmented control | outline, action sheet or segmented control | Neutral/info | No unless consequential |
| Archive / Deactivate | Archive, suspend, deactivate | outline or contextual menu + archive icon | outline or action sheet | Neutral; never destructive red | Yes when visibility/access changes |
| Restore / Reactivate | Restore, reactivate | outline/secondary + restore icon | outline/action sheet | Neutral/success feedback | No or lightweight confirmation |
| Retry | Retry, reconnect, refresh | outline | outline | Neutral | No |
| Remove attachment/item | Remove a file, chip, checklist item | ghost/icon + clear label/tooltip | icon/text action | Neutral unless irreversible | Confirm if data is permanently lost |
| Delete permanently | Delete account, purge, destroy | `Button` `destructive` or destructive menu item | destructive action-sheet item | Semantic destructive red | Always; explain permanence |
| Cancel / Close | Cancel, close drawer/dialog | outline/ghost | outline/ghost | Neutral | Only when dirty |

## Navigation and utility actions

These actions do not mutate business data and must never use destructive red:

| Intent | Examples | Default treatment | Confirmation |
| --- | --- | --- | --- |
| Back / Return | Back to list, close detail, previous step | `ArrowLeft` icon plus text link/button; mobile back link | Only when dirty |
| Forward / Continue | Next step, continue workflow | Primary only when it is the main step action; otherwise outline | No |
| Home / Breadcrumb | Go to dashboard or parent section | Link or breadcrumb | No |
| Switch context | Organization, workspace, view, tab | Select, menu, tabs or segmented control | No; show reload/purge feedback when needed |
| Refresh / Retry | Reload data, reconnect | Icon button with tooltip or outline button with `RefreshCw` | No |
| Search / Filter / Sort | Query, filter, sort, saved view | Search input, menu, filter control or table header | No |
| Select / Clear selection | Select row, select all, clear | Checkbox, radio, clear action | No |
| Expand / Collapse | Sections, rows, advanced fields | Chevron/disclosure control | No |
| Copy | Copy ID, email or link | Copy icon button with tooltip and success toast | No |
| Export / Download | CSV, report, file | Outline button/menu item with download icon | Only for expensive or sensitive exports |
| Undo / Restore | Undo archive, restore previous value | Secondary/outline action, often in a toast | No when reversible |
| Help / Info | Explain field, state or permission | Info icon, tooltip or help link | No |

Back is a navigation action. It may trigger a dirty-form confirmation, but it
must never be styled or implemented as delete or archive.

## Color rules

- `destructive` red means irreversible loss or security-sensitive removal only.
- `warning` amber means risk, incomplete state, or a consequential but
  reversible decision; it is not a delete substitute.
- `primary` means the main positive command for the current surface, not an
  approval of the data itself.
- `neutral` means navigation, editing, assignment, filtering, archiving or
  restore.
- `success` is for committed state and status feedback, not for action buttons
  that have not completed.
- Meaning must never rely on color alone. Pair color with text, icon, status
  copy and an accessible name.
- Use semantic design tokens and shared primitives; do not add local hex/RGB
  action colors.

## Confirmation and persistence rules

- Use shared `ConfirmDialog` on web and `MobileConfirmDialog` or an action sheet
  on mobile.
- Every confirmation states what changes, whether it is reversible, and what
  is retained.
- Archive/deactivate actions must use an archive/status field or lifecycle
  operation. They must not issue a physical `DELETE` request.
- Permanent delete must be explicit in the backend contract, authorization,
  audit trail and UI copy. It is never the default row action.
- Bulk actions appear only after selection, show the selected count, and use
  the same intent/variant as the equivalent single-record action.
- Pending actions disable the control and show progress. On failure, preserve
  the current view and show an error; never fabricate a success locally.

## Additional standardization dimensions

### 1. Authorization

The action must be resolved from capability/permission state, not merely hidden
because the current screen does not expect it. Use the same states everywhere:

- unavailable: do not render the action when the capability is not applicable;
- forbidden: render disabled/read-only state with an explanation when useful;
- available: render the normal action;
- pending: disable the action and show progress;
- conflict: preserve the user's data and offer reload/resolve choices.

### 2. Lifecycle semantics

The UI label, backend mutation, audit event and success message must describe
the same lifecycle transition. In particular, `Archive` must never call a
physical delete endpoint, and `Delete permanently` must never be implemented as
an archive disguised by red styling.

### 3. Accessibility

Every action needs an accessible name, visible keyboard focus, a minimum 44px
touch target on mobile, and a tooltip for unfamiliar icon-only controls. Dialogs
must announce their title and consequence, trap focus, support Escape, and
restore focus to the invoking control.

### 4. Responsive behavior

Desktop row actions may use an overflow menu; mobile should use an action sheet
or bottom sheet. The intent, wording, confirmation and result must remain the
same. Do not simply hide critical actions because the viewport is narrow.

### 5. Localization and formatting

Use the same i18n key in every language. Standardize plural forms, gendered
phrasing, capitalization, punctuation, date formats, number formats and action
parameter order. Never concatenate translated fragments in code when a full
localized message with interpolation is possible.

### 6. Data and audit behavior

Every mutation needs a server response, idempotency strategy where retries are
possible, optimistic-concurrency behavior where records can change, and an
audit event for consequential actions. Toasts are feedback, not persistence.

### 7. Offline and retry behavior

Each action must declare whether it is offline-capable, queued, retryable or
online-only. A failed request must not create a fake local success or duplicate
the mutation on retry.

### 8. Testing and evidence

Each shared action pattern should have coverage for desktop and mobile, English
and Spanish, keyboard and touch interaction, permission denial, loading,
success, conflict and network failure. Screenshots or focused interaction tests
should verify the visible result.

### 9. Telemetry and supportability

Consequential actions should carry a stable action key in logs/audit events,
without logging secrets or unnecessary personal data. User-facing errors should
include a traceable operation context while remaining localized.

## Accessibility and responsive rules

- Icon-only actions require an accessible label and a desktop tooltip.
- Destructive and archive actions require keyboard focus, visible focus rings,
  and touch targets of at least 44px on mobile.
- Dialogs and drawers must restore focus to the invoking control.
- Confirmation must be available without hover and must work with keyboard,
  screen readers and reduced-motion settings.

## Review checklist

Before shipping any LoopDev action:

1. Map it to one intent in this matrix.
2. Reuse the shared primitive and semantic token.
3. Confirm the backend mutation matches the visual meaning.
4. Cover pending, success, forbidden, conflict, error and offline states where
   applicable.
5. Verify keyboard, screen-reader, contrast and mobile touch behavior.