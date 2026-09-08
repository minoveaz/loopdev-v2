import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Eye, Flame, Heart } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { nftStore, nftCollectionsStore, type NftCollection } from "@/data";
import { buildVolumeSeries, formatCrypto, nftStatusTone } from "@/features/nft/shared";
import { formatNumber } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { NftAsset } from "@/types";

export default function NftOverview() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const assets = useLocalStore(nftStore) as readonly NftAsset[];
  const collections = useLocalStore(nftCollectionsStore) as readonly NftCollection[];
  const series = useMemo(buildVolumeSeries, []);

  const totalLikes = assets.reduce((s, a) => s + a.likes, 0);
  const totalViews = assets.reduce((s, a) => s + a.views, 0);
  const featured = [...assets].sort((a, b) => b.views - a.views).slice(0, 8);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="NFT Market"
        title="Marketplace overview"
        description="Discover trending art, drops, and the most-watched assets."
        breadcrumbs={trail.length ? trail : [{ label: "NFT Market" }, { label: "Marketplace" }, { label: "Overview" }]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total likes" value={formatNumber(totalLikes)} icon={Heart} accent="accent" />
        <StatCard label="Total views" value={formatNumber(totalViews, { compact: true })} icon={Eye} accent="info" />
        <StatCard label="Featured drops" value={formatNumber(featured.length)} icon={Flame} accent="gold" />
      </div>

      <DataCard title="Marketplace activity" description="Daily volume — last 14 days">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ left: -10, right: 6, top: 4 }}>
              <defs>
                <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--popover-foreground))", boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)", fontSize: 12, padding: "8px 12px" }} />
              <Area type={curve} dataKey="volume" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#vol)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </DataCard>

      <div className="grid gap-6 lg:grid-cols-5">
        <DataCard className="lg:col-span-2" title="Featured assets">
          <div className="grid grid-cols-2 gap-3">
            {featured.slice(0, 6).map((a) => (
              <div key={a.id} className="overflow-hidden surface-card-muted-compact">
                <div className="aspect-square w-full overflow-hidden">
                  <img src={a.imageUrl} alt={a.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs font-semibold">{a.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{formatCrypto(a.price, a.currency)}</p>
                </div>
              </div>
            ))}
          </div>
        </DataCard>

        <DataCard className="lg:col-span-3" title="Top collections" flush>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collection</TableHead>
                <TableHead className="text-right">Floor</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Owners</TableHead>
                <TableHead className="text-right">24h</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={c.coverUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCrypto(c.floorPrice, "ETH")}</TableCell>
                  <TableCell className="text-right font-mono">{formatCrypto(c.volume, "ETH")}</TableCell>
                  <TableCell className="text-right font-mono">{c.owners}</TableCell>
                  <TableCell className="text-right">
                    <StatusBadge tone={c.change24h >= 0 ? "success" : "destructive"}>
                      {c.change24h >= 0 ? "+" : ""}{c.change24h}%
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataCard>
      </div>

      <DataCard title="Latest listings" flush>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.slice(0, 8).map((a) => (
              <TableRow key={a.id}>
                <TableCell className="flex items-center gap-3">
                  <img src={a.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
                  <span className="font-medium">{a.name}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{a.creator}</TableCell>
                <TableCell className="text-right font-mono">{formatCrypto(a.price, a.currency)}</TableCell>
                <TableCell><StatusBadge tone={nftStatusTone[a.status]}>{a.status}</StatusBadge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataCard>
    </PageContainer>
  );
}