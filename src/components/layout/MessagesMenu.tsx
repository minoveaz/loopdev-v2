import { MessageSquare, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { messagesStore, usersStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import { getInitials } from "@/lib/formatters";
import type { Message, User } from "@/types";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const diffMin = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 60) return `${diffMin}m`;
  if (diffMin < 1440) return `${Math.round(diffMin / 60)}h`;
  return `${Math.round(diffMin / 1440)}d`;
}

export function MessagesMenu() {
  const messages = useLocalStore(messagesStore) as readonly Message[];
  const users = useLocalStore(usersStore) as readonly User[];
  const navigate = useNavigate();
  const userMap = new Map(users.map((u) => [u.id, u]));
  const sorted = [...messages].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const unread = sorted.filter((m) => !m.read).length;

  const markAll = () => {
    sorted.forEach((m) => { if (!m.read) messagesStore.update(m.id, { read: true }); });
    toast.success("All messages marked as read");
  };

  const open = (m: Message) => {
    if (!m.read) messagesStore.update(m.id, { read: true });
    navigate(`/apps/chat?thread=${encodeURIComponent(m.threadId)}&message=${encodeURIComponent(m.id)}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground/85 transition-fast hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted data-[state=open]:text-foreground"
        aria-label="Messages"
      >
        <MessageSquare className="h-[17px] w-[17px]" />
        {unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 animate-scale-in items-center justify-center rounded-full bg-success px-1 text-[9px] font-bold text-success-foreground ring-2 ring-background">
            {unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="font-display text-sm font-semibold text-foreground">Messages</p>
            <p className="text-xs text-muted-foreground">{unread} unread · {sorted.length} total</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={markAll}
              disabled={unread === 0}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-fast hover:bg-primary-soft disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark read
            </button>
            <button
              onClick={() => { navigate("/apps/chat?compose=1"); toast("Opening composer…"); }}
              className="rounded-md px-2 py-1 text-xs font-medium text-primary transition-fast hover:bg-primary-soft"
            >
              Compose
            </button>
          </div>
        </div>
        <ul className="max-h-[360px] overflow-y-auto">
          {sorted.slice(0, 6).map((m) => {
            const sender = userMap.get(m.fromUserId);
            const name = sender?.name ?? "Unknown";
            return (
              <li
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => open(m)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open(m);
                  }
                }}
                className={cn(
                  "flex cursor-pointer items-start gap-3 border-b border-border px-4 py-3 transition-fast last:border-0 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
                  !m.read && "bg-primary-soft/40",
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {timeAgo(m.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{m.preview}</p>
                </div>
              </li>
            );
          })}
          {sorted.length === 0 && (
            <li className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 opacity-30" />
              <p>No messages</p>
            </li>
          )}
        </ul>
        <div className="border-t border-border px-4 py-2.5 text-center">
          <button onClick={() => navigate("/apps/chat")} className="text-xs font-semibold text-primary hover:underline">
            Open chat
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
