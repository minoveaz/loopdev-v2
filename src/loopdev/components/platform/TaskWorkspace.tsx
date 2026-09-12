import { useEffect, useState, type FormEvent } from "react";
import { Check, CheckCircle2, Circle, Clock3, ListChecks, Plus, RotateCcw, ChevronsUpDown } from "lucide-react";
import { DataCard, StatusBadge, useFormLifecycle } from "@/components/common";
import { AppDrawer } from "@/components/platform";
import { FilePicker } from "@/loopdev/components/files";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EntityRef, TaskPriority, TaskRecord, TaskStatus, TaskTemplateRecord } from "@/loopdev/domains/platform";

const priorityTone: Record<TaskPriority, "neutral" | "info" | "warning" | "gold"> = {
  low: "neutral",
  normal: "info",
  high: "warning",
  urgent: "gold",
};

export interface PlatformTaskFormProps {
  relation: EntityRef;
  task?: TaskRecord;
  templates?: TaskTemplateRecord[];
  formId?: string;
  showSubmitButton?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  submitLabel?: string;
  canAssign?: boolean;
  onSubmit: (input: {
    title: string;
    description: string | null;
    priority: TaskPriority;
    dueAt: string | null;
    relation: EntityRef;
    assignedUserId?: string | null;
    attachments?: File[];
  }) => Promise<unknown>;
  onAttachmentUpload?: (file: File) => Promise<unknown>;
}

