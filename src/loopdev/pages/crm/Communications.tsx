import { Fragment, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock3,
  FileText,
  Image as ImageIcon,
  Inbox,
  Instagram,
  Mail,
  MessageCircle,
  MessageSquare,
  MapPin,
  PanelRightOpen,
  PanelRightClose,
  Phone,
  Play,
  Pause,
  Package,
  Video,
  Link2,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { EmptyState, LoadingState, SearchInput, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  CHANNEL_LABELS,
  COMMUNICATIONS_LOCAL_CONTEXT,
  type ChannelConnectionState,
  type CommunicationChannelAccount,
  type CommunicationChannel,
  type ConversationCollaboration,
  type ConversationAssigneeFilter,
  type ConversationDetail,
  type ConversationSummary,
  type ConversationStatus,
} from "@/loopdev/domains/communications";
import { useCommunicationConversation, useCommunicationsInbox } from "@/loopdev/domains/communications/hooks/use-communications";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatRelative } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { CRMWorkspacePanel } from "@/loopdev/components/crm/CRMWorkspacePanel";
import { ConversationOperationsPanel } from "@/loopdev/components/communications/ConversationOperationsPanel";
import { loopdevAdapter } from "@/loopdev/domains/crm/adapter";
import type { CatalogItem } from "@/loopdev/domains/catalog";
import { LOCAL_CATALOG_ORGANIZATION_ID } from "@/loopdev/domains/catalog/data/localCatalog";
import { MessageContextMenu } from "@/loopdev/components/communications/MessageContextMenu";
import { toast } from "@/hooks/use-toast";
import { localFilesAdapter } from "@/loopdev/domains/files";
import { ConversationTimelineRail } from "@/loopdev/components/communications/ConversationTimelineRail";
import { ConversationTimelinePanel } from "@/loopdev/components/communications/ConversationTimelinePanel";
import type { ConversationContextView } from "@/loopdev/components/communications/ConversationContextTabs";
import { DocumentExtractionDrawer } from "@/loopdev/components/document-intelligence/DocumentExtractionDrawer";
import { DEMO_DOCUMENT_FIXTURES } from "@/loopdev/domains/document-intelligence/data/fixtures";
import type { IdentityDocumentFields } from "@/loopdev/domains/document-intelligence";
import { useT } from "@/i18n";

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

