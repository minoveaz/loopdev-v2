import { DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { HelpdeskNav } from "@/components/helpdesk/HelpdeskNav";

const ENTRIES = [
  {
    version: "1.0.0", date: "May 6, 2026", tone: "primary" as const, label: "Latest",
    items: [
      { kind: "added", text: "Theme customizer with chart curve presets and cross-tab sync." },
      { kind: "added", text: "Helpdesk module with tickets, support, and changelog." },
      { kind: "added", text: "Real estate, logistics, and academy modules." },
      { kind: "added", text: "Initial scaffold: dashboards, eCommerce, projects." },
      { kind: "improved", text: "Reset-to-defaults flow on Appearance and Theme Customizer." },
      { kind: "improved", text: "Dashboard skeletons + simulated load timings." },
      { kind: "fixed", text: "Footer overflow on small screens." },
    ],
  },
];

const kindTone: Record<string, "success" | "info" | "warning"> = {
  added: "success",
  improved: "info",
  fixed: "warning",
};

export default function HelpdeskChangelog() {
  const { trail } = useBreadcrumbs();
  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Helpdesk"
        title="Changelog"
        description="What's new, improved, and fixed across Rivera."
        breadcrumbs={trail.length ? trail : [{ label: "Helpdesk" }, { label: "Changelog" }]}
      />
      <HelpdeskNav />
      <ol className="relative space-y-6 border-l border-border pl-6">
        {ENTRIES.map((e) => (
          <li key={e.version} className="relative">
            <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
            <DataCard>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-semibold">v{e.version}</h3>
                <StatusBadge tone={e.tone}>{e.label}</StatusBadge>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{e.date}</span>
              </div>
              <ul className="mt-3 space-y-2">
                {e.items.map((it, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <StatusBadge tone={kindTone[it.kind]} className="capitalize">{it.kind}</StatusBadge>
                    <span className="text-foreground">{it.text}</span>
                  </li>
                ))}
              </ul>
            </DataCard>
          </li>
        ))}
      </ol>
    </PageContainer>
  );
}