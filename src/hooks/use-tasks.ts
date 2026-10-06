import { useCallback, useEffect, useState } from "react";
import { useTenantContext } from "@/hooks/use-tenant-context";
import type {
  CreateTaskInput,
  PlatformSuiteKey,
  TaskChecklistItem,
  TaskRecord,
  TaskTemplateRecord,
  UpdateTaskPatch,
} from "@/loopdev/domains/tasks";
import { getTasksAdapter } from "@/loopdev/domains/tasks/index";

export const DEFAULT_TEMPLATES: TaskTemplateRecord[] = [
  {
    id: "tpl-crm-call",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    suite: "crm",
    key: "sales_call",
    name: "Llamada de Cierre",
    description: "Seguimiento telefónico con prospecto o tomador de decisión",
    defaultPriority: "urgent",
    defaultDueDays: 1,
    relationTypes: ["contact", "lead", "opportunity"],
    defaultChecklist: ["Revisar historial", "Presentar propuesta", "Confirmar fecha de firma"],
    status: "active",
  },
  {
    id: "tpl-crm-quote",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    suite: "crm",
    key: "send_quote",
    name: "Cotización Formal",
    description: "Preparar y remitir propuesta económica formal",
    defaultPriority: "high",
    defaultDueDays: 2,
    relationTypes: ["contact", "lead", "opportunity"],
    defaultChecklist: ["Validar cálculo de prima", "Adjuntar anexo PDF", "Configurar recordatorio 48h"],
    status: "active",
  },
  {
    id: "tpl-crm-demo",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    suite: "crm",
    key: "platform_demo",
    name: "Demo de Plataforma",
    description: "Sesión técnica demostrativa con equipo del cliente",
    defaultPriority: "normal",
    defaultDueDays: 3,
    relationTypes: ["contact", "lead", "opportunity"],
    defaultChecklist: ["Configurar staging", "Enviar invitación de calendario", "Registrar feedback"],
    status: "active",
  },
  {
    id: "tpl-ops-policy",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    suite: "operations",
    key: "issue_policy",
    name: "Emisión de Póliza",
    description: "Trámite y radicación de póliza con aseguradora",
    defaultPriority: "high",
    defaultDueDays: 2,
    relationTypes: ["contact", "opportunity", "contract"],
    defaultChecklist: ["Validar soporte de pago", "Radicar ante aseguradora", "Notificar asegurado"],
    status: "active",
  },
];

