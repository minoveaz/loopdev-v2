# ERP Core — Products access model

## Control

| Field | Value |
|---|---|
| Run | `MOD-CORE-20261024-001` |
| Phase | `03-access` |
| Status | `partial` (revalidated in attempts 11–15; Products RLS and audit controls deployed, write controls remain off) |
| Parent | `02-domain` |
| Domain input | `domain-model.md` |
| Runtime changes | Forward-only security migrations applied to `loopdev-platform-dev`; no application deployment or Product-record mutation |

This is the authorization contract and implementation record for Products and
its commercial child records. It does not change the shared Platform
authorization model. Products RLS and audit controls are deployed in the
development database, but they do not establish full module or release
readiness.

Attempts 11–15 revalidated this model against the current migration chain,
isolated pgTAP tests and read-only deployed policy checks. The deployed global
write control is false and no organization control is enabled. Product media
access is checked by `catalog.read`/`catalog.write` at the database boundary,
but the current Products adapter still bypasses the shared Files adapter and
its complete lifecycle remains pending.

## Decision status

| ID | Rule | Status | Classification | Evidence / consequence |
|---|---|---|---|---|
| `ACC-ERP-001` | Organization membership and Platform permissions are the authorization source; only active memberships authorize organization access. | `confirmed` | Authorization rule | `has_organization_permission` checks active membership in the current replacement function. |
| `ACC-ERP-002` | Existing organization roles are `owner`, `admin`, `agent` and `viewer`; use the existing permission catalog rather than new ERP roles. | `confirmed` | Authorization rule | `role_permissions` constrains these role names. Older tenancy prose uses a different role vocabulary and is not the current database contract. |
| `ACC-ERP-003` | `catalog.read` allows organization-scoped read; `catalog.write` is the canonical write permission and is granted to owner/admin/agent, not viewer. | `confirmed` | Authorization rule | Local permission types and deployed Products RLS use `catalog.write`. Legacy `catalog.manage` grants remain assigned to owner/admin/agent, but no deployed Products policy uses them. |
| `ACC-ERP-004` | Authorization is enforced server-side and at the database; hiding UI controls is never sufficient. | `confirmed` | Authorization invariant | Platform RLS guidance and current Supabase patterns. |
| `ACC-ERP-005` | Organization is the only Products access boundary for this release; workspace does not restrict product visibility. | `confirmed` | Record scope | User confirmed organization-wide Products and category scope. Legacy workspace IDs are migration provenance only. |
| `ACC-ERP-006` | Workspace-specific Products access is outside this release; Products and categories remain shared across workspaces within the organization. | `confirmed` | Record scope | `DOM-ERP-007` confirms organization-wide ownership. Legacy workspace values are migration provenance, not authorization scope. |
| `ACC-ERP-007` | Product data has no record assignee/team ACL; organization membership and module permission govern access. | `assumed` | Record scope / delegation | No assignee or team ACL is present in the current product model. Revisit only with approved domain requirements. |
| `ACC-ERP-008` | Any `catalog.read` role may read Products, offers and sales prices; purchase costs require the separate cost permissions. Exports and permanent deletion are disabled for this release. | `confirmed` | Sensitive action/field policy | Sales-price visibility and archive-only lifecycle are approved; cost visibility is governed by `ACC-ERP-012`. |
| `ACC-ERP-009` | Shared Notes, Files, Activity, Tasks, Relations and Document Intelligence reuse their Platform authorization contracts and inherit access to the referenced ERP record. | `confirmed` | Shared capability rule | Do not create parallel ERP collaboration permissions. A reference must not grant access beyond the referenced record. |
| `ACC-ERP-010` | Membership changes and permission grants remain owned by Platform organization-management permissions, not Products. | `confirmed` | Authorization invariant | `organization.manage` is the existing membership-management boundary. |
| `ACC-ERP-011` | Every successful remote Products mutation must create an immutable Platform audit event in the same transaction; if audit persistence fails, the mutation fails. | `confirmed` | Audit invariant | User approved extending the shared Platform audit capability before enabling remote writes. |
| `ACC-ERP-012` | Cost read and management use separate `catalog.cost.read` and `catalog.cost.manage` permissions. Grant both only to organization owners/admins by default; agents and viewers receive neither. | `confirmed` | Sensitive-field authorization | Product Owner selected the owner/admin-only policy. Neither permission is implied by `catalog.read` or `catalog.write`. |
| `ACC-ERP-013` | Product/SKU associations use catalog permissions; file metadata, bytes, upload, preview and lifecycle reuse the approved Platform Files boundary and cannot inherit broader access from the association. | `confirmed` | Shared capability authorization | Platform Files owns upload/finalization, preview authorization, 300-second maximum signed-URL lifetime, renditions, retention and orphan recovery. Products owns same-organization asset/assignment references and contextual alt text; implementation remains pending. |

