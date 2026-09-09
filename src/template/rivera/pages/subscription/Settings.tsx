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

const KEY = "subscription:settings";

type Settings = {
  productName: string;
  defaultCurrency: "USD" | "EUR" | "GBP";
  defaultInterval: "monthly" | "yearly";
  trialDays: number;
  gracePeriodDays: number;
  prorate: boolean;
  allowCancellation: boolean;
  dunningEnabled: boolean;
  invoiceFooter: string;
};

const defaults: Settings = {
  productName: "Rivera",
  defaultCurrency: "USD",
  defaultInterval: "monthly",
  trialDays: 14,
  gracePeriodDays: 7,
  prorate: true,
  allowCancellation: true,
  dunningEnabled: true,
  invoiceFooter: "Thank you for your subscription. Questions? billing@rivera.app",
};

function load(): Settings {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return defaults; }
}

export default function SubscriptionSettings() {
  const { trail } = useBreadcrumbs();
  const [s, setS] = useState<Settings>(load);
  const save = () => { localStorage.setItem(KEY, JSON.stringify(s)); toast.success("Settings saved"); };
  const reset = () => { setS(defaults); localStorage.removeItem(KEY); toast.success("Reset to defaults"); };

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Subscription"
        title="Subscription settings"
        description="Billing defaults, trials, and dunning policies."
        breadcrumbs={trail.length ? trail : [{ label: "Subscription" }, { label: "Settings" }]}
        actions={<div className="flex gap-2"><Button variant="outline" onClick={reset}>Reset</Button><Button onClick={save}>Save changes</Button></div>}
      />

      <DataCard title="Product" description="What customers see on invoices">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Product name</Label><Input value={s.productName} onChange={(e) => setS({ ...s, productName: e.target.value })} /></div>
          <div>
            <Label>Default currency</Label>
            <Select value={s.defaultCurrency} onValueChange={(v) => setS({ ...s, defaultCurrency: v as Settings["defaultCurrency"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Default interval</Label>
            <Select value={s.defaultInterval} onValueChange={(v) => setS({ ...s, defaultInterval: v as Settings["defaultInterval"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      </DataCard>

      <DataCard title="Trials & grace" description="Onboarding and recovery">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Trial length (days)</Label><Input type="number" value={s.trialDays} onChange={(e) => setS({ ...s, trialDays: Number(e.target.value) || 0 })} /></div>
          <div><Label>Grace period (days)</Label><Input type="number" value={s.gracePeriodDays} onChange={(e) => setS({ ...s, gracePeriodDays: Number(e.target.value) || 0 })} /></div>
        </div>
      </DataCard>

      <DataCard title="Billing behaviour" description="Policies for upgrades and cancellation">
        <div className="space-y-4">
          <Toggle label="Prorate plan changes" hint="Charge or credit the difference on plan changes." checked={s.prorate} onChange={(v) => setS({ ...s, prorate: v })} />
          <Separator />
          <Toggle label="Allow self-cancellation" hint="Let customers cancel from the billing portal." checked={s.allowCancellation} onChange={(v) => setS({ ...s, allowCancellation: v })} />
          <Separator />
          <Toggle label="Automatic dunning" hint="Retry failed payments and notify customers." checked={s.dunningEnabled} onChange={(v) => setS({ ...s, dunningEnabled: v })} />
          <Separator />
          <div><Label>Invoice footer</Label><Textarea value={s.invoiceFooter} onChange={(e) => setS({ ...s, invoiceFooter: e.target.value })} /></div>
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