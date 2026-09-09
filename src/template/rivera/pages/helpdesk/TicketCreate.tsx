import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { ticketsStore } from "@/template/rivera/data";

const CATEGORIES = ["Billing", "Account", "Bug", "Feature", "How-to"];
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export default function HelpdeskTicketCreate() {
  const { trail } = useBreadcrumbs();
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [requester, setRequester] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [category, setCategory] = useState("Account");
  const [priority, setPriority] = useState<typeof PRIORITIES[number]>("normal");

  function submit() {
    if (!subject.trim() || !requester.trim() || !requesterEmail.trim()) {
      toast.error("Subject, requester, and email are required.");
      return;
    }
    const reference = `TKT-${Math.floor(7100 + Math.random() * 900)}`;
    const created = ticketsStore.create({
      reference, subject, description, requester, requesterEmail,
      status: "open", priority, category,
      lastReplyAt: new Date().toISOString(),
    });
    toast.success(`Ticket ${reference} created`);
    navigate(`/helpdesk/tickets/details/${created.id}`);
  }

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Helpdesk"
        title="Create ticket"
        description="Open a new support ticket on behalf of a customer."
        breadcrumbs={trail.length ? trail : [{ label: "Helpdesk" }, { label: "Tickets" }, { label: "Create" }]}
        actions={
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/helpdesk/tickets"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
        }
      />
      <DataCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary of the issue" />
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
            <Select value={priority} onValueChange={(v) => setPriority(v as typeof PRIORITIES[number])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Steps to reproduce, expected vs actual, screenshots…" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/helpdesk/tickets")}>Cancel</Button>
          <Button onClick={submit} className="gap-2"><Send className="h-4 w-4" /> Create ticket</Button>
        </div>
      </DataCard>
    </PageContainer>
  );
}