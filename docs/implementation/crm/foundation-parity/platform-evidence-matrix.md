# Platform evidence matrix — CRM Foundation Parity

| Capability/operation | Domain parity | Desktop renderer/action | Mobile renderer/action | Status | Owner | Gap/next action |
|---|---|---|---|---|---|---|
| Tasks read and write | Shared task contracts and adapters exist; authenticated parity is unverified | Platform task workspace; tenant-scoped read/write smoke remains open | Mobile task adapter and screen; runtime parity is unverified | NOT_TESTED | Platform | Resolve FP-001 in `README.md` with authenticated tenant-scoped read/write evidence. |
| Activity Timeline | Shared ActivityTimeline contracts and authenticated adapter are implemented | Timeline consumers use the authenticated adapter; runtime journey not captured | Mobile Timeline parity is not verified | PARTIAL | Platform | Capture authenticated desktop/mobile event journeys and verify organization, workspace, and relation filters. |
| Files upload and preview | Shared Files metadata and upload-session contract | Files schema, RLS, private bucket, and authenticated smoke are documented in `README.md` | Mobile MIME/size validation and tenant-scoped local cache; runtime recovery not verified | PARTIAL | Platform Files | Verify mobile offline transition/recovery and native route behavior; resolve FP-003 in `README.md`. |
| Catalog reads | Shared Catalog adapter contract; authenticated parity is unverified | CRM Catalog consumers use the shared adapter; runtime smoke remains open | Mobile Catalog adapter parity is not verified | NOT_TESTED | Platform | Resolve FP-001 in `README.md` with authenticated tenant-scoped read evidence. |

## Runtime snapshot

| Field | Value |
|---|---|
| Repository path | `/Users/minoveaz/Documents/Proyectos/loopdev-v2` |
| Checkout type | `branch` |
| Branch and HEAD | `feature/crm-v2-foundation` at `b04b36e` |
| Desktop URL/port | Not started for this validation |
| Mobile URL/port | Not started for this validation |
| Validation timestamp | `2026-10-06T19:52:46Z` |

## Validation commands

| Command | Result | Evidence | Notes |
|---|---|---|---|
| `npm run validate:mobile-boundaries` | PASS | Successful local run at `2026-10-06T19:52:46Z` | Architecture boundary check only; it does not verify Foundation runtime parity. |
