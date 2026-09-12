import { useCallback, useEffect, useState } from "react";
import { localCrmWorkspaceAdapter } from "../adapter";
import {
  CRM_WORKSPACE_LOCAL_CONTEXT,
  type CRMWorkspace,
  type CRMWorkspaceContext,
} from "../types";
import type { CreateNoteInput, CreateTaskInput } from "@/loopdev/domains/platform/adapter";

function messageFor(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Unable to load CRM workspace.";
}

function isForbidden(cause: unknown): boolean {
  return typeof cause === "object" && cause !== null && "code" in cause
    && (cause as { code?: string }).code === "forbidden";
}

export function useCrmWorkspace(
  contactId: string | undefined,
  open: boolean,
  context: CRMWorkspaceContext = CRM_WORKSPACE_LOCAL_CONTEXT,
) {
  const [workspace, setWorkspace] = useState<CRMWorkspace | null>(null);
  const [loading, setLoading] = useState(open && Boolean(contactId));
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let active = true;
    if (!open || !contactId) {
      setWorkspace(null);
      setLoading(false);
      setError(null);
      return () => { active = false; };
    }
    setLoading(true);
    setError(null);
    setForbidden(false);
    void localCrmWorkspaceAdapter.getWorkspace(context, contactId)
      .then((next) => { if (active) setWorkspace(next); })
      .catch((cause: unknown) => {
        if (!active) return;
        setForbidden(isForbidden(cause));
        setError(isForbidden(cause) ? null : messageFor(cause));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [contactId, context, open, reloadToken]);

  const run = useCallback(async <T,>(action: () => Promise<T>) => {
    setActionError(null);
    try {
      const result = await action();
      reload();
      return result;
    } catch (cause) {
      setActionError(messageFor(cause));
      throw cause;
    }
  }, [reload]);

  const createTask = useCallback(
    async (input: Omit<CreateTaskInput, "scope" | "organizationId" | "workspaceId">) => {
      const task = await run(() => localCrmWorkspaceAdapter.createTask(context, input));
      setWorkspace((current) => current ? { ...current, tasks: [task, ...current.tasks] } : current);
      return task;
    },
    [context, run],
  );
  const createNote = useCallback(
    async (input: Omit<CreateNoteInput, "scope" | "organizationId" | "workspaceId">) => {
      const note = await run(() => localCrmWorkspaceAdapter.createNote(context, input));
      setWorkspace((current) => current ? { ...current, notes: [note, ...current.notes] } : current);
      return note;
    },
    [context, run],
  );
  const updateLead = useCallback(
    async (leadId: string, input: Parameters<typeof localCrmWorkspaceAdapter.updateLead>[2]) => {
      const result = await run(() => localCrmWorkspaceAdapter.updateLead(context, leadId, input));
      if (result.status !== "success") setActionError(result.message);
      return result;
    },
    [context, run],
  );
  const assignTask = useCallback(
    (taskId: string, assignedUserId: string | null, expectedVersion: number) =>
      run(() => localCrmWorkspaceAdapter.assignTask(context, taskId, assignedUserId, expectedVersion)),
    [context, run],
  );

  return {
    workspace,
    loading,
    error,
    forbidden,
    actionError,
    clearActionError: () => setActionError(null),
    reload,
    createTask,
    createNote,
    updateLead,
    assignTask,
  };
}
