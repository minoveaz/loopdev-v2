# Proveedores — View and state matrix

This matrix is the semantic baseline for desktop web and mobile web. Layout may
adapt; operation IDs, copy meaning, validation, permissions and state outcomes
must remain shared. iOS and Android are explicitly excluded from this pilot.

## Primary views and states

| View / flow | Desktop web | Mobile web | Loading | Empty | Error | Forbidden | Conflict | Offline | Pending | Success |
|---|---|---|---|---|---|---|---|---|---|---|
| Supplier directory | Compact sortable table, filters, pagination | Stacked cards, same search/filter/action semantics | Table skeleton/cards skeleton | First-use CTA; filtered no-match guidance | Retry without losing non-sensitive query | Explain missing access; no records shown | Refresh/reconcile stale list | Show cache freshness; disable unsupported writes | Saving indicator on row/action | Updated row and announced status |
| Supplier detail | Header, state badge, tabs/sections, P2P summary | Condensed header and stacked sections | Section skeleton | Missing optional section prompts setup | Retry per section; preserve visible safe data | Hide record and sensitive details | Identify stale version and reload/compare | Cached general fields only; real tax/bank values not shown from clear cache | Mutation-specific status | Saved timestamp/version announced |
| Create/edit Supplier | Full-page grouped form | Full-page one-column form; sticky bottom actions | Load references/options | Blank form with required identity hints | Field errors + summary; retain non-sensitive values | Read-only/blocked form | Preserve draft and offer reload/compare | Non-sensitive draft allowed; no real tax/bank write or queue | Disable duplicate submission; show save status | Navigate to detail after confirmed save |
| Contacts / addresses | Form sections and typed records | Stacked section rows | Section skeleton | Add role/address CTA | Explain invalid reference/format | Follow parent record access | Version conflict per Supplier | Safe draft only | Save indicator | Updated function/default shown |
| Tax and finance setup | Jurisdiction-specific sections, full values for all authorized Supplier readers | Collapsible sections; labels remain visible | Skeleton, never blank-success | Explain required setup conditionally | Validation per jurisdiction, no silent acceptance | Per Supplier policy; no cross-org data | Preserve draft; compare server version | No real values from unprotected cache; block sensitive mutation | Explicit verification/review state | Audit confirmation without echoing full values |
| Payment instructions | Full account detail and verification state; synthetic wireframe data only | Stacked detail, full field labels, state text | Skeleton | Add instruction if permitted | Retry/validation; no success-shaped fallback | Hide record/action according to server decision | Material changes invalidate prior verification | No real tax/bank value in local cache; no offline read, edit or queued mutation | `unverified`/`pending_review` stated textually; only owner/admin may verify, distinct from editor | Verified state and actor/time; no duplicate mutation |
| SupplierItem assortment | Table with supplier reference, Product/variant, UOM/conversion, price and validity | Cards preserving all fields and actions | Table/card skeleton | Add first SupplierItem CTA | Retry and keep non-sensitive filters | Same organization and Products permission checks | Version conflict; never overwrite Product | Existing safe offers can be labeled stale; no sensitive values in cache | Save/link pending | Link to canonical Product or its variant and updated terms |
| Optional CSV intake | Deferred; no entry point in this slice | Deferred; no entry point in this slice | Not applicable in this slice | Not applicable in this slice | Not applicable in this slice | Future import requires separate approval | Future import duplicate/match conflicts need preview | Not available offline | Not applicable in this slice | Not applicable in this slice |

## Shared operation parity

The IDs below are owned by `delivery-ledger.json`. Desktop and mobile render
the same operation; adaptation is layout only. Keep every operation `missing`
until implementation evidence exists.

