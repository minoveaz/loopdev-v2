import React, { useState } from "react";
import { DetailDrawer, StatusBadge, UserAvatar } from "@/components/common";
import type { TaskRecord } from "@/loopdev/domains/tasks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, CheckCircle2, User, Sparkles, Calendar, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskDetailDrawerProps {
  task: TaskRecord | null;
  open: boolean;
  onClose: () => void;
  onComplete: (taskId: string) => Promise<any>;
  onReschedule: (taskId: string, newDueAt: string) => Promise<any>;
  onToggleChecklist: (taskId: string, itemId: string, completed: boolean) => Promise<any>;
}

export function TaskDetailDrawer({
  task,
  open,
  onClose,
  onComplete,
  onReschedule,
  onToggleChecklist,
}: TaskDetailDrawerProps) {
  if (!task) return null;

  const totalChecklist = task.checklist?.length || 0;
  const completedChecklist = task.checklist?.filter((c) => c.completed).length || 0;
  const progressPercent = totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0;

  const isOverdue = task.dueAt && new Date(task.dueAt).getTime() < Date.now() && task.status !== "completed";

  const handleQuickPostpone = (hoursOrDays: number, isDays = false) => {
    const current = task.dueAt ? new Date(task.dueAt).getTime() : Date.now();
    const addMs = isDays ? hoursOrDays * 24 * 3600 * 1000 : hoursOrDays * 3600 * 1000;
    const nextDate = new Date(current + addMs).toISOString();
    onReschedule(task.id, nextDate);
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
        {/* Status & Priority Badges */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-card-muted/60 border border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Prioridad:</span>
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
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Estado:</span>
            <StatusBadge
              tone={task.status === "completed" ? "success" : isOverdue ? "destructive" : "neutral"}
              label={task.status === "completed" ? "COMPLETADA" : isOverdue ? "VENCIDA" : "PENDIENTE"}
            />
          </div>
        </div>

        {/* Quick Reschedule Section */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Reprogramación Rápida</span>
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
              className="text-xs h-8 flex items-center gap-1.5"
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              +1 hora
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickPostpone(1, true)}
              className="text-xs h-8 flex items-center gap-1.5"
            >
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              Mañana
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickPostpone(3, true)}
              className="text-xs h-8 flex items-center gap-1.5"
            >
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              En 3 días
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickPostpone(7, true)}
              className="text-xs h-8 flex items-center gap-1.5"
            >
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Próximo Lunes
            </Button>
          </div>
        </div>

        {/* Assigned User */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border shadow-xs">
          <UserAvatar
            name={task.assignedUser?.displayName || "Sin asignar"}
            size="sm"
          />
          <div>
            <div className="text-xs text-muted-foreground font-medium">Responsable Asignado</div>
            <div className="text-sm font-semibold text-foreground">
              {task.assignedUser?.displayName || "Sin responsable asignado"}
            </div>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descripción</div>
            <p className="text-sm text-foreground bg-card p-3.5 rounded-xl border border-border whitespace-pre-wrap leading-relaxed shadow-xs">
              {task.description}
            </p>
          </div>
        )}

        {/* Checklist & Subtasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sub-tareas & Checklist ({completedChecklist}/{totalChecklist})
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
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-border/80 transition-all shadow-xs"
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={(checked) => onToggleChecklist(task.id, item.id, !!checked)}
                  className="data-[state=checked]:bg-emerald-600 border-muted-foreground/50"
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    item.completed ? "line-through text-muted-foreground" : "text-foreground",
                  )}
                >
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mentions */}
        {task.mentions && task.mentions.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menciones</div>
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
        <div className="pt-4 border-t border-border flex items-center gap-3">
          {task.status !== "completed" ? (
            <Button
              onClick={() => onComplete(task.id)}
              className="w-full font-semibold flex items-center justify-center gap-2 h-11"
            >
              <CheckCircle2 className="w-4 h-4" />
              Marcar como Completada
            </Button>
          ) : (
            <div className="w-full py-2.5 px-4 text-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Tarea Completada
            </div>
          )}
        </div>
      </div>
    </DetailDrawer>
  );
}
