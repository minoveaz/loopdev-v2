import { beforeEach, describe, expect, it } from "vitest";
import {
  localPlatformAdapter,
  localPlatformActivitiesStore,
  localPlatformAttachmentsStore,
  localPlatformNotesStore,
  localPlatformNotificationsStore,
  localPlatformTasksStore,
  localPlatformTimelineStore,
  platformWorkAdapter,
  PlatformWorkAdapterError,
  type EntityRef,
} from "@/loopdev/domains/platform";

const scope = localPlatformAdapter.getScope();
const contactRef: EntityRef<"contact"> = {
  entityType: "contact",
  entityId: "crm_cust_test",
  scope,
};

beforeEach(() => {
  localPlatformTasksStore.reset();
  localPlatformNotesStore.reset();
  localPlatformActivitiesStore.reset();
  localPlatformTimelineStore.reset();
  localPlatformAttachmentsStore.reset();
  localPlatformNotificationsStore.reset();
  localPlatformAdapter.setOrganizationContext({
    ...localPlatformAdapter.getOrganizationContext(),
    organizationId: scope.organizationId,
    workspaceId: scope.workspaceId ?? null,
  });
});
describe("local Platform work adapter", () => {
  it("creates, filters and transitions scoped tasks with optimistic versions", async () => {
    const created = await platformWorkAdapter.createTask({
      scope,
      relation: contactRef,
      title: "Test task",
      priority: "urgent",
      idempotencyKey: "task-test-1",
    });
    expect(created.status).toBe("open");
    expect((await platformWorkAdapter.listTasks({ scope, query: "test", includeCompleted: true })).items).toHaveLength(1);

    const completed = await platformWorkAdapter.transitionTask(created.id, "completed", created.version, { scope });
    expect(completed.status).toBe("completed");
    await expect(platformWorkAdapter.transitionTask(created.id, "open", created.version, { scope })).rejects.toMatchObject({ code: "conflict" });
  });

  it("keeps notes and activities related without exposing another organization", async () => {
    const note = await platformWorkAdapter.createNote({
      scope,
      relation: contactRef,
      body: "Scoped note",
      visibility: "private",
    });
    expect((await platformWorkAdapter.listNotes({ scope, relation: contactRef })).items[0].body).toBe("Scoped note");

    const activity = await platformWorkAdapter.recordActivity({
      scope,
      relation: contactRef,
      type: "note",
      sourceType: "note",
      sourceId: note.id,
      summary: "Note activity",
    });
    expect(activity.relation?.entityId).toBe(contactRef.entityId);
    await expect(platformWorkAdapter.listNotes({ organizationId: "other-organization", workspaceId: null })).rejects.toMatchObject({ code: "invalid-scope" });
  });

  it("deduplicates append-only timeline events by source key", async () => {
    const first = await platformWorkAdapter.appendTimeline({
      scope,
      relation: contactRef,
      type: "stage_change",
      sourceType: "event",
      sourceId: "dedupe-test",
      summary: "Stage changed",
    });
    const second = await platformWorkAdapter.appendTimeline({
      scope,
      relation: contactRef,
      type: "stage_change",
      sourceType: "event",
      sourceId: "dedupe-test",
      summary: "Should not duplicate",
    });
    expect(second.id).toBe(first.id);
    expect((await platformWorkAdapter.listTimeline({ scope, relation: contactRef })).items.filter((event) => event.dedupeKey === "event:dedupe-test")).toHaveLength(1);
  });

  it("creates attachment metadata and notification state without real storage", async () => {
    const attachment = await platformWorkAdapter.createAttachment({
      scope,
      relation: contactRef,
      fileName: "test.txt",
      mimeType: "text/plain",
      byteSize: 42,
    });
    expect(attachment.attachmentStatus).toBe("pending");
    const notification = await platformWorkAdapter.createNotification({
      scope,
      recipientUserId: "local-development-user",
      type: "attachment",
      title: "New file",
      body: "A file was attached.",
      relation: contactRef,
    });
    const read = await platformWorkAdapter.markNotificationRead(notification.id, { scope });
    expect(read.status).toBe("read");
  });

  it("uses explicit adapter errors for invalid relations", async () => {
    const outsideRef: EntityRef<"contact"> = {
      entityType: "contact",
      entityId: "other",
      scope: { organizationId: "other-organization", workspaceId: null },
    };
    await expect(platformWorkAdapter.createTask({ scope, relation: outsideRef, title: "Blocked" })).rejects.toBeInstanceOf(PlatformWorkAdapterError);
  });
});
