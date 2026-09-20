import { useCallback, useEffect, useMemo, useState } from "react";
import {
  COMMUNICATIONS_LOCAL_CONTEXT,
  type CommunicationChannelAccount,
  type CommunicationSendResult,
  type CollaborationPresenceState,
  type ComposerMode,
  type CommunicationsContext,
  type ConversationDetail,
  type ConversationFilters,
  type ConversationListResult,
  type ConversationStatus,
  type ConversationSummary,
  type CollaborationAgent,
} from "../../../src/loopdev/domains/communications";
import { supabaseCommunicationsAdapter as localCommunicationsAdapter } from "../../../src/loopdev/domains/communications/adapter/supabase";
import { mobileTenantContextAdapter } from "../adapters/auth";

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load communications.";
}

function stableFilters(filters: ConversationFilters): ConversationFilters {
  return {
    channel: filters.channel ?? "all",
    status: filters.status ?? "all",
    assignee: filters.assignee ?? "all",
    unreadOnly: filters.unreadOnly ?? false,
    starredOnly: filters.starredOnly ?? false,
    query: filters.query ?? "",
  };
}

export function useCommunicationsInbox(
  filters: ConversationFilters = {},
  providedContext?: CommunicationsContext,
) {
  const context = providedContext ?? {
    organizationId: mobileTenantContextAdapter.getTenantContext()?.activeOrganizationId ?? COMMUNICATIONS_LOCAL_CONTEXT.organizationId,
    workspaceId: mobileTenantContextAdapter.getTenantContext()?.activeWorkspaceId ?? COMMUNICATIONS_LOCAL_CONTEXT.workspaceId,
    userId: "mobile-user",
  };
  const request = useMemo(() => stableFilters(filters), [
    filters.assignee,
    filters.channel,
    filters.query,
    filters.starredOnly,
    filters.status,
    filters.unreadOnly,
  ]);
  const [channels, setChannels] = useState<CommunicationChannelAccount[]>([]);
  const [result, setResult] = useState<ConversationListResult>({
    items: [],
    total: 0,
    unreadCount: 0,
    channelUnreadCounts: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([
      localCommunicationsAdapter.listChannels(context),
      localCommunicationsAdapter.listConversations(context, request),
    ])
      .then(([nextChannels, nextResult]) => {
        if (!active) return;
        setChannels(nextChannels);
        setResult(nextResult);
      })
      .catch((cause: unknown) => {
        if (active) setError(messageFor(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [context, reloadToken, request]);

  const update = useCallback(async (action: () => Promise<ConversationSummary>) => {
    setActionError(null);
    try {
      const updated = await action();
      setResult((current) => {
        const items = current.items.map((item) => (item.id === updated.id ? updated : item));
        const channelUnreadCounts: ConversationListResult["channelUnreadCounts"] = {};
        items.forEach((item) => {
          channelUnreadCounts[item.channel] = (channelUnreadCounts[item.channel] ?? 0) + item.unreadCount;
        });
        return {
          ...current,
          items,
          unreadCount: items.reduce((sum, item) => sum + item.unreadCount, 0),
          channelUnreadCounts,
        };
      });
      return updated;
    } catch (cause) {
      setActionError(messageFor(cause));
      throw cause;
    }
  }, []);

  const markRead = useCallback(
    (conversationId: string) => update(() => localCommunicationsAdapter.markConversationRead(context, conversationId)),
    [context, update],
  );
  const toggleStar = useCallback(
    (conversationId: string) => update(() => localCommunicationsAdapter.toggleConversationStar(context, conversationId)),
    [context, update],
  );
  const changeStatus = useCallback(
    (conversationId: string, status: ConversationStatus, expectedVersion: number) =>
      update(() => localCommunicationsAdapter.updateConversationStatus(context, conversationId, status, expectedVersion)),
    [context, update],
  );
  const assignConversation = useCallback(
    (conversationId: string, assigneeUserId: string | null, assigneeName: string | null, expectedVersion: number) =>
      update(() =>
        localCommunicationsAdapter.assignConversation(
          context,
          conversationId,
          assigneeUserId,
          assigneeName,
          expectedVersion,
        ),
      ),
    [context, update],
  );

  return {
    channels,
    conversations: result.items,
    total: result.total,
    unreadCount: result.unreadCount,
    channelUnreadCounts: result.channelUnreadCounts,
    loading,
    error,
    actionError,
    clearActionError: () => setActionError(null),
    reload,
    markRead,
    toggleStar,
    changeStatus,
    assignConversation,
  };
}

export function useCommunicationConversation(
  conversationId: string | undefined,
  providedContext?: CommunicationsContext,
) {
  const context = providedContext ?? {
    organizationId: mobileTenantContextAdapter.getTenantContext()?.activeOrganizationId ?? COMMUNICATIONS_LOCAL_CONTEXT.organizationId,
    workspaceId: mobileTenantContextAdapter.getTenantContext()?.activeWorkspaceId ?? COMMUNICATIONS_LOCAL_CONTEXT.workspaceId,
    userId: "mobile-user",
  };
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(conversationId));
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    if (!conversationId) {
      setConversation(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    setError(null);
    void localCommunicationsAdapter
      .getConversation(context, conversationId)
      .then((next) => {
        if (active) setConversation(next);
      })
      .catch((cause: unknown) => {
        if (active) setError(messageFor(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [context, conversationId, reloadToken]);

  const mutate = useCallback(async (action: () => Promise<CommunicationSendResult>) => {
    setActionError(null);
    try {
      const result = await action();
      setConversation((current) => {
        if (!current) return current;
        const messageAlreadyPresent = current.messages.some((message) => message.id === result.message.id);
        return {
          summary: {
            ...result.summary,
            collaboration: result.summary.collaboration ?? current.summary.collaboration,
          },
          messages: messageAlreadyPresent
            ? current.messages.map((message) => (message.id === result.message.id ? result.message : message))
            : [...current.messages, result.message],
          internalNotes:
            result.message.direction === "internal"
              ? [...current.internalNotes, result.message]
              : current.internalNotes,
        };
      });
      return result;
    } catch (cause) {
      setActionError(messageFor(cause));
      throw cause;
    }
  }, []);

  const sendReply = useCallback(
    (body: string, idempotencyKey?: string, content?: Parameters<typeof localCommunicationsAdapter.sendReply>[5]) => {
      if (!conversation) return Promise.reject(new Error("No conversation selected."));
      return localCommunicationsAdapter.getConversation(context, conversation.summary.id).then((current) => {
        if (!current) throw new Error("No conversation selected.");
        return mutate(() =>
          localCommunicationsAdapter.sendReply(
            context,
            current.summary.id,
            body,
            current.summary.version,
            idempotencyKey,
            content,
          ),
        );
      });
    },
    [context, conversation, mutate],
  );

  const addInternalNote = useCallback(
    (body: string, idempotencyKey?: string) => {
      if (!conversation) return Promise.reject(new Error("No conversation selected."));
      return localCommunicationsAdapter.getConversation(context, conversation.summary.id).then((current) => {
        if (!current) throw new Error("No conversation selected.");
        return mutate(() =>
          localCommunicationsAdapter.addInternalNote(
            context,
            current.summary.id,
            body,
            current.summary.version,
            idempotencyKey,
          ),
        );
      });
    },
    [context, conversation, mutate],
  );

  const reload = useCallback(() => setReloadToken((value) => value + 1), []);
  const setPresence = useCallback(
    (state: CollaborationPresenceState, ttlMs?: number) => {
      if (!conversation) return Promise.reject(new Error("No conversation selected."));
      return localCommunicationsAdapter.setPresence(context, conversation.summary.id, state, ttlMs).then(setConversation);
    },
    [context, conversation],
  );
  const setDrafting = useCallback(
    (mode: ComposerMode | null, ttlMs?: number) => {
      if (!conversation) return Promise.reject(new Error("No conversation selected."));
      return localCommunicationsAdapter.setDrafting(context, conversation.summary.id, mode, ttlMs).then(setConversation);
    },
    [context, conversation],
  );
  const acquireComposerLock = useCallback(
    (expectedVersion: number, ttlMs?: number) => {
      if (!conversation) return Promise.reject(new Error("No conversation selected."));
      return localCommunicationsAdapter
        .acquireComposerLock(context, conversation.summary.id, expectedVersion, ttlMs)
        .then(setConversation);
    },
    [context, conversation],
  );
  const releaseComposerLock = useCallback(() => {
    if (!conversation) return Promise.reject(new Error("No conversation selected."));
    return localCommunicationsAdapter.releaseComposerLock(context, conversation.summary.id).then(setConversation);
  }, [context, conversation]);
  const takeoverComposerLock = useCallback(() => {
    if (!conversation) return Promise.reject(new Error("No conversation selected."));
    return localCommunicationsAdapter
      .takeoverComposerLock(context, conversation.summary.id, conversation.summary.version)
      .then(setConversation);
  }, [context, conversation]);
  const claimConversation = useCallback(
    (expectedVersion: number) => {
      if (!conversation) return Promise.reject(new Error("No conversation selected."));
      return localCommunicationsAdapter
        .claimConversation(context, conversation.summary.id, expectedVersion)
        .then(() => localCommunicationsAdapter.getConversation(context, conversation.summary.id))
        .then((next) => {
          if (next) setConversation(next);
          return next;
        });
    },
    [context, conversation],
  );
  const transferConversation = useCallback(
    (userId: string, name: string, expectedVersion: number) => {
      if (!conversation) return Promise.reject(new Error("No conversation selected."));
      return localCommunicationsAdapter
        .transferConversation(context, conversation.summary.id, userId, name, expectedVersion)
        .then(() => localCommunicationsAdapter.getConversation(context, conversation.summary.id))
        .then((next) => {
          if (next) setConversation(next);
          return next;
        });
    },
    [context, conversation],
  );
  const unassignConversation = useCallback(
    (expectedVersion: number) => {
      if (!conversation) return Promise.reject(new Error("No conversation selected."));
      return localCommunicationsAdapter
        .unassignConversation(context, conversation.summary.id, expectedVersion)
        .then(() => localCommunicationsAdapter.getConversation(context, conversation.summary.id))
        .then((next) => {
          if (next) setConversation(next);
          return next;
        });
    },
    [context, conversation],
  );
  const requestHandoff = useCallback(
    (userId: string, name: string, expectedVersion: number) => {
      if (!conversation) return Promise.reject(new Error("No conversation selected."));
      return localCommunicationsAdapter
        .requestHandoff(context, conversation.summary.id, userId, name, expectedVersion)
        .then(() => localCommunicationsAdapter.getConversation(context, conversation.summary.id))
        .then((next) => {
          if (next) setConversation(next);
          return next;
        });
    },
    [context, conversation],
  );
  const updateParticipant = useCallback(
    (
      action: "addCollaborator" | "removeCollaborator" | "addWatcher" | "removeWatcher",
      userId: string,
      agent?: CollaborationAgent,
    ) => {
      if (!conversation) return Promise.reject(new Error("No conversation selected."));
      const id = conversation.summary.id;
      const version = conversation.summary.version;
      const adapter = localCommunicationsAdapter;
      const actionPromise =
        action === "addCollaborator" && agent
          ? adapter.addConversationCollaborator(context, id, agent, version)
          : action === "removeCollaborator"
          ? adapter.removeConversationCollaborator(context, id, userId, version)
          : action === "addWatcher" && agent
          ? adapter.addConversationWatcher(context, id, agent, version)
          : adapter.removeConversationWatcher(context, id, userId, version);
      return actionPromise
        .then(() => adapter.getConversation(context, id))
        .then((next) => {
          if (next) setConversation(next);
          return next;
        });
    },
    [context, conversation],
  );

  return {
    conversation,
    loading,
    error,
    actionError,
    clearActionError: () => setActionError(null),
    reload,
    sendReply,
    addInternalNote,
    setPresence,
    setDrafting,
    acquireComposerLock,
    releaseComposerLock,
    takeoverComposerLock,
    claimConversation,
    transferConversation,
    unassignConversation,
    requestHandoff,
    updateParticipant,
  };
}
