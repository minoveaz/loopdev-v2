import { Activity, CalendarClock } from "lucide-react";
import { DataCard } from "@/components/common";
import type { ActivityRecord } from "@/loopdev/domains/platform";

export function PlatformActivityFeed({ activities, loading = false, error }: { activities: ActivityRecord[]; loading?: boolean; error?: string | null }) {
  return (
    <DataCard title="Activities" description="Business events, separate from internal audit logs" loading={loading} error={error} empty={!loading && !error && activities.length === 0} emptyIcon={Activity} emptyTitle="No activities yet" emptyDescription="Task, note and CRM actions will appear here.">
      <ol className="space-y-3" aria-label="Activity feed">
        {activities.map((item) => (
          <li key={item.id} className="flex gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
            <span className="mt-0.5 rounded-full bg-primary-soft p-1.5 text-primary" aria-hidden="true"><Activity className="h-3.5 w-3.5" /></span>
            <div className="min-w-0 flex-1"><p className="text-sm">{item.summary}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3 w-3" />{new Date(item.occurredAt).toLocaleString()} · {item.actorType}</p></div>
          </li>
        ))}
      </ol>
    </DataCard>
  );
}
