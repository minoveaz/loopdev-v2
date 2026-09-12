import { beforeEach, describe, expect, it } from "vitest";
import {
  localPlatformAdapter,
  localPlatformActivitiesStore,
  localPlatformAttachmentsStore,
  localPlatformNotesStore,
  localPlatformNotificationsStore,
  localPlatformTasksStore,
  localPlatformTaskTemplatesStore,
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
  localPlatformTaskTemplatesStore.reset();
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
    const unread = await platformWorkAdapter.markNotificationUnread(notification.id, { scope });
    expect(unread.status).toBe("unread");
    const archived = await platformWorkAdapter.archiveNotification(notification.id, { scope });
    expect(archived.status).toBe("archived");
    expect((await platformWorkAdapter.listNotifications({ scope, status: ["archived"] })).items).toHaveLength(1);
  });

  it("filters CRM tasks by relation type without exposing platform-only tasks", async () => {
    await platformWorkAdapter.createTask({
      scope,
      relation: contactRef,
      title: "CRM task",
    });
    await platformWorkAdapter.createTask({
      scope,
      relation: { entityType: "project", entityId: "project-test", scope },
      title: "Project task",
    });
    const result = await platformWorkAdapter.listTasks({
      scope,
      relationTypes: ["contact", "lead", "opportunity"],
      includeCompleted: true,
    });
    expect(result.items.some((task) => task.title === "CRM task")).toBe(true);
    expect(result.items.some((task) => task.title === "Project task")).toBe(false);
  });

  it("uses explicit adapter errors for invalid relations", async () => {
    const outsideRef: EntityRef<"contact"> = {
      entityType: "contact",
      entityId: "other",
      scope: { organizationId: "other-organization", workspaceId: null },
    };
    await expect(platformWorkAdapter.createTask({ scope, relation: outsideRef, title: "Blocked" })).rejects.toBeInstanceOf(PlatformWorkAdapterError);
  });

  it("administers organization-scoped task templates with optimistic conflicts", async () => {
    const created = await platformWorkAdapter.createTaskTemplate({
      scope,
      key: "new-follow-up",
      name: "New follow-up",
      description: "A reusable follow-up.",
      defaultPriority: "high",
      defaultDueDays: 4,
      relationTypes: ["contact", "lead"],
    });
    expect(created.status).toBe("active");
    expect((await platformWorkAdapter.listTaskTemplates({ scope })).some((item) => item.key === "new-follow-up")).toBe(true);

    const updated = await platformWorkAdapter.updateTaskTemplate(created.id, {
      scope,
      expectedVersion: created.version,
      name: "Updated follow-up",
    });
    expect(updated.name).toBe("Updated follow-up");
    await expect(platformWorkAdapter.updateTaskTemplate(created.id, {
      scope,
      expectedVersion: created.version,
      name: "Stale update",
    })).rejects.toMatchObject({ code: "conflict" });

    const archived = await platformWorkAdapter.archiveTaskTemplate(created.id, updated.version, { scope });
    expect(archived.status).toBe("archived");
    expect((await platformWorkAdapter.listTaskTemplates({ scope })).some((item) => item.id === created.id)).toBe(false);
    expect((await platformWorkAdapter.listTaskTemplates({ scope, includeArchived: true })).some((item) => item.id === created.id)).toBe(true);
  });
});
