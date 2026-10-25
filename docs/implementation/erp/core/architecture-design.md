# ERP Core Architecture and Design

## Document control

| Field | Value |
|---|---|
| Module | Cross-sector ERP Core capability map |
| Product definition | `design.md`; `docs/06-product/products/PRODUCT_CATALOG_GLOBAL_TRACK.md` |
| Run ID | `MOD-CORE-20261024-001` |
| Track | Products/categories first release approved; implementation track pending plan approval |
| Design checkpoint | `runs/MOD-CORE-20261024-001/01-design.json` |
| Owner | @loopdev-io (Product Owner and Platform/DB owner) |
| Status | `Products/categories plus non-accounting purchase-cost reference approved; design/visual evidence and plan approval require refresh before build` |

## Target architecture

### Context and boundaries

- **Suite and bounded context:** ERP suite. Products is the existing partial
  context and the only first-release module. Suppliers is a separate ERP
  context; Shopify, Inhand, Sales, Procurement, Inventory, Finance and
  Reporting are deferred from this release.
- **Owned responsibilities:** ERP-owned operational records and rules after
  each module is approved; source of truth must be declared per entity and
  channel.
- **Explicitly out of scope:** CRM relationship history, Platform
  collaboration primitives, provider secrets, public storefront rendering
  inside authenticated ERP, and statutory accounting before jurisdiction
  approval.
- **Current routes:** `/app/erp/overview`, canonical `/app/erp/products` and
  legacy `/app/erp/product-catalog`. The canonical and legacy routes are
  registered; the unauthenticated runtime redirects to login. Authenticated
  route behavior remains unverified. Other module routes are proposals only.
- **Consumers:** CRM, Communications, future ERP contexts and public channels
  through stable IDs and versioned contracts.
- **Consumed Platform capabilities:** organization/membership, authorization,
  Notes, Files, Tasks, Activity, Relations, Document Intelligence Core where
  approved, Rivera UI and shell.
- **Products presentation:** the approved product/SKU record and create/edit
  flows are full pages; AppDrawer is limited to quick auxiliary-reference
  creation/preview. The purchase-cost reference is a separate sensitive
  product capability, not a sales-price field.

### Layer map

| Layer | Responsibilities | Files/areas | Allowed dependencies | Forbidden dependencies |
|---|---|---|---|---|
| Presentation | ERP route pages and view composition | `src/loopdev/pages/erp/`, `src/routes/LoopdevRoutes.tsx` | Application hooks and shared UI | Domain rules, SQL, credentials |
| Application | Command/query orchestration and permission-aware use cases | Proposed ERP application/domain hooks | Domain and ports | React rendering and transport details |
| Domain | Product/service, supplier, sales, inventory, procurement and finance invariants per approved context | Existing `src/loopdev/domains/catalog/` is the current technical implementation for Products; the confirmed item classes, independent operational uses, product-base and SKU-level categories, and variant sourcing inheritance are design decisions, not implemented contracts | Value objects, domain events, ports | UI, Supabase client, provider SDK |
| Ports/contracts | Stable commands, queries, errors, events and capability semantics | Existing catalog types and operation IDs remain compatibility contracts; future canonical Products contracts proposed under `packages/contracts/src/` | Domain and adapter interfaces | Platform-specific renderers |
| Adapters/infrastructure | Local/remote persistence and provider integrations | Existing catalog adapters; future adapters proposed | Ports, auth/RLS and provider SDKs server-side | Direct UI dependencies on provider implementations |

### Dependency direction

```text
Presentation → Application → Domain → Ports ← Adapters
```

| Exception | Reason | Risk | Approval | Follow-up |
|---|---|---|---|---|
| Existing Products UI-to-catalog-adapter paths may not follow the target layering | Preserve current behavior until source audit identifies a safe refactor | Domain and transport may diverge | Not approved as a new pattern | Audit per capability before implementation |

### Current source audit — 2026-10-25

