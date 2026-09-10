import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlatformNotesPanel, PlatformTaskList, PlatformTimeline } from "@/loopdev/components/platform";
import type { EntityRef, NoteRecord, TaskRecord, TimelineEvent } from "@/loopdev/domains/platform";

const scope = { organizationId: "org-test", workspaceId: "workspace-test", brandId: null };
const relation: EntityRef<"contact"> = { entityType: "contact", entityId: "contact-test", scope };
const permissions = { canRead: true, canEdit: true, canDelete: false, canAssign: true, canModerate: true };

const task: TaskRecord = {
  id: "task-test",
  scope,
  status: "open",
  createdById: "user-test",
  updatedById: "user-test",
  createdAt: "2026-09-10T10:00:00.000Z",
  updatedAt: "2026-09-10T10:00:00.000Z",
  version: 1,
  visibility: "team",
  permissions,
  title: "Call contact",
  description: null,
  priority: "high",
  ownerId: "user-test",
  assignedUserId: "user-test",
  dueAt: null,
  relation,
  completedAt: null,
};

const note: NoteRecord = {
  id: "note-test",
  scope,
  status: "active",
  createdById: "user-test",
  updatedById: "user-test",
  createdAt: "2026-09-10T10:00:00.000Z",
  updatedAt: "2026-09-10T10:00:00.000Z",
  version: 1,
  visibility: "team",
  permissions,
  relation,
  authorId: "user-test",
  body: "Remember the preferred channel.",
};

const event: TimelineEvent = {
  id: "event-test",
  scope,
  relation,
  type: "task",
  actorId: "user-test",
  actorType: "user",
  origin: "task",
  sourceType: "task",
  sourceId: "task-test",
  dedupeKey: "task:task-test",
  summary: "Task created",
  metadata: {},
  occurredAt: "2026-09-10T10:00:00.000Z",
  createdAt: "2026-09-10T10:00:00.000Z",
  updatedAt: "2026-09-10T10:00:00.000Z",
};

describe("Platform work components", () => {
  it("renders a task and delegates its lifecycle action", () => {
    const onTransition = vi.fn(() => Promise.resolve());
    render(<PlatformTaskList tasks={[task]} onTransition={onTransition} />);
    expect(screen.getByText("Call contact")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Complete Call contact" }));
    expect(onTransition).toHaveBeenCalledWith(task, "completed");
  });

  it("renders controlled notes and submits through the Platform boundary", async () => {
    const onCreate = vi.fn(() => Promise.resolve());
    render(<PlatformNotesPanel notes={[note]} relation={relation} onCreate={onCreate} />);
    expect(screen.getByText("Remember the preferred channel.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Add a note"), { target: { value: "Follow up tomorrow" } });
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("Follow up tomorrow", "team"));
  });

  it("keeps timeline events in an accessible ordered list", () => {
    render(<PlatformTimeline events={[event]} />);
    expect(screen.getByRole("list", { name: "Timeline" })).toBeInTheDocument();
    expect(screen.getByText("Task created")).toBeInTheDocument();
  });
});
