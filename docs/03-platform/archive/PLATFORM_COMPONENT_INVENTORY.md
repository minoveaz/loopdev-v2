# Platform component inventory

This document is the reference for reusable Platform capabilities. Before adding a
component, hook, adapter or contract, check this inventory and extend an existing
primitive when the behavior belongs to Platform.

## Rules

- Reuse Platform components through their public `index.ts` exports.
- Keep business-specific orchestration in the consuming suite; do not add CRM,
  Marketing or Content decisions to generic Platform components.
- Use `EntityRef` and `EntityScope` for relationships and tenant boundaries.
- Use the adapter boundary for persistence. Components must not write localStorage,
  IndexedDB or provider SDKs directly.
- Preserve legacy contracts while migrating consumers.
- Add or update focused tests when extending a public component or adapter.

## Shared Platform components

| Capability | Public component | Location | Use |
|---|---|---|---|
| Tasks | `PlatformTaskForm`, `PlatformTaskList`, `PlatformTaskWorkspace` | `src/loopdev/components/platform/TaskWorkspace.tsx` | Create, edit and list actionable work |
| Notes | `PlatformNotesPanel` | `src/loopdev/components/platform/NotesPanel.tsx` | Contextual notes with visibility and editing |
| Attachments | `PlatformAttachmentsPanel` | `src/loopdev/components/platform/AttachmentsPanel.tsx` | Legacy-compatible attachment surface |
| Activity | `PlatformActivityFeed` | `src/loopdev/components/platform/ActivityFeed.tsx` | Functional activity events |
| Timeline | `PlatformTimeline` | `src/loopdev/components/platform/Timeline.tsx` | Ordered contextual read model |
| Notifications | `PlatformNotificationFeed` | `src/loopdev/components/platform/NotificationFeed.tsx` | In-app notification inbox |
| Relations | `PlatformRelationsPanel` | `src/loopdev/components/platform/RelationsPanel.tsx` | Related records and relation actions |

## Files Platform primitives

| Primitive | Location | Use |
|---|---|---|
| `FilesDropzone` | `src/loopdev/components/files/FilesDropzone.tsx` | Drag/drop, browse, paste, validation and queue |
| `FilePicker` | `src/loopdev/components/files/FilePicker.tsx` | Public picker wrapper |
| `UploadQueue`, `UploadItem` | `src/loopdev/components/files/UploadQueue.tsx`, `UploadItem.tsx` | Queue rendering and item states |
| `FilePreview`, `FilePreviewDialog` | `src/loopdev/components/files/` | Local image/PDF and metadata preview |
| `FileList` | `src/loopdev/components/files/FileList.tsx` | Search, category filter, sorting, list/grid and actions |
| `FileCategoryTabs` | `src/loopdev/components/files/FileCategoryTabs.tsx` | Category navigation |
| `RelatedFilesPanel` | `src/loopdev/components/files/RelatedFilesPanel.tsx` | Files attached to any `FileRelation` |

## Contracts and persistence

- Core types: `src/loopdev/domains/platform/types.ts`.
- Work contracts and local adapter: `src/loopdev/domains/platform/adapter/work.ts`.
- Work hooks: `src/loopdev/domains/platform/hooks/use-platform-work.ts`.
- Entitlements: `src/loopdev/domains/platform/entitlements/`.
- Files contracts: `src/loopdev/domains/files/types.ts`.
- Files adapter and local lifecycle: `src/loopdev/domains/files/adapter/local.ts`.
- Files hook: `src/loopdev/domains/files/hooks/use-files.ts`.
- Local preview persistence: `src/loopdev/domains/files/data/localPreviewStore.ts`.
- Audit and retention events: `src/loopdev/domains/files/data/localFileEvents.ts`.
- Future suite contexts: `src/loopdev/domains/files/futureConsumers.ts`.
- Backend mapping boundary: `docs/03-platform/backend/FILES_BACKEND_MAPPING.md`.

## Which primitive to choose

- A file selected by a user: `FilePicker`.
- A full upload surface: `FilesDropzone` plus `UploadQueue`.
- A persisted relation to any entity: `RelatedFilesPanel`.
- A read-only library: `FileList`.
- A one-off document preview: `FilePreviewDialog`.
- A task or note: `PlatformTaskForm` / `PlatformNotesPanel`; do not create a
  suite-specific duplicate.
- A new business domain: add an adapter relation and compose existing primitives.

## Future suites

Marketing Studio, Content Studio and Document Intelligence should consume
`FilesAdapter` and `RelatedFilesPanel` using `futureConsumers.ts`. Their own
components may provide suite-specific metadata or layouts, but upload, preview,
versioning, cleanup and provider integration remain Files Platform concerns.

## Change checklist

Before merging a new Platform capability:

1. Search this inventory and the public barrel exports.
2. Confirm the behavior is reusable across at least two consumers.
3. Add a typed contract and adapter method before adding UI state.
4. Preserve `EntityScope`, permissions and legacy mappings.
5. Add focused tests and update this inventory when the public surface changes.