| Boundary | Observed implementation | Finding and disposition |
|---|---|---|
| Presentation → application/domain | `ProductCatalog.tsx`, `ProductRecordPages.tsx`, `ProductSkuManagerPage.tsx` and media pages call `catalogAdapter` or `productMediaAdapter` directly; no Products application/use-case layer mediates those calls. | Existing transition exception, not an approved target pattern. Do not add new renderer-to-adapter behavior; move orchestration behind application hooks/use cases when the approved task covers behavior-preserving regression evidence. |
| Domain → persistence | `catalog/adapter/supabase.ts` owns Supabase queries, while `catalog/adapter/local.ts` owns local persistence. `catalog/adapter/index.ts` resolves the Proxy through explicit `VITE_CATALOG_ADAPTER_MODE` configuration. | `ADAPTER-MODE-001` is implemented and tested: only `local_demo` or `supabase` is accepted; missing/invalid configuration fails closed without ID-shape inference or fixture fallback. The current runtime has no mode configured. |
| Products media → Platform Files | `catalog/adapter/product-media-supabase.ts` directly calls Supabase Storage, `platform_files` and `erp_product_media_*`; the shared Files adapter export currently exposes the local adapter. | Platform boundary deviation: media does not yet use an organization-scoped shared remote Files contract. Replace this path under `PLATFORM-FILES-001`/`MEDIA-ADAPTER-001`; no module-local lifecycle or deletion path is approved. |
| Shared capability contract → runtime | `packages/contracts/src/erp-products-capability.ts` declares v1 operations for products, variants, offers, price books/entries and categories. The legacy `CatalogAdapter` still owns runtime types/operations, and cost/media operations are not represented in this capability contract. | Contract and runtime parity are incomplete. `PRODUCT-CONTRACT-001`, `COST-CONTRACT-001` and Files integration must close their scopes before claiming the shared contract is authoritative. |
| Authorization → persistence | Supabase adapters issue tenant-scoped queries and database RLS remains the server-side boundary. Media Storage policy hardening has remote evidence, but the full deployed ERP schema/RLS state and end-to-end cost permissions are not verified. | This is a security/deployment gate, not a renderer workaround. Keep remote Products writes disabled until operation-specific RLS, cost isolation, audit atomicity and deployed-state evidence pass. |

No new architecture exception was approved by this source audit. The findings
are recorded as existing transition debt and do not authorize new direct
renderer persistence, module-local Files lifecycle, or client-side authorization.

## Responsibility matrix

| Concern | Authoritative owner | Consumers | Must not contain | Evidence |
|---|---|---|---|---|
| UI rendering | ERP presentation | ERP operators | Business rules or provider policy | Route/source review complete; conceptual visual source exists; implementation/runtime parity remains unverified |
| Use cases/orchestration | ERP application layer | ERP UI, integrations | Page components or storage implementation | Proposed; later tests required |
| Domain rules/invariants | Owning ERP bounded context | Other contexts through contracts | Cross-context database writes | Domain checkpoint was invalidated by changed design inputs and needs revalidation; runtime field parity remains incomplete |
| Persistence | Adapter/infrastructure | Domain ports | UI components | Products module currently uses catalog-named local adapter + partial Supabase evidence |
| API/transport | ERP contracts and server adapters | Web, mobile web, public channel | Provider semantics in clients | API checkpoint was invalidated by changed design inputs and needs revalidation; Products runtime parity and audit integration remain incomplete |
| Authorization/tenant scope | Platform + server/RLS enforcement | All ERP contexts | ERP-local tenant/membership or UI-only checks | Policy docs exist; source/runtime evidence needed |
| Synchronization/conflicts | Shared semantic contract; provider adapter owns mapping | Clients and external channels | Renderer-local merge/source-of-truth rules | Sync checkpoint was invalidated by changed design inputs and needs revalidation; remote is online-only and media persistence remains a separate gap |
| Shared Platform capability | Platform | ERP records/workspaces | Local clone of notes/files/tasks/timeline | Platform UI reference and current exports |

### Current responsibility and structural-quality audit — 2026-10-25

