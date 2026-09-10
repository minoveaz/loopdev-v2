import { PlatformAttachmentsPanel, PlatformNotesPanel, PlatformTaskList, PlatformTimeline } from "@/loopdev/components/platform";
import {
  usePlatformAttachments,
  usePlatformNotes,
  usePlatformTasks,
  usePlatformTimeline,
} from "@/loopdev/domains/platform";
import { platformAdapter } from "@/loopdev/domains/platform";
import type { EntityRef } from "@/loopdev/domains/platform";

export function Customer360PlatformSection({ contactId }: { contactId: string }) {
  const relation: EntityRef<"contact"> = {
    entityType: "contact",
    entityId: contactId,
    scope: platformAdapter.getScope(),
  };
  const tasks = usePlatformTasks({ relation, includeCompleted: true, limit: 10 });
  const notes = usePlatformNotes({ relation, limit: 10 });
  const timeline = usePlatformTimeline({ relation, limit: 10 });
  const attachments = usePlatformAttachments({ relation, limit: 10 });

  return (
    <section className="mt-6 space-y-6" aria-labelledby="customer360-platform-heading">
      <div>
        <h2 id="customer360-platform-heading" className="font-display text-xl font-semibold tracking-tight">Platform workspace signals</h2>
        <p className="mt-1 text-sm text-muted-foreground">Reusable Platform records related to this Contact. CRM and Platform storage remain separate adapters.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <PlatformTaskList tasks={tasks.tasks} loading={tasks.loading} error={tasks.error} forbidden={tasks.forbidden} />
        <PlatformNotesPanel notes={notes.notes} loading={notes.loading} error={notes.error} forbidden={notes.forbidden} />
        <PlatformTimeline events={timeline.events} loading={timeline.loading} error={timeline.error} />
        <PlatformAttachmentsPanel attachments={attachments.attachments} loading={attachments.loading} error={attachments.error} />
      </div>
    </section>
  );
}
