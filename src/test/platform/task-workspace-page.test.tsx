import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlatformTaskForm } from "@/loopdev/components/platform";
import { localPlatformTaskTemplatesStore, localPlatformTasksStore } from "@/loopdev/domains/platform";
import TaskTemplates from "@/loopdev/pages/platform/TaskTemplates";
import type { EntityRef, TaskRecord } from "@/loopdev/domains/platform";
import CRMTasks from "@/loopdev/pages/platform/Workspace";

const scope = { organizationId: "local-development-organization", workspaceId: "local-workspace", brandId: null };
const relation: EntityRef<"contact"> = { entityType: "contact", entityId: "contact-1", scope };
const task: TaskRecord = {
  id: "task-edit-test",
  scope,
  createdById: "local-development-user",
  updatedById: "local-development-user",
  createdAt: "2026-09-10T10:00:00.000Z",
  updatedAt: "2026-09-10T10:00:00.000Z",
  version: 2,
  visibility: "team",
  permissions: { canRead: true, canEdit: true, canDelete: false, canAssign: true, canModerate: true },
  title: "Initial task",
  description: "Initial description",
  status: "open",
  priority: "normal",
  ownerId: "local-development-user",
  assignedUserId: "owner-old",
  dueAt: null,
  relation,
  completedAt: null,
};

beforeEach(() => {
  localPlatformTasksStore.reset();
  localPlatformTaskTemplatesStore.reset();
});

describe("task workspace", () => {
  it("renders all task views and submits the editable task fields", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(
      <PlatformTaskForm task={task} relation={relation} canAssign onSubmit={onSubmit} />,
    );
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Updated task" } });
    fireEvent.change(screen.getByLabelText("Assigned user"), { target: { value: "owner-new" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: "Updated task",
      assignedUserId: "owner-new",
    })));
  });

  it("keeps table, personal, urgent and calendar views available", async () => {
    render(<MemoryRouter><CRMTasks /></MemoryRouter>);
    expect(await screen.findByText("CRM tasks")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All tasks" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "My tasks" }));
    expect(screen.getByRole("button", { name: "Urgent & overdue" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Calendar" }));
    expect(screen.getByText("Mon")).toBeInTheDocument();
  });

  it("creates an organization task template from the administration drawer", async () => {
    render(<MemoryRouter><TaskTemplates /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "New template" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Renewal check-in" } });
    fireEvent.change(screen.getByLabelText("Template key"), { target: { value: "renewal-check-in" } });
    fireEvent.click(screen.getByRole("button", { name: "Create template" }));
    await waitFor(() => expect(localPlatformTaskTemplatesStore.list().some((template) => template.name === "Renewal check-in")).toBe(true));
  });
});