| Responsibility | Authoritative owner | Current implementation / gap | Remediation seam |
|---|---|---|---|
| UI rendering and interaction | ERP presentation | `src/loopdev/pages/erp/` owns routes and forms. Product pages also orchestrate adapter calls. | Keep rendering in pages; move use-case orchestration behind the approved Products application hooks as relevant tasks are implemented. |
| Application commands and queries | ERP Products application | No distinct application/use-case layer exists for Products; handlers call `CatalogAdapter` directly. | Introduce only with behavior-preserving tests; do not move domain rules into new page helpers. |
| Product invariants and lifecycle | ERP Products domain | `CatalogAdapter` mixes products, variants, offers, prices, references and costs. Some identifier rules live in both the local adapter and database triggers. | Shared product contract/domain policies should be authoritative; adapters/database enforce persistence invariants. Keep category/cost/media operations behind their own approved contracts. |
| Public capability/port contract | ERP Products contract, consuming Platform contracts | `packages/contracts/src/erp-products-capability.ts` defines product/category actions but does not yet cover cost/media operations or all runtime operations. Legacy catalog types remain the current port. | Complete `PRODUCT-CONTRACT-001`, `CATEGORY-CONTRACT-001` and `COST-CONTRACT-001`; Files contract owns file operations. |
| Local and remote persistence | ERP adapter/infrastructure | Explicit adapter-mode selection is implemented and fails closed when unset. Core local Catalog stores use strict persistence; product-media stores still use best-effort persistence. The runtime currently has no mode configured. | Keep explicit configuration and visible failures; complete media persistence behavior through its approved shared contract. |
| Authorization and tenant scope | Platform authorization plus database RLS | Platform auth supplies the session; catalog adapters include organization filters and RLS is the server boundary. Full operation/cost/audit parity is not verified. | Complete `AUDIT-SECURITY-001`, `REMOTE-STATE-001`, and the approved Platform audit/RLS tasks before remote Products writes. |
| Shared file bytes, metadata and preview lifecycle | Platform Files | Product media still directly uploads/removes Storage objects, edits `platform_files` and creates signed URLs in a catalog adapter. | User approved the shared Files boundary; complete `PLATFORM-FILES-001` and `MEDIA-ADAPTER-001` without adding a second file lifecycle. |
| Synchronization and conflict policy | Shared semantic contract; provider adapter maps remote persistence | Remote Products is online-only with no offline queue/cache. Explicit adapter mode is implemented, but runtime configuration is unset; media persistence remains best-effort. | Preserve fail-closed mode selection and online-only remote semantics; make media persistence behavior explicit without renderer retries or fallback. |
| Mutation audit | Platform append-only audit | Shared audit semantics are owner-approved, but no Products source or migration call site for `record_platform_audit_event` is present. | Wire the approved event contract with same-transaction failure semantics and prove rollback before enabling remote writes. |

Structural findings: cohesion is weakened by the broad `CatalogAdapter` surface;
coupling is increased by page-level adapter orchestration; product media still
duplicates parts of Platform upload/metadata/preview lifecycle and its storage
is best-effort; and audit ownership is defined but not wired to Products mutations. The
remediation seams above are assigned to existing ledger tasks. No code refactor
is authorized by this audit; before/after behavior evidence is required before
changing any of these boundaries.

## Module and Platform contracts

| Capability | Decision | Contract | Consumers | Duplicate prohibited? |
|---|---|---|---|---|
| Organization scope | `REUSE` | Organization/membership/RLS references | ERP modules and channels | Yes |
| CRM customer relationships | `REUSE` | CRM contacts and Customer 360 | Sales/finance references | Yes |
| Products | `REUSE` with audit | `CatalogAdapter` and product types (legacy names) | CRM and channels | Yes |
| Notes, Files, Activity, Tasks, Relations | `REUSE` | Current Platform contracts/components | ERP records | Yes |
| Document Intelligence | `REUSE` | Approved Document Intelligence Core handoff | Future invoice/document workflows | Yes |
| Suppliers | `MODULE_SPECIFIC` as an independent context; release priority open | No approved functional contract | Supplier profile is owned by ERP Suppliers; Procurement references its stable ID; CRM contact relationship requires domain review | Yes: do not embed supplier master data in Procurement |
| Sales, Procurement, Inventory, Finance, Reporting | `MODULE_SPECIFIC` | No approved functional contracts | Cross-context contracts TBD | Yes: no UI-owned business rules |
| Provider connection infrastructure | `REUSE`/deferred | No provider integration is in this release; shared boundary needs review before future work | Future Shopify and other providers | Yes: no isolated core per connector |

## Structural quality baseline

- [x] Cohesion/coupling risk: broad "ERP Core" can become a monolith; keep
  candidate bounded contexts independent.
- [x] SRP risk: channel adapters must not own ERP product/order policy.
- [x] Duplication risks identified for CRM identity, Platform collaboration
  and product master data; supplier identity must remain distinct from CRM-owned customer
  relationship history.
- [x] Public contract boundaries and dependency direction documented in
  `design.md`.
