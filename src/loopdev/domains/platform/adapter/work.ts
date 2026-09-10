import { isScopeVisible } from "../types";
import type {
  ActivityRecord,
  ActivityType,
  AttachmentRecord,
  EntityRef,
  EntityScope,
  NoteRecord,
  NotificationRecord,
  NotificationStatus,
  PlatformPermissions,
  PlatformVisibility,
  TaskPriority,
  TaskRecord,
  TaskStatus,
  TimelineEvent,
} from "../types";
import {
  localPlatformActivitiesStore,
  localPlatformAttachmentsStore,
  localPlatformNotesStore,
  localPlatformNotificationsStore,
  localPlatformTasksStore,
  localPlatformTimelineStore,
} from "../data/localWork";

export interface PlatformScopeParams {
  scope?: EntityScope;
  organizationId?: string;
  workspaceId?: string | null;
  brandId?: string | null;
}

export interface PlatformPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface PlatformTaskListParams extends PlatformScopeParams {
  query?: string;
  cursor?: string | null;
  limit?: number;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedUserId?: string | null;
  relation?: EntityRef;
  includeCompleted?: boolean;
}

export interface PlatformNoteListParams extends PlatformScopeParams {
  query?: string;
  cursor?: string | null;
  limit?: number;
  relation?: EntityRef;
  visibility?: PlatformVisibility[];
}

export interface PlatformActivityListParams extends PlatformScopeParams {
  cursor?: string | null;
  limit?: number;
  relation?: EntityRef;
  types?: ActivityType[];
}

export interface PlatformTimelineListParams extends PlatformScopeParams {
  cursor?: string | null;
  limit?: number;
  relation?: EntityRef;
}

export interface PlatformAttachmentListParams extends PlatformScopeParams {
  cursor?: string | null;
  limit?: number;
  relation?: EntityRef;
}

export interface PlatformNotificationListParams extends PlatformScopeParams {
  cursor?: string | null;
  limit?: number;
  recipientUserId?: string;
  status?: NotificationStatus[];
}

export interface CreateTaskInput extends PlatformScopeParams {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  ownerId?: string | null;
  assignedUserId?: string | null;
  dueAt?: string | null;
  relation: EntityRef;
  visibility?: PlatformVisibility;
  idempotencyKey?: string;
}

export interface UpdateTaskInput extends PlatformScopeParams {
  expectedVersion: number;
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  dueAt?: string | null;
  visibility?: PlatformVisibility;
}

export interface CreateNoteInput extends PlatformScopeParams {
  relation: EntityRef;
  body: string;
  visibility?: PlatformVisibility;
  idempotencyKey?: string;
}

export interface UpdateNoteInput extends PlatformScopeParams {
  body: string;
  expectedVersion: number;
}

export interface CreateActivityInput extends PlatformScopeParams {
  relation?: EntityRef | null;
  type: ActivityType;
  actorId?: string | null;
  ownerId?: string | null;
  actorType?: "user" | "system";
  origin?: string;
  sourceType: string;
  sourceId: string;
  summary: string;
  metadata?: Record<string, string>;
  occurredAt?: string;
}

export interface AppendTimelineInput extends PlatformScopeParams {
  relation?: EntityRef | null;
  type: ActivityType;
  actorId?: string | null;
  ownerId?: string | null;
  actorType?: "user" | "system";
  origin?: string;
  sourceType: string;
  sourceId: string;
  dedupeKey?: string;
  summary: string;
  metadata?: Record<string, string>;
  occurredAt?: string;
}

export interface CreateAttachmentInput extends PlatformScopeParams {
  relation: EntityRef;
  fileName: string;
  mimeType: string;
  byteSize: number;
  storageKey?: string | null;
  visibility?: PlatformVisibility;
}

export interface CreateNotificationInput extends PlatformScopeParams {
  recipientUserId: string;
  actorId?: string | null;
  type: ActivityType;
  title: string;
  body: string;
  relation?: EntityRef | null;
}

export class PlatformWorkAdapterError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "forbidden"
      | "invalid-scope"
      | "not-found"
      | "conflict"
      | "validation-error",
  ) {
    super(message);
    this.name = "PlatformWorkAdapterError";
  }
}

