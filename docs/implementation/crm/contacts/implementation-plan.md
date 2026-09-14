# Contacts Implementation Plan

## Status

`blocked`: this file records the missing plan gate and does not authorize
production work.

## Required predecessors

1. Complete and review `00-discovery`.
2. Complete and approve `01-design`.
3. Complete and approve `01-visual-design` for desktop and mobile.
4. Complete domain, access, API and sync analysis.
5. Generate requirement/capability tasks and approve `06-plan`.

## Historical implementation

The code listed by `runs/MOD-CONTACTS-20260913-001/03-build.json` must be audited
and either adopted by an approved task or replaced. Its presence is not phase
completion evidence.

## Customer 360 parity remediation

The user-directed remediation is specified in
`customer360-parity-remediation.md` and represented by
`CONTACTS-CAP-CUSTOMER360-OPERATIONS` in `delivery-ledger.json`. The plan must
approve and sequence the following blocked tasks before production code starts:

1. `CUSTOMER360-CONTRACT-PLATFORM-PORTS`.
2. `CUSTOMER360-MOBILE-WORK`.
3. `CUSTOMER360-MOBILE-SALES-ACTIVITY`.
4. `CUSTOMER360-MOBILE-DOCUMENTS`.
5. `CUSTOMER360-MOBILE-PRODUCTS`.

Each task is operation-level and requires focused component validation. A
browser journey is required only when its task evidence level or risk demands
it. No Customer 360 operation may move from `missing` to `implemented` based
on a route, data projection or visual section alone.