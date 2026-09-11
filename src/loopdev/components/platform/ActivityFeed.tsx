import { ActivityFeed } from "@/components/common";
import type { ActivityFeedItem } from "@/components/common";
import type { ActivityRecord } from "@/loopdev/domains/platform";

export function PlatformActivityFeed({ activities, loading = false, error }: { activities: ActivityRecord[]; loading?: boolean; error?: string | null }) {
  const items: ActivityFeedItem[] = activities.map((item) => ({
    id: item.id,
    actorLabel: item.actorType,
    actorInitials: item.actorType.slice(0, 2).toUpperCase(),
    action: item.type,
    occurredAt: item.occurredAt,
    summary: item.summary,
  }));
  return <ActivityFeed title="Activities" description="Business events, separate from internal audit logs" items={items} loading={loading} error={error} emptyTitle="No activities yet" emptyDescription="Task, note and CRM actions will appear here." />;
}
