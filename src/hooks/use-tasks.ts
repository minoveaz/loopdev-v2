import { useCallback, useEffect, useState } from "react";
import type {
  CreateTaskInput,
  PlatformSuiteKey,
  TaskChecklistItem,
  TaskRecord,
  TaskTemplateRecord,
  UpdateTaskPatch,
} from "@/loopdev/domains/tasks";

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
  const [tasks, setTasks] = useState<TaskRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_TASKS;
  });

  const [templates] = useState<TaskTemplateRecord[]>(DEFAULT_TEMPLATES);
  const [isLoading, setIsLoading] = useState(false);

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
    [persistTasks, suite, tasks],
  );

  const updateTask = useCallback(
    async (taskId: string, patch: UpdateTaskPatch, expectedVersion?: number) => {
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
    [persistTasks, tasks],
  );

  const completeTask = useCallback(
    async (taskId: string, expectedVersion?: number) => {
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
    [persistTasks, tasks],
  );

  const reopenTask = useCallback(
    async (taskId: string, expectedVersion?: number) => {
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
    [persistTasks, tasks],
  );

  const quickReschedule = useCallback(
    async (taskId: string, dueAt: string | Date) => {
      const dateStr = typeof dueAt === "string" ? dueAt : dueAt.toISOString();
      const updated = tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          dueAt: dateStr,
          updatedAt: new Date().toISOString(),
          version: t.version + 1,
        };
      });
      persistTasks(updated);
    },
    [persistTasks, tasks],
  );

  const toggleChecklistItem = useCallback(
    async (taskId: string, itemId: string, completed: boolean) => {
      const now = new Date().toISOString();
      let modifiedTask: TaskRecord | null = null;
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
        const next = {
          ...t,
          checklist,
          updatedAt: now,
          version: t.version + 1,
        };
        modifiedTask = next;
        return next;
      });
      persistTasks(updated);
      return modifiedTask;
    },
    [persistTasks, tasks],
  );

  const addChecklistItem = useCallback(
    async (taskId: string, title: string) => {
      const now = new Date().toISOString();
      let modifiedTask: TaskRecord | null = null;
      const updated = tasks.map((t) => {
        if (t.id !== taskId) return t;
        const currentChecklist = t.checklist || [];
        const newItem: TaskChecklistItem = {
          id: `chk-${Date.now()}`,
          title: title.trim(),
          completed: false,
        };
        const next = {
          ...t,
          checklist: [...currentChecklist, newItem],
          updatedAt: now,
          version: t.version + 1,
        };
        modifiedTask = next;
        return next;
      });
      persistTasks(updated);
      return modifiedTask;
    },
    [persistTasks, tasks],
  );

  const deleteChecklistItem = useCallback(
    async (taskId: string, itemId: string) => {
      const now = new Date().toISOString();
      let modifiedTask: TaskRecord | null = null;
      const updated = tasks.map((t) => {
        if (t.id !== taskId) return t;
        const currentChecklist = t.checklist || [];
        const next = {
          ...t,
          checklist: currentChecklist.filter((c) => c.id !== itemId),
          updatedAt: now,
          version: t.version + 1,
        };
        modifiedTask = next;
        return next;
      });
      persistTasks(updated);
      return modifiedTask;
    },
    [persistTasks, tasks],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const updated = tasks.filter((t) => t.id !== taskId);
      persistTasks(updated);
    },
    [persistTasks, tasks],
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
    refresh: async () => {},
  };
}
