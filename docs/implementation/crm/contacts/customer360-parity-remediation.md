# Customer 360 Parity Remediation

## Decision

The delivery direction is functional parity between desktop web and mobile web
for Customer 360. Parity is assessed independently for domain, renderer and
operations. This remediation is `REQUIRED_FOLLOW_UP` until the canonical
design and plan gates record formal approval; it must not make the historical
Contacts build eligible to resume.

## Observable baseline

| Area | Desktop web | Mobile web | Decision |
| --- | --- | --- | --- |
| Profile, contact detail, edit and archive | Implemented | Implemented | Verify states and lifecycle |
| Leads and opportunities | Lists and related-record navigation are implemented; create buttons have no callback | Summary only | Implement mobile navigation; do not count unbound desktop buttons as parity targets |
| Tasks | List and related-task navigation | Count only | Extend the shared Tasks port and implement mobile detail/navigation |
| Notes | View, create, edit and delete through Platform Notes | Count only | Extend the shared Notes port and implement a native mobile editor flow |
| Documents | Upload, filter, preview and delete through Platform Files | Missing | Extend Platform Files with a mobile-safe port and renderer |
| Products | View, associate and catalog navigation | Missing | Expose a shared catalog/customer-product port and mobile flow |
| Activity | Recent records, targets and full activity route | Summary only | Implement target navigation and full activity route or approve an equivalent mobile route |

## Architecture decision

Mobile must not import desktop `src/` components, adapters or stores. Notes,
Tasks, Files and Catalog work must first expose a neutral contract under
`packages/contracts`, then receive explicit desktop and mobile adapters. A
mobile screen-local store or copied desktop drawer is prohibited.

## Implementation order

1. Define shared Customer 360 operation metadata and neutral ports for the
   missing Platform capabilities.
2. Implement mobile Notes and Tasks, including focused component tests for
   create/edit/delete or navigation outcomes.
3. Implement mobile activity targets and Sales navigation.
4. Implement mobile Files and Products once their Platform adapters exist.
5. Reassess each operation in the ledger; only mark it `implemented` after the
   platform task and its focused validation complete.

## Blockers

- The Contacts run has no approved design, visual design, specialized analysis
  or plan and its tasks cannot become `ready` yet.
- Existing Notes, Tasks, Files and Catalog implementations are desktop runtime
  modules. Shared mobile-safe ports and adapters are absent.
- Customer 360 create-lead and create-opportunity buttons on desktop do not
  invoke a command, so they are not an implemented baseline to duplicate.