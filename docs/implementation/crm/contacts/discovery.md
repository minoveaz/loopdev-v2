# Contacts Discovery

## Document control

| Field | Value |
|---|---|
| Module | Contacts |
| Suite | CRM |
| Run ID | MOD-CONTACTS-20260913-001 |
| User request | Compare the existing Contacts implementation with the approved desktop/mobile/native delivery expectations without modifying production code |
| Product definition | `docs/06-product/crm/contacts/CRM_CONTACT_CONTRACT.md` |
| Discovery status | `partial` |
| Owner | Platform Delivery |

## Problem and objective

- **Business problem:** CRM users need an authorized, tenant-scoped contact system for listing, searching, creating, editing, reviewing duplicates and opening Customer 360 context.
- **Primary objective:** Determine which approved Contacts capabilities already exist in the current LoopDev v2 implementation and which remain partial, missing or untested across desktop web, mobile web, iOS and Android.
- **Success measure:** A capability-by-capability expected-versus-existing matrix with source references, implementation evidence, platform status and explicit follow-up ownership.
- **Explicit boundary:** This discovery run does not modify production code, implement backend persistence, approve a new scope or advance to `module-design`.

## Actors and outcomes

| Actor | Job to be done | Outcome | Permissions/constraints |
|---|---|---|---|
| Agent | Create and update permitted contacts | Contact is created or updated with validation and tenant scope | Must use authorized adapter and typed contracts |
| Manager | Review duplicates and approve permitted merges | Duplicate decision is audited | Merge requires approval and expected versions |
| Organization admin | Configure visibility and requiredness | Contact fields reflect organization policy | Cannot create custom fields during the pilot |
| CRM user | Search, filter and navigate contacts | Finds a contact and opens Customer 360 | Must remain within organization/workspace scope |

## Expected domain capabilities

| Capability | Classification | Expected behavior | Priority |
|---|---|---|---|
| Contact list and pagination | `REQUIRED_MVP` | Authorized list at `/app/sales-crm/contacts`, real table on desktop and semantic card/list representation on mobile | High |
| Search and filters | `REQUIRED_MVP` | Query, authorized filters, sorting and reset with equivalent semantics across platforms | High |
| Contact creation | `REQUIRED_MVP` | Validated form with first/last name, email-or-phone rule, source and configured requiredness | High |
| Contact editing | `REQUIRED_MVP` | Patch with expected version and conflict handling | High |
| Customer 360 navigation | `REQUIRED_MVP` | Contact route preserves `contactId` and exposes authorized detail context | High |
| Contact actions | `REQUIRED_MVP` | View, edit, note, task and archive share stable IDs, labels and availability | High |
| Duplicate review and merge | `REQUIRED_MVP` | Candidate review and human-approved merge with audit trail | High |
| Tenant and permission enforcement | `REQUIRED_MVP` | Organization/workspace scope and server-side permission checks | Critical |
| Offline and conflict recovery | `REQUIRED_FOLLOW_UP` | Shared lifecycle semantics with platform-specific storage/recovery | Medium |
| Notes, tasks, activity and relations | `PLATFORM_REUSE` | Consume existing Platform/CRM capabilities instead of local duplicates | Medium |

## Inputs, outputs and events

### Inputs

- Contact entity, address, source and duplicate-review data from the approved Contact Contract.
- Commands: `listContacts`, `searchContacts`, `getContact`, `createContact`, `updateContact`, `findPotentialDuplicates`, `approveContactMerge`, `dismissDuplicateReview`.
- Existing shared contracts: `contact-form.ts`, `contact-actions.ts`, `contact-capability.ts`, navigation contract and CRM adapter types.

### Outputs

- Authorized paginated contact list and search results.
- Created or updated contact envelopes with validation/conflict outcomes.
- Customer 360 detail and related activity.
- Duplicate review and merge audit results.
- User-visible loading, empty, error, forbidden, conflict, offline, pending and success states.

### Events

| Event | Producer | Consumers | Payload/invariants | Idempotency/audit |
|---|---|---|---|---|
| Contact created | Contact command | CRM list, relations, activity | Organization-scoped contact identity | Idempotency key and audit required by product contract |
| Contact updated | Contact command | List, Customer 360, related CRM surfaces | Expected version must be respected | Conflict must be explicit |
| Duplicate review opened | Contact creation/review | Agent or manager workflow | No automatic merge | Actor, reason and timestamp audited |
| Contact archived | Contact mutation | List, Customer 360 | Archived records excluded from default list | Recovery and audit behavior remains to verify |
| Contact merged | Manager-approved command | Leads, opportunities, tasks, notes, activity | References preserved | Append-only audit event required |

