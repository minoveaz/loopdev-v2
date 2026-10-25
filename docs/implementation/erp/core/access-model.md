# ERP Core — Products access model

## Control

| Field | Value |
|---|---|
| Run | `MOD-CORE-20261024-001` |
| Phase | `03-access` |
| Status | `partial` (revalidated in attempt 11; authorization semantics unchanged, deployed and implementation gaps refined) |
| Parent | `02-domain` |
| Domain input | `domain-model.md` |
| Runtime changes | None |

This is an authorization contract proposal for Products and its current
commercial child records. It does not grant permissions, implement RLS, or
change the shared Platform authorization model. The current migration and
adapters are evidence, not proof that the policy is deployed or safe.

Attempt 11 revalidated this model against the refreshed discovery and domain
model, the current migration chain and recorded Platform/Product Owner
approvals. The shared Files boundary and append-only audit semantics are
approved; their complete Products integration, atomicity evidence and full
deployed ERP policy state are not. The product-media Storage object-delete
policy is distinguished from still-broad media metadata-table policies.

## Decision status

| ID | Rule | Status | Classification | Evidence / consequence |
|---|---|---|---|---|
| `ACC-ERP-001` | Organization membership and Platform permissions are the authorization source; only active memberships authorize organization access. | `confirmed` | Authorization rule | `has_organization_permission` checks active membership in the current replacement function. |
| `ACC-ERP-002` | Existing organization roles are `owner`, `admin`, `agent` and `viewer`; use the existing permission catalog rather than new ERP roles. | `confirmed` | Authorization rule | `role_permissions` constrains these role names. Older tenancy prose uses a different role vocabulary and is not the current database contract. |
| `ACC-ERP-003` | `catalog.read` allows organization-scoped read; `catalog.write` is the canonical write permission and remains granted to owner/admin/agent, not viewer. | `confirmed` | Authorization rule | `PlatformPermission` and the local adapter use `catalog.write`; the remote migration must be aligned through a forward migration. |
| `ACC-ERP-004` | Authorization is enforced server-side and at the database; hiding UI controls is never sufficient. | `confirmed` | Authorization invariant | Platform RLS guidance and current Supabase patterns. |
| `ACC-ERP-005` | Organization is the only Products access boundary for this release; workspace does not restrict product visibility. | `confirmed` | Record scope | User confirmed organization-wide Products and category scope. Legacy workspace IDs are migration provenance only. |
| `ACC-ERP-006` | Workspace-specific Products access is outside this release; Products and categories remain shared across workspaces within the organization. | `confirmed` | Record scope | `DOM-ERP-007` confirms organization-wide ownership. Legacy workspace values are migration provenance, not authorization scope. |
| `ACC-ERP-007` | Product data has no record assignee/team ACL; organization membership and module permission govern access. | `assumed` | Record scope / delegation | No assignee or team ACL is present in the current product model. Revisit only with approved domain requirements. |
| `ACC-ERP-008` | Any `catalog.read` role may read Products, offers and sales prices; purchase costs require the separate cost permissions. Exports and permanent deletion are disabled for this release. | `confirmed` | Sensitive action/field policy | Sales-price visibility and archive-only lifecycle are approved; cost visibility is governed by `ACC-ERP-012`. |
| `ACC-ERP-009` | Shared Notes, Files, Activity, Tasks, Relations and Document Intelligence reuse their Platform authorization contracts and inherit access to the referenced ERP record. | `confirmed` | Shared capability rule | Do not create parallel ERP collaboration permissions. A reference must not grant access beyond the referenced record. |
| `ACC-ERP-010` | Membership changes and permission grants remain owned by Platform organization-management permissions, not Products. | `confirmed` | Authorization invariant | `organization.manage` is the existing membership-management boundary. |
| `ACC-ERP-011` | Every successful remote Products mutation must create an immutable Platform audit event in the same transaction; if audit persistence fails, the mutation fails. | `confirmed` | Audit invariant | User approved extending the shared Platform audit capability before enabling remote writes. |
| `ACC-ERP-012` | Cost read and management use separate `catalog.cost.read` and `catalog.cost.manage` permissions. Grant both only to organization owners/admins by default; agents and viewers receive neither. | `confirmed` | Sensitive-field authorization | Product Owner selected the owner/admin-only policy. Neither permission is implied by `catalog.read` or `catalog.write`. |
| `ACC-ERP-013` | Product/SKU associations use catalog permissions; file metadata, bytes, upload, preview and lifecycle reuse the approved Platform Files boundary and cannot inherit broader access from the association. | `open` | Shared capability authorization | Product Owner approved extending shared Platform Files. The deployed product-media Storage boundary uses `catalog.read`/`catalog.write`, denies authenticated physical object deletion and preserves non-product Files rules. Table-level media policies, signed-preview authorization, retention and end-to-end acceptance remain unverified. |

