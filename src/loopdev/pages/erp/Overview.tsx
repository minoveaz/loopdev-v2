import { Boxes, FolderKanban, Package, Plus, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { DataCard, EmptyState, PageContainer, PageHeader, StatCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { localCatalogAdapter } from "@/loopdev/domains/catalog/adapter";
import { LOCAL_CATALOG_ORGANIZATION_ID } from "@/loopdev/domains/catalog/data/localCatalog";
import { useEffect, useState } from "react";
import type { OrganizationCatalog } from "@/loopdev/domains/catalog";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

export default function ERPOverview() {
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
        title="ERP Overview"
        description="A shared operational foundation for products, services, sales and future business modules."
        breadcrumbs={trail.length ? trail : [{ label: "ERP" }, { label: "Overview" }]}
        actions={<Button asChild><Link to="/app/erp/product-catalog"><Plus className="me-2 h-4 w-4" />Manage catalogs</Link></Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Catalogs" value={String(catalogs.length)} hint="company catalogs" icon={Boxes} accent="primary" />
        <StatCard label="Product catalogs" value={String(products)} hint="physical, digital and packaged" icon={Package} accent="info" />
        <StatCard label="Service catalogs" value={String(services)} hint="professional and recurring" icon={Wrench} accent="gold" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DataCard title="ERP foundation" description="The initial suite surface is local-first and ready to grow into orders, billing and inventory.">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Products is the shared master data layer. CRM and Communications consume references instead of copying catalog records.</p>
            <Link className="inline-flex items-center gap-2 font-medium text-primary hover:underline" to="/app/erp/product-catalog">Open Product Catalog <FolderKanban className="h-4 w-4" /></Link>
          </div>
        </DataCard>
        <DataCard title="Catalog readiness" description="Current local workspace">
          {catalogs.length ? (
            <ul className="space-y-2 text-sm">
              {catalogs.map((catalog) => <li key={catalog.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2"><span className="font-medium">{catalog.name}</span><span className="text-xs text-muted-foreground">{catalog.kind}</span></li>)}
            </ul>
          ) : <EmptyState title="No catalogs yet" description="Create the first company catalog from Product Catalog." />}
        </DataCard>
      </div>
    </PageContainer>
  );
}
