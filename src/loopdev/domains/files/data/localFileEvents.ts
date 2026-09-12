import type { FileRecord } from "../types";

export type FileAuditAction = "created" | "updated" | "versioned" | "related" | "archived" | "restored" | "deleted";

export interface FileAuditEvent {
  id: string;
  fileId: string;
  action: FileAuditAction;
  occurredAt: string;
  actorId: string | null;
  details?: string;
}

const key = "loopdev:files:audit-events";
const retentionMs = 90 * 24 * 60 * 60 * 1000;

export function recordFileEvent(file: FileRecord, action: FileAuditAction, details?: string) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const existing = JSON.parse(window.localStorage.getItem(key) ?? "[]") as FileAuditEvent[];
  const retained = existing.filter((event) => now - Date.parse(event.occurredAt) < retentionMs);
  retained.push({
    id: `${file.id}-${action}-${now}`,
    fileId: file.id,
    action,
    occurredAt: new Date(now).toISOString(),
    actorId: file.uploadedById,
    details,
  });
  window.localStorage.setItem(key, JSON.stringify(retained));
}

export function cleanupFileEvents() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const existing = JSON.parse(window.localStorage.getItem(key) ?? "[]") as FileAuditEvent[];
  window.localStorage.setItem(key, JSON.stringify(existing.filter((event) => now - Date.parse(event.occurredAt) < retentionMs)));
}
