import { Check, Sparkles } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { subscriptionPlansStore } from "@/data";
import { summarizePlans } from "@/features/subscription/shared";
import { formatNumber } from "@/lib/formatters";

const FEATURES = ["Up to 5 users","Up to 25 users","Unlimited users","SSO/SAML","Community support","Email support","Priority support","Dedicated CSM","1 GB storage","25 GB storage","200 GB storage","Custom limits","Automation","Audit log","99.99% SLA"];

export default function SubscriptionPlans() {
  const { trail } = useBreadcrumbs();
  const plans = useLocalStore(subscriptionPlansStore);
  const s = summarizePlans(plans);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Subscription"
        title="Pricing plans"
        description="Compare tiers and track plan adoption."
        breadcrumbs={trail.length ? trail : [{ label: "Subscription" }, { label: "Plans" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Plans" value={String(s.plans)} delta={0} icon={Sparkles} accent="primary" />
        <StatCard label="Subscribers" value={formatNumber(s.subs)} delta={4.6} icon={Sparkles} accent="info" />
        <StatCard label="MRR" value={`$${s.mrr.toLocaleString()}`} delta={6.4} icon={Sparkles} accent="accent" />
        <StatCard label="ARPU" value={`$${s.arpu}`} delta={1.1} icon={Sparkles} accent="gold" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => (
          <article key={p.id} className={`relative flex flex-col rounded-xl border p-5 ${p.isPopular ? "border-primary/60 bg-primary/5 shadow-sm" : "border-border bg-card-muted/30"}`}>
            {p.isPopular && (
              <span className="absolute -top-2 right-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">Popular</span>
            )}
            <h3 className="text-base font-semibold">{p.name}</h3>
            <p className="mt-1 min-h-[36px] text-xs text-muted-foreground">{p.description}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">${p.price}</span>
              <span className="text-xs text-muted-foreground">/{p.interval}</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 text-success" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">{p.activeSubscribers.toLocaleString()} subscribers</span>
              <Button size="sm" variant={p.isPopular ? "default" : "outline"}>Choose</Button>
            </div>
          </article>
        ))}
      </div>

      <DataCard title="Plan comparison" description="Feature matrix">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                {plans.map((p) => (
                  <TableHead key={p.id} className="text-center">{p.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {FEATURES.map((feat) => (
                <TableRow key={feat}>
                  <TableCell className="font-medium">{feat}</TableCell>
                  {plans.map((p) => (
                    <TableCell key={p.id} className="text-center">
                      {p.features.includes(feat) ? (
                        <Check className="mx-auto h-4 w-4 text-success" />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-medium">Status</TableCell>
                {plans.map((p) => (
                  <TableCell key={p.id} className="text-center">
                    <StatusBadge tone={p.isPopular ? "success" : "neutral"}>{p.isPopular ? "Featured" : "Standard"}</StatusBadge>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DataCard>
    </PageContainer>
  );
}