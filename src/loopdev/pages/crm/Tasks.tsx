import { useMemo, useState, type DragEvent } from "react";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Columns3,
  Flame,
  LayoutGrid,
  List,
  ListChecks,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Settings2,
  Siren,
  Sparkles,
  Tag,
  Trash2,
  User,
  X,
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
  type BulkAction,
  type DataTableAction,
  type DataTableColumn,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useTasks } from "@/hooks/use-tasks";
import { TaskDetailDrawer } from "@/components/crm/tasks/TaskDetailDrawer";
import { QuickTaskModal } from "@/components/crm/tasks/QuickTaskModal";
import type { TaskPriority, TaskRecord, TaskStatus, TaskTemplateRecord } from "@/loopdev/domains/tasks";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "kanban" | "calendar";
type CalendarSubView = "month" | "week" | "agenda";

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
  const [calendarSubView, setCalendarSubView] = useState<CalendarSubView>("month");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [viewTab, setViewTab] = useState<"all" | "urgent" | "today" | "completed">("all");

  const [cursor, setCursor] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(() => new Date());
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  // Confirmation dialogs & Toasts
  const [taskToDelete, setTaskToDelete] = useState<TaskRecord | null>(null);
  const [batchRowsToDelete, setBatchRowsToDelete] = useState<TaskRecord[]>([]);
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Drawers
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<TaskTemplateRecord | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

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
        const text = `${task.title} ${task.description || ""} ${task.relation?.label || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      if (statusFilter.length && !statusFilter.includes(task.status)) return false;
      if (priorityFilter.length && !priorityFilter.includes(task.priority)) return false;

      if (viewTab === "completed") return task.status === "completed";
      if (viewTab === "urgent") return (task.priority === "urgent" || isOverdue(task)) && task.status !== "completed";
      if (viewTab === "today") {
        if (!task.dueAt || task.status === "completed") return false;
        const d = new Date(task.dueAt);
        const today = new Date();
        return d.toDateString() === today.toDateString();
      }
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter, viewTab]);

  // Calendar calculations (Month 42 days)
  const calendarDays = useMemo(() => {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(monthStart);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [cursor]);

  // Calendar calculations (Week 7 days)
  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [cursor]);

  const tasksByDay = useMemo(() => {
    const grouped = new Map<string, TaskRecord[]>();
    visibleTasks
      .filter((t) => t.dueAt)
      .forEach((task) => {
        const key = dateKey(new Date(task.dueAt!));
        const list = grouped.get(key) ?? [];
        list.push(task);
        grouped.set(key, list);
      });
    return grouped;
  }, [visibleTasks]);

  // Grouping for Agenda / Stream View
  const agendaSections = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueList: TaskRecord[] = [];
    const todayList: TaskRecord[] = [];
    const tomorrowList: TaskRecord[] = [];
    const upcomingList: TaskRecord[] = [];
    const noDateList: TaskRecord[] = [];

    visibleTasks.forEach((t) => {
      if (!t.dueAt) {
        noDateList.push(t);
        return;
      }
      const due = new Date(t.dueAt);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0 && t.status !== "completed") {
        overdueList.push(t);
      } else if (diffDays === 0) {
        todayList.push(t);
      } else if (diffDays === 1) {
        tomorrowList.push(t);
      } else {
        upcomingList.push(t);
      }
    });

    return [
      { id: "overdue", label: "Vencidas y Urgentes", tasks: overdueList, tone: "destructive" as const },
      { id: "today", label: "Para Hoy", tasks: todayList, tone: "primary" as const },
      { id: "tomorrow", label: "Para Mañana", tasks: tomorrowList, tone: "info" as const },
      { id: "upcoming", label: "Próximos Días", tasks: upcomingList, tone: "neutral" as const },
      { id: "nodate", label: "Sin Fecha Límite", tasks: noDateList, tone: "neutral" as const },
    ].filter((sec) => sec.tasks.length > 0);
  }, [visibleTasks]);

  // Drag and Drop for Kanban & Week view
  const moveTaskStatus = async (taskId: string, targetStatus: TaskStatus) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target || target.status === targetStatus) return;
    if (targetStatus === "completed") {
      await completeTask(taskId, target.version);
      showToast("Tarea completada");
    } else if (target.status === "completed") {
      await reopenTask(taskId, target.version);
      if (targetStatus !== "open") {
        await updateTask(taskId, { status: targetStatus }, target.version + 1);
      }
      showToast(`Estado actualizado: ${statusLabel[targetStatus]}`);
    } else {
      await updateTask(taskId, { status: targetStatus }, target.version);
      showToast(`Estado actualizado: ${statusLabel[targetStatus]}`);
    }
  };

  const onDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const onDragOverCol = (e: DragEvent<HTMLDivElement>, col: TaskStatus) => {
    e.preventDefault();
    if (dragOverCol !== col) setDragOverCol(col);
  };

  const onDropCol = (e: DragEvent<HTMLDivElement>, col: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id) void moveTaskStatus(id, col);
  };

  const handleBatchDelete = async () => {
    for (const task of batchRowsToDelete) {
      await deleteTask(task.id);
    }
    showToast(`${batchRowsToDelete.length} tareas eliminadas`);
    setBatchRowsToDelete([]);
    setBatchDeleteConfirm(false);
  };

  const handleConfirmDeleteSingle = async () => {
    if (!taskToDelete) return;
    await deleteTask(taskToDelete.id);
    showToast(`Tarea "${taskToDelete.title}" eliminada`);
    setTaskToDelete(null);
  };

  const columns: DataTableColumn<TaskRecord>[] = useMemo(
    () => [
      {
        key: "status",
        header: "",
        sortable: false,
        cell: (task) => (
          <div onClick={(e) => e.stopPropagation()} className="flex items-center">
            <Checkbox
              checked={task.status === "completed"}
              onCheckedChange={(checked) => {
                if (checked) {
                  void completeTask(task.id, task.version);
                  showToast("Tarea completada");
                } else {
                  void reopenTask(task.id, task.version);
                  showToast("Tarea reabierta");
                }
              }}
              aria-label="Toggle complete"
            />
          </div>
        ),
      },
      {
        key: "title",
        header: "Tarea & Sub-tareas",
        sortable: true,
        cell: (task) => {
          const totalChecklist = task.checklist?.length || 0;
          const completedChecklist = task.checklist?.filter((c) => c.completed).length || 0;
          return (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-semibold text-foreground",
                    task.status === "completed" && "line-through text-muted-foreground",
                  )}
                >
                  {task.title}
                </span>
                {task.tags?.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
              {task.description && (
                <p className="line-clamp-1 text-xs text-muted-foreground">{task.description}</p>
              )}
              {totalChecklist > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                  <CheckSquare className="h-3 w-3" />
                  <span>
                    {completedChecklist}/{totalChecklist} sub-tareas completadas
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: "priority",
        header: "Prioridad",
        sortable: true,
        cell: (task) => (
          <StatusBadge tone={priorityTone[task.priority]} dot>
            {task.priority.toUpperCase()}
          </StatusBadge>
        ),
      },
      {
        key: "relation",
        header: "Relacionado con",
        sortable: true,
        cell: (task) => {
          if (!task.relation?.label) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <User className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <span>{task.relation.label}</span>
            </div>
          );
        },
      },
      {
        key: "dueAt",
        header: "Vencimiento",
        sortable: true,
        cell: (task) => {
          if (!task.dueAt) return <span className="text-xs text-muted-foreground">—</span>;
          const overdue = isOverdue(task);
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                overdue ? "font-bold text-rose-600" : "text-muted-foreground",
              )}
            >
              {overdue && <AlertCircle className="h-3.5 w-3.5" />}
              {new Date(task.dueAt).toLocaleDateString()}
            </span>
          );
        },
      },
      {
        key: "assignedUser",
        header: "Asignado",
        sortable: false,
        cell: (task) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-primary-soft text-primary font-bold">
                {task.assignedUser?.displayName
                  ? task.assignedUser.displayName.slice(0, 2).toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-foreground">
              {task.assignedUser?.displayName || "Sin asignar"}
            </span>
          </div>
        ),
      },
    ],
    [completeTask, reopenTask],
  );

  const rowActions: DataTableAction<TaskRecord>[] = useMemo(
    () => [
      {
        label: "Ver detalles / Subtareas",
        icon: ListChecks,
        onClick: (task) => {
          setSelectedTask(task);
          setIsDetailOpen(true);
        },
      },
      {
        label: "Reprogramar: Mañana",
        icon: Clock,
        onClick: (task) => {
          const tomorrow = new Date(Date.now() + 3600 * 1000 * 24).toISOString();
          void quickReschedule(task.id, tomorrow);
          showToast("Reprogramado para mañana");
        },
      },
      {
        label: "Reprogramar: +2 Días",
        icon: CalendarDays,
        onClick: (task) => {
          const in2Days = new Date(Date.now() + 3600 * 1000 * 48).toISOString();
          void quickReschedule(task.id, in2Days);
          showToast("Reprogramado para dentro de 2 días");
        },
      },
      {
        label: "Marcar completada",
        icon: CheckCircle2,
        onClick: (task) => {
          void completeTask(task.id, task.version);
          showToast("Tarea completada");
        },
      },
      {
        label: "Eliminar tarea",
        icon: Trash2,
        destructive: true,
        onClick: (task) => {
          setTaskToDelete(task);
        },
      },
    ],
    [completeTask, quickReschedule],
  );

  const bulkActions: BulkAction<TaskRecord>[] = useMemo(
    () => [
      {
        label: "Marcar completadas",
        icon: Check,
        onClick: async (selectedRows) => {
          for (const row of selectedRows) {
            await completeTask(row.id, row.version);
          }
          showToast(`${selectedRows.length} tareas completadas`);
        },
      },
      {
        label: "Eliminar seleccionadas",
        icon: Trash2,
        destructive: true,
        onClick: (selectedRows) => {
          setBatchRowsToDelete(selectedRows);
          setBatchDeleteConfirm(true);
        },
      },
    ],
    [completeTask],
  );

  const handleOpenTemplate = (tpl: TaskTemplateRecord) => {
    setActiveTemplate(tpl);
    setIsCreateModalOpen(true);
  };

  return (
    <PageContainer>
      <PageHeader
        title="CRM Tasks"
        description="Seguimiento de tareas, compromisos comerciales y agenda sincronizada."
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
                Kanban
              </Button>
              <Button
                variant={viewMode === "calendar" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className={cn("h-8 px-2.5 text-xs font-semibold", viewMode === "calendar" && "bg-primary-soft text-primary")}
              >
                <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                Calendario
              </Button>
            </div>

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
        <StatCard label="Overdue" value={String(stats.overdue)} icon={CalendarDays} accent="gold" compact />
        <StatCard label="Urgent & overdue" value={String(stats.urgent)} icon={Siren} accent="destructive" compact />
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
          { id: "urgent", label: "Urgent & Overdue" },
          { id: "today", label: "Due Today" },
          { id: "completed", label: "Completed" },
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
            bulkActions={bulkActions}
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
            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search in Kanban..."
              size="sm"
              containerClassName="w-64"
            />
            <div className="text-xs text-muted-foreground font-medium">
              Arrastra tarjetas entre columnas para actualizar su estado al instante.
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

      {/* VIEW 3: MULTI-MODE CALENDAR (Mes | Semana | Agenda / Flujo) */}
      {viewMode === "calendar" && (
        <DataCard className="mt-4 overflow-hidden" flush>
          {/* Calendar Top Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5 bg-card">
            <div className="flex items-center gap-3">
              {/* Sub-View Switcher: Mes | Semana | Agenda */}
              <div className="inline-flex items-center rounded-lg border border-border bg-card-muted/50 p-0.5">
                <Button
                  variant={calendarSubView === "month" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCalendarSubView("month")}
                  className={cn("h-7 px-3 text-xs font-semibold", calendarSubView === "month" && "bg-card shadow-xs text-primary")}
                >
                  <Calendar className="mr-1.5 h-3.5 w-3.5" />
                  Mes
                </Button>
                <Button
                  variant={calendarSubView === "week" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCalendarSubView("week")}
                  className={cn("h-7 px-3 text-xs font-semibold", calendarSubView === "week" && "bg-card shadow-xs text-primary")}
                >
                  <Columns3 className="mr-1.5 h-3.5 w-3.5" />
                  Semana
                </Button>
                <Button
                  variant={calendarSubView === "agenda" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCalendarSubView("agenda")}
                  className={cn("h-7 px-3 text-xs font-semibold", calendarSubView === "agenda" && "bg-card shadow-xs text-primary")}
                >
                  <List className="mr-1.5 h-3.5 w-3.5" />
                  Agenda / Flujo
                </Button>
              </div>

              {/* Navigation buttons: Hoy, <, > */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={() => {
                  setCursor(new Date());
                  setSelectedCalendarDate(new Date());
                }}
              >
                Hoy
              </Button>
              <div className="inline-flex items-center rounded-lg border border-border bg-card">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    const next = new Date(cursor);
                    if (calendarSubView === "week") {
                      next.setDate(next.getDate() - 7);
                    } else {
                      next.setMonth(next.getMonth() - 1);
                    }
                    setCursor(next);
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
                    const next = new Date(cursor);
                    if (calendarSubView === "week") {
                      next.setDate(next.getDate() + 7);
                    } else {
                      next.setMonth(next.getMonth() + 1);
                    }
                    setCursor(next);
                  }}
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <h2 className="font-display text-base font-bold text-foreground">
                {cursor.toLocaleDateString("es-ES", { month: "long", year: "numeric" }).toUpperCase()}
              </h2>
            </div>

            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Buscar en calendario..."
              size="sm"
              containerClassName="w-56"
            />
          </div>

          {/* 3.1 SUB-VIEW: MES (Cuadrícula 7x5 / 42 Días) */}
          {calendarSubView === "month" && (
            <div className="overflow-x-auto">
              <div className="min-w-[680px]">
                <div className="grid grid-cols-7 border-b border-border bg-card-muted/80 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                    <div key={day} className="px-2 py-2.5">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map((day) => {
                    const dayTasks = tasksByDay.get(dateKey(day)) ?? [];
                    const inMonth = day.getMonth() === cursor.getMonth();
                    const isTodayCell = isSameDay(day, new Date());
                    const isSelected = isSameDay(day, selectedCalendarDate);

                    return (
                      <div
                        key={dateKey(day)}
                        onClick={() => setSelectedCalendarDate(day)}
                        className={cn(
                          "min-h-[110px] border-b border-r border-border p-2 transition-colors cursor-pointer hover:bg-primary-soft/20",
                          !inMonth && "bg-card-muted/30 text-muted-foreground opacity-60",
                          isSelected && "ring-2 ring-primary ring-inset bg-primary-soft/10",
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={cn(
                              "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                              isTodayCell ? "bg-primary text-primary-foreground" : "text-foreground",
                            )}
                          >
                            {day.getDate()}
                          </span>
                          {dayTasks.length > 0 && (
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {dayTasks.length} {dayTasks.length === 1 ? "tarea" : "tareas"}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {dayTasks.slice(0, 3).map((task) => {
                            const overdue = isOverdue(task);
                            return (
                              <button
                                key={task.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask(task);
                                  setIsDetailOpen(true);
                                }}
                                className={cn(
                                  "block w-full truncate rounded px-1.5 py-1 text-left text-[11px] font-semibold transition-all hover:scale-[1.01]",
                                  task.status === "completed"
                                    ? "bg-card-muted text-muted-foreground line-through opacity-75"
                                    : overdue
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-primary-soft text-primary hover:bg-primary/20",
                                )}
                              >
                                {task.title}
                              </button>
                            );
                          })}
                          {dayTasks.length > 3 && (
                            <p className="px-1 text-[10px] text-primary font-bold">
                              +{dayTasks.length - 3} más...
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

          {/* 3.2 SUB-VIEW: SEMANA (7 Columnas Lunes-Domingo) */}
          {calendarSubView === "week" && (
            <div className="overflow-x-auto p-4">
              <div className="grid grid-cols-7 gap-3 min-w-[840px]">
                {weekDays.map((day) => {
                  const dayTasks = tasksByDay.get(dateKey(day)) ?? [];
                  const isTodayCell = isSameDay(day, new Date());
                  const dayName = day.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase();

                  return (
                    <div
                      key={dateKey(day)}
                      className={cn(
                        "rounded-xl border border-border bg-card-muted/40 p-3 min-h-[440px] flex flex-col space-y-2.5",
                        isTodayCell && "border-primary/50 bg-primary-soft/10",
                      )}
                    >
                      {/* Week Col Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <span className="text-[11px] font-bold text-muted-foreground uppercase">{dayName}</span>
                          <h3 className={cn("text-base font-bold", isTodayCell ? "text-primary" : "text-foreground")}>
                            {day.getDate()}
                          </h3>
                        </div>
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-card border border-border text-[10px] font-bold text-muted-foreground">
                          {dayTasks.length}
                        </span>
                      </div>

                      {/* Day Tasks Feed */}
                      <div className="flex-1 space-y-2 overflow-y-auto">
                        {dayTasks.map((t) => {
                          const overdue = isOverdue(t);
                          const isDone = t.status === "completed";
                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                setSelectedTask(t);
                                setIsDetailOpen(true);
                              }}
                              className={cn(
                                "rounded-lg bg-card p-2.5 border border-border shadow-xs hover:border-primary/40 cursor-pointer space-y-1.5 transition-all",
                                overdue && "border-rose-300",
                                isDone && "opacity-70 line-through",
                              )}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <StatusBadge tone={priorityTone[t.priority]} dot>
                                  {t.priority.toUpperCase()}
                                </StatusBadge>
                                <Checkbox
                                  checked={isDone}
                                  onClick={(e) => e.stopPropagation()}
                                  onCheckedChange={(c) => {
                                    if (c) void completeTask(t.id, t.version);
                                    else void reopenTask(t.id, t.version);
                                  }}
                                />
                              </div>
                              <h5 className="text-xs font-semibold text-foreground line-clamp-2">{t.title}</h5>
                              {t.relation?.label && (
                                <p className="text-[10px] text-primary font-medium truncate">{t.relation.label}</p>
                              )}
                              {t.checklist && t.checklist.length > 0 && (
                                <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                  <CheckSquare className="h-2.5 w-2.5" />
                                  <span>{t.checklist.filter((c) => c.completed).length}/{t.checklist.length}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {dayTasks.length === 0 && (
                          <div className="h-32 flex items-center justify-center text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                            Sin tareas
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3.3 SUB-VIEW: AGENDA / FLUJO (Timeline Continuo por Bloques) */}
          {calendarSubView === "agenda" && (
            <div className="p-5 space-y-6 max-w-4xl mx-auto">
              {agendaSections.map((section) => (
                <div key={section.id} className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-border">
                    <StatusBadge tone={section.tone} dot>
                      {section.label} ({section.tasks.length})
                    </StatusBadge>
                  </div>

                  <div className="space-y-2">
                    {section.tasks.map((task) => {
                      const isDone = task.status === "completed";
                      const overdue = isOverdue(task);
                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            setSelectedTask(task);
                            setIsDetailOpen(true);
                          }}
                          className={cn(
                            "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border shadow-xs hover:border-primary/40 cursor-pointer transition-colors",
                            overdue && "border-rose-300 bg-rose-50/20",
                            isDone && "opacity-75",
                          )}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Checkbox
                              checked={isDone}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={(c) => {
                                if (c) void completeTask(task.id, task.version);
                                else void reopenTask(task.id, task.version);
                              }}
                              className="mt-1"
                            />
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className={cn("text-sm font-semibold truncate", isDone && "line-through text-muted-foreground")}>
                                  {task.title}
                                </h4>
                                <StatusBadge tone={priorityTone[task.priority]} dot>
                                  {task.priority.toUpperCase()}
                                </StatusBadge>
                              </div>
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                {task.relation?.label && (
                                  <span className="font-semibold text-primary">{task.relation.label}</span>
                                )}
                                {task.dueAt && (
                                  <span>📅 {new Date(task.dueAt).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}</span>
                                )}
                                {task.checklist && task.checklist.length > 0 && (
                                  <span className="text-emerald-600 font-medium">
                                    ✓ {task.checklist.filter((c) => c.completed).length}/{task.checklist.length} sub-tareas
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs font-semibold"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                                setIsDetailOpen(true);
                              }}
                            >
                              Ver Subtareas
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {agendaSections.length === 0 && (
                <div className="py-16 text-center text-muted-foreground space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                  <h3 className="text-base font-bold text-foreground">¡Todo al día!</h3>
                  <p className="text-xs">No tienes tareas pendientes ni vencidas para mostrar.</p>
                </div>
              )}
            </div>
          )}
        </DataCard>
      )}

      {/* Confirmation Dialog for Single Delete */}
      <Dialog open={Boolean(taskToDelete)} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar tarea?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará la tarea <strong>"{taskToDelete?.title}"</strong> y su checklist asociado. Esta operación no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTaskToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteSingle}>
              Sí, eliminar tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Batch Delete */}
      <Dialog open={batchDeleteConfirm} onOpenChange={setBatchDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar {batchRowsToDelete.length} tareas seleccionadas?</DialogTitle>
            <DialogDescription>
              Se eliminarán de forma permanente todas las tareas marcadas en el lote.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBatchDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBatchDelete}>
              Eliminar {batchRowsToDelete.length} tareas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border border-border shadow-xl rounded-xl p-3.5 flex items-center gap-2.5 text-xs font-bold text-foreground animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Detail Slide-over Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        open={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        onComplete={async (taskId) => {
          await completeTask(taskId);
          setSelectedTask((prev) => (prev ? { ...prev, status: "completed", updatedAt: new Date().toISOString() } : null));
          showToast("Tarea completada");
        }}
        onReopen={async (taskId) => {
          await reopenTask(taskId);
          setSelectedTask((prev) => (prev ? { ...prev, status: "open", updatedAt: new Date().toISOString() } : null));
          showToast("Tarea reabierta");
        }}
        onReschedule={async (taskId, newDueAt) => {
          await quickReschedule(taskId, newDueAt);
          setSelectedTask((prev) => (prev ? { ...prev, dueAt: newDueAt, updatedAt: new Date().toISOString() } : null));
          showToast("Tarea reprogramada");
        }}
        onToggleChecklist={async (taskId, itemId, completed) => {
          const modified = await toggleChecklistItem(taskId, itemId, completed);
          if (modified) setSelectedTask(modified);
        }}
        onAddChecklist={async (taskId, title) => {
          const modified = await addChecklistItem(taskId, title);
          if (modified) setSelectedTask(modified);
          showToast(`Subtarea añadida: "${title}"`);
        }}
        onDeleteChecklist={async (taskId, itemId) => {
          const modified = await deleteChecklistItem(taskId, itemId);
          if (modified) setSelectedTask(modified);
          showToast("Subtarea eliminada");
        }}
        onDeleteTask={(task) => {
          setIsDetailOpen(false);
          setTaskToDelete(task);
        }}
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
    </PageContainer>
  );
}
