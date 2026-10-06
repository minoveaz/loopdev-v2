# Architecture & Component Design: CRM Leads

## 1. Domain & Data Contracts

### 1.1 Lead Entity Extension
```typescript
export interface CRMLead {
  id: string;
  organizationId: string;
  contactId: string;
  status: "new" | "contacted" | "qualified" | "stalled" | "converted";
  source?: string | null;
  interest?: string | null;
  score?: number | null;
  ownerId?: string | null;
  ownerName?: string | null;
  estimatedValue?: number | null;
  estimatedCurrency?: string | null;
  qualificationNeed?: string | null;
  qualificationTimeline?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### 1.2 Pipeline Stage Mapping
- `new`: Initial inquiry / untriaged.
- `contacted`: Initial outreach made (call, email, WhatsApp).
- `qualified`: BANT criteria validated; ready for opportunity creation.
- `stalled`: Follow-up pending response or paused.
- `converted`: Converted to commercial revenue opportunity.

---

## 2. Desktop Architecture (`src/loopdev`)

1. **`Leads.tsx`**:
   - Host container with state for `viewMode` (`table` | `kanban`), active filters (search, owner, stage), and selected lead for preview drawer.
   - Dual-mode header switcher with smooth layout transition.

2. **`LeadKanbanBoard.tsx`**:
   - Renders 5 stage columns with header badges, lead count, and aggregate currency sum.
   - Cards display contact name, initials, company, BANT preview, heat badge (🔥 Hot / ⚡ Warm), and quick status changer.

3. **`LeadQuickPreviewDrawer.tsx`**:
   - Uses `AppDrawer` from platform UI with `size="md"`.
   - Contact hero block with direct communications (`mailto:`, `tel:`).
   - BANT qualification block, stage progression, and "Convert to Deal" trigger.

---

## 3. Mobile Architecture (`apps/mobile`)

1. **`MobileLeadsScreen.tsx`**:
   - Horizontal KPI metrics ribbon (Total, Qualified, Hot 🔥, Pipeline Est.).
   - Search bar and filter pills.
   - Lead cards with 1-tap speed-dial buttons for calling, emailing, messaging, and opening full details.

2. **`MobileLeadDetailScreen.tsx`**:
   - Profile hero with score badge and owner.
   - Visual stage stepper to advance lead qualification in one tap.
   - BANT criteria card, Customer 360 link, and Deal conversion modal.

3. **`MobileCreateLeadScreen.tsx`**:
   - Contact selector, scope, BANT notes, and owner selector.

4. **`adapters/crm.ts`**:
   - Implements Supabase sync with in-memory fallback for offline resilience.
