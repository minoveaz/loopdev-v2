---
title: CRM and Communications frontend closure matrix
status: current
owner: loopdev-v2
updated: 2026-09-12
source_of_truth: tracks/active/crm/2026-09-09-loopdev-v2-crm-frontend.md
---

# Matriz única de cierre frontend CRM y Communications

Esta matriz es el resumen operativo del estado frontend actual. Usa tres estados:

- **Completado local:** existe una experiencia funcional en v2 respaldada por contratos,
  hooks/adapters locales y evidencia de tests o validación.
- **Parcial frontend:** existe una primera experiencia, pero falta una parte explícita del
  alcance visual o funcional local.
- **Pendiente backend:** la composición frontend local está preparada, pero la capacidad real
  requiere Supabase, RLS, Realtime, providers, workers o autorización server-side.

La fuente detallada por fases es `tracks/active/crm/2026-09-09-loopdev-v2-crm-frontend.md`.

## CRM

| Superficie o capacidad | Estado | Evidencia principal | Pendiente |
| --- | --- | --- | --- |
| Overview | Completado local | `src/loopdev/pages/crm/Overview.tsx` | Datos remotos y métricas autorizadas |
| Contacts | Completado local | `Contacts.tsx`, `domains/crm`, tests de contacts | Supabase, RLS y búsqueda remota |
| Customer 360 inicial | Completado local | `Customer360.tsx`, `CRMWorkspacePanel.tsx` | Ninguno para el alcance inicial |
| Customer 360 enriquecido | Parcial frontend | Contact detail y paneles Platform reutilizables | Relaciones y read models completos |
| Leads | Completado local | `Leads.tsx`, captura, detalle y conversión local | Persistencia y permisos server-side |
| Pipeline | Completado local | `Pipeline.tsx`, adapter y tests | Stages configurables remotos |
| Opportunities | Completado local | `Opportunities.tsx`, líneas, catálogo y drawer | Price books y persistencia remota |
| Tasks | Completado local | `/app/sales-crm/tasks`, `TaskWorkspace.tsx` | Backend de trabajo compartido |
| Notes, Activities y Timeline | Completado local | `domains/platform`, paneles y read model local | Auditoría y persistencia remota |
| Attachments | Completado local | Adapter y referencias Platform | Storage real |
| Files Platform 8H | Parcial frontend | `domains/files`, primitives globales, Customer 360, Communications, Notes, Tasks, Leads y Opportunities | Biblioteca completa, rollback exhaustivo, Storage/signed URLs, RLS, antivirus, cuotas y workers |
| Notifications | Completado local | Inbox in-app local | Email, push y canales externos |
| Operations | Completado local | `pages/crm/Operations.tsx` | Búsqueda global y persistencia remota |
| Tags y saved views | Completado local | Operaciones y contratos locales | Persistencia multi-tenant |
| Custom Fields | Parcial frontend | Contratos, validación y operaciones locales | Integración de valores en formularios y detalles |
| Import/export y bulk actions | Completado local | Operaciones locales con validación | Jobs remotos y permisos server-side |
| Automations y entitlements | Completado local | `pages/crm/Automations.tsx`, adapters y tests | Billing, workers y ejecución remota |
| Formularios globales y superficies responsive | Parcial frontend | `LOOPDEV_GLOBAL_FORMS_PHASE.md`, `useFormLifecycle`, `AppDrawer`, `FormSectionHeader` y rollout CRM/Platform | Completar rollout en Settings/Communications y ampliar cobertura de tests |
| Comments y Mentions | Parcial frontend | Contrato reservado, sin UI aprobada | Validar necesidad y diseñar UX |
| Búsqueda global | Pendiente backend | Búsquedas locales por dominio | Índice autorizado y persistencia remota |

## Communications

| Superficie o capacidad | Estado | Evidencia principal | Pendiente |
| --- | --- | --- | --- |
| Inbox y Channel Rail | Completado local | `pages/crm/Communications.tsx` | Canales y cuentas reales |
| Conversation thread | Completado local | Thread, estados y fixtures multi-día | Delivery real |
| Customer reply composer | Completado local | Composer y adapter local | Provider, templates y policy server-side |
| Conversation Operations | Completado local | `ConversationOperationsPanel.tsx` | Realtime, autorización y persistencia |
| CRM Context | Completado local | `CRMWorkspacePanel.tsx` | Read models remotos |
| Conversation Timeline | Completado local | Rail, explorer, categorías y búsqueda | Eventos server-side |
| Colaboración multiagente | Completado local | Presence, drafting, locks, takeover y audit local | Realtime, RLS y validación backend |
| Mobile Inbox | Completado local | Sheet/back navigation responsive | Persistencia y providers |
| Communications settings | Completado local | `pages/settings/Communications.tsx` | Account onboarding y conexión real |
| Email y canales futuros | Parcial frontend | Capabilities y estados `coming_soon` | Provider adapters y políticas por canal |
| WhatsApp operativo real | Pendiente backend | Contratos y fixtures locales | Meta, webhooks, workers y delivery |
| Supabase Communications Core | Pendiente backend | Handoffs y contratos de integración | Migrations, RLS, Realtime y secrets |
| Copilot AI | Pendiente de producto | `ConversationContext` preparado | Diseño e implementación posterior |

## Criterio de cierre

CRM y Communications están cerrados como frontend local-first cuando todas las filas
`Completado local` permanecen respaldadas por adapters y tests. Las filas `Parcial frontend`
son el backlog visual explícito. Las filas `Pendiente backend` no deben reabrir páginas ni
duplicar lógica: deben resolverse sustituyendo adapters y conectando las fronteras existentes.