## Entities, relationships and lifecycle

| Entity | Owner | Relationships | States | Invariants |
|---|---|---|---|---|
| Contact | CRM domain | Organization, workspace, brand, user, leads, opportunities, tasks, notes and activity | active, archived, conflict/pending review | Tenant scope, name requirements and email-or-phone rule |
| ContactAddress | Contact | Belongs to Contact | present or absent | Location values follow reference-data dependencies |
| DuplicateReview | CRM domain | Candidate contact and survivor/duplicate | open, dismissed, merged | Never merges automatically |
| Customer360 view | CRM presentation/domain | Contact plus related CRM records | loading, success, empty, error, forbidden | Must preserve `contactId` and authorization |

## Platform and suite integration

| Capability/module | Decision | Consumed contract | Produced data/events | Duplicate prohibited? |
|---|---|---|---|---|
| Contact form | `REUSE` | `packages/contracts/src/contact-form.ts` | Contact create/update input | Yes |
| Contact actions | `REUSE` | `packages/contracts/src/contact-actions.ts` | Stable action selection | Yes |
| Contacts capability | `REUSE` | `packages/contracts/src/contact-capability.ts` | Shared action/state/navigation metadata | Yes |
| Navigation | `REUSE` | `packages/contracts/src/navigation.ts` | Contact list/create/detail routes | Yes |
| Customer 360 | `REUSE` | Existing Customer 360 route/components | Detail context and related records | Yes |
| Notes, Tasks, Activity, Relations | `REUSE` | Existing Platform/CRM capabilities | Related records and events | Yes |
| Backend persistence | `EXTEND_PLATFORM` | CRM adapter/API contract | Authorized contact envelopes | No module-local persistence bypass |

## Product definition currently approved

- **Product documents:**
  - `docs/06-product/crm/contacts/CRM_CONTACT_CONTRACT.md`
  - `docs/06-product/crm/contacts/CRM_CONTACTS_COMPONENT_AUDIT.md`
  - `docs/06-product/crm/contacts/CRM_CONTACTS_UI_IMPLEMENTATION_PLAN.md`
  - `docs/06-product/crm/contacts/CRM_CONTACT_IMPACT_ASSESSMENT.md`
  - `docs/06-product/crm/CRM_MULTIPLATFORM_DOCUMENTATION_SCHEMA.md`
- **Approved scope:** list, search, create, edit, detail/Customer 360, duplicate review and human-approved merge.
- **Explicit exclusions:** live Marketing/WhatsApp providers, AI merge decisions, billing implementation, documents/uploads and destructive schema cleanup.
- **Existing approvals:** Contact Contract and Impact Assessment approved on 2026-08-13; component audit approved on 2026-08-13.

### Legacy reference policy

Archived Contact handoffs remain informational only. Current implementation must use Rivera and
LoopDev shared primitives and the active contracts above.

| Legacy reference | Informational meaning | Current reuse target | Decision |
|---|---|---|---|
| `docs/06-product/archive/crm/contacts/CRM_CONTACT_IMPLEMENTATION_HANDOFF.md` | Historical delivery context | Active Contact Contract, current routes and shared contracts | `INFORMATIONAL_ONLY` |

## Existing LoopDev implementation

| Area | Existing route/code/doc | Behavior observed | Evidence |
|---|---|---|---|
| Desktop list | `src/loopdev/pages/crm/Contacts.tsx`, `/app/sales-crm/contacts` | Search, page size, sorting, table/list rows, create drawer, view navigation and archive dialog are present | Source inspection and `src/test/crm/contacts/*` |
| Desktop form | `src/loopdev/components/crm/contacts/ContactForm.tsx`, `ContactFormDrawer.tsx` | Shared four-section contract, section navigation, validation, dirty-close confirmation and save lifecycle | Source inspection |
| Mobile web/native client | `apps/mobile/components/MobileContactsScreen.tsx`, `apps/mobile/App.tsx`, `apps/mobile/app.json` | Expo/React Native client exists; Expo Web is served at `http://localhost:8082`; native iOS/Android targets and native-specific controls are configured but not run in this discovery | Source inspection and Expo configuration; runtime interaction not captured |
| Mobile form | `apps/mobile/components/MobileCreateContactScreen.tsx`, `contact-tabs/*` | Mini-header, tabs, back/next, shared fields, selectors, date input and discard confirmation | Source inspection |
| Shared contract | `packages/contracts/src/contact-form.ts`, `contact-actions.ts`, `contact-capability.ts` | Shared fields, labels, action metadata, state list, navigation and permission metadata | `npm run validate:contracts` passed |
| Desktop routes | `src/routes/LoopdevRoutes.tsx` | List, detail and activity routes are registered | Source inspection |
| Mobile routes | `apps/mobile/App.tsx` | List and create routes are registered; view falls through to generic handling and archive is local state | Source inspection |
| Persistence | Local CRM adapter/mobile session state | Desktop local adapter and mobile session state exist; shared backend sync is not evidenced | Source inspection and product impact assessment |

