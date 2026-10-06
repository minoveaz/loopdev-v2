import React, { useState, useEffect } from "react";
import { DetailDrawer, StatusBadge, UserAvatar } from "@/components/common";
import {
  AVAILABLE_ASSIGNABLE_USERS,
  type TaskPriority,
  type TaskRecord,
  type TaskReminder,
  type UpdateTaskPatch,
} from "@/loopdev/domains/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Clock,
  CheckCircle2,
  User,
  Sparkles,
  Calendar,
  Sun,
  Plus,
  Trash2,
  Tag,
  Bell,
  X,
  UserCheck,
  AlertCircle,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/i18n";

interface TaskDetailDrawerProps {
  task: TaskRecord | null;
  open: boolean;
  onClose: () => void;
  onComplete: (taskId: string) => Promise<unknown>;
  onReschedule: (taskId: string, newDueAt: string) => Promise<unknown>;
  onToggleChecklist: (taskId: string, itemId: string, completed: boolean) => Promise<unknown>;
  onAddChecklistItem?: (taskId: string, title: string) => Promise<unknown>;
  onDeleteChecklistItem?: (taskId: string, itemId: string) => Promise<unknown>;
  onDeleteTask?: (taskId: string) => void;
  onUpdateTask?: (taskId: string, patch: UpdateTaskPatch) => Promise<unknown>;
}

const PRESET_TAGS = ["#VIP", "#Renovación", "#Reclamo", "#Urgente", "#Seguimiento", "#Comercial", "#Onboarding"];

