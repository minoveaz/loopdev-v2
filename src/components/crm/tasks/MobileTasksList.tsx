import React, { useState } from "react";
import type { TaskRecord, TaskTemplateRecord } from "@/loopdev/domains/tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common";
import { Clock, CheckCircle2, Sparkles, ChevronRight, AlertCircle, Calendar, CheckSquare, Sun, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileTasksListProps {
  tasks: TaskRecord[];
  templates?: TaskTemplateRecord[];
  isLoading?: boolean;
  onComplete: (taskId: string) => Promise<any>;
  onSelectTask?: (task: TaskRecord) => void;
  onSelectTemplate?: (template: TaskTemplateRecord) => void;
  onQuickCreate?: () => void;
  onQuickReschedule?: (taskId: string, newDueAt: string) => Promise<any>;
}

export function MobileTasksList({
  tasks,
  templates = [],
  isLoading,
  onComplete,
  onSelectTask,
  onSelectTemplate,
  onQuickCreate,
  onQuickReschedule,
}: MobileTasksListProps) {
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted/60 rounded-xl animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  const handlePostpone = (e: React.MouseEvent, taskId: string, hoursOrDays: number, isDay = false) => {
    e.stopPropagation();
    const target = tasks.find((t) => t.id === taskId);
    const base = target?.dueAt ? new Date(target.dueAt) : new Date();
    if (isDay) {
      base.setDate(base.getDate() + hoursOrDays);
    } else {
      base.setHours(base.getHours() + hoursOrDays);
    }
    if (onQuickReschedule) {
      onQuickReschedule(taskId, base.toISOString());
    }
    setActiveMenuTaskId(null);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 1-Tap Quick Template Chips */}
      {templates.length > 0 && (
        <div className="space-y-1.5 px-4 pt-2">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Plantillas Rápidas (1-Tap):
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onSelectTemplate?.(tpl)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-card border border-border text-foreground hover:bg-muted/80 hover:border-primary/30 active:scale-95 transition-all whitespace-nowrap shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{tpl.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-10 px-4 space-y-3 bg-card rounded-2xl border border-border mx-4">
          <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center mx-auto text-primary">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <div className="text-sm font-bold text-foreground">¡Todo al día!</div>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            No tienes tareas pendientes registradas en este espacio.
          </p>
          {onQuickCreate && (
            <Button
              onClick={onQuickCreate}
              size="sm"
              className="font-semibold text-xs mt-2"
            >
              + Nueva Tarea
            </Button>
          )}
        </div>
      )}

      {/* Task Cards List */}
      <div className="space-y-3 px-4">
        {tasks.map((task) => {
          const isOverdue =
            task.dueAt && new Date(task.dueAt).getTime() < Date.now() && task.status !== "completed";
          const isCompleted = task.status === "completed";
          const totalChecklist = task.checklist?.length || 0;
          const completedChecklist = task.checklist?.filter((c) => c.completed).length || 0;

          return (
            <div
              key={task.id}
              onClick={() => onSelectTask?.(task)}
              className={cn(
                "relative rounded-2xl p-4 transition-all duration-200 border cursor-pointer",
                isCompleted
                  ? "bg-card-muted/50 border-border opacity-70"
                  : isOverdue
                  ? "bg-card border-rose-200 shadow-xs"
                  : "bg-card border-border hover:border-primary/40 shadow-xs",
              )}
            >
              <div className="flex items-start gap-3.5">
                {/* Accessible >48px Touch Checkbox Target */}
                <div
                  className="flex items-center justify-center min-w-[48px] min-h-[48px] -ml-2 -mt-2 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isCompleted) onComplete(task.id);
                  }}
                >
                  <Checkbox
                    checked={isCompleted}
                    className="w-5 h-5 rounded-md data-[state=checked]:bg-emerald-600 border-muted-foreground/50"
                  />
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 pr-2">
                  {/* Badges row */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                      label={task.priority.toUpperCase()}
                    />
                    {isOverdue && (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Vencida
                      </span>
                    )}
                    {task.dueAt && !isOverdue && !isCompleted && (
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {new Date(task.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4
                    className={cn(
                      "text-sm font-semibold leading-snug",
                      isCompleted ? "line-through text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {task.title}
                  </h4>

                  {/* Entity or Assigned User */}
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                    {task.relation?.label && (
                      <span className="text-primary font-semibold truncate flex items-center gap-1">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{task.relation.label}</span>
                      </span>
                    )}
                    {task.assignedUser && (
                      <span className="truncate">• Asignado: {task.assignedUser.displayName}</span>
                    )}
                  </div>

                  {/* Subtasks summary */}
                  {totalChecklist > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" />
                        {completedChecklist}/{totalChecklist}
                      </span>
                      <span>sub-tareas</span>
                    </div>
                  )}
                </div>

                {/* Arrow indicator */}
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-2 self-start" />
              </div>

              {/* Quick Actions Bottom Bar on Card */}
              {!isCompleted && (
                <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card-muted border border-border text-xs font-semibold text-amber-700 hover:bg-muted min-h-[38px] transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Reprogramar</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTask?.(task);
                    }}
                    className="text-xs text-primary hover:underline font-semibold px-2 py-1 min-h-[38px] flex items-center"
                  >
                    Ver Detalle →
                  </button>
                </div>
              )}

              {/* Quick Reschedule Popover Menu */}
              {activeMenuTaskId === task.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 p-2.5 rounded-xl bg-card border border-border shadow-md space-y-1.5 animate-in fade-in"
                >
                  <div className="text-[10px] font-bold text-muted-foreground px-1 uppercase tracking-wider">
                    Posponer a:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handlePostpone(e, task.id, 1)}
                      className="text-xs h-8 justify-start flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      +1 hora
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handlePostpone(e, task.id, 1, true)}
                      className="text-xs h-8 justify-start flex items-center gap-1.5"
                    >
                      <Sun className="w-3.5 h-3.5 text-muted-foreground" />
                      Mañana
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handlePostpone(e, task.id, 3, true)}
                      className="text-xs h-8 justify-start flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      En 3 días
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handlePostpone(e, task.id, 7, true)}
                      className="text-xs h-8 justify-start flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      Próximo Lunes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
