# CRM Pipeline View / State Matrix

> Normative source linked by `visual-design.md`; SVGs are review evidence
> only.

| View / flow | Desktop | Mobile | Loading | Empty | Error | Forbidden | Conflict | Offline | Pending | Success | Accessibility / reuse evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Kanban board | Styled Rivera columns with realistic cards | Styled active stage + horizontal cards | Skeleton shape + “Loading pipeline” | Icon + “No opportunities” + create CTA | Alert icon + retry | Lock icon + permission copy | Warning icon + “Review changes” | Cloud-off icon + queue copy | Spinner + “Syncing” text | Check icon + stage announcement | K1–K7; `pipeline-kanban-rivera.svg`; keyboard move command |
| Opportunity card | Rich styled card with actions | Condensed styled card, same menu | Skeleton + text | N/A | Inline alert + retry | Lock icon + no sensitive data | Stale badge + review | Cloud-off badge + text | Spinner + pending label | Check icon + confirmation | C1–C4; non-color status labels |
| Opportunity table | Styled dense rows and cursor controls | Compact styled rows + drawer | Row skeletons + label | Icon + explanation + create CTA | Alert + retry | Lock + scope explanation | Row stale marker + review | Queue banner + cloud-off icon | Row sync label | Check + updated-row announcement | T1–T5; `pipeline-surfaces-rivera.svg`; shared Table |
| Opportunity detail | Styled two-column summary + tabs | Stacked styled summary + sheet actions | Skeleton + “Loading detail” | N/A | Alert + retry | Lock + no record leakage | Freshness alert + review | Read-only/queued notice + icon | Save status + spinner | Check + updated history | D1–D5; focus restore and live region |
| Manual creation | Styled Rivera drawer | Styled full-screen sheet | Form skeleton + label | N/A | Preserve fields + alert/retry | Lock + permission explanation | Duplicate warning + review | Queue only if allowed + cloud-off | Disabled duplicate + progress text | Check + detail link | F1–F5; labels/errors; non-color cues |
| Global state semantics | Inline alerts/status primitives | Sticky status where needed | Skeletons | Contextual next action | Recovery always visible | Never expose sensitive data | Explicit keep/review choice | Explain capabilities | Announce status | Confirm result and next action | Color + text/icon; reduced motion; RTL |

## Artifact links

- Structural: `wireframes/pipeline-kanban.svg`, `wireframes/pipeline-surfaces.svg`
- Styled Rivera: `wireframes/pipeline-kanban-rivera.svg`, `wireframes/pipeline-surfaces-rivera.svg`

## Validation levels

| Level | When | Evidence | Status |
|---|---|---|---|
| Conceptual approval | Before implementation | Markdown source, baseline inventory, styled SVGs, zone reuse and state review | `PENDING` |
| Runtime comparison | After implementation | Canonical route screenshots/visual diffs at approved desktop/mobile viewports | `NOT_RUN` |

## Review rule

Every applicable state above requires a visual review comment or approval
evidence. No row is considered approved because a production component or
route already exists.
