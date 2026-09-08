import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo } from "react";
import { Eye, MessageSquare, FileText, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DataCard, PageContainer, PageHeader, StatCard } from "@/components/common";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { blogPostsStore } from "@/data";
import { buildCategoryBreakdown, buildViewsSeries, summarizeBlog, tooltipStyle } from "@/features/blogs/shared";
import { formatNumber } from "@/lib/formatters";

export default function BlogAnalytics() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const posts = useLocalStore(blogPostsStore);
  const s = summarizeBlog(posts);
  const series = useMemo(buildViewsSeries, []);
  const cats = useMemo(() => buildCategoryBreakdown(posts), [posts]);
  const top = [...posts].sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Blogs"
        title="Blog analytics"
        description="Traffic, engagement, and category performance."
        breadcrumbs={trail.length ? trail : [{ label: "Blogs" }, { label: "Analytics" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total posts" value={formatNumber(s.total)} delta={2.4} icon={FileText} accent="primary" />
        <StatCard label="Total views" value={formatNumber(s.totalViews)} delta={5.7} icon={Eye} accent="info" />
        <StatCard label="Avg views" value={formatNumber(s.avgViews)} delta={1.8} icon={TrendingUp} accent="accent" />
        <StatCard label="Comments" value={formatNumber(s.totalComments)} delta={3.1} icon={MessageSquare} accent="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="Traffic" description="Last 7 days">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ left: -10, right: 6, top: 4 }}>
                <defs>
                  <linearGradient id="bg-views" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type={curve} dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#bg-views)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Top posts" description="By views">
          <ul className="space-y-3">
            {top.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </div>
                <span className="font-mono text-sm font-semibold">{p.views.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </DataCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="By category" description="Posts and views">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cats} margin={{ left: -10, right: 6, top: 4 }}>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Breakdown" description="Per category">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Posts</TableHead>
                <TableHead className="text-right">Views</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cats.map((c) => (
                <TableRow key={c.category}>
                  <TableCell className="font-medium">{c.category}</TableCell>
                  <TableCell className="text-right font-mono">{c.posts}</TableCell>
                  <TableCell className="text-right font-mono">{c.views.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataCard>
      </div>
    </PageContainer>
  );
}