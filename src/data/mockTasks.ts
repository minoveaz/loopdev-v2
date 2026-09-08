import type { Task } from "@/types";
import { ago, inDays } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

export const mockTasks: Task[] = [
  { id: "t_01", title: "Finalize Atlas wordmark variations",      projectId: "p_01", assigneeId: "u_03", status: "review",      priority: "high",   dueDate: inDays(3),  tags: ["design"],       checklist: [4, 5], createdAt: ago(20), updatedAt: ago(0, 6) },
  { id: "t_02", title: "Wholesale brand guideline draft",         projectId: "p_01", assigneeId: "u_07", status: "in_progress", priority: "medium", dueDate: inDays(10), tags: ["docs"],         checklist: [2, 6], createdAt: ago(15), updatedAt: ago(1)    },
  { id: "t_03", title: "Harbor v2: shipment tracking API",        projectId: "p_02", assigneeId: "u_09", status: "in_progress", priority: "urgent", dueDate: inDays(8),  tags: ["api"],          checklist: [3, 7], createdAt: ago(25), updatedAt: ago(0, 2) },
  { id: "t_04", title: "Harbor v2: dashboard skeleton",           projectId: "p_02", assigneeId: "u_04", status: "todo",        priority: "high",   dueDate: inDays(14), tags: ["frontend"],     checklist: [0, 5], createdAt: ago(12), updatedAt: ago(12)   },
  { id: "t_05", title: "Coral catalog PDF export",                projectId: "p_03", assigneeId: "u_03", status: "done",        priority: "medium",                       tags: ["export"],       checklist: [3, 3], createdAt: ago(60), updatedAt: ago(33)   },
  { id: "t_06", title: "Northwind: vendor onboarding wireframes", projectId: "p_04", assigneeId: "u_03", status: "blocked",     priority: "medium", dueDate: inDays(30), tags: ["wireframe"],    checklist: [1, 4], createdAt: ago(40), updatedAt: ago(7)    },
  { id: "t_07", title: "Sage: editorial layout templates",        projectId: "p_05", assigneeId: "u_07", status: "in_progress", priority: "medium", dueDate: inDays(5),  tags: ["template"],     checklist: [2, 4], createdAt: ago(30), updatedAt: ago(0, 8) },
  { id: "t_08", title: "Sage: search & tags taxonomy",            projectId: "p_05",                     status: "todo",        priority: "low",    dueDate: inDays(20), tags: ["taxonomy"],     checklist: [0, 3], createdAt: ago(10), updatedAt: ago(10)   },
  { id: "t_09", title: "Driftwood: discovery interviews",         projectId: "p_06", assigneeId: "u_07", status: "todo",        priority: "low",    dueDate: inDays(12), tags: ["research"],     checklist: [0, 4], createdAt: ago(4),  updatedAt: ago(4)    },
  { id: "t_10", title: "Atlas: production print proofs",          projectId: "p_01", assigneeId: "u_02", status: "todo",        priority: "high",   dueDate: inDays(18), tags: ["print"],        checklist: [0, 2], createdAt: ago(8),  updatedAt: ago(8)    },
];

export const tasksStore = createLocalStore<Task>({
  key: "data:tasks",
  seed: mockTasks,
  idPrefix: "t",
});
