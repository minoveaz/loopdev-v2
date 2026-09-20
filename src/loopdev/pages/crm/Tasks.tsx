import { useMemo, useState, type DragEvent } from "react";
import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Columns3,
  LayoutGrid,
  List,
  ListChecks,
  MoreHorizontal,
  Plus,
  Settings2,
  Siren,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trash2,
  User,
  Users,
  Flame,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import {
  DataCard,
  DataTable,
  FilterDropdown,
  PageContainer,
  PageHeader,
  SearchInput,
  StatCard,
  StatusBadge,
  ConfirmDialog,
  type DataTableAction,
  type DataTableColumn,
} from "@/components/common";
import { DesktopControlDrawer } from "@/components/common/DesktopControlDrawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useTasks } from "@/hooks/use-tasks";
import { TaskDetailDrawer } from "@/components/crm/tasks/TaskDetailDrawer";
import { QuickTaskModal } from "@/components/crm/tasks/QuickTaskModal";
import {
  AVAILABLE_ASSIGNABLE_USERS,
  type TaskPriority,
  type TaskRecord,
  type TaskStatus,
  type TaskTemplateRecord,
} from "@/loopdev/domains/tasks";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

type ViewMode = "table" | "kanban" | "calendar";

const priorityTone: Record<TaskPriority, "neutral" | "info" | "warning" | "destructive"> = {
  low: "neutral",
  normal: "info",
  high: "warning",
  urgent: "destructive",
};