export interface PlatformWorkAdapter {
  listTasks(params?: PlatformTaskListParams): Promise<PlatformPage<TaskRecord>>;
  getTask(taskId: string, params?: PlatformScopeParams): Promise<TaskRecord | null>;
  createTask(input: CreateTaskInput): Promise<TaskRecord>;
  updateTask(taskId: string, input: UpdateTaskInput): Promise<TaskRecord>;
  transitionTask(taskId: string, status: TaskStatus, expectedVersion: number, params?: PlatformScopeParams): Promise<TaskRecord>;
  assignTask(taskId: string, assignedUserId: string | null, expectedVersion: number, params?: PlatformScopeParams): Promise<TaskRecord>;
  listNotes(params?: PlatformNoteListParams): Promise<PlatformPage<NoteRecord>>;
  createNote(input: CreateNoteInput): Promise<NoteRecord>;
  updateNote(noteId: string, input: UpdateNoteInput): Promise<NoteRecord>;
  listActivities(params?: PlatformActivityListParams): Promise<PlatformPage<ActivityRecord>>;
  recordActivity(input: CreateActivityInput): Promise<ActivityRecord>;
  listTimeline(params?: PlatformTimelineListParams): Promise<PlatformPage<TimelineEvent>>;
  appendTimeline(input: AppendTimelineInput): Promise<TimelineEvent>;
  listAttachments(params?: PlatformAttachmentListParams): Promise<PlatformPage<AttachmentRecord>>;
  createAttachment(input: CreateAttachmentInput): Promise<AttachmentRecord>;
  listNotifications(params?: PlatformNotificationListParams): Promise<PlatformPage<NotificationRecord>>;
  createNotification(input: CreateNotificationInput): Promise<NotificationRecord>;
  markNotificationRead(notificationId: string, params?: PlatformScopeParams): Promise<NotificationRecord>;
}

export interface LocalPlatformWorkDependencies {
  getScope: () => EntityScope;
  getUserId: () => string | null;
  hasPermission: (permission: "work.read" | "work.write" | "work.assign", scope: EntityScope) => boolean;
}

type StoredRecord = { id: string; scope: EntityScope; createdAt: string; updatedAt: string };

function normalizeScope(input: PlatformScopeParams | undefined, fallback: EntityScope): EntityScope {
  if (input?.scope) return { ...input.scope };
  return {
    organizationId: input?.organizationId ?? fallback.organizationId,
    workspaceId: input?.workspaceId === undefined ? fallback.workspaceId : input.workspaceId,
    brandId: input?.brandId === undefined ? fallback.brandId : input.brandId,
  };
}

function relationMatches(left: EntityRef | null | undefined, right: EntityRef | undefined): boolean {
  if (!right) return true;
  return Boolean(
    left
      && left.entityType === right.entityType
      && left.entityId === right.entityId
      && left.scope.organizationId === right.scope.organizationId,
  );
}

function sortNewest<T extends { occurredAt?: string; updatedAt: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => (right.occurredAt ?? right.updatedAt).localeCompare(left.occurredAt ?? left.updatedAt));
}

function page<T>(items: T[], cursor: string | null | undefined, limit = 25): PlatformPage<T> {
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;
  const start = Number.isFinite(offset) && offset >= 0 ? offset : 0;
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const visible = items.slice(start, start + safeLimit);
  const nextOffset = start + visible.length;
  return {
    items: visible,
    nextCursor: nextOffset < items.length ? String(nextOffset) : null,
    hasMore: nextOffset < items.length,
    total: items.length,
  };
}

function sameScope(record: StoredRecord, scope: EntityScope): boolean {
  return isScopeVisible(record.scope, scope);
}

function stableKey(input: unknown): string {
  return JSON.stringify(input);
}

