# Diseño de Arquitectura: Tareas Polimórficas Multi-Suite, Vistas & Funcionalidades Avanzadas

**Módulo:** `tasks`  
**Suite:** Multi-Suite (`crm`, `operations`, `marketing`, `support`, `billing`, `documents`)  
**Run ID:** `MOD-TASKS-20260915-001`  
**Fase:** `01-design`  
**Fecha:** 2026-09-15  

---

## 1. Principios de Arquitectura y Alcance

1. **Aislamiento Multi-Suite & Polimorfismo Universal**:
   Cada tarea pertenece a un inquilino (`organizationId`), se etiqueta por su suite de origen (`suite`) y se vincula polimórficamente a cualquier entidad (`relation: { entityType, entityId }`).
2. **Catálogo de Plantillas por Suite (`TaskTemplateRecord`)**:
   Las suites exponen un catálogo de plantillas pre-configuradas (ej. "Llamada de seguimiento comercial", "Emisión de póliza", "Revisión contractual") que permiten crear tareas en 1 tap con prioridad y fecha sugerida.
3. **Colaboración Cruzada (Menciones, Asignaciones y Checklists)**:
   Soporte para asignar tareas a cualquier miembro de la organización (`assignedUserId`), mencionar usuarios (`@usuario`) con alertas automáticas y definir checklists internas.
4. **Gestión Temporal, Recordatorios y Reprogramación (`dueAt`, `reminders`, `quickReschedule`)**:
   Fechas de vencimiento con semáforos relativos (Vencida 🔴, Vence hoy 🟡, En plazo ⚪), recordatorios programables y menú de aplazamiento rápido.
5. **Dual-Stack Persistence (Supabase + Local Inmutable)**:
   - Tabla PostgreSQL `crm_tasks` y `platform_task_templates` en Supabase.
   - Fallbacks locales en `localPlatformTasksStore` y `localPlatformTaskTemplatesStore` para testing y modo offline.

---

## 2. Contrato Técnico Completo (`packages/contracts/src/tasks.ts`)

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
  priority?: TaskPriority;
  assignedUserId?: string | null;
  dueAt?: string | null;
  relation?: TaskEntityRef | null;
  templateId?: string | null;
  checklist?: Array<{ title: string; completed?: boolean }>;
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
  deleteTask(taskId: string): Promise<{ success: boolean; error?: string }>;
  listTemplates(organizationId: string, suite?: PlatformSuiteKey): Promise<TaskTemplateRecord[]>;
}
```

---

## 3. Matriz de Vistas y Componentes UI

| Espacio / Vista | Modo | Componentes Responsables | Funcionalidad Principal |
| :--- | :--- | :--- | :--- |
| **1. Pantalla de Tareas** | Tabla / Lista | `TasksTableView`, `TaskRow` | Revisión masiva, ordenación, filtrado avanzado por responsable, estado y fecha. |
| | Tablero Kanban | `TasksBoardView`, `TaskColumn`, `TaskCard` | Drag & drop entre columnas de estado (`Pendientes`, `En Progreso`, `Completadas`). |
| | Calendario | `TasksCalendarView` | Planificación semanal y mensual basada en `dueAt`. |
| **2. Customer 360** | Tab Tareas | `Customer360TasksTab`, `MobileTasksList` | Lista táctil de pendientes del cliente, completado en 1 tap y creación con plantillas. |
| **3. Pipeline & Oportunidades** | Next Best Action | `OpportunityNextActionWidget` | Alerta de tarea pendiente en la cabecera y sugerencia de tarea al mover de etapa. |
| **4. Overview / Dashboard** | Widget Mi Día | `MyDayTasksWidget` | Resumen de tareas para hoy con acción de posponer rápida. |
| **5. Centro de Notificaciones** | Notificaciones & Push | `TaskNotificationItem` | Alertas preventivas previas al vencimiento y aviso de asignaciones/menciones. |
| **6. Buscador Global** | Command Bar | `CmdKTaskSearch` | Búsqueda indexada instantánea (`Cmd+K`). |

---

## 4. Funcionalidades Avanzadas de Plataforma (Detalle Técnico)

1. **Reprogramación Rápida (`quickReschedule`)**:
   - Menú contextual: `+1 hora`, `Mañana`, `En 3 días`, `Próxima semana`.
   - Modifica `dueAt` y registra el cambio en el Timeline de auditoría.
2. **Sub-tareas & Checklist (`TaskChecklistItem[]`)**:
   - Lista interactiva de pasos dentro de la tarea.
   - Cálculo automático de progreso (% completado).
3. **Buscador Global (`Cmd + K`)**:
   - Indexación en memoria/remota por título, descripción, nombre del contacto o lead vinculado.
4. **Filtros Guardados & Vistas Personalizadas**:
   - Soporte para guardar combinaciones de filtros (`status`, `priority`, `assignedUserId`, `dueFilter`).
