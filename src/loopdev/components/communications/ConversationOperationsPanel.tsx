import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  Check,
  ClipboardList,
  Eye,
  Hand,
  Lock,
  MessageSquarePlus,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/common";
import {
  localCommunicationAgents,
  type CollaborationAgent,
  type ConversationDetail,
  type ConversationStatus,
} from "@/loopdev/domains/communications";
import { formatRelative } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { ConversationContextPanelHeader } from "./ConversationContextPanelHeader";
import { ConversationContextTabs, type ConversationContextView } from "./ConversationContextTabs";

const statusLabels: Record<ConversationStatus, string> = {
  open: "Open",
  pending: "Pending",
  snoozed: "Snoozed",
  closed: "Closed",
};

interface ConversationOperationsPanelProps {
  detail: ConversationDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionError: string | null;
  onStatusChange: (status: ConversationStatus) => Promise<unknown>;
  onClaim: () => Promise<unknown>;
  onTransfer: (agent: CollaborationAgent) => Promise<unknown>;
  onUnassign: () => Promise<unknown>;
  onHandoff: (agent: CollaborationAgent) => Promise<unknown>;
  onParticipant: (
    action: "addCollaborator" | "removeCollaborator" | "addWatcher" | "removeWatcher",
    userId: string,
    agent?: CollaborationAgent,
  ) => Promise<unknown>;
  onAddInternalNote: (body: string) => Promise<unknown>;
  onAcquireLock: () => Promise<unknown>;
  onReleaseLock: () => Promise<unknown>;
  onTakeoverLock: () => Promise<unknown>;
  contextView: ConversationContextView;
  onContextViewChange: (view: ConversationContextView) => void;
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

function initials(name: string): string {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function AgentRow({
  agent,
  action,
  onClick,
}: {
  agent: CollaborationAgent;
  action: string;
  onClick: () => void;
}) {
  return (
    <li className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-xs">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">{initials(agent.name)}</span>
      <span className="min-w-0 flex-1 truncate">{agent.name}</span>
      <Button type="button" variant="ghost" size="sm" className="h-6 px-1.5 text-[11px]" aria-label={`${action} ${agent.name}`} onClick={onClick}>
        {action === "Remove" ? <UserMinus className="me-1 h-3 w-3" /> : <UserPlus className="me-1 h-3 w-3" />}
        {action}
      </Button>
    </li>
  );
}

function OperationsBody({
  detail,
  onOpenChange,
  actionError,
  onStatusChange,
  onClaim,
  onTransfer,
  onUnassign,
  onHandoff,
  onParticipant,
  onAddInternalNote,
  onAcquireLock,
  onReleaseLock,
  onTakeoverLock,
  contextView,
  onContextViewChange,
}: Omit<ConversationOperationsPanelProps, "open">) {
  const collaboration = detail.collaboration;
  const [noteBody, setNoteBody] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState(localCommunicationAgents[1]?.userId ?? "");
  const [working, setWorking] = useState(false);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const selectedAgent = localCommunicationAgents.find((agent) => agent.userId === selectedAgentId) ?? localCommunicationAgents[0];
  const run = async (action: () => Promise<unknown>, after?: () => void) => {
    setWorking(true);
    setErrorDismissed(false);
    try {
      await action();
      after?.();
    } finally {
      setWorking(false);
    }
  };

  if (!collaboration) return null;
  const collaboratorIds = new Set(collaboration.collaborators.map((agent) => agent.userId));
  const watcherIds = new Set(collaboration.watchers.map((agent) => agent.userId));
  const availableCollaborators = localCommunicationAgents.filter((agent) => !collaboratorIds.has(agent.userId));
  const availableWatchers = localCommunicationAgents.filter((agent) => !watcherIds.has(agent.userId));

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="conversation-operations">
      <ConversationContextPanelHeader
        icon={<ClipboardList className="h-4 w-4" />}
        title="Conversation Operations"
        subtitle={`${detail.summary.contact.displayName} · operational controls`}
      />

      <ConversationContextTabs active={contextView} onChange={onContextViewChange} />
      <div className="min-h-0 flex-1 overflow-y-auto space-y-4 p-3">
        {actionError && !errorDismissed && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive" role="alert">
            <span className="flex-1">{actionError}</span>
            <button type="button" aria-label="Dismiss operations error" onClick={() => setErrorDismissed(true)}><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        <section className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Conversation status</h3>
            <StatusBadge tone={detail.summary.status === "open" ? "success" : detail.summary.status === "pending" ? "warning" : detail.summary.status === "snoozed" ? "info" : "neutral"}>{statusLabels[detail.summary.status]}</StatusBadge>
          </div>
          <label className="mt-3 block text-xs">
            <span className="text-muted-foreground">Lifecycle</span>
            <select
              aria-label="Conversation status"
              value={detail.summary.status}
              disabled={working}
              onChange={(event) => void run(() => onStatusChange(event.target.value as ConversationStatus))}
              className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            >
              {(Object.keys(statusLabels) as ConversationStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
          </label>
        </section>

        <section className="rounded-lg border border-border bg-card p-3">
          <h3 className="text-sm font-semibold">Ownership & handoff</h3>
          <p className="mt-1 text-xs text-muted-foreground">{detail.summary.assignedToName ? `Assigned to ${detail.summary.assignedToName}` : "Unassigned"}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!detail.summary.assignedToUserId && <Button size="sm" variant="outline" disabled={working} onClick={() => void run(onClaim)}><UserPlus className="me-1.5 h-3.5 w-3.5" />Claim</Button>}
            {detail.summary.assignedToUserId && <Button size="sm" variant="outline" disabled={working} onClick={() => void run(onUnassign)}><UserMinus className="me-1.5 h-3.5 w-3.5" />Unassign</Button>}
          </div>
          <label className="mt-3 block text-xs">
            <span className="text-muted-foreground">Responsible agent</span>
            <select aria-label="Responsible agent" value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)} className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs">
              {localCommunicationAgents.map((agent) => <option key={agent.userId} value={agent.userId}>{agent.name}</option>)}
            </select>
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={working || !selectedAgent} onClick={() => selectedAgent && void run(() => onTransfer(selectedAgent))}><ArrowRightLeft className="me-1.5 h-3.5 w-3.5" />Transfer</Button>
            <Button size="sm" variant="ghost" disabled={working || !selectedAgent} onClick={() => selectedAgent && void run(() => onHandoff(selectedAgent))}><Hand className="me-1.5 h-3.5 w-3.5" />Request handoff</Button>
          </div>
          {collaboration.handoff && <p className="mt-2 rounded-md bg-muted px-2 py-1.5 text-[11px] text-muted-foreground">Handoff {collaboration.handoff.status} to {collaboration.handoff.requestedToName}</p>}
        </section>

        <section className="rounded-lg border border-border bg-card p-3">
          <h3 className="text-sm font-semibold">Collaborators & watchers</h3>
          <div className="mt-3 space-y-3">
            <div>
              <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground"><Users className="h-3 w-3" />Collaborators</div>
              <ul className="space-y-1.5">{collaboration.collaborators.map((agent) => <AgentRow key={agent.userId} agent={agent} action="Remove" onClick={() => void run(() => onParticipant("removeCollaborator", agent.userId))} />)}</ul>
              {availableCollaborators[0] && <AgentRow agent={availableCollaborators[0]} action="Add" onClick={() => void run(() => onParticipant("addCollaborator", availableCollaborators[0].userId, availableCollaborators[0]))} />}
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground"><Eye className="h-3 w-3" />Watchers</div>
              <ul className="space-y-1.5">{collaboration.watchers.map((agent) => <AgentRow key={agent.userId} agent={agent} action="Remove" onClick={() => void run(() => onParticipant("removeWatcher", agent.userId))} />)}</ul>
              {availableWatchers[0] && <AgentRow agent={availableWatchers[0]} action="Add" onClick={() => void run(() => onParticipant("addWatcher", availableWatchers[0].userId, availableWatchers[0]))} />}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-3">
          <h3 className="text-sm font-semibold">Live collaboration</h3>
          <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            {collaboration.presence.filter((item) => item.state !== "offline").map((item) => <p key={`presence-${item.userId}`}><Eye className="me-1 inline h-3 w-3" />{item.name} is {item.state}</p>)}
            {collaboration.drafting.map((item) => <p key={`drafting-${item.userId}`}><MessageSquarePlus className="me-1 inline h-3 w-3" />{item.name} is drafting a customer reply</p>)}
            {!collaboration.presence.some((item) => item.state !== "offline") && !collaboration.drafting.length && <p>No other live activity.</p>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {!collaboration.composerLock && <Button size="sm" variant="outline" disabled={working} onClick={() => void run(onAcquireLock)}><Lock className="me-1.5 h-3 w-3" />Reserve composer</Button>}
            {collaboration.composerLock && collaboration.composerLock.userId === "local-development-user" && <Button size="sm" variant="outline" disabled={working} onClick={() => void run(onReleaseLock)}><Lock className="me-1.5 h-3 w-3" />Release composer</Button>}
            {collaboration.composerLock && collaboration.composerLock.userId !== "local-development-user" && <Button size="sm" variant="outline" disabled={working} onClick={() => void run(onTakeoverLock)}><Check className="me-1.5 h-3 w-3" />Take over composer</Button>}
          </div>
          {collaboration.composerLock && <p className="mt-2 text-[11px] text-muted-foreground">Customer reply composer held by {collaboration.composerLock.name}.</p>}
        </section>

        <section className="rounded-lg border border-warning/30 bg-warning-soft/40 p-3">
          <h3 className="text-sm font-semibold text-warning-foreground">Conversation internal notes</h3>
          <p className="mt-1 text-[11px] text-warning-foreground/80">Visible to the team only; never sent to the customer.</p>
          <div className="mt-3 space-y-2">
            {detail.internalNotes.slice().reverse().map((note) => <div key={note.id} className="rounded-md border border-warning/20 bg-background/60 px-2.5 py-2 text-xs"><p>{note.body}</p><p className="mt-1 text-[10px] text-muted-foreground">{note.authorName} · {formatRelative(note.occurredAt)}</p></div>)}
            <textarea aria-label="Conversation internal note" value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder="Add a private conversation note…" className="min-h-16 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs" />
            <div className="flex justify-end"><Button size="sm" disabled={working || !noteBody.trim()} onClick={() => void run(() => onAddInternalNote(noteBody), () => setNoteBody(""))}><MessageSquarePlus className="me-1.5 h-3.5 w-3.5" />Add internal note</Button></div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-3">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold"><ClipboardList className="h-3.5 w-3.5" />Audit trail</h3>
          {detail.auditTrail?.length ? <ol className="mt-2 space-y-2 border-s border-border ps-3 text-[11px] text-muted-foreground">{detail.auditTrail.slice().reverse().map((event) => <li key={event.id}><p className="font-medium text-foreground">{event.actor.name} · {event.action}</p><p>{event.details ? `${event.details} · ` : ""}{formatRelative(event.occurredAt)}</p></li>)}</ol> : <p className="mt-2 text-xs text-muted-foreground">No operational events yet.</p>}
        </section>
      </div>
    </div>
  );
}

export function ConversationOperationsPanel(props: ConversationOperationsPanelProps) {
  const desktop = useDesktopLayout();
  if (desktop) {
    return (
      <aside className={cn("w-[480px] shrink-0 flex-col border-s border-border bg-card xl:w-[min(40vw,560px)]", props.open ? "flex" : "hidden")} aria-label="Conversation Operations" aria-hidden={!props.open}>
        <OperationsBody {...props} />
      </aside>
    );
  }
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent forceMount side="right" className="flex w-full max-w-none flex-col p-0 sm:w-[min(92vw,480px)]">
        <SheetHeader className="sr-only"><SheetTitle>Conversation Operations drawer</SheetTitle><SheetDescription>Conversation status, ownership, collaboration and internal notes.</SheetDescription></SheetHeader>
        <OperationsBody {...props} />
      </SheetContent>
    </Sheet>
  );
}
