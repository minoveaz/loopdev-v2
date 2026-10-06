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
import { mobileSupabaseClient } from "./supabase";
import { enqueueOfflineMutation, registerOfflineMutationHandler } from "./offlineQueue";

const SUPABASE_URL = "https://sukjcsylkljiyvfklxvj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_y7LKtWICauXvyWo6Aa9pSA_ylMUg845";

const DEMO_TASK_TEMPLATES: TaskTemplateRecord[] = [
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

const DEMO_INITIAL_MOBILE_TASKS: TaskRecord[] = [
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

export const DEFAULT_TASK_TEMPLATES: TaskTemplateRecord[] = [];
export const INITIAL_MOBILE_TASKS: TaskRecord[] = [];
const LOCAL_TASKS_STORAGE_KEY = "loopdev_mobile_tasks_cache";

function readStoredTasks(): TaskRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_TASKS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistTasks(tasks: TaskRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Memory remains the fallback when local persistence is unavailable.
  }
}

let memoryTasks: TaskRecord[] = readStoredTasks();
let replayingQueuedTask = false;

export const localMobileTasksAdapter: TasksPort = {
  async listTasks(params: TaskListParams): Promise<TasksPage> {
    let filtered = [...memoryTasks];

    filtered = filtered.filter((task) => task.organizationId === params.organizationId);
    if (params.workspaceId !== undefined) {
      filtered = filtered.filter((task) => (task.workspaceId ?? null) === (params.workspaceId ?? null));
    }
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
    persistTasks(memoryTasks);
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

function mapRemoteTask(row: Record<string, any>): TaskRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    workspaceId: row.workspace_id ?? null,
    suite: row.suite ?? "crm",
    title: row.title,
    description: row.description ?? null,
    status: row.status === "pending" ? "open" : row.status,
    priority: row.priority === "medium" ? "normal" : row.priority,
    ownerId: row.owner_id ?? null,
    assignedUserId: row.assigned_user_id ?? null,
    assignedUser: row.assigned_user ?? null,
    dueAt: row.due_at ?? null,
    completedAt: row.completed_at ?? null,
    relation: row.relation_type ? { entityType: row.relation_type, entityId: row.relation_id, label: row.relation_label } : null,
    templateId: row.template_id ?? null,
    checklist: row.checklist ?? [],
    mentions: row.mentions ?? [],
    reminders: row.reminders ?? [],
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version ?? 1,
  };
}

function activeOrganizationId(input?: string): string {
  return input || mobileTenantContextAdapter.getTenantContext()?.activeOrganizationId || "";
}

function taskCacheKey(params: TaskListParams, organizationId: string): string {
  return `loopdev_mobile_tasks:${organizationId}:${params.suite ?? "all"}:${params.relation?.entityType ?? ""}:${params.relation?.entityId ?? ""}`;
}

function readTaskCache(key: string): TaskRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTaskCache(key: string, items: TaskRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Remote data remains the source of truth when local storage is unavailable.
  }
}

async function remoteTaskMutation(
  taskId: string,
  patch: Record<string, unknown>,
  expectedVersion?: number,
): Promise<TaskMutationResult> {
  const organizationId = activeOrganizationId();
  if (!organizationId) return { status: "server-error", message: "No active organization." };
  const current = await mobileSupabaseClient.from("crm_tasks").select("*").eq("id", taskId).eq("organization_id", organizationId).maybeSingle();
  if (current.error) return { status: "server-error", message: current.error.message };
  if (!current.data) return { status: "server-error", message: "Task not found." };
  const version = Number(current.data.version ?? 1);
  if (expectedVersion !== undefined && version !== expectedVersion) {
    return { status: "conflict", message: "Task was updated by another user.", task: mapRemoteTask(current.data) };
  }
  const result = await mobileSupabaseClient.from("crm_tasks")
    .update({ ...patch, version: version + 1, updated_at: new Date().toISOString() })
    .eq("id", taskId).eq("organization_id", current.data.organization_id).eq("version", version)
    .select().single();
  if (result.error || !result.data) return { status: "server-error", message: result.error?.message ?? "Task update failed." };
  return { status: "success", task: mapRemoteTask(result.data) };
}

