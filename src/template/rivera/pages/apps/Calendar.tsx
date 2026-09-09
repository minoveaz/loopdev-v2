import { useMemo, useState } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Plus,
} from "lucide-react";
import { ConfirmDialog, DataCard, FilterDropdown, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { calendarStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { CalendarEvent, EventCategory } from "@/types";
import { EventDialog } from "@/template/rivera/features/calendar/EventDialog";
import { categoryBar, categoryDot, categoryLabel, categoryTone } from "@/template/rivera/features/calendar/shared";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfWeekMon(d: Date) {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7; // 0 = Mon
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dateKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function CalendarPage() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const events = useLocalStore(calendarStore);

  const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()));
  const [filter, setFilter] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<string | undefined>();
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting] = useState<CalendarEvent | null>(null);

  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeekMon(monthStart);
  const days = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [gridStart]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const filtered = filter.length ? events.filter((e) => filter.includes(e.category)) : events;
    for (const e of filtered) {
      const d = new Date(e.start);
      const k = dateKey(d);
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => +new Date(a.start) - +new Date(b.start));
    }
    return map;
  }, [events, filter]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((e) => +new Date(e.start) >= now - 86_400_000)
      .filter((e) => !filter.length || filter.includes(e.category))
      .sort((a, b) => +new Date(a.start) - +new Date(b.start))
      .slice(0, 6);
  }, [events, filter]);

  const monthTitle = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = new Date();

  const handleCreate = (payload: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => {
    calendarStore.create(payload);
    setCreateOpen(false);
    setCreateDate(undefined);
    toast({ title: "Event created", description: payload.title });
  };
  const handleUpdate = (payload: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => {
    if (!editing) return;
    calendarStore.update(editing.id, payload);
    setEditing(null);
    toast({ title: "Event updated", description: payload.title });
  };
  const handleDelete = () => {
    if (!deleting) return;
    calendarStore.remove(deleting.id);
    toast({ title: "Event deleted", description: deleting.title });
    setDeleting(null);
    setEditing(null);
  };

  const goPrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  const goToday = () => setCursor(startOfMonth(new Date()));

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Apps"
        title="Calendar"
        description="Plan meetings, releases, and deadlines across the team."
        breadcrumbs={trail.length ? trail : [{ label: "Apps" }, { label: "Calendar" }]}
        actions={
          <Button onClick={() => { setCreateDate(undefined); setCreateOpen(true); }} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New event
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar grid */}
        <DataCard flush className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
              <div className="inline-flex items-center rounded-lg border border-border bg-card">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrev} aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goNext} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="ml-1 font-display text-lg font-semibold tracking-tight text-foreground">{monthTitle}</h2>
            </div>
            <FilterDropdown
              label="Category" multiple value={filter} onChange={setFilter} size="sm" align="end"
              options={(Object.keys(categoryLabel) as EventCategory[]).map((c) => ({
                label: categoryLabel[c], value: c,
              }))}
            />
          </div>

          <div className="grid grid-cols-7 border-b border-border bg-card-muted text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {WEEKDAYS.map((w) => (
              <div key={w} className="px-2 py-2 text-center">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((day, i) => {
              const inMonth = day.getMonth() === cursor.getMonth();
              const isToday = isSameDay(day, today);
              const list = eventsByDay.get(dateKey(day)) ?? [];
              const visible = list.slice(0, 3);
              const overflow = list.length - visible.length;
              return (
                <button
                  key={i}
                  onClick={() => { setCreateDate(dateKey(day)); setCreateOpen(true); }}
                  className={cn(
                    "group relative flex min-h-[96px] flex-col items-stretch border-b border-r border-border p-2 text-left transition-fast hover:bg-muted/40",
                    !inMonth && "bg-card-muted/40 text-muted-foreground",
                    (i + 1) % 7 === 0 && "border-r-0",
                    i >= 35 && "border-b-0",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
                        isToday ? "bg-primary text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {day.getDate()}
                    </span>
                    <Plus className="h-3 w-3 opacity-0 transition-fast group-hover:opacity-60" />
                  </div>
                  <div className="mt-1 flex flex-col gap-1">
                    {visible.map((e) => (
                      <span
                        key={e.id}
                        onClick={(ev) => { ev.stopPropagation(); setEditing(e); }}
                        className={cn(
                          "truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight cursor-pointer hover:opacity-90",
                          categoryBar[e.category],
                        )}
                      >
                        {!e.allDay && (
                          <span className="mr-1 font-mono opacity-80">
                            {new Date(e.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </span>
                        )}
                        {e.title}
                      </span>
                    ))}
                    {overflow > 0 && (
                      <span className="px-1 text-[10px] font-medium text-muted-foreground">+{overflow} more</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </DataCard>

        {/* Sidebar: legend + upcoming */}
        <div className="flex flex-col gap-6">
          <DataCard>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Categories</h3>
            <ul className="space-y-2 text-sm">
              {(Object.keys(categoryLabel) as EventCategory[]).map((c) => (
                <li key={c} className="flex items-center justify-between text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", categoryDot[c])} />
                    <span className="text-foreground">{categoryLabel[c]}</span>
                  </span>
                  <span className="font-mono text-xs tabular-nums">
                    {events.filter((e) => e.category === c).length}
                  </span>
                </li>
              ))}
            </ul>
          </DataCard>

          <DataCard>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Upcoming</h3>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No upcoming events.</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={() => setEditing(e)}
                      className="group block w-full rounded-lg border border-border bg-card p-3 text-left transition-fast hover:border-border-strong hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
                        <StatusBadge tone={categoryTone[e.category]} dot>{categoryLabel[e.category]}</StatusBadge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {e.allDay
                            ? `${formatDate(e.start)} · All day`
                            : `${formatDate(e.start)} · ${new Date(e.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
                        </span>
                        {e.location && (
                          <span className="inline-flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3" /> {e.location}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </DataCard>
        </div>
      </div>

      <EventDialog
        open={createOpen}
        onOpenChange={(o) => { setCreateOpen(o); if (!o) setCreateDate(undefined); }}
        defaultDate={createDate}
        onSubmit={handleCreate}
      />
      <EventDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        event={editing}
        onSubmit={handleUpdate}
        onDelete={(e) => setDeleting(e)}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        tone="destructive"
        title={deleting ? `Delete ${deleting.title}?` : "Delete event?"}
        description="This permanently removes the event from the calendar mock data."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}