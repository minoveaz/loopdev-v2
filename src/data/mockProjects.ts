import type { Project } from "@/types";
import { ago, inDays } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

export const mockProjects: Project[] = [
  {
    id: "p_01", name: "Atlas Rebrand", client: "Atlas Coffee Co.",
    description: "End-to-end visual identity refresh for the Atlas wholesale program.",
    progress: 78, budget: 48000, spent: 32400, currency: "USD",
    status: "in_progress", priority: "high",
    startDate: ago(120), dueDate: inDays(42), ownerId: "u_02",
    memberIds: ["u_03", "u_07"], tags: ["branding", "design"],
    createdAt: ago(120), updatedAt: ago(1),
  },
  {
    id: "p_02", name: "Harbor App v2", client: "Harbor Logistics",
    description: "Next major release of the Harbor logistics platform.",
    progress: 42, budget: 120000, spent: 51800, currency: "USD",
    status: "in_progress", priority: "urgent",
    startDate: ago(95), dueDate: inDays(118), ownerId: "u_01",
    memberIds: ["u_04", "u_09", "u_05"], tags: ["product", "engineering"],
    createdAt: ago(95), updatedAt: ago(0, 12),
  },
  {
    id: "p_03", name: "Coral Catalog", client: "Coral Boutique",
    description: "Seasonal product catalog and ecommerce templates.",
    progress: 100, budget: 22000, spent: 21450, currency: "USD",
    status: "completed", priority: "medium",
    startDate: ago(150), dueDate: ago(33), ownerId: "u_03",
    memberIds: ["u_07"], tags: ["ecommerce", "design"],
    createdAt: ago(150), updatedAt: ago(33),
  },
  {
    id: "p_04", name: "Northwind ERP", client: "Northwind Supply",
    description: "Custom ERP rollout for inventory and procurement.",
    progress: 18, budget: 240000, spent: 38900, currency: "USD",
    status: "on_hold", priority: "high",
    startDate: ago(60), dueDate: inDays(210), ownerId: "u_02",
    memberIds: ["u_04", "u_09", "u_10"], tags: ["enterprise", "engineering"],
    createdAt: ago(60), updatedAt: ago(7),
  },
  {
    id: "p_05", name: "Sage Editorial", client: "Sage Magazine",
    description: "Quarterly editorial site with custom CMS workflows.",
    progress: 64, budget: 36000, spent: 22800, currency: "EUR",
    status: "in_progress", priority: "medium",
    startDate: ago(70), dueDate: inDays(67), ownerId: "u_07",
    memberIds: ["u_03"], tags: ["editorial", "cms"],
    createdAt: ago(70), updatedAt: ago(2),
  },
  {
    id: "p_06", name: "Driftwood Studio Site", client: "Driftwood Studio",
    description: "Marketing site relaunch with case studies module.",
    progress: 5, budget: 18000, spent: 600, currency: "GBP",
    status: "planned", priority: "low",
    startDate: inDays(7), dueDate: inDays(96), ownerId: "u_03",
    memberIds: [], tags: ["marketing"],
    createdAt: ago(4), updatedAt: ago(4),
  },
];

export const projectsStore = createLocalStore<Project>({
  key: "data:projects",
  seed: mockProjects,
  idPrefix: "p",
});
