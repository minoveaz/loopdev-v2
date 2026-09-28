# Contacts platform evidence matrix

| Requirement | Desktop web evidence | Mobile web evidence | iOS evidence | Android evidence | Shared contract | Status | Owner | Gap/next action |
|---|---|---|---|---|---|---|---|---|
| CONTACTS-CAP-LIST-SEARCH | `multiplatform-port.test.ts`: desktop adapter contract | `multiplatform-port.test.ts`: mobile adapter contract | No device evidence | No device evidence | `packages/contracts/src/contact-port.ts` | PARTIAL | CRM owner | Add runtime journeys in Phase 4 |
| CONTACTS-CAP-CREATE | `multiplatform-port.test.ts`: validation, permission and create | `multiplatform-port.test.ts`: validation, permission and create | No device evidence | No device evidence | `packages/contracts/src/contact-port.ts` | PARTIAL | CRM owner | Add component and runtime evidence in Phase 4 |
| CONTACTS-CAP-EDIT | `multiplatform-port.test.ts`: update and stale conflict | `multiplatform-port.test.ts`: update and stale conflict | No device evidence | No device evidence | `packages/contracts/src/contact-port.ts` | PARTIAL | CRM owner | Add conflict journeys in Phase 4 |
| CONTACTS-CAP-DETAIL | Customer 360 tabs for contact, sales, work, documents and products; direct route validated in browser | Customer 360 summary and direct route validated in Expo Web; related sections are read-only summaries | No device evidence | No device evidence | `packages/contracts/src/contact-capability.ts` | PARTIAL | CRM owner | Implement mobile Contact, Sales, Work, Documents and Products section actions before claiming renderer parity |
| CONTACTS-CAP-ACTIONS | Contact actions plus Customer 360 actions for notes, tasks, documents and products | Edit and archive only; no mobile create note/task, upload document or product actions | No device evidence | No device evidence | `packages/contracts/src/contact-actions.ts` | PARTIAL | CRM owner | Implement the missing mobile action catalog before claiming renderer parity |
| CONTACTS-CAP-DUPLICATES | `multiplatform-port.test.ts`: audited dismissal | `multiplatform-port.test.ts`: audited dismissal | No device evidence | No device evidence | `packages/contracts/src/contact-port.ts` | PARTIAL | CRM owner | Add review-screen runtime evidence in Phase 4 |
| CONTACTS-CAP-ACCESS | `multiplatform-port.test.ts`: forbidden mutation | `multiplatform-port.test.ts`: forbidden mutation | No device evidence | No device evidence | `packages/contracts/src/contact-capability.ts` | PARTIAL | CRM owner | Add server-side tenant evidence in later backend phase |
| CONTACTS-CAP-STATES | Typed mutation results exercised by contract suite | Typed mutation results exercised by contract suite | No device evidence | No device evidence | `packages/contracts/src/contact-port.ts` | PARTIAL | CRM owner | Add complete renderer state matrix in Phase 4 |

## Runtime snapshot

| Field | Value |
|---|---|
| Repository path | Historical run used `/Users/minoveaz/Documents/Proyectos/loopdev-v2` |
| Checkout type | Historical branch checkout |
| Branch and HEAD | `feature/crm-v2-foundation` / historical `b1caa20` |
| Desktop URL/port | Historical claim: `http://localhost:8080/app/sales-crm/contacts` |
| Mobile URL/port | Historical claim: `http://localhost:8082/app/sales-crm/contacts` |
| Validation timestamp | Contract validation reproduced 2026-09-14; runtime not yet reproduced |

## Validation commands

| Command | Result | Evidence | Notes |
|---|---|---|---|
| Historical commands in `07-build.json` | NOT_TESTED | `runs/MOD-CONTACTS-20260913-001/07-build.json` | Claims retained but not accepted as current runtime evidence |
| `npm run test:multiplatform-contracts` | PASS | 10 tests against desktop and mobile adapters | Contract evidence only; no runtime claim |
| `npm run validate:mobile-boundaries` | PASS | Static import graph scan | `apps/mobile` has no imports from desktop `src/` |
| `npm run smoke:routes` | PASS | 4 desktop and 5 mobile route declarations | Parameterized templates include concrete deep-link examples |
| `cd apps/mobile && npx tsc --noEmit` | PASS | Expo TypeScript project | Shared contracts and explicit mobile adapters compile |
| `cd apps/mobile && npx expo-doctor` | PASS | 21/21 checks on 2026-09-14 | `npm ci` reported 11 moderate dependency advisories for follow-up |
| `cd apps/mobile && npx expo export --platform web --output-dir /tmp/loopdev-phase3-mobile-web` | PASS | Expo web bundle generated on 2026-09-14 | Build evidence only; interactive runtime journey remains Phase 4 |
| Browser route exploration | PARTIAL | Desktop and Expo Web direct Customer 360 routes rendered on 2026-09-14 | Confirms routing only; it exposed mobile renderer/action gaps and is not release evidence |

## Customer 360 parity gap

The shared `ContactPort` returns the same Customer 360 data shape on desktop and
mobile. This is domain-contract parity, not renderer parity. Desktop exposes
operational tabs for Contact information, Sales, Work, Documents and Products,
including note editing/creation, document upload and product selection. Mobile
currently renders a read-only linear summary of related data and only exposes
contact edit and archive. It must remain `PARTIAL` until the approved mobile
tasks implement the required actions or the product scope explicitly declares
an allowed mobile adaptation.

## Customer 360 operation inventory

| Operation | Domain contract | Desktop web | Mobile web | Status | Owner | Next action |
|---|---|---|---|---|---|---|
| Navigate to related lead/opportunity/task | `ContactCustomer360View` related item IDs | Implemented routes | Missing | PARTIAL | CRM Mobile | `CUSTOMER360-MOBILE-SALES-ACTIVITY` |
| Create, edit and delete note | Platform Notes on desktop | Implemented | Missing | PARTIAL | CRM Platform | Define neutral Notes port, then `CUSTOMER360-MOBILE-WORK` |
| Upload, preview, filter and delete document | Platform Files on desktop | Implemented | Missing | PARTIAL | Platform Files | `CUSTOMER360-MOBILE-DOCUMENTS` after shared port |
| View and associate product; view catalog | CRM/Catalog desktop adapters | Implemented | Missing | PARTIAL | CRM Catalog | `CUSTOMER360-MOBILE-PRODUCTS` after shared port |
| Navigate from timeline and view full activity | Customer 360 activity route | Implemented | Missing | PARTIAL | CRM Mobile | `CUSTOMER360-MOBILE-SALES-ACTIVITY` |