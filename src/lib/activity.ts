import { toast } from "sonner";
import type { ActivityAction, ActivityLog } from "@/types";
import { activityStore } from "@/template/rivera/data/mockActivity";
import { storage } from "./storage";
import type { AuthSession } from "@/types";

/**
 * Append an activity log entry to localStorage.
 * Used by stores (auto-log on CRUD), auth (login/logout), and settings pages.
 *
 * When `toastOptions` is provided (or omitted with default), a matching sonner
 * toast fires so the user sees the same entry that lands in the activity log.
 */
export function logActivity(input: {
  action: ActivityAction;
  entity: string;
  entityId?: string;
  summary: string;
  actorId?: string;
  metadata?: ActivityLog["metadata"];
  /** Toast presentation. Set `silent: true` to skip the toast. */
  toastOptions?: {
    silent?: boolean;
    /** Override toast title (defaults to a derived action verb). */
    title?: string;
    /** Adds a "View activity" action linking to the activity log. */
    href?: string;
  };
}): void {
  const session = storage.get<AuthSession | null>("auth:session", null);
  const actorId = input.actorId ?? session?.email ?? "u_01";
  const entry = activityStore.create({
    actorId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? "—",
    summary: input.summary,
    metadata: input.metadata,
  });

  if (
    input.toastOptions?.silent ||
    input.action === "logged_in" ||
    input.action === "logged_out" ||
    input.entity === "session" ||
    input.entity === "auth"
  ) {
    return;
  }

  const tone = TONE[input.action] ?? "default";
  const title = input.toastOptions?.title ?? defaultTitle(input.action, input.entity);
  const opts = {
    id: `activity:${entry.id}`,
    description: input.summary,
  };
  if (tone === "success") toast.success(title, opts);
  else if (tone === "error") toast.error(title, opts);
  else if (tone === "warning") toast.warning(title, opts);
  else toast(title, opts);
}

const TONE: Partial<Record<ActivityAction, "success" | "error" | "warning" | "default">> = {
  created: "success",
  updated: "success",
  deleted: "warning",
  uploaded: "success",
  exported: "default",
  invited: "success",
  commented: "default",
  logged_in: "default",
  logged_out: "default",
};

function defaultTitle(action: ActivityAction, entity: string): string {
  const label = entity.replace(/_/g, " ");
  switch (action) {
    case "created": return `${cap(label)} created`;
    case "updated": return `${cap(label)} updated`;
    case "deleted": return `${cap(label)} deleted`;
    case "uploaded": return `${cap(label)} uploaded`;
    case "exported": return `${cap(label)} exported`;
    case "invited": return `${cap(label)} invited`;
    case "commented": return `Comment on ${label}`;
    case "logged_in": return "Signed in";
    case "logged_out": return "Signed out";
    default: return cap(label);
  }
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
