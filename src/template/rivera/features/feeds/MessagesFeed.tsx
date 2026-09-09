import { useNavigate } from "react-router-dom";
import { Inbox, MailOpen, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataCard, EmptyState } from "@/components/common";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { messagesStore, usersStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatRelative, getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Message, User } from "@/types";

/**
 * Reusable messages feed. Reads from `messagesStore` + `usersStore`
 * to render previews, with read / star / delete actions persisted to localStorage.
 */
export interface MessagesFeedProps {
  limit?: number;
  card?: boolean;
  title?: string | null;
  className?: string;
  /** Where the "View all" footer link should send users. */
  viewAllHref?: string;
}

export function MessagesFeed({
  limit,
  card = true,
  title = "Messages",
  className,
  viewAllHref = "/apps/chat",
}: MessagesFeedProps) {
  const messages = useLocalStore(messagesStore) as readonly Message[];
  const users = useLocalStore(usersStore) as readonly User[];
  const navigate = useNavigate();
  const userMap = new Map(users.map((u) => [u.id, u]));

  const sorted = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const visible = typeof limit === "number" ? sorted.slice(0, limit) : sorted;
  const unread = messages.filter((m) => !m.read).length;

  const toggleRead = (m: Message) => {
    messagesStore.update(m.id, { read: !m.read });
  };
  const toggleStar = (m: Message) => {
    messagesStore.update(m.id, { starred: !m.starred });
  };
  const remove = (m: Message) => {
    messagesStore.remove(m.id);
    toast("Message deleted");
  };
  const open = (m: Message) => {
    if (!m.read) messagesStore.update(m.id, { read: true });
    navigate(viewAllHref);
  };

  const list = (
    <ul className="divide-y divide-border">
      {visible.map((m) => {
        const sender = userMap.get(m.fromUserId);
        return (
          <li
            key={m.id}
            onClick={() => open(m)}
            className={cn(
              "group flex cursor-pointer items-start gap-3 px-4 py-3 transition-fast hover:bg-muted/60",
              !m.read && "bg-primary-soft/40",
            )}
          >
            <Avatar className="h-9 w-9 shrink-0 border border-border">
              <AvatarImage src={sender?.avatarUrl} alt={sender?.name} />
              <AvatarFallback className="bg-primary-soft text-xs font-medium text-primary">
                {getInitials(sender?.name ?? "·")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn("truncate text-sm", !m.read ? "font-semibold text-foreground" : "text-foreground")}>
                  {sender?.name ?? "Unknown"}
                </p>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {formatRelative(m.createdAt)}
                </span>
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{m.preview}</p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-fast group-hover:opacity-100">
              <button
                onClick={(e) => { e.stopPropagation(); toggleStar(m); }}
                aria-label={m.starred ? "Unstar message" : "Star message"}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-warning"
              >
                <Star className={cn("h-3.5 w-3.5", m.starred && "fill-warning text-warning")} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleRead(m); }}
                aria-label={m.read ? "Mark unread" : "Mark read"}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
              >
                <MailOpen className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); remove(m); }}
                aria-label="Delete message"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );

  const empty = (
    <div className="p-8">
      <EmptyState icon={Inbox} title="Inbox zero" description="No messages waiting for you." />
    </div>
  );

  const body = visible.length === 0 ? empty : list;
  if (!card) return <div className={className}>{body}</div>;

  return (
    <DataCard
      flush
      className={className}
      title={title ?? undefined}
      description={title ? `${unread} unread · ${messages.length} total` : undefined}
      action={
        title ? (
          <Button variant="ghost" size="sm" onClick={() => navigate(viewAllHref)}>
            Open inbox
          </Button>
        ) : null
      }
    >
      {body}
    </DataCard>
  );
}