## Role, action and scope matrix

The database now enforces the core permission matrix below. Application
operation parity and the shared Files lifecycle are not yet complete. Agents
retain ordinary catalog writes through `catalog.write`, but the Product Owner
explicitly excluded agents from the separate cost permissions.

| Action | Owner | Admin | Agent | Viewer | Scope / status |
|---|---|---|---|---|---|
| Read Products, categories, variants, offers and price books/entries | `catalog.read` | `catalog.read` | `catalog.read` | `catalog.read` | Own organization; shared organization records visible to its workspaces. Role grants are current baseline. |
| Create/update product, category, variant, offer or price entry | `catalog.write` | `catalog.write` | `catalog.write` | Deny | Canonical Platform permission; preserve existing owner/admin/agent write grants. |
| Archive/restore a record | `catalog.write` | `catalog.write` | `catalog.write` | Deny | Archive-only lifecycle for every Products entity; validate transitions and references. |
| Permanently delete a record | Deny | Deny | Deny | Deny | Disabled for this release; use archive/restore. |
| Export product or commercial data | Deny | Deny | Deny | Deny | Export is out of scope for this release. |
| Read offers and sales prices | `catalog.read` | `catalog.read` | `catalog.read` | `catalog.read` | User approved current organization-wide read visibility. |
| Read purchase cost | `catalog.cost.read` | `catalog.cost.read` | Deny | Deny | Costs are excluded from ordinary `catalog.read`; no cost amount may leak through list/detail/search or related projections. |
| Create/update/clear purchase cost | `catalog.cost.manage` | `catalog.cost.manage` | Deny | Deny | Cost mutation is field-specific, organization-scoped and audited; it does not grant general catalog writes. Owners/admins are granted both cost permissions. |
| Read derived margin or supplier commercial terms | Not in scope | Not in scope | Not in scope | Not in scope | No margin/report/export surface is approved; supplier terms remain outside this release. |
| Attach, reorder, update alt text or detach product media | `catalog.write` | `catalog.write` | `catalog.write` | Deny | Product association only; every referenced file must independently pass Platform Files authorization. Detach never deletes the reusable file. |
| Upload or read product-media file bytes | `catalog.read` / `catalog.write` | `catalog.read` / `catalog.write` | `catalog.read` / `catalog.write` | Read via `catalog.read`; write denied | Product-media Storage paths are scoped to catalog permissions. Platform Files owns upload, preview, derivatives and lifecycle; authenticated physical deletion is denied. |
| Change organization/workspace ownership or grant membership | Deny | Deny | Deny | Deny | Platform `organization.manage` only; Products cannot transfer tenant ownership or grant access. |
| Bulk update/archive | Same permission as single-record action | Same | Same | Deny | Reauthorize every affected record and reject mixed/unauthorized scopes atomically. |

The deployed `role_permissions` mapping grants `catalog.read` to all four
organization roles and `catalog.write` to owner/admin/agent. Legacy
`catalog.manage` grants remain for owner/admin/agent, but no deployed Products
RLS policy uses that key; remove those grants only after checking other
consumers. `catalog.cost.read/manage` are registered and granted to owner/admin
only. Neither cost permission is implied by `catalog.read`, `catalog.manage`
or `catalog.write`.

