import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo } from "react";
import { Activity, Gavel, ImageIcon, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DataCard, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { nftStore, nftBidsStore, nftCollectionsStore, type NftCollection } from "@/data";
import { buildVolumeSeries, formatCrypto, nftStatusTone } from "@/features/nft/shared";
import { formatNumber } from "@/lib/formatters";
import type { NftAsset } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function NftDashboard() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const assets = useLocalStore(nftStore) as readonly NftAsset[];
  const bids = useLocalStore(nftBidsStore);
  const collections = useLocalStore(nftCollectionsStore) as readonly NftCollection[];

  const series = useMemo(buildVolumeSeries, []);
  const totalVolume = collections.reduce((s, c) => s + c.volume, 0);
  const activeAuctions = assets.filter((a) => a.status === "auction").length;
  const trending = [...collections].sort((a, b) => b.volume - a.volume).slice(0, 5);
  const recentAssets = [...assets].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 6);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="NFT Market"
        title="Marketplace pulse"
        description="Volume, auctions, and trending creators across Rivera Art."
        breadcrumbs={trail.length ? trail : [{ label: "NFT Market" }, { label: "Dashboard" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total volume" value={`${formatNumber(totalVolume, { decimals: 1 })} ETH`} delta={6.4} icon={Wallet} accent="primary" />
        <StatCard label="Listed assets" value={formatNumber(assets.length)} delta={2.1} icon={ImageIcon} accent="info" />
        <StatCard label="Live auctions" value={formatNumber(activeAuctions)} delta={4.8} icon={Gavel} accent="gold" />
        <StatCard label="Active bids" value={formatNumber(bids.filter((b) => b.status === "active").length)} delta={-1.2} icon={Activity} accent="accent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="Marketplace volume" description="Last 14 days · ETH equivalent">
          <ChartFrame>
            <LineChart data={series} margin={{ left: -10, right: 6, top: 4 }}>
              <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type={curve} dataKey="volume" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ChartFrame>
        </DataCard>

        <DataCard title="Sales activity" description="Daily completed sales">
          <ChartFrame>
            <BarChart data={series} margin={{ left: -10, right: 6, top: 4 }}>
              <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sales" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </DataCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="Trending collections" description="Sorted by 14-day volume" eyebrow="Hot">
          <ul className="divide-y divide-border">
            {trending.map((c, i) => (
              <li key={c.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <span className="w-6 font-mono text-xs text-muted-foreground">#{i + 1}</span>
                <div className="h-11 w-11 overflow-hidden rounded-xl border border-border">
                  <img src={c.coverUrl} alt={c.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">by {c.creator} · {c.items} items</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">{formatCrypto(c.volume, "ETH")}</p>
                  <p className={`text-xs font-medium ${c.change24h >= 0 ? "text-success" : "text-destructive"}`}>
                    {c.change24h >= 0 ? "+" : ""}{c.change24h}%
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </DataCard>

        <DataCard title="Recent drops" description="Newly minted or relisted">
          <ul className="space-y-3">
            {recentAssets.map((a) => (
              <li key={a.id} className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-xl"><AvatarImage src={a.imageUrl} /><AvatarFallback className="rounded-xl">NF</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.collection}</p>
                </div>
                <StatusBadge tone={nftStatusTone[a.status]}>{a.status}</StatusBadge>
              </li>
            ))}
          </ul>
        </DataCard>
      </div>
    </PageContainer>
  );
}

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
  padding: "8px 12px",
  boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)",
} as const;

function ChartFrame({ children }: { children: React.ReactElement }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}