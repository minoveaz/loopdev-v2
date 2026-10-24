# ERP Core — Products access model

## Control

| Field | Value |
|---|---|
| Run | `MOD-CORE-20261024-001` |
| Phase | `03-access` |
| Status | `partial` |
| Parent | `02-domain` |
| Domain input | `domain-model.md` |
| Runtime changes | None |

This is an authorization contract proposal for Products and its current
commercial child records. It does not grant permissions, implement RLS, or
change the shared Platform authorization model. The current migration and
adapters are evidence, not proof that the policy is deployed or safe.

## Decision status

| ID | Rule | Status | Classification | Evidence / consequence |
|---|---|---|---|---|
| `ACC-ERP-001` | Organization membership and Platform permissions are the authorization source; only active memberships authorize organization access. | `confirmed` | Authorization rule | `has_organization_permission` checks active membership in the current replacement function. |
| `ACC-ERP-002` | Existing organization roles are `owner`, `admin`, `agent` and `viewer`; use the existing permission catalog rather than new ERP roles. | `confirmed` | Authorization rule | `role_permissions` constrains these role names. Older tenancy prose uses a different role vocabulary and is not the current database contract. |
| `ACC-ERP-003` | `catalog.read` allows organization-scoped read; `catalog.write` is the canonical write permission and remains granted to owner/admin/agent, not viewer. | `confirmed` | Authorization rule | `PlatformPermission` and the local adapter use `catalog.write`; the remote migration must be aligned through a forward migration. |
| `ACC-ERP-004` | Authorization is enforced server-side and at the database; hiding UI controls is never sufficient. | `confirmed` | Authorization invariant | Platform RLS guidance and current Supabase patterns. |
| `ACC-ERP-005` | Organization is the only Products access boundary for this release; workspace does not restrict product visibility. | `confirmed` | Record scope | User confirmed organization-wide Products and category scope. Legacy workspace IDs are migration provenance only. |
| `ACC-ERP-006` | Workspace-specific Products access requires an explicit Platform scope contract and same-organization workspace integrity checks. | `open` | Record scope | The workspace suite constraint excludes `erp`; catalog RLS checks only organization permission and the catalog schema has no workspace FK. |
| `ACC-ERP-007` | Product data has no record assignee/team ACL; organization membership and module permission govern access. | `assumed` | Record scope / delegation | No assignee or team ACL is present in the current product model. Revisit only with approved domain requirements. |
| `ACC-ERP-008` | Any `catalog.read` role may read Products, offers and sales prices. Cost, margin, supplier terms and exports are out of scope; permanent deletion is disabled for all Products entities in this release. | `confirmed` | Sensitive action/field policy | User approved sales-price visibility for all readers, excluded costs/margins, and chose archive-only lifecycle. |
| `ACC-ERP-009` | Shared Notes, Files, Activity, Tasks, Relations and Document Intelligence reuse their Platform authorization contracts and inherit access to the referenced ERP record. | `confirmed` | Shared capability rule | Do not create parallel ERP collaboration permissions. A reference must not grant access beyond the referenced record. |
| `ACC-ERP-010` | Membership changes and permission grants remain owned by Platform organization-management permissions, not Products. | `confirmed` | Authorization invariant | `organization.manage` is the existing membership-management boundary. |
| `ACC-ERP-011` | Every successful remote Products mutation must create an immutable Platform audit event in the same transaction; if audit persistence fails, the mutation fails. | `confirmed` | Audit invariant | User approved extending the shared Platform audit capability before enabling remote writes. |

## Role, action and scope matrix

This is the recommended target baseline, not a claim that all paths currently
enforce it. `catalog.manage` currently grants broad writes, including to
`agent`; whether that role should retain all product/commercial actions needs
Product Owner approval.

| Action | Owner | Admin | Agent | Viewer | Scope / status |
|---|---|---|---|---|---|
| Read Products, categories, variants, offers and price books/entries | `catalog.read` | `catalog.read` | `catalog.read` | `catalog.read` | Own organization; shared organization records visible to its workspaces. Role grants are current baseline. |
| Create/update product, category, variant, offer or price entry | `catalog.write` | `catalog.write` | `catalog.write` | Deny | Canonical Platform permission; preserve existing owner/admin/agent write grants. |
| Archive/restore a record | `catalog.write` | `catalog.write` | `catalog.write` | Deny | Archive-only lifecycle for every Products entity; validate transitions and references. |
| Permanently delete a record | Deny | Deny | Deny | Deny | Disabled for this release; use archive/restore. |
| Export product or commercial data | Deny | Deny | Deny | Deny | Export is out of scope for this release. |
| Read offers and sales prices | `catalog.read` | `catalog.read` | `catalog.read` | `catalog.read` | User approved current organization-wide read visibility. |
| Read cost, margin or supplier commercial terms | Not in scope | Not in scope | Not in scope | Not in scope | These fields are excluded from this release, not merely hidden by UI. |
| Change organization/workspace ownership or grant membership | Deny | Deny | Deny | Deny | Platform `organization.manage` only; Products cannot transfer tenant ownership or grant access. |
| Bulk update/archive | Same permission as single-record action | Same | Same | Deny | Reauthorize every affected record and reject mixed/unauthorized scopes atomically. |

