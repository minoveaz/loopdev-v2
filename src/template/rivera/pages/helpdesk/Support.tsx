import { Link } from "react-router-dom";
import { BookOpen, LifeBuoy, MessageSquare, Sparkles, Mail, ArrowRight } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useState } from "react";
import { toast } from "sonner";
import { HelpdeskNav } from "@/components/helpdesk/HelpdeskNav";

const TOPICS = [
  { icon: LifeBuoy, title: "Getting started", desc: "Set up your workspace and invite teammates.", to: "/helpdesk/documentation" },
  { icon: BookOpen, title: "Guides & docs", desc: "Deep dives into every Rivera module.", to: "/helpdesk/documentation" },
  { icon: MessageSquare, title: "Open a ticket", desc: "Talk to a human about your issue.", to: "/helpdesk/tickets/create" },
  { icon: Sparkles, title: "What's new", desc: "Latest features and changelog.", to: "/helpdesk/changelog" },
];

const FAQS = [
  { q: "How is my data stored?", a: "Rivera is a frontend-only demo — all data lives in your browser's localStorage." },
  { q: "Can I invite my team?", a: "Yes, via the User Management module. Roles & permissions are mocked but realistic." },
  { q: "Is there an API?", a: "No backend in this demo. Connect Lovable Cloud to add one in minutes." },
  { q: "How do I report a bug?", a: "Use the contact form below or open a ticket from the helpdesk." },
];

export default function HelpdeskSupport() {
  const { trail } = useBreadcrumbs();
  const [msg, setMsg] = useState("");
  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Helpdesk"
        title="How can we help?"
        description="Browse guides, search the knowledge base, or reach our support team directly."
        breadcrumbs={trail.length ? trail : [{ label: "Helpdesk" }, { label: "Support" }]}
      />
      <HelpdeskNav />

      <DataCard className="bg-gradient-primary text-primary-foreground">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Status</p>
            <p className="font-display text-xl font-semibold">All systems operational</p>
            <p className="text-sm opacity-90">Average reply time today: 2h 14m.</p>
          </div>
          <StatusBadge tone="success" variant="solid" dot>Online</StatusBadge>
        </div>
      </DataCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TOPICS.map(({ icon: Icon, title, desc, to }) => (
          <Link key={title} to={to} className="group">
            <DataCard className="h-full transition-fast group-hover:border-primary/40">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
              <div className="mt-3 inline-flex items-center text-xs font-semibold text-primary">Read more <ArrowRight className="ml-1 h-3 w-3" /></div>
            </DataCard>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DataCard title="Frequently asked" description="Quick answers to common questions">
          <ul className="divide-y divide-border">
            {FAQS.map((f) => (
              <li key={f.q} className="py-3">
                <p className="font-medium text-sm">{f.q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
              </li>
            ))}
          </ul>
        </DataCard>
        <DataCard title="Contact us" description="We typically reply within a few hours">
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="email">Your email</Label><Input id="email" type="email" placeholder="you@company.com" /></div>
            <div className="space-y-1.5"><Label htmlFor="msg">Message</Label><Textarea id="msg" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="How can we help?" /></div>
            <Button className="gap-2 w-full sm:w-auto" onClick={() => { toast.success("Message sent"); setMsg(""); }}><Mail className="h-4 w-4" /> Send message</Button>
          </div>
        </DataCard>
      </div>
    </PageContainer>
  );
}