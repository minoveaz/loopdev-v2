import { Link } from "react-router-dom";
import { ArrowRight, Bot, Database, MessageCircle, Settings2, ShieldCheck, SlidersHorizontal, Tags } from "lucide-react";
import { PageContainer, PageHeader, SurfaceCard, SurfaceCardBody, SurfaceCardHeader } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useT } from "@/i18n";

const settingsAreas = [
  {
    titleKey: "settings.crmTitle",
    descriptionKey: "settings.crmDescription",
    icon: SlidersHorizontal,
    items: [
      { labelKey: "settings.tags", descriptionKey: "settings.tagsDescription", to: "/app/settings/crm/operations?tab=tags", icon: Tags },
      { labelKey: "settings.customFields", descriptionKey: "settings.customFieldsDescription", to: "/app/settings/crm/operations?tab=fields", icon: Settings2 },
      { labelKey: "settings.automations", descriptionKey: "settings.automationsDescription", to: "/app/settings/crm/automations", icon: Bot },
    ],
  },
  {
    titleKey: "settings.communicationsTitle",
    descriptionKey: "settings.communicationsDescription",
    icon: MessageCircle,
    items: [
      { labelKey: "settings.communications", descriptionKey: "settings.communicationsDescriptionShort", to: "/app/settings/communications", icon: MessageCircle },
    ],
  },
  {
    titleKey: "settings.dataTitle",
    descriptionKey: "settings.dataDescription",
    icon: Database,
    items: [
      { labelKey: "settings.importExport", descriptionKey: "settings.importExportDescription", to: "/app/settings/data/operations?tab=import", icon: Database },
      { labelKey: "settings.documentRetention", descriptionKey: "settings.documentRetentionDescription", to: "/app/settings/document-retention", icon: ShieldCheck },
    ],
  },
];

export default function Settings() {
  const { trail } = useBreadcrumbs();
  const t = useT();

  return (
    <PageContainer width="wide">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
        breadcrumbs={trail.length ? trail : [{ label: t("settings.title") }]}
      />
      <div className="space-y-6">
        {settingsAreas.map((area) => (
          <SurfaceCard key={area.titleKey}>
            <SurfaceCardHeader title={t(area.titleKey)} description={t(area.descriptionKey)} icon={area.icon} />
            <SurfaceCardBody className="grid gap-3 md:grid-cols-2">
              {area.items.map((item) => (
                <Link key={item.to} to={item.to} className="group rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-card-muted/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <item.icon className="mt-0.5 h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      <div>
                        <h3 className="font-medium">{t(item.labelKey)}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{t(item.descriptionKey)}</p>
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
