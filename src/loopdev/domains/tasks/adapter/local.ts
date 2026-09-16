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
} from "../types";

export const LOCAL_TASKS_STORAGE_KEY = "loopdev.platform-tasks.v1";
export const LOCAL_TASKS_ORGANIZATION_ID = "local-development-organization";
const STORAGE_VERSION = 1;

export const DEFAULT_TASK_TEMPLATES: TaskTemplateRecord[] = [
  {
    id: "tpl-crm-call",
    organizationId: LOCAL_TASKS_ORGANIZATION_ID,
    suite: "crm",
    key: "sales_call",
    name: "Llamada Comercial de Cierre",
    description: "Seguimiento telefónico con prospecto o tomador de decisión",
    defaultPriority: "urgent",
    defaultDueDays: 1,
    relationTypes: ["contact", "lead", "opportunity"],
    defaultChecklist: ["Revisar historial de conversaciones", "Presentar ajuste de propuesta", "Confirmar fecha de firma"],
    status: "active",
  },
  {
    id: "tpl-crm-quote",
    organizationId: LOCAL_TASKS_ORGANIZATION_ID,
    suite: "crm",
    key: "send_quote",
    name: "Envío de Cotización Formal",
    description: "Preparar y remitir propuesta económica formal",
    defaultPriority: "high",
    defaultDueDays: 2,
    relationTypes: ["contact", "lead", "opportunity"],
    defaultChecklist: ["Validar cálculo de prima/margen", "Adjuntar anexo técnico PDF", "Configurar recordatorio a 48h"],
    status: "active",
  },
  {
    id: "tpl-crm-demo",
    organizationId: LOCAL_TASKS_ORGANIZATION_ID,
    suite: "crm",
    key: "platform_demo",
    name: "Demostración de Plataforma",
    description: "Sesión técnica demostrativa con equipo de cliente",
    defaultPriority: "normal",
    defaultDueDays: 3,
    relationTypes: ["contact", "lead", "opportunity"],
    defaultChecklist: ["Configurar sandbox de staging", "Enviar invitación de calendario", "Registrar feedback post-demo"],
    status: "active",
  },
  {
    id: "tpl-ops-policy",
    organizationId: LOCAL_TASKS_ORGANIZATION_ID,
    suite: "operations",
    key: "issue_policy",
    name: "Emisión de Póliza",
    description: "Trámite y radicación de póliza con aseguradora",
    defaultPriority: "high",
    defaultDueDays: 2,
    relationTypes: ["contact", "opportunity", "contract"],
    defaultChecklist: ["Validar soporte de pago", "Radicar ante compañía aseguradora", "Notificar al asegurado"],
    status: "active",
  },
];