export function PlatformTaskForm({ relation, task, templates = [], formId = "platform-task-form", showSubmitButton = true, onDirtyChange, submitLabel, canAssign = false, onSubmit, onAttachmentUpload }: PlatformTaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "normal");
  const [dueAt, setDueAt] = useState(task?.dueAt ?? "");
  const [assignedUserId, setAssignedUserId] = useState(task?.assignedUserId ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateKey, setTemplateKey] = useState("");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const selectedTemplate = templates.find((template) => template.key === templateKey);
  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setPriority(task?.priority ?? "normal");
    setDueAt(task?.dueAt ?? "");
    setAssignedUserId(task?.assignedUserId ?? "");
    setTemplateKey("");
    setError(null);
    onDirtyChange?.(false);
  }, [onDirtyChange, task]);
  const applyTemplate = (template: TaskTemplateRecord) => {
    setTemplateKey(template.key);
    setTitle(template.name);
    setDescription(template.description);
    setPriority(template.defaultPriority);
    setDueAt(template.defaultDueDays == null ? "" : new Date(Date.now() + template.defaultDueDays * 86400000).toISOString());
    onDirtyChange?.(true);
    setTemplateOpen(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Add a title before saving the task.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        dueAt: dueAt || null,
        relation,
        assignedUserId: canAssign ? assignedUserId.trim() || null : undefined,
        attachments,
      });
      setTitle("");
      setDescription("");
      setPriority("normal");
      setDueAt("");
      setAssignedUserId("");
      setAttachments([]);
      onDirtyChange?.(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save task.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form id={formId} onSubmit={submit} className="space-y-4" aria-label={task ? "Edit task" : "Create task"}>
      {templates.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="platform-task-template">Task template</Label>
          <Popover open={templateOpen} onOpenChange={setTemplateOpen}>
            <PopoverTrigger asChild>
              <Button id="platform-task-template" type="button" variant="outline" role="combobox" aria-expanded={templateOpen} className="w-full justify-between font-normal">
                <span className={cn(!selectedTemplate && "text-muted-foreground")}>{selectedTemplate?.name ?? "Start from a template (optional)"}</span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search task templates..." />
                <CommandList>
                  <CommandEmpty>No task templates found.</CommandEmpty>
                  {templates.filter((template) => template.relationTypes.includes(relation.entityType)).map((template) => (
                    <CommandItem key={template.key} value={`${template.key} ${template.name} ${template.description}`} onSelect={() => applyTemplate(template)}>
                      <Check className={cn("mr-2 h-4 w-4", selectedTemplate?.key === template.key ? "opacity-100" : "opacity-0")} />
                      <span>{template.name}</span>
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="platform-task-title">Title</Label>
        <Input id="platform-task-title" value={title} onChange={(event) => { setTitle(event.target.value); onDirtyChange?.(true); }} disabled={pending} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="platform-task-description">Description</Label>
        <Textarea id="platform-task-description" value={description} onChange={(event) => { setDescription(event.target.value); onDirtyChange?.(true); }} disabled={pending} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="platform-task-priority">Priority</Label>
          <Select value={priority} onValueChange={(value) => { setPriority(value as TaskPriority); onDirtyChange?.(true); }} disabled={pending}>
            <SelectTrigger id="platform-task-priority"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="platform-task-due">Due date</Label>
          <Input id="platform-task-due" type="date" value={dueAt.slice(0, 10)} onChange={(event) => { setDueAt(event.target.value ? new Date(`${event.target.value}T12:00:00`).toISOString() : ""); onDirtyChange?.(true); }} disabled={pending} />
        </div>
      </div>
      {canAssign && (
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-assignee`}>Assigned user</Label>
          <Input
            id={`${formId}-assignee`}
            value={assignedUserId}
            placeholder="User ID or leave unassigned"
            onChange={(event) => { setAssignedUserId(event.target.value); onDirtyChange?.(true); }}
            disabled={pending}
          />
        </div>
      )}
      {onAttachmentUpload && (
        <div className="space-y-1.5">
          <Label>Attachments</Label>
          <FilePicker multiple onFilesSelected={(files) => { setAttachments((current) => [...current, ...files]); if (onAttachmentUpload) void Promise.all(files.map(onAttachmentUpload)); }} />
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {showSubmitButton && <Button type="submit" disabled={pending}><Plus className="mr-1.5 h-4 w-4" />{pending ? "Saving…" : submitLabel ?? (task ? "Save changes" : "Add task")}</Button>}
    </form>
  );
}

export interface PlatformTaskListProps {
  tasks: TaskRecord[];
  loading?: boolean;
  error?: string | null;
  forbidden?: boolean;
  onTransition?: (task: TaskRecord, status: TaskStatus) => Promise<unknown>;
  onOpen?: (task: TaskRecord) => void;
}

export function PlatformTaskList({ tasks, loading = false, error, forbidden = false, onTransition, onOpen }: PlatformTaskListProps) {
  return (
    <DataCard
      title="Tasks"
      description="Actionable work shared by CRM and Platform"
      loading={loading}
      error={forbidden ? "You do not have access to tasks in this scope." : error}
      empty={!loading && !error && !forbidden && tasks.length === 0}
      emptyIcon={ListChecks}
      emptyTitle="No tasks in this view"
      emptyDescription="Create a task from a related CRM record to start a follow-up."
    >
      <ul className="space-y-2" aria-label="Task list">
        {tasks.map((task) => {
          const done = task.status === "completed" || task.status === "cancelled";
          return (
            <li
              key={task.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card-muted/30 p-3 transition-colors hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring"
              tabIndex={onOpen ? 0 : undefined}
              onClick={() => onOpen?.(task)}
              onKeyDown={(event) => {
                if (onOpen && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  onOpen(task);
                }
              }}
              aria-label={onOpen ? `Open task ${task.title}` : undefined}
            >
              <span className="mt-0.5 text-muted-foreground" aria-hidden="true">{done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4" />}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{task.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{task.relation.entityType} · {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : "No due date"}</p>
                {task.attachments && task.attachments.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{task.attachments.length} attachment{task.attachments.length === 1 ? "" : "s"}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge tone={priorityTone[task.priority]}>{task.priority}</StatusBadge>
                  <StatusBadge tone={done ? "neutral" : "info"}>{task.status.replace("_", " ")}</StatusBadge>
                </div>
              </div>
              {onTransition && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    void onTransition(task, done ? "open" : "completed");
                  }}
                >
                  {done ? <RotateCcw className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </DataCard>
  );
}

export function PlatformTaskWorkspace(props: PlatformTaskListProps & { relation?: EntityRef; onCreate?: PlatformTaskFormProps["onSubmit"] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const lifecycle = useFormLifecycle();
  return (
    <div>
      <PlatformTaskList {...props} />
      {props.relation && props.onCreate && (
        <>
          <div className="mt-3 flex justify-end">
            <Button type="button" variant="outline" onClick={() => setDrawerOpen(true)}><Plus className="mr-1.5 h-4 w-4" />New task</Button>
          </div>
          <AppDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            title="New Platform task"
            description="Create work related to this CRM entity."
            size="md"
            layoutMode="standard"
            responsive="auto"
            dirty={() => lifecycle.dirtyRef.current}
            confirmOnClose
            onDiscard={lifecycle.markClean}
          >
            <PlatformTaskForm
              relation={props.relation}
              onDirtyChange={lifecycle.setDirty}
              onSubmit={async (input) => {
                await props.onCreate!(input);
                lifecycle.markClean();
                setDrawerOpen(false);
              }}
            />
          </AppDrawer>
        </>
      )}
    </div>
  );
}
