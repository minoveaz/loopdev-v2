---
name: module-discovery
description: Discover what a LoopDev module must be, consume, produce and provide before designing or implementing it.
user-invocable: true
---

# LoopDev Module Discovery

Discover the business capability, expected domain behavior and suite
integration of a LoopDev module before `module-design` defines its functional,
visual and technical structure.

## Mission

Answer:

> What should this module be, what should it contain, what does it consume,
> what does it produce, and how does the current LoopDev state compare?

This skill is not implementation and is not a substitute for product approval.
It reconciles user intent, approved product documentation, domain/market
baseline, shared Platform capabilities and the existing repository.

## Position in delivery

```text
INTAKE
  → module-discovery
  → module-design
  → specialized analysis
  → module-plan
```

The `delivery` agent initializes the implementation workspace. This skill is
the first phase to populate:

```text
docs/implementation/<suite>/<module>/discovery.md
```

If the workspace does not exist, stop with a `BLOCKED` handoff. Do not create
an alternate documentation root.

## Discovery sources

Read `docs/03-platform/governance/V2_DOCUMENTATION_SOURCE_OF_TRUTH.md` first, then use
`docs/03-platform/frontend/PLATFORM_V2_UI_REFERENCE.md` and
`docs/03-platform/frontend/PLATFORM_V2_SHELL_REFERENCE.md` for current UI and shell
reuse. Apply its authority tiers while evaluating sources: `SAAS_*` documents
are proposed, non-runtime references, and archive-only documents cannot prove
active capabilities.

Inspect and distinguish:

1. the user's requested business outcome;
2. approved product definitions under `docs/06-product`;
3. existing contracts, UX specifications, impact assessments and tracks;
4. comparable domain capabilities and market baseline;
5. existing LoopDev routes, modules, Platform contracts, tests and adapters;
6. existing implementation documentation and previous runs.

Product documentation is the definition of approved intent. Market knowledge
is a discovery input, not authority to expand scope. Existing source is
baseline evidence, not proof of compliance.

Legacy documentation, screenshots, component inventories and view lists are
informational evidence only. They must not be interpreted as approval to
create new legacy components, routes or parallel views. When a documented
capability is still required, discovery must map it to the current Rivera
template, shared LoopDev primitives and existing LoopDev v2 modules before
design or implementation. The default decision is `REUSE`; use
`EXTEND_PLATFORM` only when an existing shared capability is genuinely
insufficient, and record the reason and approval.

## External research and differentiation

For modules with a meaningful market analogue, perform bounded web research
before handing off to `module-design`. Use reliable primary or first-party
sources where possible: official product documentation, product pages,
developer documentation, public demos and well-attributed industry analysis.
Do not treat search snippets, unsourced blog claims or generated summaries as
verified product behavior.

Research at least three relevant references and no more than five unless the
user explicitly requests a deeper benchmark. Select references for distinct
strengths, for example:

- a mature CRM or system of record;
- a modern collaborative or workflow-oriented product;
- a specialist product with an unusual interaction or operational model;
- an open-source reference when its implementation is inspectable.

For each reference record:

- source URL and access date;
- capability or interaction observed;
- user problem it solves;
- LoopDev applicability;
- risks, tradeoffs and what must not be copied.

Separate findings into:

```text
INDUSTRY_BASELINE
TRANSFERABLE_PATTERN
DIFFERENTIATOR_OPPORTUNITY
NOT_RELEVANT
UNVERIFIED
```

Generate between three and seven bounded differentiation hypotheses for
LoopDev. A hypothesis must state the user value, the product behavior it would
change, the required Platform/domain impact, implementation complexity and a
validation experiment. Examples include local-first resilience, transparent
next-best action, explainable pipeline health, cross-module context or
permission-aware collaboration. Do not put a hypothesis into MVP scope
without explicit product approval.

Benchmarking must inspire options, not force parity. Prefer one or two
coherent LoopDev differentiators over a long feature list.

## Required discovery questions

### Business capability

- What problem does the module solve?
- Who are its actors and what decisions do they make?
- What is the primary outcome and success measure?
- What is explicitly outside the module boundary?

### Domain behavior

- What entities, relationships, states and invariants are required?
- What enters the module and what leaves it?
- What commands, queries and events are expected?
- What are the lifecycle, terminal and recovery paths?
- Which cases require idempotency, versioning or audit history?

### Suite integration

- Which LoopDev modules does it consume?
- Which modules consume its entities or events?
- Which Platform capabilities are reused or extended?
- Which permissions, tenant scopes, reference data and adapters are shared?
- Which duplicate local implementations are forbidden?

### Current-state comparison

- What already exists in source?
- What is documented but missing?
- What exists but conflicts with the approved product contract?
- What is present but not tested?
- Which legacy paths, routes or models coexist?
- Which legacy references are informational only, and what current template,
  primitive or module must replace each one?

## Capability classification

Classify every discovered capability as one of:

```text
REQUIRED_MVP
REQUIRED_FOLLOW_UP
PLATFORM_REUSE
PLATFORM_EXTENSION
MODULE_SPECIFIC
OUT_OF_SCOPE
OPEN_DECISION
```

Classify the repository baseline independently:

```text
EXISTS_AND_ALIGNS
EXISTS_PARTIALLY
EXISTS_BUT_CONFLICTS
MISSING
NOT_TESTED
NOT_APPLICABLE
```

Never mark a capability as aligned solely because a file, route or component
exists. Require observable behavior, contract or test evidence.

For every legacy reference, record whether it is `INFORMATIONAL_ONLY`,
`REUSE_CURRENT_PRIMITIVE`, `EXTEND_PLATFORM` or `REJECTED_DUPLICATE`. A
legacy name is never by itself a valid implementation target.

## Required output

Create or update `docs/implementation/<suite>/<module>/discovery.md` using
`docs/implementation/_templates/discovery.md` with these sections:

1. Problem and objective.
2. Actors and outcomes.
3. Expected domain capabilities.
4. Inputs, outputs and events.
5. Entities, relationships and lifecycle.
6. Platform and suite integration.
7. Market/domain baseline.
8. External benchmark and source register.
9. LoopDev differentiation hypotheses.
10. Product definition currently approved.
11. Existing LoopDev implementation.
12. Expected-versus-existing matrix.
13. MVP, follow-up and out-of-scope boundaries.
14. Contradictions, assumptions and open decisions.
15. Handoff to `module-design`.

The capability matrix must include capability, expected behavior, product
source, existing implementation, status, evidence and next action.

## Action boundaries

This skill may inspect source, documentation, tests and runtime and may create
discovery documentation/checkpoints. It must not:

- modify production code;
- silently rewrite product definitions;
- convert market baseline into approved scope;
- create implementation tasks or GitHub issues;
- declare existing behavior compliant without evidence;
- design concrete UI/API structure that belongs to `module-design`.

## Completion states

End with exactly one state:

```text
complete
partial
blocked
```

Use `partial` when discovery has evidence gaps but a safe design handoff is
possible. Use `blocked` when an unresolved decision prevents safe scope or
domain discovery.

## Traceability

Create a discovery checkpoint as the first child span of the delivery run.
Record:

- user request and source documents;
- repository and runtime baseline;
- capability classifications;
- expected-versus-existing matrix;
- contradictions and open decisions;
- `detected_by` and `likely_origin` for failures;
- exact handoff to `module-design`.

Use `docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md` and keep evidence
redacted of secrets and unnecessary PII.
