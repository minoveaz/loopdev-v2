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

const KEY = "realestate:settings";

type Settings = {
  agencyName: string;
  contactEmail: string;
  defaultCurrency: "USD" | "EUR" | "GBP" | "AED";
  defaultArea: "sqm" | "sqft";
  commissionPct: number;
  publishToPortals: boolean;
  emailDigest: boolean;
  newDealAlerts: boolean;
  bio: string;
};

const defaults: Settings = {
  agencyName: "Rivera Estates",
  contactEmail: "hello@rivera.estate",
  defaultCurrency: "USD",
  defaultArea: "sqm",
  commissionPct: 3,
  publishToPortals: true,
  emailDigest: true,
  newDealAlerts: true,
  bio: "Premium boutique brokerage with global reach.",
};

function load(): Settings {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return defaults; }
}

export default function RealEstateSettings() {
  const { trail } = useBreadcrumbs();
  const [s, setS] = useState<Settings>(load);

  const save = () => { localStorage.setItem(KEY, JSON.stringify(s)); toast.success("Settings saved"); };
  const reset = () => { setS(defaults); localStorage.removeItem(KEY); toast.success("Reset to defaults"); };

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Real Estate"
        title="Settings"
        description="Configure agency defaults and notifications."
        breadcrumbs={trail.length ? trail : [{ label: "Real Estate" }, { label: "Settings" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>Reset</Button>
            <Button onClick={save}>Save changes</Button>
          </div>
        }
      />

      <DataCard title="Agency" description="Branding and contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Agency name</Label><Input value={s.agencyName} onChange={(e) => setS({ ...s, agencyName: e.target.value })} /></div>
          <div><Label>Contact email</Label><Input type="email" value={s.contactEmail} onChange={(e) => setS({ ...s, contactEmail: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Bio</Label><Textarea value={s.bio} onChange={(e) => setS({ ...s, bio: e.target.value })} /></div>
        </div>
      </DataCard>

      <DataCard title="Defaults" description="Currency, units, commission">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Currency</Label>
            <Select value={s.defaultCurrency} onValueChange={(v) => setS({ ...s, defaultCurrency: v as Settings["defaultCurrency"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem><SelectItem value="AED">AED</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Area unit</Label>
            <Select value={s.defaultArea} onValueChange={(v) => setS({ ...s, defaultArea: v as Settings["defaultArea"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="sqm">Square meters</SelectItem><SelectItem value="sqft">Square feet</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Commission %</Label><Input type="number" step="0.1" value={s.commissionPct} onChange={(e) => setS({ ...s, commissionPct: Number(e.target.value) || 0 })} /></div>
        </div>
      </DataCard>

      <DataCard title="Notifications" description="Stay in the loop">
        <div className="space-y-4">
          <Toggle label="Publish to portals" hint="Auto-publish new listings to partner portals." checked={s.publishToPortals} onChange={(v) => setS({ ...s, publishToPortals: v })} />
          <Separator />
          <Toggle label="Daily email digest" hint="Pipeline summary every morning." checked={s.emailDigest} onChange={(v) => setS({ ...s, emailDigest: v })} />
          <Separator />
          <Toggle label="New deal alerts" hint="Notify the team when a new deal opens." checked={s.newDealAlerts} onChange={(v) => setS({ ...s, newDealAlerts: v })} />
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