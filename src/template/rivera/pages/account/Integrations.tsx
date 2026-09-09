import { useState } from "react";
import { toast } from "sonner";
import { Slack, Github, Mail, CreditCard, MessageCircle, Cloud, Database, Calendar } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { storage } from "@/lib/storage";

type Key = "slack" | "github" | "gmail" | "stripe" | "intercom" | "drive" | "postgres" | "gcal";
const KEY = "account:integrations";

const META: Array<{ id: Key; name: string; icon: React.ComponentType<{ className?: string }>; desc: string }> = [
  { id: "slack", name: "Slack", icon: Slack, desc: "Send alerts to channels and DMs." },
  { id: "github", name: "GitHub", icon: Github, desc: "Sync issues and pull requests." },
  { id: "gmail", name: "Gmail", icon: Mail, desc: "Email customers from inside Rivera." },
  { id: "stripe", name: "Stripe", icon: CreditCard, desc: "Process payments and subscriptions." },
  { id: "intercom", name: "Intercom", icon: MessageCircle, desc: "Live chat with your customers." },
  { id: "drive", name: "Google Drive", icon: Cloud, desc: "Attach files and assets." },
  { id: "postgres", name: "Postgres", icon: Database, desc: "Mirror data into your warehouse." },
  { id: "gcal", name: "Google Calendar", icon: Calendar, desc: "Sync meetings and reminders." },
];

export default function AccountIntegrationsPage() {
  const { trail } = useBreadcrumbs();
  const [connected, setConnected] = useState<Record<Key, boolean>>(() => storage.get<Record<Key, boolean>>(KEY, { slack: true, github: true, gmail: false, stripe: true, intercom: false, drive: false, postgres: false, gcal: false }));
  const [search, setSearch] = useState("");

  function toggle(id: Key) {
    const next = { ...connected, [id]: !connected[id] };
    setConnected(next);
    storage.set(KEY, next);
    toast.success(`${META.find((m) => m.id === id)?.name} ${next[id] ? "connected" : "disconnected"}`);
  }

  const filtered = META.filter((m) => m.name.toLowerCase().includes(search.trim().toLowerCase()));
  const count = Object.values(connected).filter(Boolean).length;

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Account Settings"
        title="Integrations"
        description="Connect Rivera to the tools your team already uses."
        breadcrumbs={trail.length ? trail : [{ label: "Account Settings" }, { label: "Integrations" }]}
        meta={<StatusBadge tone="primary">{count} connected</StatusBadge>}
      />
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search integrations…" className="max-w-sm" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(({ id, name, icon: Icon, desc }) => (
          <DataCard key={id}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{name}</p>
                  {connected[id] && <StatusBadge tone="success" dot>Connected</StatusBadge>}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
            <Button onClick={() => toggle(id)} variant={connected[id] ? "outline" : "default"} size="sm" className="mt-4 w-full">
              {connected[id] ? "Disconnect" : "Connect"}
            </Button>
          </DataCard>
        ))}
      </div>
    </PageContainer>
  );
}