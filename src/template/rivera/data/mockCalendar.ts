import type { CalendarEvent } from "@/types";
import { SEED_REFERENCE_MS, ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

/** Build a same-day event from the reference, given hours range. */
function dayEvent(dayOffset: number, startHour: number, endHour: number): { start: string; end: string } {
  const startMs = SEED_REFERENCE_MS + dayOffset * 86_400_000 - new Date(SEED_REFERENCE_MS).getUTCHours() * 3_600_000;
  return {
    start: new Date(startMs + startHour * 3_600_000).toISOString(),
    end: new Date(startMs + endHour * 3_600_000).toISOString(),
  };
}

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "ev_01", title: "Atlas brand review", description: "Walk Atlas through latest brand directions.",
    ...dayEvent(0, 10, 11), allDay: false, category: "meeting",
    location: "Zoom · Rivera Room", attendeeIds: ["u_01", "u_02", "u_03"],
    createdAt: ago(7), updatedAt: ago(1),
  },
  {
    id: "ev_02", title: "Harbor v2 sprint demo", description: "Bi-weekly sprint review with Harbor.",
    ...dayEvent(1, 15, 16), allDay: false, category: "meeting",
    location: "Zoom", attendeeIds: ["u_01", "u_04", "u_09"],
    createdAt: ago(14), updatedAt: ago(2),
  },
  {
    id: "ev_03", title: "Sage editorial deadline", description: "Layout templates due to Sage Magazine.",
    ...dayEvent(5, 17, 18), allDay: true, category: "deadline",
    attendeeIds: ["u_07"],
    createdAt: ago(20), updatedAt: ago(2),
  },
  {
    id: "ev_04", title: "Rivera 1.1 release", description: "Ship the Reports module and AI insights add-on.",
    ...dayEvent(12, 9, 10), allDay: true, category: "release",
    attendeeIds: ["u_01", "u_04", "u_05", "u_09"],
    createdAt: ago(30), updatedAt: ago(3),
  },
  {
    id: "ev_05", title: "Founders' offsite", description: "Quarterly leadership offsite — Lisbon.",
    ...dayEvent(20, 9, 18), allDay: true, category: "personal",
    location: "Lisbon, PT", attendeeIds: ["u_01", "u_02", "u_10"],
    createdAt: ago(40), updatedAt: ago(10),
  },
  {
    id: "ev_06", title: "Public holiday", description: "Office closed.",
    ...dayEvent(-3, 0, 24), allDay: true, category: "holiday",
    attendeeIds: [],
    createdAt: ago(60), updatedAt: ago(60),
  },
];

export const calendarStore = createLocalStore<CalendarEvent>({
  key: "data:calendar",
  seed: mockCalendarEvents,
  idPrefix: "ev",
});