export const SEED_TASKS: TaskRecord[] = [
  {
    id: "tsk-001",
    organizationId: LOCAL_TASKS_ORGANIZATION_ID,
    suite: "crm",
    title: "Llamada cierre de póliza colectiva",
    description: "Revisar cláusula de cobertura antes del envío final",
    status: "open",
    priority: "urgent",
    assignedUserId: "usr-ana",
    assignedUser: { id: "usr-ana", displayName: "Ana Mora" },
    dueAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), // 2h ago (Overdue)
    relation: { entityType: "contact", entityId: "con-carlos-gomez", label: "Carlos Gómez" },
    templateId: "tpl-crm-call",
    checklist: [
      { id: "chk-1", title: "Revisar términos de prima", completed: true, completedAt: new Date().toISOString() },
      { id: "chk-2", title: "Aprobar con gerencia financiera", completed: true, completedAt: new Date().toISOString() },
      { id: "chk-3", title: "Enviar documento final para firma", completed: false },
    ],
    mentions: [{ userId: "usr-mario", displayName: "Mario Rivera", email: "mario@example.com" }],
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
  {
    id: "tsk-002",
    organizationId: LOCAL_TASKS_ORGANIZATION_ID,
    suite: "crm",
    title: "Enviar cotización comercial ajustada",
    description: "Plantilla: Envío de Cotización • Adjuntar desglose de primas",
    status: "open",
    priority: "high",
    assignedUserId: "usr-juan",
    assignedUser: { id: "usr-juan", displayName: "Juan Pérez" },
    dueAt: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(), // Today 17:00
    relation: { entityType: "contact", entityId: "con-techsolutions", label: "TechSolutions" },
    templateId: "tpl-crm-quote",
    checklist: [
      { id: "chk-4", title: "Validar cálculo de prima", completed: false },
      { id: "chk-5", title: "Adjuntar PDF", completed: false },
    ],
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
  {
    id: "tsk-003",
    organizationId: LOCAL_TASKS_ORGANIZATION_ID,
    suite: "crm",
    title: "Reunión de alineación inicial",
    description: "Revisión de requerimientos de seguridad ISO",
    status: "completed",
    priority: "normal",
    assignedUserId: "usr-juan",
    assignedUser: { id: "usr-juan", displayName: "Juan Pérez" },
    dueAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    completedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    relation: { entityType: "contact", entityId: "con-laura-restrepo", label: "Laura Restrepo" },
    createdAt: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    version: 2,
  },
];

interface PersistedTasksData {
  version: number;
  tasks: TaskRecord[];
  templates: TaskTemplateRecord[];
}

export class LocalTasksAdapter implements TasksPort {
  private inMemoryTasks: TaskRecord[] = [...SEED_TASKS];
  private inMemoryTemplates: TaskTemplateRecord[] = [...DEFAULT_TASK_TEMPLATES];

  private loadData(): PersistedTasksData {
    if (typeof window === "undefined" || !window.localStorage) {
      return { version: STORAGE_VERSION, tasks: this.inMemoryTasks, templates: this.inMemoryTemplates };
    }
    try {
      const raw = window.localStorage.getItem(LOCAL_TASKS_STORAGE_KEY);
      if (!raw) {
        const initial: PersistedTasksData = {
          version: STORAGE_VERSION,
          tasks: this.inMemoryTasks,
          templates: this.inMemoryTemplates,
        };
        window.localStorage.setItem(LOCAL_TASKS_STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(raw) as PersistedTasksData;
      return parsed;
    } catch {
      return { version: STORAGE_VERSION, tasks: this.inMemoryTasks, templates: this.inMemoryTemplates };
    }
  }

  private saveData(data: PersistedTasksData): void {
    this.inMemoryTasks = data.tasks;
    this.inMemoryTemplates = data.templates;
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(LOCAL_TASKS_STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Fallback in memory
      }
    }
  }

  async listTasks(params: TaskListParams): Promise<TasksPage> {
    const data = this.loadData();
    let filtered = data.tasks.filter((t) => t.organizationId === (params.organizationId || LOCAL_TASKS_ORGANIZATION_ID));

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
    if (params.dueFilter) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const endOfToday = startOfToday + 86400 * 1000;

      if (params.dueFilter === "overdue") {
        filtered = filtered.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now.getTime() && t.status !== "completed");
      } else if (params.dueFilter === "today") {
        filtered = filtered.filter((t) => {
          if (!t.dueAt) return false;
          const due = new Date(t.dueAt).getTime();
          return due >= startOfToday && due <= endOfToday;
        });
      } else if (params.dueFilter === "upcoming") {
        filtered = filtered.filter((t) => t.dueAt && new Date(t.dueAt).getTime() > endOfToday);
      } else if (params.dueFilter === "no_due") {
        filtered = filtered.filter((t) => !t.dueAt);
      }
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.relation?.label?.toLowerCase().includes(q),
      );
    }

    const total = filtered.length;
    return {
      items: filtered,
      nextCursor: null,
      hasMore: false,
      total,
    };
  }

  async getTask(taskId: string): Promise<TaskRecord | null> {
    const data = this.loadData();
    return data.tasks.find((t) => t.id === taskId) || null;
  }

  async createTask(input: CreateTaskInput): Promise<TaskMutationResult> {
    if (!input.title || input.title.trim() === "") {
      return { status: "validation-error", message: "El título de la tarea es requerido" };
    }

    const data = this.loadData();
    const newTask: TaskRecord = {
      id: `tsk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organizationId: input.organizationId || LOCAL_TASKS_ORGANIZATION_ID,
      workspaceId: input.workspaceId || null,
      suite: input.suite || "crm",
      title: input.title.trim(),
      description: input.description || null,
      status: "open",
      priority: input.priority || "normal",
      assignedUserId: input.assignedUserId || null,
      assignedUser: input.assignedUser || null,
      dueAt: input.dueAt || null,
      completedAt: null,
      relation: input.relation || null,
      templateId: input.templateId || null,
      checklist: (input.checklist || []).map((c, idx) => ({
        id: c.id || `chk-${Date.now()}-${idx}`,
        title: c.title,
        completed: !!c.completed,
      })),
      mentions: input.mentions || [],
      reminders: input.reminders || [],
      tags: input.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    data.tasks.unshift(newTask);
    this.saveData(data);
    return { status: "success", task: newTask };
  }

  async updateTask(taskId: string, patch: UpdateTaskPatch, expectedVersion?: number): Promise<TaskMutationResult> {
    const data = this.loadData();
    const index = data.tasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      return { status: "validation-error", message: "Tarea no encontrada" };
    }

    const existing = data.tasks[index];
    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      return { status: "conflict", message: "La tarea ha sido modificada concurrentemente", task: existing };
    }

    const updated: TaskRecord = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
      version: existing.version + 1,
    };

    data.tasks[index] = updated;
    this.saveData(data);
    return { status: "success", task: updated };
  }

  async completeTask(taskId: string, expectedVersion?: number): Promise<TaskMutationResult> {
    const data = this.loadData();
    const existing = data.tasks.find((t) => t.id === taskId);
    if (!existing) return { status: "validation-error", message: "Tarea no encontrada" };

    return this.updateTask(
      taskId,
      {
        status: "completed",
      },
      expectedVersion,
    ).then((res) => {
      if (res.status === "success") {
        res.task.completedAt = new Date().toISOString();
      }
      return res;
    });
  }

  async reopenTask(taskId: string, expectedVersion?: number): Promise<TaskMutationResult> {
    return this.updateTask(
      taskId,
      {
        status: "open",
      },
      expectedVersion,
    );
  }

  async quickReschedule(taskId: string, newDueAt: string, expectedVersion?: number): Promise<TaskMutationResult> {
    return this.updateTask(
      taskId,
      {
        dueAt: newDueAt,
      },
      expectedVersion,
    );
  }

  async toggleChecklistItem(taskId: string, itemId: string, completed: boolean): Promise<TaskMutationResult> {
    const data = this.loadData();
    const existing = data.tasks.find((t) => t.id === taskId);
    if (!existing) return { status: "validation-error", message: "Tarea no encontrada" };

    const checklist = (existing.checklist || []).map((item) =>
      item.id === itemId
        ? { ...item, completed, completedAt: completed ? new Date().toISOString() : null }
        : item,
    );

    return this.updateTask(taskId, { checklist });
  }

  async addChecklistItem(taskId: string, title: string): Promise<TaskMutationResult> {
    const data = this.loadData();
    const existing = data.tasks.find((t) => t.id === taskId);
    if (!existing) return { status: "validation-error", message: "Tarea no encontrada" };

    const newItem = {
      id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      completed: false,
    };
    const checklist = [...(existing.checklist || []), newItem];
    return this.updateTask(taskId, { checklist });
  }

  async deleteChecklistItem(taskId: string, itemId: string): Promise<TaskMutationResult> {
    const data = this.loadData();
    const existing = data.tasks.find((t) => t.id === taskId);
    if (!existing) return { status: "validation-error", message: "Tarea no encontrada" };

    const checklist = (existing.checklist || []).filter((item) => item.id !== itemId);
    return this.updateTask(taskId, { checklist });
  }

  async deleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    const data = this.loadData();
    const initialLen = data.tasks.length;
    data.tasks = data.tasks.filter((t) => t.id !== taskId);
    this.saveData(data);
    return { success: data.tasks.length < initialLen };
  }

  async listTemplates(organizationId: string, suite?: PlatformSuiteKey): Promise<TaskTemplateRecord[]> {
    const data = this.loadData();
    let templates = data.templates.filter((t) => t.status === "active");
    if (suite) {
      templates = templates.filter((t) => t.suite === suite);
    }
    return templates;
  }
}