## Scope and inheritance rules

- **Organization:** derive the effective organization from authenticated
  membership/context. A client-supplied `organization_id` is never authority.
  Every product and child row must be in the same organization as its parent.
- **Workspace:** Products and categories are organization-wide per
  `DOM-ERP-007`; workspace is not a target ownership or visibility boundary.
  Current `workspace_id` fields are legacy compatibility data and must not
  create workspace-specific access. Decide how existing non-null values are
  migrated before changing persistence.
- **Shared records:** all Products and category records are shared across
  workspaces within their organization, subject to organization membership
  and the applicable permission.
- **Related records:** category parents and assignments to product bases or
  SKU variants, offers, price entries, Files and collaboration references must
  resolve within the same organization. Cross-organization references are
  denied, not silently broadened.
- **Assignment/delegation:** no record-owner/team assignment is part of the
  current Products model. Do not infer access from CRM owner, supplier,
  creator, assignee or channel credentials.
- **Platform support:** platform-administrator access follows the established
  Platform support path and audit rules; do not add an ERP-specific RLS bypass.

## Sensitive data and audit

- Product name, class, category, SKU, offers and sales prices are readable by
  every organization member with `catalog.read`, including viewer.
- Purchase-cost references and values are readable only with
  `catalog.cost.read` and mutable only with `catalog.cost.manage`. Both are
  granted to owner/admin by default; agent/viewer must not receive cost data
  through product DTOs, search, caches, logs, activity, exports or background
  projections. Permission checks apply to every cost row and its parent unit.
- Margin, supplier terms, exports and payment credentials are not approved
  surfaces for this release. Do not put cost values in arbitrary `metadata`;
  never store credentials, cardholder data or unnecessary personal data.
- `metadata` is arbitrary JSON in the current model and has no field-level
  access policy. Restrict future metadata to validated allowlisted business
  fields; it must not become a path around sensitive-field controls.
- Record actor, organization/scope, action, timestamp, changed fields and
  reason where required for create/update, archive/restore, permission change,
  export, bulk action and privileged support access. Shared Activity is for
  user-facing context and does not replace an immutable audit trail.
- Current `Entity` fields and catalog schema provide timestamps but no actor,
  version, or audit history. Define the audit contract with Platform before
  remote mutations; do not claim the current catalog is auditable.
- Export must be explicitly authorized, scoped, logged and protected from
  stale cached results. Retention and deletion must follow the final domain
  policy, not the current SQL cascades.

## RLS and server enforcement requirements

1. Enable RLS on every ERP Products table and expose no service-role bypass to
   client code.
2. Use operation-specific `SELECT`, `INSERT` and `UPDATE` policies.
   `SELECT` checks `catalog.read`; `INSERT` and both sides of `UPDATE` check
   `catalog.write` and organization scope. Revoke direct `DELETE` privileges
   and create no `DELETE` policy for Products entities; the media-assignment
   table permits detach only and never deletes the shared File or object.
3. Protect `erp_product_cost_references` independently: `SELECT` requires
   `catalog.cost.read`; `INSERT` and `UPDATE` require
   `catalog.cost.manage`; revoke `DELETE`. Cost policies also validate active
   organization membership and same-organization ownership of the product or
   SKU, without returning amounts to a caller lacking cost-read permission.
4. For `UPDATE`, validate both the existing row and the resulting row so a
   caller cannot move a record to another organization or create target
   workspace-specific visibility.
5. Validate parent-child tenant equality for product/category, variant,
   offer, price book/entry, and any future category relation. Add database
   constraints where possible; RLS must not be the only referential-integrity
   mechanism.
6. Do not use workspace membership to widen or narrow Products visibility.
   Handle legacy non-null workspace IDs through an explicit migration decision.
7. Recheck permissions during server commands, background jobs, exports and
   synchronization replay. A previously authorized queued mutation is not
   permanently authorized.
8. Treat missing configuration and authorization failures explicitly; never
   fall back to local or broader-scope data on a remote denial.
