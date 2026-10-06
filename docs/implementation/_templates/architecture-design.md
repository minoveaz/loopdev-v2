# <Module> Architecture and Design

## Document control

| Field | Value |
|---|---|
| Module | |
| Product definition | |
| Run ID | |
| Track | |
| Design checkpoint | |
| Owner | |
| Status | `draft` / `approved` / `deviated` |

## Target architecture

### Context and boundaries

- Suite and bounded context:
- Owned responsibilities:
- Explicitly out of scope:
- Public routes and entry points:
- Consuming modules:
- Consumed Platform capabilities:

### Layer map

| Layer | Responsibilities | Files/areas | Allowed dependencies | Forbidden dependencies |
|---|---|---|---|---|
| Presentation | | | | |
| Application | | | | |
| Domain | | | | |
| Ports/contracts | | | | |
| Adapters/infrastructure | | | | |

### Dependency direction

```text
Presentation → Application → Domain → Ports → Adapters
```

Document any exception, its reason and its owner:

| Exception | Reason | Risk | Approval | Follow-up |
|---|---|---|---|---|
| | | | | |

## Responsibility matrix

| Concern | Authoritative owner | Consumers | Must not contain | Evidence |
|---|---|---|---|---|
| UI rendering | | | | |
| Use cases/orchestration | | | | |
| Domain rules/invariants | | | | |
| Persistence | | | | |
| API/transport | | | | |
| Authorization/tenant scope | | | | |
| Synchronization/conflicts | | | | |
| Shared Platform capability | | | | |

## Module and Platform contracts

| Capability | `REUSE` / `EXTEND_PLATFORM` / `MODULE_SPECIFIC` / `BLOCKED` | Contract | Consumers | Duplicate prohibited? |
|---|---|---|---|---|
| | | | | |

## Structural quality baseline

- [ ] Cohesion and coupling risks identified.
- [ ] SRP risks identified.
- [ ] Duplicate implementations searched for.
- [ ] Public contracts and dependency direction documented.
- [ ] Domain/application behavior is independently testable.
- [ ] Tenant, authorization and synchronization boundaries documented.
- [ ] Residual technical debt has an owner and issue.

## Refactoring records

| ID | Reason | Behavior preserved | Files/consumers | Risk | Before evidence | After evidence | Rollback | Residual debt |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

## Open decisions and deviations

| ID | Decision or deviation | Status | Impact | Approver | Resolution/follow-up |
|---|---|---|---|---|---|
| | | | | | |
