import { useMemo, useState } from "react";
import { Activity as ActivityIcon } from "lucide-react";
import { DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { activityStore, usersStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatDateTime, getInitials } from "@/lib/formatters";

const ACTION_TONE: Record<string, "success" | "info" | "warning" | "destructive" | "neutral"> = {
  created: "success",
  updated: "info",
  deleted: "destructive",
  invited: "info",
  exported: "neutral",
  uploaded: "info",
  commented: "neutral",
  logged_in: "neutral",
  logged_out: "neutral",
};

export default function ActivityPage() {
  const { trail } = useBreadcrumbs();
  const activity = useLocalStore(activityStore);
  const users = useLocalStore(usersStore);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const [search, setSearch] = useState("");
  const [actionF, setActionF] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activity
      .filter((a) => !q || a.summary.toLowerCase().includes(q))
      .filter((a) => !actionF.length || actionF.includes(a.action))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [activity, search, actionF]);

  const actions = Array.from(new Set(activity.map((a) => a.action))).map((a) => ({ value: a, label: a.replace("_", " ") }));

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Projects"
        title="Activity"
        description="A chronological feed of changes across the workspace."
        breadcrumbs={trail}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search activity…" size="sm" containerClassName="w-60" />
        <FilterDropdown label="Action" multiple value={actionF} onChange={setActionF} options={actions} size="sm" align="end" />
      </div>

      <DataCard>
        {filtered.length === 0 ? (
          <EmptyState icon={ActivityIcon} title="No activity" />
        ) : (
          <ol className="relative space-y-5 border-l border-border pl-5">
            {filtered.map((a) => {
              const u = userMap.get(a.actorId);
              return (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full bg-card ring-2 ring-border">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[8px]">{getInitials(u?.name ?? "?")}</AvatarFallback>
                    </Avatar>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{u?.name ?? "System"}</span>
                    <StatusBadge tone={ACTION_TONE[a.action] ?? "neutral"}>{a.action.replace("_", " ")}</StatusBadge>
                    <span className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.summary}</p>
                </li>
              );
            })}
          </ol>
        )}
      </DataCard>
    </PageContainer>
  );
}