import type { Course, CourseStatus, CourseLevel, Instructor, Learner } from "@/types";
import type { StatusTone } from "@/components/common";

export const courseStatusTone: Record<CourseStatus, StatusTone> = {
  draft: "neutral",
  published: "success",
  archived: "warning",
};

export const courseStatusLabel: Record<CourseStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const levelTone: Record<CourseLevel, StatusTone> = {
  beginner: "info",
  intermediate: "primary",
  advanced: "gold",
};

export const LEVELS: CourseLevel[] = ["beginner", "intermediate", "advanced"];
export const STATUSES: CourseStatus[] = ["draft", "published", "archived"];
export const CATEGORIES = ["Design", "Engineering", "Business", "Marketing", "Data", "Soft skills"];

export function summarizeCourses(items: readonly Course[]) {
  const published = items.filter((c) => c.status === "published");
  const enrolled = items.reduce((s, c) => s + c.enrolled, 0);
  const revenue = items.reduce((s, c) => s + c.enrolled * c.price, 0);
  const avgRating = items.length
    ? +(items.reduce((s, c) => s + c.rating, 0) / items.length).toFixed(2)
    : 0;
  return {
    total: items.length,
    published: published.length,
    drafts: items.filter((c) => c.status === "draft").length,
    enrolled,
    revenue,
    avgRating,
  };
}

export function summarizeLearners(items: readonly Learner[]) {
  const completed = items.reduce((s, l) => s + l.completedCourses, 0);
  const enrolled = items.reduce((s, l) => s + l.enrolledCourses, 0);
  const avgProgress = items.length
    ? Math.round(items.reduce((s, l) => s + l.progress, 0) / items.length)
    : 0;
  const completionRate = enrolled ? Math.round((completed / enrolled) * 100) : 0;
  return { total: items.length, completed, enrolled, avgProgress, completionRate };
}

export function summarizeInstructors(items: readonly Instructor[]) {
  const students = items.reduce((s, i) => s + i.studentsCount, 0);
  const avgRating = items.length
    ? +(items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(2)
    : 0;
  return { total: items.length, students, avgRating };
}

export function buildEnrollmentSeries() {
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => ({
    month: m,
    enrollments: 320 + ((i * 137) % 540),
    revenue: 8400 + ((i * 1310) % 11200),
  }));
}

export function buildCompletionSeries(items: readonly Course[]) {
  return CATEGORIES.map((cat) => {
    const list = items.filter((c) => c.category === cat);
    const enrolled = list.reduce((s, c) => s + c.enrolled, 0);
    // mock completion ratio per category
    const rate = enrolled ? Math.round(35 + ((cat.length * 7) % 50)) : 0;
    return { category: cat, completion: rate, enrolled };
  });
}

export function buildLevelDistribution(items: readonly Course[]) {
  return LEVELS.map((lv) => ({
    level: lv,
    count: items.filter((c) => c.level === lv).length,
  }));
}

export const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
  padding: "8px 12px",
  boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)",
} as const;

export function initials(name: string) {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m ? `${m}m` : ""}`.trim() : `${m}m`;
}