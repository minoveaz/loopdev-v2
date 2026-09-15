import React, { useState, useEffect, useRef } from "react";
import type {
  CreateTaskInput,
  PlatformSuiteKey,
  TaskEntityRef,
  TaskPriority,
  TaskTemplateRecord,
} from "@/loopdev/domains/tasks";
import { AppDrawer } from "@/components/platform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Plus, Trash2, Calendar, CheckSquare, Clock, User, Check } from "lucide-react";
import { StatusBadge } from "@/components/common";
import { cn } from "@/lib/utils";

interface QuickTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<any>;
  templates?: TaskTemplateRecord[];
  initialRelation?: TaskEntityRef;
  initialSuite?: PlatformSuiteKey;
  initialTemplate?: TaskTemplateRecord | null;
}

export function QuickTaskModal({
  open,
  onClose,
  onSubmit,
  templates = [],
  initialRelation,
  initialSuite = "crm",
  initialTemplate,
}: QuickTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [suite, setSuite] = useState<PlatformSuiteKey>(initialSuite);
  const [dueDays, setDueDays] = useState<number | null>(1);
  const [checklist, setChecklist] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [newStep, setNewStep] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [relatedRecordName, setRelatedRecordName] = useState(initialRelation?.label || "");

  const dirtyRef = useRef(false);

  useEffect(() => {
    if (initialTemplate) {
      applyTemplate(initialTemplate);
    }
  }, [initialTemplate]);

  useEffect(() => {
    if (initialRelation?.label) {
      setRelatedRecordName(initialRelation.label);
    }
  }, [initialRelation]);

  const applyTemplate = (tpl: TaskTemplateRecord) => {
    setSelectedTemplateId(tpl.id);
    setTitle(tpl.name.replace(/^[^\w]+/, "").trim());
    if (tpl.description) setDescription(tpl.description);
    setPriority(tpl.defaultPriority);
    setSuite(tpl.suite);
    if (tpl.defaultDueDays) {
      setDueDays(tpl.defaultDueDays);
    }
    if (tpl.defaultChecklist) {
      setChecklist(
        tpl.defaultChecklist.map((c, idx) => ({
          id: `step-${idx}`,
          title: c,
          completed: false,
        })),
      );
    }
    dirtyRef.current = true;
  };

  const handleAddStep = () => {
    if (!newStep.trim()) return;
    setChecklist((prev) => [...prev, { id: `step-${Date.now()}`, title: newStep.trim(), completed: false }]);
    setNewStep("");
    dirtyRef.current = true;
  };

  const handleRemoveStep = (id: string) => {
    setChecklist((prev) => prev.filter((s) => s.id !== id));
    dirtyRef.current = true;
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      let dueAt: string | null = null;
      if (dueDays !== null) {
        const d = new Date();
        d.setDate(d.getDate() + dueDays);
        dueAt = d.toISOString();
      }

      await onSubmit({
        organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
        suite,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        dueAt,
        relation: relatedRecordName.trim()
          ? {
              entityType: "contact",
              entityId: initialRelation?.entityId || `con-${Date.now()}`,
              label: relatedRecordName.trim(),
            }
          : null,
        templateId: selectedTemplateId,
        checklist,
        assignedUser: { id: "usr-admin", displayName: "LoopDev Admin" },
      });

      // Reset
      setTitle("");
      setDescription("");
      setChecklist([]);
      setSelectedTemplateId(null);
      setRelatedRecordName("");
      dirtyRef.current = false;
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={title.trim() ? title : "Nueva Tarea"}
      eyebrow="CRM / TAREAS"
      mode="New"
      size="md"
      layoutMode="standard"
      responsive="auto"
      description="Crea una tarea comercial con subtareas, vencimiento y cliente vinculado."
      dirty={() => dirtyRef.current}
      footer={
        <div className="flex w-full items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !title.trim()}
            className="min-w-[120px]"
          >
            {isSubmitting ? "Guardando..." : "Crear Tarea"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pb-6">
        {/* 1-Tap Quick Templates Section */}
        {templates.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Plantillas Rápidas (1-Tap)
              </span>
              {selectedTemplateId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplateId(null);
                    setTitle("");
                    setDescription("");
                    setChecklist([]);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium underline"
                >
                  Limpiar plantilla
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className={cn(
                      "flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all",
                      isSelected
                        ? "bg-primary-soft/40 border-primary shadow-xs ring-1 ring-primary/30"
                        : "bg-card border-border hover:border-primary/40 hover:bg-muted/50",
                    )}
                  >
                    <div className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                      isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                    )}>
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-foreground truncate">{tpl.name}</div>
                      {tpl.description && (
                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {tpl.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="h-px bg-border" />

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs font-semibold">
              Título de la Tarea <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                dirtyRef.current = true;
              }}
              placeholder="Ej: Llamada de seguimiento de cotización..."
              autoFocus
            />
          </div>

          {/* Related Contact */}
          <div className="space-y-1.5">
            <Label htmlFor="task-relation" className="text-xs font-semibold">
              Contacto / Cuenta Vinculada
            </Label>
            <Input
              id="task-relation"
              value={relatedRecordName}
              onChange={(e) => {
                setRelatedRecordName(e.target.value);
                dirtyRef.current = true;
              }}
              placeholder="Ej: Carlos Gómez · Seguros Bolivar"
            />
          </div>

          {/* Priority & Due Date Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Prioridad</Label>
              <Select
                value={priority}
                onValueChange={(val: TaskPriority) => {
                  setPriority(val);
                  dirtyRef.current = true;
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Urgente
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Alta
                    </span>
                  </SelectItem>
                  <SelectItem value="normal">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Normal
                    </span>
                  </SelectItem>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      Baja
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Vencimiento</Label>
              <Select
                value={dueDays !== null ? String(dueDays) : "none"}
                onValueChange={(val) => {
                  setDueDays(val === "none" ? null : Number(val));
                  dirtyRef.current = true;
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin fecha fija</SelectItem>
                  <SelectItem value="0">Hoy</SelectItem>
                  <SelectItem value="1">Mañana (+1 día)</SelectItem>
                  <SelectItem value="2">En 2 días</SelectItem>
                  <SelectItem value="3">En 3 días</SelectItem>
                  <SelectItem value="7">En 1 semana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-desc" className="text-xs font-semibold">
              Descripción / Notas adicionales
            </Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                dirtyRef.current = true;
              }}
              placeholder="Detalles sobre las acciones acordadas, requisitos previos..."
              rows={3}
            />
          </div>

          {/* Checklist / Sub-tasks */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-primary" />
                Sub-tareas & Checklist ({checklist.length})
              </Label>
              {checklist.length > 0 && (
                <span className="text-[11px] text-muted-foreground font-medium">
                  {checklist.filter((c) => c.completed).length} de {checklist.length} listas
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddStep();
                  }
                }}
                placeholder="Escribe un paso (ej: Adjuntar anexo PDF) y presiona Enter..."
              />
              <Button
                type="button"
                onClick={handleAddStep}
                variant="outline"
                className="shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>

            {checklist.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {checklist.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-card border border-border shadow-xs text-xs"
                  >
                    <span className="font-medium text-foreground truncate flex items-center gap-2">
                      <span className="text-muted-foreground">▫️</span>
                      {step.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(step.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppDrawer>
  );
}
