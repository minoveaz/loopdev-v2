---
name: module-visual-design
description: Define and evidence a reusable, accessible visual design before specialized module analysis and plan approval.
user-invocable: true
---

# LoopDev Module Visual Design

For an explicitly selected `supplier-pilot` run, the experimental profile
section of `MODULE_DELIVERY_AGENT_CONTRACT.md` overrides the standard separate
design gate and mandatory SVG evidence below. Present an isolated LoopDev
prototype with synthetic data and no live writes; retain a versioned review
artifact and the semantic Markdown baseline. The combined `visual_design`
approval covers only the reviewed scope and visual direction.

Read `docs/03-platform/governance/V2_DOCUMENTATION_SOURCE_OF_TRUTH.md` first. Proposed
`SAAS_*` documents are non-runtime visual references; verify implemented
platform primitives and consumers from
`docs/03-platform/frontend/PLATFORM_V2_UI_REFERENCE.md` and
`docs/03-platform/frontend/PLATFORM_V2_SHELL_REFERENCE.md`, then confirm them against
source, tests, and active checkpoints.

Create the normative visual source for a module after discovery and
`module-design`, before domain/access/API/sync analysis and before plan
approval. This is a reusable delivery subgate, not production implementation.

## Required outputs

- `docs/implementation/<suite>/<module>/visual-design.md`
- `docs/implementation/<suite>/<module>/view-state-matrix.md`
- reviewable low-fidelity SVG wireframes under the same workspace
- `runs/<run-id>/01-visual-design.json`

Markdown is the normative source. SVGs are review evidence and must annotate
the source section/view they represent; they never substitute for approval.

## Mandatory four-part visual evidence

Every visual-design source must include all four parts below:

1. **Rivera/LoopDev baseline inventory:** record the inspected tokens,
   typography, radii, borders, shadows, spacing scale, available primitives
   and CRM density conventions. Name the source file or runtime evidence for
   each item; do not invent a parallel design system.
2. **Styled SVG wireframes:** provide human-readable, diffable SVGs with
   realistic representative data, desktop and mobile compositions, and
   state treatments that do not communicate meaning through color alone.
   Structural boxes alone are insufficient.
3. **Zone reuse matrix:** classify every meaningful zone as `primitive`,
   `shared`, `CRM`, `EXTEND_PLATFORM` or `MODULE_SPECIFIC`, with the
   primitive/contract, owner, rationale and evidence link.
4. **Two-level validation:** record separate conceptual approval (source,
   scope, hierarchy, states, reuse and accessibility) and post-implementation
   runtime comparison (route screenshots/visual diff against the approved
   source). Runtime comparison happens after implementation and cannot be
   backfilled by conceptual approval.

## Minimum coverage

Document the primary views and flows, wireframes, component/primitive reuse,
responsive breakpoints for desktop and mobile, keyboard/focus/contrast and
screen-reader behavior, and all applicable loading, empty, error, forbidden,
conflict, offline, pending and success states. Reuse the current Rivera
template and shared LoopDev primitives. Legacy component/view documents are
informational only; do not invent a parallel design system.

Record each open decision with owner, impact, proposed default and the exact
approval needed. A visual checkpoint is `completed` only when all required
evidence links exist and explicit visual approval is recorded. Otherwise set
the run to `WAITING_VISUAL_DESIGN_APPROVAL` and do not hand off to specialized
analysis or `module-plan`.

## Handoff

The next handoff is `SPECIALIZED_ANALYSIS` only after approval. Keep any
unresolved visual decision visible in the matrix and checkpoint; do not infer
approval from source presence, SVG rendering or a passing build.
## Multiplatform visual gate

The visual source must include desktop web and mobile web compositions for every
view and applicable state, with iOS/Android notes when those surfaces are in
scope. Record touch targets, viewport behavior, keyboard/focus, safe areas,
responsive breakpoints and shared token/primitive reuse in
`platform-scope.md` and the platform evidence matrix.