function MessageContent({ message, outbound }: { message: import("@/loopdev/domains/communications").CommunicationMessage; outbound: boolean }) {
  const [playing, setPlaying] = useState(false);
  const metadata = message.contentMetadata;
  if (!message.contentType || message.contentType === "text") {
    return <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>;
  }

  if (message.contentType === "audio") {
    return (
      <div className="flex min-w-[210px] items-center gap-2.5">
        <button type="button" aria-label={playing ? "Pause audio" : "Play audio"} onClick={() => setPlaying((value) => !value)} className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", outbound ? "bg-primary-foreground/20" : "bg-primary/10 text-primary")}>
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-0.5" aria-label="Audio waveform">
            {Array.from({ length: 24 }, (_, index) => <span key={index} className={cn("w-1 rounded-full", index % 4 === 0 ? "h-5" : index % 3 === 0 ? "h-3" : "h-2", outbound ? "bg-primary-foreground/70" : "bg-primary/50")} />)}
          </div>
          <p className="mt-1 text-[10px] opacity-75">{metadata?.durationSeconds ? `0:${String(metadata.durationSeconds).padStart(2, "0")}` : "Voice message"}</p>
        </div>
      </div>
    );
  }

  if (message.contentType === "document") {
    return (
      <div className={cn("flex min-w-[220px] items-center gap-3 rounded-lg border p-2.5", outbound ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-border bg-background/70")}>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", outbound ? "bg-primary-foreground/20" : "bg-destructive/10 text-destructive")}><FileText className="h-5 w-5" /></span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">{metadata?.name ?? message.body}</p>
          <p className="mt-0.5 text-[10px] opacity-75">{metadata?.size ?? metadata?.mimeType ?? "Document"}</p>
        </div>
      </div>
    );
  }

  if (message.contentType === "image") {
    return (
      <div className="overflow-hidden rounded-lg">
        <div className="flex h-32 w-56 items-center justify-center bg-gradient-to-br from-primary/30 via-sky-200 to-emerald-200 dark:via-sky-900 dark:to-emerald-900"><ImageIcon className="h-10 w-10 text-white/80" /></div>
        <p className="mt-1 text-xs font-medium">{metadata?.name ?? message.body}</p>
        {metadata?.size && <p className="text-[10px] opacity-70">{metadata.size}</p>}
      </div>
    );
  }

  if (message.contentType === "location") {
    return (
      <div className={cn("flex min-w-[220px] items-center gap-3 rounded-lg border p-2.5", outbound ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-border bg-background/70")}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-500"><MapPin className="h-5 w-5" /></span>
        <div><p className="text-xs font-semibold">{message.body}</p><p className="mt-0.5 text-[10px] opacity-75">{metadata?.locationLabel ?? "Shared location"}</p></div>
      </div>
    );
  }

  if (message.contentType === "video") {
    return (
      <div className={cn("flex min-w-[220px] items-center gap-3 rounded-lg border p-2.5", outbound ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-border bg-background/70")}>
        <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white"><Video className="h-5 w-5" /></span>
        <div><p className="text-xs font-semibold">{metadata?.name ?? message.body}</p><p className="mt-0.5 text-[10px] opacity-75">{metadata?.durationSeconds ? `0:${String(metadata.durationSeconds).padStart(2, "0")}` : "Video"}{metadata?.size ? ` · ${metadata.size}` : ""}</p></div>
      </div>
    );
  }

  if (message.contentType === "catalog_item") {
    return (
      <div className={cn("min-w-[240px] rounded-lg border p-3", outbound ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-border bg-background/70")}>
        <div className="flex items-start gap-3">
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", outbound ? "bg-primary-foreground/20" : "bg-primary/10 text-primary")}><Package className="h-4 w-4" /></span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Catalog item</p>
            <p className="truncate text-xs font-semibold">{metadata?.name ?? message.body}</p>
            <p className="mt-0.5 text-[10px] opacity-75">{metadata?.catalogItemType ?? "Product or service"} · {metadata?.catalogItemKey ?? "Reference"}</p>
            {metadata?.catalogPrice && <p className="mt-2 text-xs font-semibold">{metadata.catalogPrice} {metadata.catalogCurrency ?? ""}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <a href={metadata?.url ?? "#"} target="_blank" rel="noreferrer" className={cn("flex min-w-[220px] items-center gap-3 rounded-lg border p-2.5", outbound ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-border bg-background/70")}>
      <Link2 className="h-5 w-5 shrink-0 text-primary" />
      <span className="truncate text-xs font-semibold">{metadata?.name ?? message.body}</span>
    </a>
  );
}

function ConversationComposer({
  summary,
  collaboration,
  account,
  draft,
  onDraftChange,
  actionError,
  onReply,
}: {
  summary: ConversationSummary;
  collaboration?: ConversationCollaboration;
  account?: CommunicationChannelAccount;
  draft: { body: string };
  onDraftChange: (draft: { body: string }) => void;
  actionError: string | null;
  onReply: (body: string, content?: { contentType?: "catalog_item"; contentMetadata?: { catalogItemId?: string; catalogItemKey?: string; catalogItemType?: string; catalogPrice?: string; catalogCurrency?: string } }) => Promise<unknown>;
}) {
  const [sending, setSending] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogItemId, setCatalogItemId] = useState("");
  const { body } = draft;
  useEffect(() => {
    void loopdevAdapter.catalog.listCatalogItems({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID }).then(setCatalogItems).catch(() => setCatalogItems([]));
  }, []);
  const windowExpired = Boolean(summary.windowExpiresAt && new Date(summary.windowExpiresAt).getTime() <= Date.now());
  const accountConnected = account?.state === "connected";
  const policyDisabled = account?.policyState === "disabled";
  const composerOwnedByOther = collaboration?.composerLock && collaboration.composerLock.userId !== COMMUNICATIONS_LOCAL_CONTEXT.userId;
  const canReply = Boolean(accountConnected && account?.capabilities.canReply && !policyDisabled && !windowExpired && !composerOwnedByOther);
  const canSend = canReply;

  const submit = async () => {
    if (!canSend || !body.trim()) return;
    setSending(true);
    try {
      const selected = catalogItems.find((item) => item.id === catalogItemId);
      await onReply(body, selected ? { contentType: "catalog_item", contentMetadata: { catalogItemId: selected.id, catalogItemKey: selected.key, catalogItemType: selected.type, catalogPrice: selected.metadata.price ? String(selected.metadata.price) : undefined, catalogCurrency: selected.metadata.currency ? String(selected.metadata.currency) : undefined } } : undefined);
      onDraftChange({ body: "" });
      setCatalogItemId("");
    } catch {
      // The hook exposes the normalized operational error beside the composer.
    } finally {
      setSending(false);
    }
  };

  let availabilityMessage = `Replies go directly to ${summary.contact.displayName}.`;
  if (!account) availabilityMessage = "This channel account is unavailable. Actions are disabled.";
  else if (account.state === "disconnected") availabilityMessage = "Account disconnected. Reading remains available, but customer replies are disabled.";
  else if (account.state !== "connected") availabilityMessage = `${account.statusMessage}. Channel actions are disabled until it is connected.`;
  else if (policyDisabled || !account.capabilities.canReply) availabilityMessage = "Customer replies are disabled by channel policy.";
  else if (windowExpired) availabilityMessage = "WhatsApp window expired. An approved template is required; free-text replies are disabled.";
  else if (composerOwnedByOther) availabilityMessage = `${collaboration?.composerLock?.name} is drafting a customer reply. Open Conversation Operations to take over.`;

  return (
    <div className="space-y-2" aria-label="Conversation composer">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-primary-soft px-2.5 py-1.5 text-xs font-semibold text-primary">Customer reply</span>
        <span className="text-[11px] text-muted-foreground">{availabilityMessage}</span>
        {accountConnected && <span className="text-[11px] font-medium text-muted-foreground">Queued</span>}
      </div>
      {actionError && <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive" role="alert">{actionError}</p>}
      <div className="flex items-center gap-2"><Package className="h-3.5 w-3.5 text-muted-foreground" /><select aria-label="Attach catalog item" value={catalogItemId} onChange={(event) => setCatalogItemId(event.target.value)} disabled={!canSend || sending} className="h-8 max-w-full rounded-md border border-input bg-background px-2 text-xs"><option value="">Attach catalog item (optional)</option>{catalogItems.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.type}</option>)}</select></div>
      <div className="flex items-end gap-2">
        <Textarea
          value={body}
          onChange={(event) => onDraftChange({ body: event.target.value })}
          placeholder="Write a WhatsApp reply…"
          aria-label={`Customer reply to ${summary.contact.displayName}`}
          disabled={!canSend || sending}
          rows={2}
          enterKeyHint="send"
          className="min-h-[68px] resize-none bg-background touch-manipulation"
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <Button
          size="icon"
          aria-label="Send reply"
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
  hideOnThread,
  hideOnContext,
}: {
  channels: ReturnType<typeof useCommunicationsInbox>["channels"];
  selected: CommunicationChannel | "all";
  unreadCounts: ReturnType<typeof useCommunicationsInbox>["channelUnreadCounts"];
  onSelect: (channel: CommunicationChannel | "all") => void;
  onRefresh: () => void;
  hideOnThread?: boolean;
  hideOnContext?: boolean;
}) {
  return (
    <aside className={cn(
      "border-b border-border/80 bg-muted/60 dark:bg-card/60 lg:w-[204px] lg:shrink-0 lg:border-b-0 lg:border-e",
      hideOnContext ? "hidden lg:hidden" : hideOnThread && "hidden lg:block",
    )} aria-label="Communication channels">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Channels</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Operational inbox</p>
        </div>
        <Button variant="ghost" size="icon" className="hidden h-8 w-8 lg:inline-flex" aria-label="Refresh channels" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex items-center gap-2 p-2 lg:hidden">
        <label htmlFor="mobile-channel-filter" className="text-[11px] font-medium text-muted-foreground">Channel</label>
        <select
          id="mobile-channel-filter"
          aria-label="Channel filter"
          value={selected}
          onChange={(event) => onSelect(event.target.value as CommunicationChannel | "all")}
          className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs"
        >
          <option value="all">All channels</option>
          {channels.map((account) => <option key={account.id} value={account.channel}>{CHANNEL_LABELS[account.channel]} · {connectionLabels[account.state]}</option>)}
        </select>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Refresh channels" onClick={onRefresh}><RefreshCw className="h-3.5 w-3.5" /></Button>
      </div>
      <nav className="hidden gap-1 overflow-x-auto p-2 lg:block" aria-label="Channel filters">
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
  const t = useT();
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<CommunicationChannel | "all">("all");
  const [status, setStatus] = useState<ConversationStatus | "all">("all");
  const [assignee, setAssignee] = useState<ConversationAssigneeFilter>("all");
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);
  const [contextView, setContextView] = useState<ConversationContextView | null>(null);
  const [lastContextView, setLastContextView] = useState<ConversationContextView>("crm");
  const [composerDrafts, setComposerDrafts] = useState<Record<string, { body: string }>>({});
  const threadScrollPositions = useRef<Record<string, number>>({});
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const presenceConversationRef = useRef<string | null>(null);
  const filters = useMemo(() => ({ channel, status, assignee, query, unreadOnly, starredOnly }), [assignee, channel, query, starredOnly, status, unreadOnly]);
  const inbox = useCommunicationsInbox(filters, COMMUNICATIONS_LOCAL_CONTEXT);
  const selectedSummary = inbox.conversations.find((item) => item.id === conversationId) ?? null;
  const selectedId = selectedSummary?.id ?? (conversationId && inbox.loading ? conversationId : undefined);
  const detail = useCommunicationConversation(selectedId, COMMUNICATIONS_LOCAL_CONTEXT);
  const selectedAccount = inbox.channels.find((item) => item.id === selectedSummary?.accountId);
  const selectedChannelAccount = inbox.channels.find((item) => item.channel === channel);
  const openContextView = (view: ConversationContextView) => {
    setLastContextView(view);
    setContextView(view);
  };
  const closeContextView = () => setContextView(null);
  const contextLabel = lastContextView === "crm"
    ? "CRM workspace"
    : lastContextView === "operations"
      ? "Conversation Operations"
      : "Conversation Timeline";

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
  const reloadDetail = detail.reload;
  useEffect(() => {
    if (selectedSummary?.unreadCount) {
      void markRead(selectedSummary.id).then(() => reloadDetail()).catch(() => undefined);
    }
  }, [markRead, reloadDetail, selectedSummary?.id, selectedSummary?.unreadCount]);

  const selectConversation = (id: string) => navigate(`/app/sales-crm/communications/${id}`);
  const activeDetail = detail.conversation;
  const lastActiveDetailRef = useRef<ConversationDetail | null>(null);
  if (activeDetail) lastActiveDetailRef.current = activeDetail;
  const renderedDetail = activeDetail ?? lastActiveDetailRef.current;
  const renderedSummary = selectedSummary ?? renderedDetail?.summary ?? null;
  const actionSummary = activeDetail?.summary ?? selectedSummary;
  const presenceDetail = detail.conversation;
  const updatePresence = detail.setPresence;
  useEffect(() => {
    if (!selectedId || !presenceDetail) return;
    if (presenceConversationRef.current === selectedId) return;
    presenceConversationRef.current = selectedId;
    void updatePresence("viewing").catch(() => undefined);
  }, [presenceDetail, selectedId, updatePresence]);
  const composerDraft = selectedSummary
    ? composerDrafts[selectedSummary.id] ?? { body: "" }
    : { body: "" };
  const updateComposerDraft = (draft: { body: string }) => {
    if (!selectedSummary) return;
    setComposerDrafts((current) => ({ ...current, [selectedSummary.id]: draft }));
    void detail.setDrafting(draft.body.trim() ? "reply" : null).catch(() => undefined);
  };

  const [extractionDrawerOpen, setExtractionDrawerOpen] = useState(false);
  const [extractionInitialFile, setExtractionInitialFile] = useState<any>(null);

  const handleExtractDocument = (message: import("@/loopdev/domains/communications").CommunicationMessage) => {
    const fixtureMatch = DEMO_DOCUMENT_FIXTURES[0];
    const previewUrl = message.contentMetadata?.url || fixtureMatch.previewUrl;
    setExtractionInitialFile({
      name: message.contentMetadata?.name || "documento-adjunto.svg",
      size: Number.parseInt(message.contentMetadata?.size ?? "45000", 10) || 45000,
      mimeType: message.contentMetadata?.mimeType || "image/svg+xml",
      previewUrl,
    });
    setExtractionDrawerOpen(true);
  };

  const handleApplyExtractedDocument = async (fields: IdentityDocumentFields) => {
    if (!selectedSummary?.contact?.id) {
      toast({ title: "Datos extraídos", description: "No hay un contacto seleccionado para actualizar." });
      return;
    }

    try {
      const contactId = selectedSummary.contact.id;
      const c360 = await loopdevAdapter.crm.getCustomer360(contactId);
      if (!c360) {
        toast({ title: "Error", description: "No se encontró el registro del contacto.", variant: "destructive" });
        return;
      }

      const docTypeMap: Record<string, string> = {
        "spanish-dni": "DNI",
        "spanish-nie": "NIE",
        passport: "PASSPORT",
      };

      const patch: any = {
        organizationId: selectedSummary.organizationId,
      };

      if (fields.givenNames) patch.firstName = fields.givenNames;
      if (fields.firstSurname) patch.lastName = fields.firstSurname;
      if (fields.secondSurname) patch.secondLastName = fields.secondSurname;
      if (fields.documentNumber) patch.documentNumber = fields.documentNumber;
      if (fields.birthDate) patch.birthDate = fields.birthDate;
      if (fields.address) patch.addressLine1 = fields.address;
      if (fields.nationality === "ESP") patch.country = "Spain";
      if (fields.sex) {
        const genderMap: Record<string, string> = { M: "male", F: "female" };
        if (genderMap[fields.sex]) patch.gender = genderMap[fields.sex];
      }
      if (fields.documentType && docTypeMap[fields.documentType]) {
        patch.documentType = docTypeMap[fields.documentType];
      }

      const result = await loopdevAdapter.crm.updateContact(contactId, patch, c360.contact.updatedAt);
      if (result.status === "success") {
        toast({
          title: "Contacto actualizado",
          description: `Los datos extraídos se aplicaron correctamente a ${result.contact.firstName} ${result.contact.lastName ?? ""}.`,
        });
        inbox.reload();
      } else {
        toast({
          title: "No se pudo actualizar el contacto",
          description: "message" in result ? result.message : "Error de validación",
          variant: "destructive",
        });
      }
    } catch (cause) {
      toast({
        title: "Error al actualizar contacto",
        description: cause instanceof Error ? cause.message : "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!conversationId || !threadScrollRef.current) return;
    threadScrollRef.current.scrollTop = threadScrollPositions.current[conversationId] ?? 0;
  }, [conversationId, activeDetail?.messages.length]);

  const handleOperationsStatus = async (nextStatus: ConversationStatus) => {
    if (!actionSummary) return;
    await inbox.changeStatus(actionSummary.id, nextStatus, actionSummary.version);
    await detail.reload();
  };

  const handleOperationsAssignment = async (action: "claim" | "unassign") => {
    if (!actionSummary) return;
    if (action === "claim") {
      await detail.claimConversation(actionSummary.version);
    } else {
      await detail.unassignConversation(actionSummary.version);
    }
    await inbox.reload();
  };

  const handleOperationsTransfer = async (agent: import("@/loopdev/domains/communications").CollaborationAgent) => {
    if (!actionSummary) return;
    await detail.transferConversation(agent.userId, agent.name, actionSummary.version);
    await inbox.reload();
  };

  const handleOperationsHandoff = async (agent: import("@/loopdev/domains/communications").CollaborationAgent) => {
    if (!actionSummary) return;
    await detail.requestHandoff(agent.userId, agent.name, actionSummary.version);
  };

  return (
    <div className="relative isolate flex h-full min-h-0 w-full overflow-hidden bg-background">
      <section className="flex h-full min-h-0 w-full overflow-hidden" aria-label="Communications inbox">
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <ChannelRail
            channels={inbox.channels}
            selected={channel}
            unreadCounts={inbox.channelUnreadCounts}
            onSelect={setChannel}
            onRefresh={inbox.reload}
            hideOnThread={Boolean(conversationId)}
            hideOnContext={Boolean(contextView)}
          />

          <section className={cn("w-full flex-col border-b border-border/80 bg-card lg:flex lg:w-[350px] lg:shrink-0 lg:border-b-0 lg:border-e", conversationId ? "hidden" : "flex")} aria-label="Conversation list">
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
                <div className="p-5" role="alert"><EmptyState variant="plain" size="sm" icon={AlertCircle} title={t("crm.communications.loadInboxError")} description={inbox.error} action={<Button variant="outline" size="sm" onClick={inbox.reload}>{t("common.actions.retry")}</Button>} /></div>
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
                              {conversation.assignedToName
                                ? <span className="inline-flex min-w-0 items-center gap-1 truncate text-[10px] text-muted-foreground" title={`Owned by ${conversation.assignedToName}`}><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[8px] font-semibold text-primary">{initials(conversation.assignedToName)}</span>{conversation.assignedToName}</span>
                                : <span className="text-[10px] text-muted-foreground">Unassigned</span>}
                              {conversation.collaboration?.presence.filter((item) => item.state !== "offline").map((item) => <span key={`list-presence-${item.userId}`} title={`${item.name} is ${item.state}`} className="h-1.5 w-1.5 rounded-full bg-success" />)}
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

          <section className={cn("min-h-0 min-w-0 flex-1 flex-col bg-background", conversationId ? "flex" : "hidden lg:flex")} aria-label="Conversation thread">
            {!conversationId ? (
              <EmptyState variant="plain" size="lg" icon={MessageSquare} title={t("crm.communications.selectConversation")} description={t("crm.communications.selectConversationDescription")} />
            ) : detail.loading ? (
              <LoadingState label={t("crm.communications.loadingConversation")} />
            ) : detail.error ? (
              <EmptyState variant="plain" size="lg" icon={AlertCircle} title={t("crm.communications.loadConversationError")} description={detail.error} action={<Button variant="outline" size="sm" onClick={detail.reload}>{t("common.actions.retry")}</Button>} />
            ) : !activeDetail || !selectedSummary ? (
                  <EmptyState variant="plain" size="lg" icon={Inbox} title={t("crm.communications.conversationUnavailable")} description={t("crm.communications.conversationUnavailableDescription")} />
            ) : (
              <>
                <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border/80 bg-card px-3 py-3 sm:px-5">
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 lg:hidden" aria-label="Back to conversations" onClick={() => navigate("/app/sales-crm/communications")}><ArrowLeft className="h-4 w-4" /></Button>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{initials(selectedSummary.contact.displayName)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-display text-base font-semibold text-foreground">{selectedSummary.contact.displayName}</h2><StatusBadge tone={statusTone[selectedSummary.status]} dot>{statusLabels[selectedSummary.status]}</StatusBadge></div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{selectedAccount ? selectedAccount.label : CHANNEL_LABELS[selectedSummary.channel]} · {selectedSummary.contact.phone ?? selectedSummary.contact.email ?? "No contact detail"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground"
                      aria-label={selectedSummary.assignedToName ? `Responsible: ${selectedSummary.assignedToName}` : "Responsible: unassigned"}
                      title={selectedSummary.assignedToName ? `Responsible: ${selectedSummary.assignedToName}` : "Responsible: unassigned"}
                    >
                      {selectedSummary.assignedToName ? initials(selectedSummary.assignedToName) : "—"}
                    </span>
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8", selectedSummary.starred && "text-gold")} aria-label={selectedSummary.starred ? "Unstar conversation" : "Star conversation"} onClick={() => void inbox.toggleStar(selectedSummary.id)}><Star className={cn("h-4 w-4", selectedSummary.starred && "fill-current")} /></Button>
                    {!contextView && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Open ${contextLabel}`}
                        title={`Open ${contextLabel}`}
                        onClick={() => openContextView(lastContextView)}
                      >
                        <PanelRightOpen className="h-4 w-4" />
                      </Button>
                    )}
                    {!contextView && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Open Conversation Operations"
                        title="Open Conversation Operations"
                        onClick={() => openContextView("operations")}
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </header>
                {selectedAccount && selectedAccount.state !== "connected" && <div className="flex items-center gap-2 border-b border-warning/20 bg-warning-soft px-5 py-2 text-xs text-warning"><ShieldAlert className="h-3.5 w-3.5 shrink-0" />{selectedAccount.statusMessage}. Reading is available; provider actions remain disabled.</div>}
                <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                  <div ref={threadScrollRef} onScroll={(event) => { threadScrollPositions.current[selectedSummary.id] = event.currentTarget.scrollTop; }} className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-5">
                    <ol className="space-y-4">
                      {activeDetail.messages.filter((message) => message.direction !== "internal").map((message, index, visibleMessages) => {
                        const outbound = message.direction === "outbound";
                        const previousMessage = visibleMessages[index - 1];
                        const showDaySeparator = !previousMessage || previousMessage.occurredAt.slice(0, 10) !== message.occurredAt.slice(0, 10);
                        return (
                          <Fragment key={message.id}>
                            {showDaySeparator && (
                              <li aria-label={`Messages from ${formatDate(message.occurredAt, "medium")}`} className="flex items-center gap-2 py-1 text-[11px] text-muted-foreground">
                                <span className="h-px flex-1 bg-border" />
                                <span className="rounded-full border border-border/80 bg-muted/40 px-2.5 py-0.5 font-medium">{formatDate(message.occurredAt, "medium")}</span>
                                <span className="h-px flex-1 bg-border" />
                              </li>
                            )}
                            <li id={`conversation-message-${message.id}`} className={cn("flex scroll-mt-6", outbound ? "justify-end" : "justify-start")}>
                              <MessageContextMenu
                                message={message}
                                onCopy={(selectedMessage) => navigator.clipboard.writeText(selectedMessage.body)}
                                onReply={(selectedMessage) => updateComposerDraft({ body: `> ${selectedMessage.body}\n\n` })}
                                onOpenOperations={() => openContextView("operations")}
                                onExtractDocument={handleExtractDocument}
                                onSaveToCustomer={async (selectedMessage) => {
                                  const metadata = selectedMessage.contentMetadata;
                                  if (!metadata?.name) {
                                    toast({ title: "Unable to save attachment", description: "This message does not contain a file name.", variant: "destructive" });
                                    return;
                                  }
                                  try {
                                    await localFilesAdapter.createMetadata({
                                      scope: { organizationId: selectedSummary.organizationId, workspaceId: selectedSummary.workspaceId },
                                      relation: { entityType: "contact", entityId: selectedSummary.contact.id, scope: { organizationId: selectedSummary.organizationId, workspaceId: selectedSummary.workspaceId }, label: selectedSummary.contact.displayName },
                                      fileName: metadata.name,
                                      mimeType: metadata.mimeType ?? "application/octet-stream",
                                      byteSize: Number.parseInt(metadata.size ?? "0", 10) || 0,
                                      category: "communications",
                                      source: "conversation",
                                      sourceMetadata: { conversationId: selectedMessage.conversationId, messageId: selectedMessage.id },
                                    });
                                    toast({ title: "File saved to customer record", description: `${metadata.name} is now available in Customer 360.` });
                                  } catch (cause) {
                                    toast({ title: "Unable to save file", description: cause instanceof Error ? cause.message : "Please try again.", variant: "destructive" });
                                  }
                                }}
                              >
                                <div className={cn("max-w-[75%] rounded-xl px-4 py-2.5", outbound ? "rounded-ee-sm bg-primary text-primary-foreground" : "rounded-es-sm bg-muted text-foreground")}>
                                  <MessageContent message={message} outbound={outbound} />
                                  <div className={cn("mt-1.5 flex items-center gap-1.5 text-[10px]", outbound ? "text-primary-foreground/70" : "text-muted-foreground")}><span>{message.authorName}</span><span>·</span><span>{formatRelative(message.occurredAt)}</span>{outbound && message.deliveryStatus && <><span>·</span><DeliveryStatus status={message.deliveryStatus} /></>}</div>
                                </div>
                              </MessageContextMenu>
                            </li>
                          </Fragment>
                        );
                      })}
                    </ol>
                  </div>
                  <ConversationTimelineRail
                    messages={activeDetail.messages.filter((message) => message.direction !== "internal")}
                    onOpenDetails={() => openContextView("timeline")}
                  />
                </div>
                <footer className="shrink-0 border-t border-border/80 bg-muted/25 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:bg-card-muted sm:px-5">
                  <ConversationComposer
                    summary={activeDetail.summary}
                    collaboration={activeDetail.collaboration}
                    account={selectedAccount}
                    draft={composerDraft}
                    onDraftChange={updateComposerDraft}
                    actionError={detail.actionError ?? inbox.actionError}
                    onReply={async (body, content) => {
                      await detail.sendReply(body, undefined, content);
                      inbox.reload();
                    }}
                  />
                </footer>
              </>
            )}
          </section>
          {selectedSummary && (
            <CRMWorkspacePanel
              conversation={selectedSummary}
              open={contextView === "crm"}
              onOpenChange={(open) => open ? openContextView("crm") : closeContextView()}
              contextView={contextView ?? "crm"}
              onContextViewChange={openContextView}
            />
          )}
          {renderedDetail && renderedSummary && (
            <ConversationOperationsPanel
              detail={renderedDetail}
              open={contextView === "operations"}
              onOpenChange={(open) => open ? openContextView("operations") : closeContextView()}
              contextView={contextView ?? "operations"}
              onContextViewChange={openContextView}
              actionError={detail.actionError ?? inbox.actionError}
              onStatusChange={handleOperationsStatus}
              onClaim={() => handleOperationsAssignment("claim")}
              onTransfer={handleOperationsTransfer}
              onUnassign={() => handleOperationsAssignment("unassign")}
              onHandoff={handleOperationsHandoff}
              onParticipant={detail.updateParticipant}
              onAddInternalNote={async (body) => { await detail.addInternalNote(body); inbox.reload(); }}
              onCreateGlobalNote={async (value) => {
                await loopdevAdapter.notes.create({
                  organizationId: renderedSummary.organizationId,
                  authorId: "local-development-user",
                  authorName: "Alex Morgan",
                  ...value,
                });
              }}
              onAcquireLock={() => detail.acquireComposerLock(activeDetail.summary.version)}
              onReleaseLock={detail.releaseComposerLock}
              onTakeoverLock={detail.takeoverComposerLock}
            />
          )}
          {activeDetail && selectedSummary && (
            <ConversationTimelinePanel
              messages={activeDetail.messages.filter((message) => message.direction !== "internal")}
              open={contextView === "timeline"}
              onOpenChange={(open) => open ? openContextView("timeline") : closeContextView()}
              contextView={contextView ?? "timeline"}
              onContextViewChange={openContextView}
            />
          )}
        </div>
      </section>

      {selectedSummary && (
        <DocumentExtractionDrawer
          open={extractionDrawerOpen}
          onOpenChange={setExtractionDrawerOpen}
          sourceSuite="communications"
          sourceReferenceId={selectedSummary.id}
          initialFile={extractionInitialFile}
          onApplyExtractedData={handleApplyExtractedDocument}
        />
      )}
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
