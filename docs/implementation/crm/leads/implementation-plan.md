# Implementation Plan: CRM Leads

## 1. Objectives

1. Deliver high-speed lead qualification and triage across Desktop and Mobile.
2. Implement modern UX patterns (Kanban, Quick Preview Drawer, Speed-dial actions, Stage Steppers).
3. Ensure 100% type safety, i18n synchronization (EN/ES), and contract parity.

---

## 2. Deliverables by Platform

### 2.1 Mobile (`apps/mobile`)
- [x] `apps/mobile/adapters/crm.ts`: Expanded entity and CRUD + conversion logic.
- [x] `apps/mobile/components/MobileLeadsScreen.tsx`: List with KPIs, filter pills, speed-dial.
- [x] `apps/mobile/components/MobileLeadDetailScreen.tsx`: Stepper, BANT card, conversion modal.
- [x] `apps/mobile/components/MobileCreateLeadScreen.tsx`: Form with contact selector and BANT fields.
- [x] `apps/mobile/App.tsx`: Routing for `/app/sales-crm/leads`, `/app/sales-crm/leads/new`, and `/app/sales-crm/leads/:leadId`.

### 2.2 Desktop (`src/loopdev`)
- [x] `src/loopdev/components/crm/LeadKanbanBoard.tsx`: Stage board with column sums and heat scores.
- [x] `src/loopdev/components/crm/LeadQuickPreviewDrawer.tsx`: Slide-out preview drawer using `AppDrawer`.
- [x] `src/loopdev/pages/crm/Leads.tsx`: Table/Kanban view switcher, drawer hooks, heat score badges.
- [x] `src/loopdev/pages/crm/LeadDetail.tsx`: Fixed optional field typing.

### 2.3 Internationalization (`i18n`)
- [x] `src/i18n/locales/en.json` & `es.json`
- [x] `apps/mobile/i18n/locales/en.json` & `es.json`
