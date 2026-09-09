import type { Meeting } from "@/types";
import { ago, inDays } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

const seed: Omit<Meeting, "id" | "createdAt" | "updatedAt">[] = [
  { title: "Atlas Rebrand — sign-off",    description: "Walk through milestone 2 deliverables with Atlas marketing.", hostId: "u_02", participants: ["u_03", "u_07"],                startsAt: inDays(0).slice(0,11) + "15:00:00.000Z", durationMinutes: 45, link: "https://meet.rivera.app/atlas-signoff",  status: "scheduled",   tag: "Client" },
  { title: "Engineering standup",         description: "Daily 15-min sync.",                                          hostId: "u_01", participants: ["u_04", "u_09"],                startsAt: inDays(1).slice(0,11) + "09:00:00.000Z", durationMinutes: 15, link: "https://meet.rivera.app/eng-standup",   status: "scheduled",   tag: "Internal" },
  { title: "Harbor v2 — sprint planning", description: "Plan sprint 15. Review velocity and risk.",                    hostId: "u_01", participants: ["u_04", "u_09", "u_05"],        startsAt: inDays(2).slice(0,11) + "14:30:00.000Z", durationMinutes: 60, link: "https://meet.rivera.app/harbor-plan",   status: "scheduled",   tag: "Product" },
  { title: "Driftwood — discovery",       description: "Intro discovery call with Driftwood Studio.",                  hostId: "u_03", participants: ["u_07"],                        startsAt: inDays(4).slice(0,11) + "11:00:00.000Z", durationMinutes: 30, link: "https://meet.rivera.app/driftwood",     status: "scheduled",   tag: "Sales" },
  { title: "Q2 OKRs review",              description: "Quarterly OKR review with leadership.",                        hostId: "u_01", participants: ["u_02", "u_10"],                startsAt: inDays(7).slice(0,11) + "16:00:00.000Z", durationMinutes: 60, link: "https://meet.rivera.app/q2-okrs",       status: "scheduled",   tag: "Internal" },
  { title: "Coral Boutique retro",        description: "Project retrospective.",                                       hostId: "u_03", participants: ["u_07"],                        startsAt: ago(2).slice(0,11) + "10:00:00.000Z",    durationMinutes: 45, link: "https://meet.rivera.app/coral-retro",   status: "completed",   tag: "Client" },
  { title: "Northwind kickoff",           description: "Cancelled — Northwind paused engagement.",                     hostId: "u_02", participants: ["u_04"],                        startsAt: ago(5).slice(0,11) + "13:00:00.000Z",    durationMinutes: 60, link: "https://meet.rivera.app/northwind",     status: "cancelled",   tag: "Client" },
];

const now = new Date().toISOString();
export const mockMeetings: Meeting[] = seed.map((m, i) => ({
  ...m,
  id: `mt_${String(i + 1).padStart(2, "0")}`,
  createdAt: now,
  updatedAt: now,
}));

export const meetingsStore = createLocalStore<Meeting>({
  key: "data:meetings",
  seed: mockMeetings,
  idPrefix: "mt",
});