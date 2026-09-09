import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataCard, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { ticketsStore } from "@/template/rivera/data";
import type { TicketPriority, TicketStatus } from "@/types";

const CATEGORIES = ["Billing", "Account", "Bug", "Feature", "How-to"];
const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgent"];
const STATUSES: TicketStatus[] = ["open", "pending", "resolved", "closed"];

export default function HelpdeskTicketEdit() {
  const { trail } = useBreadcrumbs();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const tickets = useLocalStore(ticketsStore);
  const ticket = id ? tickets.find((t) => t.id === id) : tickets[0];

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [requester, setRequester] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [category, setCategory] = useState("Account");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [status, setStatus] = useState<TicketStatus>("open");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!ticket) return;
    setSubject(ticket.subject);
    setDescription(ticket.description);
    setRequester(ticket.requester);
    setRequesterEmail(ticket.requesterEmail);
    setCategory(ticket.category);
    setPriority(ticket.priority);
    setStatus(ticket.status);
  }, [ticket?.id]);

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

  function save() {
    if (!subject.trim() || !requester.trim() || !requesterEmail.trim()) {
      toast.error("Subject, requester, and email are required.");
      return;
    }
    ticketsStore.update(ticket!.id, {
      subject, description, requester, requesterEmail,
      category, priority, status,
    });
    toast.success(`Ticket ${ticket!.reference} updated`);
    navigate(`/helpdesk/tickets/details/${ticket!.id}`);
  }

  function remove() {
    ticketsStore.remove(ticket!.id);
    toast.success(`Ticket ${ticket!.reference} deleted`);
    navigate("/helpdesk/tickets");
  }

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Helpdesk"
        title={`Edit ${ticket.reference}`}
        description="Update ticket details, status, or priority."
        breadcrumbs={trail.length ? trail : [{ label: "Helpdesk" }, { label: "Tickets" }, { label: ticket.reference }, { label: "Edit" }]}
        actions={
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to={`/helpdesk/tickets/details/${ticket.id}`}><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
        }
      />
      <DataCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="requester">Requester name</Label>
            <Input id="requester" value={requester} onChange={(e) => setRequester(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Requester email</Label>
            <Input id="email" type="email" value={requesterEmail} onChange={(e) => setRequesterEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" className="gap-2 text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" /> Delete ticket
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/helpdesk/tickets/details/${ticket.id}`)}>Cancel</Button>
            <Button onClick={save} className="gap-2"><Save className="h-4 w-4" /> Save changes</Button>
          </div>
        </div>
      </DataCard>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${ticket.reference}?`}
        description="This permanently removes the ticket from local storage. This cannot be undone."
        confirmLabel="Delete ticket"
        tone="destructive"
        onConfirm={remove}
      />
    </PageContainer>
  );
}