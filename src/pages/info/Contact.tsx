import { useState } from "react";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

export default function ContactPage() {
  const { trail } = useBreadcrumbs();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Pages"
        title="Contact us"
        description="We'd love to hear from you. Reach our team via any of these channels."
        breadcrumbs={trail.length ? trail : [{ label: "Pages" }, { label: "Contact" }]}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          {[
            { icon: Mail, title: "Email", value: "hello@rivera.app" },
            { icon: Phone, title: "Phone", value: "+1 (415) 555-0142" },
            { icon: MapPin, title: "Office", value: "San Francisco · Lisbon" },
          ].map(({ icon: Icon, title, value }) => (
            <DataCard key={title}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon className="h-5 w-5" /></div>
                <div><p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p><p className="font-medium">{value}</p></div>
              </div>
            </DataCard>
          ))}
        </div>
        <DataCard title="Send us a message" description="We typically reply within 24h" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="message">Message</Label><Textarea id="message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
          </div>
          <Button className="mt-4 gap-2" onClick={() => { toast.success("Message sent"); setForm({ name: "", email: "", message: "" }); }}><Send className="h-4 w-4" /> Send message</Button>
        </DataCard>
      </div>
    </PageContainer>
  );
}