import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Priority, Project, Task, TaskStatus, User } from "@/types";

export interface TaskDraft {
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  tags: string;
}

const DEFAULT: TaskDraft = {
  title: "", description: "", projectId: "", assigneeId: "",
  status: "todo", priority: "medium", dueDate: "", tags: "",
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task?: Task | null;
  projects: readonly Project[];
  users: readonly User[];
  onSubmit: (draft: TaskDraft) => void;
}

export function TaskDialog({ open, onOpenChange, task, projects, users, onSubmit }: Props) {
  const isEdit = !!task;
  const [draft, setDraft] = useState<TaskDraft>(DEFAULT);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDraft(
      task
        ? {
            title: task.title,
            description: task.description ?? "",
            projectId: task.projectId,
            assigneeId: task.assigneeId ?? "",
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
            tags: task.tags.join(", "),
          }
        : { ...DEFAULT, projectId: projects[0]?.id ?? "" },
    );
  }, [open, task, projects]);

  const set = <K extends keyof TaskDraft>(k: K, v: TaskDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return setError("Title is required.");
    if (!draft.projectId) return setError("Pick a project.");
    onSubmit({
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      tags: draft.tags,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{isEdit ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update task details and assignment." : "Add a new task to a project."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input id="t-title" value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Implement search filters" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Description</Label>
            <Textarea id="t-desc" rows={2} value={draft.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={draft.projectId} onValueChange={(v) => set("projectId", v)}>
                <SelectTrigger><SelectValue placeholder="Pick project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select value={draft.assigneeId || "none"} onValueChange={(v) => set("assigneeId", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v) => set("status", v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To-do</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={draft.priority} onValueChange={(v) => set("priority", v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Due date</Label>
              <Input id="t-due" type="date" value={draft.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-tags">Tags</Label>
            <Input id="t-tags" value={draft.tags} onChange={(e) => set("tags", e.target.value)} placeholder="design, frontend" />
            <p className="text-xs text-muted-foreground">Comma-separated.</p>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEdit ? "Save changes" : "Create task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