The database `role_permissions` mapping currently grants `catalog.read` and
`catalog.manage` to owner/admin/agent and read-only to viewer. This confirms
the current grant set, not the target's least-privilege decision. In
particular, price-sensitive and destructive operations may need a narrower
permission later; do not silently add or rename permissions in this phase.

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
- Cost, margin, supplier commercial terms, exports and payment credentials are
  excluded from this release. Do not add them to `metadata`; never store
  credentials, cardholder data or unnecessary personal data there.
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
3. For `UPDATE`, validate both the existing row and the resulting row so a
   caller cannot move a record to another organization or create target
   workspace-specific visibility.
4. Validate parent-child tenant equality for product/category, variant,
   offer, price book/entry, and any future category relation. Add database
   constraints where possible; RLS must not be the only referential-integrity
   mechanism.
5. Do not use workspace membership to widen or narrow Products visibility.
   Handle legacy non-null workspace IDs through an explicit migration decision.
6. Recheck permissions during server commands, background jobs, exports and
   synchronization replay. A previously authorized queued mutation is not
   permanently authorized.
7. Treat missing configuration and authorization failures explicitly; never
   fall back to local or broader-scope data on a remote denial.

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
| Files and attachments | Reuse Files access checks and organization/workspace path rules; verify parent-record access for every open/download and signed URL. |
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
| `ACC-TEST-006` | Agent performs a manage action after its permission is revoked while a page is open. | Server rejects; client invalidates permission-sensitive cached data. |
| `ACC-TEST-007` | Workspace access is tested before and after an approved ERP workspace contract. | Until approved, no workspace isolation is claimed; afterward, cross-workspace reads/writes are denied and shared rows follow explicit policy. |
| `ACC-TEST-008` | Bulk action contains records from multiple scopes or one unauthorized record. | No partial unintended mutation; every row is reauthorized and the outcome is explicit. |
| `ACC-TEST-009` | Export is requested by a role without approved export authority. | Denied and logged; exported rows remain scoped and no stale export is reused after revocation. |
| `ACC-TEST-010` | User opens a linked attachment, Note, Task, Relation or Document Intelligence result after losing parent-record access. | Access is denied by the owning Platform capability; source/result content is not disclosed. |
| `ACC-TEST-011` | Offline mutation is replayed after membership or permission revocation. | Reauthorize at replay; reject/quarantine and surface a conflict without applying the write. |
| `ACC-TEST-012` | Platform support or organization-admin path accesses product records. | Only the established, explicitly authorized and audited path succeeds; no client-set bypass. |

## Existing implementation gaps and risks

| Finding | Evidence | Required action |
|---|---|---|
| Local/remote write permission mismatch: local code checks `catalog.write`; migration grants and RLS use `catalog.manage`. | `src/loopdev/domains/catalog/adapter/local.ts`, `src/loopdev/domains/platform/types.ts`, `20260928160000_erp_catalog_foundation.sql` | Forward-migrate remote grants and RLS to canonical `catalog.write`; keep migration rollback documented and add adapter/role parity tests. |
| Read permission is used in the `USING` clause of an all-operations policy, including deletes. | ERP foundation migration RLS generation | Verify deployment; replace with operation-specific policy and regression-test read-only delete. |
| ERP workspace access is not part of the workspace suite allowlist; catalog policies do not enforce workspace membership/scope. | `20260811000000_platform_core_workspaces.sql`, ERP migration | Resolve domain scope and Platform support before workspace-scoped data is allowed. |
| Catalog `workspace_id` is not constrained to a workspace in the same organization. | ERP foundation migration | Add tenant-consistent references/constraints if workspace scope is approved. |
| `ProductPartyRole`, `CatalogAvailability` and `CatalogEligibility` are local-only in the current Supabase adapter and have no table in the reviewed migration. | Supabase adapter and migration | Keep out of remote access promises until their product scope and persistence are approved. |
| RLS is organization-level, while current local visibility can include workspace-specific behavior. | Catalog adapters and `isScopeVisible` | Add contract tests to ensure no local/remote scope widening. |
| Hard delete cascades through commercial children; existing adapters expose physical deletes. | ERP migration and catalog tests | Remove delete actions from all adapters and deny SQL deletes; archive/restore only for this release. |
| No generic Platform audit event contract exists in current source. | Platform backend docs/contracts and existing feature-specific audit records | Add and approve an append-only shared audit contract before enabling remote writes; do not substitute Activity. |
| Old tenancy documentation and current permission migrations use different role vocabularies. | `MULTI_TENANCY_STRATEGY.md`, `20260807000000_platform_core_permissions.sql` | Treat current Platform permission contract as baseline; reconcile docs in the owning Platform work. |

## Open questions and risks

1. Platform owner must review and approve the shared append-only audit contract
   before its implementation task begins.
2. Verify the existing migration and forward-policy migration in the deployed
   database; this review could not authenticate to the linked Supabase
   database.
3. Review actual legacy workspace/category data in a dry run before
   organization-wide cutover; this repository contains no authorized
   production data export.

## Handoff

**Status: `partial`.** Product-owner decisions now define `catalog.write`,
organization-wide scope, sales-price visibility, archive-only lifecycle and
the shared audit requirement. Remote mutations remain blocked until the
forward RLS/audit migrations are applied and verified. Legacy data still
requires a dry-run review, and the Platform owner must approve the shared
audit contract.
