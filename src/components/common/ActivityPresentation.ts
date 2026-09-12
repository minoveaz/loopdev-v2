import { ArrowRightLeft, Calendar, CheckSquare, Mail, MessageCircle, Phone, Settings, StickyNote, TrendingUp, type LucideIcon } from "lucide-react";

export type ActivityKind =
  | "email"
  | "call"
  | "meeting"
  | "message"
  | "note"
  | "task"
  | "opportunity"
  | "status_change"
  | "system";

interface ActivityKindConfig {
  icon: LucideIcon;
  label: string;
  iconClass: string;
  iconBackground: string;
}

export const activityKindConfig: Record<ActivityKind, ActivityKindConfig> = {
  email: { icon: Mail, label: "Email", iconClass: "text-info", iconBackground: "bg-info/10" },
  call: { icon: Phone, label: "Call", iconClass: "text-success", iconBackground: "bg-success/10" },
  meeting: { icon: Calendar, label: "Meeting", iconClass: "text-primary", iconBackground: "bg-primary/10" },
  message: { icon: MessageCircle, label: "Message", iconClass: "text-accent", iconBackground: "bg-accent/10" },
  note: { icon: StickyNote, label: "Note", iconClass: "text-gold", iconBackground: "bg-gold/10" },
  task: { icon: CheckSquare, label: "Task", iconClass: "text-warning", iconBackground: "bg-warning/10" },
  opportunity: { icon: TrendingUp, label: "Opportunity", iconClass: "text-success", iconBackground: "bg-success/10" },
  status_change: { icon: ArrowRightLeft, label: "Status change", iconClass: "text-muted-foreground", iconBackground: "bg-muted" },
  system: { icon: Settings, label: "System", iconClass: "text-muted-foreground", iconBackground: "bg-muted" },
};

export function getActivityKind(action: string): ActivityKind {
  const normalized = action.toLowerCase();
  if (normalized.includes("email")) return "email";
  if (normalized.includes("call")) return "call";
  if (normalized.includes("meeting")) return "meeting";
  if (normalized.includes("message") || normalized.includes("whatsapp")) return "message";
  if (normalized.includes("note")) return "note";
  if (normalized.includes("task")) return "task";
  if (normalized.includes("opportunity")) return "opportunity";
  if (normalized.includes("status")) return "status_change";
  return "system";
}

export function getActivityActionLabel(action: string): string {
  const normalized = action.toLowerCase();
  const labels: Record<string, string> = {
    email: "Email sent",
    call: "Call completed",
    meeting: "Meeting scheduled",
    note: "Note added",
    task: "Task updated",
    opportunity: "Opportunity updated",
    whatsapp: "Message received",
    communication: "Communication logged",
    status_change: "Status changed",
    created: "Created",
    updated: "Updated",
    completed: "Completed",
  };
  return labels[normalized] ?? action.replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

export function getActivityStatusTone(status?: string): "neutral" | "success" | "warning" | "destructive" | "info" {
  switch (status?.toLowerCase()) {
    case "completed":
    case "sent":
    case "received":
      return "success";
    case "scheduled":
    case "in_progress":
    case "pending":
      return "warning";
    case "cancelled":
    case "failed":
      return "destructive";
    case "open":
      return "info";
    default:
      return "neutral";
  }
}
