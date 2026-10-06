---
title: CRM action and semantic color protocol
status: active-foundation
owner: crm-platform
---

# CRM Actions Protocol

The platform-wide source of truth is
[LOOPDEV_ACTIONS_PROTOCOL.md](../../03-platform/frontend/LOOPDEV_ACTIONS_PROTOCOL.md).
This document applies that policy to CRM entities and adds CRM-specific
lifecycle defaults.

All CRM actions use semantic intent, not ad hoc colors. The same action must
look and behave the same on desktop and mobile.

## Action matrix

| Intent | Examples | Desktop primitive | Mobile primitive | Color/variant | Confirmation |
| --- | --- | --- | --- | --- | --- |
| Create | New contact, new lead | `Button` `default` | `MobileButton` `primary` | Primary | No, unless the form is dirty on close |
| Save/Apply | Save contact, update lead | `Button` `default` | `MobileButton` `primary` | Primary | No; show pending and committed feedback |
| Navigate/View | View 360, open detail | `Button` `outline`/`ghost`, links | `MobileButton` `ghost` | Neutral | No |
| Edit | Edit contact, edit lead | `Button` `outline` or `ghost` with `Pencil` | `MobileButton` `outline` with edit icon | Neutral | No |
| Assign/Change state | Assign owner, mark contacted | `Button` `outline` or menu item | `MobileButton` `outline` or action sheet | Neutral/info | No |
| Archive | Archive contact/lead, bulk archive | `Button` `outline` or contextual menu item | `MobileButton` `outline` or action sheet | Neutral; use archive icon | Yes, because it changes visibility |
| Delete permanently | Only where explicitly supported | `Button` `destructive` or destructive menu item | Destructive action-sheet item | Destructive red | Always; explain permanence |
| Cancel/Close | Cancel form, close drawer | `Button` `outline`/`ghost` | `MobileButton` `outline`/`ghost` | Neutral | Only when dirty |
| Retry | Retry load, reconnect | `Button` `outline` | `MobileButton` `outline` | Neutral | No |

## Non-negotiable rules

- Red/destructive styling is reserved for irreversible deletion, not archive,
  edit, assign, or status changes.
- Archive is reversible in the data model and uses `archived_at`; it should not
  use a red trash button or a physical `DELETE` request.
- Every destructive or consequential action uses the shared `ConfirmDialog`
  on desktop or `MobileConfirmDialog`/an action sheet on mobile.
- Icon-only actions use a familiar icon, an accessible label, and a tooltip on
  desktop. Text actions may include the icon when the command needs clarity.
- Bulk actions appear only after selection and use the same semantic intent as
  the row action. The toolbar must show the selected count.
- Pending actions disable the control and show a spinner. Successful actions
  update the local view from the server response; they do not fabricate a
  local record.
- Permission failures, conflicts, and network failures use the shared error
  state and must not be styled as success.
- The action meaning must not depend on color alone: include text, icon, or
  status copy.

## CRM-specific defaults

- Contacts: archive, never permanent delete from the primary UI.
- Leads: archive, never permanent delete; converted leads remain readable in
  history and cannot be archived by conversion as a side effect.
- Opportunities: close as won/lost; reopen requires a reason; permanent delete
  is not a primary action.
- Notes and timeline events: no permanent delete from timeline history unless
  a separate retention workflow authorizes it.

## Review checklist

Before shipping a CRM action, verify:

1. Its intent maps to exactly one row in the action matrix.
2. Desktop and mobile use the shared primitive for that intent.
3. The backend mutation matches the visual meaning (`archived_at` for archive,
   no physical deletion).
4. Confirmation, pending, success, forbidden, conflict, and error states are
   covered.
5. Keyboard focus, touch target size, accessible name, and contrast are tested.