9. Keep product-media association authorization separate from shared File
   record and Storage authorization. Limit catalog permissions to
   product-media paths, preserve existing Platform authorization for every
   other Files path, and deny authenticated physical deletion of product media.
   Never expose a public URL or allow `catalog.write` alone to delete a shared
   File or Storage object.

### Existing high-priority policy gap

`20260928160000_erp_catalog_foundation.sql` creates one `FOR ALL` policy per
table with `USING (catalog.read)` and `WITH CHECK (catalog.manage)`. PostgreSQL
uses `USING` for `DELETE`, so a member with read permission can delete rows
under this policy; deleting an item can also cascade to offers, variants and
price entries. The forward migrations
`20261025173000_erp_product_write_audit_controls.sql` and
`20261025174000_erp_products_operation_rls.sql` now replace those policies,
revoke physical deletes (except association detach), add cost-only permissions,
same-organization foreign keys, default-off write controls and atomic audit
triggers. Both migrations were applied to `loopdev-platform-dev` after explicit
authorization and verified read-only: migration history contains versions
`20261025173000` and `20261025174000`, there are no remaining `FOR ALL`
policies, and the audit/write-control triggers are enabled. The global write
control is false and no organization control is enabled, so Products writes
remain blocked. The migration changed schema/policy/permission configuration
only; it did not modify existing Product records.

## Shared Platform capabilities

| Capability | Authorization rule |
|---|---|
| Notes, Tasks, Relations and Activity | Reuse Platform permissions and scope semantics; linking an ERP record does not grant broader access. |
| Files and attachments | Reuse Files access checks and organization/workspace path rules; verify parent-record access for every open/download and signed URL. Product-media Storage paths use `catalog.read`/`catalog.write`; non-product paths retain prior role/personal-upload rules. Authenticated CRUD grants on Files metadata tables are explicit and RLS remains the row-level boundary. Authenticated physical deletion of product media is denied; upload, signed URL, derivative and retention lifecycle still require the shared Files implementation. |
| Document Intelligence | Reuse its owning entity's access policy for source files, extracted values and derived results; deny results when source access is revoked. |
| Memberships and roles | Reuse Platform membership lifecycle and permission matrix; only Platform organization-management actions can grant or revoke membership. |

## Authorization test cases

These tests define the security contract. The deployed migration behavior is
covered by isolated pgTAP suites 014/015; remote verification was read-only
because write controls remain disabled. Application-level cost projections,
cache invalidation and the shared Files lifecycle still need their own tests.

