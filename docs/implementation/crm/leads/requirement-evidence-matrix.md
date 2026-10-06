# Requirement Evidence Matrix: CRM Leads

| Requirement ID | Requirement Title | Classification | Target Files | Verification Evidence |
|---|---|---|---|---|
| `LEADS-REQ-LIST` | Lead List, Search & Filter | `REQUIRED_MVP` | `src/loopdev/pages/crm/Leads.tsx`, `apps/mobile/components/MobileLeadsScreen.tsx` | UI rendering, typecheck passed |
| `LEADS-REQ-KANBAN` | Visual Kanban Board by Stage | `REQUIRED_MVP` | `src/loopdev/components/crm/LeadKanbanBoard.tsx` | Stage columns, sums, drag/drop status |
| `LEADS-REQ-PREVIEW` | Quick Preview Drawer | `REQUIRED_MVP` | `src/loopdev/components/crm/LeadQuickPreviewDrawer.tsx` | Side drawer inspection without page reload |
| `LEADS-REQ-SPEED-DIAL` | 1-Tap Mobile Speed Dial | `REQUIRED_MVP` | `apps/mobile/components/MobileLeadsScreen.tsx` | Native phone, email, whatsapp linking |
| `LEADS-REQ-DETAIL` | Lead Detail & Stage Stepper | `REQUIRED_MVP` | `apps/mobile/components/MobileLeadDetailScreen.tsx` | Stage progression, BANT criteria |
| `LEADS-REQ-CREATE` | Lead Creation with Contact Link | `REQUIRED_MVP` | `apps/mobile/components/MobileCreateLeadScreen.tsx` | Contact dropdown, BANT fields |
| `LEADS-REQ-CONVERT` | Convert Lead to Deal | `REQUIRED_MVP` | `apps/mobile/components/MobileLeadDetailScreen.tsx`, `Leads.tsx` | Opportunity creation & lead status sync |
