# Diseño de Arquitectura: Tareas Polimórficas Multi-Suite & Catálogo de Plantillas

**Módulo:** `tasks`  
**Suite:** Multi-Suite (`crm`, `operations`, `marketing`, `support`, etc.)  
**Run ID:** `MOD-TASKS-20260915-001`  
**Fase:** `01-design`  
**Fecha:** 2026-09-15  

---

## 1. Principios de Arquitectura Multi-Suite

1. **Aislamiento Multi-Suite & Polimorfismo Universal**:
   Cada tarea pertenece a un inquilino (`organizationId`), se etiqueta por su suite de origen (`suite: "crm" | "operations" | ...`) y se vincula polimórficamente a cualquier entidad (`relation: { entityType, entityId }`).
2. **Catálogo de Plantillas por Suite (`TaskTemplateRecord`)**:
   Las suites exponen un catálogo de plantillas pre-configuradas (ej. "Llamada de seguimiento comercial", "Emisión de póliza", "Revisión contractual") que permiten crear tareas en 1 tap con prioridad y fecha sugerida.
3. **Colaboración Cruzada (Menciones y Asignaciones)**:
   Soporte para asignar tareas a cualquier miembro de la organización (`assignedUserId`) y mencionar usuarios (`@usuario`) en notas o descripciones con alertas automáticas.
4. **Gestión Temporal y Recordatorios (`dueAt` & `reminders`)**:
   Fechas de vencimiento con semáforos relativos (Vencida 🔴, Vence hoy 🟡, En plazo ⚪) y recordatorios programables.
5. **Dual-Stack Persistence (Supabase + Local Inmutable)**:
   - Tabla PostgreSQL `crm_tasks` y `platform_task_templates` en Supabase.
   - Fallbacks locales en `localPlatformTasksStore` y `localPlatformTaskTemplatesStore` para testing y modo offline.

---

## 2. Contrato Técnico Unificado (`packages/contracts/src/tasks.ts`)

```typescript
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

export interface TaskReminder {
  remindAt: string;
  channel: "in_app" | "push" | "email";
  sent: boolean;
}

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
  assignedUser?: { id: string; displayName: string; avatarUrl?: string | null } | null;
  dueAt?: string | null;
  completedAt?: string | null;
  relation?: TaskEntityRef | null;
  templateId?: string | null;
  mentions?: TaskUserMention[];
  reminders?: TaskReminder[];
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
  status: "active" | "archived";
}

export interface CreateTaskInput {
  organizationId: string;
  workspaceId?: string | null;
  suite?: PlatformSuiteKey;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  assignedUserId?: string | null;
  dueAt?: string | null;
  relation?: TaskEntityRef | null;
  templateId?: string | null;
  mentions?: TaskUserMention[];
  reminders?: TaskReminder[];
}

export interface UpdateTaskPatch {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedUserId?: string | null;
  dueAt?: string | null;
  mentions?: TaskUserMention[];
  reminders?: TaskReminder[];
}

export interface TaskListParams {
  organizationId: string;
  workspaceId?: string | null;
  suite?: PlatformSuiteKey;
  relation?: TaskEntityRef;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedUserId?: string | null;
  query?: string;
  limit?: number;
  cursor?: string | null;
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
  deleteTask(taskId: string): Promise<{ success: boolean; error?: string }>;
  listTemplates(organizationId: string, suite?: PlatformSuiteKey): Promise<TaskTemplateRecord[]>;
}
```

---

## 3. Componentes de Interfaz Multiplataforma

1. **`TaskTemplateSelector` (Selector de Catálogo de Tareas)**:
   - En Desktop: Dropdown con plantillas organizadas por categoría y preview de días sugeridos.
   - En Mobile: Carrusel de "Pills" o botones de acción rápida horizontales (ej. `[📞 Llamar]`, `[📄 Cotizar]`, `[📝 Firma]`, `[🔄 Renovar]`).
2. **`QuickTaskCreator` (Modal / Bottom Sheet Táctil)**:
   - Selección de plantilla con 1 tap o ingreso manual.
   - Selector de fecha de vencimiento rápida (`Hoy`, `Mañana`, `En 3 días`, `Próxima semana`, `Fecha personalizada`).
   - Selector de prioridad (`Baja`, `Normal`, `Alta`, `Urgente`).
   - Asignación de usuario con autocompletado y `@menciones`.
3. **`MobileTasksList`**:
   - Tarjetas táctiles con checkbox de completado inmediato y animación.
   - Semáforo de vencimiento visual.
