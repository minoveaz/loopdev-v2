# Module Discovery & Modern Benchmark: CRM Leads

## 1. Executive Summary

CRM Leads bridges top-of-funnel inbound inquiries, outbound prospect engagement, and qualification before converting qualified opportunities into the sales pipeline.

We performed a deep comparative benchmark against the four market-leading CRM applications:
- **Attio**: Data-dense table + kanban dual-mode, instant slide-over preview drawer, dynamic score badges.
- **HubSpot**: Stage-based pipeline progression, 1-tap call/email communications, contact record synchronization.
- **Folk**: Visual contact cards, lightweight pipeline stage groupings, high-speed interaction.
- **Close**: Speed-to-lead calling, prominent status filters, rapid deal conversion.

## 2. Feature & Architecture Comparison

| Feature Dimension | Attio | HubSpot | Folk | Close | LoopDev Target (V2) |
|---|---|---|---|---|---|
| **View Modes** | Table + Board switcher | Table + Board | Visual Board | Focus List | Table + Board (Kanban) dual-switcher |
| **Inspection Pattern** | Side Drawer (no page reload) | Full Page Navigation | Slide-over Drawer | 3-Pane View | Slide-out `AppDrawer` preview drawer |
| **Lead Temperature** | Score formula & Tag | Predictive score | Tags | Activity status | Visual Heat Badges (🔥 Hot 80+, ⚡ Warm) |
| **Mobile Actions** | Basic read/edit | Call / Email logging | Read-only | Speed dialer | 1-Tap Speed Dial (Call, WhatsApp, Email, View) |
| **Stage Stepper** | Dropdown | Linear stage pipeline | Kanban drag | Status bar | Visual 1-tap progression stepper |
| **Deal Conversion** | Create Object modal | Convert Deal wizard | Pipeline move | Convert modal | In-place Modal to Opportunity conversion |

## 3. Gaps Identified in Legacy Implementation

1. **Desktop**:
   - Only basic table view existed; no visual Kanban by qualification stage.
   - Row click navigated to full page rather than opening an immediate preview drawer.
   - Absence of heat score indicators on desktop cards/rows.

2. **Mobile**:
   - Lack of dedicated mobile lead screens (`MobileLeadsScreen`, `MobileLeadDetailScreen`, `MobileCreateLeadScreen`).
   - No 1-tap speed-dial communications for rapid field rep responses.
   - Missing interactive stage stepper.

3. **Data & Contracts**:
   - Missing explicit fields for BANT qualification (`qualificationNeed`, `qualificationTimeline`, `estimatedValue`, `estimatedCurrency`) in mobile adapter.

## 4. Multiplatform Scope Decision

- **Desktop Web**: Full dual-view Table + Kanban, AppDrawer preview, conversion modal.
- **Mobile Web / iOS / Android**: Native Expo screens with metric ribbons, speed-dial actions, stage stepper, and Customer 360 link.
