import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  AlertCircle,
  Archive,
  Check,
  CheckCheck,
  CircleUserRound,
  Clock3,
  Inbox,
  Instagram,
  Mail,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  PanelRightOpen,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Star,
  TimerReset,
  UserRound,
  UserPlus,
  Users,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { EmptyState, LoadingState, SearchInput, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  CHANNEL_LABELS,
  COMMUNICATIONS_LOCAL_CONTEXT,
  type ComposerMode,
  type ChannelConnectionState,
  type CommunicationChannelAccount,
  type CommunicationChannel,
  type ConversationAssigneeFilter,
  type ConversationSummary,
  type ConversationStatus,
} from "@/loopdev/domains/communications";
import { useCommunicationConversation, useCommunicationsInbox } from "@/loopdev/domains/communications/hooks/use-communications";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatRelative } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const channelIcons: Record<CommunicationChannel, ComponentType<ChannelIconProps>> = {
  whatsapp: WhatsAppIcon,
  email: Mail,
  instagram: Instagram,
  facebook_messenger: MessageSquare,
  sms: MessageSquare,
  phone: Phone,
  livechat: MessageCircle,
};

const connectionLabels: Record<ChannelConnectionState, string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  pending: "Pending connection",
  error: "Connection error",
  coming_soon: "Coming soon",
  disabled: "Disabled",
};

const statusTone: Record<ConversationStatus, "success" | "warning" | "info" | "neutral"> = {
  open: "success",
  pending: "warning",
  snoozed: "info",
  closed: "neutral",
};

const statusLabels: Record<ConversationStatus, string> = {
  open: "Open",
  pending: "Pending",
  snoozed: "Snoozed",
  closed: "Closed",
};

const channelSelectedClasses: Record<CommunicationChannel, string> = {
  whatsapp: "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/25 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/30",
  email: "bg-slate-500/10 text-slate-700 ring-1 ring-inset ring-slate-500/25 dark:bg-slate-400/15 dark:text-slate-300 dark:ring-slate-400/30",
  instagram: "bg-pink-500/10 text-pink-700 ring-1 ring-inset ring-pink-500/25 dark:bg-pink-400/15 dark:text-pink-300 dark:ring-pink-400/30",
  facebook_messenger: "bg-sky-500/10 text-sky-700 ring-1 ring-inset ring-sky-500/25 dark:bg-sky-400/15 dark:text-sky-300 dark:ring-sky-400/30",
  sms: "bg-violet-500/10 text-violet-700 ring-1 ring-inset ring-violet-500/25 dark:bg-violet-400/15 dark:text-violet-300 dark:ring-violet-400/30",
  phone: "bg-cyan-500/10 text-cyan-700 ring-1 ring-inset ring-cyan-500/25 dark:bg-cyan-400/15 dark:text-cyan-300 dark:ring-cyan-400/30",
  livechat: "bg-teal-500/10 text-teal-700 ring-1 ring-inset ring-teal-500/25 dark:bg-teal-400/15 dark:text-teal-300 dark:ring-teal-400/30",
};

const statusFilters: Array<{ label: string; value: ConversationStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Pending", value: "pending" },
  { label: "Snoozed", value: "snoozed" },
  { label: "Closed", value: "closed" },
];

type ChannelIconProps = { className?: string };

