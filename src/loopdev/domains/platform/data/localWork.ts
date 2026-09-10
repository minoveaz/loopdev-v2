import { createLocalStore } from "@/lib/localStore";
import type {
  ActivityRecord,
  AttachmentRecord,
  EntityRef,
  NoteRecord,
  NotificationRecord,
  TaskRecord,
  TimelineEvent,
} from "../types";

export const LOCAL_PLATFORM_SCOPE = {
  organizationId: "local-development-organization",
  workspaceId: "local-workspace",
  brandId: null,
} as const;

const actorId = "local-development-user";
const permissions = {
  canRead: true,
  canEdit: true,
  canDelete: false,
  canAssign: true,
  canModerate: true,
} as const;

const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
const ref = <T extends string>(entityType: T, entityId: string): EntityRef<T> => ({
  entityType,
  entityId,
  scope: LOCAL_PLATFORM_SCOPE,
});

const taskSeed: TaskRecord[] = [
  {
    id: "platform-task-1",
    scope: LOCAL_PLATFORM_SCOPE,
    status: "open",
    createdById: actorId,
    updatedById: actorId,
    createdAt: ago(2),
    updatedAt: ago(0),
    version: 1,
    visibility: "team",
    permissions,
    title: "Send proposal follow-up",
    description: "Confirm the commercial review date and next decision maker.",
    priority: "high",
    ownerId: actorId,
    assignedUserId: actorId,
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    relation: ref("contact", "crm_cust_1"),
    completedAt: null,
  },
  {
    id: "platform-task-2",
    scope: LOCAL_PLATFORM_SCOPE,
    status: "in_progress",
    createdById: actorId,
    updatedById: actorId,
    createdAt: ago(4),
    updatedAt: ago(1),
    version: 2,
    visibility: "organization",
    permissions,
    title: "Prepare renewal options",
    description: "Bring a short comparison of the current and annual plans.",
    priority: "normal",
    ownerId: actorId,
    assignedUserId: "owner-jon",
    dueAt: new Date(Date.now() - 86400000).toISOString(),
    relation: ref("opportunity", "crm_opp_1"),
    completedAt: null,
  },
  {
    id: "platform-task-3",
    scope: LOCAL_PLATFORM_SCOPE,
    status: "open",
    createdById: actorId,
    updatedById: actorId,
    createdAt: ago(7),
    updatedAt: ago(3),
    version: 1,
    visibility: "private",
    permissions,
    title: "Review lead qualification",
    description: "Review qualification notes before the next outreach.",
    priority: "normal",
    ownerId: actorId,
    assignedUserId: actorId,
    dueAt: null,
    relation: ref("lead", "local-lead-crm_cust_2"),
    completedAt: null,
  },
];

const noteSeed: NoteRecord[] = [
  {
    id: "platform-note-1",
    scope: LOCAL_PLATFORM_SCOPE,
    status: "active",
    createdById: actorId,
    updatedById: actorId,
    createdAt: ago(3),
    updatedAt: ago(3),
    version: 1,
    visibility: "team",
    permissions,
    relation: ref("contact", "crm_cust_1"),
    authorId: actorId,
    body: "The contact prefers email and asked for a concise proposal.",
  },
  {
    id: "platform-note-2",
    scope: LOCAL_PLATFORM_SCOPE,
    status: "active",
    createdById: actorId,
    updatedById: actorId,
    createdAt: ago(8),
    updatedAt: ago(8),
    version: 1,
    visibility: "private",
    permissions,
    relation: ref("opportunity", "crm_opp_1"),
    authorId: actorId,
    body: "Internal context: confirm procurement timeline before discounting.",
  },
];

const activitySeed: ActivityRecord[] = [
  {
    id: "platform-activity-1",
    scope: LOCAL_PLATFORM_SCOPE,
    relation: ref("contact", "crm_cust_1"),
    type: "task",
    actorId,
    actorType: "user",
    origin: "task",
    sourceType: "task",
    sourceId: "platform-task-1",
    summary: "Task created: Send proposal follow-up",
    metadata: {},
    occurredAt: ago(2),
    createdAt: ago(2),
    updatedAt: ago(2),
  },
  {
    id: "platform-activity-2",
    scope: LOCAL_PLATFORM_SCOPE,
    relation: ref("contact", "crm_cust_1"),
    type: "note",
    actorId,
    actorType: "user",
    origin: "note",
    sourceType: "note",
    sourceId: "platform-note-1",
    summary: "Note added",
    metadata: {},
    occurredAt: ago(3),
    createdAt: ago(3),
    updatedAt: ago(3),
  },
];

const timelineSeed: TimelineEvent[] = activitySeed.map((activity) => ({
  ...activity,
  dedupeKey: `${activity.sourceType}:${activity.sourceId}`,
}));

const attachmentSeed: AttachmentRecord[] = [
  {
    id: "platform-attachment-1",
    scope: LOCAL_PLATFORM_SCOPE,
    status: "active",
    createdById: actorId,
    updatedById: actorId,
    createdAt: ago(5),
    updatedAt: ago(5),
    version: 1,
    visibility: "team",
    permissions,
    relation: ref("contact", "crm_cust_1"),
    fileName: "proposal-brief.pdf",
    mimeType: "application/pdf",
    byteSize: 184320,
    storageKey: null,
    uploadedById: actorId,
    attachmentStatus: "ready",
  },
];

const notificationSeed: NotificationRecord[] = [
  {
    id: "platform-notification-1",
    scope: LOCAL_PLATFORM_SCOPE,
    recipientUserId: actorId,
    actorId: "owner-jon",
    type: "assignment",
    title: "Task assigned to you",
    body: "Send proposal follow-up is due tomorrow.",
    relation: ref("contact", "crm_cust_1"),
    status: "unread",
    createdAt: ago(0),
    updatedAt: ago(0),
    readAt: null,
  },
];

export const localPlatformTasksStore = createLocalStore<TaskRecord>({
  key: "loopdev:platform:tasks",
  seed: taskSeed,
  idPrefix: "platform-task",
});

export const localPlatformNotesStore = createLocalStore<NoteRecord>({
  key: "loopdev:platform:notes",
  seed: noteSeed,
  idPrefix: "platform-note",
});

export const localPlatformActivitiesStore = createLocalStore<ActivityRecord>({
  key: "loopdev:platform:activities",
  seed: activitySeed,
  idPrefix: "platform-activity",
});

export const localPlatformTimelineStore = createLocalStore<TimelineEvent>({
  key: "loopdev:platform:timeline",
  seed: timelineSeed,
  idPrefix: "platform-timeline",
});

export const localPlatformAttachmentsStore = createLocalStore<AttachmentRecord>({
  key: "loopdev:platform:attachments",
  seed: attachmentSeed,
  idPrefix: "platform-attachment",
});

export const localPlatformNotificationsStore = createLocalStore<NotificationRecord>({
  key: "loopdev:platform:notifications",
  seed: notificationSeed,
  idPrefix: "platform-notification",
});
