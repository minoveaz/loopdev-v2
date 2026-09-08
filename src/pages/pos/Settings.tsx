import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { getPosSettings, setPosSettings, type PosSettings } from "@/features/pos/shared";

export default function PosSettingsPage() {
  const { trail } = useBreadcrumbs();
  const [settings, setSettings] = useState<PosSettings>(() => getPosSettings());

  const update = <K extends keyof PosSettings>(key: K, value: PosSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const save = () => {
    setPosSettings(settings);
    toast.success("POS settings saved");
  };

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="POS System"
        title="POS Settings"
        description="Configure store information, taxes, and register defaults."
        breadcrumbs={trail.length ? trail : [{ label: "POS System" }, { label: "Settings" }]}
        actions={<Button onClick={save} className="gap-2"><Save className="h-4 w-4" /> Save changes</Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DataCard title="Store information">
          <div className="space-y-4">
            <div><Label>Store name</Label><Input value={settings.storeName} onChange={(e) => update("storeName", e.target.value)} /></div>
            <div><Label>Store address</Label><Textarea value={settings.storeAddress} onChange={(e) => update("storeAddress", e.target.value)} rows={2} /></div>
            <div><Label>Receipt footer</Label><Textarea value={settings.receiptFooter} onChange={(e) => update("receiptFooter", e.target.value)} rows={2} /></div>
          </div>
        </DataCard>

        <DataCard title="Register & taxes">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Currency</Label>
                <Select value={settings.currency} onValueChange={(v) => update("currency", v as PosSettings["currency"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tax rate (%)</Label>
                <Input type="number" min={0} max={100} value={settings.taxRate} onChange={(e) => update("taxRate", Number(e.target.value) || 0)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Register ID</Label><Input value={settings.registerId} onChange={(e) => update("registerId", e.target.value)} /></div>
              <div><Label>Cashier name</Label><Input value={settings.cashier} onChange={(e) => update("cashier", e.target.value)} /></div>
            </div>
          </div>
        </DataCard>
      </div>
    </PageContainer>
  );
}