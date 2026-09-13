---
name: domain-model
description: Define entities, lifecycle states, invariants and domain events for a LoopDev module.
user-invocable: false
---

# LoopDev Domain Model Helper

Provide a focused domain analysis to a parent module skill.

## Cover

- Main and child entities.
- Relationships and cardinality.
- Required and derived attributes.
- State machine and valid transitions.
- Invariants and validation rules.
- Ownership, versioning and audit fields.
- Domain events and payloads.
- Archive, delete, restore and retention semantics.
- Shared Platform relationships and events when the entity participates in
  Notes, Files, Activity, Tasks, Relations or Document Intelligence.

Return structured decisions, assumptions, open questions and risks. Do not
design screens, write code or expand into API, RBAC or synchronization topics
unless they directly affect the domain model.

## Common Contract

### Input context

- module objective and available `module-design`;
- existing domain contracts or repository evidence;
- known tenant, ownership and lifecycle constraints.

### Decision status

Mark every rule as `confirmed`, `assumed` or `open`. Distinguish domain
invariants from UI validation, persistence constraints and authorization.

### Output handoff

Return:

- entity and relationship tables;
- state transition table;
- invariants and commands;
- domain event definitions;
- archive/delete/restore policy;
- risks and open decisions;
- state `complete`, `partial` or `blocked`.

### Action boundaries

This helper defines domain semantics only. It does not design screens, choose
infrastructure, implement code or produce a complete permission/API/sync plan.

When a shared Platform capability applies, define the relationship and domain
events needed to consume it; do not create a second domain model for the
shared capability.

For every entity, state the source of truth, local fixture strategy, remote
migration identity, ownership scope, soft-delete/restore behavior and
cross-module events. Mark whether a rule is an invariant, UI validation,
persistence constraint or authorization condition.

### Traceability

Return a helper checkpoint linked to the parent phase using
`docs/03-platform/MODULE_DEVELOPMENT_TRACEABILITY.md`, with its run ID, parent
skill, decisions, domain artifact, unresolved questions, detected failure,
likely origin and status. Use
`docs/implementation/_templates/phase-evidence.md` for the human-readable
phase record.
