import { Mail, Phone, Star, MapPin } from "lucide-react";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { agentsStore, dealsStore } from "@/template/rivera/data";
import { formatPrice } from "@/template/rivera/features/realestate/shared";

export default function RealEstateAgents() {
  const { trail } = useBreadcrumbs();
  const agents = useLocalStore(agentsStore);
  const deals = useLocalStore(dealsStore);

  const performance = (agentId: string) => {
    const won = deals.filter((d) => d.agentId === agentId && d.stage === "closed_won");
    return { count: won.length, revenue: won.reduce((s, d) => s + d.amount, 0) };
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Real Estate"
        title="Agents"
        description="Directory and performance overview."
        breadcrumbs={trail.length ? trail : [{ label: "Real Estate" }, { label: "Agents" }]}
      />

      <DataCard title="Top performers" description="Closed-won revenue this quarter">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((a) => {
            const perf = performance(a.id);
            const initials = a.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
            return (
              <div key={a.id} className="surface-card p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12"><AvatarFallback>{initials}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{a.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{a.region}</p>
                  </div>
                  <span className="flex items-center gap-1 rounded-md bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
                    <Star className="h-3 w-3 fill-current" />{a.rating.toFixed(1)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Listings" value={a.listingsCount} />
                  <Stat label="Won" value={perf.count} />
                  <Stat label="Revenue" value={formatPrice(perf.revenue)} small />
                </div>
                <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{a.email}</p>
                  <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{a.phone}</p>
                </div>
              </div>
            );
          })}
        </div>
      </DataCard>
    </PageContainer>
  );
}

function Stat({ label, value, small }: { label: string; value: number | string; small?: boolean }) {
  return (
    <div className="rounded-lg bg-card-muted/50 p-2">
      <p className={`font-mono font-semibold ${small ? "text-xs" : "text-sm"}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}