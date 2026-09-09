import { Mail, MousePointerClick, Tag, Users, Zap, Clock, GitBranch, CheckCircle2 } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

const journeys = [
  { name: "Welcome series", trigger: "User signup", steps: 5, active: 1240, conv: 18.4, status: "running" as const },
  { name: "Cart abandoned", trigger: "Cart inactive 1h", steps: 3, active: 312, conv: 22.1, status: "running" as const },
  { name: "Win-back", trigger: "No purchase 60d", steps: 4, active: 88, conv: 6.7, status: "paused" as const },
  { name: "Post-purchase", trigger: "Order completed", steps: 6, active: 540, conv: 11.2, status: "running" as const },
];

const stepIcons = [Users, Mail, Clock, GitBranch, MousePointerClick, Tag, CheckCircle2];

export default function MarketingAutomation() {
  const { trail } = useBreadcrumbs();

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Marketing"
        title="Automation"
        description="Pre-built journeys triggered by user behavior."
        breadcrumbs={trail.length ? trail : [{ label: "Marketing" }, { label: "Automation" }]}
        actions={<Button><Zap className="h-4 w-4" />New journey</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {journeys.map((j) => (
          <DataCard key={j.name} title={j.name} description={`Trigger: ${j.trigger}`}
            action={<StatusBadge tone={j.status === "running" ? "success" : "warning"}>{j.status}</StatusBadge>}>
            <div className="mb-4 flex items-center justify-between gap-3 overflow-x-auto">
              {Array.from({ length: j.steps }).map((_, i) => {
                const Icon = stepIcons[i % stepIcons.length];
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center surface-card-muted-compact text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    {i < j.steps - 1 && <div className="h-px w-6 bg-border" />}
                  </div>
                );
              })}
            </div>
            <dl className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-center">
              <Stat label="Steps" value={j.steps} />
              <Stat label="Active" value={j.active.toLocaleString()} />
              <Stat label="Conv." value={`${j.conv}%`} />
            </dl>
          </DataCard>
        ))}
      </div>
    </PageContainer>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono font-semibold">{value}</dd>
    </div>
  );
}