| ID | Scenario | Expected result |
|---|---|---|
| `ACC-TEST-001` | Active member reads a product in their organization with `catalog.read`. | Allowed only within the approved record scope. |
| `ACC-TEST-002` | Nonmember, suspended member or revoked member requests a list or direct product/category URL. | Denied or not-found without exposing existence; no cached detail shown. |
| `ACC-TEST-003` | User guesses another organization's product, variant, category, offer or price-entry ID. | RLS and adapter deny; no cross-tenant row or metadata leakage. |
| `ACC-TEST-004` | User submits another `organization_id`, changes tenant on update, or attaches a child to a foreign-tenant parent. | Denied by server and database constraints/policies. |
| `ACC-TEST-005` | Viewer attempts create/update/archive/restore/delete, including direct HTTP/SQL path. | Denied. In particular, read-only `DELETE` must be impossible. |
| `ACC-TEST-006` | Agent performs a catalog write after its permission is revoked while a page is open. | Server rejects; client invalidates permission-sensitive cached data. |
| `ACC-TEST-007` | Active members of different workspaces in the same organization read a shared Product; a member from another organization tries the same direct route. | Same-organization members with `catalog.read` see the shared Product; the other organization is denied. Legacy `workspace_id` does not change visibility. |
| `ACC-TEST-008` | Bulk action contains records from multiple scopes or one unauthorized record. | No partial unintended mutation; every row is reauthorized and the outcome is explicit. |
| `ACC-TEST-009` | Export is requested by a role without approved export authority. | Denied and logged; exported rows remain scoped and no stale export is reused after revocation. |
| `ACC-TEST-010` | User opens a linked attachment, Note, Task, Relation or Document Intelligence result after losing parent-record access. | Access is denied by the owning Platform capability; source/result content is not disclosed. |
| `ACC-TEST-011` | Offline mutation is replayed after membership or permission revocation. | Reauthorize at replay; reject/quarantine and surface a conflict without applying the write. |
| `ACC-TEST-012` | Platform support or organization-admin path accesses product records. | Only the established, explicitly authorized and audited path succeeds; no client-set bypass. |
| `ACC-TEST-013` | Agent/viewer requests cost references through list, detail, search, direct database/API query or a joined Product response. | Denied or omitted without amount, currency, existence, cache or metadata leakage. |
| `ACC-TEST-014` | Owner/admin with both cost permissions reads and mutates a product-level or SKU-level cost; an agent with `catalog.write` but no cost permission attempts the same. | Owner/admin succeeds within organization scope and the mutation is audited; agent is denied for both read and write. |
| `ACC-TEST-015` | A cached cost view remains open after `catalog.cost.read` is revoked, or an offline cost mutation replays after `catalog.cost.manage` is revoked. | Cached sensitive values are cleared; server rejects the replay and records the conflict without applying it. |
| `ACC-TEST-016` | User with `catalog.write` detaches a product/SKU image or attempts to delete its shared file/Storage object. | Detach is allowed and leaves the reusable File intact; physical file/object deletion is denied. |
| `ACC-TEST-017` | User obtains or reuses a signed URL after losing organization or parent-record access, or references a File from another organization. | New URL issuance is denied after access loss and cross-organization references never resolve. Previously issued bearer URLs remain usable until expiry; the current Products adapter sets a one-hour expiry, so the shared Files contract must approve and test the acceptable revocation window. |
| `ACC-TEST-018` | Owner/admin cost change is sent to ordinary Activity, application logs, export or a background projection. | Audit metadata is recorded under the approved Platform contract; ordinary surfaces do not expose raw cost values. |

## Existing implementation gaps and risks

| Finding | Evidence | Required action |
|---|---|---|
| Historical foundation migration used `catalog.manage`; current local permission contract and deployed Products policies use `catalog.write`. | `src/loopdev/domains/catalog/adapter/local.ts`, `src/loopdev/domains/platform/types.ts`, `20260928160000_erp_catalog_foundation.sql`, `20261025174000_erp_products_operation_rls.sql` | Resolved in the forward migration; retain role/policy parity tests when permissions evolve. |
| Historical broad policy used read permission for all operations, including deletes. | ERP foundation migration; replaced by `20261025174000_erp_products_operation_rls.sql` | Resolved remotely on 2026-10-25; retain regression coverage for read-only delete and operation-specific policies. |
| Products are organization-wide but local visibility may still apply workspace filtering; the target and existing local behavior can diverge. | Catalog adapters and `isScopeVisible` | Align local and remote adapter tests with organization-wide visibility; treat legacy workspace values only as migration provenance. |
| `ProductPartyRole`, `CatalogAvailability` and `CatalogEligibility` are local-only in the current Supabase adapter and have no table in the reviewed migration. | Supabase adapter and migration | Keep out of remote access promises until their product scope and persistence are approved. |
| Hard delete cascades through commercial children; existing adapters expose physical deletes. | ERP migration and catalog tests | Remove delete actions from all adapters and deny SQL deletes; archive/restore only for this release. |
| Cost references now use `catalog.cost.read/manage` remotely, with grants only for owner/admin. | `20261025174000_erp_products_operation_rls.sql`; `src/loopdev/domains/platform/types.ts`; `015_erp_products_operation_rls.sql`; remote read-only verification in build attempt 13 | Keep writes disabled; separately verify cost visibility through application queries, caches, logs and search before enabling. |
| Remote media policies now require the Products control for product-media writes, preserve non-product Files rules, deny physical object deletion and permit association detach without deleting the reusable File. The Products adapter still reads metadata and creates one-hour signed URLs directly through Supabase Storage. | `20261025174000_erp_products_operation_rls.sql`; `015_erp_products_operation_rls.sql`; `src/loopdev/domains/catalog/adapter/product-media-supabase.ts`; remote read-only verification in build attempt 13 | Complete the approved shared Files integration, decide/test signed-URL revocation window, and verify metadata, lifecycle, retention and orphan recovery before enabling uploads. |
| Shared audit integration and default-off global/per-organization controls are deployed. The global control is false and no organization control is enabled; active-retention/archive operations remain unverified. | `20261025173000_erp_product_write_audit_controls.sql`; `014_erp_product_write_audit.sql`; remote read-only verification in build attempt 13 | Keep writes disabled; verify the approved six-month active-retention operation before release. |
| Old tenancy documentation and current permission migrations use different role vocabularies. | `MULTI_TENANCY_STRATEGY.md`, `20260807000000_platform_core_permissions.sql` | Treat current Platform permission contract as baseline; reconcile docs in the owning Platform work. |

