# Platform evidence matrix

> The original rows below record the pre-build baseline. The current build
> evidence for Supplier assortment supersedes those rows only for the domain
> operations listed in the addendum; renderer parity is still incomplete.

| Capability/operation | Domain parity | Desktop renderer/action | Mobile renderer/action | iOS | Android | Status | Owner | Gap/next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `supplier_directory.list_suppliers` | Not tested; no Supplier domain | Missing; no route | Missing; no route | Excluded | Excluded | NOT_TESTED | ERP/Product | Design and implement the shared operation, then test both web surfaces |
| `supplier_directory.search_suppliers` | Not tested; no Supplier domain | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Product | Define searchable fields, then verify responsive operation parity |
| `supplier_directory.view_supplier` | Not tested; no Supplier domain | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Product | Define minimum identity/detail data |
| `supplier_directory.create_supplier` | Not tested; no Supplier domain | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Product | Define legal/tax identity, purchase defaults, contacts/addresses and duplicate behavior |
| `supplier_directory.update_supplier` | Not tested; no Supplier domain | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Product | Define versioning/conflict and audit behavior |
| `supplier_master.manage_contacts_addresses` | Not tested; no Supplier domain | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Product | Define role-based contacts and typed legal, billing, order, dispatch, remit-to and return addresses |
| `supplier_master.manage_purchase_defaults` | Not tested; no Supplier domain | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Procurement | Define currency, payment terms, default contact/address, delivery terms and lead-time behavior |
| `supplier_master.manage_tax_profile` | Not tested; no Supplier tax contract | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Finance | Define jurisdiction-aware tax identifiers/categories and visibility; reconcile ERP core access policy |
| `supplier_master.manage_payee_instructions` | Not tested; no Supplier payee contract | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Finance | Define beneficiary, payment method, bank details and auditable changes |
| `supplier_master.verify_payee_account` | Not tested; no Supplier bank verification contract | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Finance | Define verification, approval, preferred-account and history states |
| `supplier_directory.deactivate_supplier` | Not tested; no Supplier domain | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Product | Define lifecycle and reference behavior |
| `supplier_directory.reactivate_supplier` | Not tested; no Supplier domain | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Product | Define restore/reactivation and duplicate rules |
| `supplier_assortment.list_supplier_items` | Not tested; no SupplierItem contract | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Catalog | Define SupplierItem ownership and list context |
| `supplier_assortment.add_supplier_item` | Not tested; no SupplierItem contract | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Catalog | Decide minimum supplier item fields |
| `supplier_assortment.link_supplier_item_to_product` | Not tested; no SupplierItem contract | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Catalog | Decide product versus variant mapping and preserve canonical Product |
| `supplier_assortment.start_product_creation_from_supplier_item` | Not tested; no SupplierItem contract | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Catalog | Define handoff to existing Products creation flow |
| `supplier_assortment.update_supplier_item` | Not tested; no SupplierItem contract | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Catalog | Define supplier-owned versus canonical Product fields |
| `supplier_assortment.update_supplier_item_terms` | Not tested; no Supplier offer contract | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Procurement | Define purchase UOM/conversion, price/currency, minimum quantity, lead time, validity and PO snapshots |
| `supplier_assortment.deactivate_supplier_item` | Not tested; no SupplierItem contract | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Catalog | Define lifecycle and historical-link behavior |
| `supplier_catalog_import.upload_csv/preview_csv/match/confirm` | Excluded by the approved slice | Excluded; no upload or import flow | Excluded; no upload or import flow | Excluded | Excluded | NOT_TESTED | Product/ERP | Reopen only through a separately approved scope |
| `p2p.reference_supplier_on_purchase_order` | Separate Procurement transaction contract; missing | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Procurement | Scope purchase orders in their owning module; snapshot supplier and selected terms |
| `p2p.snapshot_supplier_item_terms_on_order` | Separate Procurement transaction contract; missing | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Procurement | Persist selected price, currency, UOM/conversion and supplier item on the order |
| `p2p.record_actual_receipt_in_inventory` | Separate Inventory transaction contract; missing | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Inventory | Record actual accepted/rejected quantities, destination and stock effects on receipt |
| `p2p.reference_supplier_on_invoice` | Separate Finance/AP transaction contract; missing | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Finance | Scope invoice, due-date and matching behavior in Finance/AP |
| `p2p.select_verified_payee_for_payment` | Separate Finance/payment contract; missing | Missing | Missing | Excluded | Excluded | NOT_TESTED | ERP/Finance | Define payment selection and immutable settlement history in Finance |
| Existing ProductPartyRole supplier read | Local `ProductPartyRole` only | Product-bound read; not a Supplier directory operation | Responsive parity not measured | Excluded | Excluded | PARTIAL | ERP Catalog owner | Local adapter lists roles; Supabase adapter returns empty; do not treat as Supplier master |

