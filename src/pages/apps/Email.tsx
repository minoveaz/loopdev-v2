import { useMemo, useState } from "react";
import {
  Archive, Inbox, Mail, PenSquare, Search, Send, Star, Trash2,
  FileText, Reply, Forward, Tag, ArrowLeft,
} from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { emailsStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import { formatRelative, getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Email, EmailFolder } from "@/types";

const FOLDERS: { key: EmailFolder; label: string; icon: typeof Inbox }[] = [
  { key: "inbox",   label: "Inbox",   icon: Inbox },
  { key: "starred", label: "Starred", icon: Star },
  { key: "sent",    label: "Sent",    icon: Send },
  { key: "drafts",  label: "Drafts",  icon: FileText },
  { key: "archive", label: "Archive", icon: Archive },
  { key: "trash",   label: "Trash",   icon: Trash2 },
];

export default function EmailPage() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const emails = useLocalStore(emailsStore);

  const [folder, setFolder] = useState<EmailFolder>("inbox");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState({ to: "", subject: "", body: "" });

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of emails) {
      m[e.folder] = (m[e.folder] ?? 0) + (e.read ? 0 : 1);
      if (e.starred) m.starred = (m.starred ?? 0) + (e.read ? 0 : 1);
    }
    return m;
  }, [emails]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return emails
      .filter((e) => folder === "starred" ? e.starred : e.folder === folder)
      .filter((e) => !q || e.subject.toLowerCase().includes(q) || e.from.name.toLowerCase().includes(q) || e.preview.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [emails, folder, search]);

  const selected = selectedId ? emails.find((e) => e.id === selectedId) : null;

  const open = (id: string) => {
    setSelectedId(id);
    const em = emails.find((e) => e.id === id);
    if (em && !em.read) emailsStore.update(id, { read: true });
  };

  const toggleStar = (id: string) => {
    const em = emails.find((e) => e.id === id);
    if (em) emailsStore.update(id, { starred: !em.starred });
  };

  const moveTo = (id: string, f: EmailFolder) => {
    emailsStore.update(id, { folder: f });
    if (selectedId === id) setSelectedId(null);
    toast({ title: `Moved to ${f}` });
  };

  const send = () => {
    if (!draft.to.trim() || !draft.subject.trim()) {
      toast({ title: "Missing recipient or subject", variant: "destructive" });
      return;
    }
    emailsStore.create({
      from: { name: "You", email: "you@rivera.app" },
      to: draft.to,
      subject: draft.subject,
      preview: draft.body.slice(0, 80),
      body: draft.body,
      folder: "sent",
      read: true,
      starred: false,
      labels: [],
    });
    setComposeOpen(false);
    setDraft({ to: "", subject: "", body: "" });
    toast({ title: "Email sent", description: "Mock send — saved to Sent." });
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Applications"
        title="Email"
        description="A clean inbox with mock send."
        breadcrumbs={trail}
        actions={
          <Button onClick={() => setComposeOpen(true)} className="gap-1.5">
            <PenSquare className="h-3.5 w-3.5" /> Compose
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_320px_1fr]">
        {/* Folders */}
        <DataCard flush>
          <ul className="p-2">
            {FOLDERS.map((f) => {
              const active = folder === f.key;
              const unread = counts[f.key] ?? 0;
              return (
                <li key={f.key}>
                  <button
                    onClick={() => { setFolder(f.key); setSelectedId(null); }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                      active ? "bg-primary-soft text-primary font-medium" : "hover:bg-muted",
                    )}
                  >
                    <f.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{f.label}</span>
                    {unread > 0 && <span className="rounded-full bg-foreground/10 px-1.5 text-[10px] font-semibold">{unread}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </DataCard>

        {/* List */}
        <DataCard flush bodyClassName="flex flex-col">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="h-9 pl-8" />
            </div>
          </div>
          <div className="max-h-[70vh] flex-1 overflow-y-auto">
            {list.length === 0 ? (
              <EmptyState icon={Mail} title="No emails" />
            ) : (
              <ul className="divide-y divide-border">
                {list.map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={() => open(e.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-3 text-left transition hover:bg-muted/60",
                        selectedId === e.id && "bg-muted",
                        !e.read && "bg-primary-soft/30",
                      )}
                    >
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarFallback className="text-[10px]">{getInitials(e.from.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn("truncate text-sm", !e.read ? "font-semibold" : "")}>{e.from.name}</p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">{formatRelative(e.createdAt)}</span>
                        </div>
                        <p className={cn("truncate text-sm", !e.read ? "font-medium" : "text-muted-foreground")}>{e.subject}</p>
                        <p className="truncate text-xs text-muted-foreground">{e.preview}</p>
                      </div>
                      {e.starred && <Star className="h-3.5 w-3.5 fill-gold text-gold" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DataCard>

        {/* Detail */}
        <DataCard flush bodyClassName="flex flex-col">
          {!selected ? (
            <EmptyState icon={Mail} title="Select an email" description="Pick a message from the list to read." size="lg" />
          ) : (
            <div className="flex h-full min-h-[60vh] flex-col">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8 lg:hidden" onClick={() => setSelectedId(null)}><ArrowLeft className="h-4 w-4" /></Button>
                  <h2 className="font-display text-xl font-semibold">{selected.subject}</h2>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleStar(selected.id)}>
                    <Star className={cn("h-4 w-4", selected.starred && "fill-gold text-gold")} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => moveTo(selected.id, "archive")}><Archive className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => moveTo(selected.id, "trash")}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-3 border-b border-border p-4">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarFallback className="text-xs">{getInitials(selected.from.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{selected.from.name} <span className="text-xs text-muted-foreground">&lt;{selected.from.email}&gt;</span></p>
                  <p className="text-xs text-muted-foreground">to {selected.to} · {formatRelative(selected.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selected.labels.map((l) => <StatusBadge key={l} tone="info" variant="outline"><Tag className="h-3 w-3" />{l}</StatusBadge>)}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {selected.body}
              </div>
              <div className="flex gap-2 border-t border-border p-4">
                <Button variant="outline" className="gap-1.5" onClick={() => { setDraft({ to: selected.from.email, subject: `Re: ${selected.subject}`, body: "" }); setComposeOpen(true); }}><Reply className="h-3.5 w-3.5" /> Reply</Button>
                <Button variant="outline" className="gap-1.5" onClick={() => { setDraft({ to: "", subject: `Fwd: ${selected.subject}`, body: selected.body }); setComposeOpen(true); }}><Forward className="h-3.5 w-3.5" /> Forward</Button>
              </div>
            </div>
          )}
        </DataCard>
      </div>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>New message</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>To</Label>
              <Input value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} placeholder="someone@example.com" />
            </div>
            <div className="grid gap-1.5">
              <Label>Subject</Label>
              <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Message</Label>
              <Textarea rows={8} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={send} className="gap-1.5"><Send className="h-3.5 w-3.5" /> Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}