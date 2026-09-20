import React, { useState, useEffect, useRef } from "react";
import type {
  CreateTaskInput,
  PlatformSuiteKey,
  TaskEntityRef,
  TaskPriority,
  TaskTemplateRecord,
  TaskChecklistItem,
} from "@/loopdev/domains/tasks";
import { AVAILABLE_ASSIGNABLE_USERS } from "@/loopdev/domains/tasks";
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
import { useT } from "@/i18n";

interface QuickTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<unknown>;
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
  const t = useT();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [suite, setSuite] = useState<PlatformSuiteKey>(initialSuite);
  const [dueDays, setDueDays] = useState<number | null>(1);
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>([]);
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
          assigneeId: null,
          assignee: null,
        })),
      );
    }
    dirtyRef.current = true;
  };

  const handleAddStep = () => {
    if (!newStep.trim()) return;
    setChecklist((prev) => [...prev, { id: `step-${Date.now()}`, title: newStep.trim(), completed: false, assigneeId: null, assignee: null }]);
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
      title={title.trim() ? title : t("crm.tasks.form.newTitle")}
      eyebrow={t("crm.tasks.form.eyebrow")}
      mode="New"
      size="md"
      layoutMode="standard"
      responsive="auto"
      description={t("crm.tasks.form.description")}
      dirty={() => dirtyRef.current}
      footer={
        <div className="flex w-full items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !title.trim()}
            className="min-w-[120px]"
          >
            {isSubmitting ? t("crm.tasks.form.saving") : t("crm.tasks.form.create")}
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
                {t("crm.tasks.form.quickTemplates")}
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
                  {t("crm.tasks.form.clearTemplate")}
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
              {t("crm.tasks.form.title")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                dirtyRef.current = true;
              }}
              placeholder={t("crm.tasks.form.titlePlaceholder")}
              autoFocus
            />
          </div>

          {/* Related Contact */}
          <div className="space-y-1.5">
            <Label htmlFor="task-relation" className="text-xs font-semibold">
              {t("crm.tasks.form.relatedRecord")}
            </Label>
            <Input
              id="task-relation"
              value={relatedRecordName}
              onChange={(e) => {
                setRelatedRecordName(e.target.value);
                dirtyRef.current = true;
              }}
              placeholder={t("crm.tasks.form.relatedPlaceholder")}
            />
          </div>

          {/* Priority & Due Date Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("crm.tasks.columns.priority")}</Label>
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
                      {t("crm.tasks.priority.urgent")}
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      {t("crm.tasks.priority.high")}
                    </span>
                  </SelectItem>
                  <SelectItem value="normal">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      {t("crm.tasks.priority.normal")}
                    </span>
                  </SelectItem>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      {t("crm.tasks.priority.low")}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("crm.tasks.columns.dueDate")}</Label>
              <Select
                value={dueDays !== null ? String(dueDays) : "none"}
                onValueChange={(val) => {
                  setDueDays(val === "none" ? null : Number(val));
                  dirtyRef.current = true;
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("crm.tasks.form.noDueDate")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("crm.tasks.form.noFixedDate")}</SelectItem>
                  <SelectItem value="0">{t("crm.tasks.form.today")}</SelectItem>
                  <SelectItem value="1">{t("crm.tasks.form.tomorrow")}</SelectItem>
                  <SelectItem value="2">{t("crm.tasks.form.inTwoDays")}</SelectItem>
                  <SelectItem value="3">{t("crm.tasks.form.inThreeDays")}</SelectItem>
                  <SelectItem value="7">{t("crm.tasks.form.inOneWeek")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-desc" className="text-xs font-semibold">
              {t("crm.tasks.form.descriptionLabel")}
            </Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                dirtyRef.current = true;
              }}
              placeholder={t("crm.tasks.form.descriptionPlaceholder")}
              rows={3}
            />
          </div>

          {/* Checklist / Sub-tasks */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-primary" />
                {t("crm.tasks.form.subtasks", { count: checklist.length })}
              </Label>
              {checklist.length > 0 && (
                <span className="text-[11px] text-muted-foreground font-medium">
                  {checklist.filter((c) => c.completed).length} / {checklist.length} {t("crm.tasks.form.completed")}
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
                placeholder={t("crm.tasks.form.subtaskPlaceholder")}
              />
              <Button
                type="button"
                onClick={handleAddStep}
                variant="outline"
                className="shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t("crm.tasks.form.add")}
              </Button>
            </div>

            {checklist.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {checklist.map((step) => (
                  <div
                    key={step.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-2.5 text-xs shadow-xs"
                  >
                    <span className="flex min-w-[180px] flex-1 items-center gap-2 font-medium text-foreground">
                      <CheckSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      {step.title}
                    </span>
                    <Select
                      value={step.assigneeId || "unassigned"}
                      onValueChange={(value) => setChecklist((current) => current.map((item) => {
                        if (item.id !== step.id) return item;
                        const assignee = AVAILABLE_ASSIGNABLE_USERS.find((user) => user.id === value) || null;
                        return { ...item, assigneeId: assignee?.id || null, assignee };
                      }))}
                    >
                      <SelectTrigger className="h-8 w-40 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">{t("crm.tasks.unassigned")}</SelectItem>
                        {AVAILABLE_ASSIGNABLE_USERS.map((user) => <SelectItem key={user.id} value={user.id}>{user.displayName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <button type="button" onClick={() => handleRemoveStep(step.id)} className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
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
