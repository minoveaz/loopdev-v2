import type { TimeEntry } from "@/types";
import { ago, dateOnly } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

const seed: Omit<TimeEntry, "id" | "createdAt" | "updatedAt">[] = [
  { projectId: "p_01", taskId: "t_01", userId: "u_03", date: dateOnly(ago(0)),  hours: 3.5, billable: true,  note: "Wordmark refinement" },
  { projectId: "p_01", taskId: "t_02", userId: "u_07", date: dateOnly(ago(0)),  hours: 2.0, billable: true,  note: "Brand guideline writing" },
  { projectId: "p_02", taskId: "t_03", userId: "u_09", date: dateOnly(ago(1)),  hours: 6.0, billable: true,  note: "Tracking API endpoints" },
  { projectId: "p_02", taskId: "t_04", userId: "u_04", date: dateOnly(ago(1)),  hours: 4.5, billable: true,  note: "Dashboard skeleton" },
  { projectId: "p_05", taskId: "t_07", userId: "u_07", date: dateOnly(ago(2)),  hours: 5.0, billable: true,  note: "Editorial layout templates" },
  { projectId: "p_04", taskId: "t_06", userId: "u_03", date: dateOnly(ago(2)),  hours: 1.5, billable: false, note: "Internal review" },
  { projectId: "p_02", taskId: "t_03", userId: "u_09", date: dateOnly(ago(3)),  hours: 5.5, billable: true,  note: "API auth + retries" },
  { projectId: "p_01", taskId: "t_10", userId: "u_02", date: dateOnly(ago(3)),  hours: 2.0, billable: true,  note: "Print proof QA" },
  { projectId: "p_05", taskId: "t_08", userId: "u_07", date: dateOnly(ago(4)),  hours: 3.0, billable: true,  note: "Tag taxonomy draft" },
  { projectId: "p_06", taskId: "t_09", userId: "u_07", date: dateOnly(ago(4)),  hours: 2.5, billable: false, note: "Discovery prep" },
  { projectId: "p_02", taskId: "t_04", userId: "u_04", date: dateOnly(ago(5)),  hours: 6.5, billable: true,  note: "Layout + components" },
  { projectId: "p_01", taskId: "t_01", userId: "u_03", date: dateOnly(ago(6)),  hours: 4.0, billable: true,  note: "Variant exploration" },
];

const now = new Date().toISOString();
export const mockTimeEntries: TimeEntry[] = seed.map((s, i) => ({
  ...s,
  id: `te_${String(i + 1).padStart(2, "0")}`,
  createdAt: now,
  updatedAt: now,
}));

export const timeEntriesStore = createLocalStore<TimeEntry>({
  key: "data:time-entries",
  seed: mockTimeEntries,
  idPrefix: "te",
});