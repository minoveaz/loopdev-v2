import type { Project } from "@/types";

export const PROJECT_STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function projectHealth(p: Project): "on-track" | "at-risk" | "off-track" {
  if (p.status === "completed") return "on-track";
  const burnRatio = p.budget ? p.spent / p.budget : 0;
  const progress = p.progress / 100;
  if (burnRatio > progress + 0.2) return "off-track";
  if (burnRatio > progress + 0.05) return "at-risk";
  return "on-track";
}