export const INITIAL_TASKS: TaskRecord[] = [
  {
    id: "tsk-001",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    suite: "crm",
    title: "Llamada cierre de póliza colectiva",
    description: "Revisar cláusula de cobertura antes del envío final y validar condiciones comerciales",
    status: "open",
    priority: "urgent",
    assignedUserId: "usr-ana",
    assignedUser: { id: "usr-ana", displayName: "Ana Mora" },
    dueAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), // 2 hours ago (Overdue)
    relation: { entityType: "contact", entityId: "con-carlos-gomez", label: "Carlos Gómez · Seguros Bolivar" },
    templateId: "tpl-crm-call",
    checklist: [
      { id: "chk-1", title: "Revisar términos de prima", completed: true, completedAt: new Date().toISOString() },
      { id: "chk-2", title: "Aprobar con gerencia financiera", completed: true, completedAt: new Date().toISOString() },
      { id: "chk-3", title: "Enviar documento final para firma", completed: false },
    ],
    mentions: [{ userId: "usr-mario", displayName: "Mario Rivera", email: "mario@loopdev.com" }],
    tags: ["#VIP", "#Cierre"],
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
  {
    id: "tsk-002",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    suite: "crm",
    title: "Enviar cotización comercial ajustada",
    description: "Aplicar descuento del 5% por pronto pago acordado en comité",
    status: "in_progress",
    priority: "high",
    assignedUserId: "usr-juan",
    assignedUser: { id: "usr-juan", displayName: "Juan Pérez" },
    dueAt: new Date(Date.now() + 3600 * 1000 * 4).toISOString(), // Today in 4 hours
    relation: { entityType: "opportunity", entityId: "opp-01", label: "Renovación Flota Suramericana" },
    templateId: "tpl-crm-quote",
    checklist: [
      { id: "chk-4", title: "Recalcular tabla de amortización", completed: true, completedAt: new Date().toISOString() },
      { id: "chk-5", title: "Generar PDF timbrado", completed: false },
    ],
    tags: ["#Comercial"],
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
  {
    id: "tsk-003",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    suite: "crm",
    title: "Agendar demo técnica de integración API",
    description: "Demostración de webhooks y contratos REST para el equipo de desarrollo del cliente",
    status: "open",
    priority: "normal",
    assignedUserId: "usr-carlos",
    assignedUser: { id: "usr-carlos", displayName: "Carlos Mendoza" },
    dueAt: new Date(Date.now() + 3600 * 1000 * 24 * 2).toISOString(), // In 2 days
    relation: { entityType: "lead", entityId: "lead-09", label: "Fintech Alianza S.A." },
    templateId: "tpl-crm-demo",
    checklist: [
      { id: "chk-6", title: "Preparar sandbox de prueba", completed: false },
      { id: "chk-7", title: "Validar credenciales API key", completed: false },
    ],
    tags: ["#Demo", "#Tecnología"],
    createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
  {
    id: "tsk-004",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    suite: "crm",
    title: "Radicación de documentación de cumplimiento",
    description: "Envío de RUT y certificación bancaria requerida por compras",
    status: "completed",
    priority: "normal",
    assignedUserId: "usr-ana",
    assignedUser: { id: "usr-ana", displayName: "Ana Mora" },
    dueAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    completedAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    relation: { entityType: "contact", entityId: "con-diana-lopez", label: "Diana López · Logística Andina" },
    checklist: [
      { id: "chk-8", title: "Descargar RUT actualizado", completed: true },
      { id: "chk-9", title: "Subir al portal de proveedores", completed: true },
    ],
    tags: ["#Cumplimiento"],
    createdAt: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    updatedAt: new Date().toISOString(),
    version: 2,
  },
];

const STORAGE_KEY = "loopdev_tasks_crm_v2";

export function useTasks({ suite = "crm" }: { suite?: PlatformSuiteKey } = {}) {
  const { activeOrganization } = useTenantContext();
  const organizationId = activeOrganization?.id ?? "";
  const isRemoteTenant = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId);
  const tasksAdapter = getTasksAdapter();
  const [tasks, setTasks] = useState<TaskRecord[]>(() => {
    if (isRemoteTenant) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_TASKS;
  });

  const [templates] = useState<TaskTemplateRecord[]>(isRemoteTenant ? [] : DEFAULT_TEMPLATES);
  const [isLoading, setIsLoading] = useState(isRemoteTenant);

  useEffect(() => {
    if (!isRemoteTenant) return;
    let active = true;
    setIsLoading(true);
    tasksAdapter.listTasks({ organizationId, suite }).then((page) => {
      if (active) setTasks(page.items);
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [isRemoteTenant, organizationId, suite, tasksAdapter]);

  const persistTasks = useCallback((nextTasks: TaskRecord[]) => {
    setTasks(nextTasks);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks));
    } catch {
      // ignore
    }
  }, []);

  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      if (isRemoteTenant) {
        const result = await tasksAdapter.createTask({ ...input, organizationId });
        if (result.status !== "success") throw new Error(result.message);
        setTasks((current) => [result.task, ...current]);
        return result.task;
      }
      setIsLoading(true);
      const newTask: TaskRecord = {
        id: `tsk-${Date.now()}`,
        organizationId: input.organizationId || "80fce911-57c5-4a83-809f-78df6a3736f7",
        workspaceId: input.workspaceId ?? null,
        suite: input.suite || suite,
        title: input.title,
        description: input.description ?? null,
        status: input.status || "open",
        priority: input.priority || "normal",
        assignedUserId: input.assignedUserId ?? null,
        assignedUser: input.assignedUser ?? (input.assignedUserId ? { id: input.assignedUserId, displayName: "Asignado" } : null),
        dueAt: input.dueAt ?? null,
        relation: input.relation ?? null,
        templateId: input.templateId ?? null,
        checklist: input.checklist?.map((item, idx) => ({
          id: item.id || `chk-${Date.now()}-${idx}`,
          title: item.title,
          completed: item.completed ?? false,
          completedAt: item.completed ? new Date().toISOString() : null,
        })) ?? [],
        mentions: input.mentions ?? [],
        reminders: input.reminders ?? [],
        tags: input.tags ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      const updated = [newTask, ...tasks];
      persistTasks(updated);
      setIsLoading(false);
      return newTask;
    },
    [isRemoteTenant, organizationId, persistTasks, suite, tasks, tasksAdapter],
  );

  const updateTask = useCallback(
    async (taskId: string, patch: UpdateTaskPatch, expectedVersion?: number) => {
      if (isRemoteTenant) {
        const current = tasks.find((task) => task.id === taskId);
        const result = await tasksAdapter.updateTask(taskId, patch, expectedVersion ?? current?.version);
        if (result.status !== "success") throw new Error(result.message);
        setTasks((items) => items.map((task) => task.id === taskId ? result.task : task));
        return result.task;
      }
      let updatedTask: TaskRecord | null = null;
      const updated = tasks.map((t) => {
        if (t.id !== taskId) return t;
        const next: TaskRecord = {
          ...t,
          ...patch,
          updatedAt: new Date().toISOString(),
          version: (expectedVersion ?? t.version) + 1,
        };
        updatedTask = next;
        return next;
      });
      persistTasks(updated);
      return updatedTask!;
    },
    [isRemoteTenant, persistTasks, tasks, tasksAdapter],
  );

  const completeTask = useCallback(
    async (taskId: string, expectedVersion?: number) => {
      if (isRemoteTenant) {
        const result = await tasksAdapter.completeTask(taskId, expectedVersion);
        if (result.status !== "success") throw new Error(result.message);
        setTasks((items) => items.map((task) => task.id === taskId ? result.task : task));
        return result.task;
      }
      const now = new Date().toISOString();
      const updated = tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: "completed" as const,
          completedAt: now,
          updatedAt: now,
          version: (expectedVersion ?? t.version) + 1,
        };
      });
      persistTasks(updated);
    },
    [isRemoteTenant, persistTasks, tasks, tasksAdapter],
  );

  const reopenTask = useCallback(
    async (taskId: string, expectedVersion?: number) => {
      if (isRemoteTenant) {
        const result = await tasksAdapter.reopenTask(taskId, expectedVersion);
        if (result.status !== "success") throw new Error(result.message);
        setTasks((items) => items.map((task) => task.id === taskId ? result.task : task));
        return result.task;
      }
      const now = new Date().toISOString();
      const updated = tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: "open" as const,
          completedAt: null,
          updatedAt: now,
          version: (expectedVersion ?? t.version) + 1,
        };
      });
      persistTasks(updated);
    },
    [isRemoteTenant, persistTasks, tasks, tasksAdapter],
  );

  const quickReschedule = useCallback(
    async (taskId: string, dueAt: string | Date, expectedVersion?: number) => {
      const dateStr = typeof dueAt === "string" ? dueAt : dueAt.toISOString();
      if (isRemoteTenant) {
        const result = await tasksAdapter.quickReschedule(taskId, dateStr, expectedVersion);
        if (result.status !== "success") throw new Error(result.message);
        setTasks((items) => items.map((task) => task.id === taskId ? result.task : task));
        return result.task;
      }
      const updated = tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          dueAt: dateStr,
          updatedAt: new Date().toISOString(),
          version: (expectedVersion ?? t.version) + 1,
        };
      });
      persistTasks(updated);
    },
    [isRemoteTenant, persistTasks, tasks, tasksAdapter],
  );

  const toggleChecklistItem = useCallback(
    async (taskId: string, itemId: string, completed: boolean) => {
      if (isRemoteTenant) {
        const result = await tasksAdapter.toggleChecklistItem(taskId, itemId, completed);
        if (result.status !== "success") throw new Error(result.message);
        setTasks((items) => items.map((task) => task.id === taskId ? result.task : task));
        return result.task;
      }
      const now = new Date().toISOString();
      const updated = tasks.map((t) => {
        if (t.id !== taskId) return t;
        const checklist = (t.checklist || []).map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            completed,
            completedAt: completed ? now : null,
          };
        });
        return {
          ...t,
          checklist,
          updatedAt: now,
          version: t.version + 1,
        };
      });
      persistTasks(updated);
    },
    [isRemoteTenant, persistTasks, tasks, tasksAdapter],
  );

  const addChecklistItem = useCallback(
    async (taskId: string, title: string) => {
      if (isRemoteTenant) {
        const result = await tasksAdapter.addChecklistItem(taskId, title);
        if (result.status !== "success") throw new Error(result.message);
        setTasks((items) => items.map((task) => task.id === taskId ? result.task : task));
        return result.task;
      }
      const updated = tasks.map((t) => {
        if (t.id !== taskId) return t;
        const newItem = {
          id: `chk-${Date.now()}`,
          title: title.trim(),
          completed: false,
          completedAt: null,
        };
        return {
          ...t,
          checklist: [...(t.checklist || []), newItem],
          updatedAt: new Date().toISOString(),
          version: t.version + 1,
        };
      });
      persistTasks(updated);
    },
    [isRemoteTenant, persistTasks, tasks, tasksAdapter],
  );

  const deleteChecklistItem = useCallback(
    async (taskId: string, itemId: string) => {
      if (isRemoteTenant) {
        const result = await tasksAdapter.deleteChecklistItem(taskId, itemId);
        if (result.status !== "success") throw new Error(result.message);
        setTasks((items) => items.map((task) => task.id === taskId ? result.task : task));
        return result.task;
      }
      const updated = tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          checklist: (t.checklist || []).filter((i) => i.id !== itemId),
          updatedAt: new Date().toISOString(),
          version: t.version + 1,
        };
      });
      persistTasks(updated);
    },
    [isRemoteTenant, persistTasks, tasks, tasksAdapter],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (isRemoteTenant) {
        const result = await tasksAdapter.deleteTask(taskId);
        if (!result.success) throw new Error(result.error || "Unable to delete task.");
        setTasks((items) => items.filter((task) => task.id !== taskId));
        return true;
      }
      const updated = tasks.filter((t) => t.id !== taskId);
      persistTasks(updated);
      return true;
    },
    [isRemoteTenant, persistTasks, tasks, tasksAdapter],
  );

  return {
    tasks,
    templates,
    isLoading,
    createTask,
    updateTask,
    completeTask,
    reopenTask,
    quickReschedule,
    toggleChecklistItem,
    addChecklistItem,
    deleteChecklistItem,
    deleteTask,
    refresh: async () => {
      if (!isRemoteTenant) return;
      const page = await tasksAdapter.listTasks({ organizationId, suite });
      setTasks(page.items);
    },
  };
}
