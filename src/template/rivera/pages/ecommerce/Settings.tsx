import { useEffect, useState } from "react";
import { Save, Settings2, Store, Truck } from "lucide-react";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/storage";

const KEY = "ecom:store-settings";

interface StoreSettings {
  name: string;
  email: string;
  address: string;
  currency: "USD" | "EUR" | "GBP";
  taxRate: number;
  taxIncluded: boolean;
  shippingFlatRate: number;
  freeShippingOver: number;
  shippingProvider: "ups" | "fedex" | "dhl" | "usps";
}

const DEFAULT: StoreSettings = {
  name: "Rivera Storefront",
  email: "store@rivera.io",
  address: "123 Coastal Way, Cupertino, CA 95014",
  currency: "USD",
  taxRate: 8,
  taxIncluded: false,
  shippingFlatRate: 9,
  freeShippingOver: 75,
  shippingProvider: "ups",
};

export default function StoreSettings() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const [s, setS] = useState<StoreSettings>(DEFAULT);

  useEffect(() => {
    setS(storage.get<StoreSettings>(KEY, DEFAULT));
  }, []);

  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    storage.set(KEY, s);
    toast({ title: "Settings saved", description: "Stored locally." });
  };

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="eCommerce"
        title="Store Settings"
        description="Manage your store information, currency, tax, and shipping defaults."
        breadcrumbs={trail.length ? trail : [{ label: "eCommerce" }, { label: "Settings" }]}
        actions={<Button onClick={handleSave} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save changes</Button>}
      />

      <div className="grid grid-cols-1 gap-6">
        <DataCard
          title="Store information"
          description="Customer-facing details for receipts and notifications."
          action={<Store className="h-4 w-4 text-muted-foreground" />}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Store name</Label>
              <Input id="s-name" value={s.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-email">Contact email</Label>
              <Input id="s-email" type="email" value={s.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <Label htmlFor="s-addr">Address</Label>
            <Textarea id="s-addr" rows={2} value={s.address} onChange={(e) => set("address", e.target.value)} />
          </div>
        </DataCard>

        <DataCard
          title="Currency & tax"
          description="Defaults applied to new orders and invoices."
          action={<Settings2 className="h-4 w-4 text-muted-foreground" />}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={s.currency} onValueChange={(v) => set("currency", v as StoreSettings["currency"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                  <SelectItem value="GBP">GBP — British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-tax">Tax rate (%)</Label>
              <Input id="s-tax" type="number" min={0} step="0.1" value={s.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))} />
            </div>
            <div className="flex flex-col justify-end">
              <div className="flex items-center justify-between rounded-lg border border-border bg-card-muted px-3 py-2">
                <Label htmlFor="s-tax-inc" className="cursor-pointer text-sm">Prices include tax</Label>
                <Switch id="s-tax-inc" checked={s.taxIncluded} onCheckedChange={(v) => set("taxIncluded", v)} />
              </div>
            </div>
          </div>
        </DataCard>

        <DataCard
          title="Shipping"
          description="Default shipping behavior for the storefront."
          action={<Truck className="h-4 w-4 text-muted-foreground" />}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-flat">Flat rate</Label>
              <Input id="s-flat" type="number" min={0} step="0.01" value={s.shippingFlatRate} onChange={(e) => set("shippingFlatRate", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-free">Free shipping over</Label>
              <Input id="s-free" type="number" min={0} step="0.01" value={s.freeShippingOver} onChange={(e) => set("freeShippingOver", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Default carrier</Label>
              <Select value={s.shippingProvider} onValueChange={(v) => set("shippingProvider", v as StoreSettings["shippingProvider"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="fedex">FedEx</SelectItem>
                  <SelectItem value="dhl">DHL</SelectItem>
                  <SelectItem value="usps">USPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DataCard>
      </div>
    </PageContainer>
  );
}
