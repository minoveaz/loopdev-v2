import type { ActivityLog } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

export const mockActivity: ActivityLog[] = [
  { id: "a_01", actorId: "u_01", action: "logged_in", entity: "session", entityId: "s_01", summary: "Signed in from Lisbon",                                                createdAt: ago(0, 1),  updatedAt: ago(0, 1)  },
  { id: "a_02", actorId: "u_03", action: "updated",   entity: "project", entityId: "p_01", summary: "Updated milestone — Atlas Rebrand",                                  createdAt: ago(0, 4),  updatedAt: ago(0, 4)  },
  { id: "a_03", actorId: "u_09", action: "created",   entity: "task",    entityId: "t_03", summary: "Created task — Shipment tracking API",                              createdAt: ago(0, 8),  updatedAt: ago(0, 8)  },
  { id: "a_04", actorId: "u_10", action: "exported",  entity: "report",  entityId: "rep_q",summary: "Exported revenue report (Q1)",                                       createdAt: ago(1),     updatedAt: ago(1)     },
  { id: "a_05", actorId: "u_02", action: "invited",   entity: "user",    entityId: "u_04", summary: "Invited Henrik Voss as Member",                                      createdAt: ago(2),     updatedAt: ago(2)     },
  { id: "a_06", actorId: "u_07", action: "commented", entity: "task",    entityId: "t_07", summary: "Commented on Sage editorial layout templates",                       createdAt: ago(3),     updatedAt: ago(3)     },
  { id: "a_07", actorId: "u_05", action: "uploaded",  entity: "file",    entityId: "f_22", summary: "Uploaded analytics_q1.csv (3.2MB)",   metadata: { size: 3_200_000 }, createdAt: ago(4),     updatedAt: ago(4)     },
  { id: "a_08", actorId: "u_01", action: "deleted",   entity: "invoice", entityId: "in_06",summary: "Voided invoice INV-2026-0038",                                       createdAt: ago(5),     updatedAt: ago(5)     },
  { id: "a_09", actorId: "u_06", action: "logged_out",entity: "session", entityId: "s_07", summary: "Session ended (suspended account)",                                  createdAt: ago(46),    updatedAt: ago(46)    },
  { id: "a_10", actorId: "u_03", action: "created",   entity: "project", entityId: "p_06", summary: "Created project — Driftwood Studio Site",                            createdAt: ago(4),     updatedAt: ago(4)     },
];

export const activityStore = createLocalStore<ActivityLog>({
  key: "data:activity",
  seed: mockActivity,
  idPrefix: "a",
});