| Capability | Operation ID | Desktop web | Mobile web | iOS | Android | Permission/state notes |
|---|---|---|---|---|---|---|
| `CAP-ERP-SUPPLIER-DIRECTORY` | `list_suppliers` | Missing | Missing | Not applicable | Not applicable | Supplier-specific read grant; organization scope |
| `CAP-ERP-SUPPLIER-DIRECTORY` | `search_suppliers` | Missing | Missing | Not applicable | Not applicable | Same query semantics; use Supplier-specific read grant |
| `CAP-ERP-SUPPLIER-DIRECTORY` | `view_supplier` | Missing | Missing | Not applicable | Not applicable | Direct link must reauthorize |
| `CAP-ERP-SUPPLIER-DIRECTORY` | `create_supplier` | Missing | Missing | Not applicable | Not applicable | Supplier management grant; duplicate and validation errors |
| `CAP-ERP-SUPPLIER-DIRECTORY` | `update_supplier` | Missing | Missing | Not applicable | Not applicable | Supplier management grant; `expectedVersion` conflict |
| `CAP-ERP-SUPPLIER-DIRECTORY` | `deactivate_supplier` | Missing | Missing | Not applicable | Not applicable | Supplier management grant; open transactions retain their facts |
| `CAP-ERP-SUPPLIER-DIRECTORY` | `reactivate_supplier` | Missing | Missing | Not applicable | Not applicable | Supplier management grant; preserve audit/history |
| `CAP-ERP-SUPPLIER-P2P-SETUP` | `manage_supplier_contacts_addresses` | Missing | Missing | Not applicable | Not applicable | Supplier management grant; shared parent scope |
| `CAP-ERP-SUPPLIER-P2P-SETUP` | `manage_supplier_purchase_defaults` | Missing | Missing | Not applicable | Not applicable | Supplier management grant; snapshot downstream |
| `CAP-ERP-SUPPLIER-P2P-SETUP` | `manage_supplier_tax_profile` | Missing | Missing | Not applicable | Not applicable | Readers use Supplier-specific grant; Finance/Legal validates country rules; edits need management grant |
| `CAP-ERP-SUPPLIER-P2P-SETUP` | `manage_supplier_payee_instructions` | Missing | Missing | Not applicable | Not applicable | No clear offline cache; all changes auditable |
| `CAP-ERP-SUPPLIER-P2P-SETUP` | `verify_supplier_payee_account` | Missing | Missing | Not applicable | Not applicable | Owner/admin only; verifier differs from editor |
| `CAP-ERP-SUPPLIER-ASSORTMENT` | `list_supplier_items` | Missing | Missing | Not applicable | Not applicable | Supplier-specific read grant; canonical Product link |
| `CAP-ERP-SUPPLIER-ASSORTMENT` | `add_supplier_item` | Missing | Missing | Not applicable | Not applicable | Supplier management grant; valid purchase unit/conversion |
| `CAP-ERP-SUPPLIER-ASSORTMENT` | `link_supplier_item_to_product` | Missing | Missing | Not applicable | Not applicable | Same-organization Product or its variant; Product remains canonical |
| `CAP-ERP-SUPPLIER-ASSORTMENT` | `start_product_creation_from_supplier_item` | Missing | Missing | Not applicable | Not applicable | Hand off to Products; do not create a parallel Product form |
| `CAP-ERP-SUPPLIER-ASSORTMENT` | `update_supplier_item` | Missing | Missing | Not applicable | Not applicable | Supplier management grant; no canonical Product mutation |
| `CAP-ERP-SUPPLIER-ASSORTMENT` | `update_supplier_item_terms` | Missing | Missing | Not applicable | Not applicable | Supplier management grant; future orders snapshot values |
| `CAP-ERP-SUPPLIER-ASSORTMENT` | `deactivate_supplier_item` | Missing | Missing | Not applicable | Not applicable | Supplier management grant; historical snapshots remain |
| `CAP-ERP-SUPPLIER-CATALOG-IMPORT` | `upload_supplier_catalog_csv` | Deferred from slice | Deferred from slice | Not applicable | Not applicable | Follow-up requires separate scope approval |
| `CAP-ERP-SUPPLIER-CATALOG-IMPORT` | `preview_supplier_catalog_csv` | Deferred from slice | Deferred from slice | Not applicable | Not applicable | Preview must never mutate |
| `CAP-ERP-SUPPLIER-CATALOG-IMPORT` | `match_supplier_items` | Deferred from slice | Deferred from slice | Not applicable | Not applicable | Resolve duplicates before confirmation |
| `CAP-ERP-SUPPLIER-CATALOG-IMPORT` | `confirm_supplier_catalog_import` | Deferred from slice | Deferred from slice | Not applicable | Not applicable | Future confirm requires write grant and idempotency |

## Accessibility and responsive behavior

- Shared actions have stable accessible names; row/card actions announce the supplier name and action.
- Mobile cards expose identical operation IDs and state labels; actions are reachable without hover.
- Keyboard order follows header → search/filters → results → pagination/actions; dialogs restore focus; focus indicators use Rivera `ring`/`shadow-focus`.
- Status uses text and icon/shape where useful, never color alone. Error text is associated with controls and announced; async status uses `role=status`, errors use `role=alert`.
- At <768px, use one-column form and card list; shell sidebar remains the existing focus-managed mobile drawer. At 768px and wider, use compact table and multi-column form groups; at 1200px shell navigation follows its existing density behavior.
- Respect browser zoom/reflow and RTL; do not hide required fields or operations to fit narrow viewports. No horizontal overflow is permitted.
- Touch targets should be at least 44×44 CSS pixels for primary actions and row menus; this is a proposed acceptance threshold for the implementation.

## Decisions and owners

| Decision | State | Owner | Follow-up |
|---|---|---|---|
| Supplier route prefix and sidebar location | Open | ERP + Platform navigation | Confirm before planning route tasks |
| Tax/bank visibility and access-contract reconciliation | User-approved Supplier-specific visibility; technical contract pending | Product + Platform access owner | Preserve same-reader visibility without broadening Products access |
| CSV in first release | Deferred from this slice by user approval | Product | Re-scope separately if requested |
| Real sensitive data in local/offline cache | User-approved server-authoritative protected storage; no sensitive offline access | Platform + Security | Implement and verify before real data |
| Initial tax jurisdictions | Spain, United States and Colombia selected; exact tax rules open | Product + Finance/Legal | Validate country-specific fields from authoritative sources |
| SupplierItem Product/variant target | Product or its variant approved | ERP + Products | Enforce same-organization parent/variant integrity |
