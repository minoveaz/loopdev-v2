# Platform Document Lifecycle Discovery

| Field | Value |
|---|---|
| Module | Platform Document Lifecycle |
| Suite | Platform |
| Run ID | MOD-DOCUMENT-LIFECYCLE-20260926-001 |
| User request | GitHub issue #14 |
| Product definition | `docs/06-product/ai-platform/document-intelligence-core/` and issue #14 |
| Discovery status | complete |

## Problem and objective

Document Intelligence currently owns temporary uploads and extraction but does
not persist an association or promote the binary into the shared Files
capability. The objective is a tenant-safe, local-first lifecycle from
temporary upload through review, contact association, promotion, retention and
disposition. Temporary unassociated objects live 30 days; associated documents
default to 365 days and may be configured per organization/document type.

## Actors and outcomes

| Actor | Outcome | Constraint |
|---|---|---|
| Admin/owner | Configure retention and operate cleanup | Organization scoped |
| Agent/manager | Review, associate and promote | CRM/contact scope |
| Member/read-only | View permitted contact files | No mutation |
| Communications user | Start extraction from an attachment | Message and tenant scope |
| Worker | Cleanup and reconcile | Service role, audited |

## Expected-versus-existing matrix

| Capability | Expected behavior | Existing implementation | Status | Evidence/next action |
|---|---|---|---|---|
| Lifecycle states | Temporary, processing, review, linked, archived, deleted plus failure/expiry | `lifecycle.ts` transitions | EXISTS_PARTIALLY | Add persistence and operational transitions |
| Temp retention | 30-day expiry | Temp bucket and cleanup migration | EXISTS_PARTIALLY | Lifecycle metadata/cleanup function |
| Association | New/existing CRM contact | CRM contact contracts | MISSING | Composite FK and association table |
| Promotion | Copy to shared Files metadata with contact relation | Files metadata/storage migrations | MISSING | Remote promotion adapter |
| Idempotency/concurrency | Key + optimistic version | Phase 1 token fields | EXISTS_PARTIALLY | Operation table and version checks |
| Retention settings | Org/type default 365 days | None | MISSING | Policy table/RLS |
| Communications launch | Common adapter contract | Extraction source suite field | EXISTS_PARTIALLY | Consumer integration follow-up |
| Timeline | Shared platform event | Timeline table | EXISTS_PARTIALLY | Emit promotion/link events |
| Cleanup/reconciliation | Expiry and orphan detection | Temp cleanup baseline | EXISTS_PARTIALLY | SQL functions and worker wiring |
| Tenant/RLS | Organization membership and role gates | Existing DI RLS | EXISTS_AND_ALIGNS | Extend policies and authenticated smoke |

## Inputs, outputs and events

Inputs are authenticated uploads, extraction records, CRM contact IDs and
Communications attachment references. Outputs are a `platform_files` row,
contact relation, signed-preview path, lifecycle event and audit record.
Events are `document.received`, `document.extraction.started/completed/failed`,
`document.linked`, `document.promoted`, `document.expired` and
`document.deleted`; all carry organization, document, actor and idempotency
identifiers.

## Platform and suite integration

| Capability | Decision | Boundary |
|---|---|---|
| Files | REUSE | Files owns permanent bytes, versions and previews |
| CRM Contacts | REUSE | Contact identity and relation authority |
| Communications | REUSE | Launches shared extraction contract |
| Timeline | REUSE | Shared activity projection |
| Retention/Cleanup | EXTEND_PLATFORM | Policy and reconciliation tables/functions |
| Document Intelligence | MODULE_SPECIFIC | Extraction and lifecycle orchestration |

Local uploaders, previews, timelines and parallel file metadata are prohibited.

## External benchmark and source register

| Reference | Source URL | Accessed | Pattern | Classification | Applicability |
|---|---|---|---|---|---|
| Dropbox retention | https://help.dropbox.com/security/data-retention | 2026-09-26 | Admin retention/disposition policies | INDUSTRY_BASELINE | Org/type policies |
| DocuSign retention | https://support.docusign.com/s/document-item?language=en_US&rsc_301 | 2026-09-26 | Configurable lifecycle and audit | TRANSFERABLE_PATTERN | Audited disposition |
| Document360 lifecycle | https://document360.com/blog/document-lifecycle/ | 2026-09-26 | Capture, active use, archive, destruction | INDUSTRY_BASELINE | State model |

## Differentiation hypotheses

1. Local-first promotion queue keeps operators productive offline; validate with
   a forced network interruption test.
2. Explainable lifecycle events across CRM, Files and Communications reduce
   duplicate work; validate with timeline task completion.
3. Permission-aware promotion prevents cross-tenant PII leakage; validate with
   authenticated RLS probes.

## Boundaries, assumptions and open decisions

MVP includes identity/document extraction, contact relation, Files promotion,
retention, cleanup, reconciliation, RLS and smoke evidence. Legal hold,
retention minimums beyond the enforced 1–3650 day range and granular download
roles remain follow-up decisions. No legacy backend checkout was configured.

## Handoff to module-design

Design must specify the shared promotion contract, Communications invocation,
timeline event mapping, signed URL policy, cleanup worker trigger and rollout
flag. Discovery state: **complete**.