export const mobileTasksAdapter: TasksPort = {
  async listTasks(params) {
    const organizationId = activeOrganizationId(params.organizationId);
    if (!organizationId) return { items: [], nextCursor: null, hasMore: false, total: 0 };
    const cacheKey = taskCacheKey(params, organizationId);
    let query = mobileSupabaseClient.from("crm_tasks").select("*").eq("organization_id", organizationId);
    if (params.workspaceId) query = query.eq("workspace_id", params.workspaceId);
    if (params.suite) query = query.eq("suite", params.suite);
    if (params.relation) query = query.eq("relation_type", params.relation.entityType).eq("relation_id", params.relation.entityId);
    if (params.assignedUserId) query = query.eq("assigned_user_id", params.assignedUserId);
    if (params.status?.length) query = query.in("status", params.status.map((status) => status === "open" ? "open" : status));
    if (params.priority?.length) query = query.in("priority", params.priority.map((priority) => priority === "normal" ? "normal" : priority));
    if (params.query?.trim()) query = query.ilike("title", `%${params.query.trim()}%`);
    const { data, error } = await query.order(params.sortBy === "created_at" ? "created_at" : "due_at", { ascending: params.sortDirection !== "desc", nullsFirst: false });
    if (error) {
      const cached = readTaskCache(cacheKey);
      if (cached.length > 0) return { items: cached, nextCursor: null, hasMore: false, total: cached.length };
      return localMobileTasksAdapter.listTasks(params);
    }
    const items = (data ?? []).map(mapRemoteTask);
    memoryTasks = [...items, ...memoryTasks.filter((task) => !items.some((item) => item.id === task.id))];
    persistTasks(memoryTasks);
    writeTaskCache(cacheKey, items);
    return { items, nextCursor: null, hasMore: false, total: items.length };
  },
  async getTask(taskId) {
    const { data, error } = await mobileSupabaseClient.from("crm_tasks").select("*").eq("id", taskId).maybeSingle();
    if (error) return null;
    if (!data) return null;
    return mapRemoteTask(data);
  },
  async createTask(input) {
    if (!input.title.trim()) return { status: "validation-error", message: "Task title is required." };
    const row = {
      organization_id: activeOrganizationId(input.organizationId), workspace_id: input.workspaceId ?? null,
      suite: input.suite ?? "crm", title: input.title.trim(), description: input.description ?? null,
      status: input.status ?? "open", priority: input.priority ?? "normal", assigned_user_id: input.assignedUserId ?? null,
      assigned_user: input.assignedUser ?? null, due_at: input.dueAt ?? null,
      relation_type: input.relation?.entityType ?? null, relation_id: input.relation?.entityId ?? null, relation_label: input.relation?.label ?? null,
      template_id: input.templateId ?? null, checklist: input.checklist ?? [], mentions: input.mentions ?? [], reminders: input.reminders ?? [], tags: input.tags ?? [], version: 1,
    };
    const { data, error } = await mobileSupabaseClient.from("crm_tasks").insert(row).select().single();
    if (error || !data) {
      if (replayingQueuedTask) return { status: "server-error", message: error?.message ?? "Task creation failed." };
      const fallback = await localMobileTasksAdapter.createTask(input);
      if (fallback.status === "success") enqueueOfflineMutation("tasks.create", input);
      return fallback;
    }
    return { status: "success", task: mapRemoteTask(data) };
  },
  async updateTask(taskId, patch, expectedVersion) {
    const updates: Record<string, unknown> = {};
    Object.entries(patch).forEach(([key, value]) => {
      const column = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      updates[column] = value;
    });
    const result = await remoteTaskMutation(taskId, updates, expectedVersion);
    if (result.status === "server-error" && !replayingQueuedTask) {
      const fallback = await localMobileTasksAdapter.updateTask(taskId, patch, expectedVersion);
      if (fallback.status === "success") enqueueOfflineMutation("tasks.update", { taskId, patch, expectedVersion });
      return fallback;
    }
    return result;
  },
  async completeTask(taskId, expectedVersion) {
    const result = await remoteTaskMutation(taskId, { status: "completed", completed_at: new Date().toISOString() }, expectedVersion);
    return result;
  },
  async reopenTask(taskId, expectedVersion) {
    const result = await remoteTaskMutation(taskId, { status: "open", completed_at: null }, expectedVersion);
    return result;
  },
  async quickReschedule(taskId, newDueAt, expectedVersion) {
    const result = await remoteTaskMutation(taskId, { due_at: newDueAt }, expectedVersion);
    return result;
  },
  async toggleChecklistItem(taskId, itemId, completed) {
    const task = await mobileTasksAdapter.getTask(taskId);
    if (!task) return { status: "server-error", message: "Task not found." };
    const result = await remoteTaskMutation(taskId, { checklist: (task.checklist ?? []).map((item) => item.id === itemId ? { ...item, completed, completedAt: completed ? new Date().toISOString() : null } : item) }, task.version);
    return result;
  },
  async addChecklistItem(taskId, title) {
    const task = await mobileTasksAdapter.getTask(taskId);
    if (!task) return { status: "server-error", message: "Task not found." };
    const item = { id: `chk-${Date.now()}`, title: title.trim(), completed: false, assigneeId: null, assignee: null };
    const result = await remoteTaskMutation(taskId, { checklist: [...(task.checklist ?? []), item] }, task.version);
    return result;
  },
  async deleteChecklistItem(taskId, itemId) {
    const task = await mobileTasksAdapter.getTask(taskId);
    if (!task) return { status: "server-error", message: "Task not found." };
    const result = await remoteTaskMutation(taskId, { checklist: (task.checklist ?? []).filter((item) => item.id !== itemId) }, task.version);
    return result;
  },
  async deleteTask(taskId) {
    const { error } = await mobileSupabaseClient.from("crm_tasks").delete().eq("id", taskId);
    if (error) {
      if (replayingQueuedTask) return { success: false, error: error.message };
      const fallback = await localMobileTasksAdapter.deleteTask(taskId);
      if (fallback.success) enqueueOfflineMutation("tasks.delete", { taskId });
      return fallback;
    }
    return { success: true };
  },
  async listTemplates(organizationId, suite) {
    return DEFAULT_TASK_TEMPLATES.filter((template) => template.organizationId === organizationId && (!suite || template.suite === suite));
  },
};

registerOfflineMutationHandler("tasks.create", async (payload) => {
  replayingQueuedTask = true;
  try {
    const result = await mobileTasksAdapter.createTask(payload as CreateTaskInput);
    if (result.status !== "success") throw new Error(result.message ?? "Task replay failed.");
  } finally {
    replayingQueuedTask = false;
  }
});

registerOfflineMutationHandler("tasks.update", async (payload) => {
  const operation = payload as { taskId: string; patch: UpdateTaskPatch; expectedVersion?: number };
  replayingQueuedTask = true;
  try {
    const result = await mobileTasksAdapter.updateTask(operation.taskId, operation.patch, operation.expectedVersion);
    if (result.status !== "success") throw new Error(result.message ?? "Task update replay failed.");
  } finally {
    replayingQueuedTask = false;
  }
});

registerOfflineMutationHandler("tasks.delete", async (payload) => {
  const operation = payload as { taskId: string };
  replayingQueuedTask = true;
  try {
    const result = await mobileTasksAdapter.deleteTask(operation.taskId);
    if (!result.success) throw new Error(result.error ?? "Task delete replay failed.");
  } finally {
    replayingQueuedTask = false;
  }
});