The approved access policy uses a Supplier-specific read grant for the same
user population that can read Products and a management grant for the Products
writer population; it does not broaden `catalog.read`. Organization scope is
server-derived, and payee verification is restricted to a different owner/admin
from the editor. The implementation audit must verify the concrete grant, RLS
and append-only audit pattern before mutations. Purchase/receipt/invoice/payment
operations belong to downstream modules and are not evidence of Supplier UI
coverage.

## Pre-build audit findings

These findings establish the baseline for the approved tasks; they do not claim
that Supplier behavior is implemented.

- **Environment truth:** branch `feature/erp-proveedores`, HEAD
  `ffd9bd16d01438f8dc3efd25be4b646861988476`; working tree already contains
  unrelated modifications; no Supplier runtime route or URL exists. Preserve
  unrelated changes. Evidence: `implementation-plan.md` and the `07-build`
  checkpoint.
- **Platform reuse:** reuse existing LoopDev/Rivera shell and controls; no
  module-local shared primitive, uploader, timeline, relation or permission
  model is approved. Evidence: `PLATFORM_V2_UI_REFERENCE.md`,
  `PLATFORM_V2_SHELL_REFERENCE.md` and `implementation-plan.md`.
- **Legacy flow:** `ProductPartyRole` is product-bound; the local adapter can
  list it and Supabase currently returns an empty list. It is not a Supplier
  master and will not be automatically migrated. Evidence:
  `expected-vs-existing-matrix.md`, catalog source and adapter tests.
- **Route/runtime:** user confirmed `ERP > Proveedores`; no application route
  exists yet. Deep-link, refresh, back and authorization checks remain in
  `SUPPLIER-ROUTE-AUDIT`. Evidence: `implementation-plan.md` and current route
  and navigation sources.
- **Surface states:** loading, empty, error, forbidden, conflict, offline,
  pending and success states are planned; runtime behavior remains
  unimplemented. Evidence: `view-state-matrix.md`.
- **Accessibility/i18n:** keyboard/focus, responsive touch behavior and
  localization are specified for both web surfaces; runtime checks remain
  pending. Evidence: `visual-design.md` and `platform-scope.md`.
- **Security/rollback:** sensitive tax/bank values are server-authoritative
  and unavailable offline; org-scoped authorization, immutable audit,
  feature-flag rollback and history preservation are approved constraints.
  Evidence: the `06-plan` checkpoint and `discovery.md`.
- **Architecture boundary:** Supplier owns its commercial master; Products
  owns canonical Products/variants; Procurement, Inventory and Finance own
  transactions. Evidence: `implementation-plan.md` and
  `expected-vs-existing-matrix.md`.
- **Responsibility/refactor safety:** keep UI, contract, domain and adapter
  responsibilities separated; preserve existing Product role behavior and
  transaction history; no broad refactor or migration is in scope. Evidence:
  `implementation-plan.md` and `expected-vs-existing-matrix.md`.

`PASS` requires verified domain, renderer and every required operation on
desktop and mobile web. A shared port, visible section or registered route
alone is not proof of operation parity. Native iOS and Android are excluded
from this pilot.

## Runtime snapshot

| Field | Value |
| --- | --- |
| Repository path | `C:\Users\o010630\copilot-worktrees\loopdev-v2\o010630-upgraded-enigma` |
| Checkout type | Branch worktree |
| Branch and HEAD | `feature/erp-proveedores` / `57dd7360b0f91ee3f2813c5e94aba708678a6ecf` |
| Desktop URL/port | `http://127.0.0.1:8080/app/erp/suppliers` — HTTP 200; protected sign-in page shown |
| Mobile URL/port | Same responsive web route; authenticated and narrow-viewport behavior not verified |
| Validation timestamp | 2026-10-25 19:28 +01:00 |

## Validation commands

The commands below are historical baseline validation for the approved
non-tax task scope. Current implementation evidence is in the build addendum;
the baseline results do not establish current runtime compliance.

| Command | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `npm run validate:delivery-ledgers` | PASS | `delivery-ledger.json` | 9 ledgers checked |
| `npm run validate:module-runs` | PASS | Run/checkpoint files | 112 checkpoint files checked |
| `npm run validate:delivery-evidence` | PASS | Delivery evidence files | 0 evidence files; no implementation evidence is claimed |
| `npm run validate:multiplatform` | PASS | Platform delivery contract and this matrix | Status tokens and required operation metadata validated |
| `npm run test:delivery` | PASS | Delivery workflow tests | 46 tests passed |
| `git --no-pager diff --check` | PASS | Working tree | No whitespace errors |

## Current build evidence addendum — 2026-10-25

