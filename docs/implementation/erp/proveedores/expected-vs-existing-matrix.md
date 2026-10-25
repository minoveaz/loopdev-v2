# Proveedores: expected versus existing

Status: discovery baseline; the user approved the visual direction and the
non-tax implementation tasks by task scope. Country-specific tax behavior
remains blocked pending Finance/Legal evidence.
Source: `discovery.md`, run `MOD-PROVEEDORES-20261025-001`.

| Capability | Expected behavior | Product source | Existing implementation | Baseline status | Evidence | Next action |
|---|---|---|---|---|---|---|
| Supplier directory and identity | ERP-owned company/organization or individual supplier with list/search/detail and maintenance; stable internal identity, legal name and country; no CRM master/listing by default | User-confirmed direction and field inventory in `discovery.md` | No supplier domain, directory route, or adapter; navigation location selected as `ERP > Proveedores` | `MISSING` | `src/routes/LoopdevRoutes.tsx`; `src/loopdev/navigation.ts`; plan checkpoint | Implement after route/runtime audit |
| Supplier assortment | Many suppliers can offer one internal Product; one supplier can offer many Products/services | User-confirmed many-to-many requirement | `ProductPartyRole` is product-bound and has no Supplier master/link lifecycle | `MISSING` | `src/loopdev/domains/catalog/types.ts`; catalog adapters | Define supplier item identity and product/variant mapping |
| Product ownership and intake | Supplier catalog entries can be entered manually or optionally imported from reviewed CSV, linked to Products or used to start Product creation; internal Product remains canonical | User-confirmed direction | Product form has free-text provider metadata; no supplier catalog intake flow | `EXISTS_PARTIALLY` | `src/loopdev/pages/erp/ProductCatalog.tsx` | Preserve owner boundary; define optional CSV template/review and first-release availability |
| Supplier-specific offers and terms | SupplierItem links supplier SKU/item to Product/variant and holds purchase UOM/conversion, default price/currency, minimum quantity and lead time/validity when used; purchase orders snapshot selections | User-confirmed purchase and inventory readiness; Odoo benchmark informs the pattern | `ProductCostReference` has no supplier ID and only one reference per product/variant | `EXISTS_BUT_CONFLICTS` | `src/loopdev/domains/catalog/types.ts`; `supabase/migrations/20261024180000_erp_product_details_and_references.sql` | Define required versus optional terms, variant mapping and PO snapshot contract |
| Product-role compatibility | Existing supplier role data must not be misrepresented as a Supplier master; no automatic migration in this slice | Existing source evidence and approved no-migration boundary | Local `ProductPartyRole` can be listed; Supabase adapter returns an empty list | `EXISTS_BUT_CONFLICTS` | `src/loopdev/domains/catalog/adapter/local.ts`; `adapter/supabase.ts`; `catalog-adapter.test.ts` | Preserve existing records; any future reconciliation needs separate approval |
| Access | Same user profiles that access Products access Suppliers, using Supplier-specific grants and organization scope | User-approved access policy in `discovery.md` and the plan checkpoint | Catalog enforces `catalog.read` / `catalog.write`; no Supplier contract exists | `EXISTS_PARTIALLY` | Catalog adapter; `supabase/migrations/20260807000000_platform_core_permissions.sql`; plan checkpoint | Audit and implement Supplier grants/RLS/audit without broadening `catalog.read` |
| Supplier P2P master setup | Jurisdiction-aware tax identity/defaults, purchase defaults, role-based contacts/addresses, finance mapping and verified payee instructions; visible to all users with Supplier access | User-confirmed purchase–receive–pay readiness and visibility choice | Not present in supplier-specific code | `MISSING` | `discovery.md`; no Supplier domain found | Design fields and audit; reconcile broad field visibility with `erp/core/access-model.md` |
| Procurement transactions | Purchase orders, actual receipts/stock postings, invoices and payments consume Supplier/SupplierItem but remain records of Procurement, Inventory and Finance | User-confirmed end-to-end outcome; transaction ownership remains bounded by ERP core | No purchasing transaction flow in this module | `MISSING` | ERP core discovery; benchmark register | Scope transaction workflows in their owning module slices; keep history off Supplier |
| Responsive web parity | Desktop and mobile web use the same operations adapted to viewport/touch; no native apps | User-confirmed platform decision | No Supplier domain, route, or renderer exists | `MISSING` | `platform-scope.md`; `platform-evidence-matrix.md` | Define responsive adaptations and verify every operation in design/build |
| CSV catalog import | Excluded from this slice; manual entry is the baseline | User-approved deferral; Odoo benchmark is informative only | No supplier import flow exists | `OUT_OF_SCOPE` | `delivery-ledger.json`; `SUPPLIER-CSV-BOUNDARY` | Reopen only with separate scope approval |

## Interpretation

- `EXISTS_BUT_CONFLICTS` describes a mismatch between existing product-bound or
  free-text supplier data and a reusable Supplier/SupplierItem model. It does
  not mean the current Product Catalog feature is defective.
- Existing CRM contacts are not evidence that suppliers must be CRM contacts.
  CRM is out of scope by default.
- The benchmark informs options; the user has now confirmed Supplier P2P master
  data and SupplierItem purchasing terms. It does not authorize transaction
  workflows in this module; CSV remains optional and its implementation details
  are open.
- Only explicitly approved, non-tax-dependent ledger tasks may proceed. The
  country-specific tax profile and its dependent P2P domain/renderers remain
  blocked pending Finance/Legal evidence.
