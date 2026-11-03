# ERP Products Requirement Evidence Matrix

Verification snapshot for `MOD-CORE-20261024-001`, checked against the
approved first-release scope in `discovery.md` and `design.md`. The remote
Supabase Dev state was rechecked read-only on 2026-11-02. Source presence,
tests and route responses are reported separately; they do not imply release
readiness.

| Requirement ID | Product definition reference | Implementation evidence | Test/evidence link | Status | Gap/next action |
|---|---|---|---|---|---|
| `REQ-ERP-CATALOG-FOUNDATION` | `discovery.md` — Products master, variants, offers and sales prices | Product/SKU forms, local/Supabase adapters and CRM compatibility remain. Product measurements are typed and persisted independently on the product or each SKU, in kg/cm without inheritance; legacy recognized units normalize when saved. | Five focused adapter/UI suites pass (49 tests). Read-only remote inspection found five draft products, four draft SKUs and no duplicate keys, invalid category references or broken media links. | `PARTIAL` | Remote migration history ends at `20261027150000`; physical-attribute migration is absent, commercial/lifecycle completeness is unverified, and no authenticated runtime workflow was tested. |
| `REQ-ERP-PHYSICAL-ATTRIBUTES` | `domain-model.md` — independent product/SKU dimensions and weight | Local types, adapters and UI persist typed kg/cm values independently without inheritance. | `src/test/catalog/physical-attributes.test.ts`; focused product/SKU UI and adapter tests; `20261102093000_erp_catalog_physical_attributes.sql`; remote schema inspection | `FAIL` | Remote `physical_attributes` columns are absent from both `erp_catalog_items` and `erp_catalog_variants`; Docker is unavailable, so migration lint/pgTAP cannot be run locally. Validate migration 020, then deploy only with separate authorization. |
| `REQ-ERP-AUTO-IDENTIFIERS` | `discovery.md`; `domain-model.md` `DOM-ERP-008` and `DOM-ERP-022` | Local adapter generates organization-scoped numeric identifiers; product/SKU fields are read-only; Supabase migration assigns identifiers and retains previous keys for CRM compatibility. | `src/test/catalog/catalog-adapter.test.ts`; `src/test/erp/product-record-pages.test.tsx`; `src/test/erp/product-sku-manager.test.tsx`; `runs/MOD-CORE-20261024-001/07-build.md` records migration application | `PARTIAL` | Core generation and compatibility tests pass. Authenticated database creation, local PostgreSQL migration lint, and a trusted external-SKU import path remain unverified or deferred; external import is not a first-release blocker. |
| `REQ-ERP-PRODUCT-CATEGORIES` | `discovery.md` — organization-wide hierarchical category tree; `domain-model.md` `DOM-ERP-003`, `DOM-ERP-006`, `DOM-ERP-011` | Local route and category tree manager implement create/rename/reparent/archive/restore. Local migration 019 blocks archival with active assignments, while its pgTAP test expects assignments to be preserved; the remote function also blocks archival with active assignments. | `src/test/catalog/catalog-adapter.test.ts`; `src/test/erp/product-record-pages.test.tsx` (28 focused tests pass); remote function and migration-history inspection; migration `20261101124000` and pgTAP `019` are local and unvalidated | `FAIL` | Resolve the migration/test/contract mismatch first, restore Docker and run lint/pgTAP, then decide the intended remote archive behavior before deployment. |
| `REQ-ERP-PRODUCT-MEDIA` | `discovery.md`; `CR-ERP-PRODUCT-MEDIA-001` | Product/SKU upload, reusable in-context library, preview, contextual alt-text editing, Product-specific tag editing, gallery reorder and safe detach are implemented through the shared PlatformFilesPort. Product tags are stored on the ERP asset separately from general Files tags. Preview URLs renew before expiry; renewal failures remove stale previews and report errors. Remote auth/tenant behavior remains unverified. | `src/test/erp/product-media.test.tsx` (10 tests); `src/loopdev/pages/erp/ProductMediaGalleryManager.tsx`; `src/loopdev/domains/catalog/adapter/product-media-supabase.ts`; `supabase/functions/platform-files/index.ts`; `runs/MOD-CORE-20261024-001/07-build.md#attempt-21-category-archive-assignment-preservation` | `PARTIAL` | Complete authenticated remote upload/library/preview verification and verify processing recovery, rendition delivery, tenant isolation and version conflicts. |
| `REQ-ERP-COST-REFERENCE` | `design.md`; `domain-model.md`; `access-model.md` `ACC-ERP-012` | Local implementation and pgTAP require both `catalog.cost.read` and `catalog.cost.manage` for mutations; product/SKU saves are independent from cost saves. | Focused UI/adapter tests; local pgTAP (22 assertions); remote read-only policy/RPC and migration-history inspection on 2026-11-02 | `FAIL` | Remote cost mutation policies and RPC require `catalog.cost.manage` but do not require `catalog.cost.read`; migration `20261027160000` is absent remotely. Fix/validate locally before any authorized deployment; do not infer safety from role defaults. |
| `REQ-ERP-ACCESS-AUDIT` | `access-model.md` `ACC-ERP-003`, `ACC-ERP-008`, `ACC-ERP-011` | Operation-specific RLS and append-only audit controls are present remotely; RLS is enabled on main Products tables, with no `anon`/`public` policies and no authenticated `DELETE`/`TRUNCATE` grants. | Remote read-only policy, grant, function, trigger and write-control inspection on 2026-11-02; `07-build.md#attempt-13-local-products-write-security-migration`; pgTAP 014/015 | `FAIL` | The effective write function returns true for one organization with `security_gates_ready=false`; global controls/readiness are true. Reconcile and correct the fail-closed invariant with the owner before any remote mutation. Recovery and authenticated tenant-isolation behavior remain unverified. |
| `REQ-ERP-DESKTOP-MOBILE-PARITY` | `platform-scope.md`; `MULTIPLATFORM_DELIVERY_CONTRACT.md` | User confirmed desktop web plus responsive mobile web; native iOS/Android are deferred. Desktop route smoke covers Products list/edit/legacy paths; mobile web uses the same responsive routes. Prior browser access redirected to login at 560x925. | `npm run smoke:routes`; `scripts/smoke-routes.json`; `npm run validate:multiplatform`; current local check found ports 5173/5174/8080 unavailable | `NOT_TESTED` | No local runtime or authenticated session is available. Verify authenticated direct routes, refresh/back/navigation, responsive operations, accessibility, i18n/RTL and all applicable states on desktop and mobile web. |
| `REQ-ERP-PLAN-AND-RELEASE-GATES` | `implementation-plan.md`; `delivery-ledger.json`; `MODULE_DEVELOPMENT_TRACEABILITY.md` | The plan and ledger are approved with task-scoped approvals. The build checkpoint and formal verification remain blocked; `AUDIT-ROUTE-001` is the current upstream blocker, and dependent tasks remain incomplete. | `delivery-ledger.json`; `runs/MOD-CORE-20261024-001/07-build.json`; `runs/MOD-CORE-20261024-001/08-verify.json` | `PARTIAL` | Close the authenticated desktop/mobile-web route audit, then complete its dependent state/parity/accessibility and contract tasks. Finish build/verification evidence before release review; do not treat merged PRs as release approval. |
| `REQ-MIAUCRAFT-SHOPIFY` / `REQ-INHAND-NATIVE-COMMERCE` | `discovery.md` — follow-up scope | No Shopify synchronization, Inhand storefront/order/payment workflow is claimed in this release. | `discovery.md`; `README.md` scope | `NOT_APPLICABLE` | Keep deferred. Discover these as separate channel/commerce work after Products and categories are ready; do not count them as current-release implementation gaps. |

