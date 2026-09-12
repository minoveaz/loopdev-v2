import { Bell, Check } from "lucide-react";
import { DataCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import type { NotificationRecord } from "@/loopdev/domains/platform";

export function PlatformNotificationFeed({ notifications, loading = false, error, onMarkRead }: { notifications: NotificationRecord[]; loading?: boolean; error?: string | null; onMarkRead?: (notification: NotificationRecord) => Promise<unknown> }) {
  return (
    <DataCard title="Notifications" description="In-app assignments and relevant changes" loading={loading} error={error} empty={!loading && !error && notifications.length === 0} emptyIcon={Bell} emptyTitle="All caught up" emptyDescription="New assignments and changes will appear here.">
      <ul className="space-y-2" aria-label="Notifications">{notifications.map((notification) => <li key={notification.id} className="flex items-start gap-3 rounded-lg border border-border p-3"><Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{notification.title}</p><p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p></div>{notification.status === "unread" && onMarkRead && <Button size="sm" variant="ghost" aria-label={`Mark ${notification.title} as read`} onClick={() => void onMarkRead(notification)}><Check className="h-4 w-4" /></Button>}</li>)}</ul>
    </DataCard>
  );
}