export function TaskDetailDrawer({
  task,
  open,
  onClose,
  onComplete,
  onReschedule,
  onToggleChecklist,
  onAddChecklistItem,
  onDeleteChecklistItem,
  onDeleteTask,
  onUpdateTask,
}: TaskDetailDrawerProps) {
  const t = useT();
  const priorityLabels: Record<TaskPriority, string> = {
    urgent: t("crm.tasks.priority.urgent"),
    high: t("crm.tasks.priority.high"),
    normal: t("crm.tasks.priority.normal"),
    low: t("crm.tasks.priority.low"),
  };
  // Local edit states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
    }
  }, [task]);

  if (!task) return null;

  const totalChecklist = task.checklist?.length || 0;
  const completedChecklist = task.checklist?.filter((c) => c.completed).length || 0;
  const progressPercent = totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0;
  const isOverdue = task.dueAt && new Date(task.dueAt).getTime() < Date.now() && task.status !== "completed";

  // Auto-save Title
  const handleTitleBlur = async () => {
    if (!title.trim() || title.trim() === task.title || !onUpdateTask) return;
    try {
      await onUpdateTask(task.id, { title: title.trim() });
      toast.success("Título actualizado");
    } catch {
      toast.error("Error al actualizar título");
    }
  };

  // Auto-save Description
  const handleDescriptionBlur = async () => {
    if (description === (task.description || "") || !onUpdateTask) return;
    try {
      await onUpdateTask(task.id, { description: description.trim() || null });
      toast.success("Descripción actualizada");
    } catch {
      toast.error("Error al actualizar descripción");
    }
  };

  // Change Priority
  const handlePriorityChange = async (newPriority: TaskPriority) => {
    if (newPriority === task.priority || !onUpdateTask) return;
    try {
      await onUpdateTask(task.id, { priority: newPriority });
      toast.success(`Prioridad cambiada a ${newPriority.toUpperCase()}`);
    } catch {
      toast.error("Error al cambiar prioridad");
    }
  };

  // Change Assignee
  const handleAssigneeChange = async (user: (typeof AVAILABLE_ASSIGNABLE_USERS)[number] | null) => {
    if (!onUpdateTask) return;
    try {
      await onUpdateTask(task.id, {
        assignedUserId: user ? user.id : null,
        assignedUser: user
          ? {
              id: user.id,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
            }
          : null,
      });
      toast.success(user ? `Asignado a ${user.displayName}` : "Tarea desasignada");
    } catch {
      toast.error("Error al reasignar responsable");
    }
  };

  // Tags Management
  const handleAddTag = async (tagToAdd: string) => {
    const cleanTag = tagToAdd.startsWith("#") ? tagToAdd.trim() : `#${tagToAdd.trim()}`;
    if (!cleanTag || cleanTag === "#" || !onUpdateTask) return;
    const currentTags = task.tags || [];
    if (currentTags.includes(cleanTag)) return;

    const newTags = [...currentTags, cleanTag];
    try {
      await onUpdateTask(task.id, { tags: newTags });
      setNewTagInput("");
      setShowTagInput(false);
      toast.success(`Etiqueta ${cleanTag} añadida`);
    } catch {
      toast.error("Error al añadir etiqueta");
    }
  };

  const handleDeleteTag = async (tagToDelete: string) => {
    if (!onUpdateTask) return;
    const currentTags = task.tags || [];
    const newTags = currentTags.filter((t) => t !== tagToDelete);
    try {
      await onUpdateTask(task.id, { tags: newTags });
      toast.success(`Etiqueta ${tagToDelete} eliminada`);
    } catch {
      toast.error("Error al eliminar etiqueta");
    }
  };

  // Reminders Management
  const handleAddReminderPreset = async (presetMinutes: number, label: string) => {
    if (!onUpdateTask) return;
    const targetDue = task.dueAt ? new Date(task.dueAt).getTime() : Date.now() + 3600 * 1000 * 24;
    const remindTime = new Date(targetDue - presetMinutes * 60 * 1000).toISOString();

    const newReminder: TaskReminder = {
      remindAt: remindTime,
      channel: "in_app",
      sent: false,
    };

    const currentReminders = task.reminders || [];
    const newReminders = [...currentReminders, newReminder];
    try {
      await onUpdateTask(task.id, { reminders: newReminders });
      toast.success(`Recordatorio añadido: ${label}`);
    } catch {
      toast.error("Error al programar recordatorio");
    }
  };

  const handleDeleteReminder = async (index: number) => {
    if (!onUpdateTask) return;
    const currentReminders = task.reminders || [];
    const newReminders = currentReminders.filter((_, i) => i !== index);
    try {
      await onUpdateTask(task.id, { reminders: newReminders });
      toast.success("Recordatorio eliminado");
    } catch {
      toast.error("Error al eliminar recordatorio");
    }
  };

  const handleQuickPostpone = (hoursOrDays: number, isDays = false) => {
    const current = task.dueAt ? new Date(task.dueAt).getTime() : Date.now();
    const addMs = isDays ? hoursOrDays * 24 * 3600 * 1000 : hoursOrDays * 3600 * 1000;
    const nextDate = new Date(current + addMs).toISOString();
    onReschedule(task.id, nextDate);
  };

  const handleAddSubtask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtask.trim() || !onAddChecklistItem) return;
    setIsAddingSubtask(true);
    try {
      await onAddChecklistItem(task.id, newSubtask.trim());
      setNewSubtask("");
    } finally {
      setIsAddingSubtask(false);
    }
  };

  const handleDeleteSubtask = async (itemId: string, itemTitle: string) => {
    if (!onDeleteChecklistItem) return;
    await onDeleteChecklistItem(task.id, itemId);
    toast("Subtarea eliminada", {
      description: itemTitle,
      action: {
        label: "Deshacer",
        onClick: () => onAddChecklistItem?.(task.id, itemTitle),
      },
    });
  };

  const handleSubtaskAssigneeChange = async (itemId: string, assigneeId: string) => {
    if (!onUpdateTask) return;
    const assignee = AVAILABLE_ASSIGNABLE_USERS.find((user) => user.id === assigneeId) || null;
    const checklist = (task.checklist || []).map((item) => item.id === itemId
      ? { ...item, assigneeId: assignee?.id || null, assignee }
      : item);
    await onUpdateTask(task.id, { checklist });
  };

  return (
    <DetailDrawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      onClose={onClose}
      title={task.title}
      subtitle={
        task.relation?.label
          ? `Relacionado a: ${task.relation.label} (${task.relation.entityType})`
          : `Suite: ${task.suite.toUpperCase()}`
      }
      size="md"
    >
      <div className="space-y-6">
        {/* Editable Title */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {t("crm.tasks.detail.title")}
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
              placeholder={t("crm.tasks.detail.titlePlaceholder")}
            className="font-semibold text-base h-10 bg-card border-border focus-visible:ring-primary shadow-xs"
          />
        </div>

        {/* Priority & Status Controls Bar */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-card-muted/60 border border-border">
          {/* Priority Selector Dropdown */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">
              {t("crm.tasks.detail.priority")}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between h-8 text-xs bg-card font-semibold shadow-xs"
                >
                  <StatusBadge
                    tone={
                      task.priority === "urgent"
                        ? "destructive"
                        : task.priority === "high"
                        ? "warning"
                        : task.priority === "normal"
                        ? "info"
                        : "neutral"
                    }
                    dot
                  >
                    {priorityLabels[task.priority]}
                  </StatusBadge>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                {(["low", "normal", "high", "urgent"] as TaskPriority[]).map((p) => (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => handlePriorityChange(p)}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <StatusBadge
                      tone={
                        p === "urgent"
                          ? "destructive"
                          : p === "high"
                          ? "warning"
                          : p === "normal"
                          ? "info"
                          : "neutral"
                      }
                      dot
                    >
                      {p.toUpperCase()}
                    </StatusBadge>
                    {task.priority === p && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status Badge */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">
              Estado
            </span>
            <div className="h-8 flex items-center">
              <StatusBadge
                tone={task.status === "completed" ? "success" : isOverdue ? "destructive" : "neutral"}
                className="w-full justify-center text-xs font-bold py-1.5"
              >
                {task.status === "completed" ? t("crm.tasks.detail.completed") : isOverdue ? t("crm.tasks.detail.overdue") : t("crm.tasks.detail.pending")}
              </StatusBadge>
            </div>
          </div>
        </div>

        {/* Assignee Re-assignment Selector */}
        <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">{t("crm.tasks.detail.assignee")}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-primary hover:text-primary">
                  {t("crm.tasks.detail.reassign")} <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => handleAssigneeChange(null)}
                  className="text-xs cursor-pointer text-muted-foreground"
                >
                  <User className="w-3.5 h-3.5 mr-2" />
                  {t("crm.tasks.unassigned")}
                </DropdownMenuItem>
                {AVAILABLE_ASSIGNABLE_USERS.map((user) => (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={() => handleAssigneeChange(user)}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar name={user.displayName} size="xs" />
                      <span className="font-medium">{user.displayName}</span>
                    </div>
                    {task.assignedUserId === user.id && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <UserAvatar name={task.assignedUser?.displayName || t("crm.tasks.unassigned")} size="sm" />
            <div>
              <div className="text-sm font-semibold text-foreground">
                {task.assignedUser?.displayName || t("crm.tasks.detail.noAssignee")}
              </div>
              <div className="text-xs text-muted-foreground">
                {task.assignedUserId ? t("crm.tasks.detail.assignedAgent") : t("crm.tasks.detail.clickToAssign")}
              </div>
            </div>
          </div>
        </div>

        {/* Tags / Badges Management */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Tag className="w-4 h-4 text-indigo-500" />
              <span>{t("crm.tasks.detail.tags")}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTagInput(!showTagInput)}
              className="h-7 text-xs text-primary font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("crm.tasks.detail.add")}
            </Button>
          </div>

          {/* Active Tags Chips */}
          <div className="flex flex-wrap gap-2">
              {(task.tags || []).map((tag) => (
              <span
                  key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary-soft text-primary border border-primary/20 shadow-2xs"
              >
                  {tag}
                <button
                  type="button"
                    onClick={() => handleDeleteTag(tag)}
                  className="hover:text-rose-600 transition-colors"
                  title={t("crm.tasks.detail.deleteTag")}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {(!task.tags || task.tags.length === 0) && !showTagInput && (
              <span className="text-xs text-muted-foreground italic">{t("crm.tasks.detail.noTags")}</span>
            )}
          </div>

          {/* Add Tag Section & Presets */}
          {showTagInput && (
            <div className="space-y-2 pt-1 border-t border-border">
              <div className="flex items-center gap-2">
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder={t("crm.tasks.detail.tagPlaceholder")}
                  className="h-8 text-xs bg-background"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(newTagInput);
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => handleAddTag(newTagInput)}
                  disabled={!newTagInput.trim()}
                  className="h-8 text-xs font-medium shrink-0"
                >
                  Guardar
                </Button>
              </div>

              {/* Tag Presets */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase py-1">Sugeridos:</span>
                {PRESET_TAGS.filter((pt) => !(task.tags || []).includes(pt)).map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => handleAddTag(pt)}
                    className="px-2 py-0.5 text-[11px] rounded bg-card-muted border border-border text-foreground hover:border-primary/40 hover:text-primary transition-colors font-medium"
                  >
                    {pt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Programmed Reminders */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>{t("crm.tasks.detail.reminders")}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-primary font-semibold flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  Programar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => handleAddReminderPreset(15, "15 min antes")}
                  className="text-xs cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  {t("crm.tasks.detail.remind15")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleAddReminderPreset(60, t("crm.tasks.detail.remindHour"))}
                  className="text-xs cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  {t("crm.tasks.detail.remindHourDue")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleAddReminderPreset(1440, t("crm.tasks.detail.remindDay"))}
                  className="text-xs cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  {t("crm.tasks.detail.remindDayDue")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Active Reminders List */}
          <div className="space-y-2">
            {(task.reminders || []).map((rem, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-card-muted/60 border border-border text-xs"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-medium text-foreground">
                    {new Date(rem.remindAt).toLocaleDateString()} {new Date(rem.remindAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase bg-card px-1.5 py-0.5 rounded border border-border">
                    {rem.channel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteReminder(idx)}
                  className="text-muted-foreground hover:text-rose-600 transition-colors"
                  title={t("crm.tasks.detail.deleteReminder")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {(!task.reminders || task.reminders.length === 0) && (
                  <span className="text-xs text-muted-foreground italic block">{t("crm.tasks.detail.noReminders")}</span>
            )}
          </div>
        </div>

        {/* Quick Reschedule Section */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{t("crm.tasks.detail.quickReschedule")}</span>
            </div>
            {task.dueAt && (
              <span className="text-xs text-muted-foreground font-medium">
                Vence: {new Date(task.dueAt).toLocaleDateString()} {new Date(task.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickPostpone(1)}
              className="text-xs h-8 flex items-center gap-1.5 font-medium"
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              +1 hora
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickPostpone(1, true)}
              className="text-xs h-8 flex items-center gap-1.5 font-medium"
            >
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              {t("crm.tasks.detail.tomorrow")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickPostpone(3, true)}
              className="text-xs h-8 flex items-center gap-1.5 font-medium"
            >
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {t("crm.tasks.detail.inThreeDays")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickPostpone(7, true)}
              className="text-xs h-8 flex items-center gap-1.5 font-medium"
            >
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {t("crm.tasks.detail.nextMonday")}
            </Button>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t("crm.tasks.detail.description")}</div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder={t("crm.tasks.detail.descriptionPlaceholder")}
            rows={3}
            className="text-sm bg-card border-border leading-relaxed shadow-xs resize-none"
          />
        </div>

        {/* Checklist & Subtasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {t("crm.tasks.detail.subtasks", { completed: completedChecklist, total: totalChecklist })}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">{Math.round(progressPercent)}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Items List */}
          <div className="space-y-2">
            {(task.checklist || []).map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border hover:border-border/80 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={(checked) => onToggleChecklist(task.id, item.id, !!checked)}
                    className="data-[state=checked]:bg-emerald-600 border-muted-foreground/50 shrink-0"
                  />
                  <span
                    className={cn(
                      "text-sm font-medium truncate",
                      item.completed ? "line-through text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {item.title}
                  </span>
                </div>
                {onUpdateTask && (
                  <Select
                    value={item.assigneeId || "unassigned"}
                    onValueChange={(value) => void handleSubtaskAssigneeChange(item.id, value)}
                  >
                    <SelectTrigger className="h-8 w-36 text-[11px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">{t("crm.tasks.unassigned")}</SelectItem>
                      {AVAILABLE_ASSIGNABLE_USERS.map((user) => <SelectItem key={user.id} value={user.id}>{user.displayName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {onDeleteChecklistItem && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSubtask(item.id, item.title)}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-600 hover:bg-rose-50 h-7 w-7 transition-opacity"
                    title={t("crm.tasks.detail.deleteSubtask")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add Subtask Inline Form */}
          {onAddChecklistItem && (
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder={t("crm.tasks.detail.addSubtaskPlaceholder")}
                className="h-9 text-xs"
                disabled={isAddingSubtask}
              />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={!newSubtask.trim() || isAddingSubtask}
                className="h-9 text-xs flex items-center gap-1 shrink-0 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("crm.tasks.detail.add")}
              </Button>
            </form>
          )}
        </div>

        {/* Mentions */}
        {task.mentions && task.mentions.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Menciones</div>
            <div className="flex flex-wrap gap-2">
              {task.mentions.map((m) => (
                <span
                  key={m.userId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary-soft text-primary border border-primary/20"
                >
                  @{m.displayName}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions Bottom Bar */}
        <div className="pt-4 border-t border-border flex items-center gap-2.5">
          {task.status !== "completed" ? (
            <Button
              onClick={() => onComplete(task.id)}
              className="flex-1 font-semibold flex items-center justify-center gap-2 h-11"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t("crm.tasks.detail.markComplete")}
            </Button>
          ) : (
            <div className="flex-1 py-2.5 px-4 text-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t("crm.tasks.detail.taskCompleted")}
            </div>
          )}

          {onDeleteTask && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDeleteTask(task.id)}
              className="h-11 w-11 shrink-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200"
              title={t("crm.tasks.detail.deleteTask")}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </DetailDrawer>
  );
}