const statusLabel: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function isOverdue(task: TaskRecord) {
  return Boolean(
    task.dueAt &&
      new Date(task.dueAt).getTime() < Date.now() &&
      task.status !== "completed" &&
      task.status !== "cancelled",
  );
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

const KANBAN_COLS: { key: TaskStatus; label: string; tone: "neutral" | "info" | "success" }[] = [
  { key: "open", label: "Pendientes", tone: "neutral" },
  { key: "in_progress", label: "En Progreso", tone: "info" },
  { key: "completed", label: "Completadas", tone: "success" },
];

export default function CRMTasksPage() {
  const t = useT();
  const { trail } = useBreadcrumbs();
  const [searchParams] = useSearchParams();

  const {
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
  } = useTasks({ suite: "crm" });

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [viewTab, setViewTab] = useState<"all" | "urgent" | "today" | "completed">("all");

  const [calendarSubView, setCalendarSubView] = useState<"month" | "week" | "stream">("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<TaskTemplateRecord | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskRecord | null>(null);
  const [isControlDrawerOpen, setIsControlDrawerOpen] = useState(false);

  const activeFilterCount =
    statusFilter.length +
    priorityFilter.length +
    assigneeFilter.length +
    tagFilter.length +
    (viewTab !== "all" ? 1 : 0);

  const handleClearAllFilters = () => {
    setStatusFilter([]);
    setPriorityFilter([]);
    setAssigneeFilter([]);
    setTagFilter([]);
    setViewTab("all");
    setSearch("");
  };

  const availableTags = useMemo(() => {
    const set = new Set<string>(["#VIP", "#Renovación", "#Reclamo", "#Urgente", "#Seguimiento", "#Comercial"]);
    tasks.forEach((t) => (t.tags || []).forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [tasks]);

  const handleCompleteWithToast = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    await completeTask(taskId);
    toast.success("Tarea marcada como completada", {
      description: target?.title,
      action: {
        label: "Deshacer",
        onClick: () => reopenTask(taskId),
      },
    });
  };

  const handleReopenWithToast = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    await reopenTask(taskId);
    toast("Tarea reabierta", {
      description: target?.title,
      action: {
        label: "Deshacer",
        onClick: () => completeTask(taskId),
      },
    });
  };

  const handleDeleteTaskConfirm = async () => {
    if (!taskToDelete) return;
    const { id, title } = taskToDelete;
    setIsDetailOpen(false);
    setSelectedTask(null);
    setTaskToDelete(null);
    const success = await deleteTask(id);
    if (success) {
      toast.success("Tarea eliminada definitivamente", {
        description: title,
      });
    }
  };

  const statusLabels = useMemo<Record<TaskStatus, string>>(() => ({
    open: t("crm.tasks.status.open"),
    in_progress: t("crm.tasks.status.inProgress"),
    completed: t("crm.tasks.status.completed"),
    cancelled: t("crm.tasks.status.cancelled"),
  }), [t]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      open: tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length,
      overdue: tasks.filter(isOverdue).length,
      urgent: tasks.filter((t) => (t.priority === "urgent" || isOverdue(t)) && t.status !== "completed").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (q) {
        const text = `${task.title} ${task.description || ""} ${task.relation?.label || ""} ${(task.tags || []).join(" ")}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      if (statusFilter.length && !statusFilter.includes(task.status)) return false;
      if (priorityFilter.length && !priorityFilter.includes(task.priority)) return false;
      if (assigneeFilter.length && (!task.assignedUserId || !assigneeFilter.includes(task.assignedUserId))) return false;
      if (tagFilter.length && (!task.tags || !tagFilter.some((t) => task.tags?.includes(t)))) return false;

      if (viewTab === "completed") return task.status === "completed";
      if (viewTab === "urgent") return (task.priority === "urgent" || isOverdue(task)) && task.status !== "completed";
      if (viewTab === "today") {
        if (!task.dueAt || task.status === "completed") return false;
        const d = new Date(task.dueAt);
        const today = new Date();
        return d.toDateString() === today.toDateString();
      }
      return true; // "all"
    });
  }, [tasks, search, statusFilter, priorityFilter, assigneeFilter, tagFilter, viewTab]);

  // Calendar calculations (Month & Week)
  const calendarDays = useMemo(() => {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(monthStart);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [cursor]);

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + index);
      return day;
    });
  }, [cursor]);

  const tasksByDay = useMemo(() => {
    const grouped = new Map<string, TaskRecord[]>();
    visibleTasks
      .filter((t) => t.dueAt)
      .forEach((t) => {
        const key = dateKey(new Date(t.dueAt!));
        grouped.set(key, [...(grouped.get(key) ?? []), t]);
      });
    return grouped;
  }, [visibleTasks]);

  // Agenda / Stream view groups
  const streamGroups = useMemo(() => {
    const overdue: TaskRecord[] = [];
    const today: TaskRecord[] = [];
    const tomorrow: TaskRecord[] = [];
    const thisWeek: TaskRecord[] = [];
    const nextWeek: TaskRecord[] = [];
    const later: TaskRecord[] = [];
    const noDate: TaskRecord[] = [];

    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startTomorrow = new Date(startToday);
    startTomorrow.setDate(startToday.getDate() + 1);

    const startThisWeek = startOfWeek(now);
    const endThisWeek = new Date(startThisWeek);
    endThisWeek.setDate(startThisWeek.getDate() + 7);

    const endNextWeek = new Date(endThisWeek);
    endNextWeek.setDate(endThisWeek.getDate() + 7);

    visibleTasks.forEach((task) => {
      if (!task.dueAt) {
        noDate.push(task);
        return;
      }
      const due = new Date(task.dueAt);
      if (isOverdue(task)) {
        overdue.push(task);
      } else if (isSameDay(due, now)) {
        today.push(task);
      } else if (isSameDay(due, startTomorrow)) {
        tomorrow.push(task);
      } else if (due >= startThisWeek && due < endThisWeek) {
        thisWeek.push(task);
      } else if (due >= endThisWeek && due < endNextWeek) {
        nextWeek.push(task);
      } else {
        later.push(task);
      }
    });

    return [
      { id: "overdue", title: "Vencidas", tone: "destructive" as const, tasks: overdue },
      { id: "today", title: "Para Hoy", tone: "info" as const, tasks: today },
      { id: "tomorrow", title: "Mañana", tone: "warning" as const, tasks: tomorrow },
      { id: "thisWeek", title: "Esta Semana", tone: "neutral" as const, tasks: thisWeek },
      { id: "nextWeek", title: "Próxima Semana", tone: "neutral" as const, tasks: nextWeek },
      { id: "later", title: "Más Adelante", tone: "neutral" as const, tasks: later },
      { id: "noDate", title: "Sin Fecha Asignada", tone: "neutral" as const, tasks: noDate },
    ].filter((g) => g.tasks.length > 0);
  }, [visibleTasks]);

  // Kanban Drag & Drop with Undo Toast
  const moveTaskStatus = async (taskId: string, targetStatus: TaskStatus) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target || target.status === targetStatus) return;
    const previousStatus = target.status;
    if (targetStatus === "completed") {
      await completeTask(taskId, target.version);
    } else if (target.status === "completed") {
      await reopenTask(taskId, target.version);
      if (targetStatus !== "open") {
        await updateTask(taskId, { status: targetStatus }, target.version + 1);
      }
    } else {
      await updateTask(taskId, { status: targetStatus }, target.version);
    }

    toast.success(`Tarea movida a ${statusLabel[targetStatus] || targetStatus}`, {
      description: target.title,
      action: {
        label: "Deshacer",
        onClick: async () => {
          if (previousStatus === "completed") {
            await completeTask(taskId);
          } else if (targetStatus === "completed") {
            await reopenTask(taskId);
            if (previousStatus !== "open") {
              await updateTask(taskId, { status: previousStatus });
            }
          } else {
            await updateTask(taskId, { status: previousStatus });
          }
        },
      },
    });
  };

  const onDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOverCol = (e: DragEvent<HTMLDivElement>, col: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== col) setDragOverCol(col);
  };

  const onDropCol = (e: DragEvent<HTMLDivElement>, col: TaskStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    if (id) moveTaskStatus(id, col);
    setDragOverCol(null);
    setDraggingId(null);
  };

  // Columns for DataTable
  const columns: DataTableColumn<TaskRecord>[] = useMemo(
    () => [
      {
        key: "status",
        header: "",
        cell: (task) => {
          const isDone = task.status === "completed";
          return (
            <div
              className="flex items-center justify-center p-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (isDone) {
                  void reopenTask(task.id, task.version);
                } else {
                  void completeTask(task.id, task.version);
                }
              }}
            >
              <Checkbox checked={isDone} className="data-[state=checked]:bg-emerald-600 border-muted-foreground/50" />
            </div>
          );
        },
      },
      {
        key: "title",
        header: "Task",
        sortable: true,
        cell: (task) => {
          const isDone = task.status === "completed";
          const totalChecklist = task.checklist?.length || 0;
          const completedChecklist = task.checklist?.filter((c) => c.completed).length || 0;
          return (
            <div className="min-w-[240px] space-y-1">
              <p className={cn("font-medium text-sm", isDone && "text-muted-foreground line-through")}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                {task.relation?.label && (
                  <span className="font-semibold text-primary flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {task.relation.label}
                  </span>
                )}
                {totalChecklist > 0 && (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    {completedChecklist}/{totalChecklist} sub-tareas
                  </span>
                )}
                {task.reminders && task.reminders.length > 0 && (
                  <span className="text-amber-600 font-medium flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    {task.reminders.length}
                  </span>
                )}
              </div>
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {task.tags.map((tg) => (
                    <span
                      key={tg}
                      className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-primary-soft text-primary border border-primary/20"
                    >
                      {tg}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: "priority",
        header: "Priority",
        sortable: true,
        cell: (task) => (
          <StatusBadge tone={priorityTone[task.priority]} dot>
            {task.priority.toUpperCase()}
          </StatusBadge>
        ),
      },
      {
        key: "assignedUser",
        header: "Assignee",
        cell: (task) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-primary-soft text-primary font-bold">
                {task.assignedUser?.displayName ? task.assignedUser.displayName.slice(0, 2).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">{task.assignedUser?.displayName || "Unassigned"}</span>
          </div>
        ),
      },
      {
        key: "dueAt",
        header: "Due date",
        sortable: true,
        cell: (task) => {
          const overdue = isOverdue(task);
          return (
            <span className={cn("whitespace-nowrap text-xs", overdue ? "font-bold text-destructive" : "text-muted-foreground")}>
              {task.dueAt ? (
                <>
                  {new Date(task.dueAt).toLocaleDateString()} ·{" "}
                  {new Date(task.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </>
              ) : (
                "No due date"
              )}
            </span>
          );
        },
      },
    ],
    [completeTask, reopenTask],
  );

  const rowActions: DataTableAction<TaskRecord>[] = useMemo(
    () => [
      {
        label: "View details",
        onClick: (task) => {
          setSelectedTask(task);
          setIsDetailOpen(true);
        },
      },
      {
        label: "Quick +1 day",
        icon: Clock,
        hidden: (task) => task.status === "completed",
        onClick: (task) => {
          const next = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
          void quickReschedule(task.id, next, task.version);
        },
      },
      {
        label: "Mark complete",
        icon: CheckCircle2,
        hidden: (task) => task.status === "completed",
        onClick: (task) => void handleCompleteWithToast(task.id),
      },
      {
        label: "Reopen task",
        icon: Circle,
        hidden: (task) => task.status !== "completed",
        onClick: (task) => void handleReopenWithToast(task.id),
      },
      {
        label: "Delete",
        icon: Trash2,
        tone: "destructive",
        onClick: (task) => setTaskToDelete(task),
      },
    ],
    [handleCompleteWithToast, handleReopenWithToast, quickReschedule],
  );

  const handleOpenTemplate = (tpl: TaskTemplateRecord) => {
    setActiveTemplate(tpl);
    setIsCreateModalOpen(true);
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        title={t("crm.tasks.title")}
        description="Follow-up work, pipeline tasks, and contact commitments across Sales CRM."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Tasks" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher (Lista, Kanban, Calendario) */}
            <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5 shadow-xs">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={cn("h-8 px-2.5 text-xs font-semibold", viewMode === "table" && "bg-primary-soft text-primary")}
              >
                <List className="mr-1.5 h-3.5 w-3.5" />
                Lista
              </Button>
              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className={cn("h-8 px-2.5 text-xs font-semibold", viewMode === "kanban" && "bg-primary-soft text-primary")}
              >
                <Columns3 className="mr-1.5 h-3.5 w-3.5" />
                {t("crm.tasks.kanban")}
              </Button>
              <Button
                variant={viewMode === "calendar" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className={cn("h-8 px-2.5 text-xs font-semibold", viewMode === "calendar" && "bg-primary-soft text-primary")}
              >
                <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                {t("crm.tasks.calendar")}
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsControlDrawerOpen(true)}
              className={cn(
                "h-9 text-xs font-semibold",
                activeFilterCount > 0 && "border-primary bg-primary-soft text-primary font-bold"
              )}
            >
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              Filtros Avanzados
              {activeFilterCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <Button variant="outline" asChild>
              <Link to="/app/sales-crm/task-templates">
                <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                Templates
              </Link>
            </Button>
            <Button
              onClick={() => {
                setActiveTemplate(null);
                setIsCreateModalOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New task
            </Button>
          </div>
        }
      />

      {/* Rivera Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total tasks" value={String(stats.total)} icon={ListChecks} accent="primary" compact />
        <StatCard label="Open tasks" value={String(stats.open)} icon={Circle} accent="info" compact />
        <StatCard label={t("crm.tasks.overdue")} value={String(stats.overdue)} icon={CalendarDays} accent="gold" compact />
        <StatCard label={t("crm.tasks.urgentOverdue")} value={String(stats.urgent)} icon={Siren} accent="accent" compact />
      </div>

      {/* 1-Tap Quick Templates Bar */}
      {templates.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2 p-3 bg-card-muted/50 rounded-xl border border-border">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            1-Tap Quick Templates:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleOpenTemplate(tpl)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-card border border-border hover:border-primary/40 hover:bg-primary-soft/40 transition-colors shadow-xs"
              >
                <span>{tpl.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs (All, Urgent, Today, Completed) */}
      <div className="mt-6 flex max-w-full items-center gap-1 overflow-x-auto border-b border-border">
        {[
          { id: "all", label: "All tasks" },
          { id: "urgent", label: t("crm.tasks.urgentOverdue") },
          { id: "today", label: t("crm.tasks.dueToday") },
          { id: "completed", label: t("crm.tasks.completed") },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setViewTab(tab.id as any)}
            className={cn(
              "border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors",
              viewTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === "table" && (
        <DataCard className="mt-4" flush>
          <DataTable
            data={visibleTasks}
            columns={columns}
            rowActions={rowActions}
            onRowClick={(task) => {
              setSelectedTask(task);
              setIsDetailOpen(true);
            }}
            loading={isLoading}
            emptyIcon={ListChecks}
            emptyTitle="No tasks match your filters"
            emptyDescription="Try clearing filters or create a new follow-up task."
            toolbar={
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search tasks, descriptions, contacts..."
                  size="sm"
                  containerClassName="w-full sm:w-64"
                />
                <FilterDropdown
                  label="Status"
                  multiple
                  value={statusFilter}
                  onChange={setStatusFilter}
                  size="sm"
                  options={Object.entries(statusLabel).map(([value, label]) => ({ value, label }))}
                />
                <FilterDropdown
                  label="Priority"
                  multiple
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  size="sm"
                  options={(["low", "normal", "high", "urgent"] as TaskPriority[]).map((value) => ({
                    value,
                    label: value.toUpperCase(),
                  }))}
                />
                <FilterDropdown
                  label="Assignee"
                  multiple
                  value={assigneeFilter}
                  onChange={setAssigneeFilter}
                  size="sm"
                  options={AVAILABLE_ASSIGNABLE_USERS.map((u) => ({ value: u.id, label: u.displayName }))}
                />
                <FilterDropdown
                  label="Etiquetas"
                  multiple
                  value={tagFilter}
                  onChange={setTagFilter}
                  size="sm"
                  options={availableTags.map((t) => ({ value: t, label: t }))}
                />
              </div>
            }
            initialSort={{ key: "dueAt", dir: "asc" }}
            initialPageSize={10}
          />
        </DataCard>
      )}

      {/* VIEW 2: KANBAN VIEW */}
      {viewMode === "kanban" && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-card rounded-xl border border-border">
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={search}
                onValueChange={setSearch}
                placeholder="Search in Kanban..."
                size="sm"
                containerClassName="w-56"
              />
              <FilterDropdown
                label="Priority"
                multiple
                value={priorityFilter}
                onChange={setPriorityFilter}
                size="sm"
                options={(["low", "normal", "high", "urgent"] as TaskPriority[]).map((value) => ({
                  value,
                  label: value.toUpperCase(),
                }))}
              />
              <FilterDropdown
                label="Assignee"
                multiple
                value={assigneeFilter}
                onChange={setAssigneeFilter}
                size="sm"
                options={AVAILABLE_ASSIGNABLE_USERS.map((u) => ({ value: u.id, label: u.displayName }))}
              />
              <FilterDropdown
                label="Etiquetas"
                multiple
                value={tagFilter}
                onChange={setTagFilter}
                size="sm"
                options={availableTags.map((t) => ({ value: t, label: t }))}
              />
            </div>
            <div className="text-xs text-muted-foreground font-medium hidden lg:block">
              Arrastra tarjetas entre columnas para actualizar su estado.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[500px]">
            {KANBAN_COLS.map((col) => {
              const colTasks = visibleTasks.filter((t) => t.status === col.key);
              const isOver = dragOverCol === col.key;

              return (
                <div
                  key={col.key}
                  onDragOver={(e) => onDragOverCol(e, col.key)}
                  onDrop={(e) => onDropCol(e, col.key)}
                  className={cn(
                    "flex flex-col rounded-2xl bg-card-muted/60 border border-border p-4 transition-colors",
                    isOver && "border-primary bg-primary-soft/30",
                  )}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-foreground">{col.label}</span>
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-card border border-border text-[11px] font-bold text-muted-foreground">
                        {colTasks.length}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setActiveTemplate(null);
                        setIsCreateModalOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Cards Feed */}
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {colTasks.map((t) => {
                      const overdue = isOverdue(t);
                      const isDone = t.status === "completed";
                      const totalChecklist = t.checklist?.length || 0;
                      const completedChecklist = t.checklist?.filter((c) => c.completed).length || 0;

                      return (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, t.id)}
                          onClick={() => {
                            setSelectedTask(t);
                            setIsDetailOpen(true);
                          }}
                          className={cn(
                            "rounded-xl bg-card p-3.5 border border-border shadow-xs hover:border-primary/40 cursor-grab active:cursor-grabbing transition-all space-y-2.5",
                            overdue && "border-rose-300",
                            isDone && "opacity-75",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <StatusBadge tone={priorityTone[t.priority]} dot>
                              {t.priority.toUpperCase()}
                            </StatusBadge>
                            {overdue && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Vencida
                              </span>
                            )}
                          </div>

                          <h4 className={cn("text-sm font-semibold leading-snug", isDone && "line-through text-muted-foreground")}>
                            {t.title}
                          </h4>

                          {t.relation?.label && (
                            <div className="text-xs font-semibold text-primary truncate flex items-center gap-1">
                              <User className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{t.relation.label}</span>
                            </div>
                          )}

                          {totalChecklist > 0 && (
                            <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              <CheckSquare className="h-3 w-3 flex-shrink-0" />
                              <span>{completedChecklist}/{totalChecklist} sub-tareas</span>
                            </div>
                          )}

                          {t.tags && t.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {t.tags.map((tg) => (
                                <span
                                  key={tg}
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary-soft text-primary border border-primary/20"
                                >
                                  {tg}
                                </span>
                              ))}
                            </div>
                          )}

                          {t.reminders && t.reminders.length > 0 && (
                            <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
                              <Bell className="h-3 w-3 flex-shrink-0" />
                              <span>{t.reminders.length} recordatorio(s)</span>
                            </div>
                          )}

                          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                            <span>{t.dueAt ? new Date(t.dueAt).toLocaleDateString() : "Sin fecha"}</span>
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[9px] bg-primary-soft text-primary font-bold">
                                  {t.assignedUser?.displayName ? t.assignedUser.displayName.slice(0, 2).toUpperCase() : "U"}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {colTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-xs text-muted-foreground border-2 border-dashed border-border rounded-xl">
                        <span>Sin tareas en esta columna</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: CALENDAR VIEW (MES / SEMANA / AGENDA) */}
      {viewMode === "calendar" && (
        <DataCard className="mt-4 overflow-hidden" flush>
          {/* Calendar Unified Top Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCursor(new Date())}
                className="h-8 text-xs font-semibold"
              >
                Hoy
              </Button>
              <div className="inline-flex items-center rounded-lg border border-border bg-card">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (calendarSubView === "month") {
                      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
                    } else if (calendarSubView === "week") {
                      setCursor(new Date(cursor.getTime() - 7 * 24 * 3600 * 1000));
                    }
                  }}
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (calendarSubView === "month") {
                      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
                    } else if (calendarSubView === "week") {
                      setCursor(new Date(cursor.getTime() + 7 * 24 * 3600 * 1000));
                    }
                  }}
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="font-display text-base sm:text-lg font-semibold ml-2">
                {calendarSubView === "month" && (
                  cursor.toLocaleDateString("es-ES", { month: "long", year: "numeric" }).toUpperCase()
                )}
                {calendarSubView === "week" && (
                  `${weekDays[0].getDate()} ${weekDays[0].toLocaleDateString("es-ES", { month: "short" })} - ${weekDays[6].getDate()} ${weekDays[6].toLocaleDateString("es-ES", { month: "short", year: "numeric" })}`.toUpperCase()
                )}
                {calendarSubView === "stream" && (
                  "AGENDA Y FLUJO DE TAREAS"
                )}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Sub-view switcher: Mes | Semana | Agenda */}
              <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5">
                <Button
                  variant={calendarSubView === "month" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCalendarSubView("month")}
                  className={cn(
                    "h-7 px-2.5 text-xs font-semibold gap-1.5",
                    calendarSubView === "month" && "bg-primary-soft text-primary",
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Mes</span>
                </Button>
                <Button
                  variant={calendarSubView === "week" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCalendarSubView("week")}
                  className={cn(
                    "h-7 px-2.5 text-xs font-semibold gap-1.5",
                    calendarSubView === "week" && "bg-primary-soft text-primary",
                  )}
                >
                  <Columns3 className="h-3.5 w-3.5" />
                  <span>Semana</span>
                </Button>
                <Button
                  variant={calendarSubView === "stream" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCalendarSubView("stream")}
                  className={cn(
                    "h-7 px-2.5 text-xs font-semibold gap-1.5",
                    calendarSubView === "stream" && "bg-primary-soft text-primary",
                  )}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>Agenda</span>
                </Button>
              </div>

              <SearchInput
                value={search}
                onValueChange={setSearch}
                placeholder="Buscar en calendario..."
                size="sm"
                containerClassName="w-48 sm:w-56"
              />
            </div>
          </div>

          {/* SUB-VIEW 1: VISTA MES (Cuadrícula 7x5) */}
          {calendarSubView === "month" && (
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-7 border-b border-border bg-card-muted text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                    <div key={day} className="px-2 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map((day) => {
                    const dayTasks = tasksByDay.get(dateKey(day)) ?? [];
                    const inMonth = day.getMonth() === cursor.getMonth();
                    const isTodayCell = isSameDay(day, new Date());

                    return (
                      <div
                        key={dateKey(day)}
                        className={cn(
                          "min-h-[112px] border-b border-r border-border p-2 transition-colors",
                          !inMonth && "bg-card-muted/30 text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold",
                            isTodayCell && "bg-primary text-primary-foreground",
                          )}
                        >
                          {day.getDate()}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayTasks.slice(0, 3).map((task) => {
                            const overdue = isOverdue(task);
                            return (
                              <button
                                key={task.id}
                                type="button"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setIsDetailOpen(true);
                                }}
                                className={cn(
                                  "block w-full truncate rounded px-1.5 py-1 text-left text-[11px] font-medium transition-colors",
                                  task.status === "completed"
                                    ? "bg-card-muted text-muted-foreground line-through"
                                    : overdue
                                    ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                                    : "bg-primary-soft text-primary hover:bg-primary/20",
                                )}
                              >
                                {task.title}
                              </button>
                            );
                          })}
                          {dayTasks.length > 3 && (
                            <p className="px-1 text-[10px] text-muted-foreground font-semibold">
                              +{dayTasks.length - 3} más
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: VISTA SEMANA (7 Columnas Paralelas) */}
          {calendarSubView === "week" && (
            <div className="overflow-x-auto">
              <div className="min-w-[840px]">
                <div className="grid grid-cols-7 border-b border-border">
                  {weekDays.map((day) => {
                    const isTodayCell = isSameDay(day, new Date());
                    const dayTasks = tasksByDay.get(dateKey(day)) ?? [];

                    return (
                      <div
                        key={dateKey(day)}
                        className={cn(
                          "border-r border-border p-3 text-center transition-colors",
                          isTodayCell ? "bg-primary-soft/40" : "bg-card-muted/40",
                        )}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {day.toLocaleDateString("es-ES", { weekday: "short" })}
                        </p>
                        <div className="mt-1 flex items-center justify-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                              isTodayCell
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground",
                            )}
                          >
                            {day.getDate()}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            ({dayTasks.length})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-7 min-h-[460px]">
                  {weekDays.map((day) => {
                    const isTodayCell = isSameDay(day, new Date());
                    const dayTasks = tasksByDay.get(dateKey(day)) ?? [];

                    return (
                      <div
                        key={dateKey(day)}
                        className={cn(
                          "border-r border-border p-2.5 space-y-2.5 transition-colors",
                          isTodayCell && "bg-primary-soft/10",
                        )}
                      >
                        {dayTasks.map((task) => {
                          const overdue = isOverdue(task);
                          const totalChecklist = task.checklist?.length || 0;
                          const completedChecklist = task.checklist?.filter((c) => c.completed).length || 0;

                          return (
                            <div
                              key={task.id}
                              onClick={() => {
                                setSelectedTask(task);
                                setIsDetailOpen(true);
                              }}
                              className={cn(
                                "group cursor-pointer rounded-xl border border-border bg-card p-2.5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md",
                                task.status === "completed" && "opacity-60 bg-card-muted",
                                overdue && "border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20",
                              )}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <StatusBadge
                                  tone={
                                    task.status === "completed"
                                      ? "success"
                                      : overdue
                                      ? "destructive"
                                      : priorityTone[task.priority]
                                  }
                                  className="text-[9px] px-1.5 py-0 uppercase"
                                >
                                  {overdue ? "Vencida" : task.priority}
                                </StatusBadge>

                                {task.dueAt && (
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    {new Date(task.dueAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                              </div>

                              <p
                                className={cn(
                                  "text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors",
                                  task.status === "completed" && "line-through text-muted-foreground",
                                )}
                              >
                                {task.title}
                              </p>

                              {task.relation?.label && (
                                <p className="text-[10px] text-muted-foreground mt-1 truncate">
                                  {task.relation.label}
                                </p>
                              )}

                              <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                                {totalChecklist > 0 ? (
                                  <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                    <CheckSquare className="h-3 w-3" />
                                    {completedChecklist}/{totalChecklist}
                                  </span>
                                ) : (
                                  <span />
                                )}

                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[9px] bg-primary-soft text-primary font-bold">
                                    {task.assignedUser?.displayName
                                      ? task.assignedUser.displayName.slice(0, 2).toUpperCase()
                                      : "U"}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            </div>
                          );
                        })}

                        {dayTasks.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 text-[11px] text-muted-foreground/60 border border-dashed border-border/60 rounded-xl">
                            <span>Sin tareas</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: VISTA AGENDA / FLUJO CRONOLÓGICO */}
          {calendarSubView === "stream" && (
            <div className="p-5 sm:p-6 space-y-6">
              {streamGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-2xl">
                  <CalendarDays className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
                  <h3 className="text-sm font-semibold text-foreground">No hay tareas programadas</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Todas tus tareas están al día o no coinciden con los filtros actuales.
                  </p>
                </div>
              ) : (
                streamGroups.map((group) => (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={group.tone} className="text-xs font-bold px-2.5 py-0.5">
                        {group.title}
                      </StatusBadge>
                      <span className="text-xs text-muted-foreground font-semibold">
                        ({group.tasks.length} tarea{group.tasks.length === 1 ? "" : "s"})
                      </span>
                      <div className="flex-1 h-px bg-border/60 ml-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.tasks.map((task) => {
                        const isDone = task.status === "completed";
                        const overdue = isOverdue(task);
                        const totalChecklist = task.checklist?.length || 0;
                        const completedChecklist = task.checklist?.filter((c) => c.completed).length || 0;

                        return (
                          <div
                            key={task.id}
                            onClick={() => {
                              setSelectedTask(task);
                              setIsDetailOpen(true);
                            }}
                            className={cn(
                              "group cursor-pointer flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md",
                              isDone && "opacity-60 bg-card-muted",
                              overdue && "border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20",
                            )}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={isDone}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        completeTask(task.id, task.version);
                                      } else {
                                        reopenTask(task.id, task.version);
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label="Marcar tarea"
                                  />
                                  <StatusBadge
                                    tone={isDone ? "success" : overdue ? "destructive" : priorityTone[task.priority]}
                                    className="text-[10px] px-2 py-0 uppercase font-bold"
                                  >
                                    {overdue ? "Vencida" : task.priority}
                                  </StatusBadge>
                                </div>

                                {task.dueAt && (
                                  <span className="text-[11px] text-muted-foreground font-semibold inline-flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(task.dueAt).toLocaleDateString("es-ES", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </span>
                                )}
                              </div>

                              <h4
                                className={cn(
                                  "text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight",
                                  isDone && "line-through text-muted-foreground",
                                )}
                              >
                                {task.title}
                              </h4>

                              {task.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                  {task.description}
                                </p>
                              )}

                              {task.relation?.label && (
                                <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-md bg-card-muted text-[11px] font-medium text-foreground">
                                  <User className="h-3 w-3 text-primary" />
                                  <span>{task.relation.label}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border text-xs text-muted-foreground">
                              {totalChecklist > 0 ? (
                                <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                  <CheckSquare className="h-3.5 w-3.5" />
                                  {completedChecklist}/{totalChecklist} subtareas
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">Sin subtareas</span>
                              )}

                              <div className="flex items-center gap-1.5">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[9px] bg-primary-soft text-primary font-bold">
                                    {task.assignedUser?.displayName
                                      ? task.assignedUser.displayName.slice(0, 2).toUpperCase()
                                      : "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-[11px] font-medium">
                                  {task.assignedUser?.displayName || "Asignado"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </DataCard>
      )}

      {/* Detail Slide-over Drawer */}
      <TaskDetailDrawer
        task={tasks.find((t) => t.id === selectedTask?.id) || selectedTask}
        open={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        onComplete={handleCompleteWithToast}
        onReschedule={quickReschedule}
        onToggleChecklist={toggleChecklistItem}
        onAddChecklistItem={addChecklistItem}
        onDeleteChecklistItem={deleteChecklistItem}
        onDeleteTask={(id) => {
          const t = tasks.find((x) => x.id === id);
          if (t) setTaskToDelete(t);
        }}
        onUpdateTask={updateTask}
      />

      {/* Quick Task Creation Modal */}
      <QuickTaskModal
        open={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setActiveTemplate(null);
        }}
        onSubmit={createTask}
        templates={templates}
        initialSuite="crm"
        initialTemplate={activeTemplate}
      />

      {/* Delete Task Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(taskToDelete)}
        onOpenChange={(open) => {
          if (!open) setTaskToDelete(null);
        }}
        tone="destructive"
        title="¿Eliminar tarea definitivamente?"
        description={
          taskToDelete
            ? `¿Estás seguro de que deseas eliminar "${taskToDelete.title}"? Esta acción no se puede deshacer y borrará sus subtareas.`
            : "Esta acción no se puede deshacer."
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteTaskConfirm}
      />

      {/* Advanced Control Center Drawer (HubSpot/Salesforce Style) */}
      <DesktopControlDrawer
        open={isControlDrawerOpen}
        onClose={() => setIsControlDrawerOpen(false)}
        title="Filtros y Vistas CRM"
        eyebrow="Sales CRM · Control Center"
        activeFilterCount={activeFilterCount}
        resultCount={visibleTasks.length}
        onReset={handleClearAllFilters}
        onApply={() => setIsControlDrawerOpen(false)}
        presets={[
          {
            id: "mine_urgent",
            label: "Mis Urgentes",
            icon: Flame,
            active: assigneeFilter.includes("usr-current") && priorityFilter.includes("urgent"),
            onSelect: () => {
              setAssigneeFilter(["usr-current"]);
              setPriorityFilter(["urgent"]);
            },
          },
          {
            id: "due_today",
            label: "Para Hoy",
            icon: CalendarDays,
            active: viewTab === "today",
            onSelect: () => {
              setViewTab("today");
            },
          },
          {
            id: "vip_deals",
            label: "Cierres VIP",
            icon: Sparkles,
            active: tagFilter.includes("#VIP"),
            onSelect: () => {
              setTagFilter(["#VIP"]);
            },
          },
          {
            id: "all_team",
            label: "Todo el Equipo",
            icon: Users,
            active: activeFilterCount === 0,
            onSelect: handleClearAllFilters,
          },
        ]}
      >
        {/* Section 1: Estado de la Tarea */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Estado de la Tarea
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(statusLabel).map(([st, label]) => {
              const isSelected = statusFilter.includes(st);
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() =>
                    setStatusFilter((curr) =>
                      curr.includes(st) ? curr.filter((x) => x !== st) : [...curr, st]
                    )
                  }
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all text-left",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:border-primary/40 text-foreground"
                  )}
                >
                  <Checkbox checked={isSelected} className="pointer-events-none data-[state=checked]:bg-white data-[state=checked]:text-primary" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Prioridad */}
        <div className="space-y-2.5 pt-2 border-t border-border">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Prioridad
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["urgent", "high", "normal", "low"] as TaskPriority[]).map((p) => {
              const isSelected = priorityFilter.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    setPriorityFilter((curr) =>
                      curr.includes(p) ? curr.filter((x) => x !== p) : [...curr, p]
                    )
                  }
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all text-left",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:border-primary/40 text-foreground"
                  )}
                >
                  <Checkbox checked={isSelected} className="pointer-events-none data-[state=checked]:bg-white data-[state=checked]:text-primary" />
                  <span className="uppercase">{p}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Responsables Asignados */}
        <div className="space-y-2.5 pt-2 border-t border-border">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Responsable Asignado
          </label>
          <div className="space-y-1.5">
            {AVAILABLE_ASSIGNABLE_USERS.map((u) => {
              const isSelected = assigneeFilter.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() =>
                    setAssigneeFilter((curr) =>
                      curr.includes(u.id) ? curr.filter((x) => x !== u.id) : [...curr, u.id]
                    )
                  }
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition-all",
                    isSelected
                      ? "bg-primary-soft text-primary border-primary font-bold"
                      : "bg-card border-border hover:border-primary/30 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar className="w-6 h-6 text-[10px]">
                      <AvatarFallback className="bg-primary-soft text-primary font-bold">
                        {u.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{u.displayName}</span>
                  </div>
                  <Checkbox checked={isSelected} className="pointer-events-none" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Etiquetas Temáticas */}
        <div className="space-y-2.5 pt-2 border-t border-border">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Etiquetas (#Tags)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = tagFilter.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setTagFilter((curr) =>
                      curr.includes(tag) ? curr.filter((x) => x !== tag) : [...curr, tag]
                    )
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card border-border hover:border-primary/40 text-foreground"
                  )}
                >
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>
      </DesktopControlDrawer>
    </PageContainer>
  );
}
