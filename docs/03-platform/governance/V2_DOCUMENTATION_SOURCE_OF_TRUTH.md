---
title: LoopDev v2 documentation source of truth
status: current-governance
owner: platform
---

# LoopDev v2 documentation source of truth

This document defines which documentation may be used as evidence for LoopDev
v2 delivery. A document's existence is not proof that a capability is
implemented, registered, routable, or consumable at runtime.

## Authority tiers

1. **Implemented V2** — Current source, route, test, track, and implementation
   evidence in this repository. Use these documents to make delivery
   decisions and verify behavior:
   - `tracks/active/` (active product and platform tracks);
   - `docs/06-product/crm/README.md`;
   - `docs/06-product/crm/CRM_FRONTEND_CLOSURE_MATRIX.md`;
   - `docs/06-product/crm/CRM_UI_COMPONENT_PROTOCOL.md`;
   - `docs/03-platform/frontend/PLATFORM_V2_UI_REFERENCE.md`;
   - `docs/03-platform/frontend/PLATFORM_V2_SHELL_REFERENCE.md`;
   - implementation checkpoints and source/test evidence under
     `docs/implementation/`.
2. **Approved product intent** — Approved contracts, UX specifications, and
   plans describe the target and acceptance criteria. They do not establish
   that implementation exists until source and runtime/test evidence confirms
   it.
3. **Proposed, not implemented** — The `SAAS_*` documents listed below are
   design proposals and reference material. They are not runtime contracts,
   registries, resolvers, or consumer evidence.
4. **Archive-only** — `docs/06-product/archive/**` and `tracks/closed/**` are
   retained for traceability. They must not be used to authorize current work
   or infer an active route, component, or capability.

`docs/06-product/crm/CRM_COMPONENT_CATALOG.md` is a current inventory and
decision aid, but it includes historical evidence. It is not the sole source
of truth for routes, runtime behavior, or implementation status.

## Platform documentation structure

Active platform references are organized by responsibility:

- `docs/03-platform/frontend/` — implemented web UI, shell, navigation, and
  shared frontend behavior;
- `docs/03-platform/backend/` — API, persistence, storage, tenancy, and
  backend security contracts;
- `docs/03-platform/mobile/` — native iOS/Android design reference. The
  mobile reference is not evidence that native apps exist;
- `docs/03-platform/governance/` — architecture, delivery, workflow,
  readiness, and traceability contracts; and
- `docs/03-platform/archive/` — historical material only.

## Archive context

Documents under `docs/03-platform/archive/` are retained for historical
context only. Do not use them as evidence of a V2 runtime registry, resolver,
composition consumer, or visual capability. Verify all such claims against
current source code, routes, tests, and active implementation evidence.

## Safe reading order for delivery

1. Read this document first.
2. Confirm the active track and its status under `tracks/active/`.
3. Read the applicable product README and current closure/contract documents.
4. Read the V2 UI and shell references, then inspect the implementation
   workspace/checkpoints.
5. Inspect source routes, domains, adapters, tests, and runtime evidence.
6. Use approved product intent to identify gaps and acceptance criteria.
7. Consult proposed or archived documents only as clearly labelled context;
   never promote their claims without source evidence.

When sources conflict, stop the delivery gate, record the conflict in the
active run, and use the highest applicable authority tier rather than
silently merging claims.
