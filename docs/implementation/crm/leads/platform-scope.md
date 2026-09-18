# Platform Scope: CRM Leads

## Canonical Surfaces

| Platform Surface | Inclusion | Target Renderer | Status |
|---|---|---|---|
| **Desktop Web** | `required` | React + Tailwind + shadcn (`src/loopdev/pages/crm/Leads.tsx`) | Implemented |
| **Mobile Web** | `required` | React Native for Web / Expo (`apps/mobile/components/MobileLeadsScreen.tsx`) | Implemented |
| **iOS** | `required` | React Native / Expo (`apps/mobile/`) | Implemented |
| **Android** | `required` | React Native / Expo (`apps/mobile/`) | Implemented |

## Common Behavioral Rules
1. **Status Semantics**: The 5 stages (`new`, `contacted`, `qualified`, `stalled`, `converted`) are identical across desktop and mobile.
2. **Speed to Lead**: Contact actions trigger platform-native dialers (`tel:`), mail apps (`mailto:`), and messaging protocols.
3. **Data Integrity**: Converting a lead creates an opportunity record while transitioning lead status to `converted`.
