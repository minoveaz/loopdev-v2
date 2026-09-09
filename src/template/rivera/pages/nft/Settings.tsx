import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { getNftSettings, setNftSettings, DEFAULT_NFT_SETTINGS, type NftSettings } from "@/template/rivera/features/nft/shared";
import type { NftAsset } from "@/types";

export default function NftSettings() {
  const { trail } = useBreadcrumbs();
  const [s, setS] = useState<NftSettings>(() => getNftSettings());
  const save = () => { setNftSettings(s); toast.success("Settings saved"); };
  const reset = () => { setS(DEFAULT_NFT_SETTINGS); setNftSettings(DEFAULT_NFT_SETTINGS); toast("Defaults restored"); };

  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="NFT Market" title="Marketplace settings"
        description="Configure marketplace fees, defaults, and feature flags."
        breadcrumbs={trail.length ? trail : [{ label: "NFT Market" }, { label: "Settings" }]}
        actions={<><Button variant="outline" onClick={reset}>Reset</Button><Button onClick={save}><Save className="h-4 w-4" />Save</Button></>} />

      <DataCard title="General">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Marketplace name</Label><Input value={s.marketplaceName} onChange={(e) => setS({ ...s, marketplaceName: e.target.value })} /></div>
          <div>
            <Label>Default currency</Label>
            <Select value={s.defaultCurrency} onValueChange={(v) => setS({ ...s, defaultCurrency: v as NftAsset["currency"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ETH">ETH</SelectItem><SelectItem value="SOL">SOL</SelectItem><SelectItem value="USDC">USDC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DataCard>

      <DataCard title="Fees">
        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label>Marketplace fee (%)</Label><Input type="number" step="0.1" value={s.marketplaceFee} onChange={(e) => setS({ ...s, marketplaceFee: Number(e.target.value) || 0 })} /></div>
          <div><Label>Royalty fee (%)</Label><Input type="number" step="0.1" value={s.royaltyFee} onChange={(e) => setS({ ...s, royaltyFee: Number(e.target.value) || 0 })} /></div>
          <div><Label>Min bid increment (%)</Label><Input type="number" step="0.5" value={s.minBidIncrement} onChange={(e) => setS({ ...s, minBidIncrement: Number(e.target.value) || 0 })} /></div>
        </div>
      </DataCard>

      <DataCard title="Features">
        <div className="space-y-4">
          <Toggle label="Auto-approve listings" hint="New listings appear without manual review." checked={s.autoApproveListings} onChange={(v) => setS({ ...s, autoApproveListings: v })} />
          <Toggle label="Enable auctions" hint="Allow timed auctions with bidding." checked={s.enableAuctions} onChange={(v) => setS({ ...s, enableAuctions: v })} />
          <Toggle label="Enable public mint" hint="Anyone can mint a new asset to the marketplace." checked={s.enablePublicMint} onChange={(v) => setS({ ...s, enablePublicMint: v })} />
        </div>
      </DataCard>
    </PageContainer>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
      <div><p className="font-medium">{label}</p><p className="text-xs text-muted-foreground">{hint}</p></div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}