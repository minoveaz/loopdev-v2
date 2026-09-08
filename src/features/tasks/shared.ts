import type { StatusTone } from "@/components/common";
import type { Priority, ProjectStatus, TaskStatus } from "@/types";

export const TASK_STATUSES: { key: TaskStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To-do" },
  { key: "in_progress", label: "In progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
  { key: "blocked", label: "Blocked" },
];

export const taskStatusTone: Record<TaskStatus, StatusTone> = {
  backlog: "neutral",
  todo: "neutral",
  in_progress: "info",
  review: "gold",
  done: "success",
  blocked: "destructive",
};

export const priorityTone: Record<Priority, StatusTone> = {
  low: "neutral",
  medium: "info",
  high: "gold",
  urgent: "destructive",
};

export const projectStatusTone: Record<ProjectStatus, StatusTone> = {
  in_progress: "info",
  completed: "success",
  on_hold: "warning",
  cancelled: "neutral",
  planned: "neutral",
};
