import { useState } from "react";
import { Bell, CheckCheck, Trash2, X, AlertTriangle, AlertCircle, CheckCircle2, Info, Settings2, ArrowLeft, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { notificationsStore } from "@/data/mockNotifications";
import { useLocalStore } from "@/lib/localStore";
import { useNotificationPrefs } from "@/hooks/use-notification-prefs";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";

const toneIcon: Record<Notification["type"], LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const toneClasses: Record<Notification["type"], string> = {
  info: "bg-info/10 text-info ring-info/20",
  success: "bg-success/10 text-success ring-success/20",
  warning: "bg-warning/10 text-warning ring-warning/20",
  error: "bg-destructive/10 text-destructive ring-destructive/20",
};

const typeLabel: Record<Notification["type"], string> = {
  info: "Informational",
  success: "Success",
  warning: "Warnings",
  error: "Errors & alerts",
};

const typeDescription: Record<Notification["type"], string> = {
  info: "Tips, mentions, and product updates",
  success: "Completed jobs and deliveries",
  warning: "Approaching limits or attention needed",
  error: "Failures and critical incidents",
};

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diffMin = Math.max(1, Math.round((Date.now() - d) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.round(diffMin / 60)}h ago`;
  return `${Math.round(diffMin / 1440)}d ago`;
}

export function NotificationsMenu() {
  const items = useLocalStore(notificationsStore) as readonly Notification[];
  const { prefs, setType, setChannel } = useNotificationPrefs();
  const visibleItems = items.filter((n) => prefs.types[n.type]);
  const unread = visibleItems.filter((n) => !n.read).length;
  const navigate = useNavigate();
  const [view, setView] = useState<"feed" | "prefs">("feed");

  const markAll = () => {
    items.forEach((n) => {
      if (!n.read) notificationsStore.update(n.id, { read: true });
    });
    toast.success("All notifications marked as read");
  };

  const clearAll = () => {
    if (items.length === 0) return;
    notificationsStore.replace([]);
    toast("Notifications cleared", { description: "Your inbox is now empty." });
  };

  const markRead = (id: string, read = true) => {
    notificationsStore.update(id, { read });
  };

  const remove = (id: string) => {
    notificationsStore.remove(id);
  };

  const onItemClick = (n: Notification) => {
    if (!n.read) markRead(n.id, true);
    if (n.link) navigate(n.link);
  };

  return (
    <DropdownMenu onOpenChange={(o) => !o && setView("feed")}>
      <DropdownMenuTrigger
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground/85 transition-fast hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted data-[state=open]:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-[17px] w-[17px]" />
        {unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 animate-scale-in items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground ring-2 ring-background">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[380px] overflow-hidden rounded-xl border-border bg-popover p-0 shadow-[0_20px_50px_-20px_hsl(var(--foreground)/0.25)]"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            {view === "prefs" && (
              <button
                onClick={() => setView("feed")}
                aria-label="Back to notifications"
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            )}
            <p className="font-display text-sm font-semibold tracking-tight text-foreground">
              {view === "feed" ? "Notifications" : "Preferences"}
            </p>
            {view === "feed" && unread > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                {unread} new
              </span>
            )}
          </div>
          {view === "feed" ? (
          <div className="flex items-center gap-0.5">
            <button
              onClick={markAll}
              disabled={unread === 0}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-fast hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all
            </button>
            <button
              onClick={clearAll}
              disabled={items.length === 0}
              aria-label="Clear all notifications"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-fast hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("prefs")}
              aria-label="Notification preferences"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </div>
          ) : null}
        </div>
        {view === "prefs" ? (
          <div className="max-h-[420px] overflow-y-auto">
            <div className="border-b border-border px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Channels
              </p>
              <ul className="mt-2 space-y-2">
                {(["inApp", "email", "push", "sound"] as const).map((ch) => (
                  <li key={ch} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {ch === "inApp" ? "In-app feed" : ch === "email" ? "Email" : ch === "push" ? "Push" : "Sound"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {ch === "inApp" ? "Show this dropdown" : ch === "email" ? "Daily digest emails" : ch === "push" ? "Browser push alerts" : "Play a chime on arrival"}
                      </p>
                    </div>
                    <Switch
                      checked={prefs.channels[ch]}
                      onCheckedChange={(v) => setChannel(ch, v)}
                      aria-label={`${ch} channel`}
                    />
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Types
              </p>
              <ul className="mt-2 space-y-2">
                {(Object.keys(prefs.types) as Notification["type"][]).map((t) => {
                  const Icon = toneIcon[t];
                  return (
                    <li key={t} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <span
                          className={cn(
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                            toneClasses[t],
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{typeLabel[t]}</p>
                          <p className="text-[11px] text-muted-foreground">{typeDescription[t]}</p>
                        </div>
                      </div>
                      <Switch
                        checked={prefs.types[t]}
                        onCheckedChange={(v) => setType(t, v)}
                        aria-label={`${t} notifications`}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="border-t border-border bg-card-muted/40 px-4 py-2.5 text-[11px] text-muted-foreground">
              Saved automatically to this device.
            </div>
          </div>
        ) : (
        <>
        <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
          {visibleItems.map((n) => {
            const Icon = toneIcon[n.type];
            return (
              <li
                key={n.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onItemClick(n);
                  }
                }}
                className={cn(
                  "group relative flex cursor-pointer gap-3 px-4 py-3 transition-fast hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none",
                  !n.read && "bg-primary-soft/30",
                )}
                onClick={() => onItemClick(n)}
              >
                {!n.read && (
                  <span
                    aria-hidden="true"
                    className="absolute start-0 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-e-full bg-primary"
                  />
                )}
                <span
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                    toneClasses[n.type],
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 pe-6">
                  <div className="flex items-baseline gap-2">
                    <p className={cn("truncate text-sm leading-snug text-foreground", !n.read ? "font-semibold" : "font-medium")}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {n.message}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <p className="text-[11px] tabular-nums text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markRead(n.id, n.read ? false : true);
                      }}
                      aria-pressed={!n.read}
                      className="text-[11px] font-semibold text-primary transition-fast hover:underline focus-visible:outline-none focus-visible:underline"
                    >
                      {n.read ? "Mark unread" : "Mark read"}
                    </button>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(n.id);
                  }}
                  aria-label="Dismiss notification"
                  className="absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-fast hover:bg-muted hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
          {visibleItems.length === 0 && (
            <li className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-muted-foreground">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted ring-1 ring-inset ring-border">
                <Bell className="h-5 w-5 opacity-60" />
              </span>
              <p className="font-medium text-foreground">
                {items.length === 0 ? "You're all caught up" : "All filtered out"}
              </p>
              <p className="text-xs text-muted-foreground/80">
                {items.length === 0 ? "No new notifications" : "Enable types in preferences to see more"}
              </p>
            </li>
          )}
        </ul>
        <div className="flex items-center justify-between border-t border-border bg-card-muted/40 px-4 py-2.5">
          <p className="text-[11px] text-muted-foreground">
            {visibleItems.length}
            {items.length !== visibleItems.length && ` of ${items.length}`} shown
          </p>
          <button
            onClick={() => navigate("/reports/activity")}
            className="rounded-md px-1.5 py-0.5 text-xs font-semibold text-primary transition-fast hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            View all activity →
          </button>
        </div>
        </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
