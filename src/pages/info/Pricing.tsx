import { Check, Sparkles } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PLANS = [
  { name: "Starter", monthly: 0, yearly: 0, desc: "For small teams getting started.", features: ["Up to 3 seats", "Mock data layer", "All UI components", "Community support"] },
  { name: "Growth", monthly: 29, yearly: 290, desc: "Most popular for growing teams.", featured: true, features: ["Unlimited seats", "All modules unlocked", "Priority support", "Custom themes"] },
  { name: "Scale", monthly: 99, yearly: 990, desc: "For organizations.", features: ["SSO & SAML", "Audit logs", "Dedicated success manager", "SLA & uptime guarantees"] },
];

export default function PricingPage() {
  const { trail } = useBreadcrumbs();
  const [yearly, setYearly] = useState(true);
  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Pages"
        title="Simple, transparent pricing"
        description="Pick a plan that scales with your team. Cancel anytime."
        breadcrumbs={trail.length ? trail : [{ label: "Pages" }, { label: "Pricing" }]}
      />
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-border bg-card p-1 text-sm">
          <button onClick={() => setYearly(false)} className={cn("rounded-full px-4 py-1.5 transition-fast", !yearly && "bg-primary text-primary-foreground")}>Monthly</button>
          <button onClick={() => setYearly(true)} className={cn("rounded-full px-4 py-1.5 transition-fast", yearly && "bg-primary text-primary-foreground")}>Yearly <span className="ml-1 text-[10px] opacity-80">−17%</span></button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => (
          <DataCard key={p.name} className={cn(p.featured && "ring-2 ring-primary")}> 
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              {p.featured && <StatusBadge tone="primary" icon={<Sparkles className="h-3 w-3" />}>Most popular</StatusBadge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            <p className="mt-4 font-display text-4xl font-semibold">${yearly ? Math.round(p.yearly / 12) : p.monthly}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <p className="text-xs text-muted-foreground">{yearly ? `Billed $${p.yearly}/yr` : "Billed monthly"}</p>
            <Button onClick={() => toast.success(`${p.name} selected`)} className="mt-4 w-full" variant={p.featured ? "default" : "outline"}>Choose {p.name}</Button>
            <ul className="mt-5 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-success" /><span>{f}</span></li>
              ))}
            </ul>
          </DataCard>
        ))}
      </div>
    </PageContainer>
  );
}