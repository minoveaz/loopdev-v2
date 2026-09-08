import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { TrendingUp, GraduationCap, DollarSign, BookOpen } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatCard } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { coursesStore, learnersStore } from "@/data";
import {
  buildEnrollmentSeries, buildCompletionSeries, buildLevelDistribution,
  summarizeCourses, summarizeLearners, tooltipStyle,
} from "@/features/academy/shared";
import { formatNumber } from "@/lib/formatters";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--gold))"];

export default function AcademyAnalytics() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const courses = useLocalStore(coursesStore);
  const learners = useLocalStore(learnersStore);
  const c = summarizeCourses(courses);
  const l = summarizeLearners(learners);
  const series = useMemo(buildEnrollmentSeries, []);
  const completion = useMemo(() => buildCompletionSeries(courses), [courses]);
  const levels = useMemo(() => buildLevelDistribution(courses), [courses]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Academy"
        title="Analytics"
        description="Revenue, completion, and learner performance over time."
        breadcrumbs={trail.length ? trail : [{ label: "Academy" }, { label: "Analytics" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Enrollments" value={formatNumber(c.enrolled)} delta={5.4} icon={GraduationCap} accent="primary" />
        <StatCard label="Revenue" value={`$${c.revenue.toLocaleString()}`} delta={6.7} icon={DollarSign} accent="gold" />
        <StatCard label="Courses" value={formatNumber(c.total)} delta={2.1} icon={BookOpen} accent="info" />
        <StatCard label="Completion rate" value={`${l.completionRate}%`} delta={1.8} icon={TrendingUp} accent="accent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="Revenue trend" description="Last 12 months">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ left: -10, right: 6, top: 4 }}>
                <defs>
                  <linearGradient id="ac-an-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--gold))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--gold))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type={curve} dataKey="revenue" stroke="hsl(var(--gold))" strokeWidth={2.5} fill="url(#ac-an-rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Course levels" description="Distribution">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Pie data={levels} dataKey="count" nameKey="level" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {levels.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </DataCard>
      </div>

      <DataCard title="Completion by category" description="Average percentage of enrolled learners who finish">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={completion} margin={{ left: -10, right: 6, top: 4 }}>
              <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DataCard>
    </PageContainer>
  );
}