- [ ] Revalidate the architecture-boundary, responsibility, platform-reuse and
  refactor-safety audits before remaining implementation tasks; the prior
  checkpoint set is invalidated by changed design inputs.
- [x] Domain/application behavior must be testable without React or Supabase.
- [x] Tenant, authorization and synchronization ownership documented;
  detailed policies await specialized phases.
- [x] Residual debt: Products remote parity, audit integration, media Files
  lifecycle, cost RLS and
  legacy permission naming; tracked under issue #36 and the approved plan.

## Refactoring records

| ID | Reason | Behavior preserved | Files/consumers | Risk | Before evidence | After evidence | Rollback | Residual debt |
|---|---|---|---|---|---|---|---|---|
| ARCH-ERP-001 | Separate candidate ERP contexts | Keep modular ownership across a cross-sector product | ERP modules and channels | High if cross-context writes emerge | Discovery source audit | Products/categories first-release scope approved; follow-ups excluded | Restrict writes to owning context; contract tests | Future ERP module boundaries require separate discovery |
| ARCH-ERP-002 | Reconcile Products compatibility/permission mismatch | Avoid local/remote behavior divergence | Products and current CRM references | High | Adapter/migration evidence | Canonical permission decision is `catalog.write`; no implementation yet | Keep remote writes disabled until migration and deployed RLS verification | Forward migration and permission parity |
| ARCH-ERP-003 | Define a sector-neutral Products master without merging operational uses into item class | Preserve one shared master for products, components and services | Products, CRM and future ERP/channel consumers | Medium | `discovery.md` and `CR-ERP-PRODUCT-MASTER-MODEL` | Approved conceptual model; field contracts not implemented | Keep existing catalog model unchanged until domain/API migration is approved | Resolve legacy grouping and map approved concepts in `02-domain` |
| AUDIT-REFACTOR-001 | Preserve product/SKU identity, CRM key compatibility, routes, media ownership and remote authorization while closing the module plan | Keep UUIDs and relationships stable; do not turn local fixtures into remote fallback | `/app/erp/products`, legacy catalog route, loading/empty/error/forbidden/conflict/offline/pending/success states, local/Supabase catalog adapters, CRM catalog references, Platform Files and shared audit | High | Focused identifier/CRM/media tests, 555-test quality suite, 19 isolated Files pgTAP assertions and local route guard evidence | No production behavior changed by this audit; the `npm run test:quality` baseline passed all 555 tests and the local authenticated desktop route was exercised without writes | Owner-approved: immutable pre-cutover snapshot; forward-only migrations; on failure disable writes and return to read-only compatibility; repair forward without deleting post-cutover writes; restore snapshot only if no writes occurred or after reconciliation. Write control is DB-enforced, global and per-organization, default false, Platform/DB-owner managed and audited. | Implement and test the write controls, audit atomicity and recovery runbook before remote Products writes; owner Platform/DB: @loopdev-io |

## Open decisions and deviations

