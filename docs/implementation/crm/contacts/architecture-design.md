# Contacts Architecture and Design

## Document control

| Field | Value |
|---|---|
| Module | Contacts |
| Run ID | `MOD-CONTACTS-20260913-001` |
| Status | `blocked` |
| Blocker | Canonical design phase has not been completed or approved |

## Baseline boundary

The existing Contacts implementation is evidence to audit, not an approved
target architecture. Before build resumes, design must confirm shared contracts,
desktop and mobile adapters, Platform integrations, permissions, synchronization
and dependency direction.

## Open decisions

| ID | Decision | Status | Follow-up |
|---|---|---|---|
| CONTACTS-ARCH-001 | Neutral shared contract/use-case boundary for web and Expo | Open | Resolve in `01-design` |
| CONTACTS-ARCH-002 | Mobile runtime dependency boundary | Open | Audit imports before plan approval |
| CONTACTS-ARCH-003 | Customer 360 operational parity across desktop and mobile | Open | Use `customer360-parity-remediation.md`; extend Platform ports before mobile renderer work |

## Customer 360 remediation boundary

`packages/contracts/src/contact-capability.ts` owns the Customer 360 section
and operation catalog. `ContactPort` remains the read boundary for the contact
summary. Notes, Tasks, Files and Catalog must each expose neutral ports and
explicit desktop/mobile adapters before Customer 360 invokes their mutations.
The mobile renderer may adapt composition, but cannot replace an operation with
a read-only summary or import desktop `src/` runtime code.