import { BellOff, Bell, CheckCheck, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DataCard, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { notificationsStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatRelative } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types";
import { useNotificationPrefs } from "@/hooks/use-notification-prefs";

/**
 * Reusable notifications feed. Reads from `notificationsStore`
 * and persists every mutation through localStorage.
 */
export interface NotificationsFeedProps {
  /** Optional cap on visible items (latest first). */
  limit?: number;
  /** When false, renders the list without the surrounding DataCard. */
  card?: boolean;
  /** Optional title shown in the header. Pass `null` to hide the header. */
  title?: string | null;
  className?: string;
}

const dotTone: Record<NotificationType, string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
};

export function NotificationsFeed({
  limit,
  card = true,
  title = "Notifications",
  className,
}: NotificationsFeedProps) {
  const items = useLocalStore(notificationsStore) as readonly Notification[];
  const navigate = useNavigate();
  const { prefs } = useNotificationPrefs();

  // Respect user preferences: in-app channel master switch + per-type toggles.
  const allowed = prefs.channels.inApp
    ? items.filter((n) => prefs.types[n.type] !== false)
    : [];

  // Newest first; clone before sort because snapshot is readonly.
  const sorted = [...allowed].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const visible = typeof limit === "number" ? sorted.slice(0, limit) : sorted;
  const unread = allowed.filter((n) => !n.read).length;

  const markAll = () => {
    if (unread === 0) return;
    allowed.forEach((n) => {
      if (!n.read) notificationsStore.update(n.id, { read: true });
    });
    toast.success("All notifications marked as read");
  };

  const clearAll = () => {
    if (allowed.length === 0) return;
    // Only remove items currently allowed by prefs — keep muted ones intact.
    const allowedIds = new Set(allowed.map((n) => n.id));
    notificationsStore.replace(items.filter((n) => !allowedIds.has(n.id)));
    toast("Notifications cleared");
  };

  const onItemClick = (n: Notification) => {
    if (!n.read) notificationsStore.update(n.id, { read: true });
    if (n.link) navigate(n.link);
  };

  const list = (
    <ul className="divide-y divide-border">
      {visible.map((n) => (
        <li
          key={n.id}
          onClick={() => onItemClick(n)}
          className={cn(
            "group relative flex cursor-pointer gap-3 px-4 py-3 transition-fast hover:bg-muted/60",
            !n.read && "bg-primary-soft/40",
          )}
        >
          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotTone[n.type])} />
          <div className="min-w-0 flex-1 pr-6">
            <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {formatRelative(n.createdAt)}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              notificationsStore.remove(n.id);
            }}
            aria-label="Dismiss notification"
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-fast hover:bg-muted hover:text-destructive group-hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );

  const empty = (
    <div className="p-8">
      {prefs.channels.inApp ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description={
            items.length > 0
              ? "All matching notifications are filtered out by your current preferences."
              : "No notifications to show right now."
          }
          action={
            items.length > 0 ? (
              <Button variant="outline" size="sm" onClick={() => navigate("/account/settings")}>
                Adjust preferences
              </Button>
            ) : undefined
          }
        />
      ) : (
        <EmptyState
          icon={BellOff}
          title="In-app notifications are off"
          description="Turn the in-app channel back on in account settings to see alerts here."
          action={
            <Button variant="outline" size="sm" onClick={() => navigate("/account/settings")}>
              Open settings
            </Button>
          }
        />
      )}
    </div>
  );

  const body = visible.length === 0 ? empty : list;

  if (!card) return <div className={className}>{body}</div>;

  return (
    <DataCard
      flush
      className={className}
      title={title ?? undefined}
      description={
        title
          ? `${unread} unread · ${allowed.length} shown${
              allowed.length !== items.length ? ` · ${items.length - allowed.length} muted` : ""
            }`
          : undefined
      }
      action={
        title ? (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={markAll} disabled={unread === 0}>
              <CheckCheck className="h-3.5 w-3.5" />
              Mark read
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll} disabled={allowed.length === 0}>
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        ) : null
      }
    >
      {body}
    </DataCard>
  );
}