function WhatsAppIcon({ className }: ChannelIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("text-[#25D366]", className)} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function initials(name: string): string {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function ConnectionDot({ state }: { state: ChannelConnectionState }) {
  return <span className={cn("h-2 w-2 rounded-full", state === "connected" ? "bg-success" : state === "error" ? "bg-destructive" : state === "coming_soon" ? "bg-muted-foreground/50" : "bg-warning")} />;
}

function ConversationComposer({
  summary,
  account,
  actionError,
  onReply,
  onInternalNote,
}: {
  summary: ConversationSummary;
  account?: CommunicationChannelAccount;
  actionError: string | null;
  onReply: (body: string) => Promise<unknown>;
  onInternalNote: (body: string) => Promise<unknown>;
}) {
  const [mode, setMode] = useState<ComposerMode>("reply");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const windowExpired = Boolean(summary.windowExpiresAt && new Date(summary.windowExpiresAt).getTime() <= Date.now());
  const accountConnected = account?.state === "connected";
  const policyDisabled = account?.policyState === "disabled";
  const canReply = Boolean(accountConnected && account?.capabilities.canReply && !policyDisabled && !windowExpired);
  const canNote = Boolean(accountConnected && account?.capabilities.canAddInternalNote);
  const canSend = mode === "reply" ? canReply : canNote;

  const submit = async () => {
    if (!canSend || !body.trim()) return;
    setSending(true);
    try {
      if (mode === "reply") await onReply(body);
      else await onInternalNote(body);
      setBody("");
    } catch {
      // The hook exposes the normalized operational error beside the composer.
    } finally {
      setSending(false);
    }
  };

  let availabilityMessage = "WhatsApp replies are ready. Internal notes stay in LoopDev.";
  if (!account) availabilityMessage = "This channel account is unavailable. Actions are disabled.";
  else if (account.state === "disconnected") availabilityMessage = "Account disconnected. Reading remains available, but replies and notes are disabled.";
  else if (account.state !== "connected") availabilityMessage = `${account.statusMessage}. Channel actions are disabled until it is connected.`;
  else if (policyDisabled || !account.capabilities.canReply) availabilityMessage = "Replies are disabled by channel policy. Internal notes remain available.";
  else if (windowExpired) availabilityMessage = "WhatsApp window expired. An approved template is required; free-text replies are disabled.";

  return (
    <div className="space-y-2" aria-label="Conversation composer">
      <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Composer mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "reply"}
          disabled={!canReply}
          onClick={() => setMode("reply")}
          className={cn("rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50", mode === "reply" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
        >
          Reply
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "internal_note"}
          disabled={!canNote}
          onClick={() => setMode("internal_note")}
          className={cn("rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50", mode === "internal_note" ? "bg-warning text-warning-foreground" : "text-muted-foreground hover:bg-muted")}
        >
          Internal note
        </button>
        <span className="ms-auto text-[11px] text-muted-foreground">{availabilityMessage}</span>
      </div>
      {actionError && <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive" role="alert">{actionError}</p>}
      <div className="flex items-end gap-2">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={mode === "reply" ? "Write a WhatsApp reply…" : "Add an internal note…"}
          aria-label={mode === "reply" ? "Reply message" : "Internal note"}
          disabled={!canSend || sending}
          rows={2}
          className="min-h-[68px] resize-none bg-background"
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <Button
          size="icon"
          aria-label={mode === "reply" ? "Send reply" : "Add internal note"}
          disabled={!canSend || !body.trim() || sending}
          loading={sending}
          onClick={() => void submit()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">Ctrl/⌘ + Enter to send · Attachments, audio and templates are not enabled in this local phase.</p>
    </div>
  );
}

function ChannelRail({
  channels,
  selected,
  unreadCounts,
  onSelect,
  onRefresh,
}: {
  channels: ReturnType<typeof useCommunicationsInbox>["channels"];
  selected: CommunicationChannel | "all";
  unreadCounts: ReturnType<typeof useCommunicationsInbox>["channelUnreadCounts"];
  onSelect: (channel: CommunicationChannel | "all") => void;
  onRefresh: () => void;
}) {
  return (
    <aside className="border-b border-border bg-muted/45 lg:w-[204px] lg:shrink-0 lg:border-b-0 lg:border-e" aria-label="Communication channels">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Channels</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Operational inbox</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Refresh channels" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
      <nav className="flex gap-1 overflow-x-auto p-2 lg:block" aria-label="Channel filters">
        <button
          type="button"
          onClick={() => onSelect("all")}
          aria-current={selected === "all" ? "page" : undefined}
          className={cn("flex min-w-[132px] items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors lg:w-full", selected === "all" ? "bg-muted/80 font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
        >
          <Inbox className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">All channels</span>
          {unreadCounts && <span className="font-mono text-[11px]">{Object.values(unreadCounts).reduce((total, count) => total + (count ?? 0), 0) || ""}</span>}
        </button>
        {channels.map((account) => {
          const Icon = channelIcons[account.channel];
          const unread = unreadCounts[account.channel] ?? 0;
          return (
            <button
              type="button"
              key={account.id}
              onClick={() => onSelect(account.channel)}
              aria-current={selected === account.channel ? "page" : undefined}
              title={account.statusMessage}
              className={cn("flex min-w-[132px] items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors lg:w-full", selected === account.channel ? cn(channelSelectedClasses[account.channel], "font-semibold") : "text-muted-foreground hover:bg-muted hover:text-foreground")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{CHANNEL_LABELS[account.channel]}</span>
                <span className={cn("block truncate text-[10px] font-normal", account.state === "connected" ? "text-success" : "text-muted-foreground")}>{connectionLabels[account.state]}</span>
              </span>
              {unread > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{unread}</span>}
              <ConnectionDot state={account.state} />
            </button>
          );
        })}
      </nav>
      <div className="hidden border-t border-border px-4 py-4 lg:block">
        <p className="text-[11px] font-medium text-muted-foreground">Channel readiness</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">WhatsApp is connected for local operations. Other channels are prepared but not connected.</p>
      </div>
    </aside>
  );
}

export default function Communications() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<CommunicationChannel | "all">("all");
  const [status, setStatus] = useState<ConversationStatus | "all">("all");
  const [assignee, setAssignee] = useState<ConversationAssigneeFilter>("all");
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);
  const [showContextPlaceholder, setShowContextPlaceholder] = useState(false);
  const filters = useMemo(() => ({ channel, status, assignee, query, unreadOnly, starredOnly }), [assignee, channel, query, starredOnly, status, unreadOnly]);
  const inbox = useCommunicationsInbox(filters, COMMUNICATIONS_LOCAL_CONTEXT);
  const selectedSummary = inbox.conversations.find((item) => item.id === conversationId) ?? null;
  const selectedId = selectedSummary?.id ?? (conversationId && inbox.loading ? conversationId : undefined);
  const detail = useCommunicationConversation(selectedId, COMMUNICATIONS_LOCAL_CONTEXT);
  const selectedAccount = inbox.channels.find((item) => item.id === selectedSummary?.accountId);
  const selectedChannelAccount = inbox.channels.find((item) => item.channel === channel);

  useEffect(() => {
    if (!conversationId && inbox.conversations[0]) {
      // Keep the root inbox useful without forcing a route change before data is ready.
      return;
    }
    if (conversationId && !inbox.loading && !selectedSummary && inbox.conversations.length > 0) {
      navigate("/app/sales-crm/communications", { replace: true });
    }
  }, [conversationId, inbox.conversations, inbox.loading, navigate, selectedSummary]);

  const { markRead } = inbox;
  useEffect(() => {
    if (selectedSummary?.unreadCount) {
      void markRead(selectedSummary.id).then(() => detail.reload()).catch(() => undefined);
    }
  }, [detail.reload, markRead, selectedSummary?.id, selectedSummary?.unreadCount]);

  const selectConversation = (id: string) => navigate(`/app/sales-crm/communications/${id}`);
  const activeDetail = detail.conversation;
  const actionSummary = activeDetail?.summary ?? selectedSummary;

  const handleStatus = async (nextStatus: ConversationStatus) => {
    if (!actionSummary) return;
    try {
      await inbox.changeStatus(actionSummary.id, nextStatus, actionSummary.version);
      detail.reload();
    } catch {
      // The hook exposes the conflict or policy error in the action banner.
    }
  };

  const handleAssignment = async () => {
    if (!actionSummary) return;
    try {
      await inbox.assignConversation(
        actionSummary.id,
        COMMUNICATIONS_LOCAL_CONTEXT.userId,
        "Local operator",
        actionSummary.version,
      );
      detail.reload();
    } catch {
      // The hook exposes the conflict in the action banner.
    }
  };

  return (
    <div className="relative isolate -mx-3 -my-5 min-h-[calc(100vh-4rem)] w-[calc(100%+1.5rem)] overflow-hidden bg-background sm:-mx-4 sm:-my-6 sm:w-[calc(100%+2rem)] md:-mx-6 md:-my-7 md:w-[calc(100%+3rem)] lg:-mx-8 lg:-my-8 lg:w-[calc(100%+4rem)]">
      <section className="min-h-[calc(100vh-4rem)] w-full overflow-hidden" aria-label="Communications inbox">
        <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
          <ChannelRail
            channels={inbox.channels}
            selected={channel}
            unreadCounts={inbox.channelUnreadCounts}
            onSelect={setChannel}
            onRefresh={inbox.reload}
          />

          <section className="flex w-full flex-col border-b border-border bg-background lg:w-[350px] lg:shrink-0 lg:border-b-0 lg:border-e" aria-label="Conversation list">
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <SearchInput value={query} onValueChange={setQuery} placeholder="Search conversations" className="h-9 ps-9" containerClassName="w-full" />
              </div>
              <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-0.5" aria-label="Conversation status filters">
                {statusFilters.map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => setStatus(item.value)}
                    className={cn("rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors", status === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button type="button" onClick={() => setAssignee(assignee === "mine" ? "all" : "mine")} className={cn("rounded-md border px-2 py-1 text-[11px] font-medium", assignee === "mine" ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:bg-muted")}>
                  <UserRound className="me-1 inline h-3 w-3" /> Mine
                </button>
                <button type="button" onClick={() => setAssignee(assignee === "unassigned" ? "all" : "unassigned")} className={cn("rounded-md border px-2 py-1 text-[11px] font-medium", assignee === "unassigned" ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:bg-muted")}>
                  <Users className="me-1 inline h-3 w-3" /> Unassigned
                </button>
                <button type="button" onClick={() => setUnreadOnly((value) => !value)} className={cn("rounded-md border px-2 py-1 text-[11px] font-medium", unreadOnly ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:bg-muted")}>
                  Unread
                </button>
                <button type="button" onClick={() => setStarredOnly((value) => !value)} className={cn("rounded-md border px-2 py-1 text-[11px] font-medium", starredOnly ? "border-gold/40 bg-gold-soft text-gold" : "border-border text-muted-foreground hover:bg-muted")}>
                  <Star className="me-1 inline h-3 w-3" /> Starred
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-border px-4 py-2 text-[11px] text-muted-foreground">
              <span>{inbox.total} conversation{inbox.total === 1 ? "" : "s"}</span>
              {inbox.unreadCount > 0 && <span className="font-medium text-primary">{inbox.unreadCount} unread</span>}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {inbox.loading ? (
                <LoadingState variant="skeleton" rows={5} className="p-3" />
              ) : inbox.error ? (
                <div className="p-5" role="alert"><EmptyState variant="plain" size="sm" icon={AlertCircle} title="Unable to load inbox" description={inbox.error} action={<Button variant="outline" size="sm" onClick={inbox.reload}>Try again</Button>} /></div>
              ) : inbox.conversations.length === 0 ? (
                <div className="p-5"><EmptyState
                  variant="plain"
                  size="sm"
                  icon={Inbox}
                  title="No conversations found"
                  description={selectedChannelAccount?.state === "coming_soon"
                    ? `${CHANNEL_LABELS[selectedChannelAccount.channel]} is coming soon. Conversation actions are disabled until its adapter is connected.`
                    : query || status !== "all" || channel !== "all"
                      ? "Try clearing a filter or search term."
                      : "Authorized conversations will appear here."}
                /></div>
              ) : (
                <ul className="divide-y divide-border">
                  {inbox.conversations.map((conversation) => {
                    const Icon = channelIcons[conversation.channel];
                    const active = conversation.id === conversationId;
                    const unread = conversation.unreadCount > 0;
                    return (
                      <li key={conversation.id}>
                        <div className={cn(
                          "group flex w-full gap-2 border-s-2 border-transparent px-4 py-3 transition-colors",
                          active
                            ? "border-s-primary bg-primary-soft/90 shadow-sm ring-1 ring-inset ring-primary/10"
                            : unread
                              ? "bg-background hover:bg-muted/70"
                              : "bg-card hover:bg-muted/60",
                        )}>
                          <button type="button" onClick={() => selectConversation(conversation.id)} className="flex min-w-0 flex-1 gap-3 text-start">
                          <span className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            active
                              ? "bg-primary text-primary-foreground ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                              : unread
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                          )}>{initials(conversation.contact.displayName)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className={cn("min-w-0 flex-1 truncate text-sm", active || unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>{conversation.contact.displayName}</span>
                              <span className="shrink-0 text-[10px] text-muted-foreground">{conversation.lastMessageAt ? formatRelative(conversation.lastMessageAt) : "—"}</span>
                            </span>
                            <span className={cn("mt-1 flex items-center gap-1.5 text-[11px]", active ? "text-foreground/75" : "text-muted-foreground")}><Icon className="h-3 w-3" />{conversation.contact.identityStatus === "pending_identity_review" ? "Identity review" : CHANNEL_LABELS[conversation.channel]}<span aria-hidden="true">·</span><span className="truncate">{conversation.preview ?? "No messages yet"}</span></span>
                            <span className="mt-2 flex items-center gap-1.5">
                              <StatusBadge tone={statusTone[conversation.status]}>{statusLabels[conversation.status]}</StatusBadge>
                              {conversation.assignedToName && <span className="truncate text-[10px] text-muted-foreground">{conversation.assignedToName}</span>}
                              {conversation.unreadCount > 0 && <span className="ms-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{conversation.unreadCount}</span>}
                            </span>
                          </span>
                          </button>
                          <button type="button" aria-label={conversation.starred ? "Unstar conversation" : "Star conversation"} onClick={() => void inbox.toggleStar(conversation.id)} className={cn("self-end rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-gold group-hover:opacity-100", (conversation.starred || active) && "opacity-100", conversation.starred && "text-gold")}><Star className={cn("h-3.5 w-3.5", conversation.starred && "fill-current")} /></button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <section className="flex min-w-0 flex-1 flex-col bg-card" aria-label="Conversation thread">
            {!conversationId ? (
              <EmptyState variant="plain" size="lg" icon={MessageSquare} title="Select a conversation" description="Choose a conversation from the list to inspect its timeline." />
            ) : detail.loading ? (
              <LoadingState label="Loading conversation…" />
            ) : detail.error ? (
              <EmptyState variant="plain" size="lg" icon={AlertCircle} title="Unable to load conversation" description={detail.error} action={<Button variant="outline" size="sm" onClick={detail.reload}>Try again</Button>} />
            ) : !activeDetail || !selectedSummary ? (
              <EmptyState variant="plain" size="lg" icon={Inbox} title="Conversation unavailable" description="This conversation may no longer be in the selected view." />
            ) : (
              <>
                <header className="flex flex-wrap items-center gap-3 border-b border-primary/15 px-5 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{initials(selectedSummary.contact.displayName)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-display text-base font-semibold text-foreground">{selectedSummary.contact.displayName}</h2><StatusBadge tone={statusTone[selectedSummary.status]} dot>{statusLabels[selectedSummary.status]}</StatusBadge></div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{selectedAccount ? selectedAccount.label : CHANNEL_LABELS[selectedSummary.channel]} · {selectedSummary.contact.phone ?? selectedSummary.contact.email ?? "No contact detail"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8", selectedSummary.starred && "text-gold")} aria-label={selectedSummary.starred ? "Unstar conversation" : "Star conversation"} onClick={() => void inbox.toggleStar(selectedSummary.id)}><Star className={cn("h-4 w-4", selectedSummary.starred && "fill-current")} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Show CRM context placeholder" onClick={() => setShowContextPlaceholder((value) => !value)}><PanelRightOpen className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More conversation actions"><MoreHorizontal className="h-4 w-4" /></Button>
                  </div>
                </header>
                {selectedAccount && selectedAccount.state !== "connected" && <div className="flex items-center gap-2 border-b border-warning/20 bg-warning-soft px-5 py-2 text-xs text-warning"><ShieldAlert className="h-3.5 w-3.5 shrink-0" />{selectedAccount.statusMessage}. Reading is available; provider actions remain disabled.</div>}
                {showContextPlaceholder && <div className="border-b border-border bg-muted/40 px-5 py-3"><div className="flex items-start gap-2"><CircleUserRound className="mt-0.5 h-4 w-4 text-primary" /><div><p className="text-sm font-medium text-foreground">CRM context</p><p className="mt-0.5 text-xs text-muted-foreground">Contact, lead, opportunity and Customer 360 context will be available in a future phase.</p></div></div></div>}
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                  <div className="mb-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>{formatDate(selectedSummary.lastActivityAt, "medium")}</span><span className="h-px flex-1 bg-border" /></div>
                  <ol className="space-y-4">
                    {activeDetail.messages.map((message) => {
                      const internal = message.direction === "internal";
                      const outbound = message.direction === "outbound";
                      return (
                        <li key={message.id} className={cn("flex", internal ? "justify-center" : outbound ? "justify-end" : "justify-start")}>
                          {internal ? (
                            <div className="flex max-w-[90%] items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-warning"><Archive className="mt-0.5 h-3.5 w-3.5 shrink-0" /><div><p className="font-semibold">Internal note · {message.authorName}</p><p className="mt-1 leading-relaxed">{message.body}</p><p className="mt-1 text-[10px] opacity-80">{formatRelative(message.occurredAt)}</p></div></div>
                          ) : (
                            <div className={cn("max-w-[75%] rounded-xl px-4 py-2.5", outbound ? "rounded-ee-sm bg-primary text-primary-foreground" : "rounded-es-sm bg-muted text-foreground")}>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
                              <div className={cn("mt-1.5 flex items-center gap-1.5 text-[10px]", outbound ? "text-primary-foreground/70" : "text-muted-foreground")}><span>{message.authorName}</span><span>·</span><span>{formatRelative(message.occurredAt)}</span>{outbound && message.deliveryStatus && <><span>·</span><DeliveryStatus status={message.deliveryStatus} /></>}</div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>
                <footer className="border-t border-border bg-card-muted px-5 py-3">
                  <ConversationComposer
                    summary={activeDetail.summary}
                    account={selectedAccount}
                    actionError={detail.actionError ?? inbox.actionError}
                    onReply={async (body) => {
                      await detail.sendReply(body);
                      inbox.reload();
                    }}
                    onInternalNote={async (body) => {
                      await detail.addInternalNote(body);
                      inbox.reload();
                    }}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      {activeDetail.summary.assignedToName ? `Assigned to ${activeDetail.summary.assignedToName}` : "Unassigned"}
                    </div>
                    <div className="flex items-center gap-2">
                      {!activeDetail.summary.assignedToUserId && activeDetail.summary.status !== "closed" && <Button variant="outline" size="sm" onClick={() => void handleAssignment()}><UserPlus className="h-3.5 w-3.5" /> Assign to me</Button>}
                      {activeDetail.summary.status === "open" && <Button variant="outline" size="sm" onClick={() => void handleStatus("pending")}>Mark pending</Button>}
                      {(activeDetail.summary.status === "open" || activeDetail.summary.status === "pending") && <Button variant="outline" size="sm" onClick={() => void handleStatus("snoozed")}><TimerReset className="h-3.5 w-3.5" /> Snooze</Button>}
                      {activeDetail.summary.status !== "closed" && <Button variant="outline" size="sm" onClick={() => void handleStatus("closed")}><Check className="h-3.5 w-3.5" /> Close</Button>}
                      {activeDetail.summary.status !== "open" && <Button variant="outline" size="sm" onClick={() => void handleStatus("open")}>Reopen</Button>}
                    </div>
                  </div>
                </footer>
              </>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function DeliveryStatus({ status }: { status: NonNullable<import("@/loopdev/domains/communications").CommunicationMessage["deliveryStatus"]> }) {
  if (status === "failed") return <><AlertCircle className="h-3 w-3" /> Failed</>;
  if (status === "queued") return <><Clock3 className="h-3 w-3" /> Queued</>;
  if (status === "read") return <><CheckCheck className="h-3 w-3" /> Read</>;
  if (status === "delivered") return <><CheckCheck className="h-3 w-3" /> Delivered</>;
  return <><Check className="h-3 w-3" /> Sent</>;
}
