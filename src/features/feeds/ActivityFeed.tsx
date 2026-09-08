import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollText, Trash2, FilterX, Eraser } from "lucide-react";
import { toast } from "sonner";
import {
  DataCard,
  DateRangeFilter,
  EmptyState,
  FilterDropdown,
  SearchInput,
  StatusBadge,
  ConfirmDialog,
} from "@/components/common";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { activityStore, usersStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import { formatDate, formatRelative, getInitials, titleCase } from "@/lib/formatters";
import { severityForAction, severityTone } from "@/features/reports/shared";
import type { ActivityAction, ActivityLog, User } from "@/types";
import type { DateRange } from "react-day-picker";

/**
 * Reusable activity-log feed. Reads from `activityStore` and lets the user
 * dismiss individual entries (persisted to localStorage). Use `limit` for
 * dashboard widgets and full-bleed mode for standalone pages.
 */
export interface ActivityFeedProps {
  limit?: number;
  card?: boolean;
  title?: string | null;
  className?: string;
  /** Show per-row delete affordance. Defaults to true. */
  dismissible?: boolean;
  /** Where the "View all" link should send users. */
  viewAllHref?: string;
  /** Show search + action/entity/date filters above the list. */
  filterable?: boolean;
}

export function ActivityFeed({
  limit,
  card = true,
  title = "Recent activity",
  className,
  dismissible = true,
  viewAllHref = "/reports/activity",
  filterable = false,
}: ActivityFeedProps) {
  const logs = useLocalStore(activityStore) as readonly ActivityLog[];
  const users = useLocalStore(usersStore) as readonly User[];
  const navigate = useNavigate();
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const [search, setSearch] = useState("");
  const [actions, setActions] = useState<string[]>([]);
  const [entities, setEntities] = useState<string[]>([]);
  const [range, setRange] = useState<DateRange | undefined>();
  const [confirmClear, setConfirmClear] = useState(false);

  const counts = useMemo(() => {
    const a = new Map<string, number>();
    const e = new Map<string, number>();
    for (const l of logs) {
      a.set(l.action, (a.get(l.action) ?? 0) + 1);
      e.set(l.entity, (e.get(l.entity) ?? 0) + 1);
    }
    return { a, e };
  }, [logs]);

  const actionOptions = useMemo(
    () =>
      Array.from(counts.a.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([value, count]) => ({ value, label: titleCase(value), count })),
    [counts.a],
  );
  const entityOptions = useMemo(
    () =>
      Array.from(counts.e.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([value, count]) => ({ value, label: titleCase(value), count })),
    [counts.e],
  );

  const filtered = useMemo(() => {
    if (!filterable) return logs;
    const q = search.trim().toLowerCase();
    const from = range?.from ? new Date(range.from).setHours(0, 0, 0, 0) : null;
    const to = range?.to
      ? new Date(range.to).setHours(23, 59, 59, 999)
      : range?.from
      ? new Date(range.from).setHours(23, 59, 59, 999)
      : null;
    return logs.filter((l) => {
      if (actions.length && !actions.includes(l.action)) return false;
      if (entities.length && !entities.includes(l.entity)) return false;
      if (from !== null) {
        const t = new Date(l.createdAt).getTime();
        if (t < from || (to !== null && t > to)) return false;
      }
      if (q) {
        const actor = userMap.get(l.actorId)?.name?.toLowerCase() ?? "";
        const hay = `${l.summary} ${l.entity} ${l.entityId} ${l.action} ${actor}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filterable, logs, search, actions, entities, range, userMap]);

  const activeFilterCount =
    (search ? 1 : 0) + (actions.length ? 1 : 0) + (entities.length ? 1 : 0) + (range?.from ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setActions([]);
    setEntities([]);
    setRange(undefined);
  };

  const sorted = [...(filterable ? filtered : logs)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const visible = typeof limit === "number" ? sorted.slice(0, limit) : sorted;

  const remove = (id: string) => {
    activityStore.remove(id);
    toast("Entry removed");
  };

  const clearAll = () => {
    const count = logs.length;
    activityStore.replace([]);
    setConfirmClear(false);
    toast.success("Activity cleared", {
      description: `Removed ${count} ${count === 1 ? "entry" : "entries"} from this device.`,
    });
  };

  const filterBar = filterable ? (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card-muted/40 px-4 py-3">
      <SearchInput
        size="sm"
        value={search}
        onValueChange={setSearch}
        placeholder="Search activity…"
        containerClassName="w-full max-w-xs"
      />
      <FilterDropdown
        label="Action"
        size="sm"
        multiple
        value={actions}
        onChange={(v) => setActions(v as ActivityAction[])}
        options={actionOptions}
      />
      <FilterDropdown
        label="Entity"
        size="sm"
        multiple
        value={entities}
        onChange={setEntities}
        options={entityOptions}
      />
      <DateRangeFilter
        size="sm"
        value={range}
        onChange={setRange}
        placeholder="Time range"
        maxDate={new Date()}
      />
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto gap-1.5">
          <FilterX className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  ) : null;

  const list = (
    <ol className="divide-y divide-border">
      {visible.map((log) => {
        const actor = userMap.get(log.actorId);
        const sev = severityForAction(log.action);
        return (
          <li
            key={log.id}
            className="group flex items-start gap-3 px-4 py-3 transition-fast hover:bg-muted/40"
          >
            <Avatar className="h-8 w-8 shrink-0 border border-border">
              <AvatarImage src={actor?.avatarUrl} alt={actor?.name} />
              <AvatarFallback className="bg-primary-soft text-[10px] font-medium text-primary">
                {getInitials(actor?.name ?? "·")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {actor?.name ?? "Unknown user"}
                </span>
                <StatusBadge tone="neutral" variant="outline">
                  {titleCase(log.action)}
                </StatusBadge>
                <StatusBadge tone={severityTone[sev]} dot>
                  {sev}
                </StatusBadge>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{log.summary}</p>
              <p
                className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                title={formatDate(log.createdAt, "datetime")}
              >
                {formatRelative(log.createdAt)} · {log.entity}/{log.entityId}
              </p>
            </div>
            {dismissible && (
              <button
                onClick={() => remove(log.id)}
                aria-label="Remove entry"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-fast hover:bg-muted hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );

  const empty = (
    <div className="p-8">
      <EmptyState
        icon={ScrollText}
        title={activeFilterCount ? "No matches" : "No recent activity"}
        description={
          activeFilterCount
            ? "Try adjusting search, action, entity, or time range filters."
            : "System and user events will appear here."
        }
        action={
          activeFilterCount ? (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Reset filters
            </Button>
          ) : undefined
        }
      />
    </div>
  );

  const body = (
    <>
      {filterBar}
      {visible.length === 0 ? empty : list}
      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear all activity?"
        description={`This permanently removes ${logs.length} recent ${
          logs.length === 1 ? "entry" : "entries"
        } from your local activity log. This action cannot be undone.`}
        confirmLabel="Clear activity"
        tone="destructive"
        onConfirm={clearAll}
      />
    </>
  );
  if (!card) return <div className={className}>{body}</div>;

  return (
    <DataCard
      flush
      className={className}
      title={title ?? undefined}
      description={
        title
          ? filterable && activeFilterCount > 0
            ? `${visible.length} of ${logs.length} events`
            : `${logs.length} events tracked`
          : undefined
      }
      action={
        title ? (
          <div className="flex items-center gap-1">
            {logs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmClear(true)}
                className="gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <Eraser className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate(viewAllHref)}>
              View all
            </Button>
          </div>
        ) : null
      }
    >
      {body}
    </DataCard>
  );
}