import { useEffect, useMemo, useRef, useState } from "react";
import {
  platformWorkAdapter,
  type PlatformActivityListParams,
  type PlatformAttachmentListParams,
  type PlatformNotificationListParams,
  type PlatformNoteListParams,
  type PlatformTaskListParams,
  type PlatformTaskTemplateListParams,
  type PlatformScopeParams,
  type PlatformTimelineListParams,
  type CreateAttachmentInput,
  type CreateNoteInput,
  type CreateTaskInput,
  type CreateTaskTemplateInput,
  type UpdateNoteInput,
  type UpdateTaskInput,
  type UpdateTaskTemplateInput,
} from "../adapter";
import type {
  AttachmentRecord,
  NoteRecord,
  NotificationRecord,
  TaskRecord,
  TaskTemplateRecord,
  TaskStatus,
  TimelineEvent,
  ActivityRecord,
} from "../types";

function messageFor(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Please try again.";
}

function isForbidden(cause: unknown): boolean {
  return typeof cause === "object" && cause !== null && "code" in cause
    && (cause as { code?: string }).code === "forbidden";
}

function useStableParams<T>(params: T): T {
  const key = JSON.stringify(params);
  const current = useRef<{ key: string; value: T }>({ key, value: params });
  if (current.current.key !== key) current.current = { key, value: params };
  return current.current.value;
}

