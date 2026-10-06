import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { filterBusinessActivities, getTaskSummary, isFresh } from "@/loopdev/domains/crm/overview";

describe("CRM overview dashboard", () => {
  it("keeps only allowlisted, deduplicated business activity", () => {
    const base = {
      scope: { organizationId: "org-1" },
      relation: null,
      actorId: null,
      actorType: "system" as const,
      origin: "system",
      metadata: {},
      occurredAt: "2026-09-27T10:00:00Z",
      createdAt: "2026-09-27T10:00:00Z",
      updatedAt: "2026-09-27T10:00:00Z",
    };
    const events = [
      { ...base, id: "1", type: "email", sourceType: "email", sourceId: "e-1", summary: "Sent" },
      { ...base, id: "2", type: "document_extraction", sourceType: "technical", sourceId: "x-1", summary: "Extracted" },
      { ...base, id: "3", type: "email", sourceType: "email", sourceId: "e-1", summary: "Duplicate" },
    ];
    expect(filterBusinessActivities(events)).toHaveLength(1);
    expect(filterBusinessActivities(events)[0].summary).toBe("Sent");
  });

  it("summarizes overdue/today tasks and returns a read-only deep-linkable set", () => {
    const now = new Date("2026-09-27T12:00:00Z");
    const base = {
      scope: { organizationId: "org-1" },
      createdById: null,
      updatedById: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      version: 1,
      visibility: "organization" as const,
      permissions: { canRead: true, canEdit: false, canDelete: false, canAssign: false, canModerate: false },
      relation: null,
      ownerId: null,
      assignedUserId: null,
      completedAt: null,
      description: null,
    };
    const summary = getTaskSummary([
      { ...base, id: "overdue", title: "Overdue", status: "open", priority: "normal", dueAt: "2026-09-26T12:00:00Z" },
      { ...base, id: "today", title: "Today", status: "in_progress", priority: "normal", dueAt: "2026-09-27T18:00:00Z" },
      { ...base, id: "done", title: "Done", status: "completed", priority: "normal", dueAt: "2026-09-27T09:00:00Z" },
    ], now);
    expect(summary.overdueCount).toBe(1);
    expect(summary.todayCount).toBe(1);
    expect(summary.next.map((task) => task.id)).toEqual(["overdue", "today"]);
  });

  it("removes legacy Overview workspaces and demo surfaces", () => {
    const source = readFileSync(resolve(process.cwd(), "src/loopdev/pages/crm/Overview.tsx"), "utf8");
    expect(source).not.toContain("PlatformTaskWorkspace");
    expect(source).not.toContain("PlatformNotesPanel");
    expect(source).not.toContain("PlatformAttachmentsPanel");
    expect(source).not.toContain("PlatformTimeline");
    expect(source).not.toContain("PlatformRelationsPanel");
    expect(source).toContain("/app/sales-crm/tasks?taskId=");
  });

  it("enforces the 60-second target and five-minute maximum freshness", () => {
    const generated = "2026-09-27T12:00:00.000Z";
    const now = Date.parse("2026-09-27T12:05:00.000Z");
    expect(isFresh(generated, now - 4 * 60_000)).toBe(true);
    expect(isFresh(generated, now + 1)).toBe(false);
  });
});