## Platform capability matrix

| Capability | Desktop web | Mobile web | iOS | Android | Shared contract | Status |
|---|---|---|---|---|---|---|
| List/search/filter | Implemented source and route; runtime evidence pending in this run | Expo Web renderer implemented; runtime evidence pending in this run | Expo native target configured; runtime not executed | Expo native target configured; runtime not executed | `contact-capability.ts` plus action/form contracts | `PARTIAL` |
| Create form | Implemented drawer and shared form contract | Implemented tabbed Expo renderer | Native renderer code path configured; runtime not executed | Native renderer code path configured; runtime not executed | `contact-form.ts` | `PARTIAL` |
| Actions | Desktop catalog consumed; edit/note/task/archive behavior needs runtime and adapter verification | Catalog rendered; edit/note/task disabled, view/archive handlers present | Native action surface not executed | Native action surface not executed | `contact-actions.ts` | `PARTIAL` |
| Customer 360 | Registered and implemented route | Detail route not implemented as a complete Expo surface | Native route not executed | Native route not executed | Navigation contract | `PARTIAL` |
| Persistence/conflict | Local adapter; backend evidence not present in this run | Session-only create/archive behavior | Native persistence not tested | Native persistence not tested | Contact API contract | `NOT_TESTED` |
| Permissions/tenant scope | Product requirement exists; UI/source evidence is not sufficient for server enforcement | Product requirement exists; server enforcement not evidenced | Native permission behavior not tested | Native permission behavior not tested | Contact Contract | `NOT_TESTED` |

## Expected versus existing

| Capability | Expected | Product source | Existing implementation | Baseline status | Evidence | Next action |
|---|---|---|---|---|---|---|
| Shared form schema and ordering | Four sections: Identity, Address, Organization, Contact channels; shared validation | Contact Contract and form contract | Same `contactFormSections` consumed by desktop and mobile | `EXISTS_AND_ALIGNS` | Contract test and source imports | Preserve through verify |
| Shared action catalog | Stable IDs, labels, availability and destructive tone | Contact Contract, capability contract | `contactActions` consumed by desktop and mobile; mobile has three unavailable actions | `EXISTS_PARTIALLY` | `validate:contracts`, renderer inspection | Verify runtime semantics and adapter completion |
| Desktop contacts list | Authorized table, search, filters, pagination and states | Contact Contract, component audit | Route and page exist with local CRM data and actions | `EXISTS_PARTIALLY` | Route/source/tests; runtime not captured | Verify all required states and direct refresh |
| Mobile contacts list | Responsive semantic representation with equivalent search/filter/action meaning | Contact Contract frontend handoff | Mobile cards, filters, reset and action sheet exist | `EXISTS_PARTIALLY` | Route/source; runtime not captured | Verify web sheet behavior and accessibility |
| Create contact | Required fields, email-or-phone rule, source and duplicate review | Contact Contract | Shared form validation and local creation flow exist | `EXISTS_PARTIALLY` | Contract/source; duplicate review absent | Plan adapter/API and duplicate-review follow-up |
| Edit contact | Authorized patch with optimistic conflict handling | Contact Contract | Desktop drawer has edit shape; mobile edit action is disabled | `EXISTS_PARTIALLY` | Source inspection | Implement/verify mobile edit and conflict path |
| Customer 360 | Detail route with authorized summary and related CRM context | Contact Contract and impact assessment | Desktop Customer 360 exists; mobile detail is incomplete | `EXISTS_PARTIALLY` | Desktop route/source | Add mobile detail renderer and direct-route evidence |
| Archive lifecycle | Archived badge/read-only notice and exclusion from default list | Contact Contract frontend handoff | Desktop archive flow exists; mobile removes item locally | `EXISTS_PARTIALLY` | Source inspection | Connect shared adapter and verify recovery/audit |
| Duplicate review/merge | Human-approved, audited, tenant-scoped merge | Contact Contract | No complete UI/API evidence found | `MISSING` | Product contract vs source inventory | Domain/API/access design required |
| Error/forbidden/conflict/offline | Explicit user-visible state matrix | Contact Contract and component audit | Some desktop states/tests exist; complete cross-platform evidence absent | `NOT_TESTED` | Product requirements, partial source/tests | Verify state matrix per platform |
| Tenant and permission enforcement | Server-side organization/workspace scope and audit | Contact Contract and impact assessment | Requirement documented; no backend/runtime evidence in this run | `NOT_TESTED` | Product docs only | Access/API verification required |
| Native iOS/Android | Expo/React Native renderer with native-specific controls and runtime evidence | Multiplatform Delivery Contract | Expo iOS and Android targets are configured in `apps/mobile` | `NOT_TESTED` | Run native targets and record simulator/device evidence |

