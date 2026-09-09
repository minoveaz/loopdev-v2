import type { BlogPost, BlogStatus } from "@/types";
import type { StatusTone } from "@/components/common";

export const blogStatusTone: Record<BlogStatus, StatusTone> = {
  draft: "neutral",
  scheduled: "info",
  published: "success",
  archived: "warning",
};

export const blogStatusLabel: Record<BlogStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

export const BLOG_CATEGORIES = ["Design", "Engineering", "Product", "Culture"];
export const BLOG_STATUSES: BlogStatus[] = ["draft", "scheduled", "published", "archived"];

export function summarizeBlog(items: readonly BlogPost[]) {
  const published = items.filter((p) => p.status === "published");
  const totalViews = items.reduce((s, p) => s + p.views, 0);
  const totalComments = items.reduce((s, p) => s + p.comments, 0);
  const avgViews = items.length ? Math.round(totalViews / items.length) : 0;
  return {
    total: items.length,
    published: published.length,
    drafts: items.filter((p) => p.status === "draft").length,
    scheduled: items.filter((p) => p.status === "scheduled").length,
    totalViews, totalComments, avgViews,
  };
}

export function buildViewsSeries() {
  return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => ({
    day: d,
    views: 1200 + ((i * 410) % 1700),
    visitors: 540 + ((i * 130) % 720),
  }));
}

export function buildCategoryBreakdown(items: readonly BlogPost[]) {
  return BLOG_CATEGORIES.map((cat) => {
    const list = items.filter((p) => p.category === cat);
    const views = list.reduce((s, p) => s + p.views, 0);
    return { category: cat, posts: list.length, views };
  });
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