| Capability/operation | Domain parity | Desktop renderer/action | Mobile renderer/action | iOS | Android | Status | Owner | Gap/next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `supplier_assortment.list_supplier_items` | Verified by adapter test | Component route renders supplier items; no authenticated browser journey | Same responsive route exists; narrow viewport not verified | Not applicable | Not applicable | PARTIAL | ERP/Catalog | Verify empty/loading/error and responsive behavior |
| `supplier_assortment.add_supplier_item` | Verified by adapter test | Add-and-link component test passes | Narrow viewport and touch behavior not verified | Not applicable | Not applicable | PARTIAL | ERP frontend | Verify authenticated flow on desktop and mobile web |
| `supplier_assortment.link_supplier_item_to_product` | Verified for same-org Product/variant and cross-org denial | Product link component test passes | Narrow viewport and touch behavior not verified | Not applicable | Not applicable | PARTIAL | ERP/Catalog | Verify browser flow and permission/error states |
| `supplier_assortment.start_product_creation_from_supplier_item` | Verified by handoff adapter test | Product handoff test passes | Narrow viewport and touch behavior not verified | Not applicable | Not applicable | PARTIAL | ERP frontend | Verify complete authenticated create-return-link journey |
| `supplier_assortment.update_supplier_item` | Verified for update and version conflict | Targeted item edit is exercised by the Supplier page component test | Same responsive route; viewport not verified | Not applicable | Not applicable | PARTIAL | ERP frontend | Verify authenticated browser flow and narrow viewport |
| `supplier_assortment.update_supplier_item_terms` | Verified by adapter test | Terms edit and rendered values are exercised by the Supplier page component test | Same responsive route; viewport not verified | Not applicable | Not applicable | PARTIAL | ERP frontend | Verify authenticated browser flow and narrow viewport |
| `supplier_assortment.deactivate_supplier_item` | Verified by adapter test, including inactive-list behavior | Component test exercises activate/deactivate/reactivate on the targeted item | Same responsive route; viewport not verified | Not applicable | Not applicable | PARTIAL | ERP frontend | Verify authenticated lifecycle flow and narrow viewport |
| `supplier_master.manage_contacts_addresses` | Local adapter versioning, validation and soft deactivation tests pass; remote RLS is not runtime-tested | Full-page form create/edit sections and validation are component-tested | Shared responsive form; narrow viewport is not browser-verified | Not applicable | Not applicable | PARTIAL | ERP frontend + Platform Access | Validate remote mutation, tenant isolation and mobile viewport after P2P migration deployment |
| `supplier_master.manage_purchase_defaults` | Local adapter validation/versioning tests pass; remote persistence is not runtime-tested | Currency, terms, delivery address and Finance reference are saved in the full-page form test | Shared responsive form; narrow viewport is not browser-verified | Not applicable | Not applicable | PARTIAL | ERP frontend | Validate remote persistence and mobile viewport |
| `supplier_master.manage_payee_instructions` | Protected Supabase adapter and audit migration are authored; remote mutation is not runtime-tested | Component verifies local demo never renders or stores bank values; protected form is present only in remote mode | Same protected responsive form; authenticated viewport is not verified | Not applicable | Not applicable | PARTIAL | ERP frontend + Finance | Apply and verify the P2P migration; confirm no sensitive read/edit/queue offline |
| `supplier_master.verify_payee_account` | SQL enforces owner/admin and editor/verifier separation; database test is pending | Component tests expose verification only to a different eligible reviewer | Same shared responsive action; mobile browser is not verified | Not applicable | Not applicable | PARTIAL | ERP QA + Platform Access | Exercise actual RLS/RPC/audit behavior with authenticated roles |
| `supplier_master.manage_tax_profile` | Blocked pending Finance/Legal field rules | Read-only pending-validation notice; no tax fields are invented | Same responsive notice | Not applicable | Not applicable | BLOCKED | Finance/Legal | Approve country-specific tax requirements before implementation |

The Supplier foundation migration `20261025120000` is applied to
`loopdev-platform-dev`. The migration history row, the three Supplier tables,
RLS enablement, expected policy counts and `supplier.read`/`supplier.manage`
permissions were verified through a read-only remote query. This confirms
schema deployment, not authenticated application CRUD.

The P2P migration `20261025181000` is authored but has not been linted against a
PostgreSQL instance or applied remotely. The current dev-server URL responds
with HTTP 200, but the browser is redirected to sign-in; authenticated visual,
CRUD, maker-checker and narrow-viewport runtime checks are therefore still
pending. Component tests cover the implemented responsive form and protected
UI behavior, not remote database authorization.

The local dev server responds on `http://127.0.0.1:8080`; direct navigation
to `/app/erp/suppliers` presents the protected sign-in page. No authenticated
application session was available, so runtime visual and CRUD checks remain
unverified. Native iOS and Android remain excluded by approved scope; mobile
web remains in scope and is not complete.
