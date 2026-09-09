import { Bell, Mail, Smartphone, Volume2 } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useNotificationPrefs } from "@/hooks/use-notification-prefs";
import { toast } from "sonner";
import { titleCase } from "@/lib/formatters";
import type { NotificationType } from "@/types";

const channelMeta = [
  { key: "inApp" as const, icon: Bell, label: "In-app", desc: "Show notifications in the bell menu and dashboards." },
  { key: "email" as const, icon: Mail, label: "Email", desc: "Send a copy of important alerts to your inbox." },
  { key: "push" as const, icon: Smartphone, label: "Push", desc: "Mobile and desktop push notifications." },
  { key: "sound" as const, icon: Volume2, label: "Sound", desc: "Play a chime for new notifications." },
];

const typeTone: Record<NotificationType, "info" | "success" | "warning" | "destructive"> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "destructive",
};

export default function AccountNotificationsPage() {
  const { trail } = useBreadcrumbs();
  const { prefs, setChannel, setType, reset } = useNotificationPrefs();
  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Account Settings"
        title="Notifications"
        description="Choose how and when Rivera reaches out to you."
        breadcrumbs={trail.length ? trail : [{ label: "Account Settings" }, { label: "Notifications" }]}
        actions={<Button variant="outline" size="sm" onClick={() => { reset(); toast("Notification preferences reset"); }}>Reset</Button>}
      />
      <DataCard title="Channels" description="Where you receive alerts">
        <ul className="divide-y divide-border">
          {channelMeta.map(({ key, icon: Icon, label, desc }) => (
            <li key={key} className="flex items-start gap-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={prefs.channels[key]} onCheckedChange={(v) => setChannel(key, v)} />
            </li>
          ))}
        </ul>
      </DataCard>
      <DataCard title="Notification types" description="Filter the events you care about">
        <ul className="divide-y divide-border">
          {(Object.keys(prefs.types) as NotificationType[]).map((t) => (
            <li key={t} className="flex items-center gap-3 py-3">
              <StatusBadge tone={typeTone[t]} dot>{titleCase(t)}</StatusBadge>
              <p className="flex-1 text-xs text-muted-foreground">{
                t === "info" ? "Informational updates and reminders." :
                t === "success" ? "Tasks completed, deals closed, deploys finished." :
                t === "warning" ? "Things you should look at soon." :
                "Failures and critical incidents."
              }</p>
              <Switch checked={prefs.types[t]} onCheckedChange={(v) => setType(t, v)} />
            </li>
          ))}
        </ul>
      </DataCard>
    </PageContainer>
  );
}