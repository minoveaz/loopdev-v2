import { DataCard, StatusBadge, type StatusTone } from "@/components/common";
import { UserProfileLayout } from "./_layout";
import { useLocalStore } from "@/lib/localStore";
import { projectsStore } from "@/data";
import { Progress } from "@/components/ui/progress";

export default function UserProfileProjects() {
  const projects = useLocalStore(projectsStore);
  return (
    <UserProfileLayout title="Projects" description="Projects you're contributing to.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.slice(0, 9).map((p) => {
          const tone: StatusTone =
            p.status === "in_progress" ? "info" :
            p.status === "completed" ? "success" :
            p.status === "on_hold" ? "warning" :
            p.status === "cancelled" ? "destructive" : "neutral";
          return (
            <DataCard key={p.id} title={p.name} description={p.client}>
              <div className="flex items-center justify-between">
                <StatusBadge tone={tone} dot>{p.status.replace("_", " ")}</StatusBadge>
                <span className="font-mono text-xs text-muted-foreground">{p.progress}%</span>
              </div>
              <Progress value={p.progress} className="mt-3" />
            </DataCard>
          );
        })}
      </div>
    </UserProfileLayout>
  );
}