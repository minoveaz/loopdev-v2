# Proveedores — Requirement evidence matrix

Design evidence is a proposal, not implementation or runtime proof. The
current build has partial component and adapter evidence; it is not a release
or full-module verification.

| Requirement ID | Product definition reference | Implementation evidence | Test/evidence link | Status | Gap/next action |
|---|---|---|---|---|---|
| `REQ-ERP-SUPPLIER-FOLLOWUP` | `discovery.md`, user-confirmed direction | `src/loopdev/pages/erp/Suppliers.tsx`; route in `src/routes/LoopdevRoutes.tsx`; local and Supabase supplier adapters | Route smoke passes; authenticated directory journey not run; directory-domain task remains blocked by fiscal duplicate policy | `PARTIAL` | Resolve blocked directory-domain task; test create/edit/lifecycle, permissions, and authenticated responsive route |
| `REQ-ERP-SUPPLIER-P2P-MASTER` | `discovery.md`, P2P field inventory | Supplier and SupplierItem contracts/adapters cover a subset of purchase terms | No evidence for contacts, typed addresses, tax profile, payment instructions, protected persistence, or audit; user deferred fiscal/banking fields | `PARTIAL` | Keep sensitive fields out of scope until Finance/Legal/Access validation; complete approved supplier master fields separately |
| `REQ-ERP-SUPPLIER-CATALOG` | `discovery.md`, SupplierItem and manual intake direction | `packages/contracts/src/suppliers.ts`; SupplierItem local/Supabase adapters; `Suppliers.tsx`; Products handoff in `ProductRecordPages.tsx` | 17 focused tests and production build pass; desktop visual session is blocked at sign-in; mobile web and Supabase runtime are unverified | `PARTIAL` | Complete renderer tasks and authenticated desktop/mobile-web checks; validate the migration last, without applying it |
| `REQ-ERP-SUPPLIER-P2P-CONSUMERS` | `discovery.md`, transaction ownership boundary | Ownership boundaries documented in `architecture-design.md` | No Procurement/Inventory/Finance transactions or consumer integration are implemented | `NOT_TESTED` | Design and verify PO snapshots, receipts, invoices, and payments in their owning modules |

## Release blockers

- Authenticated visual/responsive verification remains outstanding; the local dev route redirects to sign-in.
- The confirmed broad tax/bank visibility conflicts with `docs/implementation/erp/core/access-model.md` (`ACC-ERP-008`); obtain Platform/access-owner reconciliation and server-side policy before remote use.
- Do not persist real tax or bank values in clear browser storage; approve protected storage, audit and change-verification policy before real data.
- Jurisdictional tax requirements and payee verification/approval remain unresolved.
- No authenticated browser journey, Supabase integration test, or applied database migration exists.

## Known deviations

- Supabase adapter behavior has not been exercised against a database. `ProductPartyRole` remains product-bound and does not satisfy the Supplier master requirement.
