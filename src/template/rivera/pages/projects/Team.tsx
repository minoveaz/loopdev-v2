import { useMemo } from "react";
import { Mail } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { projectsStore, tasksStore, timeEntriesStore, usersStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { getInitials } from "@/lib/formatters";

export default function Team() {
  const { trail } = useBreadcrumbs();
  const users = useLocalStore(usersStore);
  const projects = useLocalStore(projectsStore);
  const tasks = useLocalStore(tasksStore);
  const time = useLocalStore(timeEntriesStore);

  const team = useMemo(() => users.map((u) => {
    const projectIds = projects.filter((p) => p.ownerId === u.id || p.memberIds.includes(u.id)).map((p) => p.id);
    const open = tasks.filter((t) => t.assigneeId === u.id && t.status !== "done").length;
    const hours = time.filter((t) => t.userId === u.id).reduce((s, t) => s + t.hours, 0);
    return { user: u, projectsCount: projectIds.length, open, hours };
  }), [users, projects, tasks, time]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Projects"
        title="Team"
        description="Members involved across project delivery."
        breadcrumbs={trail}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {team.map(({ user, projectsCount, open, hours }) => (
          <div key={user.id} className="group surface-card-interactive p-5">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-border">
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.title ?? "—"}</p>
              </div>
              <StatusBadge tone={user.status === "active" ? "success" : user.status === "pending" ? "warning" : "neutral"}>{user.status}</StatusBadge>
            </div>
            <a href={`mailto:${user.email}`} className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Mail className="h-3 w-3" /> {user.email}
            </a>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center text-xs">
              <div>
                <div className="font-semibold text-foreground">{projectsCount}</div>
                <div className="text-muted-foreground">Projects</div>
              </div>
              <div>
                <div className="font-semibold text-foreground">{open}</div>
                <div className="text-muted-foreground">Open</div>
              </div>
              <div>
                <div className="font-semibold text-foreground">{hours.toFixed(0)}h</div>
                <div className="text-muted-foreground">Logged</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DataCard title="Project ownership">
        <ul className="divide-y divide-border">
          {projects.map((p) => {
            const owner = users.find((u) => u.id === p.ownerId);
            const members = p.memberIds.map((id) => users.find((u) => u.id === id)).filter(Boolean);
            return (
              <li key={p.id} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">Owner: {owner?.name ?? "—"}</p>
                </div>
                <div className="flex -space-x-2">
                  {members.slice(0, 5).map((m) => (
                    <Avatar key={m!.id} className="h-7 w-7 border-2 border-card">
                      <AvatarFallback className="text-[10px]">{getInitials(m!.name)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {members.length > 5 && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px]">+{members.length - 5}</span>
                  )}
                  {members.length === 0 && <span className="text-xs text-muted-foreground">No members</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </DataCard>
    </PageContainer>
  );
}