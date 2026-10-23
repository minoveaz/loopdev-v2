---
id: platform-account-pages
title: LoopDev Platform Account Pages
status: active
created: 2026-10-11
updated: 2026-10-23
owner: platform
lead: Platform Delivery
branch: feature/platform-account-pages
branches:
  - feature/platform-account-pages
phase: 7
pull_requests:
  - 35
issues:
  - 32
  - 33
packages: []
release: not-required
areas: [platform, account, auth, preferences, billing, multiplatform]
dependencies:
  - loopdev-v2-multiplatform-foundation
blocked_by:
  - MOD-ACCOUNT-20261010-001
supersedes: []
run_ids:
  - MOD-ACCOUNT-20261010-001
product_docs:
  - docs/implementation/platform/account/discovery.md
implementation_docs:
  - docs/implementation/platform/account/
---

# LoopDev Platform Account Pages

## Objective

Replace the Rivera mock Profile, Account Settings, Security and Billing
destinations with LoopDev-native capabilities for desktop web, mobile web,
iOS and Android. Keep shared operation semantics and ownership boundaries:
Profile/Preferences are user-scoped, Security is Auth-owned, Billing is
active-organization-scoped and authorized for Owner/Admin only.

## Source of truth and status

The run `MOD-ACCOUNT-20261010-001` and documents under
`docs/implementation/platform/account/` are the implementation evidence
workspace. Discovery, design/visual approval, specialist domain/access/API/sync
analysis and the approved `06-plan` are recorded there. The ledger is approved;
operation coverage remains `missing` only where implementation evidence has
not been recorded. `07-build` is active: the ledger currently records 22 done,
2 in progress, 2 ready and 11 blocked tasks. Native Profile and Preferences
have component-level operations and Web/iOS/Android bundle evidence, but their
per-OS device acceptance is outstanding. The current phase issue is #33; #32
tracks the completed plan.

On 2026-10-23, the user requested delivery of the current branch. Commit
`a4705d70ca4cd31c381d1409044a96210bbea64a` was pushed and a draft PR was
opened for review. This does not complete `07-build` or satisfy the
verification/release gates; keep the PR in draft while the run remains blocked.

On 2026-10-23, the user deferred iOS/Android device acceptance and prioritized
desktop development. This is a scheduling decision, not a scope waiver:
native tasks remain open and device parity is not claimed. Billing remains
disabled, as previously approved.

Desktop Security now passes its focused component tests, route smoke check and
typecheck. An authenticated desktop read-only journey verified the canonical
route, reload and legacy redirect; `ACCOUNT-SECURITY-DESKTOP` remains `ready`
until structured E4 operation evidence is recorded. No provider mutation was
submitted.

LoopDev is confirmed as SaaS owner and subscription seller, initially operating
from Spain. Finance must decide the provider/commercial arrangement, compare
processor and MoR terms, and confirm tax/invoicing obligations. Auth,
Platform, Files and Sync ownership decisions remain explicit dependencies.
The plan does not assign legal or provider decisions to the user by inference.

## Gates

1. Plan approval is recorded; retain the approved ledger and task-level owner blockers.
2. Continue only explicitly authorized ready/in-progress tasks and keep their status open while required runtime/device evidence is missing.
3. Do not advance the 11 blocked tasks until their named dependencies and owner decisions are resolved and the ledger marks them `ready`.
4. Require implementation or approved adaptation evidence for every required operation/platform pair before build completion and verification/publication.

## Linked artifacts

- Discovery: `docs/implementation/platform/account/discovery.md`
- Product/architecture design: `docs/implementation/platform/account/design.md`, `architecture-design.md`
- Visual source: `docs/implementation/platform/account/visual-design.md`, `view-state-matrix.md`, `native-compositions.md`
- Domain/access/API/sync: `domain-model.md`, `access-design.md`, `api-contracts.md`, `sync-design.md`
- Executable plan: `docs/implementation/platform/account/implementation-plan.md`, `delivery-ledger.json`
- Delivery run: `docs/implementation/platform/account/runs/MOD-ACCOUNT-20261010-001/`
