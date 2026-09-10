import { Link } from "react-router-dom";
import { ArrowRight, Bot, Database, Settings2, SlidersHorizontal, Tags } from "lucide-react";
import { PageContainer, PageHeader, SurfaceCard, SurfaceCardBody, SurfaceCardHeader } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

const settingsAreas = [
  {
    title: "CRM configuration",
    description: "Manage the shared configuration used by the CRM workspace.",
    icon: SlidersHorizontal,
    items: [
      { label: "Tags", description: "Create and govern reusable CRM tags.", to: "/app/settings/crm/operations?tab=tags", icon: Tags },
      { label: "Custom fields", description: "Define typed fields for CRM records.", to: "/app/settings/crm/operations?tab=fields", icon: Settings2 },
      { label: "Automations", description: "Configure event triggers and actions.", to: "/app/settings/crm/automations", icon: Bot },
    ],
  },
  {
    title: "Data management",
    description: "Import and export CRM data with validation and deduplication.",
    icon: Database,
    items: [
      { label: "Import / export", description: "Manage local CRM data operations.", to: "/app/settings/data/operations?tab=import", icon: Database },
    ],
  },
];

export default function Settings() {
  const { trail } = useBreadcrumbs();

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Settings"
        description="Configure LoopDev for your organization and workspaces."
        breadcrumbs={trail.length ? trail : [{ label: "Settings" }]}
      />
      <div className="space-y-6">
        {settingsAreas.map((area) => (
          <SurfaceCard key={area.title}>
            <SurfaceCardHeader title={area.title} description={area.description} icon={area.icon} />
            <SurfaceCardBody className="grid gap-3 md:grid-cols-2">
              {area.items.map((item) => (
                <Link key={item.to} to={item.to} className="group rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-card-muted/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <item.icon className="mt-0.5 h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      <div>
                        <h3 className="font-medium">{item.label}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </SurfaceCardBody>
          </SurfaceCard>
        ))}
      </div>
    </PageContainer>
  );
}
