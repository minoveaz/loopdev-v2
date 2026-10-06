import type { ActivityRecord, TaskRecord } from "@/loopdev/domains/platform";

export const BUSINESS_ACTIVITY_ALLOWLIST = new Set([
  "call",
  "email",
  "meeting",
  "note",
  "task",
  "assignment",
  "stage_change",
  "conversion",
  "closure",
]);

export function filterBusinessActivities(activities: ActivityRecord[]): ActivityRecord[] {
  const seen = new Set<string>();
  return activities
    .filter((activity) => BUSINESS_ACTIVITY_ALLOWLIST.has(activity.type))
    .filter((activity) => {
      const key = `${activity.sourceType}:${activity.sourceId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}

export function getTaskSummary(tasks: TaskRecord[], now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const open = tasks.filter((task) => task.status !== "completed" && task.status !== "cancelled");
  const overdue = open.filter((task) => task.dueAt && task.dueAt < now.toISOString());
  const todayTasks = open.filter((task) => task.dueAt?.slice(0, 10) === today);
  return {
    openCount: open.length,
    overdueCount: overdue.length,
    todayCount: todayTasks.length,
    next: [...open].sort((a, b) => Date.parse(a.dueAt ?? "9999-12-31") - Date.parse(b.dueAt ?? "9999-12-31")).slice(0, 4),
  };
}

export function isFresh(generatedAt: string, now = Date.now(), maxAgeMs = 5 * 60 * 1000) {
  return now - Date.parse(generatedAt) <= maxAgeMs;
}
