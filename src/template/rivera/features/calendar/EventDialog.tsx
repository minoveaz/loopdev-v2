import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { CalendarEvent, EventCategory } from "@/types";
import { categoryLabel } from "./shared";

export interface EventDraft {
  title: string;
  description: string;
  category: EventCategory;
  allDay: boolean;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  location: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const DEFAULT: EventDraft = {
  title: "", description: "", category: "meeting", allDay: false,
  date: today(), startTime: "09:00", endTime: "10:00", location: "",
};

function toLocalParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function combine(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  event?: CalendarEvent | null;
  /** Pre-fill date when creating from a day cell. */
  defaultDate?: string;
  onSubmit: (payload: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => void;
  onDelete?: (event: CalendarEvent) => void;
}

export function EventDialog({ open, onOpenChange, event, defaultDate, onSubmit, onDelete }: Props) {
  const isEdit = !!event;
  const [draft, setDraft] = useState<EventDraft>(DEFAULT);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (event) {
      const s = toLocalParts(event.start);
      const e = toLocalParts(event.end);
      setDraft({
        title: event.title,
        description: event.description ?? "",
        category: event.category,
        allDay: event.allDay,
        date: s.date,
        startTime: s.time,
        endTime: e.time,
        location: event.location ?? "",
      });
    } else {
      setDraft({ ...DEFAULT, date: defaultDate ?? today() });
    }
  }, [open, event, defaultDate]);

  const set = <K extends keyof EventDraft>(k: K, v: EventDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return setError("Title is required.");
    if (!draft.allDay && draft.startTime >= draft.endTime) return setError("End time must be after start time.");
    const start = draft.allDay ? combine(draft.date, "00:00") : combine(draft.date, draft.startTime);
    const end = draft.allDay ? combine(draft.date, "23:59") : combine(draft.date, draft.endTime);
    onSubmit({
      title: draft.title.trim(),
      description: draft.description.trim() || undefined,
      start,
      end,
      allDay: draft.allDay,
      category: draft.category,
      location: draft.location.trim() || undefined,
      attendeeIds: event?.attendeeIds ?? [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{isEdit ? "Edit event" : "New event"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the schedule and details." : "Schedule a meeting, deadline, or release."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ev-title">Title</Label>
            <Input id="ev-title" value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Brand review" autoFocus />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={draft.category} onValueChange={(v) => set("category", v as EventCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(categoryLabel) as EventCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>{categoryLabel[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end justify-between gap-3 rounded-lg border border-border bg-card-muted px-3 py-2">
              <div>
                <Label htmlFor="ev-allday" className="block">All day</Label>
                <p className="text-[11px] text-muted-foreground">Spans the whole day</p>
              </div>
              <Switch id="ev-allday" checked={draft.allDay} onCheckedChange={(v) => set("allDay", v)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="ev-date">Date</Label>
              <Input id="ev-date" type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-start">Start</Label>
              <Input id="ev-start" type="time" value={draft.startTime} onChange={(e) => set("startTime", e.target.value)} disabled={draft.allDay} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-end">End</Label>
              <Input id="ev-end" type="time" value={draft.endTime} onChange={(e) => set("endTime", e.target.value)} disabled={draft.allDay} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-loc">Location</Label>
            <Input id="ev-loc" value={draft.location} onChange={(e) => set("location", e.target.value)} placeholder="Zoom · Rivera Room" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-desc">Notes</Label>
            <Textarea id="ev-desc" rows={2} value={draft.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional context…" />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {isEdit && onDelete ? (
              <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => event && onDelete(event)}>
                Delete event
              </Button>
            ) : <span />}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{isEdit ? "Save changes" : "Create event"}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}