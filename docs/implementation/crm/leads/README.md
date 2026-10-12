# Leads Module Implementation Workspace

## References

- Product definition: `docs/06-product/crm/leads/`
- Product contract: [`CRM_LEAD_CONTRACT.md`](file:///Users/minoveaz/Documents/Proyectos/loopdev-v2/docs/06-product/crm/leads/CRM_LEAD_CONTRACT.md)
- UX spec: [`CRM_LEADS_UX_SPEC.md`](file:///Users/minoveaz/Documents/Proyectos/loopdev-v2/docs/06-product/crm/leads/CRM_LEADS_UX_SPEC.md)
- UI contract: [`CRM_LEADS_UI_CONTRACT.md`](file:///Users/minoveaz/Documents/Proyectos/loopdev-v2/docs/06-product/crm/leads/CRM_LEADS_UI_CONTRACT.md)
- Track: `tracks/active/platform/2026-09-13-loopdev-v2-multiplatform-foundation.md`
- Run ID: `MOD-LEADS-20260917-001`
- Multiplatform contract: `docs/03-platform/governance/MULTIPLATFORM_DELIVERY_CONTRACT.md`
- Platform scope: `platform-scope.md`
- Platform evidence: `platform-evidence-matrix.md`

## Current status

| Field | Value |
|---|---|
| Status | `UNVERIFIED` — historical run disposition |
| Recorded phase | `09-review` (`MOD-LEADS-20260917-001` remains `running`) |
| Branch | `feature/crm-v2-foundation` |
| Base branch | `develop` |
| Multiplatform scope | Desktop Web, Mobile Web, iOS, Android |

The historical manifest records verification and release approval, but the
current ledger is blocked on missing E4 journeys and the approval artifact
fingerprints do not match the current files. Do not treat that run as released;
start a fresh workflow v2 run after resolving its ledger blockers. See
[`DELIVERY_HISTORICAL_RUN_DISPOSITIONS.md`](../../../03-platform/governance/DELIVERY_HISTORICAL_RUN_DISPOSITIONS.md).

## Scope

### Platform scope

| Surface | Scope | Owner | Evidence |
|---|---|---|---|
| Desktop web | `required` | `src/loopdev/pages/crm/Leads.tsx`, `LeadKanbanBoard.tsx`, `LeadQuickPreviewDrawer.tsx` | Components implemented, 0 type errors |
| Mobile web | `required` | `apps/mobile/components/MobileLeadsScreen.tsx`, `MobileLeadDetailScreen.tsx`, `MobileCreateLeadScreen.tsx` | Components implemented, routes mounted |
| iOS | `required` | `apps/mobile/` (React Native / Expo) | Shared native screens & adapters |
| Android | `required` | `apps/mobile/` (React Native / Expo) | Shared native screens & adapters |

### Included

- Dual View Switcher (Table / Kanban) on Desktop
- Stage-based Kanban Board with heat score indicators and aggregate column metrics
- Quick Preview Drawer on row/card click (Attio / Folk pattern)
- Mobile Native Leads list with 1-tap speed-dial actions (Call, Email, WhatsApp, View)
- Mobile Lead Detail with interactive qualification stage stepper and Customer 360 link
- Commercial Opportunity conversion workflow
- Lead creation modal / screen with contact association and BANT qualification
- Sized i18n dictionaries in English and Spanish across Web and Mobile

### Excluded

- Bulk CSV automated lead enrichment (scheduled for subsequent automation cycle)
- In-line AI voice transcriber (separate AI assistant track)

## Phase index

| Phase | Skill | Status | Checkpoint |
|---|---|---|---|
| `00-discovery` | `module-discovery` | `completed` | `runs/MOD-LEADS-20260917-001/00-discovery.json` |
| `01-design` | `module-design` | `completed` | `runs/MOD-LEADS-20260917-001/01-design.json` |
| `01-visual-design` | `module-visual-design` | `completed` | `runs/MOD-LEADS-20260917-001/01-visual-design.json` |
| `02-domain` | `domain-model` | `completed` | `runs/MOD-LEADS-20260917-001/02-domain.json` |
| `03-access` | `access-design` | `completed` | `runs/MOD-LEADS-20260917-001/03-access.json` |
| `04-api` | `api-contracts` | `completed` | `runs/MOD-LEADS-20260917-001/04-api.json` |
| `05-sync` | `sync-design` | `completed` | `runs/MOD-LEADS-20260917-001/05-sync.json` |
| `06-plan` | `module-plan` | `completed` | `runs/MOD-LEADS-20260917-001/06-plan.json` |
| `07-build` | `module-build` | `completed` | `runs/MOD-LEADS-20260917-001/07-build.json` |
| `08-verify` | `module-verify` | `completed` | `runs/MOD-LEADS-20260917-001/08-verify.json` |
| `09-review` | `module-review` | `in_progress` | Pending final release review |
| `10-git` | `git-workflow` | `pending` | Pending user push request |
