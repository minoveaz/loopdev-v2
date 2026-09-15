import { useMemo, useState, type DragEvent } from "react";
import {
  AlertCircle,
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
  Sparkles,
  Trash2,
  User,
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
  type DataTableAction,
  type DataTableColumn,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import type { TaskPriority, TaskRecord, TaskStatus, TaskTemplateRecord } from "@/loopdev/domains/tasks";
import { cn } from "@/lib/utils";

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
    deleteTask,
  } = useTasks({ suite: "crm" });

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [viewTab, setViewTab] = useState<"all" | "urgent" | "today" | "completed">("all");

  const [cursor, setCursor] = useState(() => new Date());
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<TaskTemplateRecord | null>(null);

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
      return true; // "all"
    });
  }, [tasks, search, statusFilter, priorityFilter, viewTab]);

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(monthStart);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
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

  // Kanban Drag & Drop
  const moveTaskStatus = async (taskId: string, targetStatus: TaskStatus) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target || target.status === targetStatus) return;
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
            <div className="min-w-[240px]">
              <p className={cn("font-medium text-sm", isDone && "text-muted-foreground line-through")}>
                {task.title}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
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
              </div>
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
        onClick: (task) => void completeTask(task.id, task.version),
      },
      {
        label: "Reopen task",
        icon: Circle,
        hidden: (task) => task.status !== "completed",
        onClick: (task) => void reopenTask(task.id, task.version),
      },
      {
        label: "Delete",
        icon: Trash2,
        tone: "destructive",
        onClick: (task) => void deleteTask(task.id),
      },
    ],
    [completeTask, deleteTask, quickReschedule, reopenTask],
  );

  const handleOpenTemplate = (tpl: TaskTemplateRecord) => {
    setActiveTemplate(tpl);
    setIsCreateModalOpen(true);
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        title="CRM Tasks"
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

      {/* VIEW 3: CALENDAR VIEW */}
      {viewMode === "calendar" && (
        <DataCard className="mt-4 overflow-hidden" flush>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
                Hoy
              </Button>
              <div className="inline-flex items-center rounded-lg border border-border bg-card">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="font-display text-lg font-semibold ml-2">
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
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
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
        </DataCard>
      )}

      {/* Detail Slide-over Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        open={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        onComplete={completeTask}
        onReschedule={quickReschedule}
        onToggleChecklist={toggleChecklistItem}
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
