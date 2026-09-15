import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MobileTasksList } from "@/components/crm/tasks/MobileTasksList";
import { TaskDetailDrawer } from "@/components/crm/tasks/TaskDetailDrawer";
import { QuickTaskModal } from "@/components/crm/tasks/QuickTaskModal";
import type { TaskRecord, TaskTemplateRecord } from "@/loopdev/domains/tasks";

const mockTask: TaskRecord = {
  id: "tsk-test-1",
  organizationId: "local-development-organization",
  suite: "crm",
  title: "Llamada de prueba con cliente",
  description: "Detalle de la llamada",
  status: "open",
  priority: "urgent",
  assignedUserId: "usr-ana",
  assignedUser: { id: "usr-ana", displayName: "Ana Mora" },
  dueAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  relation: { entityType: "contact", entityId: "con-1", label: "Carlos Gómez" },
  checklist: [
    { id: "step-1", title: "Paso uno", completed: false },
    { id: "step-2", title: "Paso dos", completed: true },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1,
};

const mockTemplate: TaskTemplateRecord = {
  id: "tpl-1",
  organizationId: "local-development-organization",
  suite: "crm",
  key: "sales_call",
  name: "Llamada de Cierre",
  description: "Plantilla rápida",
  defaultPriority: "urgent",
  relationTypes: ["contact"],
  status: "active",
};

describe("Tasks UI Components", () => {
  it("renders MobileTasksList with task title, relation and template chip", () => {
    const onComplete = vi.fn().mockResolvedValue({ status: "success" });
    const onSelectTask = vi.fn();
    const onSelectTemplate = vi.fn();

    render(
      <MobileTasksList
        tasks={[mockTask]}
        templates={[mockTemplate]}
        onComplete={onComplete}
        onSelectTask={onSelectTask}
        onSelectTemplate={onSelectTemplate}
      />,
    );

    expect(screen.getByText("Llamada de prueba con cliente")).toBeDefined();
    expect(screen.getByText("Carlos Gómez")).toBeDefined();
    expect(screen.getByText("Llamada de Cierre")).toBeDefined();
  });

  it("triggers task detail drawer open and shows subtasks progress", () => {
    const onComplete = vi.fn().mockResolvedValue({ status: "success" });
    const onReschedule = vi.fn().mockResolvedValue({ status: "success" });
    const onToggleChecklist = vi.fn().mockResolvedValue({ status: "success" });

    render(
      <TaskDetailDrawer
        task={mockTask}
        open={true}
        onClose={vi.fn()}
        onComplete={onComplete}
        onReschedule={onReschedule}
        onToggleChecklist={onToggleChecklist}
      />,
    );

    expect(screen.getByText("Paso uno")).toBeDefined();
    expect(screen.getByText("Paso dos")).toBeDefined();
    expect(screen.getByText("50%")).toBeDefined();
  });

  it("renders QuickTaskModal and allows filling task details", () => {
    const onSubmit = vi.fn().mockResolvedValue({ status: "success" });
    const onClose = vi.fn();

    render(
      <QuickTaskModal
        open={true}
        onClose={onClose}
        onSubmit={onSubmit}
        templates={[mockTemplate]}
        initialRelation={{ entityType: "contact", entityId: "con-1", label: "Carlos Gómez" }}
      />,
    );

    expect(screen.getByText("Nueva Tarea")).toBeDefined();
    expect(screen.getByPlaceholderText(/Llamada de seguimiento/)).toBeDefined();
  });
});
