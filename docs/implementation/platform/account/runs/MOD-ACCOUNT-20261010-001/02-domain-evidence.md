# Phase 02 — Domain model

## Identity

| Field | Value |
|---|---|
| Run ID | `MOD-ACCOUNT-20261010-001` |
| Span ID | `MOD-ACCOUNT-20261010-001:02-domain` |
| Skill | `domain-model` |
| Parent phase | `01-design` (visual gate approved before this helper) |
| Track | Not created; deferred to `module-plan` |
| Issue(s) | None |
| Status | `completed`; domain result remains `partial` because provider, avatar, catalog and retention policies have named owners and remain open |

## Objective

Define Account entity ownership, relationships, lifecycle, invariants,
provider event boundaries and deletion/retention semantics without creating
UI, API, access or synchronization designs.

## Inputs

- `docs/implementation/platform/account/discovery.md`
- `docs/implementation/platform/account/design.md`
- `docs/implementation/platform/account/delivery-ledger.json`
- `docs/implementation/platform/account/visual-design.md`
- `docs/implementation/platform/account/native-compositions.md`
- `docs/03-platform/governance/MODULE_DEVELOPMENT_TRACEABILITY.md`
- `packages/contracts/src/auth-port.ts`
- `src/loopdev/domains/settings/types.ts`
- `src/loopdev/domains/settings/adapter/index.ts`
- `docs/implementation/platform/settings/SETTINGS_MVP_DELIVERY.md`

## Actions

- Reconciled approved user/global, organization, Auth-provider and billing-provider ownership boundaries.
- Distinguished current Auth and Settings contracts from proposed Account entities and provider projections.
- Recorded the user's resolution of `DEC-ACCOUNT-013`: keep `PlatformUser.fullName/avatarUrl` as the sole canonical profile fields and extend the shared contract to edit them; do not create a separate `UserProfile` aggregate.
- Defined safe lifecycle and event semantics without inventing provider status transitions.
- Recorded unresolved provider, avatar, catalog, subscription-cardinality and retention decisions.
- Preserved the distinction between domain invariants, UI validation, authorization and persistence constraints.

## Outputs

- `docs/implementation/platform/account/domain-model.md`
- `docs/implementation/platform/account/runs/MOD-ACCOUNT-20261010-001/02-domain.json`

## Acceptance criteria

- [x] Entity ownership and cardinality are explicit.
- [x] Existing Auth and Settings contracts are reused without duplicating their models.
- [x] Provider-owned Auth/Billing states are not represented as Account authority.
- [x] Domain invariants are separated from authorization, UI validation and persistence constraints.
- [x] Events and deletion/retention constraints are documented.
- [x] Remaining provider-, catalog-, avatar- and retention-dependent decisions are explicitly assigned to owners and remain open for their specialist phases.

## Validation evidence

| Command or check | Result | Evidence path/link |
|---|---|---|
| `npm run delivery:validate` | Passed | `Module run validation passed: 90 checkpoint file(s) checked (36 archived legacy record(s)).` |
| `npm run validate:delivery-ledgers` | Passed | `Delivery ledger validation passed: 7 ledger(s) checked.` |
| `npm run validate:multiplatform` | Passed | `Multiplatform delivery validation passed.` |
| Source review | Passed | AuthPort, Settings types/adapter and approved discovery/design inspected |

## Environment

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/.copilot/repos/loopdev-v2` |
| Branch | `feature/platform-account-pages` |
| HEAD | `af5e511506339ef1f96e85e9248fe0feee427516` |
| Runtime URL | Not started |
| Runtime port | Not started |

## Decisions, failures and handoff

- Decisions: preserve four capability owners; profile/preferences are user-owned; security state remains Auth-owned; billing records remain provider/Billing-owned and organization-scoped.
- Detected failure: none.
- Likely origin: not applicable.
- Next handoff: `03-access`; carry remaining named provider/catalog/avatar/retention questions into their respective specialist phases.
- State: `partial`.
