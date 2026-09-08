import type { ActivityAction } from "@/types";
import type { StatusTone } from "@/components/common";

export type Severity = "info" | "success" | "warning" | "critical";

export const severityTone: Record<Severity, StatusTone> = {
  info: "info",
  success: "success",
  warning: "warning",
  critical: "destructive",
};

/** Derive a severity level from the action verb. Pure UI mapping. */
export function severityForAction(action: ActivityAction): Severity {
  switch (action) {
    case "deleted":
      return "critical";
    case "logged_out":
    case "exported":
    case "uploaded":
      return "warning";
    case "created":
    case "logged_in":
    case "invited":
      return "success";
    default:
      return "info";
  }
}

export const ACTIVITY_ACTIONS: ActivityAction[] = [
  "created",
  "updated",
  "deleted",
  "logged_in",
  "logged_out",
  "invited",
  "exported",
  "uploaded",
  "commented",
];