## Role, action and scope matrix

This is the target baseline, not a claim that all paths currently enforce it.
Agents retain ordinary catalog writes through `catalog.write`, but the
Product Owner explicitly excluded agents from the separate cost permissions.

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

The database `role_permissions` mapping currently grants `catalog.read` and
`catalog.manage` to owner/admin/agent and read-only to viewer. The target
canonical write permission is `catalog.write`; a forward migration must
reconcile the remote role map and RLS. The new cost permissions are not yet in
the shared permission type/catalog or database grants. Their approved default
grant is owner/admin only; do not infer them from `catalog.read`,
`catalog.manage` or `catalog.write`.

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
   and create no `DELETE` policy for any Products table.
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
price entries. The migration's deployment status is unverified. Treat this as
a release blocker: the implementation plan must add a forward migration with
operation-specific policies, no hard deletes, and the shared audit contract.
Remote writes remain disabled until that migration is applied and the deployed
policy state is verified.

## Shared Platform capabilities

| Capability | Authorization rule |
|---|---|
| Notes, Tasks, Relations and Activity | Reuse Platform permissions and scope semantics; linking an ERP record does not grant broader access. |
| Files and attachments | Reuse Files access checks and organization/workspace path rules; verify parent-record access for every open/download and signed URL. Product-media Storage paths use `catalog.read`/`catalog.write`; non-product paths retain prior role/personal-upload rules. Authenticated CRUD grants on Files metadata tables are explicit and RLS remains the row-level boundary. Authenticated physical deletion of product media is denied; upload, signed URL, derivative and retention lifecycle still require the shared Files implementation. |
| Document Intelligence | Reuse its owning entity's access policy for source files, extracted values and derived results; deny results when source access is revoked. |
| Memberships and roles | Reuse Platform membership lifecycle and permission matrix; only Platform organization-management actions can grant or revoke membership. |

## Authorization test cases

These are required tests for implementation; no new security or runtime test
was run in this design phase.

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
| `ACC-TEST-017` | User obtains or reuses a signed URL after losing organization or parent-record access, or references a File from another organization. | URL/data access is denied or expires; cross-organization references never resolve. |
| `ACC-TEST-018` | Owner/admin cost change is sent to ordinary Activity, application logs, export or a background projection. | Audit metadata is recorded under the approved Platform contract; ordinary surfaces do not expose raw cost values. |

## Existing implementation gaps and risks

| Finding | Evidence | Required action |
|---|---|---|
| Local/remote write permission mismatch: local code checks `catalog.write`; migration grants and RLS use `catalog.manage`. | `src/loopdev/domains/catalog/adapter/local.ts`, `src/loopdev/domains/platform/types.ts`, `20260928160000_erp_catalog_foundation.sql` | Forward-migrate remote grants and RLS to canonical `catalog.write`; keep migration rollback documented and add adapter/role parity tests. |
| Read permission is used in the `USING` clause of an all-operations policy, including deletes. | ERP foundation migration RLS generation | Verify deployment; replace with operation-specific policy and regression-test read-only delete. |
| Products are organization-wide but local visibility may still apply workspace filtering; the target and existing local behavior can diverge. | Catalog adapters and `isScopeVisible` | Align local and remote adapter tests with organization-wide visibility; treat legacy workspace values only as migration provenance. |
| `ProductPartyRole`, `CatalogAvailability` and `CatalogEligibility` are local-only in the current Supabase adapter and have no table in the reviewed migration. | Supabase adapter and migration | Keep out of remote access promises until their product scope and persistence are approved. |
| Hard delete cascades through commercial children; existing adapters expose physical deletes. | ERP migration and catalog tests | Remove delete actions from all adapters and deny SQL deletes; archive/restore only for this release. |
| Cost references are readable and writable with broad `catalog.write`; the shared permission catalog/type has no cost-specific keys. | `20261024180000_erp_product_details_and_references.sql`, `src/loopdev/domains/platform/types.ts`, existing `role_permissions` migration | Add `catalog.cost.read/manage` through the Platform permission contract; grant only owner/admin by default; field-level DTO/query/RLS/cache tests must prove agents and viewers cannot infer cost values. |
| Product-media asset/assignment tables still grant `DELETE` through `FOR ALL` policies to `catalog.write`; the initial Storage policy also allowed product-media object deletion. Forward migrations scope Storage permissions to the product-media path and deny authenticated object deletion, but do not replace the table-level `FOR ALL` policies. | `20261025100000_erp_product_media_library.sql`, `20261025120145_erp_product_media_storage_policy_hardening.sql`, `20261025120200_erp_product_media_no_direct_delete.sql` | Decide and test whether table deletion is only a safe detach/archive operation; preserve reusable Files and prevent cascades, then replace broad policies with operation-specific checks where required. Do not infer Storage deletion protection from table-policy behavior. |
| Shared Platform Files has membership-based organization reads/writes and a role-based delete policy for owner/admin/agent, not a Files permission key or product-aware retention guard. | `20261011100000_platform_private_user_files.sql`, `20260930020000_document_intelligence_delete_policies.sql` | Product-media paths are excluded from authenticated Storage deletion; Platform still owns the shared upload, signed URL, derivative and retention lifecycle. |
| The shared append-only audit table and `record_platform_audit_event` function exist, and their semantics are approved, but no Products mutation call site or same-transaction failure test was found. | `supabase/migrations/20260915000000_platform_security_hardening.sql`; Products source/migration audit | Integrate Products mutations with the shared audit capability and prove transaction rollback on audit failure; do not substitute Activity. |
| Old tenancy documentation and current permission migrations use different role vocabularies. | `MULTI_TENANCY_STRATEGY.md`, `20260807000000_platform_core_permissions.sql` | Treat current Platform permission contract as baseline; reconcile docs in the owning Platform work. |

