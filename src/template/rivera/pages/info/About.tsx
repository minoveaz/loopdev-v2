import { Award, Globe, Heart, Users } from "lucide-react";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

const STATS = [
  { icon: Users, label: "Customers", value: "12,400+" },
  { icon: Globe, label: "Countries", value: "78" },
  { icon: Award, label: "Awards", value: "23" },
  { icon: Heart, label: "NPS", value: "72" },
];

const TEAM = [
  { name: "Aria Bennet", role: "Founder & CEO", initials: "AB" },
  { name: "Theo Mendes", role: "Head of Design", initials: "TM" },
  { name: "Indira Vale", role: "Engineering Lead", initials: "IV" },
  { name: "Kenji Watanabe", role: "Product", initials: "KW" },
];

export default function AboutPage() {
  const { trail } = useBreadcrumbs();
  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Pages"
        title="About Rivera"
        description="We build admin experiences worth coming back to."
        breadcrumbs={trail.length ? trail : [{ label: "Pages" }, { label: "About" }]}
      />
      <DataCard>
        <p className="text-sm text-foreground leading-relaxed">Rivera is a thoughtful admin scaffold designed for teams who care about craft. We obsess over typography, motion, and information density so you can ship interfaces your users will love.</p>
      </DataCard>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <DataCard key={s.label}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><s.icon className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-3xl font-semibold">{s.value}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
          </DataCard>
        ))}
      </div>
      <DataCard title="Leadership" description="The people behind Rivera">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m) => (
            <div key={m.name} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground font-semibold">{m.initials}</div>
              <p className="mt-3 font-medium">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.role}</p>
            </div>
          ))}
        </div>
      </DataCard>
    </PageContainer>
  );
}