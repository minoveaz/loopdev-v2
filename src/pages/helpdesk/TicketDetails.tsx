import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquare, Paperclip, Pencil, Send, Trash2 } from "lucide-react";
import { ConfirmDialog, DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { ticketsStore } from "@/data";
import { getInitials, formatRelative, titleCase } from "@/lib/formatters";
import { useState } from "react";
import { toast } from "sonner";

export default function HelpdeskTicketDetails() {
  const { trail } = useBreadcrumbs();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tickets = useLocalStore(ticketsStore);
  const ticket = id ? tickets.find((t) => t.id === id) : tickets[0];
  const [reply, setReply] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!ticket) {
    return (
      <PageContainer width="narrow">
        <PageHeader eyebrow="Helpdesk" title="Ticket not found" description="This ticket may have been deleted." />
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/helpdesk/tickets"><ArrowLeft className="h-4 w-4" /> Back to tickets</Link>
        </Button>
      </PageContainer>
    );
  }

  const messages = [
    { id: "m1", author: ticket.requester, body: ticket.description, when: ticket.createdAt, internal: false },
    { id: "m2", author: "Support team", body: "Thanks for reaching out — we're investigating now.", when: ticket.lastReplyAt, internal: false },
    { id: "m3", author: "Aria B.", body: "Reproduced on staging, escalating to engineering.", when: ticket.updatedAt, internal: true },
  ];

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Helpdesk"
        title={ticket.subject}
        description={`${ticket.reference} · ${ticket.category}`}
        breadcrumbs={trail.length ? trail : [{ label: "Helpdesk" }, { label: "Tickets" }, { label: ticket.reference }]}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/helpdesk/tickets"><ArrowLeft className="h-4 w-4" /> Back</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link to={`/helpdesk/tickets/edit/${ticket.id}`}><Pencil className="h-4 w-4" /> Edit</Link>
            </Button>
            <Button size="sm" variant="outline" className="gap-2 text-destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DataCard title="Conversation" description={`${messages.length} messages`}>
            <ol className="space-y-4">
              {messages.map((m) => (
                <li key={m.id} className="flex gap-3">
                  <Avatar className="h-9 w-9 shrink-0 border border-border">
                    <AvatarFallback className="bg-primary-soft text-[11px] text-primary">
                      {getInitials(m.author)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{m.author}</span>
                      {m.internal && <StatusBadge tone="warning">Internal note</StatusBadge>}
                      <span className="font-mono text-[11px] text-muted-foreground">{formatRelative(m.when)}</span>
                    </div>
                    <p className="mt-1 rounded-lg border border-border bg-card p-3 text-sm text-foreground">{m.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 space-y-3">
              <Textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" />
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="gap-2"><Paperclip className="h-4 w-4" /> Attach</Button>
                <Button size="sm" className="gap-2" disabled={!reply.trim()} onClick={() => { toast.success("Reply sent"); setReply(""); }}>
                  <Send className="h-4 w-4" /> Send reply
                </Button>
              </div>
            </div>
          </DataCard>
        </div>

        <DataCard title="Details" description="Ticket properties">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><dt className="text-muted-foreground">Status</dt><dd><StatusBadge tone="info" dot>{titleCase(ticket.status)}</StatusBadge></dd></div>
            <div className="flex items-center justify-between"><dt className="text-muted-foreground">Priority</dt><dd><StatusBadge tone="warning">{titleCase(ticket.priority)}</StatusBadge></dd></div>
            <div className="flex items-center justify-between"><dt className="text-muted-foreground">Category</dt><dd>{ticket.category}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-muted-foreground">Requester</dt><dd>{ticket.requester}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-muted-foreground">Email</dt><dd className="font-mono text-xs">{ticket.requesterEmail}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-muted-foreground">Opened</dt><dd>{formatRelative(ticket.createdAt)}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-muted-foreground">Last reply</dt><dd>{formatRelative(ticket.lastReplyAt)}</dd></div>
          </dl>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <MessageSquare className="h-4 w-4" /> Replies are mocked locally and won't leave the browser.
          </div>
        </DataCard>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${ticket.reference}?`}
        description="This permanently removes the ticket from local storage."
        confirmLabel="Delete ticket"
        tone="destructive"
        onConfirm={() => {
          ticketsStore.remove(ticket.id);
          toast.success(`Ticket ${ticket.reference} deleted`);
          navigate("/helpdesk/tickets");
        }}
      />
    </PageContainer>
  );
}