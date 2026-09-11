import type { ReactNode } from "react";
import { Activity as ActivityIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { DataCard } from "./DataCard";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";
import { formatDateTime } from "@/lib/formatters";
import { activityKindConfig, getActivityActionLabel, getActivityKind, getActivityStatusTone, type ActivityKind } from "./ActivityPresentation";

export interface ActivityFeedItem {
  id: string;
  kind?: ActivityKind;
  actorLabel: string;
  actorInitials?: string;
  action: string;
  actionLabel?: string;
  actionTone?: "success" | "info" | "warning" | "destructive" | "neutral";
  contextLabel?: string;
  targetHref?: string;
  targetLabel?: string;
  occurredAt: string;
  summary: string;
  groupLabel?: string;
}

interface ActivityFeedProps {
  items: ActivityFeedItem[];
  title?: string;
  description?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  loading?: boolean;
  error?: string | null;
  action?: ReactNode;
  onItemSelect?: (item: ActivityFeedItem) => void;
}

export function ActivityFeed({
  items,
  title = "Activity",
  description = "A chronological feed of changes across the workspace.",
  emptyTitle = "No activity",
  emptyDescription,
  loading = false,
  error,
  action,
  onItemSelect,
}: ActivityFeedProps) {
  return (
    <DataCard title={title} description={description} action={action} loading={loading} error={error} empty={!loading && !error && items.length === 0} emptyIcon={ActivityIcon} emptyTitle={emptyTitle} emptyDescription={emptyDescription}>
      {items.length === 0 ? (
        <EmptyState icon={ActivityIcon} title={emptyTitle} description={emptyDescription} />
      ) : (
        <ol className="relative space-y-5 border-l border-border pl-5" aria-label={title}>
          {items.map((item, index) => (
            <li key={item.id} className={`relative ${onItemSelect ? "cursor-pointer rounded-md transition-colors hover:bg-muted/40" : ""}`} onClick={() => onItemSelect?.(item)} onKeyDown={(event) => { if (onItemSelect && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onItemSelect(item); } }} role={onItemSelect ? "button" : undefined} tabIndex={onItemSelect ? 0 : undefined}>
              {item.groupLabel && (index === 0 || item.groupLabel !== items[index - 1]?.groupLabel) && <p className="mb-3 -ml-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.groupLabel}</p>}
              <span className={`absolute -left-[30px] flex h-7 w-7 items-center justify-center rounded-full border-2 border-card shadow-sm ring-1 ring-border/70 ${activityKindConfig[item.kind ?? getActivityKind(item.action)].iconBackground}`} aria-hidden="true">
                {(() => {
                  const kind = item.kind ?? getActivityKind(item.action);
                  const Icon = activityKindConfig[kind].icon;
                  return <Icon className={`h-3.5 w-3.5 stroke-[2] ${activityKindConfig[kind].iconClass}`} />;
                })()}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{item.actorLabel}</span>
                <span className="text-sm text-foreground">{item.actionLabel ?? getActivityActionLabel(item.action)}</span>
                {item.contextLabel && <StatusBadge tone={getActivityStatusTone(item.contextLabel) === "neutral" ? item.actionTone ?? "neutral" : getActivityStatusTone(item.contextLabel)} dot>{item.contextLabel}</StatusBadge>}
                <span className="text-xs text-muted-foreground">{formatDateTime(item.occurredAt)}</span>
                {item.targetHref && <Link to={item.targetHref} onClick={(event) => event.stopPropagation()} className="text-xs font-medium text-primary hover:underline">{item.targetLabel ?? "Open record"}</Link>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
            </li>
          ))}
        </ol>
      )}
    </DataCard>
  );
}
