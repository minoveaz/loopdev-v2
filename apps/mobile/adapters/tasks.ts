import type {
  CreateTaskInput,
  PlatformSuiteKey,
  TaskListParams,
  TaskMutationResult,
  TaskRecord,
  TasksPage,
  TasksPort,
  TaskTemplateRecord,
  UpdateTaskPatch,
} from "../../../packages/contracts/src/tasks";
import { mobileAuthAdapter, mobileTenantContextAdapter } from "./auth";

const SUPABASE_URL = "https://sukjcsylkljiyvfklxvj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_y7LKtWICauXvyWo6Aa9pSA_ylMUg845";

export const DEFAULT_TASK_TEMPLATES: TaskTemplateRecord[] = [
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

export const INITIAL_MOBILE_TASKS: TaskRecord[] = [
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
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
  {
    id: "tsk-002",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    suite: "crm",
    title: "Enviar cotización comercial ajustada",
    description: "Aplicar descuento del 8% autorizado por dirección de cuentas corporativas",
    status: "open",
    priority: "high",
    assignedUserId: "usr-mario",
    assignedUser: { id: "usr-mario", displayName: "Mario Rivera" },
    dueAt: new Date(Date.now() + 3600 * 1000 * 4).toISOString(), // in 4 hours (Today)
    relation: { entityType: "contact", entityId: "con-valeria-soto", label: "Valeria Soto · Cemento & Acero" },
    templateId: "tpl-crm-quote",
    checklist: [
      { id: "chk-21", title: "Recalcular cotización con 8% desc", completed: false },
      { id: "chk-22", title: "Generar PDF oficial Rivera", completed: false },
    ],
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
  {
    id: "tsk-003",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    suite: "crm",
    title: "Demo de plataforma y módulos ERP",
    description: "Preparar presentación interactiva con datos de prueba de nómina y facturación",
    status: "open",
    priority: "normal",
    assignedUserId: "usr-diego",
    assignedUser: { id: "usr-diego", displayName: "Diego Torres" },
    dueAt: new Date(Date.now() + 3600 * 1000 * 28).toISOString(), // Tomorrow
    relation: { entityType: "contact", entityId: "con-juan-perez", label: "Juan Pérez · Tech Solutions" },
    templateId: "tpl-crm-demo",
    checklist: [
      { id: "chk-31", title: "Verificar credenciales de sandbox", completed: true, completedAt: new Date().toISOString() },
      { id: "chk-32", title: "Configurar sala de Google Meet", completed: false },
    ],
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
  {
    id: "tsk-004",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    suite: "crm",
    title: "Validar documentación de KYC para onboarding",
    description: "Verificar documento de identidad y certificado de personería jurídica",
    status: "completed",
    priority: "low",
    assignedUserId: "usr-ana",
    assignedUser: { id: "usr-ana", displayName: "Ana Mora" },
    dueAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    completedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    relation: { entityType: "contact", entityId: "con-carlos-gomez", label: "Carlos Gómez" },
    checklist: [
      { id: "chk-41", title: "Descargar RUT y CC", completed: true, completedAt: new Date().toISOString() },
      { id: "chk-42", title: "Validar en centrales de riesgo", completed: true, completedAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    version: 2,
  },
];

let memoryTasks: TaskRecord[] = [...INITIAL_MOBILE_TASKS];

export const localMobileTasksAdapter: TasksPort = {
  async listTasks(params: TaskListParams): Promise<TasksPage> {
    let filtered = [...memoryTasks];

    if (params.suite) {
      filtered = filtered.filter((t) => t.suite === params.suite);
    }
    if (params.relation) {
      filtered = filtered.filter(
        (t) =>
          t.relation?.entityType === params.relation?.entityType &&
          t.relation?.entityId === params.relation?.entityId,
      );
    }
    if (params.status && params.status.length > 0) {
      filtered = filtered.filter((t) => params.status!.includes(t.status));
    }
    if (params.priority && params.priority.length > 0) {
      filtered = filtered.filter((t) => params.priority!.includes(t.priority));
    }
    if (params.assignedUserId) {
      filtered = filtered.filter((t) => t.assignedUserId === params.assignedUserId);
    }
    if (params.query) {
      const q = params.query.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.relation?.label && t.relation.label.toLowerCase().includes(q)),
      );
    }

    if (params.dueFilter) {
      const now = Date.now();
      if (params.dueFilter === "overdue") {
        filtered = filtered.filter(
          (t) => t.dueAt && new Date(t.dueAt).getTime() < now && t.status !== "completed",
        );
      } else if (params.dueFilter === "today") {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        filtered = filtered.filter((t) => {
          if (!t.dueAt) return false;
          const d = new Date(t.dueAt).getTime();
          return d >= startOfToday.getTime() && d <= endOfToday.getTime();
        });
      } else if (params.dueFilter === "no_due") {
        filtered = filtered.filter((t) => !t.dueAt);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      // open first, completed last
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      // then by due date asc
      const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
      const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
      return aDue - bDue;
    });

    const limit = params.limit || 50;
    const items = filtered.slice(0, limit);

    return {
      items,
      nextCursor: null,
      hasMore: filtered.length > limit,
      total: filtered.length,
    };
  },

  async getTask(taskId: string): Promise<TaskRecord | null> {
    const task = memoryTasks.find((t) => t.id === taskId);
    return task ? JSON.parse(JSON.stringify(task)) : null;
  },

  async createTask(input: CreateTaskInput): Promise<TaskMutationResult> {
    if (!input.title || !input.title.trim()) {
      return { status: "validation-error", message: "Task title is required" };
    }

    const newTask: TaskRecord = {
      id: `tsk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      organizationId: input.organizationId || "80fce911-57c5-4a83-809f-78df6a3736f7",
      workspaceId: input.workspaceId || null,
      suite: input.suite || "crm",
      title: input.title.trim(),
      description: input.description || null,
      status: "open",
      priority: input.priority || "normal",
      assignedUserId: input.assignedUserId || null,
      assignedUser: input.assignedUser || null,
      dueAt: input.dueAt || null,
      relation: input.relation || null,
      templateId: input.templateId || null,
      checklist:
        input.checklist?.map((c, i) => ({
          id: c.id || `chk-${Date.now()}-${i}`,
          title: c.title,
          completed: !!c.completed,
          completedAt: c.completed ? new Date().toISOString() : null,
        })) || [],
      mentions: input.mentions || [],
      reminders: input.reminders || [],
      tags: input.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    memoryTasks = [newTask, ...memoryTasks];
    return { status: "success", task: newTask };
  },

  async updateTask(
    taskId: string,
    patch: UpdateTaskPatch,
    expectedVersion?: number,
  ): Promise<TaskMutationResult> {
    const index = memoryTasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      return { status: "server-error", message: "Task not found" };
    }

    const current = memoryTasks[index];
    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      return { status: "conflict", message: "Task was updated by another user", task: current };
    }

    const updated: TaskRecord = {
      ...current,
      ...patch,
      title: patch.title !== undefined ? patch.title.trim() : current.title,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    };

    memoryTasks[index] = updated;
    return { status: "success", task: updated };
  },

  async completeTask(taskId: string, expectedVersion?: number): Promise<TaskMutationResult> {
    const index = memoryTasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      return { status: "server-error", message: "Task not found" };
    }

    const current = memoryTasks[index];
    const updated: TaskRecord = {
      ...current,
      status: "completed",
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    };

    memoryTasks[index] = updated;
    return { status: "success", task: updated };
  },

  async reopenTask(taskId: string, expectedVersion?: number): Promise<TaskMutationResult> {
    const index = memoryTasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      return { status: "server-error", message: "Task not found" };
    }

    const current = memoryTasks[index];
    const updated: TaskRecord = {
      ...current,
      status: "open",
      completedAt: null,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    };

    memoryTasks[index] = updated;
    return { status: "success", task: updated };
  },

  async quickReschedule(
    taskId: string,
    newDueAt: string,
    expectedVersion?: number,
  ): Promise<TaskMutationResult> {
    const index = memoryTasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      return { status: "server-error", message: "Task not found" };
    }

    const current = memoryTasks[index];
    const updated: TaskRecord = {
      ...current,
      dueAt: newDueAt,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    };

    memoryTasks[index] = updated;
    return { status: "success", task: updated };
  },

  async toggleChecklistItem(
    taskId: string,
    itemId: string,
    completed: boolean,
  ): Promise<TaskMutationResult> {
    const index = memoryTasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      return { status: "server-error", message: "Task not found" };
    }

    const current = memoryTasks[index];
    const checklist = (current.checklist || []).map((item) =>
      item.id === itemId
        ? {
            ...item,
            completed,
            completedAt: completed ? new Date().toISOString() : null,
          }
        : item,
    );

    const updated: TaskRecord = {
      ...current,
      checklist,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    };

    memoryTasks[index] = updated;
    return { status: "success", task: updated };
  },

  async addChecklistItem(taskId: string, title: string): Promise<TaskMutationResult> {
    const index = memoryTasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      return { status: "server-error", message: "Task not found" };
    }

    const current = memoryTasks[index];
    const newItem = {
      id: `chk-mob-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      completed: false,
    };
    const checklist = [...(current.checklist || []), newItem];

    const updated: TaskRecord = {
      ...current,
      checklist,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    };

    memoryTasks[index] = updated;
    return { status: "success", task: updated };
  },

  async deleteChecklistItem(taskId: string, itemId: string): Promise<TaskMutationResult> {
    const index = memoryTasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      return { status: "server-error", message: "Task not found" };
    }

    const current = memoryTasks[index];
    const checklist = (current.checklist || []).filter((item) => item.id !== itemId);

    const updated: TaskRecord = {
      ...current,
      checklist,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    };

    memoryTasks[index] = updated;
    return { status: "success", task: updated };
  },

  async deleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    const index = memoryTasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      return { success: false, error: "Task not found" };
    }
    memoryTasks = memoryTasks.filter((t) => t.id !== taskId);
    return { success: true };
  },

  async listTemplates(
    organizationId: string,
    suite?: PlatformSuiteKey,
  ): Promise<TaskTemplateRecord[]> {
    if (!suite) return DEFAULT_TASK_TEMPLATES;
    return DEFAULT_TASK_TEMPLATES.filter((t) => t.suite === suite);
  },
};

export const mobileTasksAdapter: TasksPort = localMobileTasksAdapter;
