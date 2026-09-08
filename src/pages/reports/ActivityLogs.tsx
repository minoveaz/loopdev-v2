import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollText } from "lucide-react";
import { DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge, TablePagination } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { activityStore, mockUsers } from "@/data";
import { formatDate, formatRelative, getInitials, titleCase } from "@/lib/formatters";
import { ACTIVITY_ACTIONS, severityForAction, severityTone } from "@/features/reports/shared";
import type { ActivityAction, ActivityLog } from "@/types";

/** Derive an enriched, deterministic activity dataset for the timeline. */
function buildEnriched(seed: ActivityLog[]): ActivityLog[] {
  const extras: ActivityLog[] = [];
  const entities = ["project", "task", "order", "invoice", "user", "file", "report"];
  const summaries: Record<ActivityAction, string[]> = {
    created: ["Created project — Coastline Brand", "Created task — Sprint review notes", "Created invoice INV-2026-0091"],
    updated: ["Updated milestone — Q2 release", "Updated permissions on Editor role", "Updated order ORD-30418"],
    deleted: ["Deleted draft invoice INV-2026-0027", "Removed archived project Driftwood"],
    logged_in: ["Signed in from Lisbon", "Signed in from Berlin", "Signed in from New York"],
    logged_out: ["Session expired", "Signed out manually"],
    invited: ["Invited collaborator to Atlas Rebrand", "Invited new member as Viewer"],
    exported: ["Exported sales report Q1", "Exported customer list", "Exported activity log CSV"],
    uploaded: ["Uploaded brief.pdf (820KB)", "Uploaded analytics_q1.csv (3.2MB)"],
    commented: ["Commented on Sage editorial layout", "Replied on milestone thread"],
  };
  const day = 24 * 60 * 60 * 1000;
  for (let i = 0; i < 38; i++) {
    const action = ACTIVITY_ACTIONS[i % ACTIVITY_ACTIONS.length];
    const actor = mockUsers[i % mockUsers.length];
    const entity = entities[i % entities.length];
    const summaryPool = summaries[action];
    const summary = summaryPool[i % summaryPool.length];
    const ts = new Date(Date.now() - (i + 2) * (day / 3) - i * 7 * 60_000).toISOString();
    extras.push({
      id: `a_ext_${i + 1}`,
      actorId: actor.id,
      action,
      entity,
      entityId: `${entity}_${100 + i}`,
      summary,
      createdAt: ts,
      updatedAt: ts,
    });
  }
  return [...seed, ...extras].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

const SEVERITY_OPTIONS = [
  { label: "All severities", value: "all" },
  { label: "Info", value: "info" },
  { label: "Success", value: "success" },
  { label: "Warning", value: "warning" },
  { label: "Critical", value: "critical" },
];

const ACTION_OPTIONS = [
  { label: "All actions", value: "all" },
  ...ACTIVITY_ACTIONS.map((a) => ({ label: titleCase(a), value: a })),
];

export default function ActivityLogs() {
  const { trail } = useBreadcrumbs();
  const [logs] = useState(() => buildEnriched(activityStore.list()));
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [action, setAction] = useState("all");
  const [user, setUser] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const userOptions = useMemo(
    () => [
      { label: "All users", value: "all" },
      ...mockUsers.map((u) => ({ label: u.name, value: u.id })),
    ],
    [],
  );

  const usersById = useMemo(() => {
    const map = new Map(mockUsers.map((u) => [u.id, u] as const));
    return map;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (severity !== "all" && severityForAction(l.action) !== severity) return false;
      if (action !== "all" && l.action !== action) return false;
      if (user !== "all" && l.actorId !== user) return false;
      if (q) {
        const actor = usersById.get(l.actorId);
        const haystack = `${l.summary} ${l.entity} ${l.entityId} ${actor?.name ?? ""} ${actor?.email ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [logs, search, severity, action, user, usersById]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  function resetPage<T>(setter: (v: T) => void) {
    return (val: T) => {
      setter(val);
      setPage(1);
    };
  }

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Reports"
        title="Activity Logs"
        description="A searchable timeline of system and user activity across Rivera."
        breadcrumbs={trail.length ? trail : [{ label: "Reports" }, { label: "Activity Logs" }]}
      />

      <DataCard flush>
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <div className="md:max-w-sm md:flex-1">
            <SearchInput
              placeholder="Search activity, user, or resource…"
              value={search}
              onValueChange={resetPage(setSearch)}
              size="sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="Severity"
              value={severity}
              onChange={resetPage(setSeverity)}
              size="sm"
              options={SEVERITY_OPTIONS}
            />
            <FilterDropdown
              label="Action"
              value={action}
              onChange={resetPage(setAction)}
              size="sm"
              options={ACTION_OPTIONS}
            />
            <FilterDropdown
              label="User"
              value={user}
              onChange={resetPage(setUser)}
              size="sm"
              options={userOptions}
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={ScrollText}
              title="No activity matches your filters"
              description="Try clearing search or selecting a different severity or user."
            />
          </div>
        ) : (
          <ol className="divide-y divide-border">
            {visible.map((log) => {
              const actor = usersById.get(log.actorId);
              const sev = severityForAction(log.action);
              return (
                <li key={log.id} className="flex items-start gap-4 px-5 py-4 transition-fast hover:bg-muted/40">
                  <Avatar className="h-9 w-9 shrink-0 border border-border">
                    <AvatarImage src={actor?.avatarUrl} alt={actor?.name} />
                    <AvatarFallback className="bg-primary-soft text-xs font-medium text-primary">
                      {getInitials(actor?.name ?? "·")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{actor?.name ?? "Unknown user"}</span>
                      <StatusBadge tone="neutral" variant="outline">{titleCase(log.action)}</StatusBadge>
                      <StatusBadge tone={severityTone[sev]} dot>{sev}</StatusBadge>
                      <span className="font-mono text-[11px] text-muted-foreground">{log.entity}/{log.entityId}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{log.summary}</p>
                  </div>
                  <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
                    <div className="font-medium text-foreground">{formatRelative(log.createdAt)}</div>
                    <div className="font-mono">{formatDate(log.createdAt, "datetime")}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <TablePagination
          page={safePage}
          pageCount={pageCount}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      </DataCard>
    </PageContainer>
  );
}