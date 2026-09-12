---
title: Platform work capabilities — Fase 4 local handoff
status: local-complete
updated: 2026-09-10
owner: loopdev-v2
---

# Handoff de Tasks, Notes, Activities, Timeline, Attachments y Notifications

## Alcance

La Fase 4 entrega una implementación frontend-first, local y reemplazable. CRM es el primer
consumidor, pero los contratos no dependen de CRM ni de la plantilla Rivera.

| Capacidad | Contrato | Estado local |
| --- | --- | --- |
| Tasks | `TaskRecord` | CRUD, filtros, lifecycle, assignment, version/conflict e idempotencia |
| Notes | `NoteRecord` | CRUD, visibilidad y permisos explícitos |
| Activities | `ActivityRecord` | Eventos funcionales con actor, origen y metadata |
| Timeline | `TimelineEvent` | Append-only, ordenado y deduplicado por `sourceType:sourceId` |
| Attachments | `AttachmentRecord` | Asociación `EntityRef`, metadatos y uploader visual |
| Notifications | `NotificationRecord` | Inbox local unread/read/archived y mark-as-read |

## Ubicación y API

- Contratos: `src/loopdev/domains/platform/types.ts`.
- Adapter: `src/loopdev/domains/platform/adapter/work.ts`.
- Implementación local: `src/loopdev/domains/platform/adapter/local.ts`.
- Stores: `src/loopdev/domains/platform/data/localWork.ts`.
- Hooks: `src/loopdev/domains/platform/hooks/use-platform-work.ts`.
- UI reutilizable: `src/loopdev/components/platform`.
- Workspace demostrable: `/app/sales-crm/tasks` y `/app/platform/workspace`.

El consumidor usa `platformWorkAdapter` o `platformAdapter.work`, nunca un store. Todas las
consultas reciben scope (o usan el contexto activo) y el adapter filtra por organización y
workspace antes de devolver registros. Las relaciones son `EntityRef`, por lo que no se importan
stores ni fixtures de CRM o Rivera.

## Estados y seguridad de presentación

Los componentes exponen loading, empty, error y forbidden. Las mutaciones usan `version` y
devuelven conflicto mediante `PlatformWorkAdapterError`; los hooks conservan el error para que
la UI pueda reintentar. Notes mantienen `visibility` y `permissions` en el read model. Timeline
no ofrece update/delete: una revisión crea un evento nuevo.

La separación de Activities y Audit Events es deliberada: Activities/Timeline son eventos
funcionales visibles; el audit log de seguridad, cumplimiento y cambios sensibles queda fuera
del store local y será una capacidad de backend.

## Integración CRM y Rivera

Customer 360 muestra `Customer360PlatformSection` para la relación Contact. El workspace muestra
referencias a Contact, Lead y Opportunity sin resolverlas desde Platform; la navegación continúa
en las rutas CRM actuales. Se reutilizan `src/components/common`, `src/components/ui` y
`AppDrawer`/primitives compartidos. No se copian páginas, features ni mocks de
`src/template/rivera`.

## Frontera Supabase pendiente

No se instalaron Supabase/Docker ni se crearon migraciones, RLS o Auth real. La implementación
futura debe mapear `scope.organizationId/workspaceId/brandId`, `EntityRef`, `version`,
`visibility`, `permissions` y `dedupeKey` a tablas, políticas y Storage sin cambiar las
composiciones de página.