export function createLocalPlatformWorkAdapter(deps: LocalPlatformWorkDependencies): PlatformWorkAdapter {
  const idempotency = new Map<string, { fingerprint: string; id: string }>();

  const resolve = (input?: PlatformScopeParams): EntityScope => normalizeScope(input, deps.getScope());
  const assertScope = (scope: EntityScope, permission: "work.read" | "work.write" | "work.assign") => {
    if (scope.organizationId !== deps.getScope().organizationId) {
      throw new PlatformWorkAdapterError("The active organization does not match the requested scope.", "invalid-scope");
    }
    if (!deps.hasPermission(permission, scope)) {
      throw new PlatformWorkAdapterError("You do not have permission for this Platform capability.", "forbidden");
    }
  };
  const assertRelation = (relation: EntityRef, scope: EntityScope) => {
    if (!relation?.entityId || relation.scope.organizationId !== scope.organizationId || !isScopeVisible(relation.scope, scope)) {
      throw new PlatformWorkAdapterError("The related entity is outside the active scope.", "invalid-scope");
    }
  };
  const visible = <T extends StoredRecord>(items: T[], scope: EntityScope): T[] =>
    items.filter((item) => sameScope(item, scope));
  const find = <T extends StoredRecord>(items: T[], id: string, scope: EntityScope): T => {
    const item = items.find((candidate) => candidate.id === id);
    if (!item || !sameScope(item, scope)) {
      throw new PlatformWorkAdapterError("The requested Platform record was not found.", "not-found");
    }
    return item;
  };
  const currentPermissions = (): PlatformPermissions => ({
    canRead: true,
    canEdit: true,
    canDelete: false,
    canAssign: deps.hasPermission("work.assign", deps.getScope()),
    canModerate: deps.hasPermission("work.assign", deps.getScope()),
  });
  const currentActor = () => deps.getUserId();

  const appendSystemEvent = async (
    scope: EntityScope,
    relation: EntityRef | null,
    type: ActivityType,
    origin: string,
    sourceType: string,
    sourceId: string,
    summary: string,
    occurredAt = new Date().toISOString(),
    metadata: Record<string, string> = {},
  ) => {
    const activity = await adapter.recordActivity({
      scope,
      relation,
      type,
      actorId: currentActor(),
      actorType: "user",
      origin,
      sourceType,
      sourceId,
      summary,
      metadata,
      occurredAt,
    });
    await adapter.appendTimeline({
      scope,
      relation,
      type,
      actorId: activity.actorId,
      actorType: activity.actorType,
      origin,
      sourceType,
      sourceId,
      summary,
      metadata,
      occurredAt,
    });
  };

  const adapter: PlatformWorkAdapter = {
    async listTasks(params = {}) {
      const scope = resolve(params);
      assertScope(scope, "work.read");
      let items = visible(localPlatformTasksStore.list(), scope)
        .filter((task) => params.includeCompleted || !["completed", "cancelled"].includes(task.status))
        .filter((task) => !params.status?.length || params.status.includes(task.status))
        .filter((task) => !params.priority?.length || params.priority.includes(task.priority))
        .filter((task) => !params.assignedUserId || task.assignedUserId === params.assignedUserId)
        .filter((task) => relationMatches(task.relation, params.relation));
      const query = params.query?.trim().toLocaleLowerCase();
      if (query) {
        items = items.filter((task) => `${task.title} ${task.description ?? ""}`.toLocaleLowerCase().includes(query));
      }
      return page(items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)), params.cursor, params.limit);
    },

    async getTask(taskId, params = {}) {
      const scope = resolve(params);
      assertScope(scope, "work.read");
      return find(localPlatformTasksStore.list(), taskId, scope);
    },

    async createTask(input) {
      const scope = resolve(input);
      assertScope(scope, "work.write");
      if (!input.title?.trim() || !input.relation) {
        throw new PlatformWorkAdapterError("A task title and relation are required.", "validation-error");
      }
      assertRelation(input.relation, scope);
      const idempotencyKey = input.idempotencyKey ? `${scope.organizationId}:${input.idempotencyKey}` : null;
      const fingerprint = stableKey({ ...input, scope, idempotencyKey: undefined });
      if (idempotencyKey) {
        const previous = idempotency.get(idempotencyKey);
        if (previous) {
          if (previous.fingerprint !== fingerprint) {
            throw new PlatformWorkAdapterError("The idempotency key was already used with different data.", "conflict");
          }
          return find(localPlatformTasksStore.list(), previous.id, scope);
        }
      }
      const created = localPlatformTasksStore.create({
        scope,
        status: "open",
        createdById: currentActor(),
        updatedById: currentActor(),
        version: 1,
        visibility: input.visibility ?? "team",
        permissions: currentPermissions(),
        title: input.title.trim(),
        description: input.description?.trim() || null,
        priority: input.priority ?? "normal",
        ownerId: input.ownerId ?? currentActor(),
        assignedUserId: input.assignedUserId ?? currentActor(),
        dueAt: input.dueAt ?? null,
        relation: input.relation,
        completedAt: null,
      });
      if (idempotencyKey) idempotency.set(idempotencyKey, { fingerprint, id: created.id });
      await appendSystemEvent(scope, created.relation, "task", "task", "task", created.id, `Task created: ${created.title}`);
      return created;
    },

    async updateTask(taskId, input) {
      const scope = resolve(input);
      assertScope(scope, "work.write");
      const current = find(localPlatformTasksStore.list(), taskId, scope);
      if (current.version !== input.expectedVersion) {
        throw new PlatformWorkAdapterError("The task changed before it could be updated.", "conflict");
      }
      const next = localPlatformTasksStore.update(taskId, {
        title: input.title?.trim() ?? current.title,
        description: input.description === undefined ? current.description : input.description?.trim() || null,
        priority: input.priority ?? current.priority,
        dueAt: input.dueAt === undefined ? current.dueAt : input.dueAt,
        visibility: input.visibility ?? current.visibility,
        version: current.version + 1,
        updatedById: currentActor(),
      });
      if (!next) throw new PlatformWorkAdapterError("The requested Platform record was not found.", "not-found");
      await appendSystemEvent(scope, next.relation, "task", "task", "task_revision", `${next.id}:${next.version}`, `Task updated: ${next.title}`);
      return next;
    },

    async transitionTask(taskId, status, expectedVersion, params = {}) {
      const scope = resolve(params);
      assertScope(scope, "work.write");
      const current = find(localPlatformTasksStore.list(), taskId, scope);
      if (current.version !== expectedVersion) {
        throw new PlatformWorkAdapterError("The task changed before its status could be updated.", "conflict");
      }
      const allowed = current.status === "open" && ["in_progress", "completed", "cancelled"].includes(status)
        || current.status === "in_progress" && ["completed", "cancelled"].includes(status)
        || ["completed", "cancelled"].includes(current.status) && status === "open";
      if (!allowed) {
        throw new PlatformWorkAdapterError("This task status transition is not allowed.", "validation-error");
      }
      const next = localPlatformTasksStore.update(taskId, {
        status,
        completedAt: status === "completed" ? new Date().toISOString() : null,
        version: current.version + 1,
        updatedById: currentActor(),
      });
      if (!next) throw new PlatformWorkAdapterError("The requested Platform record was not found.", "not-found");
      await appendSystemEvent(scope, next.relation, "task", "task", "task_status", `${next.id}:${next.version}`, `Task ${status.replace("_", " ")}: ${next.title}`);
      return next;
    },

    async assignTask(taskId, assignedUserId, expectedVersion, params = {}) {
      const scope = resolve(params);
      assertScope(scope, "work.assign");
      const current = find(localPlatformTasksStore.list(), taskId, scope);
      if (current.version !== expectedVersion) {
        throw new PlatformWorkAdapterError("The task changed before assignment could be updated.", "conflict");
      }
      const next = localPlatformTasksStore.update(taskId, {
        assignedUserId,
        version: current.version + 1,
        updatedById: currentActor(),
      });
      if (!next) throw new PlatformWorkAdapterError("The requested Platform record was not found.", "not-found");
      await appendSystemEvent(scope, next.relation, "assignment", "task", "task_assignment", `${next.id}:${next.version}`, `Task assignment updated: ${next.title}`);
      return next;
    },

    async listNotes(params = {}) {
      const scope = resolve(params);
      assertScope(scope, "work.read");
      let items = visible(localPlatformNotesStore.list(), scope)
        .filter((note) => note.status !== "archived")
        .filter((note) => relationMatches(note.relation, params.relation))
        .filter((note) => !params.visibility?.length || params.visibility.includes(note.visibility));
      const query = params.query?.trim().toLocaleLowerCase();
      if (query) items = items.filter((note) => note.body.toLocaleLowerCase().includes(query));
      return page(items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)), params.cursor, params.limit);
    },

    async createNote(input) {
      const scope = resolve(input);
      assertScope(scope, "work.write");
      assertRelation(input.relation, scope);
      if (!input.body?.trim()) throw new PlatformWorkAdapterError("Note content is required.", "validation-error");
      const idempotencyKey = input.idempotencyKey ? `${scope.organizationId}:${input.idempotencyKey}` : null;
      const fingerprint = stableKey({ ...input, scope, idempotencyKey: undefined });
      if (idempotencyKey) {
        const previous = idempotency.get(`note:${idempotencyKey}`);
        if (previous) {
          if (previous.fingerprint !== fingerprint) throw new PlatformWorkAdapterError("The idempotency key was already used with different data.", "conflict");
          return find(localPlatformNotesStore.list(), previous.id, scope);
        }
      }
      const created = localPlatformNotesStore.create({
        scope,
        status: "active",
        createdById: currentActor(),
        updatedById: currentActor(),
        version: 1,
        visibility: input.visibility ?? "team",
        permissions: currentPermissions(),
        relation: input.relation,
        authorId: currentActor() ?? "local-system",
        body: input.body.trim(),
      });
      if (idempotencyKey) idempotency.set(`note:${idempotencyKey}`, { fingerprint, id: created.id });
      await appendSystemEvent(scope, created.relation, "note", "note", "note", created.id, "Note added");
      return created;
    },

    async updateNote(noteId, input) {
      const scope = resolve(input);
      assertScope(scope, "work.write");
      const current = find(localPlatformNotesStore.list(), noteId, scope);
      if (current.version !== input.expectedVersion) throw new PlatformWorkAdapterError("The note changed before it could be updated.", "conflict");
      if (!input.body?.trim()) throw new PlatformWorkAdapterError("Note content is required.", "validation-error");
      const next = localPlatformNotesStore.update(noteId, {
        body: input.body.trim(),
        version: current.version + 1,
        updatedById: currentActor(),
      });
      if (!next) throw new PlatformWorkAdapterError("The requested Platform record was not found.", "not-found");
      await appendSystemEvent(scope, next.relation, "note", "note", "note_revision", `${next.id}:${next.version}`, "Note updated");
      return next;
    },

    async listActivities(params = {}) {
      const scope = resolve(params);
      assertScope(scope, "work.read");
      const items = visible(localPlatformActivitiesStore.list(), scope)
        .filter((activity) => relationMatches(activity.relation, params.relation))
        .filter((activity) => !params.types?.length || params.types.includes(activity.type));
      return page(sortNewest(items), params.cursor, params.limit);
    },

    async recordActivity(input) {
      const scope = resolve(input);
      assertScope(scope, "work.write");
      if (input.relation) assertRelation(input.relation, scope);
      const created = localPlatformActivitiesStore.create({
        scope,
        relation: input.relation ?? null,
        type: input.type,
        actorId: input.actorId === undefined ? currentActor() : input.actorId,
        ownerId: input.ownerId ?? null,
        actorType: input.actorType ?? "user",
        origin: input.origin ?? "system",
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        summary: input.summary,
        metadata: input.metadata ?? {},
        visibility: "organization",
        permissions: {
          canRead: true,
          canEdit: false,
          canDelete: false,
          canAssign: false,
          canModerate: false,
        },
        occurredAt: input.occurredAt ?? new Date().toISOString(),
      });
      await adapter.appendTimeline({
        scope,
        relation: created.relation,
        type: created.type,
        actorId: created.actorId,
        actorType: created.actorType,
        origin: created.origin,
        sourceType: created.sourceType,
        sourceId: created.sourceId,
        summary: created.summary,
        metadata: created.metadata,
        occurredAt: created.occurredAt,
      });
      return created;
    },

    async listTimeline(params = {}) {
      const scope = resolve(params);
      assertScope(scope, "work.read");
      const items = visible(localPlatformTimelineStore.list(), scope)
        .filter((event) => relationMatches(event.relation, params.relation));
      return page(sortNewest(items), params.cursor, params.limit);
    },

    async appendTimeline(input) {
      const scope = resolve(input);
      assertScope(scope, "work.write");
      if (input.relation) assertRelation(input.relation, scope);
      const dedupeKey = input.dedupeKey ?? `${input.sourceType}:${input.sourceId}`;
      const existing = visible(localPlatformTimelineStore.list(), scope).find((event) => event.dedupeKey === dedupeKey);
      if (existing) return existing;
      return localPlatformTimelineStore.create({
        scope,
        relation: input.relation ?? null,
        type: input.type,
        actorId: input.actorId === undefined ? currentActor() : input.actorId,
        ownerId: input.ownerId ?? null,
        actorType: input.actorType ?? "user",
        origin: input.origin ?? "system",
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        dedupeKey,
        summary: input.summary,
        metadata: input.metadata ?? {},
        visibility: "organization",
        permissions: {
          canRead: true,
          canEdit: false,
          canDelete: false,
          canAssign: false,
          canModerate: false,
        },
        occurredAt: input.occurredAt ?? new Date().toISOString(),
      });
    },

    async listAttachments(params = {}) {
      const scope = resolve(params);
      assertScope(scope, "work.read");
      const items = visible(localPlatformAttachmentsStore.list(), scope)
        .filter((attachment) => attachment.status !== "archived" && attachment.attachmentStatus !== "deleted")
        .filter((attachment) => relationMatches(attachment.relation, params.relation));
      return page(items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)), params.cursor, params.limit);
    },

    async createAttachment(input) {
      const scope = resolve(input);
      assertScope(scope, "work.write");
      assertRelation(input.relation, scope);
      if (!input.fileName?.trim() || input.byteSize < 0) {
        throw new PlatformWorkAdapterError("A valid attachment name and size are required.", "validation-error");
      }
      return localPlatformAttachmentsStore.create({
        scope,
        status: "active",
        createdById: currentActor(),
        updatedById: currentActor(),
        version: 1,
        visibility: input.visibility ?? "team",
        permissions: currentPermissions(),
        relation: input.relation,
        fileName: input.fileName.trim(),
        mimeType: input.mimeType || "application/octet-stream",
        byteSize: input.byteSize,
        storageKey: input.storageKey ?? null,
        uploadedById: currentActor() ?? "local-system",
        attachmentStatus: input.storageKey ? "ready" : "pending",
      });
    },

    async listNotifications(params = {}) {
      const scope = resolve(params);
      assertScope(scope, "work.read");
      const items = visible(localPlatformNotificationsStore.list(), scope)
        .filter((notification) => !params.recipientUserId || notification.recipientUserId === params.recipientUserId)
        .filter((notification) => !params.status?.length || params.status.includes(notification.status));
      return page(items.sort((left, right) => right.createdAt.localeCompare(left.createdAt)), params.cursor, params.limit);
    },

    async createNotification(input) {
      const scope = resolve(input);
      assertScope(scope, "work.write");
      if (input.relation) assertRelation(input.relation, scope);
      return localPlatformNotificationsStore.create({
        scope,
        recipientUserId: input.recipientUserId,
        actorId: input.actorId ?? currentActor(),
        type: input.type,
        title: input.title,
        body: input.body,
        relation: input.relation ?? null,
        status: "unread",
        readAt: null,
      });
    },

    async markNotificationRead(notificationId, params = {}) {
      const scope = resolve(params);
      assertScope(scope, "work.write");
      const current = find(localPlatformNotificationsStore.list(), notificationId, scope);
      const next = localPlatformNotificationsStore.update(notificationId, {
        status: "read",
        readAt: current.readAt ?? new Date().toISOString(),
      });
      if (!next) throw new PlatformWorkAdapterError("The requested Platform record was not found.", "not-found");
      return next;
    },
  };

  return adapter;
}