| ID | Decision or deviation | Status | Impact | Approver | Resolution/follow-up |
|---|---|---|---|---|---|
| ERP-OD-006 | First-release module set | Resolved | High | Product owner | Products/categories only; all other modules/integrations deferred (`CR-ERP-PRODUCTS-FIRST-RELEASE`) |
| ERP-DEC-004 | The existing catalog-facing ERP module is renamed Products; product/service records become the direct list entry point while catalog-named IDs/contracts remain compatible | Confirmed | High | Product owner | CR-ERP-PRODUCTS-MODULE; `/app/erp/products` is registered and the legacy catalog path redirects; catalog data loading still fails closed without explicit adapter configuration |
| ERP-DEC-005 | One Products master distinguishes finished products, raw materials/components and services; operational uses are independent; the product base has a general category and separately managed variants/SKUs have independently assigned categories; finished products allow buy/make/both sourcing, raw materials/components buy only for now, and services have no sourcing; variants inherit the product's sourcing; semimanufactured items await Manufacturing discovery | Confirmed | High | Product owner | User-confirmed product model; revisit raw-material sourcing during Manufacturing discovery; no runtime field/model changes authorized |
| ERP-DEC-006 | Each separately managed/sold variant is a specific SKU with its own primary category, which may differ from the product base and sibling variants; drafts may omit it, but activation requires it | Confirmed | High | Product owner | User decisions recorded in `domain-model.md`; no category inheritance or runtime field/model changes authorized |
| ERP-DEC-007 | SKU is unique across the organization after trimming outer whitespace and comparing case-insensitively; stored SKU preserves entered case | Confirmed | High | Product owner | User decision recorded in `domain-model.md`; product, variant and category keys are generated, immutable and organization-unique |
| ERP-DEC-008 | `OrganizationCatalog` is legacy migration input only, not a target business entity or Products ownership boundary | Confirmed | High | Product owner | User decision recorded in `domain-model.md`; preserve legacy records while mapping fields and references |
| ERP-DEC-003 | Suppliers is a standalone ERP module, separate from Procurement; manufacturing remains for later discovery | Confirmed | High | Product owner | Supplier priority/date and functional scope remain open; manufacturing is outside the current roadmap |
| ERP-OD-007 | Supplier module priority, release timing and functional scope | Resolved for this release | Medium | Product owner | Suppliers remains separate but deferred; later scope is future discovery |
| ERP-DEC-009 | Commercial price currency is owned by each `PriceBook`; migrate legacy `OrganizationCatalog` currency into applicable books | Confirmed | High | Product owner | User decision recorded in `domain-model.md`; reconcile legacy `Offer.currency` before implementation |
| ERP-OD-008 | Where legacy OrganizationCatalog locale and channel fields belong | Resolved for this release | Low | Product owner | Preserve as migration provenance; defer destination ownership to localization/channel work |
| BUILD-WRITE-CONTROL-001 | Remote Products write kill switch | Confirmed design | Critical | Platform/DB owner | User approved global and per-organization database-enforced controls, default false, checked on every mutation, changed only by Platform/DB owner and audited; implementation/tests remain required |
| BUILD-MIGRATION-RECOVERY-001 | Products schema/data migration recovery | Confirmed design | Critical | Platform/DB owner | User approved immutable pre-cutover snapshot and forward-only recovery; disable writes/read-only on failure, repair forward without deleting post-cutover data, and restore only before writes or after reconciliation |
| ERP-DEC-010 | Each `PriceEntry` uses its `PriceBook` currency; it cannot override the book currency | Confirmed | High | Product owner | User decision recorded in `domain-model.md`; legacy entry-currency mismatches need explicit migration handling |
| ERP-DEC-011 | `Offer` has no independent currency; offer prices use the currency of the associated `PriceBook` | Confirmed | High | Product owner | User decision recorded in `domain-model.md`; migrate/retire legacy `Offer.currency` |
| CR-ERP-PRODUCT-EDITOR-COST-REFERENCE | Full-page product/SKU record and editor; non-accounting unit purchase-cost reference and physical attributes | Confirmed | High | Product owner | Approved 2026-10-24; update domain, access, API and sync contracts before plan/build |
| VD-ERP-COST-002 | Cost visibility, currency, source/history and product-to-SKU default behavior | Partially resolved | High | Product owner + ERP/Platform | Separate owner/admin-only read/manage permissions and no cost inheritance are confirmed; source/history and currency-specific precision remain open, with audit integration still required |
| VD-ERP-DATA-002 | Full brand/tag reference-data lifecycle and navigation | Open | Medium | Product owner + ERP domain | Quick create is approved; decide controlled values and full manager surface |
| ERP-CF-001 | Products data remote runtime/documentation | Execution gate | High | ERP/Platform | Read-only deployed-state check; reconcile docs/runtime; no remote writes until verified |
| ERP-CF-002 | Products permission compatibility | Resolved decision; implementation pending | High | Platform access owner | Use `catalog.write`; forward-migrate remote grants/RLS and add parity tests |
| ACC-ERP-011 | Shared append-only audit contract | Semantics approved; Products integration pending | Critical | @loopdev-io (Platform/DB owner) | Implement Products call sites, same-transaction rollback and failure tests before remote writes |
| MIG-ERP-001 | Legacy data mapping | Data-access pending | High | Product owner + Platform data owner | Obtain authorized inventory and dry-run review before mapping/cutover |
| ERP-OD-002 | MiauCraft Shopify ownership/sync | Open | High | MiauCraft + product owner | Client mapping discovery; default read-only |
| ERP-OD-003 | Inhand market/tax/fulfillment/returns | Open | High | Inhand + product owner | Resolve before native commerce plan |
