# Platform evidence matrix — CRM Communications

| Capability/operation | Domain parity | Desktop renderer/action | Mobile renderer/action | Status | Owner | Gap/next action |
|---|---|---|---|---|---|---|
| Inbox list and conversation context | Communications adapter and collaboration state are present; parity not runtime-verified | `src/loopdev/pages/crm/Communications.tsx` | `apps/mobile/components/communications/` | NOT_TESTED | Communications | Capture authenticated desktop/mobile journeys proving the same organization and actor context. |
| Outbound message dispatch | Outbound message path exists; worker, kill-switch, and template policy require evidence | Desktop inbox composer; dispatch policy not runtime-verified | Mobile inbox surface; dispatch parity not verified | NOT_TESTED | Communications | Verify server-side dispatch controls and add focused outbound UI regression evidence. |
| Files attachment and preview | Files integration is in scope; cross-surface parity is not established | Shared attachment surface referenced by Communications scope | Mobile conversation context exists; upload/preview parity not verified | PARTIAL | Communications / Platform Files | Verify authenticated upload, preview, and tenant isolation from both clients. |
| Tenant-scoped collaboration state | Organization and actor scoping is required by the module contract | Desktop authenticated context not runtime-verified | Mobile authenticated context not runtime-verified | NOT_TESTED | Communications | Capture read/write journeys demonstrating identical tenant and actor boundaries. |

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
| `npm run validate:mobile-boundaries` | PASS | Successful local run at `2026-10-06T19:52:46Z` | Architecture boundary check only; it does not verify Communications runtime behavior. |
