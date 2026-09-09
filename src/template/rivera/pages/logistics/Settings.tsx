import { useState } from "react";
import { toast } from "sonner";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

const KEY = "logistics:settings";

type Settings = {
  companyName: string;
  defaultCarrier: string;
  weightUnit: "kg" | "lb";
  distanceUnit: "km" | "mi";
  currency: "USD" | "EUR" | "GBP";
  autoAssignVehicle: boolean;
  emailNotifications: boolean;
  smsAlerts: boolean;
  lowStockThreshold: number;
};

const defaults: Settings = {
  companyName: "Rivera Logistics",
  defaultCarrier: "Rivera Express",
  weightUnit: "kg",
  distanceUnit: "km",
  currency: "USD",
  autoAssignVehicle: true,
  emailNotifications: true,
  smsAlerts: false,
  lowStockThreshold: 75,
};

function load(): Settings {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return defaults; }
}

export default function LogisticsSettings() {
  const { trail } = useBreadcrumbs();
  const [s, setS] = useState<Settings>(load);

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(s));
    toast.success("Settings saved");
  };
  const reset = () => { setS(defaults); localStorage.removeItem(KEY); toast.success("Reset to defaults"); };

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Logistics"
        title="Settings"
        description="Configure defaults for your logistics workspace."
        breadcrumbs={trail.length ? trail : [{ label: "Logistics" }, { label: "Settings" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>Reset</Button>
            <Button onClick={save}>Save changes</Button>
          </div>
        }
      />

      <DataCard title="Company" description="Branding and defaults">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Company name</Label><Input value={s.companyName} onChange={(e) => setS({ ...s, companyName: e.target.value })} /></div>
          <div><Label>Default carrier</Label><Input value={s.defaultCarrier} onChange={(e) => setS({ ...s, defaultCarrier: e.target.value })} /></div>
        </div>
      </DataCard>

      <DataCard title="Units & currency" description="Display preferences">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Weight unit</Label>
            <Select value={s.weightUnit} onValueChange={(v) => setS({ ...s, weightUnit: v as Settings["weightUnit"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="kg">Kilograms (kg)</SelectItem><SelectItem value="lb">Pounds (lb)</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Distance unit</Label>
            <Select value={s.distanceUnit} onValueChange={(v) => setS({ ...s, distanceUnit: v as Settings["distanceUnit"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="km">Kilometers</SelectItem><SelectItem value="mi">Miles</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={s.currency} onValueChange={(v) => setS({ ...s, currency: v as Settings["currency"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      </DataCard>

      <DataCard title="Operations" description="Automation and limits">
        <div className="space-y-4">
          <ToggleRow
            label="Auto-assign vehicle"
            hint="Pick the next available vehicle when shipments are created."
            checked={s.autoAssignVehicle}
            onChange={(v) => setS({ ...s, autoAssignVehicle: v })}
          />
          <Separator />
          <div className="grid gap-2 sm:max-w-xs">
            <Label>Warehouse capacity warning at (%)</Label>
            <Input type="number" min={0} max={100} value={s.lowStockThreshold} onChange={(e) => setS({ ...s, lowStockThreshold: Number(e.target.value) || 0 })} />
          </div>
        </div>
      </DataCard>

      <DataCard title="Notifications" description="Alerts for your team">
        <div className="space-y-4">
          <ToggleRow label="Email notifications" hint="Send daily shipment summaries." checked={s.emailNotifications} onChange={(v) => setS({ ...s, emailNotifications: v })} />
          <Separator />
          <ToggleRow label="SMS alerts" hint="Notify drivers about urgent route changes." checked={s.smsAlerts} onChange={(v) => setS({ ...s, smsAlerts: v })} />
        </div>
      </DataCard>
    </PageContainer>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}