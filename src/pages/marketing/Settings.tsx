import { useState } from "react";
import { toast } from "sonner";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

const KEY = "marketing:settings";

type Settings = {
  brandName: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  defaultCurrency: "USD" | "EUR" | "GBP";
  timezone: string;
  attributionWindowDays: number;
  doubleOptIn: boolean;
  trackOpens: boolean;
  trackClicks: boolean;
  utmAuto: boolean;
  unsubFooter: string;
};

const defaults: Settings = {
  brandName: "Rivera Marketing",
  fromEmail: "hello@rivera.app",
  fromName: "Rivera Team",
  replyTo: "support@rivera.app",
  defaultCurrency: "USD",
  timezone: "UTC",
  attributionWindowDays: 30,
  doubleOptIn: true,
  trackOpens: true,
  trackClicks: true,
  utmAuto: true,
  unsubFooter: "You're receiving this email because you subscribed to Rivera updates.",
};

function load(): Settings {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return defaults; }
}

export default function MarketingSettings() {
  const { trail } = useBreadcrumbs();
  const [s, setS] = useState<Settings>(load);
  const save = () => { localStorage.setItem(KEY, JSON.stringify(s)); toast.success("Settings saved"); };
  const reset = () => { setS(defaults); localStorage.removeItem(KEY); toast.success("Reset to defaults"); };

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Marketing"
        title="Settings"
        description="Sender identity, tracking, and compliance defaults."
        breadcrumbs={trail.length ? trail : [{ label: "Marketing" }, { label: "Settings" }]}
        actions={<div className="flex gap-2"><Button variant="outline" onClick={reset}>Reset</Button><Button onClick={save}>Save changes</Button></div>}
      />

      <DataCard title="Sender" description="How emails appear in inboxes">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Brand name</Label><Input value={s.brandName} onChange={(e) => setS({ ...s, brandName: e.target.value })} /></div>
          <div><Label>From name</Label><Input value={s.fromName} onChange={(e) => setS({ ...s, fromName: e.target.value })} /></div>
          <div><Label>From email</Label><Input type="email" value={s.fromEmail} onChange={(e) => setS({ ...s, fromEmail: e.target.value })} /></div>
          <div><Label>Reply-to</Label><Input type="email" value={s.replyTo} onChange={(e) => setS({ ...s, replyTo: e.target.value })} /></div>
        </div>
      </DataCard>

      <DataCard title="Defaults" description="Currency, timezone, attribution">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Currency</Label>
            <Select value={s.defaultCurrency} onValueChange={(v) => setS({ ...s, defaultCurrency: v as Settings["defaultCurrency"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Timezone</Label><Input value={s.timezone} onChange={(e) => setS({ ...s, timezone: e.target.value })} /></div>
          <div><Label>Attribution (days)</Label><Input type="number" value={s.attributionWindowDays} onChange={(e) => setS({ ...s, attributionWindowDays: Number(e.target.value) || 0 })} /></div>
        </div>
      </DataCard>

      <DataCard title="Tracking & compliance" description="Privacy and analytics">
        <div className="space-y-4">
          <Toggle label="Track opens" hint="Insert a tracking pixel in emails." checked={s.trackOpens} onChange={(v) => setS({ ...s, trackOpens: v })} />
          <Separator />
          <Toggle label="Track clicks" hint="Wrap links to measure clicks." checked={s.trackClicks} onChange={(v) => setS({ ...s, trackClicks: v })} />
          <Separator />
          <Toggle label="Auto-add UTM params" hint="Append UTM tags to outbound links." checked={s.utmAuto} onChange={(v) => setS({ ...s, utmAuto: v })} />
          <Separator />
          <Toggle label="Double opt-in" hint="Require subscribers to confirm via email." checked={s.doubleOptIn} onChange={(v) => setS({ ...s, doubleOptIn: v })} />
          <Separator />
          <div><Label>Unsubscribe footer</Label><Textarea value={s.unsubFooter} onChange={(e) => setS({ ...s, unsubFooter: e.target.value })} /></div>
        </div>
      </DataCard>
    </PageContainer>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{hint}</p></div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}