## Open questions and risks

1. Product Owner approved extending shared Files for the gallery. The shared
   contract now sets a 300-second maximum preview URL lifetime. Product media
   metadata/Storage controls and the Products audit are deployed, but the
   current adapter still signs previews directly for one hour; its integration
   must be replaced before this contract is in effect at runtime.
2. The linked security migrations are deployed and verified, but no pre-cutover
   backup or recovery rehearsal was performed. Products writes remain disabled;
   preserve that state until the remaining data and security checks pass.
3. Review actual legacy workspace/category data in a dry run before
   organization-wide cutover; this repository contains no authorized
   production data export.

| Open decision / gate | Owner | Impact | Proposed default | Exact approval or evidence needed |
|---|---|---|---|---|
| `ACC-ERP-013`: product-media Files integration | Platform Files + ERP | Cross-tenant file disclosure, stale bearer URL access after permission revocation, deletion of reusable assets, or authorization broader than the parent Product | Apply `catalog.read`/`catalog.write` only to product-media paths; preserve existing non-product Files rules; detach leaves the shared File intact; deny authenticated physical object deletion; signed previews expire within 300 seconds. | Contract approved in build attempt 15. Implement and test the shared Files adapter, table/lifecycle authorization and orphan recovery before enabling uploads. |
| `ACC-ERP-REMOTE-001`: deployed Products RLS/write controls and recovery | Platform DB owner + Product Owner | Incorrect policy state or failed recovery could expose or interrupt tenant data | Keep remote Products writes disabled until a recovery rehearsal and remaining data checks pass | Migrations applied and policy/grant/control/trigger state verified remotely. Still required: immutable pre-cutover backup evidence and forward-only recovery rehearsal. |
| `ACC-ERP-COST-001`: deployed cost permission state | Platform + ERP | Cost disclosure through queries, caches, logs, search or RLS | Separate `catalog.cost.read`/`catalog.cost.manage`, owner/admin only; agents/viewers receive neither | Remote role map and RLS are verified; verify application query/cache/log/search surfaces before enabling cost operations. |
| `ACC-ERP-AUDIT-001`: deployed Products audit integration and retention | Platform + ERP | Untraceable remote mutation, write without audit, or stale audit retention | Use the approved append-only Platform event in the same transaction; redact values and abort mutation on audit failure | Remote audit triggers and atomicity are covered by local tests; separately confirm the six-month retention/archive operation before release. |

## Handoff

**Status: `partial`.** The forward migrations implement
operation-specific Products policies, cost-specific permissions,
same-organization foreign keys, default-off global/organization write
controls, media write gating and redacted same-transaction audit. Both pgTAP
suites pass in isolation, and both migrations are deployed to
`loopdev-platform-dev`. Read-only checks confirm operation-specific policies,
owner/admin-only costs, enabled audit/control triggers and zero organizations
with writes enabled. No Product records were changed. Remote Products
mutations remain blocked until recovery evidence, legacy-data review, Files
lifecycle/security checks and the remaining release gates pass.
