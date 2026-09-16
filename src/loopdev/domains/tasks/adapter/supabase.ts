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
import { LocalTasksAdapter } from "./local";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import type { AuthSession } from "@/types";

export interface SupabaseTasksAdapterOptions {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  getAuthToken?: () => string | null | undefined;
  organizationId?: string;
  fetchFn?: typeof fetch;
}

const isUUID = (str?: string | null): boolean =>
  typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  return (
    storage.get<AuthSession | null>(STORAGE_KEYS.session, null) ||
    (() => {
      try {
        const raw = window.localStorage.getItem("loopdev:auth-session");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })()
  );
}

function getCurrentOrgId(explicit?: string): string {
  if (explicit) return explicit;
  const session = getStoredSession();
  if (session?.activeOrganizationId && isUUID(session.activeOrganizationId)) {
    return session.activeOrganizationId;
  }
  if (Array.isArray(session?.organizations) && session.organizations.length > 0) {
    const valid = session.organizations.find((o: any) => isUUID(o.id));
    if (valid) return valid.id;
  }
  return "80fce911-57c5-4a83-809f-78df6a3736f7";
}

export class SupabaseTasksAdapter implements TasksPort {
  private localFallback = new LocalTasksAdapter();
  private baseUrl: string;
  private anonKey: string;
  private fetchFn: typeof fetch;

  constructor(options: SupabaseTasksAdapterOptions = {}) {
    this.baseUrl = (options.supabaseUrl || (import.meta as any).env?.VITE_SUPABASE_URL || "").replace(/\/$/, "");
    this.anonKey = options.supabaseAnonKey || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";
    this.fetchFn = options.fetchFn || (typeof window !== "undefined" ? window.fetch.bind(window) : globalThis.fetch);
  }

  private isConfigured(): boolean {
    return Boolean(this.baseUrl && this.anonKey);
  }

