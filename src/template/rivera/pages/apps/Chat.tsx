import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Paperclip, PenSquare, Search, Send, Smile, Star } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { messagesStore, usersStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatRelative, getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Message, User } from "@/types";

/** "Me" — used as the from-user for replies. We pin the first user. */
const ME_ID = "u_01";

interface ThreadSummary {
  threadId: string;
  contact: User | undefined;
  last: Message;
  unread: number;
  starred: boolean;
}

export default function ChatPage() {
  const { trail } = useBreadcrumbs();
  const messages = useLocalStore(messagesStore);
  const users = useLocalStore(usersStore);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const [search, setSearch] = useState("");
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Composer dialog state
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerTo, setComposerTo] = useState<string>("");
  const [composerBody, setComposerBody] = useState("");

  const threads = useMemo<ThreadSummary[]>(() => {
    const map = new Map<string, Message[]>();
    for (const m of messages) {
      const arr = map.get(m.threadId) ?? [];
      arr.push(m);
      map.set(m.threadId, arr);
    }
    const list: ThreadSummary[] = [];
    for (const [threadId, arr] of map) {
      arr.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
      const last = arr[arr.length - 1];
      const contactId = last.fromUserId === ME_ID ? last.toUserId : last.fromUserId;
      list.push({
        threadId,
        contact: userMap.get(contactId),
        last,
        unread: arr.filter((m) => !m.read && m.fromUserId !== ME_ID).length,
        starred: arr.some((m) => m.starred),
      });
    }
    list.sort((a, b) => +new Date(b.last.createdAt) - +new Date(a.last.createdAt));
    return list;
  }, [messages, userMap]);

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) =>
      (t.contact?.name.toLowerCase().includes(q) ?? false) ||
      t.last.preview.toLowerCase().includes(q),
    );
  }, [threads, search]);

  // Default-select the first thread on mount.
  useEffect(() => {
    if (!activeThread && threads.length > 0) setActiveThread(threads[0].threadId);
  }, [activeThread, threads]);

  // Deep-link support: ?thread=<id>&message=<id>
  // Selects the matching thread, marks the target message read, scrolls to it,
  // and briefly highlights the row. Strips params from the URL afterwards.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const threadParam = params.get("thread");
    const messageParam = params.get("message");
    if (!threadParam && !messageParam) return;
    if (messages.length === 0) return;

    let resolvedThread: string | null = null;
    if (threadParam && messages.some((m) => m.threadId === threadParam)) {
      resolvedThread = threadParam;
    } else if (messageParam) {
      const target = messages.find((m) => m.id === messageParam);
      if (target) resolvedThread = target.threadId;
    }
    if (!resolvedThread) return;

    setActiveThread(resolvedThread);

    if (messageParam) {
      const target = messages.find((m) => m.id === messageParam);
      if (target && !target.read) messagesStore.update(target.id, { read: true });
      requestAnimationFrame(() => {
        const el = document.getElementById(`message-${messageParam}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-primary/60", "rounded-xl", "transition-all");
          setTimeout(() => el.classList.remove("ring-2", "ring-primary/60"), 1800);
        }
      });
    }

    params.delete("thread");
    params.delete("message");
    const next = params.toString();
    navigate(
      { pathname: location.pathname, search: next ? `?${next}` : "", hash: location.hash },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, messages.length]);

  // Deep-link compose: ?compose=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("compose") !== "1") return;
    setComposerTo("");
    setComposerBody("");
    setComposerOpen(true);
    params.delete("compose");
    const next = params.toString();
    navigate(
      { pathname: location.pathname, search: next ? `?${next}` : "", hash: location.hash },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const activeMessages = useMemo(() => {
    if (!activeThread) return [];
    return messages
      .filter((m) => m.threadId === activeThread)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  }, [messages, activeThread]);

  const activeContact = useMemo(() => {
    if (!activeThread) return undefined;
    const t = threads.find((x) => x.threadId === activeThread);
    return t?.contact;
  }, [threads, activeThread]);

  // Auto-scroll thread to bottom on new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeMessages.length, activeThread]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !activeThread || !activeContact) return;
    messagesStore.create({
      threadId: activeThread,
      fromUserId: ME_ID,
      toUserId: activeContact.id,
      preview: text.slice(0, 80),
      body: text,
      read: true,
      starred: false,
    });
    setDraft("");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const contactOptions = useMemo(() => users.filter((u) => u.id !== ME_ID), [users]);

  const openComposer = () => {
    setComposerTo("");
    setComposerBody("");
    setComposerOpen(true);
  };

  const submitComposer = () => {
    const body = composerBody.trim();
    if (!composerTo || !body) return;
    // Reuse an existing thread with that contact when possible, otherwise create one.
    const existing = threads.find((t) => t.contact?.id === composerTo);
    const threadId = existing?.threadId ?? `th_n_${Date.now().toString(36)}`;
    const created = messagesStore.create({
      threadId,
      fromUserId: ME_ID,
      toUserId: composerTo,
      preview: body.slice(0, 80),
      body,
      read: true,
      starred: false,
    });
    setActiveThread(created.threadId);
    setComposerOpen(false);
    setComposerBody("");
    setComposerTo("");
    toast.success("Message sent");
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Apps"
        title="Chat"
        description="Direct messages with teammates and clients."
        breadcrumbs={trail.length ? trail : [{ label: "Apps" }, { label: "Chat" }]}
      />

      <div className="grid h-[calc(100vh-280px)] min-h-[560px] grid-cols-1 overflow-hidden surface-card md:grid-cols-[300px_1fr]">
        {/* Contacts column */}
        <aside className={cn(
          "flex min-h-0 flex-col border-border bg-card-muted/40 md:border-r",
          activeThread && "hidden md:flex",
        )}>
          <div className="space-y-2 border-b border-border p-3">
            <Button
              size="sm"
              className="h-9 w-full gap-1.5"
              onClick={openComposer}
            >
              <PenSquare className="h-3.5 w-3.5" /> New message
            </Button>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="h-9 pl-8 text-sm"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No conversations.</p>
            ) : (
              <ul className="divide-y divide-border">
                {filteredThreads.map((t) => {
                  const isActive = activeThread === t.threadId;
                  return (
                    <li key={t.threadId}>
                      <button
                        onClick={() => setActiveThread(t.threadId)}
                        className={cn(
                          "flex w-full items-start gap-3 px-3 py-3 text-left transition-fast",
                          isActive ? "bg-primary-soft/60" : "hover:bg-muted/60",
                        )}
                      >
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">
                            {t.contact ? getInitials(t.contact.name) : "·"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className={cn("truncate text-sm font-medium", isActive ? "text-foreground" : "text-foreground")}>
                              {t.contact?.name ?? "Unknown"}
                            </p>
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {formatRelative(t.last.createdAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {t.last.fromUserId === ME_ID && <span className="opacity-70">You: </span>}
                            {t.last.preview}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {t.starred && <Star className="h-3 w-3 fill-gold text-gold" />}
                          {t.unread > 0 && (
                            <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                              {t.unread}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Thread column */}
        <section className={cn("flex min-h-0 flex-col", !activeThread && "hidden md:flex")}>
          {activeContact ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost" size="sm"
                    className="md:hidden"
                    onClick={() => setActiveThread(null)}
                  >
                    Back
                  </Button>
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarFallback className="bg-primary-soft text-sm font-semibold text-primary">
                      {getInitials(activeContact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-foreground">{activeContact.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {activeContact.title ?? activeContact.email}
                    </p>
                  </div>
                </div>
                <span className="hidden items-center gap-1.5 text-[11px] font-medium text-success sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> Online
                </span>
              </div>

              <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-card-muted/30 px-4 py-5 sm:px-6">
                {activeMessages.map((m) => {
                  const isMe = m.fromUserId === ME_ID;
                  return (
                    <div id={`message-${m.id}`} key={m.id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                      {!isMe && (
                        <Avatar className="h-7 w-7 border border-border">
                          <AvatarFallback className="bg-info-soft text-[10px] font-semibold text-info">
                            {activeContact ? getInitials(activeContact.name) : "·"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="max-w-[75%]">
                        <div className={cn(
                          "rounded-xl px-3.5 py-2 text-sm leading-relaxed shadow-soft",
                          isMe
                            ? "rounded-br-sm bg-primary text-primary-foreground"
                            : "rounded-bl-sm border border-border bg-card text-foreground",
                        )}>
                          {m.body}
                        </div>
                        <p className={cn(
                          "mt-1 px-1 text-[10px] text-muted-foreground",
                          isMe ? "text-right" : "text-left",
                        )}>
                          {formatRelative(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border bg-card px-3 py-3 sm:px-4">
                <div className="flex items-end gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground" aria-label="Attach">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKey}
                    rows={1}
                    placeholder="Write a message…"
                    className="min-h-[40px] max-h-32 flex-1 resize-none"
                  />
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground" aria-label="Emoji">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button onClick={sendMessage} disabled={!draft.trim()} className="h-9 gap-1.5 px-3">
                    <Send className="h-3.5 w-3.5" /> Send
                  </Button>
                </div>
                <p className="mt-1.5 px-1 text-[10px] text-muted-foreground">
                  Press Enter to send · Shift+Enter for newline · messages stored locally only.
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-10 text-center text-sm text-muted-foreground">
              Select a conversation to start chatting.
            </div>
          )}
        </section>
      </div>

      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New message</DialogTitle>
            <DialogDescription>
              Compose a message — it's saved to your local inbox instantly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="composer-to">To</Label>
              <Select value={composerTo} onValueChange={setComposerTo}>
                <SelectTrigger id="composer-to">
                  <SelectValue placeholder="Select a recipient" />
                </SelectTrigger>
                <SelectContent>
                  {contactOptions.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} {u.title ? `· ${u.title}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="composer-body">Message</Label>
              <Textarea
                id="composer-body"
                value={composerBody}
                onChange={(e) => setComposerBody(e.target.value)}
                rows={5}
                placeholder="Write your message…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setComposerOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitComposer}
              disabled={!composerTo || !composerBody.trim()}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Send message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}