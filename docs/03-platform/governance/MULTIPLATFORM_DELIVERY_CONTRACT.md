---
title: LoopDev Multiplatform Delivery Contract
status: active
classification: normative
owner: Platform Delivery
---

# LoopDev Multiplatform Delivery Contract

This contract makes desktop web and mobile first-class delivery surfaces. A
module is not release-ready because the desktop implementation compiles; its
platform scope, shared contracts, mobile behavior and evidence must be
explicitly classified and verified.

## Platform scope

Every delivery run must declare:

```text
PLATFORM_SCOPE:
- desktop_web
- mobile_web
- ios
- android
```

`desktop_web` and `mobile_web` are required for every new product module unless
the approved product definition records an exception. `ios` and `android` are
required when a native client is in scope; otherwise they remain `planned` or
`not_applicable` with an owner and follow-up decision.

## Shared versus platform-specific responsibility

| Concern | Shared source of truth | Platform-specific adaptation |
| --- | --- | --- |
| Domain entities, IDs, lifecycle and invariants | Product/domain contracts | None |
| Commands, queries, errors and events | API and package contracts | Transport/client adapter |
| Permissions, tenant scope and audit | Access contract and server enforcement | UX visibility and native permission prompts |
| Navigation semantics and deep links | Shared navigation contract | Router and OS integration |
| Tokens, labels, icon meaning and states | Shared design/platform contract | Layout, density and interaction ergonomics |
| Offline and synchronization semantics | Sync contract | Storage and lifecycle implementation |

No platform may introduce a second business rule, permission model, route
meaning or entity lifecycle.

## Required shared capability contract

Every user-facing functionality must define one shared capability contract
before platform renderers are implemented. The contract is the semantic source
of truth for desktop web, mobile web, iOS and Android; it is not a visual
component contract and must not contain platform-specific layout details.

At minimum, the contract must define:

- capability name, owner and stable identifiers;
- inputs, outputs, commands, queries and events;
- entity lifecycle, invariants and validation rules;
- action catalog, labels, enabled/disabled states and destructive tone;
- loading, empty, error, forbidden, conflict, offline, pending and success
  states;
- navigation and deep-link meaning;
- permission and tenant-scope requirements;
- accessibility semantics and copy keys;
- platform adaptations explicitly allowed without changing meaning;
- consumers, versioning, migration and compatibility expectations.

Store the contract beside the shared domain or feature contract, normally under
`packages/contracts/src/<capability>.ts`, and document its consumers in the
implementation workspace. Desktop and mobile renderers must consume the same
contract rather than duplicating action lists, labels, validation or lifecycle
rules.

Any platform difference must be recorded as:

```text
PLATFORM_ADAPTATION:
- shared_semantics: [stable meaning]
- desktop_renderer: [desktop composition]
- mobile_renderer: [mobile composition]
- native_renderer: [ios/android composition or N/A]
- accessibility_equivalence: [how the same meaning is preserved]
- evidence: [test/runtime evidence]
```

## Parity classification and operation inventory

Parity is three independent claims. Delivery documentation, checkpoints and
reviews must name the level being claimed:

| Level | What it proves | What it does not prove |
| --- | --- | --- |
| `domain` | Shared entities, rules, permissions, errors and lifecycle behave the same | The interaction exists in every renderer |
| `renderer` | Required sections, states, navigation and accessibility semantics render | The user can execute every related command |
| `operations` | Each declared user operation is available or has an approved adaptation | A different, undeclared mobile flow is equivalent |

Every capability ledger entry must list every operation and classify it on
desktop, mobile web, iOS and Android as `implemented`, `adapted`, `missing` or
`not_applicable`. An `adapted` operation requires a decision reference that
preserves the semantic ID and accessibility meaning. Plan approval approves
scope and sequencing; it does not claim operation parity. A required operation
may remain `missing` at plan approval only when an operation-level build task
explicitly names that operation and platform and includes owner, dependencies,
acceptance criteria and validation. A required operation cannot be
`not_applicable` at plan approval. Open decisions must be represented as
task-level blockers with an accountable owner; a blocked task does not block
approval of the rest of a complete plan.

Keep `missing` until implementation evidence exists; do not call planned work
`implemented` or `adapted`. Before `07-build` completes and before
`08-verify` or publication starts, every operation on every required platform
must be `implemented` or have an explicitly approved `adapted` decision. The
strict parity gate is evaluated separately from plan approval. Split broad
capabilities into operation-level work when that is the smallest unit that
can be implemented and verified.

## Definition of Ready

A module cannot enter build until its implementation workspace contains:

- declared `PLATFORM_SCOPE`;
- desktop/mobile capability matrix;
- shared versus platform-specific decisions;
- approved visual source with desktop and mobile compositions;
- loading, empty, error, forbidden, conflict, offline, pending and success
  state coverage;
- accessibility, responsive, i18n and RTL decisions;
- route/deep-link behavior and fallback;
- validation commands and runtime ports;
- owner for every unsupported or deferred platform.

## Definition of Done

A module is complete only when:

- shared contracts are consumed by every in-scope client;
- desktop and mobile behavior have observable evidence;
- mobile TypeScript and Expo Web bundle validation pass;
- direct routes, navigation, refresh and back behavior are verified;
- permissions and tenant isolation are checked outside the UI;
- platform-specific deviations are documented and approved;
- implementation, verification and review checkpoints are complete;
- unresolved gaps are explicitly accepted with owner and follow-up issue.

## Required evidence matrix

| Requirement | Desktop web | Mobile web | iOS | Android | Shared contract | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `[capability]` | `[route/test]` | `[route/test]` | `[test/N/A]` | `[test/N/A]` | `[path]` | `[link]` | `[PASS/PARTIAL/FAIL]` |

The executable matrix validator additionally requires an owner and follow-up
for every `NOT_TESTED` or `N/A` row, and commit/timestamp/runtime or test
evidence for `PASS`. Run `npm run validate:multiplatform` before handoff.

Source presence, a clean commit or a passing typecheck is not behavioral
evidence. Runtime and test evidence must identify the actual checkout, branch,
commit, URL/port and validation timestamp.

Focused component tests are the default renderer evidence for changed actions.
Browser journeys are required only by a task with `E4_JOURNEY`, an approved
high-risk regression strategy or a release gate; Playwright is one optional
tool, never a universal requirement.

## Mandatory validation baseline

```bash
npm run lint
npm run typecheck
npm run test:quality
npm run test:multiplatform-contracts
npm run validate:mobile-boundaries
npm run build
cd apps/mobile
npm ci
npx tsc --noEmit
npx expo-doctor
npx expo export --platform web --output-dir /tmp/loopdev-mobile-web
```

The smallest applicable subset may be used for a focused change, but the
delivery checkpoint must explain omitted commands and their risk.

## Change and release policy

Any change to a shared contract requires impact analysis for desktop, mobile
web, iOS and Android consumers. Any platform-only behavior requires a documented
reason, accessibility impact, rollback strategy and owner. A module review must
return separate desktop and mobile verdicts before release approval.

The repository gates for this contract are `npm run validate:contracts`,
`npm run test:multiplatform-contracts` and
`npm run validate:mobile-boundaries`. They discover capability metadata, run
the same behavioral suite against desktop and mobile adapters, reject mobile
imports from the desktop `src/` runtime, reject renderer-local Contacts action
catalogs and require renderers to import the shared capability contracts.
