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
| `ACC-ERP-003` | `catalog.read` allows organization-scoped read; `catalog.manage` is the canonical remote write permission, currently granted to owner/admin/agent. | `assumed` | Authorization rule | SQL migration uses `catalog.manage`; local adapter and Platform type use `catalog.write`. Resolve parity before implementation. |
| `ACC-ERP-004` | Authorization is enforced server-side and at the database; hiding UI controls is never sufficient. | `confirmed` | Authorization invariant | Platform RLS guidance and current Supabase patterns. |
| `ACC-ERP-005` | Organization is the only approved Products access boundary for the first domain contract. | `assumed` | Record scope | Domain model leaves organization/workspace taxonomy ownership open. Do not rely on a client-selected workspace as a security boundary. |
| `ACC-ERP-006` | Workspace-specific Products access requires an explicit Platform scope contract and same-organization workspace integrity checks. | `open` | Record scope | The workspace suite constraint excludes `erp`; catalog RLS checks only organization permission and the catalog schema has no workspace FK. |
| `ACC-ERP-007` | Product data has no record assignee/team ACL; organization membership and module permission govern access. | `assumed` | Record scope / delegation | No assignee or team ACL is present in the current product model. Revisit only with approved domain requirements. |
| `ACC-ERP-008` | Permanent deletion, export, cost/margin visibility and release of unpublished commercial terms need explicit policy; they are not implied by `catalog.manage`. | `open` | Sensitive action/field policy | These operations are not differentiated in the current permission set or product definition. |
| `ACC-ERP-009` | Shared Notes, Files, Activity, Tasks, Relations and Document Intelligence reuse their Platform authorization contracts and inherit access to the referenced ERP record. | `confirmed` | Shared capability rule | Do not create parallel ERP collaboration permissions. A reference must not grant access beyond the referenced record. |
| `ACC-ERP-010` | Membership changes and permission grants remain owned by Platform organization-management permissions, not Products. | `confirmed` | Authorization invariant | `organization.manage` is the existing membership-management boundary. |

## Role, action and scope matrix

This is the recommended target baseline, not a claim that all paths currently
enforce it. `catalog.manage` currently grants broad writes, including to
`agent`; whether that role should retain all product/commercial actions needs
Product Owner approval.

| Action | Owner | Admin | Agent | Viewer | Scope / status |
|---|---|---|---|---|---|
| Read Products, categories, variants, offers and price books/entries | `catalog.read` | `catalog.read` | `catalog.read` | `catalog.read` | Own organization; shared organization records visible to its workspaces. Role grants are current baseline. |
| Create/update product, category, variant, offer or price entry | `catalog.manage` | `catalog.manage` | `catalog.manage` | Deny | Assumed target mapping; local/remote permission key mismatch must be resolved. |
| Archive/restore a record | `catalog.manage` | `catalog.manage` | `catalog.manage` | Deny | Assumed; restore destination and revalidation are domain-open. |
| Permanently delete a record | Deny by default | Deny by default | Deny | Deny | Open policy; no user-facing hard delete until retention, references and approval are defined. |
| Export product or commercial data | Open | Open | Open | Open | No export permission or export contract exists; restrict until decided. |
| Read cost, margin, supplier terms or unpublished prices | Open | Open | Open | Open | Sensitive field classes and role restrictions are not defined. |
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

- Product name, class, category and SKU are operational master data. SKU and
  unpublished product details may still be commercially confidential.
- Offer terms, price books and unpublished prices are potentially sensitive.
  Cost, margin, supplier commercial terms and payment credentials are not
  approved product fields. Do not place credentials, cardholder data or
  unnecessary personal data in `metadata`.
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
2. Use operation-specific `SELECT`, `INSERT`, `UPDATE` and `DELETE` policies.
   `SELECT` checks `catalog.read`; all mutation `USING` and `WITH CHECK`
   clauses check the appropriate manage permission and tenant/scope.
   Category permanent deletion is prohibited; expose archive/restore lifecycle
   commands instead of a category `DELETE` operation.
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
a release blocker: verify deployed policy state and replace it with
operation-specific policies before enabling remote Products mutations.

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
| Local/remote write permission mismatch: local code checks `catalog.write`; migration grants and RLS use `catalog.manage`. | `src/loopdev/domains/catalog/adapter/local.ts`, `src/loopdev/domains/platform/types.ts`, `20260928160000_erp_catalog_foundation.sql` | Choose one canonical contract and add adapter/role parity tests before implementation. |
| Read permission is used in the `USING` clause of an all-operations policy, including deletes. | ERP foundation migration RLS generation | Verify deployment; replace with operation-specific policy and regression-test read-only delete. |
| ERP workspace access is not part of the workspace suite allowlist; catalog policies do not enforce workspace membership/scope. | `20260811000000_platform_core_workspaces.sql`, ERP migration | Resolve domain scope and Platform support before workspace-scoped data is allowed. |
| Catalog `workspace_id` is not constrained to a workspace in the same organization. | ERP foundation migration | Add tenant-consistent references/constraints if workspace scope is approved. |
| `ProductPartyRole`, `CatalogAvailability` and `CatalogEligibility` are local-only in the current Supabase adapter and have no table in the reviewed migration. | Supabase adapter and migration | Keep out of remote access promises until their product scope and persistence are approved. |
| RLS is organization-level, while current local visibility can include workspace-specific behavior. | Catalog adapters and `isScopeVisible` | Add contract tests to ensure no local/remote scope widening. |
| Hard delete cascades through commercial children; no archive-specific permission/audit contract exists. | ERP migration and catalog tests | Resolve lifecycle and retention before enabling destructive operations. |
| Old tenancy documentation and current permission migrations use different role vocabularies. | `MULTI_TENANCY_STRATEGY.md`, `20260807000000_platform_core_permissions.sql` | Treat current Platform permission contract as baseline; reconcile docs in the owning Platform work. |

## Open questions and risks

1. Should `agent` retain full `catalog.manage`, especially for prices, bulk
   operations, archive/restore and any future sensitive fields?
2. How should legacy non-null `workspace_id` values be handled during
   migration, given the confirmed organization-wide target scope?
3. Which price, cost, margin, supplier-term and unpublished fields are
   sensitive, and which roles may read/export them?
4. Permanent category deletion is prohibited. Should permanent deletion be
   permitted for any other Products entity, and under which role, retention,
   reference and audit/recovery controls?
5. What is the canonical local/remote permission ID (`catalog.write` or
   `catalog.manage`), and how are older role names/documentation reconciled?
6. What is the access policy for channel publication and the local-only
   party-role/availability/eligibility records?
7. Is a dedicated export permission needed, or should export remain disabled
   until the data classification and audit requirements are approved?
8. Verify whether the existing ERP migration was deployed; repository source
   alone cannot establish current production RLS behavior.

## Handoff

**Status: `partial`.** The role and organization boundary baseline, least
privilege requirements, Platform reuse rules and test cases are documented.
Do not implement remote mutations until the read-only delete policy gap is
verified and fixed and the permission-key mismatch is resolved. Organization-
wide scope is confirmed; legacy workspace values still need migration
handling. The API and sync phases consumed these constraints; their remote
mutation/replay paths remain gated on the remaining blockers.
