import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AlertCircle,
  Bell,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns3,
  Eye,
  Flame,
  List,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Sparkles,
  Tag,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react-native";
import {
  AVAILABLE_ASSIGNABLE_USERS,
  type AssignableUser,
  type CreateTaskInput,
  type TaskPriority,
  type TaskRecord,
  type TaskReminder,
  type TaskTemplateRecord,
  type UpdateTaskPatch,
} from "../../../packages/contracts/src/tasks";
import { DEFAULT_TASK_TEMPLATES, mobileTasksAdapter } from "../adapters/tasks";
import { mobileTheme, commonMobileStyles } from "../theme/tokens";
import { MobilePageHeader } from "./ui/MobilePageHeader";
import { MobilePageTabs } from "./ui/MobilePageTabs";
import { MobileSearchBar } from "./ui/MobileSearchBar";
import { MobileModalSheet } from "./MobileModal";
import { MobileControlSheet } from "./ui/MobileControlSheet";

interface MobileTasksScreenProps {
  onBack?: () => void;
  onNavigateToContact?: (contactId: string) => void;
}

type ViewMode = "list" | "kanban" | "calendar";
type FilterMode = "all" | "urgent" | "today" | "completed";
type KanbanCol = "pending" | "urgent" | "completed";
type CalendarSubView = "week" | "month" | "stream";

const MOBILE_PRESET_TAGS = ["#VIP", "#Renovación", "#Reclamo", "#Urgente", "#Seguimiento", "#Comercial"];