## Release blockers

- Category archive behavior conflicts across the local migration, its pgTAP
  test and the remote function. Resolve the intended contract before deploying
  migration 019; Docker and authorized legacy-category mapping remain pending.
- Product media reuses the shared Files contract and includes library reuse,
  tags and expiring-preview renewal; authenticated remote tenant/processing
  behavior remains unverified.
- Remote cost mutation policies/RPC do not enforce both read and manage; the
  local forward migration is absent remotely.
- The remote effective write gate is true for one organization even though its
  readiness flag is false. Do not treat Products writes as disabled; reconcile
  the owner-approved control state before any write.
- Product/SKU physical-attribute migration 020 is absent remotely and its
  pgTAP suite cannot be validated while Docker is unavailable.
- The plan and ledger are approved, but the authenticated route audit and its
  dependent tasks are incomplete; no authenticated tenant-scoped journey,
  legacy-data dry-run or rollback rehearsal is evidenced.

## Known deviations

- `/app/erp/products` is implemented using legacy `catalog.*` domain contracts;
  it is not yet the approved canonical Products capability contract.
- The media screen uses a product-specific Supabase adapter and media tables.
  It reuses the shared `FilePicker` and `platform_files` table, but generic
  Platform Files ownership/reusable associations have not been approved as a
  complete shared contract.
- Image tiles have a consistent square display frame, but image files are not
  resized or normalized on upload.
- Shopify, Inhand commerce, native apps, inventory, suppliers and other ERP
  modules are intentionally outside this release.
