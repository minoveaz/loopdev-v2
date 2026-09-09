import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock, Copy, Plus, Trash2, Video, Users as UsersIcon,
} from "lucide-react";
import { ConfirmDialog, DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { meetingsStore, usersStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatDateTime, getInitials } from "@/lib/formatters";
import type { Meeting, MeetingStatus } from "@/types";

const STATUS_TONE: Record<MeetingStatus, "info" | "success" | "warning" | "neutral" | "destructive"> = {
  scheduled: "info", in_progress: "warning", completed: "success", cancelled: "destructive",
};

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "meeting";
}

export default function MeetingPage() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const meetings = useLocalStore(meetingsStore);
  const users = useLocalStore(usersStore);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Meeting | null>(null);
  const [draft, setDraft] = useState({
    title: "", description: "", hostId: "", participants: [] as string[],
    date: new Date().toISOString().slice(0, 10), time: "10:00", duration: 30, tag: "Internal",
  });

  useEffect(() => {
    if (open) setDraft((d) => ({ ...d, hostId: users[0]?.id ?? "" }));
  }, [open, users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return meetings
      .filter((m) => !q || m.title.toLowerCase().includes(q))
      .filter((m) => !statusF.length || statusF.includes(m.status))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [meetings, search, statusF]);

  const upcoming = filtered.filter((m) => m.status === "scheduled" && new Date(m.startsAt) >= new Date());

  const stats = useMemo(() => ({
    total: meetings.length,
    upcoming: meetings.filter((m) => m.status === "scheduled" && new Date(m.startsAt) >= new Date()).length,
    completed: meetings.filter((m) => m.status === "completed").length,
    hours: Math.round(meetings.reduce((s, m) => s + m.durationMinutes, 0) / 60),
  }), [meetings]);

  const create = () => {
    if (!draft.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    const startsAt = new Date(`${draft.date}T${draft.time}:00`).toISOString();
    meetingsStore.create({
      title: draft.title, description: draft.description,
      hostId: draft.hostId, participants: draft.participants,
      startsAt, durationMinutes: draft.duration,
      link: `https://meet.rivera.app/${slug(draft.title)}`,
      status: "scheduled", tag: draft.tag,
    });
    setOpen(false);
    setDraft({ title: "", description: "", hostId: users[0]?.id ?? "", participants: [], date: new Date().toISOString().slice(0, 10), time: "10:00", duration: 30, tag: "Internal" });
    toast({ title: "Meeting scheduled" });
  };

  const copyLink = (link: string) => {
    navigator.clipboard?.writeText(link);
    toast({ title: "Link copied", description: link });
  };

  const toggleParticipant = (id: string) => setDraft((d) => ({
    ...d,
    participants: d.participants.includes(id) ? d.participants.filter((x) => x !== id) : [...d.participants, id],
  }));

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Applications"
        title="Meetings"
        description="Schedule and join calls with your team and clients."
        breadcrumbs={trail}
        actions={
          <Button onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Schedule meeting
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total" value={String(stats.total)} icon={CalendarClock} accent="primary" compact />
        <StatCard label="Upcoming" value={String(stats.upcoming)} accent="info" compact />
        <StatCard label="Completed" value={String(stats.completed)} accent="success" compact />
        <StatCard label="Hours scheduled" value={`${stats.hours}h`} accent="gold" compact />
      </div>

      <DataCard title="Upcoming">
        {upcoming.length === 0 ? <EmptyState icon={CalendarClock} title="Nothing on the calendar" /> : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.slice(0, 6).map((m) => {
              const host = userMap.get(m.hostId);
              return (
                <div key={m.id} className="surface-card-interactive p-4">
                  <div className="flex items-center justify-between">
                    <StatusBadge tone="info">{m.tag}</StatusBadge>
                    <span className="text-xs text-muted-foreground">{m.durationMinutes}m</span>
                  </div>
                  <p className="mt-3 line-clamp-1 font-medium">{m.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.description}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="h-3 w-3" /> {formatDateTime(m.startsAt)}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[host, ...m.participants.map((id) => userMap.get(id))].filter(Boolean).slice(0, 4).map((u) => (
                        <Avatar key={u!.id} className="h-7 w-7 border-2 border-card"><AvatarFallback className="text-[10px]">{getInitials(u!.name)}</AvatarFallback></Avatar>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(m.link)} title="Copy link"><Copy className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="outline" className="gap-1.5" asChild><a href={m.link} target="_blank" rel="noreferrer"><Video className="h-3 w-3" />Join</a></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DataCard>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search meetings…" size="sm" containerClassName="w-60" />
        <FilterDropdown label="Status" multiple value={statusF} onChange={setStatusF} options={[
          { value: "scheduled", label: "Scheduled" }, { value: "completed", label: "Completed" },
          { value: "in_progress", label: "In progress" }, { value: "cancelled", label: "Cancelled" },
        ]} size="sm" align="end" />
      </div>

      <DataCard flush>
        {filtered.length === 0 ? <EmptyState icon={CalendarClock} title="No meetings" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => {
                const host = userMap.get(m.hostId);
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium">{m.title}</div>
                      <div className="text-xs text-muted-foreground">{m.tag} · {m.durationMinutes}m</div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDateTime(m.startsAt)}</TableCell>
                    <TableCell className="text-sm">{host?.name ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex -space-x-2">
                        {m.participants.slice(0, 4).map((id) => {
                          const u = userMap.get(id); if (!u) return null;
                          return <Avatar key={u.id} className="h-6 w-6 border-2 border-card"><AvatarFallback className="text-[9px]">{getInitials(u.name)}</AvatarFallback></Avatar>;
                        })}
                        {m.participants.length > 4 && <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px]">+{m.participants.length - 4}</span>}
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge tone={STATUS_TONE[m.status]}>{m.status.replace("_", " ")}</StatusBadge></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(m.link)}><Copy className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleting(m)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DataCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Schedule meeting</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5"><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Description</Label><Textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5"><Label>Date</Label><Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Time</Label><Input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Minutes</Label><Input type="number" min={15} step={15} value={draft.duration} onChange={(e) => setDraft({ ...draft, duration: Number(e.target.value) })} /></div>
            </div>
            <div className="grid gap-1.5"><Label>Tag</Label><Input value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })} /></div>
            <div className="grid gap-1.5">
              <Label>Participants</Label>
              <div className="flex flex-wrap gap-2 rounded-lg border border-border p-2">
                {users.map((u) => {
                  const active = draft.participants.includes(u.id);
                  return (
                    <button key={u.id} type="button" onClick={() => toggleParticipant(u.id)}
                      className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition ${active ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
                      <UsersIcon className="h-3 w-3" />{u.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Cancel meeting?"
        description={deleting ? `${deleting.title} will be removed.` : ""}
        confirmLabel="Delete"
        tone="destructive"
        onConfirm={() => { if (deleting) { meetingsStore.remove(deleting.id); setDeleting(null); } }}
      />
    </PageContainer>
  );
}