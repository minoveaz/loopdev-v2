import { DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { dealsStore, listingsStore, agentsStore } from "@/template/rivera/data";
import { dealStageLabel, dealStageTone, formatPrice, STAGES } from "@/template/rivera/features/realestate/shared";

export default function RealEstateDeals() {
  const { trail } = useBreadcrumbs();
  const deals = useLocalStore(dealsStore);
  const listings = useLocalStore(listingsStore);
  const agents = useLocalStore(agentsStore);

  const listingTitle = (id: string) => listings.find((l) => l.id === id)?.title ?? "—";
  const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? "—";

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Real Estate"
        title="Deal pipeline"
        description="Track every opportunity from first contact to close."
        breadcrumbs={trail.length ? trail : [{ label: "Real Estate" }, { label: "Deals" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {STAGES.map((stage) => {
          const items = deals.filter((d) => d.stage === stage);
          const total = items.reduce((s, d) => s + d.amount, 0);
          return (
            <DataCard key={stage} title={dealStageLabel[stage]} description={`${items.length} · ${formatPrice(total)}`}>
              <ul className="space-y-3">
                {items.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">No deals</li>
                ) : items.map((d) => (
                  <li key={d.id} className="surface-card-muted-compact p-3">
                    <p className="truncate text-sm font-medium">{d.client}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{listingTitle(d.listingId)}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold">{formatPrice(d.amount, d.currency)}</span>
                      <span className="text-[10px] text-muted-foreground">{agentName(d.agentId).split(" ")[0]}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </DataCard>
          );
        })}
      </div>
    </PageContainer>
  );
}