import { Users, UserPlus, UserCheck, UserX } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { DataCard, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { tooltipStyle } from "@/features/marketing/shared";

const segments = [
  { name: "VIP buyers", size: 1240, growth: 4.2, channel: "email", engagement: 78 },
  { name: "New subscribers", size: 4860, growth: 12.5, channel: "email", engagement: 41 },
  { name: "Cart abandoners", size: 920, growth: -2.1, channel: "sms", engagement: 56 },
  { name: "Re-engagement", size: 2310, growth: -1.4, channel: "email", engagement: 22 },
  { name: "Mobile-first", size: 6720, growth: 8.1, channel: "social", engagement: 64 },
  { name: "Enterprise leads", size: 380, growth: 3.0, channel: "search", engagement: 71 },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--gold))", "hsl(var(--info))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

export default function MarketingAudience() {
  const { trail } = useBreadcrumbs();
  const total = segments.reduce((s, x) => s + x.size, 0);
  const data = segments.map((s) => ({ name: s.name, value: s.size }));

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Marketing"
        title="Audience"
        description="Segments and engagement across your contact base."
        breadcrumbs={trail.length ? trail : [{ label: "Marketing" }, { label: "Audience" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total contacts" value={total.toLocaleString()} delta={5.4} icon={Users} accent="primary" />
        <StatCard label="New this month" value="4,860" delta={12.5} icon={UserPlus} accent="accent" />
        <StatCard label="Active" value="9,640" delta={3.1} icon={UserCheck} accent="info" />
        <StatCard label="Unsubscribed" value="240" delta={-1.2} icon={UserX} accent="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="Segments" description={`${segments.length} segments`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segment</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Growth</TableHead>
                <TableHead>Engagement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{s.channel}</TableCell>
                  <TableCell className="text-right font-mono">{s.size.toLocaleString()}</TableCell>
                  <TableCell className={`text-right font-mono ${s.growth >= 0 ? "text-success" : "text-destructive"}`}>{s.growth >= 0 ? "+" : ""}{s.growth}%</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${s.engagement}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{s.engagement}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataCard>

        <DataCard title="Distribution" description="Contacts per segment">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </DataCard>
      </div>
    </PageContainer>
  );
}