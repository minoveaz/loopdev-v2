import { Boxes, FolderKanban, Package, Plus, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { DataCard, EmptyState, PageContainer, PageHeader, StatCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { localCatalogAdapter } from "@/loopdev/domains/catalog/adapter";
import { LOCAL_CATALOG_ORGANIZATION_ID } from "@/loopdev/domains/catalog/data/localCatalog";
import { useEffect, useState } from "react";
import type { OrganizationCatalog } from "@/loopdev/domains/catalog";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useT } from "@/i18n";

export default function ERPOverview() {
  const t = useT();
  const { trail } = useBreadcrumbs();
  const [catalogs, setCatalogs] = useState<OrganizationCatalog[]>([]);

  useEffect(() => {
    void localCatalogAdapter.listCatalogs({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID }).then(setCatalogs);
  }, []);

  const products = catalogs.filter((catalog) => catalog.kind === "products").length;
  const services = catalogs.filter((catalog) => catalog.kind === "services").length;

  return (
    <PageContainer width="wide">
      <PageHeader
        title={t("common.loopdev.erp.title")}
        description={t("common.loopdev.erp.description")}
        breadcrumbs={trail.length ? trail : [{ label: "ERP" }, { label: "Overview" }]}
        actions={<Button asChild><Link to="/app/erp/product-catalog"><Plus className="me-2 h-4 w-4" />{t("common.loopdev.erp.manageCatalogs")}</Link></Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t("common.loopdev.erp.catalogs")} value={String(catalogs.length)} hint={t("common.loopdev.erp.companyCatalogs")} icon={Boxes} accent="primary" />
        <StatCard label={t("common.loopdev.erp.productCatalogs")} value={String(products)} hint="physical, digital and packaged" icon={Package} accent="info" />
        <StatCard label={t("common.loopdev.erp.serviceCatalogs")} value={String(services)} hint="professional and recurring" icon={Wrench} accent="gold" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DataCard title={t("common.loopdev.erp.foundation")} description={t("common.loopdev.erp.foundationDescription")}>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t("common.loopdev.erp.productsLayer")}</p>
            <Link className="inline-flex items-center gap-2 font-medium text-primary hover:underline" to="/app/erp/product-catalog">{t("common.loopdev.erp.openProductCatalog")} <FolderKanban className="h-4 w-4" /></Link>
          </div>
        </DataCard>
        <DataCard title={t("common.loopdev.erp.readiness")} description={t("common.loopdev.erp.currentWorkspace")}>
          {catalogs.length ? (
            <ul className="space-y-2 text-sm">
              {catalogs.map((catalog) => <li key={catalog.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2"><span className="font-medium">{catalog.name}</span><span className="text-xs text-muted-foreground">{catalog.kind}</span></li>)}
            </ul>
          ) : <EmptyState title={t("common.loopdev.erp.none")} description={t("common.loopdev.erp.createFirst")} />}
        </DataCard>
      </div>
    </PageContainer>
  );
}
