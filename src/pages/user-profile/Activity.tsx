import { DataCard, StatusBadge, type StatusTone } from "@/components/common";
import { UserProfileLayout } from "./_layout";
import { useLocalStore } from "@/lib/localStore";
import { activityStore, mockUsers } from "@/data";
import { formatRelative, getInitials, titleCase } from "@/lib/formatters";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { severityForAction, severityTone } from "@/features/reports/shared";

export default function UserProfileActivity() {
  const logs = useLocalStore(activityStore);
  const usersById = new Map(mockUsers.map((u) => [u.id, u] as const));
  return (
    <UserProfileLayout title="Activity" description="Latest actions across the workspace.">
      <DataCard title="Recent activity">
        <ol className="space-y-4">
          {logs.slice(0, 12).map((log) => {
            const actor = usersById.get(log.actorId);
            const tone: StatusTone = severityTone[severityForAction(log.action)];
            return (
              <li key={log.id} className="flex gap-3">
                <Avatar className="h-8 w-8 border border-border"><AvatarFallback className="bg-primary-soft text-[11px] text-primary">{getInitials(actor?.name ?? "·")}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{actor?.name ?? "Unknown"}</span>
                    <StatusBadge tone={tone} dot>{titleCase(log.action)}</StatusBadge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{log.summary}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">{formatRelative(log.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </DataCard>
    </UserProfileLayout>
  );
}