  private getHeaders(authToken?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      apikey: this.anonKey,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
    const session = getStoredSession();
    const token = authToken || session?.accessToken;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      headers.Authorization = `Bearer ${this.anonKey}`;
    }
    return headers;
  }

  async listTasks(params: TaskListParams): Promise<TasksPage> {
    if (!this.isConfigured()) {
      return this.localFallback.listTasks(params);
    }

    try {
      const orgId = getCurrentOrgId(params.organizationId);
      let query = `${this.baseUrl}/rest/v1/crm_tasks?select=*&organization_id=eq.${orgId}`;

      if (params.suite) {
        query += `&suite=eq.${params.suite}`;
      }
      if (params.relation) {
        query += `&relation_type=eq.${params.relation.entityType}&relation_id=eq.${params.relation.entityId}`;
      }
      if (params.assignedUserId) {
        query += `&assigned_user_id=eq.${params.assignedUserId}`;
      }
      query += `&order=created_at.desc`;

      const response = await this.fetchFn(query, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return this.localFallback.listTasks(params);
      }

      const rows: any[] = await response.json();
      const items: TaskRecord[] = rows.map((row) => ({
        id: row.id,
        organizationId: row.organization_id,
        workspaceId: row.workspace_id,
        suite: row.suite || "crm",
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        ownerId: row.owner_id,
        assignedUserId: row.assigned_user_id,
        assignedUser: row.assigned_user ? (typeof row.assigned_user === "string" ? JSON.parse(row.assigned_user) : row.assigned_user) : null,
        dueAt: row.due_at,
        completedAt: row.completed_at,
        relation: row.relation_type
          ? { entityType: row.relation_type, entityId: row.relation_id, label: row.relation_label }
          : null,
        templateId: row.template_id,
        checklist: row.checklist ? (typeof row.checklist === "string" ? JSON.parse(row.checklist) : row.checklist) : [],
        mentions: row.mentions ? (typeof row.mentions === "string" ? JSON.parse(row.mentions) : row.mentions) : [],
        reminders: row.reminders ? (typeof row.reminders === "string" ? JSON.parse(row.reminders) : row.reminders) : [],
        tags: row.tags || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        version: row.version || 1,
      }));

      return {
        items,
        nextCursor: null,
        hasMore: false,
        total: items.length,
      };
    } catch {
      return this.localFallback.listTasks(params);
    }
  }

  async getTask(taskId: string): Promise<TaskRecord | null> {
    if (!this.isConfigured()) return this.localFallback.getTask(taskId);

    try {
      const response = await this.fetchFn(`${this.baseUrl}/rest/v1/crm_tasks?id=eq.${taskId}&select=*`, {
        method: "GET",
        headers: this.getHeaders(),
      });
      if (!response.ok) return this.localFallback.getTask(taskId);

      const rows: any[] = await response.json();
      if (rows.length === 0) return null;
      const data = rows[0];

      return {
        id: data.id,
        organizationId: data.organization_id,
        workspaceId: data.workspace_id,
        suite: data.suite || "crm",
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        ownerId: data.owner_id,
        assignedUserId: data.assigned_user_id,
        assignedUser: data.assigned_user ? (typeof data.assigned_user === "string" ? JSON.parse(data.assigned_user) : data.assigned_user) : null,
        dueAt: data.due_at,
        completedAt: data.completed_at,
        relation: data.relation_type
          ? { entityType: data.relation_type, entityId: data.relation_id, label: data.relation_label }
          : null,
        templateId: data.template_id,
        checklist: data.checklist ? (typeof data.checklist === "string" ? JSON.parse(data.checklist) : data.checklist) : [],
        mentions: data.mentions ? (typeof data.mentions === "string" ? JSON.parse(data.mentions) : data.mentions) : [],
        reminders: data.reminders ? (typeof data.reminders === "string" ? JSON.parse(data.reminders) : data.reminders) : [],
        tags: data.tags || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        version: data.version || 1,
      };
    } catch {
      return this.localFallback.getTask(taskId);
    }
  }

  async createTask(input: CreateTaskInput): Promise<TaskMutationResult> {
    if (!this.isConfigured()) return this.localFallback.createTask(input);

    try {
      const orgId = getCurrentOrgId(input.organizationId);
      const row = {
        organization_id: orgId,
        workspace_id: input.workspaceId || null,
        suite: input.suite || "crm",
        title: input.title,
        description: input.description || null,
        status: "open",
        priority: input.priority || "normal",
        assigned_user_id: input.assignedUserId || null,
        assigned_user: input.assignedUser ? JSON.stringify(input.assignedUser) : null,
        due_at: input.dueAt || null,
        relation_type: input.relation?.entityType || null,
        relation_id: input.relation?.entityId || null,
        relation_label: input.relation?.label || null,
        template_id: input.templateId || null,
        checklist: input.checklist || [],
        mentions: input.mentions || [],
        reminders: input.reminders || [],
        tags: input.tags || [],
        version: 1,
      };

      const response = await this.fetchFn(`${this.baseUrl}/rest/v1/crm_tasks`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(row),
      });

      if (!response.ok) {
        return this.localFallback.createTask(input);
      }

      const rows: any[] = await response.json();
      const data = rows[0];

      return {
        status: "success",
        task: {
          id: data.id,
          organizationId: data.organization_id,
          workspaceId: data.workspace_id,
          suite: data.suite,
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          ownerId: data.owner_id,
          assignedUserId: data.assigned_user_id,
          assignedUser: input.assignedUser || null,
          dueAt: data.due_at,
          completedAt: null,
          relation: input.relation || null,
          templateId: data.template_id,
          checklist: input.checklist as any || [],
          mentions: input.mentions || [],
          reminders: input.reminders || [],
          tags: data.tags || [],
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          version: data.version || 1,
        },
      };
    } catch {
      return this.localFallback.createTask(input);
    }
  }

  async updateTask(taskId: string, patch: UpdateTaskPatch, expectedVersion?: number): Promise<TaskMutationResult> {
    if (!this.isConfigured()) return this.localFallback.updateTask(taskId, patch, expectedVersion);

    try {
      const updates: any = {
        updated_at: new Date().toISOString(),
      };
      if (patch.title !== undefined) updates.title = patch.title;
      if (patch.description !== undefined) updates.description = patch.description;
      if (patch.status !== undefined) updates.status = patch.status;
      if (patch.priority !== undefined) updates.priority = patch.priority;
      if (patch.assignedUserId !== undefined) updates.assigned_user_id = patch.assignedUserId;
      if (patch.dueAt !== undefined) updates.due_at = patch.dueAt;
      if (patch.checklist !== undefined) updates.checklist = patch.checklist;

      const response = await this.fetchFn(`${this.baseUrl}/rest/v1/crm_tasks?id=eq.${taskId}`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        return this.localFallback.updateTask(taskId, patch, expectedVersion);
      }

      const rows: any[] = await response.json();
      const data = rows[0];

      return {
        status: "success",
        task: {
          id: data.id,
          organizationId: data.organization_id,
          workspaceId: data.workspace_id,
          suite: data.suite,
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          ownerId: data.owner_id,
          assignedUserId: data.assigned_user_id,
          dueAt: data.due_at,
          completedAt: data.completed_at,
          checklist: data.checklist || [],
          tags: data.tags || [],
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          version: (data.version || 1) + 1,
        },
      };
    } catch {
      return this.localFallback.updateTask(taskId, patch, expectedVersion);
    }
  }

  async completeTask(taskId: string, expectedVersion?: number): Promise<TaskMutationResult> {
    return this.updateTask(taskId, { status: "completed" }, expectedVersion);
  }

  async reopenTask(taskId: string, expectedVersion?: number): Promise<TaskMutationResult> {
    return this.updateTask(taskId, { status: "open" }, expectedVersion);
  }

  async quickReschedule(taskId: string, newDueAt: string, expectedVersion?: number): Promise<TaskMutationResult> {
    return this.updateTask(taskId, { dueAt: newDueAt }, expectedVersion);
  }

  async toggleChecklistItem(taskId: string, itemId: string, completed: boolean): Promise<TaskMutationResult> {
    return this.localFallback.toggleChecklistItem(taskId, itemId, completed);
  }

  async addChecklistItem(taskId: string, title: string): Promise<TaskMutationResult> {
    return this.localFallback.addChecklistItem(taskId, title);
  }

  async deleteChecklistItem(taskId: string, itemId: string): Promise<TaskMutationResult> {
    return this.localFallback.deleteChecklistItem(taskId, itemId);
  }

  async deleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) return this.localFallback.deleteTask(taskId);

    try {
      const response = await this.fetchFn(`${this.baseUrl}/rest/v1/crm_tasks?id=eq.${taskId}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
      if (!response.ok) return this.localFallback.deleteTask(taskId);
      return { success: true };
    } catch {
      return this.localFallback.deleteTask(taskId);
    }
  }

  async listTemplates(organizationId: string, suite?: PlatformSuiteKey): Promise<TaskTemplateRecord[]> {
    return this.localFallback.listTemplates(organizationId, suite);
  }
}
