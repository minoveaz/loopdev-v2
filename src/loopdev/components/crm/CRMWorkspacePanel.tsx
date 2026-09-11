import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  CalendarPlus,
  CheckCircle2,
  ExternalLink,
  FileText,
  ListTodo,
  MessageSquarePlus,
  PanelRightClose,
  RefreshCw,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/common";
import { platformAdapter, type EntityRef } from "@/loopdev/domains/platform";
import { type ConversationSummary } from "@/loopdev/domains/communications";
import { useCrmWorkspace } from "@/loopdev/domains/crm/workspace";
import { cn } from "@/lib/utils";
import { formatDate, formatRelative } from "@/lib/formatters";

interface CRMWorkspacePanelProps {
  conversation: ConversationSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useDesktopLayout() {
  const [desktop, setDesktop] = useState(() => (
    typeof window === "undefined" || !window.matchMedia
      ? true
      : window.matchMedia("(min-width: 1024px)").matches
  ));

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return desktop;
}

function recordLink(path: string, label: string) {
  return (
    <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
      <a href={path} target="_blank" rel="noreferrer">
        <ExternalLink className="me-1.5 h-3 w-3" />
        {label}
      </a>
    </Button>
  );
}

function CRMWorkspaceBody({
  conversation,
  onOpenChange,
}: Omit<CRMWorkspacePanelProps, "open">) {
  const workspaceHook = useCrmWorkspace(conversation.contact.id, true);
  const {
    workspace,
    loading,
    error,
    forbidden,
    actionError,
    clearActionError,
    reload,
    createTask,
    createNote,
    updateLead,
    assignTask,
  } = workspaceHook;
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [leadStatus, setLeadStatus] = useState("");
  const [working, setWorking] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const relation = useMemo<EntityRef<"contact">>(() => ({
    entityType: "contact",
    entityId: conversation.contact.id,
    scope: platformAdapter.getScope(),
  }), [conversation.contact.id]);
  const lead = workspace?.leads[0];
  const opportunity = workspace?.opportunities[0];

  useEffect(() => {
    setLeadStatus(lead?.status ?? "");
  }, [lead?.id, lead?.status]);

  const run = async (action: () => Promise<unknown>, after?: () => void) => {
    setWorking(true);
    try {
      await action();
      after?.();
    } catch {
      // Action errors are rendered by the workspace hook.
    } finally {
      setWorking(false);
    }
  };

  const submitTask = () => {
    if (!taskTitle.trim() || !workspace) return;
    void run(
      () => createTask({
        title: taskTitle,
        description: `Created from conversation ${conversation.id}.`,
        relation,
        priority: "normal",
        assignedUserId: "local-development-user",
      }),
      () => {
        setTaskTitle("");
        setTaskFormOpen(false);
      },
    );
  };

  const submitNote = () => {
    if (!noteBody.trim() || !workspace) return;
    void run(
      () => createNote({ relation, body: noteBody, visibility: "team" }),
      () => {
        setNoteBody("");
        setNoteFormOpen(false);
      },
    );
  };

  const saveLead = () => {
    if (!lead || !leadStatus) return;
    void run(() => updateLead(lead.id, {
      status: leadStatus as typeof lead.status,
      expectedUpdatedAt: lead.updatedAt,
    }));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="crm-workspace">
      <header className="flex shrink-0 items-start gap-3 border-b border-border px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
          {conversation.contact.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">CRM Workspace</h2>
          <p className="truncate text-xs text-muted-foreground">{conversation.contact.displayName}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Close CRM workspace" onClick={() => onOpenChange(false)}>
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {loading && <p className="py-10 text-center text-sm text-muted-foreground">Loading CRM context…</p>}
        {forbidden && (
          <div className="rounded-md border border-warning/30 bg-warning-soft px-3 py-3 text-xs text-warning" role="alert">
            You do not have permission to view CRM context for this conversation.
          </div>
        )}
        {!loading && !forbidden && error && (
          <div className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3 text-xs text-destructive" role="alert">
            <p>{error}</p>
            <Button size="sm" variant="outline" onClick={reload}><RefreshCw className="me-1.5 h-3 w-3" />Try again</Button>
          </div>
        )}
        {!loading && !error && !forbidden && !workspace && (
          <div className="rounded-md border border-warning/30 bg-warning-soft px-3 py-3 text-xs text-warning" role="status">
            This conversation is not linked to a CRM contact yet. The thread remains available while identity review is pending.
          </div>
        )}
        {workspace && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-col">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-muted/60 p-1">
              <TabsTrigger value="overview" onClick={() => setActiveTab("overview")}>Overview</TabsTrigger>
              <TabsTrigger value="contact" onClick={() => setActiveTab("contact")}>Contact</TabsTrigger>
              <TabsTrigger value="lead" onClick={() => setActiveTab("lead")}>Lead</TabsTrigger>
              <TabsTrigger value="opportunity" onClick={() => setActiveTab("opportunity")}>Opportunity</TabsTrigger>
              <TabsTrigger value="work" onClick={() => setActiveTab("work")}>Work</TabsTrigger>
              <TabsTrigger value="notes" onClick={() => setActiveTab("notes")}>Notes / Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3 space-y-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{workspace.contact.firstName} {workspace.contact.lastName ?? ""}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{workspace.contact.companyName ?? "CRM contact"}</p>
                  </div>
                  {recordLink(`/app/sales-crm/contacts/${workspace.contact.id}`, "Open contact")}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div><dt className="text-muted-foreground">Email</dt><dd className="truncate">{workspace.contact.email ?? "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Phone</dt><dd>{workspace.contact.phone ?? "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Lead</dt><dd>{lead ? lead.status : "None"}</dd></div>
                  <div><dt className="text-muted-foreground">Opportunity</dt><dd>{opportunity ? opportunity.name : "None"}</dd></div>
                </dl>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => setTaskFormOpen((value) => !value)}><ListTodo className="me-1.5 h-3.5 w-3.5" />Create task</Button>
                <Button variant="outline" size="sm" onClick={() => setNoteFormOpen((value) => !value)}><MessageSquarePlus className="me-1.5 h-3.5 w-3.5" />Add CRM note</Button>
                {opportunity ? recordLink(`/app/sales-crm/opportunities?opportunity=${opportunity.id}`, "Open opportunity") : <span />}
              </div>
              <QuickTaskForm open={taskFormOpen} title={taskTitle} onTitleChange={setTaskTitle} onCancel={() => setTaskFormOpen(false)} onSubmit={submitTask} working={working} />
              <QuickNoteForm open={noteFormOpen} body={noteBody} onBodyChange={setNoteBody} onCancel={() => setNoteFormOpen(false)} onSubmit={submitNote} working={working} />
              {actionError && <ActionError message={actionError} onDismiss={clearActionError} />}
            </TabsContent>

            <TabsContent value="contact" className="mt-3 space-y-3">
              <RecordSection title="Contact details" action={recordLink(`/app/sales-crm/contacts/${workspace.contact.id}`, "Open record")}>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <Field label="Name" value={[workspace.contact.firstName, workspace.contact.lastName].filter(Boolean).join(" ")} />
                  <Field label="Preferred channel" value={workspace.contact.preferredChannel} />
                  <Field label="Email" value={workspace.contact.email} />
                  <Field label="Phone" value={workspace.contact.phone} />
                  <Field label="Location" value={[workspace.contact.city, workspace.contact.country].filter(Boolean).join(", ")} />
                  <Field label="Identity" value={workspace.contact.identityStatus.replace("_", " ")} />
                </dl>
              </RecordSection>
              <QuickActions onTask={() => setTaskFormOpen(true)} onNote={() => setNoteFormOpen(true)} />
              <QuickTaskForm open={taskFormOpen} title={taskTitle} onTitleChange={setTaskTitle} onCancel={() => setTaskFormOpen(false)} onSubmit={submitTask} working={working} />
              <QuickNoteForm open={noteFormOpen} body={noteBody} onBodyChange={setNoteBody} onCancel={() => setNoteFormOpen(false)} onSubmit={submitNote} working={working} />
              {actionError && <ActionError message={actionError} onDismiss={clearActionError} />}
            </TabsContent>

            <TabsContent value="lead" className="mt-3 space-y-3">
              <h3 className="text-sm font-semibold">Lead details</h3>
              {lead ? (
                <RecordSection title={`Lead · ${lead.interest ?? "General interest"}`} action={recordLink(`/app/sales-crm/leads?lead=${lead.id}`, "Open lead")}>
                  <div className="space-y-3 text-xs">
                    <Field label="Source" value={lead.source} />
                    <Field label="Owner" value={lead.ownerName} />
                    <Field label="Score" value={lead.score == null ? null : String(lead.score)} />
                    <label className="block"><span className="text-muted-foreground">Status</span><select value={leadStatus} onChange={(event) => setLeadStatus(event.target.value)} className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="stalled">Stalled</option><option value="inactive">Inactive</option><option value="converted">Converted</option></select></label>
                    {workspace.permissions.canWrite && <Button size="sm" onClick={saveLead} disabled={working || leadStatus === lead.status}>Update lead</Button>}
                  </div>
                </RecordSection>
              ) : <EmptyPanel icon={UsersRound} message="No lead is linked to this contact." />}
              {actionError && <ActionError message={actionError} onDismiss={clearActionError} />}
            </TabsContent>

            <TabsContent value="opportunity" className="mt-3 space-y-3">
              {opportunity ? (
                <RecordSection title={opportunity.name} action={recordLink(`/app/sales-crm/opportunities?opportunity=${opportunity.id}`, "Open opportunity")}>
                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <Field label="Stage" value={opportunity.stageKey} />
                    <Field label="Amount" value={opportunity.amount == null ? null : `${opportunity.currency ?? ""} ${opportunity.amount.toLocaleString()}`} />
                    <Field label="Expected close" value={opportunity.expectedCloseAt ? formatDate(opportunity.expectedCloseAt) : null} />
                    <Field label="Origin" value={opportunity.origin} />
                  </dl>
                </RecordSection>
              ) : <EmptyPanel icon={CalendarPlus} message="No opportunity is linked to this contact." />}
            </TabsContent>

            <TabsContent value="work" className="mt-3 space-y-3">
              <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Tasks & Activities</h3><Button variant="outline" size="sm" onClick={() => setTaskFormOpen(true)}><ListTodo className="me-1.5 h-3 w-3" />Create task</Button></div>
              <QuickTaskForm open={taskFormOpen} title={taskTitle} onTitleChange={setTaskTitle} onCancel={() => setTaskFormOpen(false)} onSubmit={submitTask} working={working} />
              {workspace.tasks.length ? workspace.tasks.map((task) => (
                <div key={task.id} className="rounded-md border border-border px-3 py-2 text-xs">
                  <div className="flex items-start justify-between gap-2"><span className="font-medium">{task.title}</span><StatusBadge tone={task.status === "completed" ? "success" : "info"}>{task.status.replace("_", " ")}</StatusBadge></div>
                  <p className="mt-1 text-muted-foreground">{task.dueAt ? `Due ${formatDate(task.dueAt)}` : "No due date"} · {task.priority}</p>
                  {workspace.permissions.canAssign && <Button variant="ghost" size="sm" className="mt-1 h-6 px-1.5 text-[11px]" onClick={() => void run(() => assignTask(task.id, "local-development-user", task.version))}>Assign to me</Button>}
                </div>
              )) : <EmptyPanel icon={ListTodo} message="No tasks are linked to this contact." />}
              {actionError && <ActionError message={actionError} onDismiss={clearActionError} />}
            </TabsContent>

            <TabsContent value="notes" className="mt-3 space-y-3">
              <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Notes & Timeline</h3><Button variant="outline" size="sm" onClick={() => setNoteFormOpen(true)}><FileText className="me-1.5 h-3 w-3" />Add note</Button></div>
              <QuickNoteForm open={noteFormOpen} body={noteBody} onBodyChange={setNoteBody} onCancel={() => setNoteFormOpen(false)} onSubmit={submitNote} working={working} />
              {workspace.notes.map((note) => <div key={note.id} className="rounded-md border border-border px-3 py-2 text-xs"><p>{note.body}</p><p className="mt-1 text-[11px] text-muted-foreground">{formatRelative(note.updatedAt)} · {note.visibility}</p></div>)}
              {workspace.timeline.map((event) => <div key={event.id} className="flex gap-2 border-s border-border ps-3 text-xs"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" /><div><p>{event.summary}</p><p className="text-[11px] text-muted-foreground">{formatRelative(event.occurredAt)}</p></div></div>)}
              {!workspace.notes.length && !workspace.timeline.length && <EmptyPanel icon={FileText} message="No notes or timeline activity yet." />}
              {actionError && <ActionError message={actionError} onDismiss={clearActionError} />}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function RecordSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="rounded-lg border border-border bg-card p-3"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{title}</h3>{action}</div><div className="mt-3">{children}</div></section>;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><dt className="text-muted-foreground">{label}</dt><dd className="mt-0.5 truncate capitalize">{value || "—"}</dd></div>;
}

function EmptyPanel({ icon: Icon, message }: { icon: typeof ListTodo; message: string }) {
  return <div className="rounded-md border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground"><Icon className="mx-auto mb-2 h-4 w-4" />{message}</div>;
}

function QuickActions({ onTask, onNote }: { onTask: () => void; onNote: () => void }) {
  return <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={onTask}><ListTodo className="me-1.5 h-3 w-3" />Create task</Button><Button size="sm" variant="outline" onClick={onNote}><MessageSquarePlus className="me-1.5 h-3 w-3" />Add CRM note</Button></div>;
}

function QuickTaskForm({ open, title, onTitleChange, onCancel, onSubmit, working }: { open: boolean; title: string; onTitleChange: (value: string) => void; onCancel: () => void; onSubmit: () => void; working: boolean }) {
  if (!open) return null;
  return <div className="rounded-md border border-primary/25 bg-primary-soft/30 p-3"><label className="text-xs font-medium" htmlFor="crm-workspace-task-title">Task title</label><Input id="crm-workspace-task-title" value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Follow up with contact" className="mt-1 h-8 text-xs" /><div className="mt-2 flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button><Button size="sm" onClick={onSubmit} disabled={!title.trim() || working}>{working ? "Saving…" : "Save task"}</Button></div></div>;
}

function QuickNoteForm({ open, body, onBodyChange, onCancel, onSubmit, working }: { open: boolean; body: string; onBodyChange: (value: string) => void; onCancel: () => void; onSubmit: () => void; working: boolean }) {
  if (!open) return null;
  return <div className="rounded-md border border-primary/25 bg-primary-soft/30 p-3"><label className="text-xs font-medium" htmlFor="crm-workspace-note-body">CRM note</label><textarea id="crm-workspace-note-body" value={body} onChange={(event) => onBodyChange(event.target.value)} placeholder="Add context for the team" className="mt-1 min-h-16 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs" /><div className="mt-2 flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button><Button size="sm" onClick={onSubmit} disabled={!body.trim() || working}>{working ? "Saving…" : "Save note"}</Button></div></div>;
}

function ActionError({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive" role="alert"><span className="flex-1">{message}</span><button type="button" aria-label="Dismiss CRM workspace error" onClick={onDismiss}><X className="h-3.5 w-3.5" /></button></div>;
}

export function CRMWorkspacePanel(props: CRMWorkspacePanelProps) {
  const desktop = useDesktopLayout();
  if (desktop) {
    return (
      <aside className={cn("w-[380px] shrink-0 flex-col border-s border-border bg-card", props.open ? "flex" : "hidden")} aria-label="CRM workspace" aria-hidden={!props.open}>
        <CRMWorkspaceBody {...props} />
      </aside>
    );
  }

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent forceMount side="right" className="flex w-full max-w-none flex-col p-0 sm:w-[min(92vw,420px)]">
        <SheetHeader className="sr-only"><SheetTitle>Contextual CRM records</SheetTitle><SheetDescription>Contextual CRM records for the selected conversation.</SheetDescription></SheetHeader>
        <CRMWorkspaceBody {...props} />
      </SheetContent>
    </Sheet>
  );
}
