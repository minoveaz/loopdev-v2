import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo } from "react";
import { GraduationCap, Users, BookOpen, DollarSign } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { DataCard, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { coursesStore, instructorsStore, learnersStore } from "@/data";
import {
  buildEnrollmentSeries, buildCompletionSeries,
  courseStatusLabel, courseStatusTone, summarizeCourses, summarizeLearners, tooltipStyle,
} from "@/features/academy/shared";
import { formatNumber } from "@/lib/formatters";

export default function AcademyDashboard() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const courses = useLocalStore(coursesStore);
  const learners = useLocalStore(learnersStore);
  const instructors = useLocalStore(instructorsStore);

  const c = summarizeCourses(courses);
  const l = summarizeLearners(learners);
  const series = useMemo(buildEnrollmentSeries, []);
  const completion = useMemo(() => buildCompletionSeries(courses), [courses]);
  const top = [...courses].sort((a, b) => b.enrolled - a.enrolled).slice(0, 5);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Academy"
        title="Learning overview"
        description="Enrollments, revenue, and learner progress across the academy."
        breadcrumbs={trail.length ? trail : [{ label: "Academy" }, { label: "Dashboard" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total enrollments" value={formatNumber(c.enrolled)} delta={6.4} icon={GraduationCap} accent="primary" />
        <StatCard label="Active learners" value={formatNumber(l.total)} delta={3.1} icon={Users} accent="info" />
        <StatCard label="Published courses" value={formatNumber(c.published)} delta={2.2} icon={BookOpen} accent="accent" />
        <StatCard label="Course revenue" value={`$${c.revenue.toLocaleString()}`} delta={8.7} icon={DollarSign} accent="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="Enrollments & revenue" description="Last 12 months">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ left: -10, right: 6, top: 4 }}>
                <defs>
                  <linearGradient id="ac-en" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ac-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type={curve} dataKey="enrollments" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#ac-en)" />
                <Area type={curve} dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#ac-rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Top courses" description="By enrollments">
          <ul className="space-y-3">
            {top.map((course) => (
              <li key={course.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{course.title}</p>
                  <p className="text-xs text-muted-foreground">{course.category} · {course.lessons} lessons</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">{formatNumber(course.enrolled)}</p>
                  <StatusBadge tone={courseStatusTone[course.status]}>{courseStatusLabel[course.status]}</StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        </DataCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-2" title="Completion rate" description="By category">
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

        <DataCard title="At a glance" description="Academy snapshot">
          <dl className="grid grid-cols-2 gap-4">
            <Snap label="Instructors" value={instructors.length} />
            <Snap label="Avg rating" value={c.avgRating} />
            <Snap label="Avg progress" value={`${l.avgProgress}%`} />
            <Snap label="Completion" value={`${l.completionRate}%`} />
          </dl>
        </DataCard>
      </div>
    </PageContainer>
  );
}

function Snap({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card-muted/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold">{value}</p>
    </div>
  );
}