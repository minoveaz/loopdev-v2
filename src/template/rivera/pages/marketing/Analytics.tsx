import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, FunnelChart, Funnel, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, MousePointerClick, Target, DollarSign } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatCard } from "@/components/common";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { campaignsStore } from "@/template/rivera/data";
import { buildEmailSeries, buildFunnel, channelPerformance, summarize, tooltipStyle } from "@/template/rivera/features/marketing/shared";
import { formatNumber } from "@/lib/formatters";

const FUNNEL_COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--accent))", "hsl(var(--gold))", "hsl(var(--success))"];

export default function MarketingAnalytics() {
  const { trail } = useBreadcrumbs();
  const campaigns = useLocalStore(campaignsStore);
  const s = summarize(campaigns);
  const series = useMemo(buildEmailSeries, []);
  const funnel = useMemo(() => buildFunnel(campaigns).map((f, i) => ({ ...f, fill: FUNNEL_COLORS[i] })), [campaigns]);
  const channels = useMemo(() => channelPerformance(campaigns), [campaigns]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Marketing"
        title="Analytics"
        description="Funnel, channel performance, and ROI."
        breadcrumbs={trail.length ? trail : [{ label: "Marketing" }, { label: "Analytics" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Impressions" value={formatNumber(s.impressions)} delta={4.2} icon={TrendingUp} accent="primary" />
        <StatCard label="CTR" value={`${s.ctr}%`} delta={0.6} icon={MousePointerClick} accent="info" />
        <StatCard label="CVR" value={`${s.cvr}%`} delta={1.1} icon={Target} accent="accent" />
        <StatCard label="Revenue" value={`$${s.revenue.toLocaleString()}`} delta={5.7} icon={DollarSign} accent="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="Email throughput" description="Sent / opens / clicks">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ left: -10, right: 6, top: 4 }}>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="sent" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="opens" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="clicks" fill="hsl(var(--gold))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Conversion funnel" description="Top → bottom">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Funnel dataKey="value" data={funnel} isAnimationActive>
                  <LabelList position="right" dataKey="stage" fill="hsl(var(--foreground))" stroke="none" fontSize={11} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </DataCard>
      </div>

      <DataCard title="Channel performance" description="Aggregate per channel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Channel</TableHead>
              <TableHead className="text-right">Campaigns</TableHead>
              <TableHead className="text-right">Spent</TableHead>
              <TableHead className="text-right">Conversions</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.map((c) => (
              <TableRow key={c.channel}>
                <TableCell className="capitalize font-medium">{c.channel}</TableCell>
                <TableCell className="text-right font-mono">{c.campaigns}</TableCell>
                <TableCell className="text-right font-mono">${c.spent.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono">{c.conversions.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono">{c.ctr}%</TableCell>
                <TableCell className="text-right font-mono">{c.roas}x</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataCard>
    </PageContainer>
  );
}