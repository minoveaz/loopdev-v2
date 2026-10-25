# Proveedores — Implementation Workspace

## References

- Product baseline: `docs/implementation/erp/core/discovery.md`; `docs/implementation/erp/core/design.md`
- Product track: `docs/06-product/products/PRODUCT_CATALOG_GLOBAL_TRACK.md`
- Run ID: `MOD-PROVEEDORES-20261025-001`
- Multiplatform contract: `docs/03-platform/governance/MULTIPLATFORM_DELIVERY_CONTRACT.md`
- Platform scope: `platform-scope.md`
- Platform evidence: `platform-evidence-matrix.md`
- Discovery: `discovery.md`
- Expected-versus-existing matrix: `expected-vs-existing-matrix.md`
- Architecture and design proposal: `architecture-design.md`
- Normative visual baseline: `visual-design.md` (`v1.1`; user-approved conceptual direction)
- View/state and operation matrix: `view-state-matrix.md`
- Styled review wireframes: `wireframes/`
- Requirement evidence: `requirement-evidence-matrix.md`
- Implementation plan: `implementation-plan.md` (owned by `module-plan`; approved task-scoped build)
- Ledger: `delivery-ledger.json` (`draft` globally; selected non-tax tasks have task-scoped approval)

## Current status

| Field | Value |
|---|---|
| Status | `in_progress` — approved non-tax P2P implementation; remote/runtime verification remains open |
| Current phase | `07-build` on attempt 9; migration and authenticated verification remain |
| Current issue | none |
| Branch | `feature/erp-proveedores` |
| Commit | `d8f45f895dd8ae74ea4dce3aacc2a60d627ebf91` — pushed to `origin/feature/erp-proveedores` |
| Pull request | none |
| Last evidence | Supplier tests (9 files, 23 tests), typecheck, delivery-ledger and module-run validation passed; authenticated runtime not verified |

## Scope direction

### Included in the discovery/design baseline

- ERP-owned commercial Supplier identity, separate from CRM.
- Supplier can be a company/organization or an individual service provider.
- Supplier assortment linking supplier-provided items to canonical LoopDev Products; one product may have multiple suppliers.
- Product Catalog remains the owner of internal products and SKUs.
- Purchase-to-pay-ready Supplier master data: legal/tax identity, role-based contacts and addresses, purchase defaults, finance references and payee/bank instructions.
- SupplierItem commercial terms for purchase-line preparation and inventory-unit conversion; the PO snapshots its chosen values.
- Tax and bank fields are visible to the same user profiles that can access Products via a Supplier-specific grant; Product permissions must not broaden to expose Supplier data.
- Supplier management maps to the Products writer population; only owner/admin may verify a payee instruction, and the verifier must differ from its editor.
- Real tax/bank data is server-authoritative and protected; no clear local storage/cache or offline access/write queue for those values.
- Initial tax jurisdictions are Spain, United States and Colombia; Finance/Legal must validate exact country-specific required fields.
- Desktop web and responsive mobile web.

### Open, excluded or deferred

- Manual supplier-item entry is the baseline; CSV is deferred from this slice and needs separate scope approval if revisited.
- Lifecycle is `active/on_hold/inactive`, with no hard delete; exact country tax fields and any legacy migration remain accountable plan items.
- SupplierItem may be an unlinked draft; purchasing requires a same-organization canonical Product or its variant and a valid purchase-to-stock conversion.
- CRM supplier master/listing, purchase orders, receipts, invoices/payables, payment execution/reconciliation as Supplier-owned transactions, and native iOS/Android are out of this slice.
- Purchase, Inventory and Finance transaction modules are required downstream consumers and need their own scope/design.
- Discovery records direction only; it does not authorize schema/API choices, implementation tasks, migrations, release or push.

## Phase index