## Scope boundaries

### MVP

- Authorized contacts list, search, filtering and navigation.
- Desktop and mobile web create/edit form using the shared contract.
- Customer 360 detail route.
- Shared action catalog and lifecycle states.
- Adapter/API contract readiness for tenant-scoped persistence.

### Follow-up

- Complete mobile Customer 360.
- Mobile edit flow.
- Duplicate review and merge UI/API.
- Backend persistence, conflict, audit and tenant enforcement evidence.
- Offline recovery and native renderer validation.

### Out of scope

- AI-driven merge decisions.
- Live marketing or WhatsApp provider integration.
- Billing implementation.
- Documents/uploads and unrelated CRM modules.
- Destructive schema cleanup.

## Contradictions, assumptions and open decisions

| ID | Type | Finding | Impact | Owner | Resolution |
|---|---|---|---|---|---|
| DISC-CONTACT-001 | contradiction | Product contract requires mobile-capable Customer 360 navigation, but mobile currently has list/create routes and no complete detail renderer | Mobile parity cannot be marked complete | CRM/Product | Resolve in module-design |
| DISC-CONTACT-002 | contradiction | Product contract requires edit and archive lifecycle semantics, while mobile edit is disabled and archive is local state removal | Lifecycle semantics are not shared end-to-end | CRM/Platform | Define adapter and mobile edit/archive work |
| DISC-CONTACT-003 | open_decision | Expo/React Native provides iOS and Android targets, but this discovery observed only Expo Web at `localhost:8082` | Native status remains `NOT_TESTED`, not `NOT_APPLICABLE` | Product/Platform | Run native targets and record simulator/device evidence |
| DISC-CONTACT-004 | assumption | Existing local CRM data is acceptable for frontend discovery baseline but not backend readiness | Persistence and tenant claims remain unverified | API/Access | Validate in specialized phases |
| DISC-CONTACT-005 | open_decision | Duplicate review/merge is approved product scope but absent from current implementation | Scope may require additional domain/API/access work | CRM/Product | Confirm MVP sequencing before plan |

## Handoff to module-design

- **Target architecture questions:** Which adapter/API slice is authoritative for create, edit, archive and conflict behavior?
- **UX questions:** Should mobile Customer 360 be a full route, sheet or platform-specific screen while preserving the same navigation meaning?
- **Domain questions:** What is the initial duplicate-review lifecycle and which references must be preserved on merge?
- **Platform reuse/extension questions:** Which existing Activity, Tasks, Notes, Relations and Customer 360 capabilities are consumed versus extended?
- **Required decisions before planning:** Duplicate-review MVP status, backend persistence boundary, mobile detail/edit behavior, native simulator/device coverage and required error/offline/conflict evidence.
- **Discovery state:** `partial`

## Customer 360 parity remediation

The 2026-09-14 renderer comparison found that shared Customer 360 data does
not establish functional parity. The detailed baseline and operation inventory
are recorded in `customer360-parity-remediation.md`. This is a
`REQUIRED_FOLLOW_UP` user-directed scope addition, pending canonical design and
plan approval. The new `CONTACTS-CAP-CUSTOMER360-OPERATIONS` ledger capability
must remain blocked until Platform Notes, Tasks, Files and Catalog expose
mobile-safe ports.
