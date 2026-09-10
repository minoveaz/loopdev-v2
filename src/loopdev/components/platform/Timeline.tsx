import { History } from "lucide-react";
import { DataCard } from "@/components/common";
import type { TimelineEvent } from "@/loopdev/domains/platform";

export function PlatformTimeline({ events, loading = false, error }: { events: TimelineEvent[]; loading?: boolean; error?: string | null }) {
  const deduped = [...new Map(events.map((event) => [event.dedupeKey, event])).values()];
  return (
    <DataCard title="Timeline" description="Append-only chronology, deduplicated by source" loading={loading} error={error} empty={!loading && !error && deduped.length === 0} emptyIcon={History} emptyTitle="No timeline events" emptyDescription="Changes from Tasks, Notes and CRM will be added here.">
      <ol className="relative ml-2 space-y-4 border-l border-border pl-5" aria-label="Timeline">
        {deduped.map((event) => (
          <li key={event.dedupeKey} className="relative"><span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" aria-hidden="true" /><p className="text-sm font-medium">{event.summary}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(event.occurredAt).toLocaleString()} · {event.type}</p></li>
        ))}
      </ol>
    </DataCard>
  );
}
