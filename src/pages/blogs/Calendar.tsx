import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { blogPostsStore } from "@/data";
import type { BlogPost } from "@/types";
import { blogStatusLabel, blogStatusTone } from "@/features/blogs/shared";
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths,
} from "date-fns";

export default function BlogCalendar() {
  const { trail } = useBreadcrumbs();
  const posts = useLocalStore(blogPostsStore);
  const [cursor, setCursor] = useState(() => new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, BlogPost[]>();
    for (const p of posts) {
      const date = p.publishedAt ?? p.updatedAt;
      if (!date) continue;
      const key = format(new Date(date), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [posts]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Blogs"
        title="Content calendar"
        description="Plan publishing across the month."
        breadcrumbs={trail.length ? trail : [{ label: "Blogs" }, { label: "Calendar" }]}
      />

      <DataCard
        title={format(cursor, "MMMM yyyy")}
        description={`${posts.length} posts mapped`}
        action={
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => setCursor(subMonths(cursor, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>Today</Button>
            <Button size="icon" variant="outline" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        }
      >
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-xs">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="bg-card-muted/60 px-2 py-1.5 text-center text-[10px] uppercase tracking-wider text-muted-foreground">{d}</div>
          ))}
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const events = eventsByDay.get(key) ?? [];
            const inMonth = isSameMonth(d, cursor);
            const today = isSameDay(d, new Date());
            return (
              <div key={key} className={`min-h-[100px] bg-background p-2 ${inMonth ? "" : "opacity-50"}`}>
                <div className={`mb-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] ${today ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{format(d, "d")}</div>
                <div className="space-y-1">
                  {events.slice(0, 2).map((e) => (
                    <div key={e.id} className="truncate rounded border border-border bg-card-muted/40 px-1.5 py-0.5 text-[10px]" title={e.title}>
                      {e.title}
                    </div>
                  ))}
                  {events.length > 2 && <div className="text-[10px] text-muted-foreground">+{events.length - 2} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </DataCard>

      <DataCard title="Upcoming" description="Scheduled and recent posts">
        <ul className="space-y-2">
          {posts.slice(0, 6).map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card-muted/30 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.category} · {format(new Date(p.publishedAt ?? p.updatedAt), "MMM d, yyyy")}</p>
              </div>
              <StatusBadge tone={blogStatusTone[p.status]}>{blogStatusLabel[p.status]}</StatusBadge>
            </li>
          ))}
        </ul>
      </DataCard>
    </PageContainer>
  );
}