import { SupabaseTasksAdapter } from "./adapter/supabase";
import type { TasksPort } from "./types";

export * from "./types";
export * from "./adapter/local";
export * from "./adapter/supabase";

let tasksAdapterInstance: TasksPort | null = null;

export function getTasksAdapter(): TasksPort {
  if (!tasksAdapterInstance) {
    tasksAdapterInstance = new SupabaseTasksAdapter();
  }
  return tasksAdapterInstance;
}

export function setTasksAdapter(adapter: TasksPort | null): void {
  tasksAdapterInstance = adapter;
}