## Open questions and risks

1. Product Owner approved extending shared Files for the gallery, and the
   product-media Storage policy boundary is deployed. File lifecycle,
   table-level media policy behavior and acceptance remain open. Platform
   owner approved append-only audit semantics, but Product mutation call sites
   and atomicity tests are still required before remote writes.
2. Product-media Storage policy migrations are applied and verified in
   `loopdev-platform-dev`; full deployed ERP RLS/schema state remains
   unverified.
3. Review actual legacy workspace/category data in a dry run before
   organization-wide cutover; this repository contains no authorized
   production data export.

| Open decision / gate | Owner | Impact | Proposed default | Exact approval or evidence needed |
|---|---|---|---|---|
| `ACC-ERP-013`: product-media metadata, signed previews and table-level lifecycle | Platform Files + ERP | Cross-tenant file disclosure, deletion of reusable assets, or authorization broader than the parent Product | Apply `catalog.read`/`catalog.write` only to product-media paths; preserve existing non-product Files rules; detach leaves the shared File intact; deny authenticated physical object deletion | Platform owner accepts metadata-RLS and signed-preview behavior, table delete semantics and retention tests. The existing scope approval does not approve implementation or deployment. |
| `ACC-ERP-REMOTE-001`: full deployed ERP RLS/grant state | Platform DB owner | Remote writes could use broader deployed policies than the reviewed source | Keep remote Products writes disabled; inspect deployed schema, grants, RLS and kill-switch state read-only | Provide authorized read-only database access and record a Platform DB owner-reviewed deployed-state snapshot. |
| `ACC-ERP-COST-001`: cost permission implementation | Platform + ERP | Cost disclosure through queries, caches, logs, search or RLS | Separate `catalog.cost.read`/`catalog.cost.manage`, owner/admin only; agents/viewers receive neither | Product semantics/grants are already approved; close with shared permission registration, DTO/adapter/RLS implementation and negative role tests. |
| `ACC-ERP-AUDIT-001`: Products audit integration | Platform + ERP | Untraceable remote mutation or committed write without its audit event | Use the approved append-only Platform event in the same transaction; redact sensitive values and abort mutation if audit persistence fails | Audit semantics are already approved; close with Products call sites, same-transaction failure/rollback tests and a verified recovery control. |

## Handoff

**Status: `partial`.** Product-owner decisions define `catalog.write`,
organization-wide scope, sales-price visibility, archive-only lifecycle, and
owner/admin-only `catalog.cost.read/manage`. Cost RLS and permission grants
remain unimplemented; media Storage paths are hardened, but media table
`FOR ALL` policies, full deployed ERP RLS/schema state and end-to-end Files
behavior remain unverified. Audit semantics are approved; Products audit
integration and atomicity tests remain incomplete. Remote mutations stay
blocked until those controls and the authorized legacy-data dry run pass.