export function MobileTasksScreen({ onNavigateToContact }: MobileTasksScreenProps) {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [templates, setTemplates] = useState<TaskTemplateRecord[]>(DEFAULT_TASK_TEMPLATES);
  const [, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [kanbanCol, setKanbanCol] = useState<KanbanCol>("pending");
  const [calendarSubView, setCalendarSubView] = useState<CalendarSubView>("week");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [monthCursor, setMonthCursor] = useState(() => new Date());

  // Sheets & Action states
  const [actionTask, setActionTask] = useState<TaskRecord | null>(null);
  const [detailTask, setDetailTask] = useState<TaskRecord | null>(null);
  const [rescheduleSheetTask, setRescheduleSheetTask] = useState<TaskRecord | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskRecord | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // In-place edit state for detailTask
  const [detailTitle, setDetailTitle] = useState("");
  const [detailDesc, setDetailDesc] = useState("");
  const [customTagInput, setCustomTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);

  useEffect(() => {
    if (detailTask) {
      setDetailTitle(detailTask.title || "");
      setDetailDesc(detailTask.description || "");
      setShowTagInput(false);
      setShowAssigneePicker(false);
    }
  }, [detailTask?.id]);

  // Toast / Snackbar state
  const [toast, setToast] = useState<{
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const toastTimeoutRef = React.useRef<any>(null);

  const showToast = (toastData: {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
  }) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(toastData);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("normal");
  const [newDueHours, setNewDueHours] = useState(24);
  const [newRelationLabel, setNewRelationLabel] = useState("");
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newDetailSubtask, setNewDetailSubtask] = useState("");

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await mobileTasksAdapter.listTasks({
        organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
        suite: "crm",
        limit: 100,
      });
      setTasks(res.items);
      const tpls = await mobileTasksAdapter.listTemplates("80fce911-57c5-4a83-809f-78df6a3736f7", "crm");
      setTemplates(tpls);
    } catch (err) {
      console.error("Error loading tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, []);

  const handleUpdateTask = async (taskId: string, patch: UpdateTaskPatch) => {
    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t))
    );
    if (detailTask?.id === taskId) {
      setDetailTask((prev) => (prev ? { ...prev, ...patch, updatedAt: new Date().toISOString() } : null));
    }
    await mobileTasksAdapter.updateTask(taskId, patch);
  };

  const handleSaveDetailTitle = async () => {
    if (!detailTask || !detailTitle.trim() || detailTitle.trim() === detailTask.title) return;
    await handleUpdateTask(detailTask.id, { title: detailTitle.trim() });
    showToast({ title: "Título actualizado" });
  };

  const handleSaveDetailDesc = async () => {
    if (!detailTask || detailDesc === (detailTask.description || "")) return;
    await handleUpdateTask(detailTask.id, { description: detailDesc.trim() || null });
    showToast({ title: "Descripción actualizada" });
  };

  const handleChangeDetailPriority = async (newPriority: TaskPriority) => {
    if (!detailTask || detailTask.priority === newPriority) return;
    await handleUpdateTask(detailTask.id, { priority: newPriority });
    showToast({ title: `Prioridad cambiada a ${newPriority.toUpperCase()}` });
  };

  const handleChangeDetailAssignee = async (user: AssignableUser | null) => {
    if (!detailTask) return;
    await handleUpdateTask(detailTask.id, {
      assignedUserId: user ? user.id : null,
      assignedUser: user
        ? { id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl }
        : null,
    });
    setShowAssigneePicker(false);
    showToast({ title: user ? `Asignado a ${user.displayName}` : "Tarea desasignada" });
  };

  const handleAddDetailTag = async (tagToAdd: string) => {
    if (!detailTask) return;
    const cleanTag = tagToAdd.startsWith("#") ? tagToAdd.trim() : `#${tagToAdd.trim()}`;
    if (!cleanTag || cleanTag === "#") return;
    const currentTags = detailTask.tags || [];
    if (currentTags.includes(cleanTag)) return;

    const newTags = [...currentTags, cleanTag];
    await handleUpdateTask(detailTask.id, { tags: newTags });
    setCustomTagInput("");
    setShowTagInput(false);
    showToast({ title: `Etiqueta añadida: ${cleanTag}` });
  };

  const handleDeleteDetailTag = async (tagToDelete: string) => {
    if (!detailTask) return;
    const currentTags = detailTask.tags || [];
    const newTags = currentTags.filter((t) => t !== tagToDelete);
    await handleUpdateTask(detailTask.id, { tags: newTags });
    showToast({ title: `Etiqueta eliminada: ${tagToDelete}` });
  };

  const handleAddDetailReminder = async (presetMinutes: number, label: string) => {
    if (!detailTask) return;
    const targetDue = detailTask.dueAt ? new Date(detailTask.dueAt).getTime() : Date.now() + 3600 * 1000 * 24;
    const remindTime = new Date(targetDue - presetMinutes * 60 * 1000).toISOString();

    const newReminder: TaskReminder = {
      remindAt: remindTime,
      channel: "in_app",
      sent: false,
    };

    const currentReminders = detailTask.reminders || [];
    const newReminders = [...currentReminders, newReminder];
    await handleUpdateTask(detailTask.id, { reminders: newReminders });
    showToast({ title: `Recordatorio programado: ${label}` });
  };

  const handleDeleteDetailReminder = async (index: number) => {
    if (!detailTask) return;
    const currentReminders = detailTask.reminders || [];
    const newReminders = currentReminders.filter((_, i) => i !== index);
    await handleUpdateTask(detailTask.id, { reminders: newReminders });
    showToast({ title: "Recordatorio eliminado" });
  };

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    const target = tasks.find((t) => t.id === taskId);
    setTasks((current) =>
      current.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: isCompleted ? "open" : "completed",
              completedAt: isCompleted ? null : new Date().toISOString(),
            }
          : t,
      ),
    );

    if (detailTask?.id === taskId) {
      setDetailTask((prev) =>
        prev
          ? {
              ...prev,
              status: isCompleted ? "open" : "completed",
              completedAt: isCompleted ? null : new Date().toISOString(),
            }
          : null,
      );
    }

    if (isCompleted) {
      await mobileTasksAdapter.reopenTask(taskId);
      showToast({
        title: "Tarea reabierta",
        subtitle: target?.title,
        actionLabel: "Deshacer",
        onAction: () => void handleToggleComplete(taskId, false),
      });
    } else {
      await mobileTasksAdapter.completeTask(taskId);
      showToast({
        title: "Tarea completada",
        subtitle: target?.title,
        actionLabel: "Deshacer",
        onAction: () => void handleToggleComplete(taskId, true),
      });
    }
  };

  const handleQuickReschedule = async (taskId: string, hours: number) => {
    const nextDue = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, dueAt: nextDue } : t)),
    );
    if (detailTask?.id === taskId) {
      setDetailTask((prev) => (prev ? { ...prev, dueAt: nextDue } : null));
    }
    setRescheduleSheetTask(null);
    setActionTask(null);
    await mobileTasksAdapter.quickReschedule(taskId, nextDue);
    showToast({
      title: "Tarea reprogramada",
      subtitle: `Vencimiento actualizado`,
    });
  };

  const handleToggleChecklist = async (taskId: string, itemId: string, completed: boolean) => {
    setTasks((current) =>
      current.map((t) => {
        if (t.id !== taskId) return t;
        const cl = (t.checklist || []).map((c) =>
          c.id === itemId ? { ...c, completed, completedAt: completed ? new Date().toISOString() : null } : c,
        );
        return { ...t, checklist: cl };
      }),
    );
    if (detailTask?.id === taskId) {
      setDetailTask((prev) => {
        if (!prev) return null;
        const cl = (prev.checklist || []).map((c) =>
          c.id === itemId ? { ...c, completed, completedAt: completed ? new Date().toISOString() : null } : c,
        );
        return { ...prev, checklist: cl };
      });
    }
    await mobileTasksAdapter.toggleChecklistItem(taskId, itemId, completed);
  };

  const handleAddDetailSubtask = async () => {
    if (!newDetailSubtask.trim() || !detailTask) return;
    const title = newDetailSubtask.trim();
    const tempId = `chk-mob-${Date.now()}`;
    const newItem = {
      id: tempId,
      title,
      completed: false,
    };
    setDetailTask((prev) => (prev ? { ...prev, checklist: [...(prev.checklist || []), newItem] } : null));
    setTasks((prev) =>
      prev.map((t) => (t.id === detailTask.id ? { ...t, checklist: [...(t.checklist || []), newItem] } : t))
    );
    setNewDetailSubtask("");
    const res = await mobileTasksAdapter.addChecklistItem(detailTask.id, title);
    if (res.status === "success") {
      setDetailTask(res.task);
      setTasks((prev) => prev.map((t) => (t.id === detailTask.id ? res.task : t)));
    }
  };

  const handleDeleteDetailSubtask = async (itemId: string) => {
    if (!detailTask) return;
    const item = detailTask.checklist?.find((c) => c.id === itemId);
    const itemTitle = item?.title || "Subtarea";
    const taskId = detailTask.id;

    setDetailTask((prev) =>
      prev ? { ...prev, checklist: (prev.checklist || []).filter((c) => c.id !== itemId) } : null
    );
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, checklist: (t.checklist || []).filter((c) => c.id !== itemId) } : t))
    );

    const res = await mobileTasksAdapter.deleteChecklistItem(taskId, itemId);
    if (res.status === "success") {
      setDetailTask(res.task);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? res.task : t)));
    }

    showToast({
      title: "Subtarea eliminada",
      subtitle: itemTitle,
      actionLabel: "Deshacer",
      onAction: async () => {
        const addRes = await mobileTasksAdapter.addChecklistItem(taskId, itemTitle);
        if (addRes.status === "success") {
          setDetailTask(addRes.task);
          setTasks((prev) => prev.map((t) => (t.id === taskId ? addRes.task : t)));
        }
      },
    });
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const { id, title } = taskToDelete;
    setTaskToDelete(null);
    setDetailTask(null);
    setActionTask(null);
    setTasks((curr) => curr.filter((t) => t.id !== id));
    await mobileTasksAdapter.deleteTask(id);
    showToast({
      title: "Tarea eliminada definitivamente",
      subtitle: title,
    });
  };

  const openCreateWithTemplate = (tpl: TaskTemplateRecord) => {
    setNewTitle(tpl.name.replace(/^[^\w]+/, "").trim());
    setNewDesc(tpl.description || "");
    setNewPriority(tpl.defaultPriority);
    setNewDueHours((tpl.defaultDueDays || 1) * 24);
    setNewChecklistText(tpl.defaultChecklist ? tpl.defaultChecklist.join("\n") : "");
    setNewRelationLabel("");
    setCreateModalOpen(true);
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Requerido", "Por favor ingresa un título para la tarea.");
      return;
    }

    const checklistItems = newChecklistText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((title, i) => ({
        id: `chk-new-${Date.now()}-${i}`,
        title,
        completed: false,
      }));

    const dueAt = new Date(Date.now() + newDueHours * 3600 * 1000).toISOString();

    const input: CreateTaskInput = {
      organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
      suite: "crm",
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      priority: newPriority,
      dueAt,
      templateId: null,
      checklist: checklistItems,
      relation: newRelationLabel.trim()
        ? {
            entityType: "contact",
            entityId: `con-${Date.now()}`,
            label: newRelationLabel.trim(),
          }
        : null,
      assignedUser: { id: "usr-current", displayName: "Tú (Usuario Actual)" },
    };

    const res = await mobileTasksAdapter.createTask(input);
    if (res.status === "success") {
      setTasks((current) => [res.task, ...current]);
      setCreateModalOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewChecklistText("");
      setNewRelationLabel("");
    }
  };

  const pendingCount = useMemo(() => {
    return tasks.filter((t) => t.status !== "completed").length;
  }, [tasks]);

  const urgentCount = useMemo(() => {
    return tasks.filter((t) => (t.priority === "urgent" || t.priority === "high") && t.status !== "completed").length;
  }, [tasks]);

  const completedCount = useMemo(() => {
    return tasks.filter((t) => t.status === "completed").length;
  }, [tasks]);

  // Filtered tasks for list view
  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tasks.filter((t) => {
      if (q) {
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchRelation = t.relation?.label?.toLowerCase().includes(q);
        const matchTags = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchRelation && !matchTags) return false;
      }

      if (assigneeFilter === "mine") {
        if (t.assignedUserId !== "usr-current" && t.assignedUserId !== "usr-ana" && t.assignedUserId !== null) {
          return false;
        }
      } else if (assigneeFilter !== "all") {
        if (t.assignedUserId !== assigneeFilter) return false;
      }

      if (tagFilter && (!t.tags || !t.tags.includes(tagFilter))) {
        return false;
      }

      if (filterMode === "completed") return t.status === "completed";
      if (filterMode === "urgent") return (t.priority === "urgent" || t.priority === "high") && t.status !== "completed";
      if (filterMode === "today") {
        if (t.status === "completed" || !t.dueAt) return false;
        const d = new Date(t.dueAt);
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
      }
      return true;
    });
  }, [tasks, searchQuery, filterMode, assigneeFilter, tagFilter]);

  // Kanban tasks filtered by column
  const kanbanTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = tasks.filter((t) => {
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.relation?.label && t.relation.label.toLowerCase().includes(q))
      );
    });

    if (kanbanCol === "completed") {
      return list.filter((t) => t.status === "completed");
    }
    if (kanbanCol === "urgent") {
      return list.filter(
        (t) => (t.priority === "urgent" || t.priority === "high") && t.status !== "completed",
      );
    }
    return list.filter((t) => t.status !== "completed");
  }, [tasks, searchQuery, kanbanCol]);

  // Calendar dates
  const calendarDays = useMemo(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + calendarWeekOffset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const dayTasks = tasks.filter((t) => t.dueAt && t.dueAt.slice(0, 10) === iso);
      days.push({
        date: d,
        iso,
        dayNumber: d.getDate(),
        dayName: d.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase().slice(0, 3),
        isToday: d.toDateString() === new Date().toDateString(),
        hasTasks: dayTasks.length > 0,
        taskCount: dayTasks.length,
      });
    }
    return days;
  }, [calendarWeekOffset, tasks]);

  const calendarDateTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tasks.filter((t) => {
      if (!t.dueAt) return false;
      const matchDate = t.dueAt.slice(0, 10) === selectedCalendarDate;
      if (!matchDate) return false;
      if (q) {
        return (
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.relation?.label && t.relation.label.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [tasks, selectedCalendarDate, searchQuery]);

  const calendarMonthLabel = useMemo(() => {
    if (calendarDays.length === 0) return "";
    const first = new Date(calendarDays[0].iso);
    const month = first.toLocaleDateString("es-ES", { month: "long" });
    return month.charAt(0).toUpperCase() + month.slice(1) + " " + first.getFullYear();
  }, [calendarDays]);

  const monthViewLabel = useMemo(() => {
    const month = monthCursor.toLocaleDateString("es-ES", { month: "long" });
    return month.charAt(0).toUpperCase() + month.slice(1) + " " + monthCursor.getFullYear();
  }, [monthCursor]);

  const monthGridDays = useMemo(() => {
    const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const startDayOfWeek = monthStart.getDay();
    const mondayOffset = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek;
    const start = new Date(monthStart);
    start.setDate(monthStart.getDate() + mondayOffset);

    const days = [];
    for (let i = 0; i < 35; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const isCurrentMonth = d.getMonth() === monthCursor.getMonth();
      const dayTasks = tasks.filter((t) => t.dueAt && t.dueAt.slice(0, 10) === iso);
      days.push({
        date: d,
        iso,
        dayNumber: d.getDate(),
        isCurrentMonth,
        isToday: d.toDateString() === new Date().toDateString(),
        hasTasks: dayTasks.length > 0,
        taskCount: dayTasks.length,
      });
    }
    return days;
  }, [monthCursor, tasks]);

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

    const currentDayOfWeek = now.getDay();
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const startThisWeek = new Date(now);
    startThisWeek.setDate(now.getDate() + mondayOffset);
    startThisWeek.setHours(0, 0, 0, 0);

    const endThisWeek = new Date(startThisWeek);
    endThisWeek.setDate(startThisWeek.getDate() + 7);

    const endNextWeek = new Date(endThisWeek);
    endNextWeek.setDate(endThisWeek.getDate() + 7);

    const q = searchQuery.toLowerCase().trim();
    const searchFiltered = tasks.filter((t) => {
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.relation?.label && t.relation.label.toLowerCase().includes(q))
      );
    });

    searchFiltered.forEach((task) => {
      if (!task.dueAt) {
        noDate.push(task);
        return;
      }
      const due = new Date(task.dueAt);
      const isOverdueTask = due.getTime() < Date.now() && task.status !== "completed";
      const isSameAsToday = due.toDateString() === now.toDateString();
      const isSameAsTomorrow = due.toDateString() === startTomorrow.toDateString();

      if (isOverdueTask) {
        overdue.push(task);
      } else if (isSameAsToday) {
        today.push(task);
      } else if (isSameAsTomorrow) {
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
      { id: "overdue", title: "Vencidas", tone: "danger" as const, tasks: overdue },
      { id: "today", title: "Para Hoy", tone: "primary" as const, tasks: today },
      { id: "tomorrow", title: "Mañana", tone: "warning" as const, tasks: tomorrow },
      { id: "thisWeek", title: "Esta Semana", tone: "info" as const, tasks: thisWeek },
      { id: "nextWeek", title: "Próxima Semana", tone: "neutral" as const, tasks: nextWeek },
      { id: "later", title: "Más Adelante", tone: "neutral" as const, tasks: later },
      { id: "noDate", title: "Sin Fecha Asignada", tone: "neutral" as const, tasks: noDate },
    ].filter((g) => g.tasks.length > 0);
  }, [tasks, searchQuery]);

  const hasActiveFilters = filterMode !== "all" || assigneeFilter !== "all" || tagFilter !== null;
  const activeFilterCount =
    (filterMode !== "all" ? 1 : 0) + (assigneeFilter !== "all" ? 1 : 0) + (tagFilter !== null ? 1 : 0);

  const handleClearAllFilters = () => {
    setFilterMode("all");
    setAssigneeFilter("all");
    setTagFilter(null);
  };

  return (
    <ScrollView
      style={commonMobileStyles.screenContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Global Page Header */}
      <MobilePageHeader
        eyebrow="Sales CRM"
        title="Tareas"
        subtitle={`${pendingCount} pendientes de ${tasks.length} total`}
        primaryAction={{
          label: "Nueva tarea",
          onPress: () => {
            setNewTitle("");
            setNewDesc("");
            setNewPriority("normal");
            setNewDueHours(24);
            setNewChecklistText("");
            setNewRelationLabel("");
            setCreateModalOpen(true);
          },
        }}
      />

      {/* 2. View Mode Switcher (Canonical MobilePageTabs, NO PILLS) */}
      <MobilePageTabs
        activeTab={viewMode}
        onTabChange={(tab) => setViewMode(tab as ViewMode)}
        tabs={[
          { id: "list", label: "Lista", count: tasks.length },
          { id: "kanban", label: "Kanban" },
          { id: "calendar", label: "Calendario" },
        ]}
      />

      {/* 3. Search Bar with Filter Button (Option 1) */}
      <MobileSearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar tareas, clientes o notas..."
        onFilterPress={() => setFilterModalOpen(true)}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearAllFilters}
      />

      {/* Active Filter Badges (Only shown when filters are active) */}
      {hasActiveFilters && (
        <View style={styles.activeFilterChipsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {filterMode !== "all" && (
              <Pressable style={styles.activeFilterChip} onPress={() => setFilterMode("all")}>
                {filterMode === "urgent" && <Flame size={13} color="#dc2626" />}
                {filterMode === "today" && <Calendar size={13} color={mobileTheme.colors.primary} />}
                {filterMode === "completed" && <CheckCircle2 size={13} color="#16a34a" />}
                <Text style={styles.activeFilterChipText}>
                  {filterMode === "urgent"
                    ? `Urgentes (${urgentCount})`
                    : filterMode === "today"
                    ? "Para hoy"
                    : `Completadas (${completedCount})`}
                </Text>
                <X size={12} color={mobileTheme.colors.primary} />
              </Pressable>
            )}

            {assigneeFilter !== "all" && (
              <Pressable style={styles.activeFilterChip} onPress={() => setAssigneeFilter("all")}>
                <User size={13} color={mobileTheme.colors.primary} />
                <Text style={styles.activeFilterChipText}>Mis tareas</Text>
                <X size={12} color={mobileTheme.colors.primary} />
              </Pressable>
            )}

            {tagFilter && (
              <Pressable style={styles.activeFilterChip} onPress={() => setTagFilter(null)}>
                <Tag size={13} color={mobileTheme.colors.primary} />
                <Text style={styles.activeFilterChipText}>{tagFilter}</Text>
                <X size={12} color={mobileTheme.colors.primary} />
              </Pressable>
            )}

            <Pressable onPress={handleClearAllFilters} style={styles.clearAllFiltersLink}>
              <Text style={styles.clearAllFiltersText}>Limpiar todo</Text>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* 4. VIEW 1: LIST VIEW (100% Clean - No infinite horizontal franjas) */}
      {viewMode === "list" && (
        <>
          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {tasks.length ? "No hay tareas que coincidan con los filtros." : "Sin tareas pendientes. Crea la primera."}
              </Text>
            </View>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={() => handleToggleComplete(task.id, task.status === "completed")}
                onOpenDetail={() => setDetailTask(task)}
                onOpenActions={() => setActionTask(task)}
                onNavigateToContact={onNavigateToContact}
              />
            ))
          )}
        </>
      )}

      {/* 5. VIEW 2: KANBAN VIEW */}
      {viewMode === "kanban" && (
        <View>
          <MobilePageTabs
            activeTab={kanbanCol}
            onTabChange={(tab) => setKanbanCol(tab as KanbanCol)}
            tabs={[
              { id: "pending", label: "Pendientes", count: pendingCount },
              { id: "urgent", label: "Urgentes", count: urgentCount },
              { id: "completed", label: "Listas", count: completedCount },
            ]}
          />

          {kanbanTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No hay tareas en esta columna.</Text>
            </View>
          ) : (
            kanbanTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={() => handleToggleComplete(task.id, task.status === "completed")}
                onOpenDetail={() => setDetailTask(task)}
                onOpenActions={() => setActionTask(task)}
                onNavigateToContact={onNavigateToContact}
              />
            ))
          )}
        </View>
      )}

      {/* 6. VIEW 3: CALENDAR VIEW (SEMANA / MES / FLUJO) */}
      {viewMode === "calendar" && (
        <View>
          {/* Sub-view Switcher: Semana | Mes | Flujo (Canonical MobilePageTabs, NO PILLS) */}
          <MobilePageTabs
            activeTab={calendarSubView}
            onTabChange={(tab) => setCalendarSubView(tab as CalendarSubView)}
            tabs={[
              { id: "week", label: "Semana" },
              { id: "month", label: "Mes" },
              { id: "stream", label: "Flujo" },
            ]}
          />

          {/* SUB-VIEW 1: VISTA SEMANA (7 Días) */}
          {calendarSubView === "week" && (
            <View>
              {/* Calendar Week Navigation Header */}
              <View style={styles.calendarNavHeader}>
                <View style={styles.calendarNavControls}>
                  <Pressable
                    style={styles.calendarNavButton}
                    onPress={() => {
                      setCalendarWeekOffset(0);
                      setSelectedCalendarDate(new Date().toISOString().slice(0, 10));
                    }}
                  >
                    <Text style={styles.calendarTodayText}>Hoy</Text>
                  </Pressable>
                  <Pressable
                    style={styles.calendarArrowButton}
                    onPress={() => setCalendarWeekOffset((prev) => prev - 1)}
                  >
                    <ChevronLeft size={16} color={mobileTheme.colors.textMuted} />
                  </Pressable>
                  <Pressable
                    style={styles.calendarArrowButton}
                    onPress={() => setCalendarWeekOffset((prev) => prev + 1)}
                  >
                    <ChevronRight size={16} color={mobileTheme.colors.textMuted} />
                  </Pressable>
                </View>
                <Text style={styles.calendarMonthText}>{calendarMonthLabel}</Text>
              </View>

              {/* 7-Day Horizontal Strip */}
              <View style={styles.calendarDaysStrip}>
                {calendarDays.map((day) => {
                  const isSelected = day.iso === selectedCalendarDate;
                  return (
                    <Pressable
                      key={day.iso}
                      onPress={() => setSelectedCalendarDate(day.iso)}
                      style={[
                        styles.calendarDayTab,
                        isSelected && styles.calendarDayTabSelected,
                        day.isToday && !isSelected && styles.calendarDayTabToday,
                      ]}
                    >
                      <Text style={[styles.calendarDayName, isSelected && styles.calendarDayTextSelected]}>
                        {day.dayName}
                      </Text>
                      <Text style={[styles.calendarDayNum, isSelected && styles.calendarDayTextSelected]}>
                        {day.dayNumber}
                      </Text>
                      {day.hasTasks && (
                        <View style={[styles.calendarTaskDot, isSelected && styles.calendarTaskDotSelected]} />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Tasks of Selected Date */}
              <View style={styles.calendarAgendaHeader}>
                <Calendar size={14} color={mobileTheme.colors.primary} />
                <Text style={styles.calendarAgendaTitle}>
                  Tareas para el {new Date(selectedCalendarDate).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })}
                </Text>
              </View>

              {calendarDateTasks.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Sin tareas programadas para este día.</Text>
                </View>
              ) : (
                calendarDateTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={() => handleToggleComplete(task.id, task.status === "completed")}
                    onOpenDetail={() => setDetailTask(task)}
                    onOpenActions={() => setActionTask(task)}
                    onNavigateToContact={onNavigateToContact}
                  />
                ))
              )}
            </View>
          )}

          {/* SUB-VIEW 2: VISTA MES (Cuadrícula Mensual Compacta) */}
          {calendarSubView === "month" && (
            <View>
              {/* Month Navigation Header */}
              <View style={styles.calendarNavHeader}>
                <View style={styles.calendarNavControls}>
                  <Pressable
                    style={styles.calendarNavButton}
                    onPress={() => {
                      setMonthCursor(new Date());
                      setSelectedCalendarDate(new Date().toISOString().slice(0, 10));
                    }}
                  >
                    <Text style={styles.calendarTodayText}>Hoy</Text>
                  </Pressable>
                  <Pressable
                    style={styles.calendarArrowButton}
                    onPress={() => {
                      setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1));
                    }}
                  >
                    <ChevronLeft size={16} color={mobileTheme.colors.textMuted} />
                  </Pressable>
                  <Pressable
                    style={styles.calendarArrowButton}
                    onPress={() => {
                      setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1));
                    }}
                  >
                    <ChevronRight size={16} color={mobileTheme.colors.textMuted} />
                  </Pressable>
                </View>
                <Text style={styles.calendarMonthText}>{monthViewLabel}</Text>
              </View>

              {/* Month Grid Card */}
              <View style={styles.monthGridCard}>
                {/* Days of week header (L, M, X, J, V, S, D) */}
                <View style={styles.monthDaysHeader}>
                  {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
                    <Text key={i} style={styles.monthDayHeaderLabel}>
                      {d}
                    </Text>
                  ))}
                </View>

                {/* 5 Rows x 7 Cols Grid */}
                <View style={styles.monthGrid}>
                  {monthGridDays.map((cell) => {
                    const isSelected = cell.iso === selectedCalendarDate;
                    return (
                      <Pressable
                        key={cell.iso}
                        onPress={() => setSelectedCalendarDate(cell.iso)}
                        style={[
                          styles.monthGridCell,
                          !cell.isCurrentMonth && styles.monthGridCellDimmed,
                          cell.isToday && !isSelected && styles.monthGridCellToday,
                          isSelected && styles.monthGridCellSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.monthGridCellText,
                            !cell.isCurrentMonth && styles.monthGridCellTextDimmed,
                            isSelected && styles.monthGridCellTextSelected,
                          ]}
                        >
                          {cell.dayNumber}
                        </Text>
                        {cell.hasTasks && (
                          <View
                            style={[
                              styles.monthGridDot,
                              isSelected && styles.monthGridDotSelected,
                            ]}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Tasks for selected day in month */}
              <View style={styles.calendarAgendaHeader}>
                <Calendar size={14} color={mobileTheme.colors.primary} />
                <Text style={styles.calendarAgendaTitle}>
                  Tareas del {new Date(selectedCalendarDate).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })}
                </Text>
              </View>

              {calendarDateTasks.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Sin tareas programadas para este día.</Text>
                </View>
              ) : (
                calendarDateTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={() => handleToggleComplete(task.id, task.status === "completed")}
                    onOpenDetail={() => setDetailTask(task)}
                    onOpenActions={() => setActionTask(task)}
                    onNavigateToContact={onNavigateToContact}
                  />
                ))
              )}
            </View>
          )}

          {/* SUB-VIEW 3: VISTA FLUJO / AGENDA CRONOLÓGICA */}
          {calendarSubView === "stream" && (
            <View>
              {streamGroups.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No hay tareas para mostrar en el flujo.</Text>
                </View>
              ) : (
                streamGroups.map((group) => (
                  <View key={group.id} style={styles.streamGroup}>
                    {/* Stream Group Header */}
                    <View style={styles.streamGroupHeader}>
                      <View
                        style={[
                          styles.streamGroupBadge,
                          group.tone === "danger"
                            ? styles.priorityUrgent
                            : group.tone === "primary"
                            ? styles.priorityNormal
                            : group.tone === "warning"
                            ? styles.priorityHigh
                            : styles.streamGroupBadgeNeutral,
                        ]}
                      >
                        <Text
                          style={[
                            styles.streamGroupBadgeText,
                            group.tone === "danger"
                              ? styles.priorityUrgentText
                              : group.tone === "primary"
                              ? styles.priorityNormalText
                              : group.tone === "warning"
                              ? styles.priorityHighText
                              : styles.streamGroupBadgeTextNeutral,
                          ]}
                        >
                          {group.title.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.streamGroupCount}>
                        ({group.tasks.length} tarea{group.tasks.length === 1 ? "" : "s"})
                      </Text>
                    </View>

                    {/* Group Tasks */}
                    {group.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={() => handleToggleComplete(task.id, task.status === "completed")}
                        onOpenDetail={() => setDetailTask(task)}
                        onOpenActions={() => setActionTask(task)}
                        onNavigateToContact={onNavigateToContact}
                      />
                    ))}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Contextual Actions Sheet (Standard 3-dots sheet)                */}
      {/* ========================================================================= */}
      <MobileModalSheet
        visible={Boolean(actionTask)}
        onClose={() => setActionTask(null)}
        title={actionTask ? `Acciones: ${actionTask.title}` : "Acciones"}
      >
        {actionTask && (
          <View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const target = actionTask;
                setActionTask(null);
                setDetailTask(target);
              }}
              style={styles.actionItem}
            >
              <Eye size={18} color={mobileTheme.colors.textMuted} />
              <Text style={styles.actionText}>Ver detalle y subtareas</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const target = actionTask;
                setActionTask(null);
                setRescheduleSheetTask(target);
              }}
              style={styles.actionItem}
            >
              <Clock size={18} color={mobileTheme.colors.warning} />
              <Text style={styles.actionText}>Posponer / Reprogramar fecha</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                handleToggleComplete(actionTask.id, actionTask.status === "completed");
                setActionTask(null);
              }}
              style={styles.actionItem}
            >
              {actionTask.status === "completed" ? (
                <>
                  <RotateCcw size={18} color={mobileTheme.colors.primary} />
                  <Text style={styles.actionText}>Reabrir tarea</Text>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} color={mobileTheme.colors.success} />
                  <Text style={styles.actionText}>Marcar como completada</Text>
                </>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const target = actionTask;
                setActionTask(null);
                setTaskToDelete(target);
              }}
              style={[styles.actionItem, styles.destructiveAction]}
            >
              <Trash2 size={18} color={mobileTheme.colors.danger} />
              <Text style={[styles.actionText, styles.destructiveText]}>Eliminar tarea</Text>
            </Pressable>
          </View>
        )}
      </MobileModalSheet>

      {/* ========================================================================= */}
      {/* MODAL 2: Quick Reschedule Sheet                                          */}
      {/* ========================================================================= */}
      <MobileModalSheet
        visible={Boolean(rescheduleSheetTask)}
        onClose={() => setRescheduleSheetTask(null)}
        title="Reprogramar Tarea"
      >
        {rescheduleSheetTask && (
          <View style={styles.rescheduleList}>
            {[
              { label: "En 1 hora", hours: 1 },
              { label: "En 4 horas", hours: 4 },
              { label: "Mañana a esta hora", hours: 24 },
              { label: "En 2 días", hours: 48 },
              { label: "Próxima semana", hours: 168 },
            ].map((opt) => (
              <Pressable
                key={opt.hours}
                onPress={() => handleQuickReschedule(rescheduleSheetTask.id, opt.hours)}
                style={styles.rescheduleOption}
              >
                <Clock size={16} color={mobileTheme.colors.primary} />
                <Text style={styles.rescheduleOptionText}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </MobileModalSheet>

      {/* ========================================================================= */}
      {/* MODAL 3: Detail & In-Place Editing Sheet                                 */}
      {/* ========================================================================= */}
      <MobileModalSheet
        visible={Boolean(detailTask)}
        onClose={() => setDetailTask(null)}
        title="Detalle y Edición de Tarea"
      >
        {detailTask && (
          <View style={{ gap: 14 }}>
            {/* 1. Editable Title */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionLabel}>TÍTULO DE LA TAREA</Text>
              <TextInput
                style={styles.detailTitleInput}
                value={detailTitle}
                onChangeText={setDetailTitle}
                onBlur={handleSaveDetailTitle}
                placeholder="Título de la tarea..."
                placeholderTextColor={mobileTheme.colors.textSubtle}
              />
            </View>

            {/* 2. Priority & Due Date Row */}
            <View style={styles.detailMetaGrid}>
              <View style={styles.detailMetaCol}>
                <Text style={styles.detailMetaLabel}>PRIORIDAD</Text>
                <View style={styles.detailPriorityRow}>
                  {(["normal", "high", "urgent"] as TaskPriority[]).map((p) => {
                    const isSelected = detailTask.priority === p;
                    return (
                      <Pressable
                        key={p}
                        onPress={() => handleChangeDetailPriority(p)}
                        style={[
                          styles.detailPriorityPill,
                          isSelected && (p === "urgent" ? styles.priorityUrgent : p === "high" ? styles.priorityHigh : styles.priorityNormal),
                        ]}
                      >
                        <Text
                          style={[
                            styles.detailPriorityPillText,
                            isSelected && (p === "urgent" ? styles.priorityUrgentText : p === "high" ? styles.priorityHighText : styles.priorityNormalText),
                          ]}
                        >
                          {p.toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.detailMetaCol}>
                <Text style={styles.detailMetaLabel}>FECHA LÍMITE</Text>
                <Text style={styles.detailMetaValue}>
                  {detailTask.dueAt
                    ? new Date(detailTask.dueAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Sin fecha"}
                </Text>
              </View>
            </View>

            {/* 3. Assignee User Selector */}
            <View style={styles.detailSection}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={styles.detailSectionLabel}>RESPONSABLE ASIGNADO</Text>
                <Pressable onPress={() => setShowAssigneePicker(!showAssigneePicker)}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: mobileTheme.colors.primary }}>
                    {showAssigneePicker ? "Cerrar" : "Cambiar"}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.assigneeCurrentRow}>
                <View style={styles.assigneeAvatar}>
                  <Text style={styles.assigneeAvatarText}>
                    {detailTask.assignedUser?.displayName ? detailTask.assignedUser.displayName.slice(0, 2).toUpperCase() : "U"}
                  </Text>
                </View>
                <Text style={styles.assigneeCurrentName}>
                  {detailTask.assignedUser?.displayName || "Sin responsable asignado"}
                </Text>
              </View>

              {showAssigneePicker && (
                <View style={styles.assigneePickerContainer}>
                  <Pressable
                    onPress={() => handleChangeDetailAssignee(null)}
                    style={[styles.assigneePickerOption, !detailTask.assignedUserId && styles.assigneePickerOptionSelected]}
                  >
                    <User size={13} color={mobileTheme.colors.textMuted} />
                    <Text style={styles.assigneePickerOptionText}>Sin asignar</Text>
                  </Pressable>
                  {AVAILABLE_ASSIGNABLE_USERS.map((u) => {
                    const isSelected = detailTask.assignedUserId === u.id;
                    return (
                      <Pressable
                        key={u.id}
                        onPress={() => handleChangeDetailAssignee(u)}
                        style={[styles.assigneePickerOption, isSelected && styles.assigneePickerOptionSelected]}
                      >
                        <View style={styles.assigneePickerAvatar}>
                          <Text style={styles.assigneePickerAvatarText}>{u.displayName.slice(0, 2).toUpperCase()}</Text>
                        </View>
                        <Text style={[styles.assigneePickerOptionText, isSelected && styles.assigneePickerOptionTextSelected]}>
                          {u.displayName}
                        </Text>
                        {isSelected && <Check size={14} color={mobileTheme.colors.primary} />}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* 4. Tags & Categories */}
            <View style={styles.detailSection}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={styles.detailSectionLabel}>ETIQUETAS & CATEGORÍAS</Text>
                <Pressable onPress={() => setShowTagInput(!showTagInput)}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: mobileTheme.colors.primary }}>
                    {showTagInput ? "Cerrar" : "+ Añadir"}
                  </Text>
                </Pressable>
              </View>

              {/* Active Tags */}
              <View style={styles.tagsContainer}>
                {(detailTask.tags || []).map((t) => (
                  <View key={t} style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>{t}</Text>
                    <Pressable onPress={() => handleDeleteDetailTag(t)} hitSlop={6}>
                      <X size={12} color={mobileTheme.colors.primary} />
                    </Pressable>
                  </View>
                ))}
                {(!detailTask.tags || detailTask.tags.length === 0) && !showTagInput && (
                  <Text style={styles.detailEmptyText}>Sin etiquetas.</Text>
                )}
              </View>

              {/* Tag Suggestions and Input */}
              {showTagInput && (
                <View style={{ gap: 8, marginTop: 8 }}>
                  <View style={styles.addTagRow}>
                    <TextInput
                      style={styles.addTagInput}
                      placeholder="Ej: #VIP o #Renovación"
                      placeholderTextColor={mobileTheme.colors.textSubtle}
                      value={customTagInput}
                      onChangeText={setCustomTagInput}
                      onSubmitEditing={() => handleAddDetailTag(customTagInput)}
                    />
                    <Pressable
                      onPress={() => handleAddDetailTag(customTagInput)}
                      style={styles.addTagButton}
                      disabled={!customTagInput.trim()}
                    >
                      <Plus size={14} color="#ffffff" />
                    </Pressable>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {MOBILE_PRESET_TAGS.filter((pt) => !(detailTask.tags || []).includes(pt)).map((pt) => (
                      <Pressable
                        key={pt}
                        onPress={() => handleAddDetailTag(pt)}
                        style={styles.tagSuggestionChip}
                      >
                        <Text style={styles.tagSuggestionChipText}>{pt}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* 5. Programmed Reminders */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionLabel}>RECORDATORIOS PROGRAMADOS</Text>

              <View style={{ gap: 6, marginVertical: 4 }}>
                {(detailTask.reminders || []).map((rem, idx) => (
                  <View key={idx} style={styles.reminderRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                      <Bell size={13} color={mobileTheme.colors.warning} />
                      <Text style={styles.reminderText}>
                        {new Date(rem.remindAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <Pressable onPress={() => handleDeleteDetailReminder(idx)} hitSlop={6}>
                      <Trash2 size={13} color={mobileTheme.colors.textSubtle} />
                    </Pressable>
                  </View>
                ))}
                {(!detailTask.reminders || detailTask.reminders.length === 0) && (
                  <Text style={styles.detailEmptyText}>Sin recordatorios activos.</Text>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 4 }}>
                {[
                  { label: "15 min antes", minutes: 15 },
                  { label: "1 hora antes", minutes: 60 },
                  { label: "1 día antes", minutes: 1440 },
                ].map((preset) => (
                  <Pressable
                    key={preset.minutes}
                    onPress={() => handleAddDetailReminder(preset.minutes, preset.label)}
                    style={styles.reminderPresetButton}
                  >
                    <Clock size={11} color={mobileTheme.colors.primary} />
                    <Text style={styles.reminderPresetButtonText}>+ {preset.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* 6. Editable Description */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionLabel}>DESCRIPCIÓN O NOTAS</Text>
              <TextInput
                style={[styles.detailTitleInput, styles.detailDescInput]}
                multiline
                value={detailDesc}
                onChangeText={setDetailDesc}
                onBlur={handleSaveDetailDesc}
                placeholder="Añade detalles o notas..."
                placeholderTextColor={mobileTheme.colors.textSubtle}
              />
            </View>

            {/* 7. Checklist items */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionLabel}>
                SUBTAREAS ({(detailTask.checklist || []).filter((c) => c.completed).length}/{(detailTask.checklist || []).length})
              </Text>
              {(detailTask.checklist || []).length === 0 ? (
                <Text style={styles.detailEmptyText}>No hay subtareas registradas.</Text>
              ) : (
                (detailTask.checklist || []).map((item) => (
                  <View key={item.id} style={styles.checklistItemRow}>
                    <Pressable
                      onPress={() => handleToggleChecklist(detailTask.id, item.id, !item.completed)}
                      style={styles.checklistCheckableArea}
                    >
                      <View style={[styles.checklistCheckbox, item.completed && styles.checklistCheckboxDone]}>
                        {item.completed && <Check size={12} color="#ffffff" strokeWidth={3} />}
                      </View>
                      <Text style={[styles.checklistItemText, item.completed && styles.checklistItemTextDone]}>
                        {item.title}
                      </Text>
                    </Pressable>
                    <Pressable
                      hitSlop={8}
                      onPress={() => handleDeleteDetailSubtask(item.id)}
                      style={styles.checklistDeleteButton}
                    >
                      <Trash2 size={15} color={mobileTheme.colors.textSubtle} />
                    </Pressable>
                  </View>
                ))
              )}

              {/* Inline Add Subtask input */}
              <View style={styles.addChecklistInlineRow}>
                <TextInput
                  style={styles.addChecklistInput}
                  placeholder="Añadir subtarea..."
                  placeholderTextColor={mobileTheme.colors.textSubtle}
                  value={newDetailSubtask}
                  onChangeText={setNewDetailSubtask}
                  onSubmitEditing={handleAddDetailSubtask}
                  returnKeyType="done"
                />
                <Pressable
                  onPress={handleAddDetailSubtask}
                  disabled={!newDetailSubtask.trim()}
                  style={[
                    styles.addChecklistButton,
                    !newDetailSubtask.trim() && styles.addChecklistButtonDisabled,
                  ]}
                >
                  <Plus size={15} color={newDetailSubtask.trim() ? "#ffffff" : mobileTheme.colors.textSubtle} />
                  <Text
                    style={[
                      styles.addChecklistButtonText,
                      !newDetailSubtask.trim() && styles.addChecklistButtonTextDisabled,
                    ]}
                  >
                    Añadir
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 8. Actions Bottom Row */}
            <View style={styles.detailActionsBottomRow}>
              <Pressable
                onPress={() => {
                  handleToggleComplete(detailTask.id, detailTask.status === "completed");
                }}
                style={[
                  styles.detailActionButton,
                  detailTask.status === "completed" && styles.detailActionButtonReopen,
                  { flex: 1, marginTop: 0 },
                ]}
              >
                <Text style={styles.detailActionButtonText}>
                  {detailTask.status === "completed" ? "Reabrir Tarea" : "Marcar como Completada"}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Eliminar tarea"
                onPress={() => {
                  const target = detailTask;
                  setDetailTask(null);
                  setTaskToDelete(target);
                }}
                style={styles.detailDeleteButton}
              >
                <Trash2 size={18} color={mobileTheme.colors.danger} />
              </Pressable>
            </View>
          </View>
        )}
      </MobileModalSheet>

      {/* ========================================================================= */}
      {/* MODAL 4: Create Task Sheet                                               */}
      {/* ========================================================================= */}
      <MobileModalSheet
        visible={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Crear Nueva Tarea"
      >
        <View style={styles.formContainer}>
          {templates.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.formLabel}>PLANTILLAS RÁPIDAS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {templates.map((tpl) => (
                  <Pressable
                    key={tpl.id}
                    style={styles.modalTemplateChip}
                    onPress={() => openCreateWithTemplate(tpl)}
                  >
                    <Sparkles size={12} color={mobileTheme.colors.primary} />
                    <Text style={styles.modalTemplateChipText}>{tpl.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.formLabel}>TÍTULO DE LA TAREA *</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Ej: Revisión de propuesta comercial"
            placeholderTextColor={mobileTheme.colors.textSubtle}
            value={newTitle}
            onChangeText={setNewTitle}
          />

          <Text style={styles.formLabel}>DESCRIPCIÓN O NOTAS</Text>
          <TextInput
            style={[styles.formInput, styles.formTextArea]}
            placeholder="Detalles adicionales o contexto..."
            placeholderTextColor={mobileTheme.colors.textSubtle}
            multiline
            value={newDesc}
            onChangeText={setNewDesc}
          />

          <Text style={styles.formLabel}>PRIORIDAD</Text>
          <View style={styles.prioritySelector}>
            {(["normal", "high", "urgent"] as TaskPriority[]).map((p) => {
              const active = newPriority === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setNewPriority(p)}
                  style={[styles.prioritySelectorItem, active && styles.prioritySelectorItemActive]}
                >
                  <Text style={[styles.prioritySelectorText, active && styles.prioritySelectorTextActive]}>
                    {p.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.formLabel}>CLIENTE / RELACIÓN</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Nombre de cliente o empresa..."
            placeholderTextColor={mobileTheme.colors.textSubtle}
            value={newRelationLabel}
            onChangeText={setNewRelationLabel}
          />

          <Text style={styles.formLabel}>CHECKLIST / SUBTAREAS (Una por línea)</Text>
          <TextInput
            style={[styles.formInput, styles.formTextArea]}
            placeholder="Paso 1: Llamar al cliente&#10;Paso 2: Enviar PDF"
            placeholderTextColor={mobileTheme.colors.textSubtle}
            multiline
            value={newChecklistText}
            onChangeText={setNewChecklistText}
          />

          <Pressable style={styles.createSubmitButton} onPress={handleCreateTask}>
            <Text style={styles.createSubmitButtonText}>Crear Tarea</Text>
          </Pressable>
        </View>
      </MobileModalSheet>

      {/* ========================================================================= */}
      {/* MODAL 5: Delete Task Confirmation Sheet                                   */}
      {/* ========================================================================= */}
      <MobileModalSheet
        visible={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        title="¿Eliminar Tarea?"
      >
        {taskToDelete && (
          <View style={styles.confirmDeleteContainer}>
            <Text style={styles.confirmDeleteDescription}>
              ¿Estás seguro de que deseas eliminar "{taskToDelete.title}"? Esta acción no se puede deshacer y borrará sus subtareas.
            </Text>

            <Pressable
              onPress={handleConfirmDeleteTask}
              style={styles.confirmDeleteButton}
            >
              <Text style={styles.confirmDeleteButtonText}>Eliminar definitivamente</Text>
            </Pressable>

            <Pressable
              onPress={() => setTaskToDelete(null)}
              style={styles.confirmCancelButton}
            >
              <Text style={styles.confirmCancelButtonText}>Cancelar</Text>
            </Pressable>
          </View>
        )}
      </MobileModalSheet>

      {/* ========================================================================= */}
      {/* MODAL 6: Full-Height HubSpot-Style MobileControlSheet                    */}
      {/* ========================================================================= */}
      <MobileControlSheet
        visible={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title="Filtros y Vistas CRM"
        eyebrow="Sales CRM · Control Center"
        activeFilterCount={activeFilterCount}
        resultCount={filteredTasks.length}
        onReset={handleClearAllFilters}
        onApply={() => setFilterModalOpen(false)}
        presets={[
          {
            id: "mine_urgent",
            label: "Mis Urgentes",
            icon: Flame,
            active: assigneeFilter === "mine" && filterMode === "urgent",
            onSelect: () => {
              setAssigneeFilter("mine");
              setFilterMode("urgent");
            },
          },
          {
            id: "due_today",
            label: "Para Hoy / Atrasadas",
            icon: Calendar,
            active: filterMode === "today",
            onSelect: () => {
              setFilterMode("today");
            },
          },
          {
            id: "vip_deals",
            label: "Cierres VIP",
            icon: Sparkles,
            active: tagFilter === "#VIP",
            onSelect: () => {
              setTagFilter("#VIP");
            },
          },
          {
            id: "all_team",
            label: "Todo el Equipo",
            icon: Users,
            active: assigneeFilter === "all" && filterMode === "all" && tagFilter === null,
            onSelect: handleClearAllFilters,
          },
        ]}
      >
        {/* Section 1: Estado */}
        <View style={styles.sheetSectionBlock}>
          <Text style={styles.sheetSectionHeader}>ESTADO DE LA TAREA</Text>
          <View style={styles.filterGrid}>
            {[
              { id: "all", label: `Todas (${tasks.length})`, icon: null },
              { id: "urgent", label: `Urgentes (${urgentCount})`, icon: Flame },
              { id: "today", label: "Para hoy", icon: Calendar },
              { id: "completed", label: `Completadas (${completedCount})`, icon: CheckCircle2 },
            ].map((item) => {
              const selected = filterMode === item.id;
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFilterMode(item.id as FilterMode)}
                  style={[styles.filterGridItem, selected && styles.filterGridItemSelected]}
                >
                  {Icon && (
                    <Icon
                      size={14}
                      color={
                        selected
                          ? mobileTheme.colors.textInverse
                          : item.id === "urgent"
                          ? mobileTheme.colors.danger
                          : item.id === "today"
                          ? mobileTheme.colors.primary
                          : mobileTheme.colors.success
                      }
                    />
                  )}
                  <Text style={[styles.filterGridItemText, selected && styles.filterGridItemTextSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 2: Responsable y Equipo */}
        <View style={styles.sheetSectionBlock}>
          <Text style={styles.sheetSectionHeader}>RESPONSABLE / AGENTE ASIGNADO</Text>
          <View style={styles.assigneesGrid}>
            <Pressable
              onPress={() => setAssigneeFilter("all")}
              style={[styles.assigneeTile, assigneeFilter === "all" && styles.assigneeTileSelected]}
            >
              <Users size={14} color={assigneeFilter === "all" ? "#ffffff" : mobileTheme.colors.textMuted} />
              <Text style={[styles.assigneeTileText, assigneeFilter === "all" && styles.assigneeTileTextSelected]}>
                Todo el equipo
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setAssigneeFilter("mine")}
              style={[styles.assigneeTile, assigneeFilter === "mine" && styles.assigneeTileSelected]}
            >
              <User size={14} color={assigneeFilter === "mine" ? "#ffffff" : mobileTheme.colors.primary} />
              <Text style={[styles.assigneeTileText, assigneeFilter === "mine" && styles.assigneeTileTextSelected]}>
                Solo mis tareas
              </Text>
            </Pressable>

            {AVAILABLE_ASSIGNABLE_USERS.map((user) => {
              const isSelected = assigneeFilter === user.id;
              return (
                <Pressable
                  key={user.id}
                  onPress={() => setAssigneeFilter(isSelected ? "all" : user.id)}
                  style={[styles.assigneeTile, isSelected && styles.assigneeTileSelected]}
                >
                  <View
                    style={[
                      styles.assigneeTileAvatar,
                      isSelected && { backgroundColor: "rgba(255,255,255,0.25)" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.assigneeTileAvatarText,
                        isSelected && { color: "#ffffff" },
                      ]}
                    >
                      {user.displayName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.assigneeTileText,
                      isSelected && styles.assigneeTileTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {user.displayName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 3: Etiquetas Temáticas */}
        <View style={styles.sheetSectionBlock}>
          <Text style={styles.sheetSectionHeader}>ETIQUETAS TEMÁTICAS</Text>
          <View style={styles.tagsFilterWrap}>
            {MOBILE_PRESET_TAGS.map((tag) => {
              const selected = tagFilter === tag;
              return (
                <Pressable
                  key={tag}
                  onPress={() => setTagFilter((curr) => (curr === tag ? null : tag))}
                  style={[styles.filterTagChip, selected && styles.filterTagChipSelected]}
                >
                  <Tag size={12} color={selected ? mobileTheme.colors.textInverse : mobileTheme.colors.primary} />
                  <Text style={[styles.filterTagChipText, selected && styles.filterTagChipTextSelected]}>
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </MobileControlSheet>

      {/* ========================================================================= */}
      {/* FLOATING SNACKBAR / TOAST NOTIFICATION WITH UNDO                          */}
      {/* ========================================================================= */}
      {toast && (
        <View style={styles.floatingToast}>
          <View style={styles.floatingToastContent}>
            <View style={styles.floatingToastIcon}>
              <Check size={12} color="#ffffff" strokeWidth={3} />
            </View>
            <View style={styles.floatingToastTextCol}>
              <Text style={styles.floatingToastTitle} numberOfLines={1}>{toast.title}</Text>
              {toast.subtitle ? (
                <Text style={styles.floatingToastSubtitle} numberOfLines={1}>{toast.subtitle}</Text>
              ) : null}
            </View>
          </View>
          {toast.actionLabel && toast.onAction ? (
            <Pressable
              onPress={() => {
                const act = toast.onAction;
                setToast(null);
                act?.();
              }}
              style={styles.floatingToastAction}
            >
              <Text style={styles.floatingToastActionText}>{toast.actionLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

// =============================================================================
// Standalone Standardized TaskCard (Identical rhythm & token usage as ContactCard)
// =============================================================================
function TaskCard({
  task,
  onToggleComplete,
  onOpenDetail,
  onOpenActions,
  onNavigateToContact,
}: {
  task: TaskRecord;
  onToggleComplete: () => void;
  onOpenDetail: () => void;
  onOpenActions: () => void;
  onNavigateToContact?: (contactId: string) => void;
}) {
  const isCompleted = task.status === "completed";
  const isOverdue = task.dueAt && new Date(task.dueAt).getTime() < Date.now() && !isCompleted;
  const totalChecklist = task.checklist?.length || 0;
  const completedChecklist = task.checklist?.filter((c) => c.completed).length || 0;

  return (
    <View style={[commonMobileStyles.card, isCompleted && styles.cardCompleted]}>
      {/* Header Row: Checkbox + Title + More Button */}
      <View style={styles.cardHeader}>
        <Pressable
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted }}
          onPress={onToggleComplete}
          style={styles.checkboxTarget}
        >
          <View style={[styles.checkboxBox, isCompleted && styles.checkboxBoxChecked]}>
            {isCompleted && <Check size={13} color="#ffffff" strokeWidth={3} />}
          </View>
        </Pressable>

        <Pressable style={styles.titleWrap} onPress={onOpenDetail}>
          <Text
            style={[commonMobileStyles.cardHeader, styles.cardTitle, isCompleted && styles.cardTitleDone]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          {task.relation?.label ? (
            <View style={styles.relationRow}>
              <User size={13} color={mobileTheme.colors.primary} />
              <Text style={styles.relationText} numberOfLines={1}>
                {task.relation.label}
              </Text>
            </View>
          ) : null}

          {/* Tags Chips in Card */}
          {task.tags && task.tags.length > 0 && (
            <View style={styles.cardTagsRow}>
              {task.tags.map((tg) => (
                <View key={tg} style={styles.cardTagBadge}>
                  <Text style={styles.cardTagBadgeText}>{tg}</Text>
                </View>
              ))}
            </View>
          )}
        </Pressable>

        <Pressable
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Acciones para ${task.title}`}
          onPress={onOpenActions}
          style={styles.moreButton}
        >
          <MoreHorizontal size={20} color={mobileTheme.colors.textMuted} />
        </Pressable>
      </View>

      {/* Divider */}
      <View style={commonMobileStyles.divider} />

      {/* Footer: Priority Badge + Due Date + Reminders + Checklist counter + Assignee */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          {/* Priority Pill */}
          <View
            style={[
              styles.priorityBadge,
              task.priority === "urgent"
                ? styles.priorityUrgent
                : task.priority === "high"
                ? styles.priorityHigh
                : styles.priorityNormal,
            ]}
          >
            <Text
              style={[
                styles.priorityBadgeText,
                task.priority === "urgent"
                  ? styles.priorityUrgentText
                  : task.priority === "high"
                  ? styles.priorityHighText
                  : styles.priorityNormalText,
              ]}
            >
              {task.priority.toUpperCase()}
            </Text>
          </View>

          {/* Overdue badge */}
          {isOverdue && (
            <View style={styles.overdueBadge}>
              <AlertCircle size={11} color={mobileTheme.colors.danger} />
              <Text style={styles.overdueBadgeText}>Vencida</Text>
            </View>
          )}

          {/* Due time */}
          {task.dueAt && !isCompleted && !isOverdue && (
            <View style={styles.dueBadge}>
              <CalendarDays size={12} color={mobileTheme.colors.textMuted} />
              <Text style={styles.dueBadgeText}>
                {new Date(task.dueAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
              </Text>
            </View>
          )}

          {/* Active Reminders Count */}
          {task.reminders && task.reminders.length > 0 && (
            <View style={styles.reminderBadge}>
              <Bell size={10} color={mobileTheme.colors.warning} />
              <Text style={styles.reminderBadgeText}>{task.reminders.length}</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {totalChecklist > 0 && (
            <View style={styles.checklistBadge}>
              <CheckSquare size={12} color={mobileTheme.colors.success} />
              <Text style={styles.checklistBadgeText}>
                {completedChecklist}/{totalChecklist}
              </Text>
            </View>
          )}

          {task.assignedUser?.displayName ? (
            <View style={styles.assigneePillCard}>
              <Text style={styles.assigneePillCardText}>
                {task.assignedUser.displayName.split(" ")[0]}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    ...commonMobileStyles.scrollContent,
  },
  unifiedFilterSection: {
    marginBottom: 12,
  },
  unifiedFilterScroll: {
    gap: 6,
    alignItems: "center",
    paddingVertical: 2,
  },
  // Active Filter Badges Indicator Row
  activeFilterChipsContainer: {
    marginBottom: 10,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: mobileTheme.colors.primarySoft,
    borderColor: mobileTheme.colors.primary,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeFilterChipText: {
    color: mobileTheme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  clearAllFiltersLink: {
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  clearAllFiltersText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  // MobileControlSheet Section & Assignee Styles
  sheetSectionBlock: {
    gap: 8,
  },
  sheetSectionHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: mobileTheme.colors.textSubtle,
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterGridItem: {
    flex: 1,
    minWidth: "47%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.md,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  filterGridItemSelected: {
    backgroundColor: mobileTheme.colors.primary,
    borderColor: mobileTheme.colors.primary,
  },
  filterGridItemText: {
    fontSize: 13,
    fontWeight: "700",
    color: mobileTheme.colors.textHeading,
  },
  filterGridItemTextSelected: {
    color: mobileTheme.colors.textInverse,
  },
  assigneesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  assigneeTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.md,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  assigneeTileSelected: {
    backgroundColor: mobileTheme.colors.primary,
    borderColor: mobileTheme.colors.primary,
  },
  assigneeTileText: {
    fontSize: 12,
    fontWeight: "700",
    color: mobileTheme.colors.textHeading,
  },
  assigneeTileTextSelected: {
    color: "#ffffff",
  },
  assigneeTileAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  assigneeTileAvatarText: {
    fontSize: 9,
    fontWeight: "800",
    color: mobileTheme.colors.primary,
  },
  tagsFilterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterTagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterTagChipSelected: {
    backgroundColor: mobileTheme.colors.primary,
    borderColor: mobileTheme.colors.primary,
  },
  filterTagChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: mobileTheme.colors.primary,
  },
  filterTagChipTextSelected: {
    color: mobileTheme.colors.textInverse,
  },
  filterFooterActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderLight,
  },
  filterClearButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.md,
    paddingVertical: 13,
  },
  filterClearButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: mobileTheme.colors.textMuted,
  },
  filterApplyButton: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: mobileTheme.radii.md,
    paddingVertical: 13,
  },
  filterApplyButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: mobileTheme.colors.textInverse,
  },

  modalTemplateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modalTemplateChipText: {
    color: mobileTheme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radii.card,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  emptyText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },

  // Card specific styles
  cardCompleted: {
    opacity: 0.65,
    backgroundColor: mobileTheme.colors.surfaceMuted,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkboxTarget: {
    paddingRight: 10,
    paddingTop: 2,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderColor: mobileTheme.colors.borderSubtle,
    borderWidth: 1.8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.surface,
  },
  checkboxBoxChecked: {
    backgroundColor: mobileTheme.colors.success,
    borderColor: mobileTheme.colors.success,
  },
  titleWrap: {
    flex: 1,
  },
  cardTitle: {
    color: mobileTheme.colors.textMain,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  cardTitleDone: {
    color: mobileTheme.colors.textSubtle,
    textDecorationLine: "line-through",
  },
  relationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  relationText: {
    color: mobileTheme.colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  moreButton: {
    paddingLeft: 8,
    paddingTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  priorityBadge: {
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priorityUrgent: {
    backgroundColor: mobileTheme.colors.dangerBg,
  },
  priorityUrgentText: {
    color: mobileTheme.colors.danger,
    fontSize: 10,
    fontWeight: "800",
  },
  priorityHigh: {
    backgroundColor: mobileTheme.colors.warningBg,
  },
  priorityHighText: {
    color: mobileTheme.colors.warning,
    fontSize: 10,
    fontWeight: "800",
  },
  priorityNormal: {
    backgroundColor: mobileTheme.colors.primarySoft,
  },
  priorityNormalText: {
    color: mobileTheme.colors.primary,
    fontSize: 10,
    fontWeight: "800",
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  overdueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: mobileTheme.colors.dangerBg,
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  overdueBadgeText: {
    color: mobileTheme.colors.danger,
    fontSize: 10,
    fontWeight: "800",
  },
  dueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dueBadgeText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  checklistBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  checklistBadgeText: {
    color: mobileTheme.colors.success,
    fontSize: 11,
    fontWeight: "700",
  },

  // Calendar specific
  calendarNavHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  calendarNavControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarNavButton: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.borderSubtle,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.md,
    paddingHorizontal: 12,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarTodayText: {
    color: mobileTheme.colors.textMain,
    fontSize: 12,
    fontWeight: "700",
  },
  calendarArrowButton: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.borderSubtle,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.md,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarMonthText: {
    fontSize: 13,
    fontWeight: "800",
    color: mobileTheme.colors.textHeading,
    textTransform: "uppercase",
  },
  calendarDaysStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.card,
    padding: 6,
    marginBottom: 16,
    ...mobileTheme.shadows.card,
  },
  calendarDayTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: mobileTheme.radii.md,
  },
  calendarDayTabSelected: {
    backgroundColor: mobileTheme.colors.primary,
  },
  calendarDayTabToday: {
    backgroundColor: mobileTheme.colors.primarySoft,
  },
  calendarDayName: {
    fontSize: 10,
    fontWeight: "700",
    color: mobileTheme.colors.textMuted,
    marginBottom: 2,
  },
  calendarDayNum: {
    fontSize: 14,
    fontWeight: "800",
    color: mobileTheme.colors.textHeading,
  },
  calendarDayTextSelected: {
    color: mobileTheme.colors.textInverse,
  },
  calendarTaskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: mobileTheme.colors.primary,
    marginTop: 4,
  },
  calendarTaskDotSelected: {
    backgroundColor: mobileTheme.colors.textInverse,
  },
  calendarAgendaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  calendarAgendaTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: mobileTheme.colors.textMuted,
  },

  // Month Grid View Styles
  monthGridCard: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.card,
    padding: 12,
    marginBottom: 16,
    ...mobileTheme.shadows.card,
  },
  monthDaysHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 8,
    borderBottomColor: mobileTheme.colors.borderLight,
    borderBottomWidth: 1,
    marginBottom: 6,
  },
  monthDayHeaderLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: mobileTheme.colors.textSubtle,
    width: 38,
    textAlign: "center",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  monthGridCell: {
    width: 38,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: mobileTheme.radii.sm,
    marginVertical: 2,
  },
  monthGridCellDimmed: {
    opacity: 0.3,
  },
  monthGridCellToday: {
    backgroundColor: mobileTheme.colors.primarySoft,
  },
  monthGridCellSelected: {
    backgroundColor: mobileTheme.colors.primary,
  },
  monthGridCellText: {
    fontSize: 13,
    fontWeight: "700",
    color: mobileTheme.colors.textHeading,
  },
  monthGridCellTextDimmed: {
    color: mobileTheme.colors.textSubtle,
  },
  monthGridCellTextSelected: {
    color: mobileTheme.colors.textInverse,
    fontWeight: "800",
  },
  monthGridDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: mobileTheme.colors.primary,
    marginTop: 2,
  },
  monthGridDotSelected: {
    backgroundColor: mobileTheme.colors.textInverse,
  },

  // Stream View Styles
  streamGroup: {
    marginBottom: 18,
  },
  streamGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  streamGroupBadge: {
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streamGroupBadgeNeutral: {
    backgroundColor: mobileTheme.colors.surfaceMuted,
  },
  streamGroupBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  streamGroupBadgeTextNeutral: {
    color: mobileTheme.colors.textMuted,
  },
  streamGroupCount: {
    fontSize: 12,
    fontWeight: "700",
    color: mobileTheme.colors.textMuted,
  },

  // Action Items in Sheet
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomColor: mobileTheme.colors.borderLight,
    borderBottomWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "700",
    color: mobileTheme.colors.textHeading,
    flex: 1,
  },
  destructiveAction: {
    borderBottomColor: mobileTheme.colors.dangerBorder,
  },
  destructiveText: {
    color: mobileTheme.colors.danger,
  },

  // Reschedule sheet
  rescheduleList: {
    gap: 8,
    paddingVertical: 8,
  },
  rescheduleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderRadius: mobileTheme.radii.md,
    padding: 14,
  },
  rescheduleOptionText: {
    fontSize: 14,
    fontWeight: "700",
    color: mobileTheme.colors.textHeading,
  },

  // Detail Sheet
  detailMetaGrid: {
    flexDirection: "row",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderRadius: mobileTheme.radii.md,
    padding: 12,
    marginBottom: 14,
  },
  detailMetaCol: {
    flex: 1,
  },
  detailMetaLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: mobileTheme.colors.textSubtle,
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailMetaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: mobileTheme.colors.textHeading,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: mobileTheme.colors.textSubtle,
    letterSpacing: 1,
    marginBottom: 6,
  },
  detailDescriptionText: {
    fontSize: 14,
    color: mobileTheme.colors.textMain,
    lineHeight: 20,
  },
  detailEmptyText: {
    fontSize: 12,
    color: mobileTheme.colors.textSubtle,
    fontStyle: "italic",
  },
  checklistItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  checklistCheckableArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  checklistCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderColor: mobileTheme.colors.borderSubtle,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.surface,
  },
  checklistCheckboxDone: {
    backgroundColor: mobileTheme.colors.success,
    borderColor: mobileTheme.colors.success,
  },
  checklistItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: mobileTheme.colors.textHeading,
    flex: 1,
  },
  checklistItemTextDone: {
    color: mobileTheme.colors.textSubtle,
    textDecorationLine: "line-through",
  },
  checklistDeleteButton: {
    padding: 6,
    marginLeft: 6,
  },
  addChecklistInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  addChecklistInput: {
    flex: 1,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.borderSubtle,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: mobileTheme.colors.textMain,
  },
  addChecklistButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: mobileTheme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  addChecklistButtonDisabled: {
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
  },
  addChecklistButtonText: {
    color: mobileTheme.colors.textInverse,
    fontSize: 12,
    fontWeight: "700",
  },
  addChecklistButtonTextDisabled: {
    color: mobileTheme.colors.textSubtle,
  },
  detailActionButton: {
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: mobileTheme.radii.md,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 10,
  },
  detailActionButtonReopen: {
    backgroundColor: mobileTheme.colors.textMuted,
  },
  detailActionButtonText: {
    color: mobileTheme.colors.textInverse,
    fontSize: 14,
    fontWeight: "800",
  },

  // In-place detail inputs
  detailTitleInput: {
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.borderSubtle,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    fontWeight: "700",
    color: mobileTheme.colors.textMain,
  },
  detailDescInput: {
    minHeight: 64,
    fontWeight: "500",
    textAlignVertical: "top",
  },
  detailPriorityRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
  },
  detailPriorityPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: mobileTheme.radii.pill,
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
  },
  detailPriorityPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: mobileTheme.colors.textMuted,
  },

  // Assignee in Detail & Cards
  assigneeCurrentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    padding: 10,
    borderRadius: mobileTheme.radii.md,
  },
  assigneeAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: mobileTheme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  assigneeAvatarText: {
    fontSize: 10,
    fontWeight: "800",
    color: mobileTheme.colors.primary,
  },
  assigneeCurrentName: {
    fontSize: 13,
    fontWeight: "700",
    color: mobileTheme.colors.textHeading,
  },
  assigneePickerContainer: {
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.md,
    padding: 6,
    marginTop: 6,
    gap: 4,
  },
  assigneePickerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: mobileTheme.radii.sm,
  },
  assigneePickerOptionSelected: {
    backgroundColor: mobileTheme.colors.primarySoft,
  },
  assigneePickerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: mobileTheme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  assigneePickerAvatarText: {
    fontSize: 9,
    fontWeight: "800",
    color: mobileTheme.colors.primary,
  },
  assigneePickerOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: mobileTheme.colors.textHeading,
    flex: 1,
  },
  assigneePickerOptionTextSelected: {
    color: mobileTheme.colors.primary,
    fontWeight: "800",
  },
  assigneePillCard: {
    backgroundColor: mobileTheme.colors.primarySoft,
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  assigneePillCardText: {
    fontSize: 10,
    fontWeight: "800",
    color: mobileTheme.colors.primary,
  },

  // Tags Styles
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: mobileTheme.colors.primarySoft,
    borderColor: mobileTheme.colors.primary,
    borderWidth: 0.8,
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: mobileTheme.colors.primary,
  },
  addTagRow: {
    flexDirection: "row",
    gap: 6,
  },
  addTagInput: {
    flex: 1,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.borderSubtle,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: mobileTheme.colors.textMain,
  },
  addTagButton: {
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: mobileTheme.radii.md,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tagSuggestionChip: {
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  tagSuggestionChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.textMuted,
  },
  tagFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagFilterChipActive: {
    backgroundColor: mobileTheme.colors.primary,
    borderColor: mobileTheme.colors.primary,
  },
  tagFilterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.primary,
  },
  tagFilterChipTextActive: {
    color: mobileTheme.colors.textInverse,
  },
  cardTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  cardTagBadge: {
    backgroundColor: mobileTheme.colors.primarySoft,
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  cardTagBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: mobileTheme.colors.primary,
  },

  // Reminder styles
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderRadius: mobileTheme.radii.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  reminderText: {
    fontSize: 12,
    fontWeight: "700",
    color: mobileTheme.colors.textHeading,
  },
  reminderPresetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  reminderPresetButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.primary,
  },
  reminderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: mobileTheme.colors.warningBg,
    borderRadius: mobileTheme.radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  reminderBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: mobileTheme.colors.warning,
  },

  // Create Task Form
  formContainer: {
    paddingVertical: 6,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: mobileTheme.colors.textSubtle,
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 10,
  },
  formInput: {
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.borderSubtle,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: mobileTheme.colors.textMain,
  },
  formTextArea: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  prioritySelector: {
    flexDirection: "row",
    gap: 6,
  },
  prioritySelectorItem: {
    flex: 1,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderRadius: mobileTheme.radii.md,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
  },
  prioritySelectorItemActive: {
    backgroundColor: mobileTheme.colors.primary,
    borderColor: mobileTheme.colors.primary,
  },
  prioritySelectorText: {
    fontSize: 11,
    fontWeight: "800",
    color: mobileTheme.colors.textMuted,
  },
  prioritySelectorTextActive: {
    color: mobileTheme.colors.textInverse,
  },
  createSubmitButton: {
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: mobileTheme.radii.md,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 18,
  },
  createSubmitButtonText: {
    color: mobileTheme.colors.textInverse,
    fontSize: 14,
    fontWeight: "800",
  },

  // Detail Bottom Actions
  detailActionsBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  detailDeleteButton: {
    width: 44,
    height: 44,
    borderRadius: mobileTheme.radii.md,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.dangerBorder,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Confirm Delete Sheet
  confirmDeleteContainer: {
    paddingVertical: 6,
    gap: 12,
  },
  confirmDeleteDescription: {
    fontSize: 13,
    color: mobileTheme.colors.textMuted,
    lineHeight: 18,
    marginBottom: 6,
  },
  confirmDeleteButton: {
    backgroundColor: mobileTheme.colors.danger,
    borderRadius: mobileTheme.radii.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  confirmDeleteButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  confirmCancelButton: {
    backgroundColor: mobileTheme.colors.surfaceMuted,
    borderColor: mobileTheme.colors.border,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmCancelButtonText: {
    color: mobileTheme.colors.textHeading,
    fontSize: 13,
    fontWeight: "700",
  },

  // Floating Toast / Snackbar
  floatingToast: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.primary,
    borderWidth: 1.5,
    borderRadius: mobileTheme.radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 9999,
  },
  floatingToastContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  floatingToastIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: mobileTheme.colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingToastTextCol: {
    flex: 1,
  },
  floatingToastTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: mobileTheme.colors.textHeading,
  },
  floatingToastSubtitle: {
    fontSize: 10,
    fontWeight: "500",
    color: mobileTheme.colors.textSubtle,
    marginTop: 1,
  },
  floatingToastAction: {
    backgroundColor: mobileTheme.colors.primarySoft,
    borderColor: mobileTheme.colors.primary,
    borderWidth: 1,
    borderRadius: mobileTheme.radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  floatingToastActionText: {
    color: mobileTheme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
});
