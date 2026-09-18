export type TaskStatus = "open" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type PlatformSuiteKey = "crm" | "marketing" | "operations" | "support" | "billing" | "documents";

export interface TaskEntityRef {
  entityType: "contact" | "lead" | "opportunity" | "contract" | "ticket" | "document" | string;
  entityId: string;
  label?: string;
}

export interface TaskUserMention {
  userId: string;
  displayName: string;
  email?: string;
}

export interface TaskChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string | null;
}

export interface TaskReminder {
  remindAt: string;
  channel: "in_app" | "push" | "email";
  sent: boolean;
}

export interface AssignableUser {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
}

export const AVAILABLE_ASSIGNABLE_USERS: AssignableUser[] = [
  { id: "usr-ana", displayName: "Ana Mora", email: "ana.mora@example.com" },
  { id: "usr-juan", displayName: "Juan Pérez", email: "juan.perez@example.com" },
  { id: "usr-mario", displayName: "Mario Rivera", email: "mario.rivera@example.com" },
  { id: "usr-carlos", displayName: "Carlos Mendoza", email: "carlos.mendoza@example.com" },
  { id: "usr-current", displayName: "Tú (Usuario Actual)", email: "yo@example.com" },
];

export interface TaskRecord {
  id: string;
  organizationId: string;
  workspaceId?: string | null;
  suite: PlatformSuiteKey;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  ownerId?: string | null;
  assignedUserId?: string | null;
  assignedUser?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  dueAt?: string | null;
  completedAt?: string | null;
  relation?: TaskEntityRef | null;
  templateId?: string | null;
  checklist?: TaskChecklistItem[];
  mentions?: TaskUserMention[];
  reminders?: TaskReminder[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface TaskTemplateRecord {
  id: string;
  organizationId: string;
  suite: PlatformSuiteKey;
  key: string;
  name: string;
  description?: string | null;
  defaultPriority: TaskPriority;
  defaultDueDays?: number | null;
  relationTypes: string[];
  defaultChecklist?: string[];
  status: "active" | "archived";
}

export interface CreateTaskInput {
  organizationId: string;
  workspaceId?: string | null;
  suite?: PlatformSuiteKey;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedUserId?: string | null;
  assignedUser?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  dueAt?: string | null;
  relation?: TaskEntityRef | null;
  templateId?: string | null;
  checklist?: Array<{ id?: string; title: string; completed?: boolean }>;
  mentions?: TaskUserMention[];
  reminders?: TaskReminder[];
  tags?: string[];
}

export interface UpdateTaskPatch {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedUserId?: string | null;
  assignedUser?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  dueAt?: string | null;
  checklist?: TaskChecklistItem[];
  mentions?: TaskUserMention[];
  reminders?: TaskReminder[];
  tags?: string[];
}

export interface TaskListParams {
  organizationId: string;
  workspaceId?: string | null;
  suite?: PlatformSuiteKey;
  relation?: TaskEntityRef;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedUserId?: string | null;
  dueFilter?: "overdue" | "today" | "upcoming" | "no_due";
  query?: string;
  limit?: number;
  cursor?: string | null;
  sortBy?: "due_at" | "priority" | "created_at" | "updated_at";
  sortDirection?: "asc" | "desc";
}

export interface TasksPage {
  items: TaskRecord[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export type TaskMutationResult =
  | { status: "success"; task: TaskRecord }
  | { status: "validation-error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "forbidden"; message: string }
  | { status: "conflict"; message: string; task?: TaskRecord }
  | { status: "server-error"; message: string };

export interface TasksPort {
  listTasks(params: TaskListParams): Promise<TasksPage>;
  getTask(taskId: string): Promise<TaskRecord | null>;
  createTask(input: CreateTaskInput): Promise<TaskMutationResult>;
  updateTask(taskId: string, patch: UpdateTaskPatch, expectedVersion?: number): Promise<TaskMutationResult>;
  completeTask(taskId: string, expectedVersion?: number): Promise<TaskMutationResult>;
  reopenTask(taskId: string, expectedVersion?: number): Promise<TaskMutationResult>;
  quickReschedule(taskId: string, newDueAt: string, expectedVersion?: number): Promise<TaskMutationResult>;
  toggleChecklistItem(taskId: string, itemId: string, completed: boolean): Promise<TaskMutationResult>;
  addChecklistItem(taskId: string, title: string): Promise<TaskMutationResult>;
  deleteChecklistItem(taskId: string, itemId: string): Promise<TaskMutationResult>;
  deleteTask(taskId: string): Promise<{ success: boolean; error?: string }>;
  listTemplates(organizationId: string, suite?: PlatformSuiteKey): Promise<TaskTemplateRecord[]>;
}