| Phase | Status | Checkpoint | Evidence |
|---|---|---|---|
| 00-discovery | Completed as `partial` on attempt 6 | `runs/MOD-PROVEEDORES-20261025-001/00-discovery.json` | P2P field inventory, broad tax/bank visibility decision, updated benchmark and downstream transaction boundary |
| 01-design | Completed as `partial` on attempt 7 | `runs/MOD-PROVEEDORES-20261025-001/01-design.json` | Architecture, capability semantics, acceptance matrix and open decisions |
| 01-visual-design | Approved | `runs/MOD-PROVEEDORES-20261025-001/01-visual-design.json` | Visual source plus user-approved domain/access/persistence defaults |
| 06-plan | Completed | `runs/MOD-PROVEEDORES-20261025-001/06-plan.json` | Approved task-scoped implementation plan |
| 07-build | In progress | `runs/MOD-PROVEEDORES-20261025-001/07-build.json` | Non-tax P2P domain and responsive full-page setup implemented; remote migration, authenticated runtime and operation verification remain |
| 10-git | Completed | `runs/MOD-PROVEEDORES-20261025-001/10-git.json` | Implementation commit pushed to `origin/feature/erp-proveedores`; no PR requested |

## Decisions and blockers

| Topic | Current state | Evidence |
|---|---|---|
| Supplier ownership | ERP commercial entity; not CRM by default | User-confirmed direction in `discovery.md` |
| Supplier-to-product relationship | Many-to-many; supplier identity must not replace canonical Product | `discovery.md`; `delivery-ledger.json` |
| Supplier master | Required P2P setup: identity/tax, role-based contacts/addresses, purchasing defaults, finance references and payee instructions; tax/bank visible to the same Product-access profiles | `discovery.md` field inventory and DISC-006 |
| SupplierItem terms | Required purchasing UOM/conversion and supplier offer defaults for price/currency, MOQ/quantity break, lead time and validity where applicable | `discovery.md`; benchmark source register |
| Catalog intake | Manual entry in this slice; CSV deferred by user approval | `discovery.md`; plan checkpoint |
| Access | Supplier-specific reader grant mirrors Products reader roles; Supplier management mirrors Products writer roles; owner/admin verifies with maker-checker separation | `discovery.md`; plan checkpoint; `../core/access-model.md` |
| Persistence | Server-authoritative protected storage for real tax/bank values; no clear local cache or offline sensitive reads/writes | `discovery.md`; plan checkpoint |
| Initial jurisdictions | Spain, United States, Colombia; exact tax fields require Finance/Legal validation | User decision; plan checkpoint |
| Platforms | Desktop + responsive mobile web; native iOS/Android excluded | `platform-scope.md` |
| Procurement and payments | Required downstream consumers; transaction records are separate and out of Supplier module scope | `discovery.md` |
| Access conflict | Broad tax/bank visibility is user-confirmed but conflicts with `ACC-ERP-008`; remote policy remains unapproved | `architecture-design.md`, section 9 |
| Sensitive local storage | User-approved direction is protected server-authoritative storage; never clear browser storage or offline access for real tax/bank values | `discovery.md`; plan checkpoint |

## Platform impact

| Capability | Direction | Consumers | Tests affected | Migration |
|---|---|---|---|---|
| ProductPartyRole | Preserve as existing product-party data; do not treat it as the Supplier master | ERP Catalog, future Supplier assortment | Existing local catalog adapter test; remote adapter currently returns empty | No migration approved |

## Change log

| Date | Change | Run/commit | Approved by |
|---|---|---|---|
| 2026-10-25 | Started supplier discovery pilot; no feature implementation approved | `MOD-PROVEEDORES-20261025-001` | Discovery only |
| 2026-10-25 | Reconciled discovery with confirmed ERP ownership, many-to-many product sourcing, responsive web, and no-default-CRM direction | `MOD-PROVEEDORES-20261025-001` | User-confirmed product direction; no build approval |
| 2026-10-25 | Reopened discovery for Supplier P2P master readiness, SupplierItem terms, and broad tax/bank visibility; kept transaction records in owning modules | `MOD-PROVEEDORES-20261025-001`, attempt 6 | User-confirmed direction; access-model reconciliation remains open |
| 2026-10-25 | Drafted P2P architecture, acceptance evidence and shared capability validation; visual approval and open decisions remain pending | `MOD-PROVEEDORES-20261025-001`, attempt 7 | Proposed; no product or build approval |
| 2026-10-25 | Implemented the approved non-tax P2P setup and pushed its delivery commit | `MOD-PROVEEDORES-20261025-001`, `d8f45f895dd8ae74ea4dce3aacc2a60d627ebf91` | User-approved task-scoped work |
