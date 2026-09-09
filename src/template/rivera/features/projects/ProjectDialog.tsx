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
import type { Currency, Priority, Project, ProjectStatus, User } from "@/types";

export interface ProjectDraft {
  name: string;
  client: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  budget: number;
  currency: Currency;
  ownerId: string;
  startDate: string;
  dueDate: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const plus = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};

const DEFAULT: ProjectDraft = {
  name: "", client: "", description: "",
  status: "planned", priority: "medium",
  progress: 0, budget: 0, currency: "USD",
  ownerId: "", startDate: today(), dueDate: plus(30),
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  project?: Project | null;
  users: readonly User[];
  onSubmit: (draft: ProjectDraft) => void;
}

export function ProjectDialog({ open, onOpenChange, project, users, onSubmit }: Props) {
  const isEdit = !!project;
  const [draft, setDraft] = useState<ProjectDraft>(DEFAULT);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDraft(
      project
        ? {
            name: project.name,
            client: project.client,
            description: project.description,
            status: project.status,
            priority: project.priority,
            progress: project.progress,
            budget: project.budget,
            currency: project.currency,
            ownerId: project.ownerId,
            startDate: project.startDate.slice(0, 10),
            dueDate: project.dueDate.slice(0, 10),
          }
        : { ...DEFAULT, ownerId: users[0]?.id ?? "" },
    );
  }, [open, project, users]);

  const set = <K extends keyof ProjectDraft>(k: K, v: ProjectDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return setError("Project name is required.");
    if (!draft.client.trim()) return setError("Client is required.");
    if (!draft.ownerId) return setError("Pick an owner.");
    onSubmit({
      ...draft,
      name: draft.name.trim(),
      client: draft.client.trim(),
      description: draft.description.trim(),
      progress: Math.max(0, Math.min(100, Number(draft.progress) || 0)),
      budget: Math.max(0, Number(draft.budget) || 0),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{isEdit ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update project details and ownership." : "Plan a new engagement and assign an owner."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Atlas Rebrand" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-client">Client</Label>
              <Input id="p-client" value={draft.client} onChange={(e) => set("client", e.target.value)} placeholder="Atlas Coffee Co." />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea id="p-desc" rows={2} value={draft.description} onChange={(e) => set("description", e.target.value)} placeholder="Short scope summary…" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v) => set("status", v as ProjectStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="on_hold">On hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
              <Label htmlFor="p-progress">Progress (%)</Label>
              <Input id="p-progress" type="number" min={0} max={100} value={draft.progress} onChange={(e) => set("progress", Number(e.target.value))} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-budget">Budget</Label>
              <Input id="p-budget" type="number" min={0} value={draft.budget} onChange={(e) => set("budget", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={draft.currency} onValueChange={(v) => set("currency", v as Currency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select value={draft.ownerId} onValueChange={(v) => set("ownerId", v)}>
                <SelectTrigger><SelectValue placeholder="Pick owner" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-start">Start date</Label>
              <Input id="p-start" type="date" value={draft.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-due">Due date</Label>
              <Input id="p-due" type="date" value={draft.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEdit ? "Save changes" : "Create project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