export function usePlatformTasks(params: PlatformTaskListParams = {}) {
  const request = useStableParams(params);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const key = useMemo(() => JSON.stringify(request), [request]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setForbidden(false);
    void platformWorkAdapter.listTasks(request)
      .then((page) => { if (active) setTasks(page.items); })
      .catch((cause: unknown) => {
        if (!active) return;
        setForbidden(isForbidden(cause));
        setError(isForbidden(cause) ? null : messageFor(cause));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key, reloadToken, request]);

  const run = async <T,>(action: () => Promise<T>) => {
    setError(null);
    try {
      const result = await action();
      setReloadToken((token) => token + 1);
      return result;
    } catch (cause) {
      setError(messageFor(cause));
      throw cause;
    }
  };

  return {
    tasks,
    loading,
    error,
    forbidden,
    createTask: (input: CreateTaskInput) => run(() => platformWorkAdapter.createTask(input)),
    updateTask: (taskId: string, input: UpdateTaskInput) => run(() => platformWorkAdapter.updateTask(taskId, input)),
    transitionTask: (taskId: string, status: TaskStatus, expectedVersion: number) =>
      run(() => platformWorkAdapter.transitionTask(taskId, status, expectedVersion)),
    assignTask: (taskId: string, assignedUserId: string | null, expectedVersion: number) =>
      run(() => platformWorkAdapter.assignTask(taskId, assignedUserId, expectedVersion)),
    reload: () => setReloadToken((token) => token + 1),
  };
}

export function usePlatformTaskTemplates(params: PlatformTaskTemplateListParams = {}) {
  const request = useStableParams(params);
  const [templates, setTemplates] = useState<TaskTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const key = useMemo(() => JSON.stringify(request), [request]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void platformWorkAdapter.listTaskTemplates(request)
      .then((items) => { if (active) setTemplates(items); })
      .catch((cause: unknown) => { if (active) setError(messageFor(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key, reloadToken, request]);

  const run = async <T,>(action: () => Promise<T>) => {
    setError(null);
    try {
      const result = await action();
      setReloadToken((token) => token + 1);
      return result;
    } catch (cause) {
      setError(messageFor(cause));
      throw cause;
    }
  };

  return {
    templates,
    loading,
    error,
    createTemplate: (input: CreateTaskTemplateInput) => run(() => platformWorkAdapter.createTaskTemplate(input)),
    updateTemplate: (templateId: string, input: UpdateTaskTemplateInput) =>
      run(() => platformWorkAdapter.updateTaskTemplate(templateId, input)),
    archiveTemplate: (templateId: string, expectedVersion: number, scope?: PlatformScopeParams) =>
      run(() => platformWorkAdapter.archiveTaskTemplate(templateId, expectedVersion, scope)),
    createTaskTemplate: (input: CreateTaskTemplateInput) => run(() => platformWorkAdapter.createTaskTemplate(input)),
    updateTaskTemplate: (templateId: string, input: UpdateTaskTemplateInput) =>
      run(() => platformWorkAdapter.updateTaskTemplate(templateId, input)),
    archiveTaskTemplate: (templateId: string, expectedVersion: number, scope?: PlatformScopeParams) =>
      run(() => platformWorkAdapter.archiveTaskTemplate(templateId, expectedVersion, scope)),
    reload: () => setReloadToken((token) => token + 1),
  };
}

export function usePlatformNotes(params: PlatformNoteListParams = {}) {
  const request = useStableParams(params);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const key = useMemo(() => JSON.stringify(request), [request]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setForbidden(false);
    void platformWorkAdapter.listNotes(request)
      .then((page) => { if (active) setNotes(page.items); })
      .catch((cause: unknown) => {
        if (!active) return;
        setForbidden(isForbidden(cause));
        setError(isForbidden(cause) ? null : messageFor(cause));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key, reloadToken, request]);

  const run = async <T,>(action: () => Promise<T>) => {
    setError(null);
    try {
      const result = await action();
      setReloadToken((token) => token + 1);
      return result;
    } catch (cause) {
      setError(messageFor(cause));
      throw cause;
    }
  };

  return {
    notes,
    loading,
    error,
    forbidden,
    createNote: (input: CreateNoteInput) => run(() => platformWorkAdapter.createNote(input)),
    updateNote: (noteId: string, input: UpdateNoteInput) => run(() => platformWorkAdapter.updateNote(noteId, input)),
    reload: () => setReloadToken((token) => token + 1),
  };
}

export function usePlatformTimeline(params: PlatformTimelineListParams = {}) {
  const request = useStableParams(params);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const key = useMemo(() => JSON.stringify(request), [request]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void platformWorkAdapter.listTimeline(request)
      .then((page) => { if (active) setEvents(page.items); })
      .catch((cause: unknown) => { if (active) setError(messageFor(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key, reloadToken, request]);

  return { events, loading, error, reload: () => setReloadToken((token) => token + 1) };
}

export function usePlatformActivities(params: PlatformActivityListParams = {}) {
  const request = useStableParams(params);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const key = useMemo(() => JSON.stringify(request), [request]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void platformWorkAdapter.listActivities(request)
      .then((page) => { if (active) setActivities(page.items); })
      .catch((cause: unknown) => { if (active) setError(messageFor(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key, reloadToken, request]);

  return { activities, loading, error, reload: () => setReloadToken((token) => token + 1) };
}

export function usePlatformAttachments(params: PlatformAttachmentListParams = {}) {
  const request = useStableParams(params);
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const key = useMemo(() => JSON.stringify(request), [request]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void platformWorkAdapter.listAttachments(request)
      .then((page) => { if (active) setAttachments(page.items); })
      .catch((cause: unknown) => { if (active) setError(messageFor(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key, reloadToken, request]);

  return {
    attachments,
    loading,
    error,
    createAttachment: (input: CreateAttachmentInput) => platformWorkAdapter.createAttachment(input).then((record) => {
      setReloadToken((token) => token + 1);
      return record;
    }),
    reload: () => setReloadToken((token) => token + 1),
  };
}

export function usePlatformNotifications(params: PlatformNotificationListParams = {}) {
  const request = useStableParams(params);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const key = useMemo(() => JSON.stringify(request), [request]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void platformWorkAdapter.listNotifications(request)
      .then((page) => { if (active) setNotifications(page.items); })
      .catch((cause: unknown) => { if (active) setError(messageFor(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key, reloadToken, request]);

  return {
    notifications,
    loading,
    error,
    markRead: (notificationId: string) => platformWorkAdapter.markNotificationRead(notificationId).then((record) => {
      setNotifications((current) => current.map((item) => item.id === record.id ? record : item));
      return record;
    }),
    markUnread: (notificationId: string) => platformWorkAdapter.markNotificationUnread(notificationId).then((record) => {
      setNotifications((current) => current.map((item) => item.id === record.id ? record : item));
      return record;
    }),
    archive: (notificationId: string) => platformWorkAdapter.archiveNotification(notificationId).then((record) => {
      setNotifications((current) => current.filter((item) => item.id !== record.id));
      return record;
    }),
    reload: () => setReloadToken((token) => token + 1),
  };
}
