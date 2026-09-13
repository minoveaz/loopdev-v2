# LoopDev Software Architecture, Design and Structural Quality Contract

## Purpose

This contract defines how LoopDev documents, applies and verifies software
architecture, modular design, separation of responsibilities and safe
refactoring. It applies to Platform work, new modules and changes to existing
modules.

The contract is structural: it governs how code is organized without
requiring every module to adopt a textbook Clean or Hexagonal Architecture.
Each module must document its boundaries and justify deviations.

## Architectural baseline

LoopDev uses a modular, layered architecture prepared for local-first
execution and replaceable persistence adapters:

```text
Presentation: routes, pages and UI components
        ↓
Application: hooks, commands, queries and use cases
        ↓
Domain: entities, policies, invariants, states and events
        ↓
Ports: typed contracts for persistence, APIs, sync and Platform
        ↓
Adapters: local storage, remote APIs, sync engines and infrastructure
```

Dependencies normally point downward. Domain code must not depend on React,
browser storage, concrete API clients or visual components. Presentation code
must not bypass application, domain or port boundaries to access persistence.
An intentional exception requires an architecture decision and an owner.

## Definitions

| Concern | LoopDev definition | Required evidence |
|---|---|---|
| Architecture | Organization of suites, Platform, domains, persistence, APIs and integrations | Context map and dependency boundaries |
| Design | Internal structure of a module and its components, hooks, services, contracts and adapters | Module architecture-design document |
| Separation of concerns | UI, application, domain, infrastructure and cross-cutting concerns remain explicit | Responsibility matrix |
| SRP | A unit has one primary reason to change | Review finding or approved exception |
| Modular design | High cohesion inside modules and low coupling across module boundaries | Dependency and integration map |
| Refactoring | Internal structural change preserving approved behavior | Before/after and regression evidence |
| Layered/clean/hexagonal patterns | Patterns used selectively to enforce boundaries and replaceable adapters | Decision record and dependency check |

## Responsibility rules

The following responsibilities must remain separate unless the module records
an approved exception:

| Responsibility | Allowed location | Must not own |
|---|---|---|
| Rendering and interaction | Pages and components | Persistence, authorization policy or domain transitions |
| Orchestration | Hooks, commands, queries and use cases | Visual markup or storage implementation details |
| Business rules | Domain policies, entities and state transitions | React, browser APIs or transport DTOs |
| External contracts | Ports, DTOs and typed API contracts | UI decisions or hidden persistence |
| Persistence and infrastructure | Adapters and repositories | Product rules or route rendering |
| Authorization | Access policies and server/client guards | Unrelated data mutation or visual state assumptions |
| Synchronization | Sync adapters and conflict policies | Component-local retry state or duplicated entities |
| Cross-cutting concerns | Shared Platform contracts | Module-local duplicates of existing capabilities |

## Module boundary requirements

Every module must document:

- public entry points and routes;
- owned entities, states and invariants;
- consumed Platform capabilities;
- ports and adapters;
- events and integration contracts;
- allowed dependencies;
- forbidden dependencies;
- data and tenant boundaries;
- extension points and migration strategy.

Modules must not import another module's private implementation merely to
reuse behavior. Extract shared behavior into Platform or an explicit public
contract. A module-local copy of Notes, Files, Activity, Tasks, Relations,
Document Intelligence or permissions is prohibited unless an approved
`EXTEND_PLATFORM` or exception decision exists.

### Legacy documentation is not implementation authority

Legacy component names, screenshots, route lists and view inventories are
historical/informational evidence only. They do not authorize creating new
legacy components, routes or parallel views. Required behavior must first be
mapped to the current Rivera template, shared LoopDev primitives and existing
LoopDev v2 modules. Use `REUSE` by default; propose `EXTEND_PLATFORM` for a
missing cross-cutting capability; reject duplicate module-local paths unless
an explicit architecture decision approves an exception.

## Structural quality criteria

Reviews must assess:

- cohesion: related behavior stays together;
- coupling: dependencies are explicit, minimal and directed;
- SRP: units have a focused reason to change;
- duplication: shared behavior has one authoritative implementation;
- boundary integrity: layers and module APIs are respected;
- testability: domain and application behavior can be tested without a UI;
- observability: failures identify the responsible phase and boundary;
- migration safety: refactors preserve data and rollback paths;
- debt: residual compromises have an owner and follow-up issue.

These criteria are qualitative gates, not a license to apply arbitrary
complexity thresholds. A small, cohesive module is preferable to premature
abstraction.

## Refactoring protocol

A significant refactor is one that changes module boundaries, public contracts,
shared Platform code, persistence, synchronization, authorization or more than
one consumer. It must record:

1. reason and current structural problem;
2. behavior explicitly preserved;
3. files, modules and consumers affected;
4. risk and migration/rollback strategy;
5. tests or runtime evidence before and after;
6. residual technical debt, owner and follow-up issue.

Refactoring must be behavior-preserving unless the product design explicitly
approves a behavior change. If behavior changes, split the work into a
refactor checkpoint and a functional-change checkpoint where practical.

## Decision statuses and deviations

Architecture decisions are `confirmed`, `assumed`, `open` or `rejected`.
Implementation deviations are `none`, `minor`, `approved` or `unapproved`.
An unapproved deviation blocks `module-review` and the delivery agent,
including when tests and build pass.

## Required module artifact

Each module implementation must maintain
`docs/implementation/<module>/architecture-design.md` from
`docs/implementation/_templates/architecture-design.md`. The document is
linked from the design, plan, checkpoints, evidence matrix and review issue.

## Traceability and gates

Architecture evidence is recorded in the normal run/checkpoint system:

- design defines the target architecture and responsibility boundaries;
- plan creates boundary, responsibility and refactor-safety audits;
- build records implementation boundaries and deviations;
- verify records before/after behavior, regression evidence and affected
  states;
- review issues a structural verdict and tracks residual debt;
- delivery exposes an `ARCHITECTURE_QUALITY` status and blocks release for
  unapproved deviations.
