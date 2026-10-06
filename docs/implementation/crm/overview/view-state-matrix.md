# CRM Overview View / State Matrix

Normative source for `MOD-CRM-20260927-001:01-visual-design`. Styled
wireframes are review evidence; they do not close a state until runtime
validation exists.

| View / flow | Desktop styled evidence | Mobile styled evidence | Loading | Empty | Error | Forbidden | Conflict | Offline | Pending | Success | Non-color cues / accessibility / reuse |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Overview shell + filters | `visual-desktop.svg#header` | `visual-mobile.svg#header` | skeleton header/filter geometry; one polite announcement | explain missing scope/period; offer filter reset | inline retry with correlation text | neutral “not available” without scope detail | n/a (read-only) | preserve authorized filters; stale banner | refresh button busy state | query params restored on reload | landmarks, labels, Escape, focus return; `PageHeader`, `DateRangeFilter`, `Select`, `Popover`, `Command` |
| KPI grid | `visual-desktop.svg#kpis` | `visual-mobile.svg#kpis` | four `StatCard` skeletons | “No KPI data for this period”; never fabricated zero | card-level retry; other cards remain usable | card replaced with permission message; no cached value | n/a (read-only) | last authorized values with timestamp | refresh/fetch indicator | value, comparison, freshness and source period | text trend, tabular numbers, heading per card; `StatCard`, Analytics contract |
| Pipeline health | `visual-desktop.svg#pipeline` | `visual-mobile.svg#pipeline` | stage-row skeletons | scope/period explanation and change-filter action | card retry and unaffected summaries remain | neutral card; no stage names/counts | n/a (read-only) | stale snapshot labelled | query pending without shift | stage counts/value, health explanation and links | progress has text and label; `SurfaceCard`, CRM contract |
| Compact task summary | `visual-desktop.svg#tasks` | `visual-mobile.svg#tasks` | row skeletons | “No tasks in this scope”; link to Tasks only if allowed | retry; preserve pipeline data | no task names/counts; permission message | optional transition conflict links to Tasks | stale rows labelled; clear on scope loss | transition/deep-link pending | next/overdue rows and authorized deep link | 44px rows, status text/icon, Tasks contract; no workspace duplicate |
| Business activity summary | `visual-desktop.svg#activity` | `visual-mobile.svg#activity` | row skeletons | “No business activity in this period” | retry; preserve successful cards | neutral message without source/entity disclosure | n/a (read-only) | last authorized deduped rows labelled | refresh pending | one deduplicated chronological summary and activity link | source/type text, timestamps localized, Activity contract; no duplicate timeline |
| Deep link / back navigation | route-level | AppShell mobile route | destination loading | target list empty state | not-found with recovery to dashboard | permission re-check and neutral forbidden | target version conflict handled by owner route | offline destination explains unavailable | navigation progress | authorized destination with filter context | focus destination heading, browser back and query restoration |

## State rules

- State is independent per data source; a failed activity query must not
  replace successful KPI or pipeline content with a global error.
- Offline content is shown only when the cached scope hash matches the active
  tenant/membership scope. Revocation or organization switch clears it before
  rendering.
- Color communicates status only in combination with text, icon, label or
  position. Risk and trend always have a textual explanation.
- Runtime screenshots and test output must be added during `07-build`/`08-verify`;
  this gate records conceptual evidence only.
